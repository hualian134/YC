import { supabase } from '../lib/supabase';
import { getGeminiResponse } from '../lib/gemini';


export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
  audio_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export const uploadImageAndGetUrl = async (file: File): Promise<string | null> => {
  try {
    
    //const fileExtension = file.name.split('.').pop();
    const filePath = `${Date.now()}.${file.name}`;
    //const filePath = `${Date.now()}-${file.name.replace(/ /g, '_')}`;
    //const filePath = `Gemini_Generated_Image_8nuyxy8nuyxy8nuy.jpg`;
    // console.log('Uploading file to path:', filePath);
    // console.log('📁 Upload details:', {
    //   file:file,
    //   originalName: file.name,
    //   newFileName: filePath,
    //   filePath: filePath,
    //   fileSize: file.size,
    //   fileType: file.type
    // });
    const { error: uploadError } = await supabase.storage
      .from('chat-images') // Ensure you have a bucket named 'chat-images'
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('chat-images') // Ensure you have a bucket named 'chat-images'
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;

  } catch (e) {
    console.error('Unexpected error during image upload:', e);
    return null;
  }
};

export const createConversation = async (userId: string, language: string = 'en'): Promise<Conversation | null> => {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      user_id_fk: userId,
      title: 'New Conversation',
      language,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data;
};

export const getConversations = async (userId: string): Promise<Conversation[]> => {

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id_fk', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return data || [];
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
};

export const sendMessage = async (
  conversationId: string,
  content: string,
  imageUrl?: string,
  audioUrl?: string
): Promise<Message | null> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content,
      image_url: imageUrl,
      audio_url: audioUrl,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
};

export const generateAIResponse = async (
  conversationId: string,
  userMessage: string,
  context?: { hasImage?: boolean; language?: string; isPaidUser?: boolean }
): Promise<Message | null> => {
  
  // 1. Fetch the conversation history to provide context to the AI
  const messageHistory = await getMessages(conversationId);
  
  // 2. Prepare the history for the Gemini API call
  // We only need the 'role' and 'content' for the AI's chat history
  const historyForGemini = messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
      imageUrl: msg.image_url,
  }));
  
  // 3. Get the AI-generated response content
  const responseContent = await getGeminiResponse(
    historyForGemini,
    userMessage,
    context || {}
  );
  
  // 4. Insert the new AI message into Supabase
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: responseContent,
      // Note: A real implementation might also handle image generation/storage here
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating AI response:', error);
    return null;
  }

  // 5. Log the query for analytics
  await supabase
    .from('query_analytics')
    .insert({
      query_type: detectQueryType(userMessage),
      language: context?.language || 'en',
      success: true,
      response_time: Math.random() * 1000 + 500, // Placeholder for actual response time calculation
    });

  return data;
};

const detectQueryType = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('disease')) return 'disease';
  if (lowerMessage.includes('pest') || lowerMessage.includes('insect')) return 'pest';
  if (lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrition')) return 'fertilizer';
  if (lowerMessage.includes('weather')) return 'weather';
  if (lowerMessage.includes('price') || lowerMessage.includes('market')) return 'market';
  return 'general';
};

export const updateConversationTitle = async (conversationId: string, title: string): Promise<void> => {
  await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId);
};
