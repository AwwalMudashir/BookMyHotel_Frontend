import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const formatUsd = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const TooltipContent = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-[#1A1A2E]">{label}</p>
      <p className="mt-1 text-xs text-[#6B7280]">{point.roomNightsBooked.toLocaleString()} room nights</p>
      <p className="text-xs font-medium text-[#0A7C6E]">{formatUsd(point.averageDailyRate)} ADR</p>
    </div>
  );
};

const HotelPerformanceChart = ({ data = [] }) => {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-[#6B7280]">No stay performance to chart for this range.</p>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke="#F1F2F4" />
          <XAxis dataKey="hotelName" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
          <YAxis yAxisId="nights" allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} width={36} />
          <YAxis yAxisId="adr" orientation="right" tickFormatter={(value) => `$${value}`} tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} width={52} />
          <Tooltip content={<TooltipContent />} />
          <Bar yAxisId="nights" dataKey="roomNightsBooked" fill="#8CCFC1" radius={[5, 5, 0, 0]} maxBarSize={42} />
          <Line yAxisId="adr" type="monotone" dataKey="averageDailyRate" stroke="#C9A84C" strokeWidth={3} dot={{ r: 4, fill: '#C9A84C', strokeWidth: 0 }} activeDot={{ r: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HotelPerformanceChart;
