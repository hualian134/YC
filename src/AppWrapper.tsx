import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import App from './App';

export default function AppWrapper() {
  const { user, loading, login } = useAuth();
  const { t } = useLanguage();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🌾</div>
          <div className="text-gray-600">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authMode === 'register') {
      return (
        <RegisterPage
          onSuccess={login}
          onSwitchToLogin={() => setAuthMode('login')}
        />
      );
    } else {
      return (
        <LoginPage
          onSuccess={login}
          onSwitchToRegister={() => setAuthMode('register')}
        />
      );
    }
  }

  return <App />;
}
