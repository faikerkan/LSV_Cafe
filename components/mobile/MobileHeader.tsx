import React from 'react';
import { Menu, Bell, Plus } from 'lucide-react';

interface MobileHeaderProps {
  onMenuClick: () => void;
  onNotificationClick: () => void;
  onCreateEvent: () => void;
  notificationCount?: number;
  title: string;
  isLoggedIn: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onMenuClick,
  onNotificationClick,
  onCreateEvent,
  notificationCount = 0,
  title,
  isLoggedIn
}) => {
  return (
    <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 h-14">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Menüyü aç"
        >
          <Menu size={24} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 truncate px-2">{title}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onNotificationClick}
            className="relative p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            aria-label="Bildirimler"
          >
            <Bell size={22} className="text-gray-700" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
          {isLoggedIn && (
            <button
              onClick={onCreateEvent}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors touch-manipulation"
              aria-label="Etkinlik oluştur"
            >
              <Plus size={22} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
