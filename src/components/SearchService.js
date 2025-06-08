class SearchService {
  constructor() {
    this.baseUrl = 'http://localhost:5050/api/search'; // Backend proxy URL
    this.apiKey = localStorage.getItem('serpapi_key') || ''; // Store API key in localStorage
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('serpapi_key', key);
  }

  getApiKey() {
    return this.apiKey;
  }

  async searchLocalEvents(location, category = 'events') {
    if (!this.apiKey) {
      throw new Error('SerpAPI key is not set');
    }

    try {
      const locationString = location.city
        ? `${location.city}, ${location.region || ''}`
        : `${location.latitude},${location.longitude}`;

      const searchQuery = `${category} near ${locationString} today`;

      // Use the backend proxy instead of calling SerpAPI directly
      const response = await fetch(
        `${this.baseUrl}/events?apiKey=${this.apiKey}&query=${encodeURIComponent(
          searchQuery
        )}&location=${encodeURIComponent(locationString)}`
      );

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error searching events');
      }

      const data = result.data;
      console.log('Search API response:', data);

      // Extract events from the response
      return this.extractEventsFromResults(data, locationString);
    } catch (error) {
      console.error('Error searching local events:', error);
      throw error;
    }
  }

  extractEventsFromResults(data, location) {
    const events = [];

    // Extract events from events_results array
    if (data.events_results && Array.isArray(data.events_results)) {
      data.events_results.forEach((event) => {
        const eventTime = event.date?.when || 'Time not specified';
        events.push({
          title: event.title || 'Event',
          venue: event.venue?.name || event.address?.[0] || 'Venue not specified',
          time: eventTime,
          link: event.link || '#',
          description: event.description || 'No description available',
        });
      });
    }

    return {
      events: events.length > 0 ? events : [],
      location: location,
      source: 'SerpAPI',
      timestamp: new Date().toISOString(),
    };
  }
}

const searchService = new SearchService();
export default searchService;