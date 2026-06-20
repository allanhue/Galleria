package handlers

import (
	"galleria_back/db"
	"galleria_back/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SuggestedUser struct {
	models.User
	SharedCategories []string `json:"shared_categories"`
	MatchScore       int      `json:"match_score"`
}

func GetSuggestedPeople(c *gin.Context) {
	userID, _ := c.Get("user_id")

	// categories the current user cares about, via bookings
	var myCategories []string
	db.DB.Table("bookings").
		Select("DISTINCT events.category").
		Joins("JOIN events ON events.id = bookings.event_id").
		Where("bookings.user_id = ?", userID).
		Pluck("events.category", &myCategories)

	// also include categories from posts they've made (treat post titles loosely, skip for now, bookings are the clean signal)

	if len(myCategories) == 0 {
		// no booking history yet — fallback to most active community users
		var fallbackUsers []models.User
		db.DB.Table("users").
			Joins("JOIN community_posts ON community_posts.user_id = users.id").
			Where("users.id != ?", userID).
			Group("users.id").
			Order("COUNT(community_posts.id) DESC").
			Limit(10).
			Find(&fallbackUsers)

		// exclude already-followed
		var following []models.Follow
		db.DB.Where("follower_id = ?", userID).Find(&following)
		followingSet := map[uint]bool{}
		for _, f := range following {
			followingSet[f.FollowingID] = true
		}

		result := []SuggestedUser{}
		for _, u := range fallbackUsers {
			if u.ID == userID.(uint) || followingSet[u.ID] {
				continue
			}
			result = append(result, SuggestedUser{User: u, SharedCategories: []string{}, MatchScore: 0})
		}
		c.JSON(http.StatusOK, result)
		return
	}

	// find other users who booked events in the same categories
	type Row struct {
		UserID   uint
		Category string
	}
	var rows []Row
	db.DB.Table("bookings").
		Select("bookings.user_id as user_id, events.category as category").
		Joins("JOIN events ON events.id = bookings.event_id").
		Where("events.category IN ? AND bookings.user_id != ?", myCategories, userID).
		Scan(&rows)

	// tally matches per user
	matchMap := map[uint]map[string]bool{}
	for _, r := range rows {
		if matchMap[r.UserID] == nil {
			matchMap[r.UserID] = map[string]bool{}
		}
		matchMap[r.UserID][r.Category] = true
	}

	var following []models.Follow
	db.DB.Where("follower_id = ?", userID).Find(&following)
	followingSet := map[uint]bool{}
	for _, f := range following {
		followingSet[f.FollowingID] = true
	}

	result := []SuggestedUser{}
	for uid, cats := range matchMap {
		if followingSet[uid] {
			continue
		}
		var u models.User
		if db.DB.First(&u, uid).Error != nil {
			continue
		}
		catList := []string{}
		for cat := range cats {
			catList = append(catList, cat)
		}
		result = append(result, SuggestedUser{
			User:             u,
			SharedCategories: catList,
			MatchScore:       len(catList),
		})
	}

	c.JSON(http.StatusOK, result)
}