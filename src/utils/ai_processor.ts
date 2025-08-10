import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";

export class GeminiProcessor {
  private genAI: GoogleGenerativeAI;
  private genAINew: GoogleGenAI;
  private model: any;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.genAINew = new GoogleGenAI({ apiKey });
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    // this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generate_report(query: string, contents: string[], promptTemplate: string): Promise<string> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = this._prepare_prompt({ query, contents, promptTemplate });
        
        const result = await this.model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 20000,
          },
        });

        const response = await result.response;
        return response.text();
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (error?.status === 429) {
          // If rate limited, wait longer before retry
          await this.delay(this.retryDelay * attempt);
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }

    throw new Error(`Failed to generate report after ${this.maxRetries} attempts. ${lastError?.message || ''}`);
  }

  async generate_report_fast(query: string, urls: string[], promptTemplate: string): Promise<string> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = this._prepare_fast_prompt({ query, urls, promptTemplate });
        
        const response = await this.genAINew.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [prompt],
          config: {
            tools: [{ urlContext: {} }],
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 20000, // Increased for better formatting
            responseModalities: ["TEXT"],
          },
        });

        console.log('URL Context Metadata:', response.candidates?.[0]?.urlContextMetadata);
        return response.text || 'No response generated';
      } catch (error: any) {
        lastError = error;
        console.error(`Fast mode attempt ${attempt} failed:`, error);
        
        if (error?.status === 429) {
          // If rate limited, wait longer before retry
          await this.delay(this.retryDelay * attempt);
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }
    
    throw lastError;
  }

  async generate_chat_response(
    message: string, 
    urls: string[], 
    conversationHistory: Array<{role: string, content: string}> = []
  ): Promise<string> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = this._prepare_chat_prompt({ message, urls, conversationHistory });
        
        const response = await this.genAINew.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [prompt],
          config: {
            tools: [{ urlContext: {} }],
            temperature: 0.8, // Slightly higher for more conversational responses
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            responseModalities: ["TEXT"],
          },
        });

        console.log('Chat URL Context Metadata:', response.candidates?.[0]?.urlContextMetadata);
        return response.text || 'I apologize, but I couldn\'t generate a response. Please try again.';
      } catch (error: any) {
        lastError = error;
        console.error(`Chat mode attempt ${attempt} failed:`, error);
        
        if (error?.status === 429) {
          await this.delay(this.retryDelay * attempt);
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError;
  }

  private _prepare_chat_prompt({ message, urls, conversationHistory }: {
    message: string;
    urls: string[];
    conversationHistory: Array<{role: string, content: string}>;
  }): string {
    const urlsWithNumbers = urls.map((url, index) => `[${index + 1}] ${url}`).join('\n');
    
    let historyText = '';
    if (conversationHistory.length > 0) {
      historyText = '\n\nPrevious conversation:\n' + 
        conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
    }
    
    return `You are an AI research assistant engaged in a conversational chat with a user. You have access to the following source materials:

Source Materials:
${urlsWithNumbers}

${historyText}

Current user message: ${message}

Please respond in a conversational, helpful manner. You can:
- Reference information from the source materials using citations like [1], [2]
- Ask follow-up questions to clarify the user's needs
- Provide insights and analysis based on the sources
- Maintain a natural, engaging conversation flow
- Be concise but informative

Respond to the user's message now:`;
  }

  private _prepare_fast_prompt({ query, urls, promptTemplate }: {
    query: string;
    urls: string[];
    promptTemplate: string;
  }): string {
    const urlsWithNumbers = urls.map((url, index) => `[${index + 1}] ${url}`).join('\n');
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `Search Topic: ${query}

${promptTemplate}

Source Materials:
${urlsWithNumbers}

Generate a comprehensive research report based on the above sources. Structure your response with proper Markdown formatting exactly as shown below:

# Research Report: ${query}


## Executive Summary
[Provide a comprehensive 2-3 paragraph overview of key findings and implications]

## Key Findings
[List 4-6 main discoveries with bullet points, each with supporting evidence]

## Detailed Analysis
[Provide in-depth analysis broken into logical subsections with ### subheadings]

## Recommendations
[Offer 3-5 actionable recommendations based on findings]

## Conclusions
[Summarize the main insights and their significance]

## Sources and Citations
[List all sources with proper citations and brief descriptions]

CRITICAL FORMATTING REQUIREMENTS:
- Use EXACT Markdown headings (# ## ###) as shown above
- Include citations as [1], [2], etc. throughout the text when referencing specific sources
- Use bullet points (•) and numbered lists where appropriate
- **Bold** important terms and key findings
- Use > blockquotes for important quotes or statistics
- Ensure professional academic formatting throughout
- Each section should have substantial content (not just placeholders)
- Make the report comprehensive and research-grade quality

Generate the complete structured report now:`;
  }

  private _prepare_prompt({ query, contents, promptTemplate }: {
    query: string;
    contents: string[];
    promptTemplate: string;
  }): string {
    // Filter out failed extractions and limit content length
    const validContents = contents
      .filter(content => !content.startsWith('[Unable to extract'))
      .map(content => content.substring(0, 2000)); // Limit each source to 2000 chars

    const combined_content = validContents
      .map((content, i) => `Source ${i + 1}:\n${content}`)
      .join("\n\n");
    
    return `
Search Topic: ${query}

Instructions: ${promptTemplate}

Source Materials:
${combined_content}

Please generate a comprehensive report based on the above sources. Include relevant details, comparisons, and insights from all provided sources.`;
  }

  async extractTextFromPdf(base64Content: string): Promise<string> {
    try {
      // Create a prompt for Gemini to extract text from the PDF
      const prompt = `
This is a base64-encoded PDF document. Please extract all the text content from this document.
Return ONLY the extracted text, formatted in a clean, readable way.
Do not include any explanations, introductions, or analysis.
`;

      // Use Gemini's multimodal capabilities to process the PDF
      const result = await this.model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { 
                inline_data: {
                  mime_type: "application/pdf",
                  data: base64Content
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0,
          topK: 1,
          topP: 1,
          maxOutputTokens: 8192,
        },
      });

      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Error extracting text from PDF with Gemini:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
} 
