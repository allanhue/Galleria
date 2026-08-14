package services

import (
	"encoding/xml"
	"net/http"
	"time"
)

type RSSFeed struct {
	Channel struct {
		Items []RSSItem `xml:"item"`
	} `xml:"channel"`
}

type RSSItem struct {
	Title       string `xml:"title"`
	Description string `xml:"description"`
	Link        string `xml:"link"`
	PubDate     string `xml:"pubDate"`
}

type FeedSource struct {
	URL    string
	Name   string
	Region string
}

var AllFeeds = []FeedSource{
	// Kenya
	{URL: "https://nairobinews.nation.africa/feed/", Name: "Nairobi News", Region: "kenya"},
	{URL: "https://www.pulselive.co.ke/rss.xml", Name: "Pulse Kenya", Region: "kenya"},
	{URL: "https://www.standardmedia.co.ke/rss/entertainment.php", Name: "Standard Media", Region: "kenya"},
	{URL: "https://www.the-star.co.ke/rss/", Name: "The Star Kenya", Region: "kenya"},

	// Nigeria
	{URL: "https://www.pulse.ng/rss", Name: "Pulse Nigeria", Region: "africa"},
	{URL: "https://punchng.com/feed/", Name: "Punch Nigeria", Region: "africa"},

	// South Africa
	{URL: "https://www.iol.co.za/cmlink/iol-news-rss-feed-1.640", Name: "IOL News", Region: "africa"},
	{URL: "https://www.timeslive.co.za/rss/", Name: "TimesLIVE", Region: "africa"},

	// Global / international
	{URL: "https://www.eventbrite.com/blog/feed/", Name: "Eventbrite Blog", Region: "global"},
	{URL: "https://timeout.com/feed", Name: "TimeOut", Region: "global"},
}

func FetchAllFeeds() []FeedEventResult {
	client := &http.Client{Timeout: 10 * time.Second}
	var results []FeedEventResult

	for _, feed := range AllFeeds {
		resp, err := client.Get(feed.URL)
		if err != nil {
			continue
		}

		var parsed RSSFeed
		err = xml.NewDecoder(resp.Body).Decode(&parsed)
		resp.Body.Close()
		if err != nil {
			continue
		}

		for _, item := range parsed.Channel.Items {
			results = append(results, FeedEventResult{
				Title:       item.Title,
				Description: item.Description,
				Link:        item.Link,
				PubDate:     item.PubDate,
				SourceName:  feed.Name,
				Region:      feed.Region,
			})
		}
	}

	return results
}

type FeedEventResult struct {
	Title       string
	Description string
	Link        string
	PubDate     string
	SourceName  string
	Region      string
}