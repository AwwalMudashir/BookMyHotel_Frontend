import { useState } from 'react';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className={`min-h-screen transition-all duration-300 ${collapsed ? 'ml-28' : 'ml-72'} px-6 py-8 fade-in`}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
