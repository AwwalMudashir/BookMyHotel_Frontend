import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import { addDays, differenceInDays, format } from 'date-fns';
import { AlertCircle, ArrowLeft, Building2, ImageOff, MapPin, Tag, Users } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import BookingSummary from '../../components/booking/BookingSummary';
import roomApi from '../../api/roomApi';
import availabilityApi from '../../api/availabilityApi';
import serviceApi from '../../api/serviceApi';
import promotionApi from '../../api/promotionApi';
import bookingApi from '../../api/bookingApi';
import hotelApi from '../../api/hotelApi';
import { listAmenities } from '../../utils/amenities';
import RoomTagBadges from '../../components/hotel/RoomTagBadges';
import { useAuthContext } from '../../context/AuthContext';
import { useCurrency } from '../../hooks/useCurrency';
import { parseApiError } from '../../utils/parseApiError';
import Footer from '../../components/core/Footer';

const toIsoDate = (date) => format(date, 'yyyy-MM-dd');
const toLabel = (date) => format(date, 'EEE, d MMM');

const RoomDetailPage = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isHydrated } = useAuthContext();
  const authToastShown = useRef(false);
  const { currency, format: formatPrice } = useCurrency();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  const [calendarDays, setCalendarDays] = useState([]);

  const [dateRange, setDateRange] = useState([null, null]);
  const [checkIn, checkOut] = dateRange;

  const [priceInfo, setPriceInfo] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState({});

  const [promoCode, setPromoCode] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoResult, setPromoResult] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [hotelId, setHotelId] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await roomApi.getRoomById(roomId);
        if (cancelled) return;
        setRoom(data);
      } catch (err) {
        if (cancelled) return;
        setError(parseApiError(err, 'Unable to load this room right now.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [roomId]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated && !authToastShown.current) {
      authToastShown.current = true;
      toast('Log in to reserve this room — browsing is free, but booking needs an account.', { icon: '🔒' });
    }
  }, [isHydrated, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    const loadCalendar = async () => {
      try {
        const start = new Date();
        const end = addDays(start, 180);
        const data = await availabilityApi.getCalendar(roomId, toIsoDate(start), toIsoDate(end));
        if (!cancelled) setCalendarDays(data.days);
      } catch {
        if (!cancelled) setCalendarDays([]);
      }
    };
    loadCalendar();
    return () => { cancelled = true; };
  }, [roomId]);

  useEffect(() => {
    if (!room?.branchId) return;
    let cancelled = false;
    const loadServices = async () => {
      setServicesLoading(true);
      try {
        const data = await serviceApi.getBranchServices(room.branchId);
        if (!cancelled) setServices(data);
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    };
    loadServices();
    return () => { cancelled = true; };
  }, [room?.branchId]);

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    let cancelled = false;
    const loadPrice = async () => {
      setPriceLoading(true);
      setPriceError('');
      try {
        // Pass the selected display currency straight through so the backend does the
        // conversion for this one line item — more accurate than a second client-side pass.
        const data = await availabilityApi.getPrice(roomId, toIsoDate(checkIn), toIsoDate(checkOut), currency);
        if (cancelled) return;
        setPriceInfo(data);
        if (data?.isAvailable === false) {
          setPriceError('These dates are no longer available — please choose different dates.');
        }
      } catch (err) {
        if (!cancelled) setPriceError(parseApiError(err, 'Unable to price these dates.'));
      } finally {
        if (!cancelled) setPriceLoading(false);
      }
    };
    loadPrice();
    return () => { cancelled = true; };
  }, [roomId, checkIn, checkOut, currency]);

  const hasDateRange = Boolean(checkIn && checkOut);
  const activePriceInfo = hasDateRange ? priceInfo : null;
  const activePriceError = hasDateRange ? priceError : '';

  const disabledDates = useMemo(
    () => calendarDays.filter((day) => day.isAvailable === false).map((day) => new Date(day.date)),
    [calendarDays],
  );

  const minNightlyRate = useMemo(() => {
    const rates = calendarDays.map((day) => day.dailyRate).filter((rate) => typeof rate === 'number');
    if (rates.length) return Math.min(...rates);
    return room?.pricePerNight || 0;
  }, [calendarDays, room]);

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const amenities = useMemo(() => listAmenities(room?.amenities), [room]);
  const images = room?.images || [];

  // Already in the selected display currency — the price call above was made with targetCurrency set.
  const roomSubtotal = activePriceInfo?.totalPrice ?? 0;

  const handleServiceChange = (serviceId, quantity) => {
    setSelectedServices((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[serviceId];
      else next[serviceId] = quantity;
      return next;
    });
  };

  const resolveHotelId = async () => {
    if (hotelId) return hotelId;
    try {
      const { items } = await hotelApi.getAllHotels(1, 200);
      const match = items.find((hotel) => hotel.branches?.some((branch) => String(branch.id) === String(room.branchId)));
      if (match?.id) {
        setHotelId(match.id);
        return match.id;
      }
    } catch {
      return null;
    }
    return null;
  };

  const handlePromoApply = async () => {
    if (!promoCode.trim() || !nights) return;
    setPromoApplying(true);
    setPromoError('');
    try {
      const resolvedHotelId = await resolveHotelId();
      if (!resolvedHotelId) {
        setPromoError("Promo codes aren't available for this room right now.");
        return;
      }
      const data = await promotionApi.applyPromotion({
        code: promoCode.trim(),
        totalPrice: roomSubtotal,
        hotelId: resolvedHotelId,
      });
      if (!data?.promoCode) {
        setPromoError(data?.message || 'This promo code is invalid.');
        return;
      }
      setPromoResult(data);
    } catch (err) {
      setPromoError(parseApiError(err, 'Unable to validate this promo code.'));
    } finally {
      setPromoApplying(false);
    }
  };

  const handlePromoRemove = () => {
    setPromoResult(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) return;
    if (!checkIn || !checkOut) {
      toast.error('Select your check-in and check-out dates first.');
      return;
    }

    setSubmitting(true);
    try {
      const booking = await bookingApi.createBooking({
        roomId,
        checkIn: toIsoDate(checkIn),
        checkOut: toIsoDate(checkOut),
        promoCode: promoResult?.promoCode || undefined,
      });

      const serviceEntries = Object.entries(selectedServices).filter(([, quantity]) => quantity > 0);
      if (serviceEntries.length > 0) {
        await bookingApi.attachServices(
          booking.id,
          serviceEntries.map(([serviceId, quantity]) => ({ serviceId: Number(serviceId), quantity })),
        );
      }

      toast.success('Room reserved! Complete payment to confirm your stay.');
      navigate(`/payment/${booking.id}`);
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to complete this booking.'));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(isAuthenticated && checkIn && checkOut && activePriceInfo?.isAvailable !== false && !priceLoading);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#0A7C6E] transition hover:border-[#0A7C6E] hover:bg-[#E6F5F3]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {loading ? (
          <div className="space-y-6">
            <div className="h-[360px] animate-pulse rounded-[28px] bg-[#E5E7EB]" />
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                <div className="h-6 w-1/3 animate-pulse rounded-full bg-[#E5E7EB]" />
                <div className="h-8 w-2/3 animate-pulse rounded-full bg-[#E5E7EB]" />
                <div className="h-24 animate-pulse rounded-2xl bg-[#E5E7EB]" />
              </div>
              <div className="h-72 animate-pulse rounded-[28px] bg-[#E5E7EB]" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-[#F5C2C7] bg-[#FEF3F3] p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[#B42318]" />
            <h2 className="text-lg font-semibold text-[#9B1E1E]">{error}</h2>
            <button
              type="button"
              onClick={() => navigate('/search')}
              className="mt-4 inline-flex cursor-pointer rounded-2xl bg-[#0A7C6E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#065E52]"
            >
              Back to search
            </button>
          </div>
        ) : room ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-8">
              <div className="grid gap-3 sm:grid-cols-[1fr_112px]">
                <div className="relative h-[280px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#E6F5F3] to-[#DDEEFF] sm:h-[360px]">
                  {images.length > 0 ? (
                    <img src={images[activeImage]} alt={room.roomTypeName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageOff className="h-12 w-12 text-[#0A7C6E]/40" />
                    </div>
                  )}
                </div>
                {images.length > 1 ? (
                  <div className="flex gap-3 overflow-x-auto sm:flex-col sm:overflow-visible">
                    {images.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        className={`h-20 w-28 shrink-0 overflow-hidden rounded-2xl border-2 transition sm:h-[110px] sm:w-full ${index === activeImage ? 'border-[#0A7C6E]' : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                      >
                        <img src={src} alt="" className="h-full w-full cursor-pointer object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#0A7C6E]">
                  <MapPin className="h-3.5 w-3.5" />
                  {room.branchName}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="font-[Playfair_Display] text-3xl font-semibold text-[#1A1A2E]">{room.roomTypeName}</h1>
                  <RoomTagBadges tags={room.tags} size="lg" />
                </div>

                {room?.description ? (
                  <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] p-4">
                    <h3 className="text-sm font-semibold text-[#1A1A2E]">About this room</h3>
                    <p className="mt-2 text-sm text-[#6B7280] whitespace-pre-line">{room.description}</p>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#6B7280]">
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#0A7C6E]" />
                    From <span className="font-semibold text-[#0A7C6E]">{formatPrice(minNightlyRate, room.currency)}</span> / night
                  </span>
                </div>

                {amenities.length > 0 ? (
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {amenities.map(({ key, label, icon: Icon }) => (
                      <div key={key || label} className="flex items-center gap-2.5 rounded-2xl border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E6F5F3] text-[#0A7C6E]">
                          {Icon ? <Icon className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                        </span>
                        <span className="text-sm font-medium text-[#1A1A2E]">{label}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-[Playfair_Display] text-xl font-semibold text-[#1A1A2E]">Choose your dates</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">Unavailable dates are greyed out and can't be selected.</p>
                  </div>
                  <span className="hidden items-center gap-1.5 rounded-full bg-[#F8F9FA] px-3 py-1.5 text-xs font-medium text-[#6B7280] sm:flex">
                    <Users className="h-3.5 w-3.5 text-[#0A7C6E]" />
                    Up to {room.maxOccupancy || 2}
                  </span>
                </div>

                <div className="bmh-datepicker">
                  <DatePicker
                    selectsRange
                    inline
                    monthsShown={2}
                    startDate={checkIn}
                    endDate={checkOut}
                    minDate={new Date()}
                    excludeDates={disabledDates}
                    onChange={(update) => setDateRange(update)}
                    calendarStartDay={1}
                  />
                </div>
              </div>
            </div>

            <BookingSummary
              serviceCurrency={room.currency}
              checkInLabel={checkIn ? toLabel(checkIn) : ''}
              checkOutLabel={checkOut ? toLabel(checkOut) : ''}
              nights={nights}
              priceLoading={priceLoading}
              priceError={activePriceError}
              roomSubtotal={roomSubtotal}
              services={services}
              servicesLoading={servicesLoading}
              selectedServices={selectedServices}
              onServiceChange={handleServiceChange}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              onPromoApply={handlePromoApply}
              onPromoRemove={handlePromoRemove}
              promoApplying={promoApplying}
              promoResult={promoResult}
              promoError={promoError}
              canSubmit={canSubmit}
              submitting={submitting}
              onSubmit={handleSubmit}
              submitLabel="Reserve now"
              authRequired={!isAuthenticated}
            />
          </div>
        ) : null}
      </main>
      
      <Footer />
    </div>
  );
};

export default RoomDetailPage;
