import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  Users, 
  CheckCircle2, 
  Clock, 
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  Box,
  Download,
  FileText,
  Lock,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Filter,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { CafeEvent, Department, EventStatus, LOCATIONS, AppNotification } from './types';
import { EventModal } from './components/EventModal';
import { LoginModal } from './components/LoginModal';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { NotificationCenter } from './components/NotificationCenter';
import AdminPanel from './components/admin/AdminPanel';
import { api } from './services/api';

// Department Colors Constant
const DEPT_COLORS: Record<string, string> = {
  [Department.PR]: 'bg-purple-100 text-purple-800 border-purple-200',
  [Department.CORP_COMM]: 'bg-pink-100 text-pink-800 border-pink-200',
  [Department.VOLUNTEER_COMM]: 'bg-slate-100 text-slate-800 border-slate-200',
  [Department.CORP_PR]: 'bg-blue-100 text-blue-800 border-blue-200',
  [Department.SOCIAL_SERVICES]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  [Department.ACTIVE_COMM]: 'bg-orange-100 text-orange-800 border-orange-200',
  [Department.FAYDA]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [Department.INCI]: 'bg-rose-100 text-rose-800 border-rose-200',
};

// Safari gibi eski tarayıcılarda crypto.randomUUID yoksa geri dönüş
const safeRandomId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const App: React.FC = () => {
  // --- State Initialization ---
  const [events, setEvents] = useState<CafeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Local state for notifications (simpler to keep local for MVP, but can be moved to API too)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('lsv_cafe_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  // Auth State - Check localStorage on mount
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const token = localStorage.getItem('lsv_cafe_token');
      const userStr = localStorage.getItem('lsv_cafe_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        return user.role === 'admin' || user.role === 'ADMIN';
      }
    } catch (e) {
      console.error('Error reading auth state:', e);
    }
    return false;
  });

  // Filter & Search State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<CafeEvent | null>(null);
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date Range Filter State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- Effects ---
  
  // Load Events from API
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
        const data = await api.getEvents();
        setEvents(data);
    } catch (error) {
        addToast('error', 'Veriler sunucudan çekilemedi.');
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Persistence Effect for Notifications
  useEffect(() => {
    localStorage.setItem('lsv_cafe_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // --- Notification Logic ---

  const addNotification = (title: string, message: string, type: AppNotification['type'], eventId?: string) => {
    const newNotif: AppNotification = {
      id: safeRandomId(),
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type,
      eventId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearNotifications = () => {
    if (window.confirm("Tüm bildirimler silinecek. Emin misiniz?")) {
      setNotifications([]);
    }
  };

  // Check for upcoming events on load
  useEffect(() => {
    if (events.length === 0) return;

    const checkUpcoming = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);

      events.forEach(event => {
        if (event.status !== EventStatus.APPROVED) return;
        
        const eventDate = new Date(event.startDate);
        
        // If event is in the next 24 hours and hasn't started yet
        if (eventDate > now && eventDate <= tomorrow) {
          const alreadyNotified = notifications.some(
             n => n.eventId === event.id && n.type === 'reminder'
          );

          if (!alreadyNotified) {
            addNotification(
              'Yaklaşan Etkinlik',
              `"${event.title}" etkinliği 24 saat içinde başlıyor. Hazırlıkları kontrol ediniz.`,
              'reminder',
              event.id
            );
          }
        }
      });
    };

    checkUpcoming();
  }, [events]); 

  // --- Toast Logic ---
  const addToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Calendar Logic ---
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 is Sunday

  const changeMonth = (offset: number) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + offset, 1));
  };

  const currentMonthDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(selectedDate);
    // Adjusting for Monday start (Turkish standard)
    let startDay = firstDayOfMonth(selectedDate) - 1;
    if (startDay < 0) startDay = 6;

    // Previous month filler
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [selectedDate]);

  // Calculate if selected date is today for UI logic
  const isSelectedDateToday = useMemo(() => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() &&
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getFullYear() === today.getFullYear();
  }, [selectedDate]);

  // --- Filter Logic ---
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesDept = filterDept === 'all' || e.department === filterDept;
      const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
      const matchesSearch = searchQuery === '' || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesDate = true;
      // Date filtering only active in List View
      if (view === 'list' && (filterStartDate || filterEndDate)) {
          if (filterStartDate) {
              const start = new Date(filterStartDate);
              // Compare against UTC 00:00 of selected date
              if (new Date(e.startDate) < start) matchesDate = false;
          }
          if (filterEndDate && matchesDate) {
              const end = new Date(filterEndDate);
              // Add one day to get end of selected day (exclusive upper bound)
              end.setUTCDate(end.getUTCDate() + 1); 
              if (new Date(e.startDate) >= end) matchesDate = false;
          }
      }

      return matchesDept && matchesStatus && matchesSearch && matchesDate;
    });
  }, [events, filterDept, filterStatus, searchQuery, filterStartDate, filterEndDate, view]);

  const getEventsForDay = (day: number) => {
    return filteredEvents.filter(e => {
      const eDate = new Date(e.startDate);
      return eDate.getDate() === day && 
             eDate.getMonth() === selectedDate.getMonth() && 
             eDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  const getEventStyle = (event: CafeEvent) => {
    const baseClasses = "text-xs px-2 py-1 rounded border truncate cursor-pointer shadow-sm transition hover:shadow-md mb-1";
    const deptClass = DEPT_COLORS[event.department] || 'bg-gray-100 text-gray-800 border-gray-200';

    switch (event.status) {
      case EventStatus.APPROVED:
        return `${baseClasses} ${deptClass} border-l-4 border-l-green-500`;
      case EventStatus.PENDING:
        return `${baseClasses} ${deptClass} border-l-4 border-l-yellow-500 border-dashed`;
      case EventStatus.REJECTED:
        return `${baseClasses} bg-gray-50 text-gray-400 border-gray-200 border-l-4 border-l-red-500 line-through`;
      case EventStatus.COMPLETED:
        return `${baseClasses} ${deptClass} border-l-4 border-l-slate-500 opacity-60`;
      default:
        return `${baseClasses} ${deptClass}`;
    }
  };

  // --- Async Handlers ---
  const handleSaveEvent = async (newEvent: CafeEvent) => {
    console.log('handleSaveEvent called with:', newEvent);
    const isEdit = events.some(e => e.id === newEvent.id);
    const securedEvent = isAdmin ? newEvent : { ...newEvent, status: EventStatus.PENDING };

    try {
        console.log('isEdit:', isEdit, 'isAdmin:', isAdmin);
        if (isEdit) {
            console.log('Updating event...');
            await api.updateEvent(securedEvent);
            addToast('success', 'Etkinlik başarıyla güncellendi.');
        } else {
            console.log('Creating event...');
            await api.createEvent(securedEvent);
            addToast('success', 'Yeni etkinlik talebi oluşturuldu.');
        }
        
        // Refresh local state
        console.log('Refreshing events...');
        await fetchEvents();

        // Notifications logic (keep mostly local for UI feedback)
        if (isEdit) {
            if (!isAdmin) {
                addNotification(
                    'Talep Güncellendi', 
                    `"${securedEvent.title}" güncellendi ve tekrar onaya düştü.`, 
                    'system',
                    securedEvent.id
                );
            }
        } else {
            addNotification(
                'Yeni Talep',
                `${securedEvent.department} tarafından yeni talep oluşturuldu.`,
                'system',
                securedEvent.id
            );
        }
        console.log('Event saved successfully');
    } catch (err) {
        console.error('Error in handleSaveEvent:', err);
        const errorMessage = err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu.';
        addToast('error', errorMessage);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm("Bu etkinliği silmek istediğinize emin misiniz?")) {
      try {
          await api.deleteEvent(id);
          addToast('info', 'Etkinlik silindi.');
          setNotifications(prev => prev.filter(n => n.eventId !== id));
          await fetchEvents();
      } catch (err) {
          addToast('error', 'Silme işlemi başarısız.');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: EventStatus) => {
    const event = events.find(e => e.id === id);
    if (!event) return;

    const updatedEvent = { ...event, status: newStatus };
    
    try {
        await api.updateEvent(updatedEvent);
        await fetchEvents();
        addToast('success', `Durum güncellendi: ${newStatus}`);

        const actionText = 
            newStatus === EventStatus.APPROVED ? 'onaylandı' :
            newStatus === EventStatus.REJECTED ? 'reddedildi' :
            newStatus === EventStatus.COMPLETED ? 'tamamlandı olarak işaretlendi' : 'beklemeye alındı';

        addNotification(
            'Durum Değişikliği',
            `"${event.title}" etkinliği ${actionText}.`,
            'status_change',
            event.id
        );
    } catch (err) {
        addToast('error', 'Durum güncellenemedi.');
    }
  };

  const handleGenerateReport = (event: CafeEvent) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        addToast('error', 'Pop-up engelleyiciyi kontrol ediniz.');
        return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <title>Etkinlik Raporu - ${event.title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            .no-print { display: none; }
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body class="bg-white p-8 max-w-4xl mx-auto">
        <div class="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
          <div>
             <h1 class="text-3xl font-bold text-slate-900">LSV Cafe</h1>
             <p class="text-slate-500">Etkinlik Detay Raporu</p>
          </div>
          <div class="text-right">
             <p class="font-semibold text-lg">${new Date(event.startDate).toLocaleDateString('tr-TR')}</p>
             <p class="text-sm text-gray-500">Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
          </div>
        </div>

        <div class="mb-6 no-print flex justify-end">
          <button onclick="window.print()" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2 font-medium">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
             <span>Yazdır / PDF Olarak Kaydet</span>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-8 mb-8">
           <div>
              <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Etkinlik Bilgileri</h3>
              <div class="text-xl font-bold text-gray-900 mb-1">${event.title}</div>
              <div class="flex items-center gap-2 text-gray-600 mb-2">
                  <span class="px-2 py-1 bg-gray-100 rounded text-sm font-medium">${event.department}</span>
                  <span class="text-sm border-l pl-2">${event.status}</span>
              </div>
              <p class="text-gray-700">${event.description}</p>
           </div>
           <div class="bg-gray-50 p-4 rounded-lg">
               <div class="mb-3">
                   <span class="block text-xs font-bold text-gray-400 uppercase">Tarih & Saat</span>
                   <span class="font-medium text-gray-900">
                      ${new Date(event.startDate).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})} - 
                      ${new Date(event.endDate).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                   </span>
               </div>
               <div class="mb-3">
                   <span class="block text-xs font-bold text-gray-400 uppercase">Mekan</span>
                   <span class="font-medium text-gray-900">${event.location}</span>
               </div>
               <div>
                   <span class="block text-xs font-bold text-gray-400 uppercase">İlgili Kişi</span>
                   <span class="font-medium text-gray-900">${event.contactPerson}</span>
               </div>
           </div>
        </div>
        
        ${(event.actualAttendees !== undefined || event.outcomeNotes) ? `
        <div class="mb-8 border border-emerald-200 bg-emerald-50 rounded-lg p-4">
            <h3 class="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/><path d="m9 14 2 2 4-4"/></svg>
                Performans & Sonuç Değerlendirmesi
            </h3>
            <div class="grid grid-cols-2 gap-8">
                <div>
                    <span class="block text-xs font-bold text-gray-500 uppercase">Katılımcı Analizi</span>
                    <div class="flex items-end gap-4 mt-1">
                        <div>
                            <span class="text-sm text-gray-600">Beklenen</span>
                            <div class="text-xl font-bold text-gray-800">${event.attendees}</div>
                        </div>
                        <div class="text-gray-300">→</div>
                        <div>
                            <span class="text-sm text-gray-600">Gerçekleşen</span>
                            <div class="text-xl font-bold ${event.actualAttendees && event.actualAttendees >= event.attendees ? 'text-green-600' : 'text-blue-600'}">
                                ${event.actualAttendees || '-'}
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <span class="block text-xs font-bold text-gray-500 uppercase">Sonuç Notları</span>
                    <p class="mt-1 text-sm text-gray-800 italic">
                        "${event.outcomeNotes || 'Not girilmemiş.'}"
                    </p>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="mb-8 border rounded-lg overflow-hidden">
            <div class="bg-slate-100 px-4 py-2 border-b font-semibold text-slate-800">Kaynaklar & Gereksinimler</div>
            <div class="p-4 grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-sm text-gray-700 mb-2">Seçili Kaynaklar</h4>
                    <ul class="list-disc list-inside text-gray-600 text-sm">
                        ${event.resources && event.resources.length > 0 
                          ? event.resources.map(r => `<li>${r}</li>`).join('') 
                          : '<li class="italic text-gray-400">Kaynak seçilmedi</li>'}
                    </ul>
                </div>
                <div>
                    <h4 class="font-medium text-sm text-gray-700 mb-2">Özel İstekler / Notlar</h4>
                    <p class="text-sm text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-100">
                      ${event.requirements || 'Belirtilmedi'}
                    </p>
                </div>
            </div>
        </div>
        
        <div class="mt-12 pt-8 border-t border-gray-200 flex justify-between text-xs text-gray-500">
            <div>
                <p>LSV Cafe Event Management System</p>
            </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    const headers = ['Baslik', 'Departman', 'Baslangic', 'Bitis', 'Mekan', 'Durum', 'Ilgili Kisi', 'Beklenen Kisi', 'Gerceklesen Kisi', 'Notlar', 'Kaynaklar', 'Aciklama'];
    
    const csvContent = [
      headers.join(','),
      ...filteredEvents.map(e => {
        const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
        return [
          escape(e.title),
          escape(e.department),
          escape(new Date(e.startDate).toLocaleString('tr-TR')),
          escape(new Date(e.endDate).toLocaleString('tr-TR')),
          escape(e.location),
          escape(e.status),
          escape(e.contactPerson),
          e.attendees,
          e.actualAttendees || '',
          escape(e.outcomeNotes || ''),
          escape(e.resources ? e.resources.join(', ') : ''),
          escape(e.description)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `etkinlik_listesi_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('info', 'CSV dosyası indirildi.');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-800">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">LSV Cafe</h1>
          <p className="text-slate-400 text-sm">Etkinlik Yönetim Sistemi</p>
        </div>
        
        <nav className="mt-6 px-4 space-y-2 flex-1">
          <button 
            onClick={() => setView('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'calendar' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            <CalendarIcon size={20} />
            <span>Takvim Görünümü</span>
          </button>
          <button 
            onClick={() => setView('list')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'list' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}
          >
            <List size={20} />
            <span>Liste Görünümü</span>
          </button>
          {isAdmin && (
            <button 
              onClick={() => setIsAdminPanelOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition bg-purple-600 hover:bg-purple-700"
            >
              <Users size={20} />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        <div className="p-4 bg-slate-800 mt-2 mx-2 rounded-lg">
             <div className="flex items-center gap-2 mb-2">
                 {isAdmin ? <ShieldCheck className="text-green-400" size={18} /> : <ShieldAlert className="text-gray-400" size={18}/>}
                 <span className="text-xs font-semibold text-slate-300 uppercase">
                     {isAdmin ? 'Yönetici Modu' : 'Kullanıcı Modu'}
                 </span>
             </div>
             {isAdmin ? (
                 <button 
                    onClick={() => { 
                      api.logout();
                      setIsAdmin(false); 
                      addToast('info', 'Yönetici çıkışı yapıldı.'); 
                    }}
                    className="w-full text-left text-sm text-red-300 hover:text-white flex items-center gap-2 transition"
                 >
                     <LogOut size={14}/> Çıkış Yap
                 </button>
             ) : (
                 <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full text-left text-sm text-slate-400 hover:text-white flex items-center gap-2 transition"
                 >
                     <Lock size={14}/> Yönetici Girişi
                 </button>
             )}
        </div>

        <div className="p-6">
            <button 
              onClick={() => { setEditingEvent(null); setIsModalOpen(true); }}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 font-medium transition"
            >
                <Plus size={20} />
                Etkinlik Talep Et
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm z-10 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 whitespace-nowrap">
                {view === 'calendar' ? <CalendarIcon className="text-indigo-600"/> : <List className="text-indigo-600"/>}
                {view === 'calendar' ? 'Etkinlik Takvimi' : 'Tüm Etkinlikler'}
            </h2>
            {isLoading && <Loader2 className="animate-spin text-gray-400" size={18}/>}
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
             
             {/* Refresh Button */}
             <button 
                onClick={fetchEvents}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition"
                title="Verileri Yenile"
             >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
             </button>

             {/* Text Search */}
             <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text"
                    placeholder="Ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full md:w-48 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition focus:w-64"
                />
             </div>

             {/* Department Filter */}
             <div className="relative">
                <select 
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white cursor-pointer hover:bg-gray-50 max-w-[150px] truncate"
                >
                    <option value="all">Tüm Departmanlar</option>
                    {Object.values(Department).map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
                <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
             </div>

             {/* Status Filter */}
             <div className="relative">
                 <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white cursor-pointer hover:bg-gray-50 max-w-[150px] truncate"
                 >
                     <option value="all">Tüm Durumlar</option>
                     {Object.values(EventStatus).map(s => (
                         <option key={s} value={s}>{s}</option>
                     ))}
                 </select>
                 <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
             </div>

             {/* Date Range Filters - Only in List View */}
             {view === 'list' && (
                <>
                    <input 
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        title="Başlangıç Tarihi"
                    />
                    <span className="text-gray-400 text-sm hidden sm:inline">-</span>
                    <input 
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        title="Bitiş Tarihi"
                    />
                    {(filterStartDate || filterEndDate) && (
                        <button onClick={() => {setFilterStartDate(''); setFilterEndDate('');}} className="text-gray-400 hover:text-red-500 p-2 rounded hover:bg-gray-100 transition">
                            <X size={16} /> 
                        </button>
                    )}
                </>
             )}
             
             {/* Notification Center */}
             <div className="border-l pl-3 ml-2 flex items-center">
                <NotificationCenter 
                  notifications={notifications} 
                  onMarkRead={handleMarkRead} 
                  onClearAll={handleClearNotifications}
                />
             </div>

             {isAdmin && (
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    title="Listeyi Excel/CSV olarak indir"
                >
                    <Download size={16} />
                    <span className="hidden lg:inline">Dışa Aktar</span>
                </button>
             )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Toplam Etkinlik</p>
                            <h4 className="text-3xl font-bold text-gray-800 mt-2">{filteredEvents.length}</h4>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><LayoutDashboard size={20}/></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Onay Bekleyen</p>
                            <h4 className="text-3xl font-bold text-yellow-600 mt-2">
                                {filteredEvents.filter(e => e.status === EventStatus.PENDING).length}
                            </h4>
                        </div>
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Clock size={20}/></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Bu Hafta</p>
                            <h4 className="text-3xl font-bold text-indigo-600 mt-2">
                                {filteredEvents.filter(e => {
                                    const d = new Date(e.startDate);
                                    const now = new Date();
                                    const nextWeek = new Date();
                                    nextWeek.setDate(now.getDate() + 7);
                                    return d >= now && d <= nextWeek;
                                }).length}
                            </h4>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><CalendarIcon size={20}/></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Aktif Mekan</p>
                            <h4 className="text-xl font-bold text-green-600 mt-3 truncate">
                                LSV Cafe
                            </h4>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><MapPin size={20}/></div>
                    </div>
                </div>
            </div>


            {view === 'calendar' ? (
                /* Calendar View Implementation */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b">
                         <h3 className="text-lg font-bold text-gray-800">
                             {selectedDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                         </h3>
                         <div className="flex items-center gap-2">
                             <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft/></button>
                             <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight/></button>
                             {!isSelectedDateToday && (
                                 <button 
                                    onClick={() => setSelectedDate(new Date())} 
                                    className="ml-2 text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded transition"
                                 >
                                    Bugüne Dön
                                 </button>
                             )}
                         </div>
                    </div>
                    <div className="grid grid-cols-7 text-center py-2 bg-gray-50 border-b text-sm font-semibold text-gray-500">
                        <div>Pzt</div><div>Sal</div><div>Çar</div><div>Per</div><div>Cum</div><div>Cmt</div><div>Paz</div>
                    </div>
                    {isLoading ? (
                        <div className="h-[600px] flex items-center justify-center text-gray-400 gap-2">
                            <Loader2 className="animate-spin" size={32} />
                            Veriler yükleniyor...
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 auto-rows-fr h-[600px]">
                            {currentMonthDays.map((day, idx) => (
                                <div 
                                    key={idx} 
                                    className={`border-r border-b p-2 min-h-[80px] hover:bg-gray-50 transition relative group ${!day ? 'bg-gray-50/50' : ''}`}
                                    onClick={() => {
                                        if(day) {
                                            const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                                            setSelectedDate(newDate);
                                        }
                                    }}
                                >
                                    {day && (
                                        <>
                                            <span className={`text-sm font-medium ${
                                                day === new Date().getDate() && selectedDate.getMonth() === new Date().getMonth() 
                                                ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                                                : 'text-gray-700'
                                            }`}>
                                                {day}
                                            </span>
                                            <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                                                {getEventsForDay(day).map(ev => (
                                                    <div 
                                                        key={ev.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingEvent(ev);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className={getEventStyle(ev)}
                                                        title={`${ev.title} - ${ev.location} (${ev.status})`}
                                                    >
                                                        {new Date(ev.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {ev.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* List View Implementation */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                                <th className="p-4 font-medium">Etkinlik</th>
                                <th className="p-4 font-medium">Departman</th>
                                <th className="p-4 font-medium">Tarih & Saat</th>
                                <th className="p-4 font-medium">Mekan & Kaynak</th>
                                <th className="p-4 font-medium">Durum</th>
                                <th className="p-4 font-medium text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="animate-spin" size={24} />
                                            Yükleniyor...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEvents.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">
                                    {searchQuery || filterDept !== 'all' || filterStatus !== 'all' 
                                        ? 'Filtreleme kriterlerine uygun etkinlik bulunamadı.' 
                                        : 'Henüz etkinlik eklenmemiş.'}
                                </td></tr>
                            ) : filteredEvents.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(ev => (
                                <tr key={ev.id} className="hover:bg-blue-50/30 transition group">
                                    <td className="p-4">
                                        <div className="font-semibold text-gray-800">{ev.title}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{ev.description}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${DEPT_COLORS[ev.department]}`}>
                                            {ev.department}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div>{new Date(ev.startDate).toLocaleDateString('tr-TR')}</div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(ev.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                            {new Date(ev.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1 font-medium"><MapPin size={12}/> {ev.location || 'LSV Cafe'}</div>
                                        {ev.resources && ev.resources.length > 0 && (
                                            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1">
                                                {ev.resources.slice(0, 2).map(r => (
                                                    <span key={r} className="bg-gray-100 px-1 rounded">{r}</span>
                                                ))}
                                                {ev.resources.length > 2 && <span className="text-xs">+{ev.resources.length - 2}</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <select 
                                            value={ev.status}
                                            onChange={(e) => handleStatusChange(ev.id, e.target.value as EventStatus)}
                                            disabled={!isAdmin}
                                            className={`text-xs font-medium px-2 py-1 rounded-full border outline-none ${
                                                !isAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'
                                            } ${
                                                ev.status === EventStatus.APPROVED ? 'bg-green-100 text-green-700 border-green-200' :
                                                ev.status === EventStatus.PENDING ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                ev.status === EventStatus.REJECTED ? 'bg-red-100 text-red-700 border-red-200' :
                                                'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}
                                        >
                                            {Object.values(EventStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {isAdmin && (
                                                <button 
                                                    onClick={() => handleGenerateReport(ev)}
                                                    className="text-gray-500 hover:text-indigo-600 text-sm p-1"
                                                    title="Rapor"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => { setEditingEvent(ev); setIsModalOpen(true); }}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >
                                                {isAdmin ? 'Düzenle' : 'Görüntüle/Düzenle'}
                                            </button>
                                            {isAdmin && (
                                                <button 
                                                    onClick={() => handleDeleteEvent(ev.id)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    Sil
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </main>

      {/* Auth Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => { setIsLoginModalOpen(false); if(isAdmin) addToast('success', 'Yönetici girişi başarılı.'); }} 
        onLogin={setIsAdmin} 
      />

      {/* Event Modal */}
      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingEvent(null); }} 
        onSave={handleSaveEvent}
        onReport={isAdmin ? handleGenerateReport : undefined}
        initialDate={selectedDate}
        existingEvent={editingEvent}
        existingEvents={events}
        isAdmin={isAdmin}
      />

      {/* Admin Panel */}
      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
      />
    </div>
  );
};

export default App;