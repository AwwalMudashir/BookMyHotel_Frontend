import ManagerLayout from '../../components/manager/ManagerLayout';
import OffSeasonPackageManager from '../../components/package/OffSeasonPackageManager';
import { useAuth } from '../../hooks/useAuth';

const ManagerPackages = () => {
  const { user } = useAuth();
  return <ManagerLayout><div className="mx-auto max-w-7xl"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0A7C6E]">Seasonal demand</p><h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-slate-950">Off-season packages</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Build attractive packages for every branch in your hotel or target one location.</p></div><OffSeasonPackageManager managedHotelId={user?.managedHotel?.id} /></div></ManagerLayout>;
};
export default ManagerPackages;
