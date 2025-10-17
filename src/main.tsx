import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppWrapper from './AppWrapper.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <AppWrapper />
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>
);
