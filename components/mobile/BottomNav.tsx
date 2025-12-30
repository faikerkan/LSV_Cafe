import React from 'react';
import { Calendar, List, Plus, User } from 'lucide-react';

interface BottomNavProps {
  view: 'calendar' | 'list';
  onViewChange: (view: 'calendar' | 'list') => void;
  onCreateEvent: () => void;
  onProfileClick: () => void;
  isLoggedIn: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ view, onViewChange, onCreateEvent, onProfileClick, isLoggedIn }) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => onViewChange('calendar')}
          className={'flex flex-col items-center justify-center flex-1 h-full gap-1 touch-manipulation transition-colors ' + (view === 'calendar' ? 'text-indigo-600' : 'text-gray-500 active:text-gray-700')}
          aria-label="Takvim görünümü"
        >
          <Calendar size={24} strokeWidth={view === 'calendar' ? 2.5 : 2} />
          <span className="text-xs font-medium">Takvim</span>
        </button>
        <button
          onClick={() => onViewChange('list')}
          className={'flex flex-col items-center justify-center flex-1 h-full gap-1 touch-manipulation transition-colors ' + (view === 'list' ? 'text-indigo-600' : 'text-gray-500 active:text-gray-700')}
          aria-label="Liste görünümü"
        >
          <List size={24} strokeWidth={view === 'list' ? 2.5 : 2} />
          <span className="text-xs font-medium">Liste</span>
        </button>
        <button
          onClick={onCreateEvent}
          className={'flex items-center justify-center w-14 h-14 -mt-6 rounded-full shadow-lg transition-all touch-manipulation ' + (isLoggedIn ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 active:scale-95' : 'bg-gray-300 cursor-not-allowed')}
          disabled={!isLoggedIn}
          aria-label="Etkinlik oluştur"
        >
          <Plus size={28} className="text-white" strokeWidth={2.5} />
        </button>
        <button onClick={onProfileClick} className="flex flex-col items-center justify-center flex-1 h-full gap-1 touch-manipulation transition-colors text-gray-500 active:text-gray-700" aria-label="Profil">
          <User size={24} strokeWidth={2} />
          <span className="text-xs font-medium">{isLoggedIn ? 'Profil' : 'Giriş'}</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
