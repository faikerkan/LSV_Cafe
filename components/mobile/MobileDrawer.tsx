import React, { useEffect } from 'react';
import { X, Calendar as CalendarIcon, List, Users, LogOut, Lock, ShieldCheck, ShieldAlert } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  view: 'calendar' | 'list';
  onViewChange: (view: 'calendar' | 'list') => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  username?: string;
  onLogin: () => void;
  onLogout: () => void;
  onAdminPanel?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen, onClose, view, onViewChange, isLoggedIn, isAdmin, username, onLogin, onLogout, onAdminPanel
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ' + (isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={'fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-slate-900 text-white z-50 lg:hidden transform transition-transform duration-300 ease-out flex flex-col ' + (isOpen ? 'translate-x-0' : '-translate-x-full')}
        aria-label="Navigasyon menüsü"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold">LSV Cafe</h2>
            <p className="text-sm text-slate-400">Etkinlik Yönetim</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors touch-manipulation" aria-label="Menüyü kapat">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => { onViewChange('calendar'); onClose(); }}
            className={'w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors touch-manipulation ' + (view === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:bg-slate-800 active:bg-slate-700')}
          >
            <CalendarIcon size={22} />
            <span className="font-medium">Takvim Görünümü</span>
          </button>
          <button
            onClick={() => { onViewChange('list'); onClose(); }}
            className={'w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors touch-manipulation ' + (view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-200 hover:bg-slate-800 active:bg-slate-700')}
          >
            <List size={22} />
            <span className="font-medium">Liste Görünümü</span>
          </button>
          {isAdmin && onAdminPanel && (
            <button onClick={() => { onAdminPanel(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg bg-purple-600 hover:bg-purple-700 active:bg-purple-800 transition-colors touch-manipulation">
              <Users size={22} />
              <span className="font-medium">Admin Panel</span>
            </button>
          )}
        </nav>
        <div className="p-4 bg-slate-800 m-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            {isAdmin ? <ShieldCheck className="text-green-400" size={20} /> : isLoggedIn ? <Users className="text-blue-400" size={20} /> : <ShieldAlert className="text-gray-400" size={20} />}
            <span className="text-sm font-semibold text-slate-300 uppercase">{isAdmin ? 'Yönetici' : isLoggedIn ? 'Kullanıcı' : 'Misafir'}</span>
          </div>
          {isLoggedIn && username && <div className="text-sm text-slate-400 mb-3 truncate">{username}</div>}
          {isLoggedIn ? (
            <button onClick={() => { onLogout(); onClose(); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium transition-colors touch-manipulation">
              <LogOut size={18} />
              <span>Çıkış Yap</span>
            </button>
          ) : (
            <button onClick={() => { onLogin(); onClose(); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium transition-colors touch-manipulation">
              <Lock size={18} />
              <span>Kullanıcı Girişi</span>
            </button>
          )}
        </div>
        <div className="p-4 text-center text-xs text-slate-500 border-t border-slate-700">LSV Cafe v1.0 • Mobile Optimized</div>
      </aside>
    </>
  );
};

export default MobileDrawer;
