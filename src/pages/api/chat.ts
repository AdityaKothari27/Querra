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
    const { message, sources, conversationHistory = [] } = req.body;
    
    console.log('Chat mode request:', { message, sourcesCount: sources.length });
    
    // Generate chat response using URL context
    const response = await ai_processor.generate_chat_response(
      message, 
      sources, 
      conversationHistory
    );

    res.status(200).json({ response });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      response: 'I apologize, but I encountered an error. Please try again.' 
    });
  }
}
