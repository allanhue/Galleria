package handlers

import (
	"encoding/json"
	"fmt"
	"html"
	"log"
	"math"
	"net/http"
	"reflect"
	"server/db"
	"server/models"
	"server/services"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	generalTicket   = "general"
	vipTicket       = "vip"
	flashSaleTicket = "flash_sale"
)

func normalizeTicketType(ticketType string) (string, error) {
	ticketType = strings.ToLower(strings.TrimSpace(ticketType))
	if ticketType == "" {
		ticketType = generalTicket
	}
	switch ticketType {
	case generalTicket, vipTicket, flashSaleTicket:
		return ticketType, nil
	default:
		return "", fmt.Errorf("Invalid ticket type")
	}
}

func ticketTypeName(ticketType string) string {
	switch ticketType {
	case vipTicket:
		return "VIP"
	case flashSaleTicket:
		return "Flash sale"
	default:
		return "General admission"
	}
}

func isFlashSaleActive(event models.Event, now time.Time) bool {
	return event.FlashSaleCapacity > 0 &&
		event.FlashSalePrice > 0 &&
		event.FlashSaleStartsAt != nil &&
		event.FlashSaleEndsAt != nil &&
		!now.Before(*event.FlashSaleStartsAt) &&
		now.Before(*event.FlashSaleEndsAt)
}

func priceForTicket(event models.Event, ticketType string, now time.Time) (int64, error) {
	switch ticketType {
	case generalTicket:
		if event.IsFree {
			return 0, nil
		}
		return event.Price, nil
	case vipTicket:
		if event.VIPCapacity <= 0 || event.VIPPrice <= 0 {
			return 0, fmt.Errorf("VIP tickets are not available")
		}
		return event.VIPPrice, nil
	case flashSaleTicket:
		if !isFlashSaleActive(event, now) {
			return 0, fmt.Errorf("Flash sale tickets are not currently available")
		}
		return event.FlashSalePrice, nil
	default:
		return 0, fmt.Errorf("Invalid ticket type")
	}
}

func validateTicketConfiguration(event models.Event) error {
	if event.Capacity <= 0 {
		return fmt.Errorf("Event capacity must be greater than zero")
	}
	if !event.IsFree && event.Price <= 0 {
		return fmt.Errorf("Paid events need a general ticket price")
	}
	if event.VIPCapacity < 0 || event.FlashSaleCapacity < 0 {
		return fmt.Errorf("Ticket quantities cannot be negative")
	}
	if event.VIPCapacity > 0 && event.VIPPrice <= 0 {
		return fmt.Errorf("VIP tickets need a price greater than zero")
	}
	if event.FlashSaleCapacity > 0 {
		if event.FlashSalePrice <= 0 || event.FlashSaleStartsAt == nil || event.FlashSaleEndsAt == nil {
			return fmt.Errorf("Flash sales need a price, start time, and end time")
		}
		generalPrice := event.Price
		if event.IsFree {
			generalPrice = 0
		}
		if generalPrice <= 0 || event.FlashSalePrice >= generalPrice {
			return fmt.Errorf("Flash sale price must be less than the general ticket price")
		}
		if !event.FlashSaleStartsAt.Before(*event.FlashSaleEndsAt) {
			return fmt.Errorf("Flash sale end time must be after its start time")
		}
	}
	if event.VIPCapacity+event.FlashSaleCapacity > event.Capacity {
		return fmt.Errorf("VIP and flash sale quantities cannot exceed event capacity")
	}
	return nil
}

func parseSaleTime(value *string) (*time.Time, error) {
	if value == nil || strings.TrimSpace(*value) == "" {
		return nil, nil
	}
	parsed, err := time.Parse(time.RFC3339, *value)
	if err != nil {
		return nil, fmt.Errorf("Sale times must be valid ISO-8601 timestamps")
	}
	return &parsed, nil
}

func ticketCount(eventID uint, ticketType string) int64 {
	var count int64
	db.DB.Model(&models.Booking{}).
		Where("event_id = ? AND status = ? AND ticket_type = ?", eventID, "confirmed", ticketType).
		Count(&count)
	return count
}

func GetEventAttendees(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var event models.Event
	if err := db.DB.First(&event, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	if event.OrganizerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the organizer can view attendees"})
		return
	}

	var bookings []models.Booking
	db.DB.Preload("User").Where("event_id = ? AND status = ?", id, "confirmed").
		Order("created_at asc").Find(&bookings)

	c.JSON(http.StatusOK, gin.H{
		"event":      event,
		"attendees":  bookings,
		"total":      len(bookings),
		"capacity":   event.Capacity,
		"percentage": int(float64(len(bookings)) / float64(event.Capacity) * 100),
	})
}

func GetCities(c *gin.Context) {
	var cities []string
	db.DB.Model(&models.Event{}).Distinct().Pluck("city", &cities)
	c.JSON(http.StatusOK, cities)
}

func GetEvent(c *gin.Context) {
	id := c.Param("id")

	var event models.Event
	if err := db.DB.First(&event, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	var bookedCount int64
	db.DB.Model(&models.Booking{}).Where("event_id = ? AND status = ?", id, "confirmed").Count(&bookedCount)
	vipRemaining := int64(event.VIPCapacity) - ticketCount(event.ID, vipTicket)
	flashRemaining := int64(event.FlashSaleCapacity) - ticketCount(event.ID, flashSaleTicket)
	if vipRemaining < 0 {
		vipRemaining = 0
	}
	if flashRemaining < 0 {
		flashRemaining = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"id": event.ID, "title": event.Title, "description": event.Description,
		"date": event.Date, "location": event.Location, "city": event.City,
		"country": event.Country, "category": event.Category, "capacity": event.Capacity,
		"organizer_id": event.OrganizerID, "source": event.Source, "photo_urls": event.PhotoURLs,
		"is_free":         event.IsFree,
		"price":           event.Price,
		"vip_price":       event.VIPPrice,
		"vip_capacity":    event.VIPCapacity,
		"vip_spots_remaining": vipRemaining,
		"flash_sale_price": event.FlashSalePrice,
		"flash_sale_capacity": event.FlashSaleCapacity,
		"flash_sale_spots_remaining": flashRemaining,
		"flash_sale_starts_at": event.FlashSaleStartsAt,
		"flash_sale_ends_at": event.FlashSaleEndsAt,
		"flash_sale_active": isFlashSaleActive(event, time.Now()) && flashRemaining > 0,
		"created_at":      event.CreatedAt,
		"spots_taken":     bookedCount,
		"spots_remaining": int64(event.Capacity) - bookedCount,
		"sold_out":        bookedCount >= int64(event.Capacity),
	})
}

func CreateEvent(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// Check plan limits — fixed query
	var eventCount int64
	db.DB.Model(&models.Event{}).
		Where("organizer_id = ?", userID.(uint)).
		Count(&eventCount)

	// Check if pro
	var plan models.OrganizerPlan
	isPro := false
	if err := db.DB.Where("user_id = ?", userID.(uint)).First(&plan).Error; err == nil {
		isPro = plan.Plan == "pro" && time.Now().Before(plan.CurrentPeriodEnd)
	}

	if !isPro && eventCount >= 3 {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Free plan allows up to 3 events. Upgrade to Pro for unlimited events.",
		})
		return
	}

	var input struct {
		Title       string   `json:"title"       binding:"required"`
		Description string   `json:"description" binding:"required"`
		Date        string   `json:"date"        binding:"required"`
		Location    string   `json:"location"    binding:"required"`
		Category    string   `json:"category"    binding:"required"`
		Capacity    int      `json:"capacity"    binding:"required"`
		PhotoURLs   []string `json:"photo_urls"`
		City        string   `json:"city"`
		Country     string   `json:"country"`
		IsFree      bool     `json:"is_free"`
		Price       int64    `json:"price"`
		VIPPrice    int64    `json:"vip_price"`
		VIPCapacity int      `json:"vip_capacity"`
		FlashSalePrice    int64   `json:"flash_sale_price"`
		FlashSaleCapacity int     `json:"flash_sale_capacity"`
		FlashSaleStartsAt *string `json:"flash_sale_starts_at"`
		FlashSaleEndsAt   *string `json:"flash_sale_ends_at"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	flashSaleStartsAt, err := parseSaleTime(input.FlashSaleStartsAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	flashSaleEndsAt, err := parseSaleTime(input.FlashSaleEndsAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event := models.Event{
		Title:       input.Title,
		Description: input.Description,
		Date:        input.Date,
		Location:    input.Location,
		Category:    input.Category,
		Capacity:    input.Capacity,
		PhotoURLs:   input.PhotoURLs,
		City:        input.City,
		Country:     input.Country,
		Source:      "own",
		OrganizerID: userID.(uint),
		IsFree:      input.IsFree,
		Price:       input.Price,
		VIPPrice:    input.VIPPrice,
		VIPCapacity: input.VIPCapacity,
		FlashSalePrice:    input.FlashSalePrice,
		FlashSaleCapacity: input.FlashSaleCapacity,
		FlashSaleStartsAt: flashSaleStartsAt,
		FlashSaleEndsAt:   flashSaleEndsAt,
	}
	if err := validateTicketConfiguration(event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.DB.Create(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
		return
	}

	c.JSON(http.StatusCreated, event)
}

func BookEvent(c *gin.Context) {
	id := c.Param("id")

	var event models.Event
	if err := db.DB.First(&event, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	var input struct {
		TicketType        string `json:"ticket_type"`
		NotifyEventUpdates bool   `json:"notify_event_updates"`
	}
	if c.Request.ContentLength != 0 {
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}
	ticketType, err := normalizeTicketType(input.TicketType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	price, err := priceForTicket(event, ticketType, time.Now())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if price > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This ticket requires payment"})
		return
	}

	var bookedCount int64
	db.DB.Model(&models.Booking{}).Where("event_id = ? AND status = ?", id, "confirmed").Count(&bookedCount)
	if bookedCount >= int64(event.Capacity) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event is sold out"})
		return
	}
	if ticketType == vipTicket && ticketCount(event.ID, vipTicket) >= int64(event.VIPCapacity) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "VIP tickets are sold out"})
		return
	}
	if ticketType == flashSaleTicket && ticketCount(event.ID, flashSaleTicket) >= int64(event.FlashSaleCapacity) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Flash sale tickets are sold out"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	var existing models.Booking
	if err := db.DB.Where("user_id = ? AND event_id = ?", userID, id).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already booked"})
		return
	}

	booking := models.Booking{
		UserID:  userID.(uint),
		EventID: event.ID,
		Status:  "confirmed",
		TicketType: ticketType,
		NotifyEventUpdates: input.NotifyEventUpdates,
		QRToken: uuid.New().String(),
	}
	if err := db.DB.Create(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to book"})
		return
	}

	var user models.User
	db.DB.First(&user, userID)
	if err := services.SendMail(user.Email, user.Name,
		"Booking Confirmed — "+event.Title,
		fmt.Sprintf(`
			<h1>You're booked!</h1>
			<p>Your %s ticket for <b>%s</b> on %s is confirmed.</p>
			<p>Your check-in code: <b>%s</b></p>
			<p>Show this at the door.</p>
		`, ticketTypeName(ticketType), html.EscapeString(event.Title), html.EscapeString(event.Date), booking.QRToken),
	); err != nil {
		log.Printf("Could not send booking confirmation to attendee %d: %v", booking.UserID, err)
	}

	c.JSON(http.StatusCreated, booking)
}

func UpdateEvent(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var event models.Event
	if err := db.DB.First(&event, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}
	if event.OrganizerID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your event"})
		return
	}

	var input map[string]json.RawMessage
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var values struct {
		Title              *string   `json:"title"`
		Description        *string   `json:"description"`
		Date               *string   `json:"date"`
		Location           *string   `json:"location"`
		City               *string   `json:"city"`
		Country            *string   `json:"country"`
		Category           *string   `json:"category"`
		Capacity           *int      `json:"capacity"`
		PhotoURLs          *[]string `json:"photo_urls"`
		IsFree             *bool     `json:"is_free"`
		Price              *int64    `json:"price"`
		VIPPrice           *int64    `json:"vip_price"`
		VIPCapacity        *int      `json:"vip_capacity"`
		FlashSalePrice     *int64    `json:"flash_sale_price"`
		FlashSaleCapacity  *int      `json:"flash_sale_capacity"`
		FlashSaleStartsAt  *string   `json:"flash_sale_starts_at"`
		FlashSaleEndsAt    *string   `json:"flash_sale_ends_at"`
	}
	body, err := json.Marshal(input)
	if err != nil || json.Unmarshal(body, &values) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event update"})
		return
	}

	candidate := event
	updates := make(map[string]interface{})
	if values.Title != nil {
		candidate.Title = *values.Title
		updates["title"] = *values.Title
	}
	if values.Description != nil {
		candidate.Description = *values.Description
		updates["description"] = *values.Description
	}
	if values.Date != nil {
		candidate.Date = *values.Date
		updates["date"] = *values.Date
	}
	if values.Location != nil {
		candidate.Location = *values.Location
		updates["location"] = *values.Location
	}
	if values.City != nil {
		candidate.City = *values.City
		updates["city"] = *values.City
	}
	if values.Country != nil {
		candidate.Country = *values.Country
		updates["country"] = *values.Country
	}
	if values.Category != nil {
		candidate.Category = *values.Category
		updates["category"] = *values.Category
	}
	if values.Capacity != nil {
		candidate.Capacity = *values.Capacity
		updates["capacity"] = *values.Capacity
	}
	if values.PhotoURLs != nil {
		candidate.PhotoURLs = *values.PhotoURLs
		updates["photo_urls"] = *values.PhotoURLs
	}
	if values.IsFree != nil {
		candidate.IsFree = *values.IsFree
		updates["is_free"] = *values.IsFree
	}
	if values.Price != nil {
		candidate.Price = *values.Price
		updates["price"] = *values.Price
	}
	if values.VIPPrice != nil {
		candidate.VIPPrice = *values.VIPPrice
		updates["vip_price"] = *values.VIPPrice
	}
	if values.VIPCapacity != nil {
		candidate.VIPCapacity = *values.VIPCapacity
		updates["vip_capacity"] = *values.VIPCapacity
	}
	if values.FlashSalePrice != nil {
		candidate.FlashSalePrice = *values.FlashSalePrice
		updates["flash_sale_price"] = *values.FlashSalePrice
	}
	if values.FlashSaleCapacity != nil {
		candidate.FlashSaleCapacity = *values.FlashSaleCapacity
		updates["flash_sale_capacity"] = *values.FlashSaleCapacity
	}
	if _, exists := input["flash_sale_starts_at"]; exists {
		value, err := parseSaleTime(values.FlashSaleStartsAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		candidate.FlashSaleStartsAt = value
		updates["flash_sale_starts_at"] = value
	}
	if _, exists := input["flash_sale_ends_at"]; exists {
		value, err := parseSaleTime(values.FlashSaleEndsAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		candidate.FlashSaleEndsAt = value
		updates["flash_sale_ends_at"] = value
	}
	if err := validateTicketConfiguration(candidate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	before := event
	if err := db.DB.Model(&event).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event"})
		return
	}
	if err := db.DB.First(&event, event.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Event was updated but could not be reloaded"})
		return
	}

	sent, failures := 0, 0
	if !reflect.DeepEqual(before, event) {
		var bookings []models.Booking
		if err := db.DB.Preload("User").
			Where("event_id = ? AND status = ? AND notify_event_updates = ?", event.ID, "confirmed", true).
			Find(&bookings).Error; err != nil {
			log.Printf("Could not load event update subscribers for event %d: %v", event.ID, err)
			failures++
		} else {
			generalTicketDetails := "Free"
			if !event.IsFree {
				generalTicketDetails = fmt.Sprintf("KES %d", event.Price)
			}
			vipTicketDetails := "Not offered"
			if event.VIPCapacity > 0 {
				vipTicketDetails = fmt.Sprintf("KES %d (%d tickets)", event.VIPPrice, event.VIPCapacity)
			}
			flashSaleDetails := "Not offered"
			if event.FlashSaleCapacity > 0 {
				flashSaleDetails = fmt.Sprintf(
					"KES %d (%d tickets, %s to %s)",
					event.FlashSalePrice, event.FlashSaleCapacity,
					event.FlashSaleStartsAt.Format("02 Jan 2006 15:04 MST"),
					event.FlashSaleEndsAt.Format("02 Jan 2006 15:04 MST"),
				)
			}
			content := fmt.Sprintf(
				"<h1>Event details updated</h1><p>The organizer updated <b>%s</b>.</p><p><b>Date:</b> %s<br><b>Venue:</b> %s</p><p>%s</p><p><b>General admission:</b> %s<br><b>VIP:</b> %s<br><b>Flash sale:</b> %s</p><p>Visit Galleria for the latest event details.</p>",
				html.EscapeString(event.Title), html.EscapeString(event.Date),
				html.EscapeString(event.Location), html.EscapeString(event.Description),
				html.EscapeString(generalTicketDetails), html.EscapeString(vipTicketDetails),
				html.EscapeString(flashSaleDetails),
			)
			for _, booking := range bookings {
				if err := services.SendMail(booking.User.Email, booking.User.Name, "Event update — "+event.Title, content); err != nil {
					log.Printf("Could not notify attendee %d about event %d update: %v", booking.UserID, event.ID, err)
					failures++
					continue
				}
				sent++
			}
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"event": event,
		"notifications_sent": sent,
		"notification_failures": failures,
	})
}

func DeleteEvent(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("user_id")

	var event models.Event
	if err := db.DB.First(&event, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	// Allow delete if organizer_id matches OR if organizer_id is 0 (legacy seeded events)
	if event.OrganizerID != userID.(uint) && event.OrganizerID != 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your event"})
		return
	}

	db.DB.Delete(&event)
	c.JSON(http.StatusOK, gin.H{"message": "Event deleted"})
}

func GetAllEvents(c *gin.Context) {
	category := c.Query("category")
	city := c.Query("city")
	country := c.Query("country")
	search := c.Query("search")
	page := 1
	limit := 12

	if p := c.Query("page"); p != "" {
		if n, err := strconv.Atoi(p); err == nil && n > 0 {
			page = n
		}
	}
	offset := (page - 1) * limit

	query := db.DB.Model(&models.Event{})
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if city != "" {
		query = query.Where("city ILIKE ?", "%"+city+"%")
	}
	if country != "" {
		query = query.Where("country ILIKE ?", "%"+country+"%")
	}
	if search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ? OR location ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var dbEvents []models.Event
	query.Order("created_at desc").Limit(limit).Offset(offset).Find(&dbEvents)

	c.JSON(http.StatusOK, gin.H{
		"events": dbEvents,
		"total":  total,
		"page":   page,
		"limit":  limit,
		"pages":  int(math.Ceil(float64(total) / float64(limit))),
	})
}

func GetTrendingEvents(c *gin.Context) {
	type TrendingEvent struct {
		models.Event
		BookingCount int64 `json:"booking_count"`
	}

	var events []models.Event
	db.DB.Find(&events)

	trending := []TrendingEvent{}
	for _, e := range events {
		var count int64
		db.DB.Model(&models.Booking{}).
			Where("event_id = ? AND status = ?", e.ID, "confirmed").
			Count(&count)
		trending = append(trending, TrendingEvent{Event: e, BookingCount: count})
	}

	// sort by booking count descending
	for i := 0; i < len(trending)-1; i++ {
		for j := i + 1; j < len(trending); j++ {
			if trending[j].BookingCount > trending[i].BookingCount {
				trending[i], trending[j] = trending[j], trending[i]
			}
		}
	}

	if len(trending) > 6 {
		trending = trending[:6]
	}

	c.JSON(http.StatusOK, trending)
}
