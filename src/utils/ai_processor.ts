import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { requireAPIKey } from "./environment";
import { logger } from "./logging";

export class GeminiProcessor {
  private genAI: GoogleGenerativeAI;
  private genAINew: GoogleGenAI;
  private groq: Groq;
  private model: any;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    try {
      const geminiApiKey = requireAPIKey('GEMINI');
      const groqApiKey = requireAPIKey('GROQ');
      
      this.genAI = new GoogleGenerativeAI(geminiApiKey);
      this.genAINew = new GoogleGenAI({ apiKey: geminiApiKey });
      this.groq = new Groq({ apiKey: groqApiKey });
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      logger.info('AI Processor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Processor', error as Error);
      throw error;
    }
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generate_report(query: string, contents: string[], promptTemplate: string, model: string = 'gemini-2.5-flash'): Promise<string> {
    let lastError: any;
    
    // If using Groq model, use different approach
    if (model.includes('moonshot')) {
      return this._generateGroqReport(query, contents, promptTemplate);
    }
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = this._prepare_prompt({ query, contents, promptTemplate });
        
        // Select appropriate Gemini model
        const geminiModel = model === 'gemini-2.5-pro' ? 
          this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" }) :
          this.model;
        
        const result = await geminiModel.generateContent({
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

  async generate_report_fast(query: string, urls: string[], promptTemplate: string, model: string = 'gemini-2.5-flash'): Promise<string> {
    let lastError: any;
    
    // If using Groq model, fall back to content extraction since Groq doesn't support URL context
    if (model.includes('moonshot')) {
      // Extract content from URLs and use traditional approach
      const contents = await Promise.all(urls.map(async (url) => {
        try {
          const response = await fetch(url);
          const html = await response.text();
          return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 3000);
        } catch (error) {
          return `[Unable to extract content from ${url}]`;
        }
      }));
      return this._generateGroqReport(query, contents, promptTemplate);
    }
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = this._prepare_fast_prompt({ query, urls, promptTemplate });
        
        // Select appropriate model
        const geminiModel = model === 'gemini-2.5-pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        
        const response = await this.genAINew.models.generateContent({
          model: geminiModel,
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
    documentIds: number[] = [],
    conversationHistory: Array<{role: string, content: string}> = [],
    model: string = 'gemini-2.5-flash'
  ): Promise<string> {
    let lastError: any;
    
    // If no URLs or documents provided and using a Groq model, use general chat
    if (urls.length === 0 && documentIds.length === 0 && model.includes('moonshot')) {
      return this._generateGroqResponse(message, conversationHistory, model);
    }
    
    // If using Gemini 2.5 Pro without URLs or documents, use traditional Gemini
    if (urls.length === 0 && documentIds.length === 0 && model === 'gemini-2.5-pro') {
      return this._generateGeminiTraditionalResponse(message, conversationHistory, model);
    }
    
    // Fetch document contents if document IDs are provided
    let documentContents: string[] = [];
    if (documentIds.length > 0) {
      try {
        documentContents = await this._fetchDocumentContents(documentIds);
      } catch (error) {
        logger.error('Failed to fetch document contents', error as Error);
        // Continue without document context if fetching fails
      }
    }
    
    // For URL-based and/or document-based chat, use the appropriate model
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = this._prepare_chat_prompt({ 
          message, 
          urls, 
          documentContents,
          conversationHistory 
        });
        
        if (model.includes('moonshot')) {
          // Use Groq for Kimi model (Note: Groq doesn't support URL context, so we'll need content extraction)
          return this._generateGroqWithUrls(message, urls, documentContents, conversationHistory, model);
        } else {
          // Use Gemini with URL context and document content
          const geminiModel = model === 'gemini-2.5-pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
          const response = await this.genAINew.models.generateContent({
            model: geminiModel,
            contents: [prompt],
            config: {
              tools: urls.length > 0 ? [{ urlContext: {} }] : undefined,
              temperature: 0.8,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 20000,
              responseModalities: ["TEXT"],
            },
          });

          console.log('Chat URL Context Metadata:', response.candidates?.[0]?.urlContextMetadata);
          const responseText = response.text;
          
          if (!responseText || responseText.trim().length === 0) {
            throw new Error('Empty response from Gemini');
          }
          
          return responseText;
        }
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

  private _prepare_chat_prompt({ message, urls, documentContents, conversationHistory }: {
    message: string;
    urls: string[];
    documentContents?: string[];
    conversationHistory: Array<{role: string, content: string}>;
  }): string {
    const urlsWithNumbers = urls.map((url, index) => `[${index + 1}] ${url}`).join('\n');
    
    let sourceMaterials = '';
    if (urls.length > 0) {
      sourceMaterials += `Web Sources:\n${urlsWithNumbers}\n`;
    }
    
    if (documentContents && documentContents.length > 0) {
      sourceMaterials += `\nDocument Contents:\n` + 
        documentContents.map((content, i) => `Document ${i + 1}:\n${content.substring(0, 1000)}`).join('\n\n');
    }
    
    let historyText = '';
    if (conversationHistory.length > 0) {
      historyText = '\n\nPrevious conversation:\n' + 
        conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
    }
    
    return `You are an AI research assistant engaged in a conversational chat with a user. You have access to the following source materials:

${sourceMaterials}
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

  private async _generateGroqResponse(
    message: string,
    conversationHistory: Array<{role: string, content: string}>,
    model: string
  ): Promise<string> {
    try {
      const messages = [
        {
          role: "system" as const,
          content: "You are a helpful AI assistant. Provide clear, informative, and engaging responses to user questions."
        },
        ...conversationHistory.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        })),
        {
          role: "user" as const,
          content: message
        }
      ];

      const response = await this.groq.chat.completions.create({
        model: "moonshotai/kimi-k2-instruct",
        messages,
        temperature: 0.8,
        max_tokens: 16000,
      });

      return response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
    } catch (error: any) {
      console.error('Groq API error:', error);
      throw new Error(`Groq API failed: ${error.message}`);
    }
  }

  private async _generateGeminiTraditionalResponse(
    message: string,
    conversationHistory: Array<{role: string, content: string}>,
    model: string
  ): Promise<string> {
    let conversationText = '';
    if (conversationHistory.length > 0) {
      conversationText = '\n\nPrevious conversation:\n' + 
        conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
    }

    const promptText = `You are a helpful AI assistant. Provide clear, informative, and engaging responses to user questions.

${conversationText}

Current user message: ${message}

Please respond in a conversational, helpful manner.`;

    try {
      const geminiModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

      const result = await geminiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 16000,
        },
      });

      const response = await result.response;
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }
      
      return text;
    } catch (error: any) {
      console.error('Gemini traditional response error:', error);
      logger.error('Gemini 2.5 Pro traditional response failed', error, undefined, {
        message: message.substring(0, 100),
        model,
        errorMessage: error.message
      });
      
      // Fallback to Gemini 2.5 Flash if Pro fails
      try {
        const fallbackModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const fallbackResult = await fallbackModel.generateContent({
          contents: [{ role: "user", parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 16000,
          },
        });
        
        const fallbackResponse = await fallbackResult.response;
        const fallbackText = fallbackResponse.text();
        
        if (fallbackText && fallbackText.trim().length > 0) {
          logger.info('Fallback to Gemini 2.5 Flash successful');
          return fallbackText;
        }
      } catch (fallbackError) {
        console.error('Fallback to Gemini Flash also failed:', fallbackError);
      }
      
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  }

  private async _generateGroqWithUrls(
    message: string,
    urls: string[],
    documentContents: string[],
    conversationHistory: Array<{role: string, content: string}>,
    model: string
  ): Promise<string> {
    try {
      // For Groq, we need to extract content from URLs first since it doesn't support URL context
      const urlContents = await Promise.all(urls.map(async (url) => {
        try {
          const response = await fetch(url);
          const html = await response.text();
          // Basic text extraction (you might want to use a more sophisticated method)
          const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 2000);
          return `Content from ${url}:\n${textContent}`;
        } catch (error) {
          return `Failed to extract content from ${url}`;
        }
      }));

      const urlsWithNumbers = urls.map((url, index) => `[${index + 1}] ${url}`).join('\n');
      
      // Combine URL content and document contents
      let allContent = urlContents.join('\n\n');
      
      if (documentContents.length > 0) {
        const docContentsFormatted = documentContents.map((content, i) => 
          `Document ${i + 1}:\n${content.substring(0, 1500)}`
        ).join('\n\n');
        allContent += '\n\nDocument Contents:\n' + docContentsFormatted;
      }
      
      const messages = [
        {
          role: "system" as const,
          content: "You are a helpful AI assistant with access to web content and documents. Answer questions based on the provided sources and cite them using [1], [2], etc."
        },
        {
          role: "user" as const,
          content: `Sources:
${urlsWithNumbers}

Source content:
${allContent}

${conversationHistory.length > 0 ? `Previous conversation:\n${conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}\n` : ''}

User question: ${message}

Please provide a helpful response based on the sources above, citing them with [1], [2], etc.`
        }
      ];

      const response = await this.groq.chat.completions.create({
        model: "moonshotai/kimi-k2-instruct",
        messages,
        temperature: 0.8,
        max_tokens: 16000,
      });

      return response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
    } catch (error: any) {
      console.error('Groq with URLs error:', error);
      throw new Error(`Groq API with URLs failed: ${error.message}`);
    }
  }

  private async _generateGroqReport(
    query: string,
    contents: string[],
    promptTemplate: string
  ): Promise<string> {
    try {
      const validContents = contents
        .filter(content => !content.startsWith('[Unable to extract'))
        .map(content => content.substring(0, 2000)); // Limit each source to 2000 chars

      const combined_content = validContents
        .map((content, i) => `Source ${i + 1}:\n${content}`)
        .join("\n\n");

      const prompt = `Search Topic: ${query}

Instructions: ${promptTemplate}

Source Materials:
${combined_content}

Please generate a comprehensive report based on the above sources. Include relevant details, comparisons, and insights from all provided sources.`;

      const response = await this.groq.chat.completions.create({
        model: "moonshotai/kimi-k2-instruct",
        messages: [
          {
            role: "system",
            content: "You are a professional research assistant. Generate well-structured, comprehensive reports based on provided sources."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 16000,
      });

      return response.choices[0]?.message?.content || "I apologize, but I couldn't generate a report. Please try again.";
    } catch (error: any) {
      console.error('Groq report generation error:', error);
      throw new Error(`Groq API failed: ${error.message}`);
    }
  }

  private async _fetchDocumentContents(documentIds: number[]): Promise<string[]> {
    try {
      // Input validation
      if (!Array.isArray(documentIds)) {
        logger.warn('Invalid document IDs array provided');
        return [];
      }

      // Validate each document ID
      const validDocumentIds = documentIds.filter(id => {
        if (!Number.isInteger(id) || id < 1 || id > 999999) {
          logger.warn(`Invalid document ID: ${id}`);
          return false;
        }
        return true;
      });

      if (validDocumentIds.length === 0) {
        return [];
      }

      const { Database } = await import('./database');
      const db = new Database();
      const contents: string[] = [];
      
      for (const docId of validDocumentIds) {
        try {
          // Fetch document content directly from database
          const documentData = await db.get_document_by_id(docId);
          if (documentData && documentData.content) {
            // Limit content size for security and performance
            const limitedContent = documentData.content.substring(0, 10000); // 10KB limit
            contents.push(limitedContent);
          } else {
            logger.warn(`Document ${docId} not found or has no content`);
          }
        } catch (error) {
          logger.error(`Error fetching document ${docId}:`, error as Error);
          // Continue with other documents
        }
      }
      
      return contents;
    } catch (error) {
      logger.error('Error in _fetchDocumentContents:', error as Error);
      return [];
    }
  }
} 
