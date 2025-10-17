import { supabase } from '../lib/supabase';

export interface WeatherData {
  id: string;
  location: string;
  temperature?: number;
  condition?: string;
  humidity?: number;
  wind_speed?: number;
  forecast?: any[];
  fetched_at: string;
  valid_until: string;
}

// export const getWeatherData = async (location: string): Promise<WeatherData | null> => {
//   const { data, error } = await supabase
//     .from('weather_data')
//     .select('*')
//     .eq('location', location)
//     .gt('valid_until', new Date().toISOString())
//     .order('fetched_at', { ascending: false })
//     .limit(1)
//     .maybeSingle();

//   if (error && error.code !== 'PGRST116') {
//     console.error('Error fetching weather:', error);
//   }

//   if (data) {
//     return data;
//   }

//   return generateMockWeather(location);
// };

// const generateMockWeather = async (location: string): Promise<WeatherData | null> => {
//   const mockData = {
//     location,
//     temperature: Math.round(20 + Math.random() * 15),
//     condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
//     humidity: Math.round(40 + Math.random() * 40),
//     wind_speed: Math.round(5 + Math.random() * 15),
//     forecast: Array.from({ length: 7 }, (_, i) => ({
//       day: new Date(Date.now() + i * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
//       temp_high: Math.round(20 + Math.random() * 15),
//       temp_low: Math.round(10 + Math.random() * 10),
//       condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Rain'][Math.floor(Math.random() * 5)],
//     })),
//   };

//   const { data, error } = await supabase
//     .from('weather_data')
//     .insert(mockData)
//     .select()
//     .maybeSingle();

//   if (error) {
//     console.error('Error saving weather data:', error);
//     return { ...mockData, id: 'temp', fetched_at: new Date().toISOString(), valid_until: new Date(Date.now() + 3600000).toISOString() };
//   }

//   return data;
// };

// Replace this with your actual OpenWeatherMap API Key
const OPENWEATHER_API_KEY = '9a9cb979a0fd99ca19bc1ff5b6f491b9'; 
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const CACHE_DURATION_MS = 3600000; // 1 hour

// Helper type for OpenWeather current response (simplified)
interface OpenWeatherCurrent {
    name: string;
    main: {
        temp: number;
        humidity: number;
        temp_min: number;
        temp_max: number;
    };
    wind: {
        speed: number;
    };
    weather: Array<{
        main: string;
        description: string;
    }>;
}

// Helper type for OpenWeather 5-day forecast response (simplified)
interface OpenWeatherForecast {
    list: Array<{
        dt: number; // Time of data forecasted, unix, UTC
        main: {
            temp_min: number;
            temp_max: number;
        };
        weather: Array<{
            main: string;
        }>;
    }>;
}
const fetchAndMapWeather = async (location: string): Promise<WeatherData | null> => {
    try {
        // --- 1. Fetch Current Weather ---
        const currentWeatherUrl = `${OPENWEATHER_BASE_URL}/weather?q=${location}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const currentResponse = await fetch(currentWeatherUrl);
        
        if (!currentResponse.ok) {
            if (currentResponse.status === 404) {
                console.warn(`Location not found: ${location}`);
                return null;
            }
            throw new Error(`OpenWeather current API failed with status ${currentResponse.status}`);
        }

        const currentData: OpenWeatherCurrent = await currentResponse.json();
        
        // --- 2. Fetch 5-Day Forecast ---
        const forecastUrl = `${OPENWEATHER_BASE_URL}/forecast?q=${location}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData: OpenWeatherForecast = forecastResponse.ok ? await forecastResponse.json() : { list: [] };

        // Process forecast to get daily high/lows (simplistic daily aggregation)
        const dailyForecastMap = new Map<string, { temp_high: number, temp_low: number, conditions: string[] }>();

        for (const item of forecastData.list) {
            const dateKey = new Date(item.dt * 1000).toLocaleDateString();
            const dayOfWeek = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
            const condition = item.weather[0]?.main || 'Unknown';

            if (!dailyForecastMap.has(dateKey)) {
                dailyForecastMap.set(dateKey, {
                    temp_high: item.main.temp_max,
                    temp_low: item.main.temp_min,
                    conditions: [condition]
                });
            } else {
                const existing = dailyForecastMap.get(dateKey)!;
                existing.temp_high = Math.max(existing.temp_high, item.main.temp_max);
                existing.temp_low = Math.min(existing.temp_low, item.main.temp_min);
                if (!existing.conditions.includes(condition)) {
                     existing.conditions.push(condition);
                }
            }
        }
        
        // Map to your WeatherData interface
        const forecast: any[] = Array.from(dailyForecastMap).map(([dateKey, data]) => ({
            day: new Date(dateKey).toLocaleDateString('en-US', { weekday: 'short' }),
            temp_high: Math.round(data.temp_high),
            temp_low: Math.round(data.temp_low),
            condition: data.conditions[0] // Use the first condition for simplicity
        }));

        const now = new Date();
        const validUntil = new Date(now.getTime() + CACHE_DURATION_MS);

        return {
            // Using a unique temporary ID, since the data isn't from Supabase yet
            id: currentData.name.toLowerCase().replace(/\s/g, '-') + '-' + now.getTime(),
            location: currentData.name,
            temperature: Math.round(currentData.main.temp),
            condition: currentData.weather[0]?.description || currentData.weather[0]?.main,
            humidity: currentData.main.humidity,
            wind_speed: currentData.wind.speed,
            forecast: forecast.slice(0, 7), // Limit to 7 days
            fetched_at: now.toISOString(),
            valid_until: validUntil.toISOString(),
        };

    } catch (error) {
        console.error('Error fetching data from OpenWeatherMap:', error);
        return null;
    }
};

// Renamed from generateMockWeather
const cacheNewWeather = async (weatherData: WeatherData): Promise<WeatherData> => {
    // 1. Remove the temporary ID field before insertion
    const { id, ...dataToInsert } = weatherData; 
    
    // 2. Insert the real fetched data into Supabase
    const { data, error } = await supabase
        .from('weather_data')
        .insert(dataToInsert)
        .select()
        .maybeSingle();

    if (error) {
        console.error('Error saving weather data to Supabase:', error);
        // Fallback: return the data we fetched, but with a temporary ID
        return { ...weatherData, id: 'temp-fallback-' + new Date().getTime() }; 
    }

    // 3. Return the data as stored in Supabase
    return data;
};


export const getWeatherData = async (location: string): Promise<WeatherData | null> => {
    // --- 1. Check Supabase Cache for a valid entry ---
    const { data: cachedData, error: cacheError } = await supabase
        .from('weather_data')
        .select('*')
        .eq('location', location)
        .gt('valid_until', new Date().toISOString()) // Check if cache is still valid
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Ignore 'no rows found' error (PGRST116)
    if (cacheError && cacheError.code !== 'PGRST116') {
        console.error('Error fetching weather cache:', cacheError);
    }

    if (cachedData) {
        // Cache hit: return the data directly
        return cachedData; 
    }

    // --- 2. Cache Miss: Fetch Real Data from OpenWeatherMap ---
    const realWeather = await fetchAndMapWeather(location);

    if (realWeather) {
        // --- 3. Save the new real data to Supabase and return it ---
        return cacheNewWeather(realWeather);
    }

    return null;
};

export const getSampleLocations = (): string[] => {
  return ['Yangon', 'Mandalay', 'Naypyidaw', 'Bago', 'Sagaing','Ayeyarwady', 'Magway', 'Tanintharyi', 'Kachin', 'Kayah', 'Kayin', 'Chin', 'Mon', 'Rakhine'];
};
