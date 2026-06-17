package db

import "galleria_back/models"

func SeedEvents() {
	events := []models.Event{
		// Nairobi
		{Title: "Nairobi Jazz Festival", Description: "Annual jazz festival bringing together the best local and international jazz artists.", Date: "2025-07-12", Location: "Uhuru Gardens", City: "Nairobi", Country: "Kenya", Category: "Music", Capacity: 500, Source: "seed"},
		{Title: "Rooftop Sundowner", Description: "Weekly sundowner with live DJ sets and craft cocktails.", Date: "2025-06-21", Location: "The Alchemist, Westlands", City: "Nairobi", Country: "Kenya", Category: "Food & Drink", Capacity: 200, Source: "seed"},
		{Title: "Nairobi Tech Meetup", Description: "Monthly gathering for tech founders, developers and investors.", Date: "2025-06-28", Location: "iHub, Kilimani", City: "Nairobi", Country: "Kenya", Category: "Tech", Capacity: 150, Source: "seed"},
		{Title: "Art After Dark", Description: "Contemporary art showcase featuring emerging Kenyan artists.", Date: "2025-07-05", Location: "GoDown Arts Centre", City: "Nairobi", Country: "Kenya", Category: "Art", Capacity: 300, Source: "seed"},
		{Title: "Koroga Festival", Description: "Kenya's biggest outdoor music and food festival.", Date: "2025-07-26", Location: "Two Rivers Mall, Runda", City: "Nairobi", Country: "Kenya", Category: "Music", Capacity: 3000, Source: "seed"},
		{Title: "Nairobi Half Marathon", Description: "Annual road race through the streets of Nairobi.", Date: "2025-08-02", Location: "Nyayo Stadium", City: "Nairobi", Country: "Kenya", Category: "Sports", Capacity: 10000, Source: "seed"},

		// Lagos
		{Title: "Lagos Fashion Week", Description: "West Africa's leading fashion showcase featuring top designers.", Date: "2025-07-20", Location: "Eko Convention Centre", City: "Lagos", Country: "Nigeria", Category: "Art", Capacity: 800, Source: "seed"},
		{Title: "Afrobeats Live", Description: "Live concert featuring rising Afrobeats stars.", Date: "2025-08-15", Location: "Eko Atlantic", City: "Lagos", Country: "Nigeria", Category: "Music", Capacity: 5000, Source: "seed"},

		// Cape Town
		{Title: "Cape Town Wine Festival", Description: "Celebrating the best wines from the Cape Winelands.", Date: "2025-07-10", Location: "V&A Waterfront", City: "Cape Town", Country: "South Africa", Category: "Food & Drink", Capacity: 1000, Source: "seed"},
		{Title: "Table Mountain Sunrise Hike", Description: "Guided group hike to watch sunrise from the top.", Date: "2025-07-18", Location: "Table Mountain", City: "Cape Town", Country: "South Africa", Category: "Outdoors", Capacity: 50, Source: "seed"},

		// London
		{Title: "London Tech Week", Description: "Major tech conference bringing together startups and investors.", Date: "2025-09-05", Location: "ExCeL London", City: "London", Country: "United Kingdom", Category: "Tech", Capacity: 2000, Source: "seed"},
		{Title: "Notting Hill Jazz Night", Description: "Intimate jazz evening in a classic London venue.", Date: "2025-07-22", Location: "Notting Hill", City: "London", Country: "United Kingdom", Category: "Music", Capacity: 150, Source: "seed"},

		// New York
		{Title: "NYC Food & Wine Festival", Description: "Celebrity chefs and top restaurants showcase the best of NYC food.", Date: "2025-10-10", Location: "Pier 76", City: "New York", Country: "United States", Category: "Food & Drink", Capacity: 3000, Source: "seed"},
		{Title: "Brooklyn Art Walk", Description: "Self guided tour through Brooklyn's best independent galleries.", Date: "2025-08-08", Location: "Bushwick", City: "New York", Country: "United States", Category: "Art", Capacity: 200, Source: "seed"},

		// Dubai
		{Title: "Dubai Startup Summit", Description: "Connecting founders and investors across the Middle East.", Date: "2025-09-18", Location: "Dubai World Trade Centre", City: "Dubai", Country: "United Arab Emirates", Category: "Networking", Capacity: 1500, Source: "seed"},
	}

	for _, event := range events {
		DB.FirstOrCreate(&event, models.Event{Title: event.Title})
	}
}