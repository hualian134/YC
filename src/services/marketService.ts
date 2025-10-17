import { supabase } from '../lib/supabase';

export interface MarketPrice {
  id: string;
  product_name: string;
  price: number;
  unit: string;
  market_location: string;
  currency: string;
  updated_at: string;
}

export const getMarketPrices = async (location?: string): Promise<MarketPrice[]> => {
  let query = supabase
    .from('market_prices')
    .select('*')
    .order('updated_at', { ascending: false });

  if (location) {
    query = query.eq('market_location', location);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching market prices:', error);
  }

  // Only return REAL data if it exists. Otherwise, fall back to mock data.
  if (data && data.length > 0) {
    return data;
  }

  // FALLBACK: If no data or an error occurred, use mock data.
  return generateMockPrices(location);
};

const generateMockPrices = async (location?: string): Promise<MarketPrice[]> => {
  
  const products = [
    { name: 'Rice (White)', basePrice: 90000, unit: 'per bag (50kg)' }, // ~90,000 MMK per 50kg bag
    { name: 'Rice (Sticky)', basePrice: 120000, unit: 'per bag (50kg)' }, // ~120,000 MMK per 50kg bag
    { name: 'Corn', basePrice: 20000, unit: 'per bag (40kg)' }, // ~20,000 MMK per 40kg bag
    { name: 'Tomatoes', basePrice: 4000, unit: 'per viss (approx. 1.63kg)' }, // ~4,000 MMK per viss
    { name: 'Onions', basePrice: 2900, unit: 'per viss (approx. 1.63kg)' }, // ~2,900 MMK per viss
    { name: 'Potatoes', basePrice: 2400, unit: 'per viss (approx. 1.63kg)' }, // ~2,400 MMK per viss
    { name: 'Cabbage', basePrice: 1300, unit: 'per viss (approx. 1.63kg)' }, // ~1,300 MMK per viss
    { name: 'Chili Peppers', basePrice: 9800, unit: 'per viss (approx. 1.63kg)' }, // ~9,800 MMK per viss
    { name: 'Beans (Green)', basePrice: 5700, unit: 'per viss (approx. 1.63kg)' }, // ~5,700 MMK per viss
    { name: 'Peanuts', basePrice: 8150, unit: 'per viss (approx. 1.63kg)' }, // ~8,150 MMK per viss
  ];

  const locations = ['Yangon Central Market', 'Mandalay Market', 'Naypyidaw Market'];
  const targetLocation = location || locations[0];

  const mockPrices = products.map((product, index) => ({
    id: `mock_${targetLocation.replace(/\s/g, '_')}_${index}`, // Added a mock ID
    product_name: product.name,
    // Add a slight random variance for a more realistic feel
    price: product.basePrice * (1.0 + (Math.random() - 0.5) * 0.05), // Price variation between 97.5% and 102.5% of base
    unit: product.unit,
    market_location: targetLocation,
    currency: 'MMK',
    updated_at: new Date().toISOString(),
  }));

// --- TEMPORARILY COMMENTED OUT FOR TESTING MOCK DATA CHANGES ---
  // The original logic would insert the mock data, and subsequent calls 
  // would retrieve the inserted data, ignoring new mock changes.
  
  const { data, error } = await supabase
    .from('market_prices')
    .insert(mockPrices)
    .select();

  if (error) {
    console.error('Error saving market prices:', error);
    // If insertion fails, return the generated mock data with temporary IDs
    return mockPrices.map((p, i) => ({ ...p, id: `temp_${i}`, updated_at: new Date().toISOString() }));
  }

  // Return the newly inserted data
  return data || []; 


  // --- NEW LOGIC: Just return the generated mock data for direct testing ---
  //return mockPrices;
};

export const getMarketLocations = (): string[] => {
  return ['Naypyidaw Market','Yangon Central Market', 'Mandalay Market',  'Bago Market', 'Sagaing Market'];
};