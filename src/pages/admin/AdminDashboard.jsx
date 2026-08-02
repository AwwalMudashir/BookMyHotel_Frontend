import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { BedDouble, Coins, Info, TrendingUp } from 'lucide-react';
import Navbar from '../../components/core/Navbar';
import AdminNav from '../../components/admin/AdminNav';
import KpiCard from '../../components/admin/KpiCard';
import RevenueChart from '../../components/admin/RevenueChart';
import Spinner from '../../components/core/Spinner';
import analyticsApi from '../../api/analyticsApi';
import hotelApi from '../../api/hotelApi';
import { parseApiError } from '../../utils/parseApiError';

const todayString = format(new Date(), 'yyyy-MM-dd');
const defaultStart = format(subDays(new Date(), 30), 'yyyy-MM-dd');

// Purpose: Platform-wide admin analytics dashboard.
// The revenue/ADR figures here sum totalPrice across every hotel with no currency
// conversion — a genuinely blended number only when every hotel shares one currency, which
// isn't guaranteed platform-wide. Shown as a plain (unlabeled) figure with an explicit caveat
// rather than pretending it's a single-currency total. The per-hotel chart below only plots
// hotels whose own branches all share one currency, so at least those bars are individually
// honest, even though the platform-wide KPI above them isn't currency-pure.
const AdminDashboard = () => {
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(todayString);

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [hotels, setHotels] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

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
      try {
        const { items } = await hotelApi.getAllHotels(1, 100);
        if (cancelled) return;
        setHotels(items);

        const results = await Promise.allSettled(
          items.map(async (hotel) => {
            const [hotelSummary, branches] = await Promise.all([
              analyticsApi.getHotelSummary(hotel.id, { startDate, endDate }),
              hotelApi.getHotelBranches(hotel.id),
            ]);
            const currencies = new Set(branches.map((branch) => branch.currency).filter(Boolean));
            if (currencies.size !== 1) return null;
            return {
              hotelId: hotel.id,
              hotelName: hotel.name,
              revenue: hotelSummary.revenue ?? 0,
              currency: [...currencies][0],
            };
          }),
        );
        if (!cancelled) {
          setChartData(results.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value));
        }
      } catch {
        if (!cancelled) setChartData([]);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };
    loadChart();
    return () => { cancelled = true; };
  }, [startDate, endDate]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <AdminNav />

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[Playfair_Display] text-2xl font-semibold">Analytics</h1>
            <p className="mt-1 text-sm text-[#6B7280]">Platform-wide performance for the selected range.</p>
          </div>
          <div className="flex items-end gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">From</label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">To</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={todayString}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:ring-2 focus:ring-[#0A7C6E]/15"
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
                label="Revenue"
                value={(summary?.revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                icon={Coins}
                hint="Currencies not converted — blended figure, only exact if every hotel shares one currency."
              />
              <KpiCard
                label="Average daily rate"
                value={(summary?.averageDailyRate ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                icon={TrendingUp}
                hint="Same currency caveat as revenue applies here."
              />
            </div>

            <div className="mt-6 rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-[Playfair_Display] text-lg font-semibold text-[#1A1A2E]">Revenue by hotel</h2>
                <span className="flex items-center gap-1.5 text-xs text-[#6B7280]" title="Hotels whose branches use more than one currency are left out — their totals aren't comparable to a single number.">
                  <Info className="h-3.5 w-3.5" />
                  Single-currency hotels only
                </span>
              </div>
              {chartLoading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : (
                <RevenueChart data={chartData} />
              )}
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
      </main>
    </div>
  );
};

export default AdminDashboard;
