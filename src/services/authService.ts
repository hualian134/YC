import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  phone_number: string;
  name: string;
  is_verified: boolean;
  language_preference: string;
  created_at: string;
  last_login_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: 'free' | 'paid';
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
  payment_reference: string | null;
}

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationCode = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { error } = await supabase
      .from('verification_codes')
      .insert({
        phone_number: phoneNumber,
        code,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      });

    if (error) throw error;

    console.log(`Verification code for ${phoneNumber}: ${code}`);

    return { success: true };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return { success: false, error: 'Failed to send verification code' };
  }
};

export const verifyCode = async (
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('code', code)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    console.log(data);
    if (!data) {
      return { success: false, error: 'Invalid or expired verification code' };
    }

    await supabase
      .from('verification_codes')
      .update({ is_used: true })
      .eq('id', data.id);

    return { success: true };
  } catch (error) {
    console.error('Error verifying code:', error);
    return { success: false, error: 'Verification failed' };
  }
};

export const registerUser = async (
  phoneNumber: string,
  name: string,
  code: string
): Promise<{ user?: User; error?: string }> => {
  try {
    const verification = await verifyCode(phoneNumber, code);
    if (!verification.success) {
      return { error: verification.error };
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (existingUser) {
      return { error: 'User already exists with this phone number' };
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        phone_number: phoneNumber,
        name,
        is_verified: true,
        language_preference: 'en',
      })
      .select()
      .single();

    if (error) throw error;

    return { user: newUser };
  } catch (error) {
    console.error('Error registering user:', error);
    return { error: 'Registration failed' };
  }
};

export const loginUser = async (
  phoneNumber: string,
  code: string
): Promise<{ user?: User; error?: string }> => {
  try {
    const verification = await verifyCode(phoneNumber, code);
    if (!verification.success) {
      return { error: verification.error };
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return { error: 'User not found. Please register first.' };
    }

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    return { user };
  } catch (error) {
    console.error('Error logging in:', error);
    return { error: 'Login failed' };
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const updateUserLanguage = async (
  userId: string,
  language: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ language_preference: language })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating language:', error);
    return { success: false, error: 'Failed to update language' };
  }
};

export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
};
