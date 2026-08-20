import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#0A7C6E', '#C9A84C', '#5B8DEF', '#E98567', '#7C6BB1', '#3F9C72'];

const formatUsd = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const RevenueShareChart = ({ data = [] }) => {
  const revenueData = data.filter((hotel) => hotel.revenue > 0);
  const total = revenueData.reduce((sum, hotel) => sum + hotel.revenue, 0);

  if (revenueData.length === 0) {
    return <p className="py-10 text-center text-sm text-[#6B7280]">No confirmed revenue to divide for this range.</p>;
  }

  return (
    <div>
      <div className="relative h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={revenueData} dataKey="revenue" nameKey="hotelName" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="none">
              {revenueData.map((hotel, index) => <Cell key={hotel.hotelId} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => formatUsd(value)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Total</span>
          <span className="mt-1 text-lg font-semibold text-[#1A1A2E]">{formatUsd(total)}</span>
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {revenueData.map((hotel, index) => (
          <div key={hotel.hotelId} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-[#4B5563]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="truncate">{hotel.hotelName}</span>
            </span>
            <span className="shrink-0 font-semibold text-[#1A1A2E]">{((hotel.revenue / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueShareChart;
