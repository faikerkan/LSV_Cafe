import React, { useState } from 'react';
import { Users, Building2, Package, MapPin, FileText, X } from 'lucide-react';
import UserManagement from './UserManagement';
import DepartmentManagement from './DepartmentManagement';
import ResourceManagement from './ResourceManagement';
import LocationManagement from './LocationManagement';
import EventLogs from './EventLogs';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'users' | 'departments' | 'resources' | 'locations' | 'logs';

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  if (!isOpen) return null;

  const tabs = [
    { id: 'users' as AdminTab, label: 'Kullanıcılar', icon: Users },
    { id: 'departments' as AdminTab, label: 'Departmanlar', icon: Building2 },
    { id: 'resources' as AdminTab, label: 'Kaynaklar', icon: Package },
    { id: 'locations' as AdminTab, label: 'Mekanlar', icon: MapPin },
    { id: 'logs' as AdminTab, label: 'Loglar', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-slate-100 border-b flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'departments' && <DepartmentManagement />}
          {activeTab === 'resources' && <ResourceManagement />}
          {activeTab === 'locations' && <LocationManagement />}
          {activeTab === 'logs' && <EventLogs />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
