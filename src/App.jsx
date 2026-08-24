import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { CurrencyProvider } from './context/CurrencyContext';
import AppRouter from './routes/AppRouter';
import FormRefreshGuard from './components/core/FormRefreshGuard';
import './App.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <CurrencyProvider>
            <BookingProvider>
              <div className="min-h-screen bg-[#F8F9FA]">
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 4000,
                    style: { maxWidth: 'min(360px, calc(100vw - 2rem))' },
                  }}
                />
                <FormRefreshGuard />
                <AppRouter />
              </div>
            </BookingProvider>
          </CurrencyProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
