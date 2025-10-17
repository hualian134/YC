// src/lib/gemini.ts (Conceptual file)
import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client using the API key from environment variables
// You must ensure process.env.GEMINI_API_KEY is set in your environment
const ai = new GoogleGenAI({apiKey:import.meta.env.VITE_GEMINI_API_KEY});

/**
 * Creates a prompt for the Gemini model, including all previous messages
 * and context for a focused, agricultural response.
 */
const createAgriculturalPrompt = (
  userMessage: string,
  context: { hasImage?: boolean; language?: string; isPaidUser?: boolean }
): string => {
  // A system instruction is crucial for guiding the model's behavior.
  const systemInstruction = `You are Yaung Chi, an expert agricultural assistant focused on Myanmar farming practices. 
    Respond in a helpful, knowledgeable, and concise manner. Base your advice on modern, sustainable agriculture.
    
    Context:
    - User message language: ${context.language || 'en'}
    - User is ${context.isPaidUser ? 'a paid' : 'a free'} user. 
    ${context.hasImage ? '- The user has provided an image for analysis. Incorporate visual analysis into your response.' : ''}
    
    If the user is NOT a paid user and is asking for detailed diagnosis (disease, pest identification with image), 
    provide general, safe advice and gently promote the 'Premium' upgrade for specific treatment plans.
    
    ALWAYS format your response with headings and bullet points for readability.`;

  return `${systemInstruction}\n\nUser Query: ${userMessage}`;
};

/**
 * Fetches the AI response content from the Gemini model.
 * In a real app, you would pass the entire conversation history to maintain context.
 */
export const getGeminiResponse = async (
  messages: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
  context: { hasImage?: boolean; language?: string; isPaidUser?: boolean }
): Promise<string> => {
  try {
    // Convert 'user' and 'assistant' roles to 'user' and 'model' for the Gemini API
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Add the current user message
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    // The entire context is passed as the first message's system instruction
    const systemInstruction = createAgriculturalPrompt(userMessage, context);
    
    // Call the model
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // A fast and capable model for chat
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return response.text.trim();
  } catch (error) {
    console.error('Error fetching response from Gemini API:', error);
    return `Sorry, I'm currently having trouble connecting to the AI service. Please try again in a moment. (Error: ${error.message})`;
  }
};