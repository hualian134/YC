import { supabase } from '../lib/supabase';
import { getUserSubscription } from './authService';

export interface UsageStats {
  message_count: number;
  weather_queries: number;
  market_queries: number;
  date: string;
}

export interface UsageLimits {
  canSendMessage: boolean;
  canQueryWeather: boolean;
  canQueryMarket: boolean;
  remainingMessages: number;
  isPaidUser: boolean;
}

const FREE_TIER_LIMITS = {
  DAILY_MESSAGES: 20,
  DAILY_WEATHER_QUERIES: 10,
  DAILY_MARKET_QUERIES: 10,
};

export const getTodayUsage = async (userId: string): Promise<UsageStats | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      const { data: newUsage, error: insertError } = await supabase
        .from('user_usage')
        .insert({
          user_id: userId,
          date: today,
          message_count: 0,
          weather_queries: 0,
          market_queries: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return newUsage;
    }

    return data;
  } catch (error) {
    console.error('Error fetching usage:', error);
    return null;
  }
};

export const checkUsageLimits = async (userId: string): Promise<UsageLimits> => {
  try {
    const subscription = await getUserSubscription(userId);
    const isPaidUser = subscription?.tier === 'paid';

    if (isPaidUser) {
      return {
        canSendMessage: true,
        canQueryWeather: true,
        canQueryMarket: true,
        remainingMessages: -1,
        isPaidUser: true,
      };
    }

    const usage = await getTodayUsage(userId);

    if (!usage) {
      return {
        canSendMessage: false,
        canQueryWeather: false,
        canQueryMarket: false,
        remainingMessages: 0,
        isPaidUser: false,
      };
    }

    const remainingMessages = Math.max(0, FREE_TIER_LIMITS.DAILY_MESSAGES - usage.message_count);

    return {
      canSendMessage: usage.message_count < FREE_TIER_LIMITS.DAILY_MESSAGES,
      canQueryWeather: usage.weather_queries < FREE_TIER_LIMITS.DAILY_WEATHER_QUERIES,
      canQueryMarket: usage.market_queries < FREE_TIER_LIMITS.DAILY_MARKET_QUERIES,
      remainingMessages,
      isPaidUser: false,
    };
  } catch (error) {
    console.error('Error checking usage limits:', error);
    return {
      canSendMessage: false,
      canQueryWeather: false,
      canQueryMarket: false,
      remainingMessages: 0,
      isPaidUser: false,
    };
  }
};

export const incrementMessageCount = async (userId: string): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: usage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (usage) {
      const { error } = await supabase
        .from('user_usage')
        .update({
          message_count: usage.message_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', usage.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_usage')
        .insert({
          user_id: userId,
          date: today,
          message_count: 1,
          weather_queries: 0,
          market_queries: 0,
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error incrementing message count:', error);
    return false;
  }
};

export const incrementWeatherQueryCount = async (userId: string): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: usage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (usage) {
      const { error } = await supabase
        .from('user_usage')
        .update({
          weather_queries: usage.weather_queries + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', usage.id);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error incrementing weather query count:', error);
    return false;
  }
};

export const incrementMarketQueryCount = async (userId: string): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: usage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (usage) {
      const { error } = await supabase
        .from('user_usage')
        .update({
          market_queries: usage.market_queries + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', usage.id);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error incrementing market query count:', error);
    return false;
  }
};
