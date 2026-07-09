import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import AppRouter from './routes/AppRouter';
import './App.css';

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingProvider>
          <Toaster position="top-right" />
          <AppRouter />
        </BookingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
