import { useState, useEffect } from 'react';
import { MessageSquare, Cloud, TrendingUp, Menu, X, User as UserIcon, Crown } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import WeatherPanel from './components/WeatherPanel';
import MarketPanel from './components/MarketPanel';
import Sidebar from './components/Sidebar';
import LanguageSwitcher from './components/LanguageSwitcher';
import UserProfile from './components/UserProfile';
import SubscriptionPage from './components/SubscriptionPage';
import {
  createConversation,
  getConversations,
  updateConversationTitle,
  Conversation,
} from './services/chatService';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import { getUserSubscription, Subscription } from './services/authService';

type Tab = 'chat' | 'weather' | 'market' | 'subscription';

function App() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    loadConversations();
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    const sub = await getUserSubscription(user.id);
    setSubscription(sub);
  };

  const loadConversations = async () => {
    if (!user) return;
    const data = await getConversations(user.id);
    setConversations(data);

    if (data.length > 0 && !activeConversationId) {
      setActiveConversationId(data[0].id);
    }
  };

  const handleNewConversation = async () => {
    if (!user) return;
    const newConv = await createConversation(user.id, user.language_preference);
    if (newConv) {
      setConversations([newConv, ...conversations]);
      setActiveConversationId(newConv.id);
      setActiveTab('chat');
      setSidebarOpen(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await supabase.from('conversations').delete().eq('id', id);

    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);

    if (activeConversationId === id) {
      setActiveConversationId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setActiveTab('chat');
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (activeConversationId && activeTab === 'chat') {
      const conversation = conversations.find((c) => c.id === activeConversationId);
      if (conversation && conversation.title === 'New Conversation') {
        const timer = setTimeout(async () => {
          const messages = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', activeConversationId)
            .eq('role', 'user')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (messages.data) {
            const title = messages.data.content.slice(0, 40) + (messages.data.content.length > 40 ? '...' : '');
            await updateConversationTitle(activeConversationId, title);
            loadConversations();
          }
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [activeConversationId, conversations, activeTab]);

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-green-500 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              {/* <div className="text-3xl">🌾</div> */}
              <div className="text-6xl mb-4" style={{ display: 'flex', alignItems: 'center', height: '5vh' }}>

                        <img src='src/images/logo.png' alt="yaung chi"style={{ width: '45px', height: '45px', }}/>
                        
              {/* </div>
              <div> */}
                <h1 className="text-2xl font-bold">{t.appName}</h1>
                {/* <p className="text-xs text-green-100">{t.appTagline}</p> */}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-500 transition-colors text-white"
              >
                {subscription?.tier === 'paid' && <Crown className="w-4 h-4 text-yellow-300" />}
                <UserIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <nav className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setActiveTab('chat');
                if (!activeConversationId && conversations.length === 0) {
                  handleNewConversation();
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'chat'
                  ? 'bg-white text-green-700 font-semibold'
                  : 'text-white hover:bg-green-500'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">{t.nav.chat}</span>
            </button>
            <button
              onClick={() => setActiveTab('weather')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'weather'
                  ? 'bg-white text-green-700 font-semibold'
                  : 'text-white hover:bg-green-500'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span className="text-sm">{t.nav.weather}</span>
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'market'
                  ? 'bg-white text-green-700 font-semibold'
                  : 'text-white hover:bg-green-500'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">{t.nav.marketPrices}</span>
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'subscription'
                  ? 'bg-white text-green-700 font-semibold'
                  : 'text-white hover:bg-green-500'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span className="text-sm">{t.nav.subscription}</span>
            </button>
          </nav>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } lg:block fixed lg:relative inset-0 lg:inset-auto z-40 lg:z-0 bg-black bg-opacity-50 lg:bg-transparent`}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="h-full w-64 bg-white lg:bg-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            {activeTab === 'chat' && (
              <Sidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                onDeleteConversation={handleDeleteConversation}
              />
            )}
          </div>
        </div>

        <main className="flex-1 overflow-hidden bg-gray-50">
          {activeTab === 'chat' && (
            <>
              {activeConversationId ? (
                <ChatInterface conversationId={activeConversationId} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🌾</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.chat.welcome}</h2>
                    <p className="text-gray-600 mb-6">{t.chat.welcomeMessage}</p>
                    <button
                      onClick={handleNewConversation}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                    >
                      {t.chat.startNewChat}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {activeTab === 'weather' && <WeatherPanel />}
          {activeTab === 'market' && <MarketPanel />}
          {activeTab === 'subscription' && <SubscriptionPage />}
        </main>
      </div>

      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
    </div>
  );
}

export default App;
