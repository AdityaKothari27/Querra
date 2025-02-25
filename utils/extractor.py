import trafilatura
import requests
from bs4 import BeautifulSoup
import validators

class ContentExtractor:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    def extract(self, url):
        """Extract content from a given URL using trafilatura with fallback to BeautifulSoup"""
        if not validators.url(url):
            return ""
        
        try:
            # Try with trafilatura first
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                content = trafilatura.extract(downloaded, include_links=False, include_images=False)
                if content:
                    return content.strip()
            
            # Fallback to BeautifulSoup
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(['script', 'style', 'nav', 'footer', 'header']):
                element.decompose()
            
            # Extract text
            text = ' '.join([p.get_text().strip() for p in soup.find_all(['p', 'article'])])
            return text.strip()
            
        except Exception as e:
            print(f"Error extracting content from {url}: {e}")
            return ""

    def clean_content(self, content):
        """Clean and normalize extracted content"""
        if not content:
            return ""
        
        # Remove extra whitespace
        content = ' '.join(content.split())
        
        # Basic text normalization
        content = content.replace('\n', ' ').replace('\t', ' ')
        
        return content[:50000]  # Limit content length for AI processing