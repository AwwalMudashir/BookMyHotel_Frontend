import AdminLayout from '../../components/admin/AdminLayout';
import OffSeasonPackageManager from '../../components/package/OffSeasonPackageManager';

const AdminPackages = () => (
  <AdminLayout>
    <div className="mx-auto max-w-7xl">
      <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0A7C6E]">Seasonal demand</p><h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-slate-950">Off-season packages</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Create platform-wide, hotel-wide or branch-specific packages that make quieter travel dates more attractive.</p></div>
      <OffSeasonPackageManager isAdmin />
    </div>
  </AdminLayout>
);
export default AdminPackages;
