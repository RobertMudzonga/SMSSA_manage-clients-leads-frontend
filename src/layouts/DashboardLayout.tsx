import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab="projects" onTabChange={() => {}} />
      <div className="ml-64 flex-1 p-8">
        <Outlet />
      </div>
    </div>
  );
}
