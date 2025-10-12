import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as cheerio from 'cheerio';

const db = admin.firestore();

interface ScrapedEvent {
  title: string;
  description: string;
  date: Date;
  location: string;
  url: string;
  organizer: string;
  category: string;
  price?: string;
  imageUrl?: string;
  source: 'eventbrite' | 'meetup' | 'ieee' | 'other';
}

export const webScraperFunctions = {
  // Scrape Eventbrite events
  scrapeEventbrite: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { query, location, category } = data;

    try {
      // Use Eventbrite API if available, otherwise scrape
      const events = await scrapeEventbriteEvents(query, location, category);
      
      // Store scraped events
      const batch = db.batch();
      const scrapedEvents: any[] = [];

      for (const event of events) {
        const eventRef = db.collection('scrapedEvents').doc();
        const eventData = {
          ...event,
          scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
          scrapedBy: context.auth.uid,
          processed: false
        };
        
        batch.set(eventRef, eventData);
        scrapedEvents.push({ id: eventRef.id, ...eventData });
      }

      await batch.commit();

      return { 
        success: true, 
        eventsFound: events.length,
        events: scrapedEvents
      };

    } catch (error) {
      console.error('Error scraping Eventbrite:', error);
      throw new functions.https.HttpsError('internal', 'Failed to scrape Eventbrite events');
    }
  }),

  // Scrape Meetup events
  scrapeMeetup: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { query, location, category } = data;

    try {
      const events = await scrapeMeetupEvents(query, location, category);
      
      // Store scraped events
      const batch = db.batch();
      const scrapedEvents: any[] = [];

      for (const event of events) {
        const eventRef = db.collection('scrapedEvents').doc();
        const eventData = {
          ...event,
          scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
          scrapedBy: context.auth.uid,
          processed: false
        };
        
        batch.set(eventRef, eventData);
        scrapedEvents.push({ id: eventRef.id, ...eventData });
      }

      await batch.commit();

      return { 
        success: true, 
        eventsFound: events.length,
        events: scrapedEvents
      };

    } catch (error) {
      console.error('Error scraping Meetup:', error);
      throw new functions.https.HttpsError('internal', 'Failed to scrape Meetup events');
    }
  }),

  // Scrape IEEE events
  scrapeIEEE: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { category = 'all' } = data;

    try {
      const events = await scrapeIEEEEvents(category);
      
      // Store scraped events
      const batch = db.batch();
      const scrapedEvents: any[] = [];

      for (const event of events) {
        const eventRef = db.collection('scrapedEvents').doc();
        const eventData = {
          ...event,
          scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
          scrapedBy: context.auth.uid,
          processed: false
        };
        
        batch.set(eventRef, eventData);
        scrapedEvents.push({ id: eventRef.id, ...eventData });
      }

      await batch.commit();

      return { 
        success: true, 
        eventsFound: events.length,
        events: scrapedEvents
      };

    } catch (error) {
      console.error('Error scraping IEEE:', error);
      throw new functions.https.HttpsError('internal', 'Failed to scrape IEEE events');
    }
  }),

  // Get scraped events with filters
  getScrapedEvents: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { 
      source, 
      category, 
      location, 
      dateRange,
      limit = 50,
      offset = 0,
      processed = null
    } = data;

    try {
      let query = db.collection('scrapedEvents')
        .orderBy('scrapedAt', 'desc');

      if (source) {
        query = query.where('source', '==', source);
      }

      if (category) {
        query = query.where('category', '==', category);
      }

      if (processed !== null) {
        query = query.where('processed', '==', processed);
      }

      if (dateRange) {
        if (dateRange.start) {
          query = query.where('date', '>=', new Date(dateRange.start));
        }
        if (dateRange.end) {
          query = query.where('date', '<=', new Date(dateRange.end));
        }
      }

      query = query.limit(limit);
      if (offset > 0) {
        // Implement pagination if needed
      }

      const eventsSnapshot = await query.get();
      
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scrapedAt: doc.data().scrapedAt?.toDate().toISOString(),
        date: doc.data().date?.toDate().toISOString()
      }));

      return { events, total: events.length };

    } catch (error) {
      console.error('Error fetching scraped events:', error);
      throw new functions.https.HttpsError('internal', 'Failed to fetch scraped events');
    }
  }),

  // Process scraped event (import to platform)
  processScrapedEvent: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { scrapedEventId, action } = data; // action: 'import' | 'ignore' | 'bookmark'

    try {
      const scrapedEventRef = db.collection('scrapedEvents').doc(scrapedEventId);
      const scrapedEvent = await scrapedEventRef.get();

      if (!scrapedEvent.exists) {
        throw new functions.https.HttpsError('not-found', 'Scraped event not found');
      }

      const eventData = scrapedEvent.data();

      switch (action) {
        case 'import':
          // Create new event in platform
          const newEventRef = await db.collection('events').add({
            title: eventData?.title,
            description: eventData?.description,
            startDate: eventData?.date,
            location: eventData?.location,
            organizer: eventData?.organizer,
            category: eventData?.category,
            externalUrl: eventData?.url,
            imageUrl: eventData?.imageUrl,
            importedFrom: eventData?.source,
            importedAt: admin.firestore.FieldValue.serverTimestamp(),
            importedBy: context.auth.uid,
            status: 'draft',
            visibility: 'public'
          });

          // Mark as processed
          await scrapedEventRef.update({
            processed: true,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedBy: context.auth.uid,
            action: 'imported',
            platformEventId: newEventRef.id
          });

          return { success: true, eventId: newEventRef.id, action: 'imported' };

        case 'bookmark':
          // Add to user's bookmarks
          await db.collection('users').doc(context.auth.uid).collection('bookmarks').add({
            scrapedEventId,
            title: eventData?.title,
            source: eventData?.source,
            url: eventData?.url,
            bookmarkedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          await scrapedEventRef.update({
            processed: true,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedBy: context.auth.uid,
            action: 'bookmarked'
          });

          return { success: true, action: 'bookmarked' };

        case 'ignore':
          await scrapedEventRef.update({
            processed: true,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedBy: context.auth.uid,
            action: 'ignored'
          });

          return { success: true, action: 'ignored' };

        default:
          throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
      }

    } catch (error) {
      console.error('Error processing scraped event:', error);
      throw new functions.https.HttpsError('internal', 'Failed to process scraped event');
    }
  }),

  // Generate AI trends from scraped data
  generateTrends: functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      // Analyze scraped events for trends
      const trends = await analyzeEventTrends();

      // Store trends report
      await db.collection('trendReports').add({
        trends,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        generatedBy: context.auth.uid,
        type: 'scraped_events_analysis'
      });

      return { trends };

    } catch (error) {
      console.error('Error generating trends:', error);
      throw new functions.https.HttpsError('internal', 'Failed to generate trends');
    }
  }),

  // Scheduled scraping job
  scheduledScraping: functions.pubsub.schedule('0 */6 * * *').onRun(async (context: any) => {
    console.log('Running scheduled event scraping...');

    try {
      // Scrape popular categories from multiple sources
      const categories = ['technology', 'business', 'networking', 'education', 'workshop'];
      const sources = ['eventbrite', 'meetup', 'ieee'];

      for (const category of categories) {
        for (const source of sources) {
          try {
            let events: ScrapedEvent[] = [];

            switch (source) {
              case 'eventbrite':
                events = await scrapeEventbriteEvents('', '', category);
                break;
              case 'meetup':
                events = await scrapeMeetupEvents('', '', category);
                break;
              case 'ieee':
                events = await scrapeIEEEEvents(category);
                break;
            }

            // Store events
            const batch = db.batch();
            for (const event of events) {
              const eventRef = db.collection('scrapedEvents').doc();
              batch.set(eventRef, {
                ...event,
                scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
                scrapedBy: 'system',
                processed: false,
                scheduledScrape: true
              });
            }

            await batch.commit();
            console.log(`Scraped ${events.length} events from ${source} for category ${category}`);

          } catch (sourceError) {
            console.error(`Error scraping ${source}:`, sourceError);
          }
        }
      }

      // Clean up old scraped events (older than 30 days)
      const oldEvents = await db.collection('scrapedEvents')
        .where('scrapedAt', '<', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .get();

      const deleteBatch = db.batch();
      oldEvents.docs.forEach(doc => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();

      console.log(`Cleaned up ${oldEvents.size} old scraped events`);

    } catch (error) {
      console.error('Error in scheduled scraping:', error);
    }
  })
};

// Helper functions for scraping different sources
async function scrapeEventbriteEvents(query: string, location: string, category: string): Promise<ScrapedEvent[]> {
  // Mock implementation - replace with actual Eventbrite API or scraping logic
  const events: ScrapedEvent[] = [
    {
      title: "Tech Meetup 2024",
      description: "Join us for an exciting technology meetup featuring the latest innovations.",
      date: new Date('2024-03-15'),
      location: "San Francisco, CA",
      url: "https://eventbrite.com/event/tech-meetup-2024",
      organizer: "Tech Community SF",
      category: "technology",
      price: "Free",
      source: 'eventbrite'
    }
  ];

  return events;
}

async function scrapeMeetupEvents(query: string, location: string, category: string): Promise<ScrapedEvent[]> {
  // Mock implementation - replace with actual Meetup API or scraping logic
  const events: ScrapedEvent[] = [
    {
      title: "Business Networking Event",
      description: "Connect with local business professionals and entrepreneurs.",
      date: new Date('2024-03-20'),
      location: "New York, NY",
      url: "https://meetup.com/event/business-networking",
      organizer: "NYC Business Network",
      category: "business",
      price: "$10",
      source: 'meetup'
    }
  ];

  return events;
}

async function scrapeIEEEEvents(category: string): Promise<ScrapedEvent[]> {
  try {
    const response = await axios.get('https://www.ieee.org/conferences/index.html');
    const $ = cheerio.load(response.data);
    const events: ScrapedEvent[] = [];

    $('.conference-item').each((index, element) => {
      const title = $(element).find('.title').text().trim();
      const description = $(element).find('.description').text().trim();
      const dateText = $(element).find('.date').text().trim();
      const location = $(element).find('.location').text().trim();
      const url = $(element).find('a').attr('href') || '';

      if (title && dateText) {
        events.push({
          title,
          description,
          date: new Date(dateText),
          location,
          url: url.startsWith('http') ? url : `https://www.ieee.org${url}`,
          organizer: 'IEEE',
          category: 'technology',
          source: 'ieee'
        });
      }
    });

    return events;
  } catch (error) {
    console.error('Error scraping IEEE:', error);
    return [];
  }
}

async function analyzeEventTrends(): Promise<any> {
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const eventsSnapshot = await db.collection('scrapedEvents')
      .where('scrapedAt', '>=', last30Days)
      .get();

    const events = eventsSnapshot.docs.map(doc => doc.data());

    // Analyze categories
    const categoryCount = events.reduce((acc: any, event: any) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {});

    // Analyze locations
    const locationCount = events.reduce((acc: any, event: any) => {
      acc[event.location] = (acc[event.location] || 0) + 1;
      return acc;
    }, {});

    // Analyze sources
    const sourceCount = events.reduce((acc: any, event: any) => {
      acc[event.source] = (acc[event.source] || 0) + 1;
      return acc;
    }, {});

    // Find trending keywords in titles
    const allTitles = events.map((event: any) => event.title).join(' ');
    const words = allTitles.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCount = words.reduce((acc: any, word: string) => {
      if (word.length > 3) {
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {});

    const trendingKeywords = Object.entries(wordCount)
      .sort(([,a]: any, [,b]: any) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return {
      totalEvents: events.length,
      categories: categoryCount,
      locations: locationCount,
      sources: sourceCount,
      trendingKeywords,
      analysisDate: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error analyzing trends:', error);
    throw error;
  }
}