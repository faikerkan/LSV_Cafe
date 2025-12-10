import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Calendar, Info } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  onMarkRead, 
  onClearAll 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'reminder': return <Calendar size={16} className="text-blue-500" />;
      case 'status_change': return <Info size={16} className="text-purple-500" />;
      default: return <Info size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition"
        title="Bildirimler"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-[80] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Bildirimler ({unreadCount})</h3>
            {notifications.length > 0 && (
              <button 
                onClick={onClearAll} 
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 size={12} /> Tümünü Sil
              </button>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Henüz bildiriminiz yok.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sortedNotifications.map(notification => (
                  <li 
                    key={notification.id} 
                    className={`p-3 text-sm transition hover:bg-gray-50 flex gap-3 ${notification.read ? 'opacity-60' : 'bg-blue-50/30'}`}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-gray-800 text-xs">{notification.title}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(notification.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs leading-relaxed">{notification.message}</p>
                      {!notification.read && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id); }}
                          className="mt-2 text-[10px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <Check size={10} /> Okundu İşaretle
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};