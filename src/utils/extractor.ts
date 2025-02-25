import axios from 'axios';
import * as cheerio from 'cheerio';

export class ContentExtractor {
  private headers: Record<string, string>;

  constructor() {
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  async extract(url: string): Promise<string> {
    if (!url) return "";
    
    try {
      const response = await axios.get(url, { 
        headers: this.headers,
        timeout: 10000,
        maxRedirects: 5
      });

      // Use cheerio to parse the HTML and extract meaningful content
      const $ = cheerio.load(response.data);

      // Remove unwanted elements
      $('script, style, nav, footer, header, aside').remove();

      // Extract text from main content areas
      const content = $('article, main, .content, #content, .post, .article')
        .text()
        .trim()
        .replace(/\s+/g, ' ');

      // If no specific content areas found, get body text
      if (!content) {
        return $('body')
          .text()
          .trim()
          .replace(/\s+/g, ' ')
          .substring(0, 5000); // Limit content length
      }

      return content;
    } catch (error) {
      console.error(`Error extracting content from ${url}:`, error);
      return `[Unable to extract content from ${url}]`;
    }
  }
} 