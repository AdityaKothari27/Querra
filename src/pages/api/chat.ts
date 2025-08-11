import type { NextApiRequest, NextApiResponse } from 'next';
import { GeminiProcessor } from '../../utils/ai_processor';

const ai_processor = new GeminiProcessor();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, sources, conversationHistory = [], model = 'gemini-2.0-flash-exp' } = req.body;
    
    console.log('Chat mode request:', { message, sourcesCount: sources.length, model });
    
    // Generate chat response using URL context or general chat based on model and sources
    const response = await ai_processor.generate_chat_response(
      message, 
      sources, 
      conversationHistory,
      model
    );

    res.status(200).json({ message: response });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      message: 'I apologize, but I encountered an error. Please try again.' 
    });
  }
}
