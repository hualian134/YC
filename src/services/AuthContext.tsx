import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getUserById } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      loadUser(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (userId: string) => {
    try {
      const userData = await getUserById(userId);
      if (userData) {
        setUser(userData);
      } else {
        localStorage.removeItem('userId');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('userId');
    } finally {
      setLoading(false);
    }
  };

  const login = async (userId: string) => {
    localStorage.setItem('userId', userId);
    await loadUser(userId);
  };

  const logout = () => {
    localStorage.removeItem('userId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
