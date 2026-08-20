import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { BedDouble, Coins, Info, TrendingUp } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import KpiCard from '../../components/admin/KpiCard';
import RevenueChart from '../../components/admin/RevenueChart';
import HotelPerformanceChart from '../../components/admin/HotelPerformanceChart';
import RevenueShareChart from '../../components/admin/RevenueShareChart';
import Spinner from '../../components/core/Spinner';
import analyticsApi from '../../api/analyticsApi';
import hotelApi from '../../api/hotelApi';
import { parseApiError } from '../../utils/parseApiError';

const formatUsd = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const todayString = format(new Date(), 'yyyy-MM-dd');
const defaultStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');

// Purpose: Platform-wide admin analytics dashboard. The backend normalizes revenue and ADR to
// USD, so hotels remain comparable even when their branches charge in different currencies.
const AdminDashboard = () => {
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(todayString);

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [hotels, setHotels] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await analyticsApi.getSummary({ startDate, endDate });
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) setError(parseApiError(err, 'Unable to load analytics right now.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [startDate, endDate]);

  useEffect(() => {
    let cancelled = false;
    const loadChart = async () => {
      setChartLoading(true);
      setChartError('');
      try {
        const { items } = await hotelApi.getAllHotels(1, 100);
        if (cancelled) return;
        setHotels(items);

        const results = await Promise.allSettled(
          items.map(async (hotel) => {
            const hotelSummary = await analyticsApi.getHotelSummary(hotel.id, { startDate, endDate });
            return {
              hotelId: hotel.id,
              hotelName: hotel.name,
              revenue: Number(hotelSummary.revenue ?? 0),
              roomNightsBooked: Number(hotelSummary.roomNightsBooked ?? 0),
              averageDailyRate: Number(hotelSummary.averageDailyRate ?? 0),
              currency: hotelSummary.currency || 'USD',
            };
          }),
        );
        if (!cancelled) {
          const successful = results
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value)
            .sort((a, b) => b.revenue - a.revenue);
          setChartData(successful);
          if (successful.length !== items.length) {
            setChartError(`${items.length - successful.length} hotel report${items.length - successful.length === 1 ? '' : 's'} could not be loaded.`);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setChartData([]);
          setChartError(parseApiError(err, 'Unable to load hotel comparisons right now.'));
        }
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };
    loadChart();
    return () => { cancelled = true; };
  }, [startDate, endDate]);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[Playfair_Display] text-2xl font-semibold">Analytics</h1>
            <p className="mt-1 text-sm text-[#6B7280]">Platform-wide performance for the selected range.</p>
          </div>
          <div className="flex w-full flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm sm:w-auto sm:flex-row sm:items-end">
            <div className="flex-1 sm:flex-none">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">From</label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              />
            </div>
            <div className="flex-1 sm:flex-none">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">To</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={todayString}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : error ? (
          <div className="rounded-[24px] border border-[#F5C2C7] bg-[#FEF3F3] p-8 text-center">
            <p className="text-sm text-[#9B1E1E]">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiCard label="Room nights booked" value={(summary?.roomNightsBooked ?? 0).toLocaleString()} icon={BedDouble} />
              <KpiCard
                label="Revenue (USD)"
                value={formatUsd(summary?.revenue)}
                icon={Coins}
                hint="Converted to USD using live exchange rates."
              />
              <KpiCard
                label="Average daily rate (USD)"
                value={formatUsd(summary?.averageDailyRate)}
                icon={TrendingUp}
                hint="Computed from the USD-converted platform revenue."
              />
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-[24px] border border-[#CFE7E1] bg-[#F4FBF9] p-5 text-sm text-[#425466]">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0A7C6E]" />
              <div>
                <p className="font-semibold text-[#1A1A2E]">How this analysis is calculated</p>
                <p className="mt-1 leading-relaxed">
                  Only confirmed bookings whose check-in falls inside the selected range are included. Revenue is each booking’s final total converted to USD, room nights are the full booked stay length, and ADR is revenue divided by room nights.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">Revenue by hotel</h2>
                <span className="flex items-center gap-1.5 text-xs text-[#6B7280]" title="Every hotel total is converted to USD by the analytics API.">
                  <Info className="h-3.5 w-3.5" />
                  All hotels · USD normalized
                </span>
              </div>
              {chartLoading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : (
                <RevenueChart data={chartData} />
              )}
              {chartError ? <p className="mt-3 text-xs font-medium text-[#9B1E1E]">{chartError}</p> : null}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm lg:col-span-3">
                <div className="mb-4">
                  <h2 className="font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">Stay volume and daily rate</h2>
                  <p className="mt-1 text-xs text-[#6B7280]">Room nights show booking volume; the line shows USD revenue earned per room night.</p>
                </div>
                {chartLoading ? <div className="flex justify-center py-12"><Spinner /></div> : <HotelPerformanceChart data={chartData} />}
              </div>

              <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm lg:col-span-2">
                <div className="mb-4">
                  <h2 className="font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">Revenue share</h2>
                  <p className="mt-1 text-xs text-[#6B7280]">How confirmed revenue is distributed across hotels.</p>
                </div>
                {chartLoading ? <div className="flex justify-center py-12"><Spinner /></div> : <RevenueShareChart data={chartData} />}
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">Hotels</h2>
              <div className="space-y-2">
                {hotels.map((hotel) => (
                  <Link
                    key={hotel.id}
                    to={`/admin/reports/${hotel.id}`}
                    className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm transition hover:border-[#0A7C6E]"
                  >
                    <span className="font-medium text-[#1A1A2E]">{hotel.name}</span>
                    <span className="text-[#0A7C6E]">View report →</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
