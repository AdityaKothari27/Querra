import google.generativeai as genai
import os

class GeminiProcessor:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
    def _prepare_prompt(self, query, contents, prompt_template):
        """Prepare the prompt for Gemini"""
        combined_content = "\n\n".join([f"Source {i+1}:\n{content}" for i, content in enumerate(contents)])
        
        prompt = f"""
Research Topic: {query}

{prompt_template}

Sources:
{combined_content}

Please generate a comprehensive report based on the above sources. Include:
1. Executive Summary
2. Key Findings
3. Analysis
4. Recommendations
5. Sources Used

Format the report in Markdown."""
        
        return prompt
        
    def generate_report(self, query, contents, prompt_template):
        """Generate a report using Gemini"""
        try:
            # Prepare the prompt
            prompt = self._prepare_prompt(query, contents, prompt_template)
            
            # Generate response
            response = self.model.generate_content(prompt)
            
            # Return the generated report
            return response.text if response.text else "Error: Unable to generate report"
            
        except Exception as e:
            print(f"Error generating report: {e}")
            return "Error: Unable to generate report due to an unexpected error."