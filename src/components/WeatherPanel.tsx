import { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Loader2, MapPin } from 'lucide-react';
import { getWeatherData, getSampleLocations, WeatherData } from '../services/weatherService';

export default function WeatherPanel() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('Yangon');
  const locations = getSampleLocations();

  useEffect(() => {
    loadWeather();
  }, [selectedLocation]);

  const loadWeather = async () => {
    setLoading(true);
    const data = await getWeatherData(selectedLocation);
    setWeather(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Unable to load weather data</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Weather Forecast</h2>

          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-500" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white mb-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-3xl font-bold mb-2">{weather.location}</h3>
              <p className="text-xl opacity-90">{weather.condition}</p>
            </div>
            <div className="text-right">
              <div className="text-6xl font-bold">{weather.temperature}°C</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="flex items-center gap-2">
              <Cloud className="w-6 h-6" />
              <div>
                <p className="text-xs opacity-75">Condition</p>
                <p className="font-semibold">{weather.condition}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-6 h-6" />
              <div>
                <p className="text-xs opacity-75">Humidity</p>
                <p className="font-semibold">{weather.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-6 h-6" />
              <div>
                <p className="text-xs opacity-75">Wind</p>
                <p className="font-semibold">{weather.wind_speed} km/h</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">7-Day Forecast</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {weather.forecast?.map((day: any, index: number) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow"
              >
                <p className="font-semibold text-gray-900 mb-2">{day.day}</p>
                <p className="text-3xl mb-2">{getWeatherIcon(day.condition)}</p>
                <p className="text-xs text-gray-600 mb-2">{day.condition}</p>
                <div className="flex justify-center gap-2 text-sm">
                  <span className="font-semibold text-gray-900">{day.temp_high}°</span>
                  <span className="text-gray-500">{day.temp_low}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="font-semibold text-green-900 mb-2">🌾 Farming Tips</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Check weather before irrigation to optimize water usage</li>
            <li>• Avoid spraying pesticides before rain</li>
            <li>• Plan harvesting during dry weather periods</li>
            <li>• Protect crops before extreme temperature changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function getWeatherIcon(condition: string): string {
  const lower = condition.toLowerCase();
  if (lower.includes('sun')) return '☀️';
  if (lower.includes('rain')) return '🌧️';
  if (lower.includes('cloud')) return '☁️';
  if (lower.includes('storm')) return '⛈️';
  return '🌤️';
}
