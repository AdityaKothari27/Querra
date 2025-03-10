import axios from 'axios';
import * as cheerio from 'cheerio';

export class ContentExtractor {
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
  };

  async extract(url: string): Promise<string> {
    console.log(`Attempting to extract content from: ${url}`);
    
    try {
      // Try direct extraction first
      const response = await axios.get(url, { 
        headers: this.headers,
        timeout: 15000,
        maxRedirects: 5,
        maxContentLength: 10 * 1024 * 1024, // 10MB
        decompress: true,
        validateStatus: status => status < 500 // Accept all responses except 5xx errors
      });
      
      if (response.status === 200) {
        const html = response.data;
        return this.parseContent(html, url);
      }
      
      // If direct extraction fails, try using a fallback method
      return this.fallbackExtraction(url);
      
    } catch (error) {
      console.error(`Error extracting content from ${url}:`, error);
      
      // Return a placeholder with the URL so the AI can still reference it
      return this.generatePlaceholderContent(url);
    }
  }

  private parseContent(html: string, url: string): string {
    try {
      const $ = cheerio.load(html);
      
      // Remove scripts, styles, and other non-content elements
      $('script, style, iframe, nav, footer, header, aside').remove();
      
      // Extract the main content - adjust selectors based on common patterns
      let content = '';
      
      // Try to find main content container
      const mainSelectors = [
        'main', 'article', '.content', '#content', '.main', '#main',
        '.post', '.entry', '.article', '[role="main"]'
      ];
      
      for (const selector of mainSelectors) {
        if ($(selector).length) {
          content = $(selector).text();
          break;
        }
      }
      
      // If no main content found, use body text
      if (!content) {
        content = $('body').text();
      }
      
      // Clean up the content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      if (content.length > 100) {
        return content;
      } else {
        // Content too short, likely extraction failed
        return this.generatePlaceholderContent(url);
      }
      
    } catch (error) {
      console.error(`Error parsing HTML from ${url}:`, error);
      return this.generatePlaceholderContent(url);
    }
  }
  
  private async fallbackExtraction(url: string): Promise<string> {
    // For financial sites, try to extract specific information
    if (url.includes('finance.yahoo.com')) {
      return `This is financial data from Yahoo Finance about a stock or financial instrument. The URL is ${url}. The page likely contains stock price information, financial metrics, company overview, and market data.`;
    }
    
    // if (url.includes('investor.apple.com')) {
    //   return `This is investor relations information from Apple Inc. The URL is ${url}. The page likely contains financial reports, earnings information, investor presentations, and company announcements.`;
    // }
    
    // Generic fallback for other sites
    return this.generatePlaceholderContent(url);
  }
  
  private generatePlaceholderContent(url: string): string {
    // Create a descriptive placeholder that the AI can use
    const domain = new URL(url).hostname;
    
    return `
Source URL: ${url}
Website: ${domain}

[Note: Content extraction was blocked by the website. This appears to be a webpage from ${domain}. The AI will use general knowledge about this source to provide relevant information in the report.]

For more accurate information, please visit the source directly at: ${url}
`;
  }
} 