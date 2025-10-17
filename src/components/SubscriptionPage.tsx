import { useState, useEffect } from 'react';
import { Crown, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserSubscription, Subscription } from '../services/authService';
import { checkUsageLimits, UsageLimits } from '../services/usageService';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    setLoading(true);
    const [subData, usageData] = await Promise.all([
      getUserSubscription(user.id),
      checkUsageLimits(user.id),
    ]);

    setSubscription(subData);
    setUsage(usageData);
    setLoading(false);
  };

  const isPaid = subscription?.tier === 'paid';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t.common.loading}</div>
      </div>
    );
  }

  return (
    //<div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4 overflow-y-auto">
    <div className="h-full bg-gradient-to-br from-green-50 to-green-100 py-12 px-4 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t.subscription.currentPlan}
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
            {isPaid && <Crown className="w-5 h-5 text-yellow-500" />}
            <span className="font-semibold text-lg">
              {isPaid ? t.subscription.paid : t.subscription.free}
            </span>
          </div>
        </div>

        {!isPaid && usage && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t.subscription.usageTitle}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  {t.subscription.messagesRemaining}
                </span>
                <span className="font-semibold text-green-600">
                  {usage.remainingMessages} / 20
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${(usage.remainingMessages / 20) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div
            className={`bg-white rounded-2xl shadow-lg p-8 ${
              !isPaid ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t.subscription.freeFeatures.title}
              </h2>
              <div className="text-3xl font-bold text-gray-900">
                {t.subscription.free}
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  {t.subscription.freeFeatures.feature1}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  {t.subscription.freeFeatures.feature2}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  {t.subscription.freeFeatures.feature3}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  {t.subscription.freeFeatures.feature4}
                </span>
              </li>
            </ul>

            {!isPaid && (
              <div className="text-center text-sm text-green-600 font-medium">
                {t.subscription.currentPlan}
              </div>
            )}
          </div>

          <div
            className={`bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl shadow-lg p-8 ${
              isPaid ? 'ring-2 ring-yellow-500' : ''
            }`}
          >
            <div className="text-center mb-6">
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t.subscription.paidFeatures.title}
              </h2>
              <div className="text-3xl font-bold text-gray-900">
                {t.subscription.paid}
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  {t.subscription.paidFeatures.feature1}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  {t.subscription.paidFeatures.feature2}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  {t.subscription.paidFeatures.feature3}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  {t.subscription.paidFeatures.feature4}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  {t.subscription.paidFeatures.feature5}
                </span>
              </li>
            </ul>

            {isPaid ? (
              <div className="text-center text-sm text-yellow-600 font-medium">
                {t.subscription.currentPlan}
              </div>
            ) : (
              <button className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition-colors font-semibold">
                {t.subscription.upgradeToPremium}
              </button>
            )}
          </div>
        </div>

        {!isPaid && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-700 mb-4">{t.subscription.upgradePrompt}</p>
          </div>
        )}
      </div>
    </div>
  );
}
