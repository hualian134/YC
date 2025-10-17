import { useState, useEffect } from 'react';
import { User as UserIcon, Phone, Globe, Crown, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserSubscription, Subscription } from '../services/authService';

interface UserProfileProps {
  onClose: () => void;
}

export default function UserProfile({ onClose }: UserProfileProps) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    const sub = await getUserSubscription(user.id);
    setSubscription(sub);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!user) return null;

  const isPaid = subscription?.tier === 'paid';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            {isPaid && <Crown className="w-4 h-4 text-yellow-500" />}
            <span
              className={`text-sm font-medium ${
                isPaid ? 'text-yellow-600' : 'text-gray-600'
              }`}
            >
              {isPaid ? t.subscription.paid : t.subscription.free}
            </span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-gray-600" />
            <div>
              <div className="text-xs text-gray-500">{t.profile.phone}</div>
              <div className="font-medium text-gray-900">{user.phone_number}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Globe className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">{t.profile.language}</div>
              <div className="font-medium text-gray-900">
                {language === 'en' ? 'English' : 'မြန်မာ'}
              </div>
            </div>
            <button
              onClick={() => setLanguage(language === 'en' ? 'my' : 'en')}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              {t.common.change || 'Change'}
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <div className="text-xs text-gray-500">{t.profile.memberSince}</div>
              <div className="font-medium text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            {t.auth.logout}
          </button>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
}
