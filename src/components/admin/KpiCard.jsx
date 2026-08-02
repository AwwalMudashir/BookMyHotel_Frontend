// Purpose: Stat tile used on the admin analytics dashboard — label + value, nothing fabricated
// (no delta/trend, since the backend gives a single absolute figure per range, not a comparison).
const KpiCard = ({ label, value, icon: Icon, hint }) => (
  <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">{label}</p>
      {Icon ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E6F5F3] text-[#0A7C6E]">
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
    </div>
    <p className="mt-3 text-2xl font-semibold text-[#1A1A2E]">{value}</p>
    {hint ? <p className="mt-1.5 text-xs text-[#6B7280]">{hint}</p> : null}
  </div>
);

export default KpiCard;
