import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  conversations: {
    id: string;
    user_id: string;
    title: string;
    language: string;
    created_at: string;
    updated_at: string;
  };
  messages: {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
    image_url?: string;
    audio_url?: string;
    metadata?: Record<string, any>;
    created_at: string;
  };
  weather_data: {
    id: string;
    location: string;
    temperature?: number;
    condition?: string;
    humidity?: number;
    wind_speed?: number;
    forecast?: any[];
    fetched_at: string;
    valid_until: string;
  };
  market_prices: {
    id: string;
    product_name: string;
    price: number;
    unit: string;
    market_location: string;
    currency: string;
    updated_at: string;
  };
};
