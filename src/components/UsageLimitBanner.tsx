import { Crown, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { UsageLimits } from '../services/usageService';

interface UsageLimitBannerProps {
  usage: UsageLimits;
  onUpgrade: () => void;
}

export default function UsageLimitBanner({ usage, onUpgrade }: UsageLimitBannerProps) {
  const { t } = useLanguage();

  if (usage.isPaidUser) return null;

  if (!usage.canSendMessage) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">
              {t.subscription.limitReached}
            </h4>
            <p className="text-sm text-red-700 mb-3">
              {t.subscription.upgradePrompt}
            </p>
            <button
              onClick={onUpgrade}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <Crown className="w-4 h-4" />
              {t.subscription.upgradeToPremium}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (usage.remainingMessages <= 5) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              {usage.remainingMessages} {t.subscription.messagesRemaining}
            </span>
          </div>
          <button
            onClick={onUpgrade}
            className="text-sm text-yellow-700 hover:text-yellow-800 font-medium underline"
          >
            {t.subscription.upgrade}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
