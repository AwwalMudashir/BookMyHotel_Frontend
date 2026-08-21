import ManagerLayout from '../../components/manager/ManagerLayout';
import SustainabilityTagManager from '../../components/manager/SustainabilityTagManager';
import { useAuth } from '../../hooks/useAuth';

const ManagerSustainabilityTags = () => {
  const { user } = useAuth();
  return <ManagerLayout><div className="mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0A7C6E]">Sustainability</p><h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold">Sustainability tags</h1><p className="mb-6 mt-1 text-sm text-slate-500">Manage badges for your hotel’s branches.</p><SustainabilityTagManager hotelId={user?.managedHotel?.id} /></div></ManagerLayout>;
};
export default ManagerSustainabilityTags;
