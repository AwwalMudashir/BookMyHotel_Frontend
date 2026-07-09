import { createContext, useContext, useMemo, useState } from 'react';

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [booking, setBooking] = useState({
    roomId: null,
    dates: {},
    services: [],
    promo: null,
    total: 0,
  });

  const value = useMemo(() => ({ booking, setBooking }), [booking]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBookingContext = () => {
  const context = useContext(BookingContext);
  if (!context) { throw new Error('useBookingContext must be used within a BookingProvider'); }
  return context;
};

export default BookingContext;
