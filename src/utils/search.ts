import axios from 'axios';
import { SearchResult } from '../types';

interface GoogleSearchResponse {
  items?: {
    title?: string;
    link?: string;
    snippet?: string;
  }[];
}

export class GoogleSearch {
  private api_key: string | undefined;
  private cx: string | undefined;
  private endpoint: string;

  constructor() {
    this.api_key = process.env.GOOGLE_API_KEY;
    this.cx = process.env.GOOGLE_CX;
    this.endpoint = "https://www.googleapis.com/customsearch/v1";
  }

  private _get_date_restrict(timeFilter: string): string | null {
    const filters: { [key: string]: string } = {
      "Past 24 hours": "d1",
      "Past week": "w1",
      "Past month": "m1",
      "Past year": "y1"
    };
    return filters[timeFilter] || null;
  }

  async search(query: string, maxResults: number = 10, timeFilter: string = "Any"): Promise<SearchResult[]> {
    if (!this.api_key || !this.cx) {
      throw new Error("Missing API key or Search Engine ID");
    }

    // Google API only allows 10 results per request, so we need to make multiple requests
    const allResults: SearchResult[] = [];
    const requestsNeeded = Math.ceil(maxResults / 10);
    
    for (let i = 0; i < requestsNeeded; i++) {
      const startIndex = i * 10 + 1; // Google uses 1-based indexing
      
      const params = {
        key: this.api_key,
        cx: this.cx,
        q: query,
        num: 10, // Max allowed per request
        start: startIndex,
      };

      const dateRestrict = this._get_date_restrict(timeFilter);
      if (dateRestrict) {
        Object.assign(params, { dateRestrict });
      }

      try {
        const response = await axios.get<GoogleSearchResponse>(this.endpoint, { params });
        const items = response.data.items || [];
        
        const results = items.map((item) => ({
          title: item.title || '',
          url: item.link || '',
          snippet: item.snippet || ''
        }));
        
        allResults.push(...results);
        
        // If we got fewer results than requested, there are no more results
        if (items.length < 10) break;
        
      } catch (error) {
        console.error('Error during search:', error);
        break;
      }
    }

    return allResults.slice(0, maxResults);
  }
} 