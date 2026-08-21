import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';

const ManagerPerformanceChart = ({ data = [] }) => {
  if (!data.some((point) => Number(point.revenue) > 0 || Number(point.roomNightsBooked) > 0)) {
    return <p className="py-14 text-center text-sm text-slate-500">No confirmed stays were recorded in this range.</p>;
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
          <defs><linearGradient id="managerRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0A7C6E" stopOpacity={0.28} /><stop offset="95%" stopColor="#0A7C6E" stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#EEF1F3" />
          <XAxis dataKey="date" tickFormatter={(value) => format(parseISO(value), 'dd MMM')} tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} width={52} />
          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} labelFormatter={(value) => format(parseISO(value), 'dd MMM yyyy')} />
          <Area type="monotone" dataKey="revenue" stroke="#0A7C6E" strokeWidth={3} fill="url(#managerRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ManagerPerformanceChart;
