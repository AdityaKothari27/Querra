import os
import requests
from datetime import datetime, timedelta

class GoogleSearch:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.cx = os.getenv("GOOGLE_CX")  # Search Engine ID
        self.endpoint = "https://www.googleapis.com/customsearch/v1"
        
    def _get_date_restrict(self, time_filter):
        if time_filter == "Past 24 hours":
            return "d1"
        elif time_filter == "Past week":
            return "w1"
        elif time_filter == "Past month":
            return "m1"
        elif time_filter == "Past year":
            return "y1"
        return None
        
    def search(self, query, max_results=10, time_filter="Any"):
        params = {
            "key": self.api_key,
            "cx": self.cx,
            "q": query,
            "num": min(max_results, 10),  # Google API max is 10 per request
        }
        
        date_restrict = self._get_date_restrict(time_filter)
        if date_restrict:
            params["dateRestrict"] = date_restrict
        
        results = []
        try:
            # Handle pagination if max_results > 10
            for start_index in range(1, max_results + 1, 10):
                params["start"] = start_index
                response = requests.get(self.endpoint, params=params)
                response.raise_for_status()
                
                data = response.json()
                if "items" not in data:
                    break
                    
                results.extend([{
                    'title': item.get('title', ''),
                    'url': item.get('link', ''),
                    'snippet': item.get('snippet', '')
                } for item in data["items"]])
                
                if len(results) >= max_results:
                    results = results[:max_results]
                    break
                    
        except requests.RequestException as e:
            print(f"Error during search: {e}")
            
        return results