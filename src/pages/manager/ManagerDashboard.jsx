import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { BedDouble, CalendarCheck, Coins, ConciergeBell, Leaf, Tag, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import ManagerLayout from '../../components/manager/ManagerLayout';
import ManagerPerformanceChart from '../../components/manager/ManagerPerformanceChart';
import KpiCard from '../../components/admin/KpiCard';
import Spinner from '../../components/core/Spinner';
import managerAnalyticsApi from '../../api/managerAnalyticsApi';
import { useAuth } from '../../hooks/useAuth';
import { parseApiError } from '../../utils/parseApiError';

const today = format(new Date(), 'yyyy-MM-dd');
const defaultStart = format(subDays(new Date(), 29), 'yyyy-MM-dd');
const formatUsd = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

const quickLinks = [
  { to: '/manager/reservations', label: 'Review reservations', icon: CalendarCheck },
  { to: '/manager/services', label: 'Manage services', icon: ConciergeBell },
  { to: '/manager/promotions', label: 'Manage promotions', icon: Tag },
  { to: '/manager/sustainability-tags', label: 'Sustainability tags', icon: Leaf },
];

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(today);
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [summaryData, timelineData, bookingData] = await Promise.all([
          managerAnalyticsApi.getSummary({ startDate, endDate }),
          managerAnalyticsApi.getTimeline({ startDate, endDate }),
          managerAnalyticsApi.getBookingsByDate(today),
        ]);
        if (active) {
          setSummary(summaryData);
          setTimeline(timelineData);
          setTodayBookings(bookingData);
        }
      } catch (err) {
        if (active) setError(parseApiError(err, 'Unable to load your hotel analytics.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [startDate, endDate]);

  return (
    <ManagerLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0A7C6E]">Hotel performance</p>
            <h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold">{user?.managedHotel?.name || 'Manager dashboard'}</h1>
            <p className="mt-1 text-sm text-slate-500">Analytics and operations for your assigned hotel only.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">From<input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900" /></label>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">To<input type="date" value={endDate} min={startDate} max={today} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900" /></label>
          </div>
        </div>

        {loading ? <div className="flex justify-center py-20"><Spinner /></div> : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">{error}</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Room nights booked" value={Number(summary?.roomNightsBooked || 0).toLocaleString()} icon={BedDouble} />
              <KpiCard label="Revenue (USD)" value={formatUsd(summary?.revenue)} icon={Coins} hint="Normalized to USD for reporting." />
              <KpiCard label="Average daily rate" value={formatUsd(summary?.averageDailyRate)} icon={TrendingUp} />
              <KpiCard label="Confirmed stays today" value={todayBookings.filter((booking) => booking.status === 'CONFIRMED').length.toLocaleString()} icon={CalendarCheck} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="font-[Playfair_Display] text-xl font-semibold">Revenue trend</h2>
                <p className="mt-1 text-xs text-slate-500">Confirmed bookings by check-in date, converted to USD.</p>
                <div className="mt-4"><ManagerPerformanceChart data={timeline} /></div>
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="font-[Playfair_Display] text-xl font-semibold">Quick actions</h2>
                <div className="mt-4 space-y-3">
                  {quickLinks.map(({ to, label, icon: Icon }) => (
                    <Link key={to} to={to} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 text-sm font-semibold transition hover:border-[#0A7C6E] hover:text-[#0A7C6E]">
                      <span className="flex items-center gap-3"><span className="rounded-xl bg-[#E6F5F3] p-2 text-[#0A7C6E]"><Icon size={17} /></span>{label}</span><span aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerDashboard;
