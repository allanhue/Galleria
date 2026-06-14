package db

import "galleria_back/models"

func SeedEvents() {
    events := []models.Event{
        {
            Title:       "Nairobi Jazz Festival",
            Description: "Annual jazz festival bringing together the best local and international jazz artists.",
            Date:        "2025-07-12",
            Location:    "Uhuru Gardens, Nairobi",
            Category:    "Music",
            Capacity:    500,
            Source:      "seed",
        },
        {
            Title:       "Rooftop Sundowner",
            Description: "Weekly sundowner with live DJ sets and craft cocktails.",
            Date:        "2025-06-21",
            Location:    "The Alchemist, Westlands",
            Category:    "Food & Drink",
            Capacity:    200,
            Source:      "seed",
        },
        {
            Title:       "Nairobi Tech Meetup",
            Description: "Monthly gathering for tech founders, developers and investors in Nairobi.",
            Date:        "2025-06-28",
            Location:    "iHub, Kilimani",
            Category:    "Tech",
            Capacity:    150,
            Source:      "seed",
        },
        {
            Title:       "Art After Dark",
            Description: "Contemporary art showcase featuring emerging Kenyan artists.",
            Date:        "2025-07-05",
            Location:    "GoDown Arts Centre, Industrial Area",
            Category:    "Art",
            Capacity:    300,
            Source:      "seed",
        },
        {
            Title:       "Nairobi Food Festival",
            Description: "Three day food festival celebrating Kenyan cuisine and street food culture.",
            Date:        "2025-07-18",
            Location:    "Carnivore Grounds, Langata",
            Category:    "Food & Drink",
            Capacity:    2000,
            Source:      "seed",
        },
        {
            Title:       "Koroga Festival",
            Description: "Kenya's biggest outdoor music and food festival.",
            Date:        "2025-07-26",
            Location:    "Two Rivers Mall, Runda",
            Category:    "Music",
            Capacity:    3000,
            Source:      "seed",
        },
        {
            Title:       "Nairobi Half Marathon",
            Description: "Annual road race through the streets of Nairobi.",
            Date:        "2025-08-02",
            Location:    "Nyayo Stadium, Nairobi",
            Category:    "Sports",
            Capacity:    10000,
            Source:      "seed",
        },
        {
            Title:       "Creative Arts Workshop",
            Description: "Full day workshop covering painting, sculpture and digital art.",
            Date:        "2025-07-08",
            Location:    "Kuona Trust, Upperhill",
            Category:    "Art",
            Capacity:    50,
            Source:      "seed",
        },
        {
            Title:       "Blankets and Wine",
            Description: "Iconic outdoor music experience under the Nairobi sun.",
            Date:        "2025-08-10",
            Location:    "Ngong Racecourse, Nairobi",
            Category:    "Music",
            Capacity:    5000,
            Source:      "seed",
        },
        {
            Title:       "Startup Grind Nairobi",
            Description: "Fireside chat with Kenya's top startup founders.",
            Date:        "2025-07-15",
            Location:    "Radisson Blu, Upperhill",
            Category:    "Networking",
            Capacity:    200,
            Source:      "seed",
        },
    }

    for _, event := range events {
        DB.FirstOrCreate(&event, models.Event{Title: event.Title})
    }
}