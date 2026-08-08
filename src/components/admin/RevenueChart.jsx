import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const ACCENT = '#0A7C6E';

// Purpose: Compares revenue across hotels for the selected date range. This chart now
// receives USD-converted revenue values, so the tooltip and bars are consistently shown
// in a single currency.
const formatUsd = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-[#1A1A2E]">
        {formatUsd(point.revenue)}
      </p>
      <p className="text-xs text-[#6B7280]">{point.hotelName}</p>
    </div>
  );
};

const RevenueChart = ({ data = [] }) => {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-[#6B7280]">No single-currency hotel revenue to compare for this range.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="#F1F2F4" />
          <XAxis
            dataKey="hotelName"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#0A7C6E', fillOpacity: 0.08 }} />
          <Bar dataKey="revenue" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
