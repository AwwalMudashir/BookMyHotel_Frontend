import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DayPicker, rangeContainsModifiers } from '@daypicker/react';
import toast from 'react-hot-toast';
import { addDays, differenceInDays, format, isBefore, isValid, parseISO, startOfDay, subDays, eachDayOfInterval } from 'date-fns';
import { AlertCircle, ArrowLeft, Building2, ImageOff, MapPin, Sparkles, Tag, Users } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import BookingSummary from '../../components/booking/BookingSummary';
import ServiceAddon from '../../components/booking/ServiceAddon';
import PolicyInfoModal from '../../components/booking/PolicyInfoModal';
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
import useUnsavedChangesWarning from '../../hooks/useUnsavedChangesWarning';
import { parseApiError } from '../../utils/parseApiError';
import Footer from '../../components/core/Footer';

const toIsoDate = (date) => format(date, 'yyyy-MM-dd');
const toLabel = (date) => format(date, 'EEE, d MMM');
const GALLERY_THUMBNAIL_COUNT = 3;
const STAFF_BOOKING_MESSAGE = 'Admin and hotel manager accounts cannot reserve rooms. Please sign in with a customer account to make a booking.';
const friendlyBookingError = (message) => {
  const bookedPhrase = message.match(/\bis already booked\b/i);
  if (!bookedPhrase || bookedPhrase.index == null) return message;

  const suffix = message.slice(bookedPhrase.index + bookedPhrase[0].length);
  return `This room is already booked${suffix}`;
};

const RoomDetailPage = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isHydrated, user, reloadUser } = useAuthContext();
  const authToastShown = useRef(false);
  const { currency, convert, format: formatPrice, setCountry } = useCurrency();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  const [calendarDays, setCalendarDays] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState('');
  const [calendarRequestKey, setCalendarRequestKey] = useState(0);
  const [calendarMonthCount, setCalendarMonthCount] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches ? 2 : 1
  ));

  const [dateRange, setDateRange] = useState(undefined);
  const checkIn = dateRange?.from ?? null;
  const checkOut = dateRange?.to ?? null;

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
  const [ecoPointsToRedeem, setEcoPointsToRedeem] = useState(0);
  const [hotelId, setHotelId] = useState(null);
  const [hotelName, setHotelName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [bookingPolicyOpen, setBookingPolicyOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null); // user's pending booking for this room, if any
  const [checkingPending, setCheckingPending] = useState(false);

  const hasBookingDraft = Boolean(
    dateRange?.from
    || dateRange?.to
    || promoCode.trim()
    || ecoPointsToRedeem > 0
    || Object.keys(selectedServices).length > 0,
  );
  useUnsavedChangesWarning(hasBookingDraft && !submitting);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 640px)');
    const updateMonthCount = (event) => setCalendarMonthCount(event.matches ? 2 : 1);
    mediaQuery.addEventListener('change', updateMonthCount);
    return () => mediaQuery.removeEventListener('change', updateMonthCount);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await roomApi.getRoomById(roomId);
        if (cancelled) return;
        setRoom(data);
        setActiveImage(0);
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

  // If the user is authenticated, check for an existing PENDING booking for this room.
  useEffect(() => {
    let cancelled = false;
    const checkPending = async () => {
      if (!isAuthenticated || !room?.id) {
        setPendingBooking(null);
        return;
      }
      setCheckingPending(true);
      try {
        // Fetch current user's PENDING bookings and look for one for this room.
        const data = await bookingApi.getBookings({ status: 'PENDING', page: 0, size: 50 });
        if (cancelled) return;
        const found = (data?.content || []).find((b) => String(b.roomId) === String(room.id));
        setPendingBooking(found || null);
      } catch {
        if (!cancelled) setPendingBooking(null);
      } finally {
        if (!cancelled) setCheckingPending(false);
      }
    };
    checkPending();
    return () => { cancelled = true; };
  }, [isAuthenticated, room?.id]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated && !authToastShown.current) {
      authToastShown.current = true;
      toast('Log in to reserve this room — browsing is free, but booking needs an account.', { icon: '🔒' });
    }
  }, [isHydrated, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    const loadCalendar = async () => {
      setCalendarLoading(true);
      setCalendarError('');
      try {
        const start = new Date();
        const end = addDays(start, 180);
        const data = await availabilityApi.getCalendar(room.id, toIsoDate(start), toIsoDate(end));
        if (!cancelled) setCalendarDays(data.days);
      } catch (err) {
        if (!cancelled) {
          setCalendarDays([]);
          setCalendarError(parseApiError(err, 'Unable to load room availability. Please try again.'));
        }
      } finally {
        if (!cancelled) setCalendarLoading(false);
      }
    };
    // The URL contains the room's public random id, while availability is keyed
    // by the numeric database id returned in the room-detail response.
    if (room?.id) loadCalendar();
    return () => { cancelled = true; };
  }, [room?.id, calendarRequestKey]);

  useEffect(() => {
    if (!room?.branchId) return;
    let cancelled = false;

    const loadBranchServices = async () => {
      setServicesLoading(true);
      try {
        const servicesData = await serviceApi.getBranchServices(room.branchId);
        if (!cancelled) setServices(servicesData);
      } catch {
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setServicesLoading(false);
      }

      if (room?.hotelId && !hotelName) {
        try {
          const hotel = await hotelApi.getHotelById(room.hotelId);
          if (!cancelled) {
            setHotelName(hotel?.name || room.branchName || '');
            setHotelId(room.hotelId);
          }
        } catch {
          if (!cancelled) setHotelName(room.branchName || '');
        }
      } else if (!hotelName) {
        setHotelName(room.branchName || '');
      }
    };

    loadBranchServices();
    return () => { cancelled = true; };
  }, [room?.branchId, room?.hotelId, room?.branchName, hotelName]);

  useEffect(() => {
    if (room?.hotelId) setHotelId(room.hotelId);
  }, [room?.hotelId]);

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    // Do not call price API for zero-night ranges (same checkIn and checkOut) — backend
    // expects a valid range with at least one night and may return 500 for invalid inputs.
    const nightsForRange = differenceInDays(checkOut, checkIn);
    if (nightsForRange <= 0) {
      setPriceInfo(null);
      setPriceError('Please select at least one night for your stay.');
      return;
    }

    let cancelled = false;
    const loadPrice = async () => {
      setPriceLoading(true);
      setPriceError('');
      try {
        // Pass the selected display currency straight through so the backend does the
        // conversion for this one line item — more accurate than a second client-side pass.
        const data = await availabilityApi.getPrice(room.id, toIsoDate(checkIn), toIsoDate(checkOut), currency);
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
  }, [room?.id, checkIn, checkOut, currency]);

  const hasDateRange = Boolean(checkIn && checkOut);
  const activePriceInfo = hasDateRange ? priceInfo : null;
  const activePriceError = hasDateRange ? priceError : '';

  const bookedDates = useMemo(() => {
    const datesByDay = new Map();

    calendarDays.forEach((day) => {
      if (day?.isAvailable !== false || !day?.date) return;
      const parsed = parseISO(day.date);
      if (isValid(parsed)) datesByDay.set(toIsoDate(parsed), startOfDay(parsed));
    });

    // The availability endpoint should already include every blocking booking, regardless
    // of who owns it. Merge this user's pending hold as a defensive fallback so their own
    // reserved nights are never shown as available while they are being sent to payment.
    if (pendingBooking?.checkIn && pendingBooking?.checkOut) {
      const pendingStart = parseISO(pendingBooking.checkIn);
      const pendingCheckout = parseISO(pendingBooking.checkOut);
      const pendingLastNight = subDays(pendingCheckout, 1);

      if (isValid(pendingStart) && isValid(pendingLastNight) && !isBefore(pendingLastNight, pendingStart)) {
        eachDayOfInterval({ start: pendingStart, end: pendingLastNight }).forEach((date) => {
          datesByDay.set(toIsoDate(date), startOfDay(date));
        });
      }
    }

    return [...datesByDay.values()];
  }, [calendarDays, pendingBooking]);

  const calendarToday = useMemo(() => startOfDay(new Date()), []);
  const calendarHorizon = useMemo(() => addDays(calendarToday, 180), [calendarToday]);
  const disabledCalendarDates = useMemo(
    () => [{ before: calendarToday }, ...bookedDates, { after: calendarHorizon }],
    [bookedDates, calendarHorizon, calendarToday],
  );

  const minNightlyRate = useMemo(() => {
    const rates = calendarDays.map((day) => day.dailyRate).filter((rate) => typeof rate === 'number');
    if (rates.length) return Math.min(...rates);
    return room?.pricePerNight || 0;
  }, [calendarDays, room]);

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const amenities = useMemo(() => listAmenities(room?.amenities), [room]);
  // Guard against null/undefined image entries which produce broken/empty thumbnails
  const images = (room?.images || []).filter(Boolean);
  const maxThumbnailStart = Math.max(images.length - GALLERY_THUMBNAIL_COUNT, 0);
  const thumbnailStart = Math.min(Math.max(activeImage - 1, 0), maxThumbnailStart);
  const hiddenThumbnailsBefore = thumbnailStart;
  const hiddenThumbnailsAfter = Math.max(
    images.length - thumbnailStart - GALLERY_THUMBNAIL_COUNT,
    0,
  );
  const thumbnailSlots = Array.from({ length: GALLERY_THUMBNAIL_COUNT }, (_, position) => {
    const index = thumbnailStart + position;
    return { index, src: images[index] || null, position };
  });

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
    if (room?.hotelId) {
      setHotelId(room.hotelId);
      return room.hotelId;
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

      let promotionDetails = data;
      if (!data.discountType || (data.discountType === 'FIXED_AMOUNT' && data.discountValue == null)) {
        try {
          const activePromotions = await promotionApi.getActivePromotions(resolvedHotelId);
          const matchedPromotion = activePromotions.find(
            (promotion) => promotion.code?.toUpperCase() === data.promoCode?.toUpperCase(),
          );
          if (matchedPromotion) promotionDetails = { ...matchedPromotion, ...data };
        } catch {
          // The apply result may already contain everything needed; validate that below.
        }
      }

      const appliedDiscountType = promotionDetails.discountType || promotionDetails.type;
      if (!appliedDiscountType) {
        setPromoError('Unable to confirm this promotion’s discount type. Please try again.');
        return;
      }

      if (appliedDiscountType === 'FIXED_AMOUNT') {
        const fixedDiscountUsd = Number(promotionDetails.discountValue);
        if (!Number.isFinite(fixedDiscountUsd)) {
          setPromoError('Unable to confirm this fixed promotion’s USD value. Please try again.');
          return;
        }

        const convertedDiscount = convert(fixedDiscountUsd, 'USD');
        if (convertedDiscount === null) {
          setCountry('US');
          setPromoError(`The fixed USD discount could not be converted to ${currency}. Prices have been switched to USD; apply the code again.`);
          return;
        }

        setPromoResult({
          ...data,
          discountType: 'FIXED_AMOUNT',
          discountCurrency: 'USD',
          discountValue: fixedDiscountUsd,
          discountAmount: Math.min(Number(roomSubtotal) || 0, convertedDiscount),
        });
        return;
      }

      setPromoResult({ ...data, discountType: appliedDiscountType });
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

  const handleDateRangeSelect = (nextRange, triggerDate) => {
    if (dateRange?.from && !dateRange.to && triggerDate && bookedDates.length > 0) {
      const attemptedRange = isBefore(triggerDate, dateRange.from)
        ? { from: triggerDate, to: dateRange.from }
        : { from: dateRange.from, to: triggerDate };

      if (rangeContainsModifiers(attemptedRange, bookedDates)) {
        toast.error('That stay crosses booked dates. Choose a checkout date before the yellow range.');
      }
    }

    setDateRange(nextRange);
    // A promotion is calculated against a particular room subtotal, so changing dates
    // invalidates it until the new price has loaded and the code is applied again.
    setPromoResult(null);
    setPromoError('');
  };

  const handleSubmit = async () => {
    if (isAuthenticated && user?.role !== 'CUSTOMER') {
      toast.error(STAFF_BOOKING_MESSAGE, { duration: 6500 });
      return;
    }

    if (pendingBooking) {
      // User already has a pending booking for this room — redirect to payment for that booking.
      navigate(`/payment/${pendingBooking.id}`);
      return;
    }

    if (!isAuthenticated) return;
    if (!checkIn || !checkOut) {
      toast.error('Select your check-in and check-out dates first.');
      return;
    }

    setSubmitting(true);
    try {
      const serviceEntries = Object.entries(selectedServices)
        .filter(([, quantity]) => quantity > 0)
        .map(([serviceId, quantity]) => ({ serviceId: Number(serviceId), quantity }));
      const booking = await bookingApi.createBooking({
        roomId: room.id,
        checkIn: toIsoDate(checkIn),
        checkOut: toIsoDate(checkOut),
        promoCode: promoResult?.promoCode || undefined,
        services: serviceEntries,
        ecoPointsToRedeem,
      });

      if (ecoPointsToRedeem > 0) {
        await reloadUser().catch(() => null);
      }
      toast.success('Room reserved! Complete payment to confirm your stay.');
      navigate(`/payment/${booking.id}`);
    } catch (err) {
      const apiMessage = err?.response?.status === 403
        ? STAFF_BOOKING_MESSAGE
        : parseApiError(err, 'Unable to complete this booking.');
      const message = friendlyBookingError(apiMessage);
      toast.error(message, { duration: err?.response?.status === 403 ? 6500 : 4000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReserveRequest = () => {
    if (isAuthenticated && user?.role !== 'CUSTOMER') {
      toast.error(STAFF_BOOKING_MESSAGE, { duration: 6500 });
      return;
    }

    if (pendingBooking || !isAuthenticated || !checkIn || !checkOut) {
      handleSubmit();
      return;
    }
    setBookingPolicyOpen(true);
  };

  const handlePolicyContinue = () => {
    setBookingPolicyOpen(false);
    handleSubmit();
  };

  const canSubmit = Boolean(isAuthenticated && checkIn && checkOut && activePriceInfo?.isAvailable !== false && !priceLoading);
  const effectiveCanSubmit = canSubmit && !pendingBooking && !checkingPending;
  const submitLabel = pendingBooking ? 'Reservation pending — complete payment' : 'Reserve now';

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
                <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-col">
                  {thumbnailSlots.map(({ index, src, position }) => {
                    const overflowCount = position === 0 && hiddenThumbnailsBefore > 0
                      ? hiddenThumbnailsBefore
                      : position === GALLERY_THUMBNAIL_COUNT - 1 && hiddenThumbnailsAfter > 0
                        ? hiddenThumbnailsAfter
                        : 0;
                    const overflowDirection = position === 0 ? 'earlier' : 'later';

                    return src ? (
                      <button
                        key={`${index}-${src}`}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={overflowCount > 0
                          ? `Show image ${index + 1}; ${overflowCount} ${overflowDirection} image${overflowCount === 1 ? '' : 's'} hidden`
                          : `Show image ${index + 1}`}
                        aria-pressed={index === activeImage}
                        className={`group relative h-20 min-w-0 overflow-hidden rounded-2xl border-2 transition sm:h-[110px] sm:w-full ${index === activeImage ? 'border-[#0A7C6E]' : 'border-transparent opacity-80 hover:opacity-100'}`}
                      >
                        <img src={src} alt="" className="h-full w-full cursor-pointer object-cover transition duration-300 group-hover:scale-105" />
                        {overflowCount > 0 ? (
                          <span className="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-xl font-semibold text-white backdrop-blur-[1px]">
                            +{overflowCount}
                          </span>
                        ) : null}
                      </button>
                    ) : (
                      <div
                        key={`empty-thumbnail-${position}`}
                        className="flex h-20 min-w-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-100 text-slate-400 sm:h-[110px] sm:w-full"
                        aria-label="No additional room image"
                      >
                        <ImageOff className="h-6 w-6" aria-hidden="true" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {(servicesLoading || services.length > 0) ? (
                <section className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
                  <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E6F5F3] text-[#0A7C6E]">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A7C6E]">Make it yours</p>
                      <h2 className="mt-1 font-[Playfair_Display] text-xl font-semibold text-[#1A1A2E]">Enhance your stay</h2>
                      <p className="mt-1 text-sm text-[#6B7280]">Choose optional services now. Every selection is included in your booking and payment total.</p>
                    </div>
                  </div>

                  {servicesLoading ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[0, 1].map((key) => <div key={key} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {services.map((service) => (
                        <ServiceAddon
                          key={service.id}
                          service={service}
                          quantity={selectedServices[service.id] || 0}
                          onChange={(quantity) => handleServiceChange(service.id, quantity)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#0A7C6E]">
                  <MapPin className="h-3.5 w-3.5" />
                  {hotelName || room.branchName}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <div className="flex flex-col">
                    <h1 className="font-[Playfair_Display] text-3xl font-semibold text-[#1A1A2E]">{room.roomTypeName}</h1>
                    {room.branchName && (
                      <p className="mt-1 text-sm text-[#6B7280]">{room.branchName}</p>
                    )}
                  </div>
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
                    <p className="mt-1 text-sm text-[#6B7280]">Booked nights are yellow and can't be selected or crossed by a stay.</p>
                  </div>
                  <span className="hidden items-center gap-1.5 rounded-full bg-[#F8F9FA] px-3 py-1.5 text-xs font-medium text-[#6B7280] sm:flex">
                    <Users className="h-3.5 w-3.5 text-[#0A7C6E]" />
                    Up to {room.maxOccupancy || 2}
                  </span>
                </div>

                <div className="bmh-availability-calendar">
                  {calendarLoading ? (
                    <div className="space-y-3">
                      <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
                      </div>
                    </div>
                  ) : calendarError ? (
                    <div className="rounded-2xl border border-[#F5C2C7] bg-[#FEF3F3] p-6 text-center">
                      <AlertCircle className="mx-auto h-7 w-7 text-[#B42318]" />
                      <p className="mt-3 text-sm text-[#9B1E1E]">{calendarError}</p>
                      <button
                        type="button"
                        onClick={() => setCalendarRequestKey((key) => key + 1)}
                        className="mt-4 rounded-xl bg-[#0A7C6E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#065E52]"
                      >
                        Retry availability
                      </button>
                    </div>
                  ) : (
                    <>
                      <DayPicker
                        mode="range"
                        min={1}
                        selected={dateRange}
                        onSelect={handleDateRangeSelect}
                        disabled={disabledCalendarDates}
                        excludeDisabled
                        resetOnSelect
                        numberOfMonths={calendarMonthCount}
                        startMonth={calendarToday}
                        endMonth={calendarHorizon}
                        weekStartsOn={1}
                        showOutsideDays
                        fixedWeeks
                        navLayout="after"
                        modifiers={{ booked: bookedDates }}
                        modifiersClassNames={{ booked: 'bmh-calendar__booked' }}
                        aria-label="Choose check-in and check-out dates"
                      />

                      <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-slate-100 pt-4 text-xs text-[#6B7280]">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-4 rounded bg-[#FEF3C7] ring-1 ring-[#F59E0B]/40" aria-hidden="true" />
                          Booked
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-4 rounded bg-[#E6F5F3] ring-1 ring-[#0A7C6E]/30" aria-hidden="true" />
                          Your selected stay
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <BookingSummary
              checkInLabel={checkIn ? toLabel(checkIn) : ''}
              checkOutLabel={checkOut ? toLabel(checkOut) : ''}
              nights={nights}
              priceLoading={priceLoading}
              priceError={activePriceError}
              roomSubtotal={roomSubtotal}
              services={services}
              selectedServices={selectedServices}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              onPromoApply={handlePromoApply}
              onPromoRemove={handlePromoRemove}
              promoApplying={promoApplying}
              promoResult={promoResult}
              promoError={promoError}
              availableEcoPoints={pendingBooking ? 0 : (user?.ecoPoints || 0)}
              ecoPointsToRedeem={ecoPointsToRedeem}
              onEcoPointsChange={setEcoPointsToRedeem}
              // If there's an existing pending booking, disable the submit and explain next step.
              canSubmit={effectiveCanSubmit}
              submitting={submitting}
              onSubmit={handleReserveRequest}
              submitLabel={submitLabel}
              authRequired={!isAuthenticated}
            />
            {pendingBooking ? (
              <div className="mt-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                You already reserved this room (reference: {pendingBooking.reference || `#${pendingBooking.id}`}). Complete payment to confirm your stay — click the button above to continue to the payment page.
              </div>
            ) : null}
          </div>
        ) : null}
      </main>

      {bookingPolicyOpen ? (
        <PolicyInfoModal
          context="booking"
          booking={{
            checkIn: toIsoDate(checkIn),
            checkOut: toIsoDate(checkOut),
          }}
          busy={submitting}
          onClose={() => setBookingPolicyOpen(false)}
          onContinue={handlePolicyContinue}
          continueLabel="Reserve and continue to payment"
        />
      ) : null}

      <Footer />
    </div>
  );
};

export default RoomDetailPage;
