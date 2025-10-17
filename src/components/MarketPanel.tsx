import { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { getMarketPrices, getMarketLocations, MarketPrice } from '../services/marketService';

export default function MarketPanel() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('Naypyidaw Market');
  const locations = getMarketLocations();

  useEffect(() => {
    loadPrices();
  }, [selectedLocation]);

  const loadPrices = async () => {
    setLoading(true);
    const data = await getMarketPrices(selectedLocation);
    setPrices(data);
    setLoading(false);
  };

  // Adjusted formatPrice to remove fixed(2) since MMK prices are large integers
  const formatPrice = (price: number) => {
    return Math.round(price).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Market Prices</h2>
          <button
            onClick={loadPrices}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
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

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Market Insights</h4>
              <p className="text-sm text-blue-800">
                
                Prices updated daily. Best selling times are typically early morning. Consider storing crops if current prices are below average.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prices.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {item.product_name}
                  </h3>
                  <p className="text-xs text-gray-500">{item.unit}</p>
                </div>
                <div className="text-2xl">
                  {getProductIcon(item.product_name)}
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-bold text-green-600">
                  {formatPrice(item.price)}
                </span>
                <span className="text-sm text-gray-600">{item.currency}</span>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{item.market_location}</span>
                  <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {prices.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p>No market prices available for this location</p>
          </div>
        )}

        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-5">
          <h4 className="font-semibold text-green-900 mb-3">💰 Pricing Tips</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-green-800">
            <div>
              <p className="font-medium mb-1">Maximize Profit:</p>
              <ul className="space-y-1 ml-4">
                <li>• Sell during off-peak seasons</li>
                <li>• Grade produce for better prices</li>
                <li>• Consider direct sales to consumers</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Storage Strategy:</p>
              <ul className="space-y-1 ml-4">
                <li>• Store when prices are low</li>
                <li>• Monitor market trends regularly</li>
                <li>• Use proper storage to maintain quality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getProductIcon(productName: string): string {
  const lower = productName.toLowerCase();
  if (lower.includes('rice')) return '🌾';
  if (lower.includes('corn')) return '🌽';
  if (lower.includes('tomato')) return '🍅';
  if (lower.includes('onion')) return '🧅';
  if (lower.includes('potato')) return '🥔';
  if (lower.includes('cabbage')) return '🥬';
  if (lower.includes('chili') || lower.includes('pepper')) return '🌶️';
  if (lower.includes('bean')) return '🫘';
  if (lower.includes('peanut')) return '🥜';
  return '🌱';
}