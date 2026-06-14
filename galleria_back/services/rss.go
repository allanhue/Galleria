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

var KenyanFeeds = []string{
    "https://nairobinews.nation.africa/feed/",
    "https://www.pulselive.co.ke/rss.xml",
    "https://www.standardmedia.co.ke/rss/entertainment.php",
}

func FetchRSSEvents() ([]RSSItem, error) {
    client := &http.Client{Timeout: 10 * time.Second}
    var allItems []RSSItem

    for _, feedURL := range KenyanFeeds {
        resp, err := client.Get(feedURL)
        if err != nil {
            continue
        }
        defer resp.Body.Close()

        var feed RSSFeed
        if err := xml.NewDecoder(resp.Body).Decode(&feed); err != nil {
            continue
        }

        allItems = append(allItems, feed.Channel.Items...)
    }

    return allItems, nil
}