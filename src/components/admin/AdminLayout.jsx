import { useState } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <AdminSidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} onToggle={() => setCollapsed((c) => !c)} />
      <header className="sticky top-0 z-30 flex items-center border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setMobileOpen(true)} className="rounded-xl border border-slate-200 p-2 text-slate-700" aria-label="Open admin navigation"><Menu size={20} /></button>
        <span className="ml-3 text-sm font-semibold">Administrator</span>
      </header>
      <main className={`min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-28' : 'lg:ml-72'} px-4 py-6 sm:px-6 lg:py-8 fade-in`}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
