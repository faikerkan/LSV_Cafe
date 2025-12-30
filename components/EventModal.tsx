import React, { useState, useEffect, useMemo } from 'react';
import { CafeEvent, Department, EventStatus, LOCATIONS, RESOURCES, DepartmentConfig, ResourceConfig, LocationConfig } from '../types';
import { X, AlertTriangle, CalendarClock, ChevronLeft, MapPin, Box, Printer, AlertCircle, ClipboardCheck, TrendingUp, TrendingDown, Minus, Info, Clock } from 'lucide-react';
import { CustomSelect } from './ui/CustomSelect';

// Sadece belirli ekipmanlar çakışma yaratır. Yiyecek/İçecekler paylaşılabilir.
const EXCLUSIVE_RESOURCES = ['Projeksiyon', 'Ses Sistemi'];

// Safari gibi tarayıcılarda crypto.randomUUID yoksa geri dönüş
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

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CafeEvent) => void;
  onReport?: (event: CafeEvent) => void;
  initialDate?: Date;
  existingEvent?: CafeEvent | null;
  existingEvents: CafeEvent[];
  isAdmin?: boolean;
  
  // Yeni props - dinamik listeler
  departments: DepartmentConfig[];
  resources: ResourceConfig[];
  locations: LocationConfig[];
  configLoading: boolean;
}

interface ConflictDetail {
  event: CafeEvent;
  reason: string;
}

export const EventModal: React.FC<EventModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onReport,
  initialDate, 
  existingEvent,
  existingEvents,
  isAdmin = false,
  departments,
  resources,
  locations,
  configLoading
}) => {
  // Conflict Handling
  const [conflictingEvents, setConflictingEvents] = useState<ConflictDetail[]>([]);
  const [showConflictView, setShowConflictView] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<CafeEvent | null>(null);

  // Form State (UUID bazlı)
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [attendees, setAttendees] = useState(10);
  const [contactPerson, setContactPerson] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [locationId, setLocationId] = useState<string>('');
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  
  // Report State
  const [actualAttendees, setActualAttendees] = useState<number | ''>('');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  // Reset function
  const resetForm = () => {
    setTitle('');
    setDepartmentId('');
    if (initialDate) {
        setStartDate(initialDate.toISOString().split('T')[0]);
    } else {
        setStartDate(new Date().toISOString().split('T')[0]);
    }
    setStartTime('09:00');
    setEndTime('10:00');
    setAttendees(10);
    setContactPerson('');
    setDescription('');
    setRequirements('');
    setLocationId('');
    setSelectedResourceIds([]);
    setConflictingEvents([]);
    setShowConflictView(false);
    setPendingEvent(null);
    setActualAttendees('');
    setOutcomeNotes('');
  };

  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        setTitle(existingEvent.title);
        
        // Departman - UUID'den çalış, yoksa eski string'i map et (geriye dönük uyumluluk)
        if (existingEvent.departmentId) {
          setDepartmentId(existingEvent.departmentId);
        } else if (existingEvent.department && departments.length > 0) {
          // Eski string department name'i UUID'ye map et
          const dept = departments.find(d => d.name === existingEvent.department);
          setDepartmentId(dept?.id || '');
        } else {
          setDepartmentId('');
        }
        
        // Lokasyon - UUID'den çalış, yoksa eski string'i map et
        if (existingEvent.locationId) {
          setLocationId(existingEvent.locationId);
        } else if (existingEvent.location && locations.length > 0) {
          const loc = locations.find(l => l.name === existingEvent.location);
          setLocationId(loc?.id || '');
        } else {
          setLocationId('');
        }
        
        // Kaynaklar - UUID'lerden çalış, yoksa eski string'leri map et
        if (existingEvent.resourceIds) {
          setSelectedResourceIds(existingEvent.resourceIds);
        } else if (existingEvent.resources && resources.length > 0) {
          // String name'lerden UUID'lere map et
          const ids = existingEvent.resources
            .map(name => resources.find(r => r.name === name)?.id)
            .filter((id): id is string => !!id);
          setSelectedResourceIds(ids);
        } else {
          setSelectedResourceIds([]);
        }
        
        const start = new Date(existingEvent.startDate);
        const end = new Date(existingEvent.endDate);
        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));
        setEndTime(end.toTimeString().slice(0, 5));
        setAttendees(existingEvent.attendees);
        setContactPerson(existingEvent.contactPerson);
        setDescription(existingEvent.description);
        setRequirements(existingEvent.requirements || '');
        setActualAttendees(existingEvent.actualAttendees || '');
        setOutcomeNotes(existingEvent.outcomeNotes || '');
      } else {
        resetForm();
      }
      setShowConflictView(false);
    }
  }, [isOpen, initialDate, existingEvent, departments, resources, locations]);

  // --- Real-time Schedule Preview Logic ---
  const eventsOnSelectedDate = useMemo(() => {
    if (!startDate) return [];
    return existingEvents.filter(e => {
        // Filter by date match
        const isSameDay = e.startDate.startsWith(startDate);
        // Exclude rejected events
        const isNotRejected = e.status !== EventStatus.REJECTED;
        // Exclude the event currently being edited (if editing)
        const isNotSelf = existingEvent ? e.id !== existingEvent.id : true;
        
        return isSameDay && isNotRejected && isNotSelf;
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [startDate, existingEvents, existingEvent]);


  // --- Real-time Conflict Detection ---
  const realTimeConflicts = useMemo(() => {
    const conflicts = new Map<string, { hasConflict: boolean; reasons: string[] }>();
    
    if (!startTime || !endTime || !startDate) return conflicts;
    
    const nStart = new Date(`${startDate}T${startTime}`);
    const nEnd = new Date(`${startDate}T${endTime}`);
    
    eventsOnSelectedDate.forEach(event => {
      const eStart = new Date(event.startDate);
      const eEnd = new Date(event.endDate);
      
      const hasTimeOverlap = nStart < eEnd && nEnd > eStart;
      const reasons: string[] = [];
      
      if (hasTimeOverlap) {
        // Mekan çakışması kontrolü
        if (locationId && event.locationId === locationId) {
          const locName = locations.find(l => l.id === locationId)?.name;
          reasons.push(`Mekan: ${locName}`);
        }
        
        // Ekipman çakışması kontrolü (sadece exclusive olanlar)
        if (selectedResourceIds.length > 0 && event.resourceIds) {
          const conflictingRes = selectedResourceIds.filter(rid => {
            const res = resources.find(r => r.id === rid);
            return res?.exclusive && event.resourceIds?.includes(rid);
          });
          
          if (conflictingRes.length > 0) {
            const names = conflictingRes
              .map(id => resources.find(r => r.id === id)?.name)
              .filter(Boolean)
              .join(", ");
            reasons.push(`Ekipman: ${names}`);
          }
        }
      }
      
      conflicts.set(event.id, {
        hasConflict: reasons.length > 0,
        reasons
      });
    });
    
    return conflicts;
  }, [startTime, endTime, startDate, locationId, selectedResourceIds, eventsOnSelectedDate, locations, resources]);

  const handleResourceToggle = (resId: string) => {
    setSelectedResourceIds(prev => 
      prev.includes(resId) ? prev.filter(r => r !== resId) : [...prev, resId]
    );
  };

  const getDeviation = () => {
    if (!actualAttendees || actualAttendees === '') return null;
    const diff = Number(actualAttendees) - attendees;
    return diff;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${startDate}T${endTime}`);

      if (endDateTime <= startDateTime) {
        alert("Bitiş saati başlangıç saatinden sonra olmalıdır.");
        return;
      }

      if (!title.trim()) {
        alert("Etkinlik adı gereklidir.");
        return;
      }

      if (!contactPerson.trim()) {
        alert("İlgili kişi gereklidir.");
        return;
      }

      const newEvent: CafeEvent = {
        id: existingEvent ? existingEvent.id : safeRandomId(),
        title: title.trim(),
        
        // UUID bazlı yeni alanlar
        departmentId: departmentId || null,
        locationId: locationId || null,
        resourceIds: selectedResourceIds,
        
        // Display için deprecated alanlar (backend response'dan güncellenecek)
        department: departments.find(d => d.id === departmentId)?.name,
        location: locations.find(l => l.id === locationId)?.name,
        resources: selectedResourceIds.map(id => 
          resources.find(r => r.id === id)?.name || ''
        ).filter(Boolean),
        
        description: description.trim(),
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        attendees,
        status: existingEvent ? existingEvent.status : EventStatus.PENDING,
        contactPerson: contactPerson.trim(),
        requirements: requirements.trim() || undefined,
        actualAttendees: actualAttendees === '' ? undefined : Number(actualAttendees),
        outcomeNotes: outcomeNotes.trim() || undefined
      };

      console.log('Submitting event:', newEvent);

      // --- ROBUST CONFLICT CHECKING LOGIC ---
      // Conflict exists if:
      // 1. Time overlaps AND
      // 2. (Same Location OR Shared Exclusive Resource)
      
      const detectedConflicts: ConflictDetail[] = [];

      existingEvents.forEach(e => {
          // Skip self
          if (e.id === newEvent.id) return;
          // Skip rejected/cancelled events
          if (e.status === EventStatus.REJECTED) return;
          
          const eStart = new Date(e.startDate);
          const eEnd = new Date(e.endDate);
          const nStart = new Date(newEvent.startDate);
          const nEnd = new Date(newEvent.endDate);

          // Check time overlap
          // (StartA < EndB) and (EndA > StartB)
          const hasTimeOverlap = nStart < eEnd && nEnd > eStart;

          if (hasTimeOverlap) {
              const reasons: string[] = [];

              // 1. Check Location Conflict (UUID bazlı)
              if (e.locationId && newEvent.locationId && e.locationId === newEvent.locationId) {
                  const locName = locations.find(l => l.id === newEvent.locationId)?.name || 'Bilinmeyen';
                  reasons.push(`Mekan Dolu: ${locName}`);
              }

              // 2. Check Resource Conflict (UUID bazlı - Sadece Exclusive kaynaklar)
              if (newEvent.resourceIds && e.resourceIds) {
                const conflictingResourceIds = newEvent.resourceIds.filter(rId => {
                  const resource = resources.find(r => r.id === rId);
                  return resource?.exclusive && e.resourceIds?.includes(rId);
                });
                
                if (conflictingResourceIds.length > 0) {
                  const names = conflictingResourceIds
                    .map(id => resources.find(r => r.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');
                  reasons.push(`Ekipman Çakışması: ${names}`);
                }
              }

              // If there is any blocking reason, add to conflicts
              if (reasons.length > 0) {
                  detectedConflicts.push({
                      event: e,
                      reason: reasons.join(' & ')
                  });
              }
          }
      });

      if (detectedConflicts.length > 0) {
          setConflictingEvents(detectedConflicts);
          setPendingEvent(newEvent);
          setShowConflictView(true);
      } else {
          console.log('No conflicts, calling onSave');
          await onSave(newEvent);
          onClose();
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  const handleForceSave = () => {
    if (pendingEvent) {
        onSave(pendingEvent);
        onClose();
    }
  };

  const handleBackToEdit = () => {
    setShowConflictView(false);
    setPendingEvent(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl lg:rounded-xl rounded-t-none lg:shadow-2xl w-full lg:max-w-2xl h-full lg:h-auto max-h-[100vh] lg:max-h-[90vh] overflow-hidden relative min-h-[400px] max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className={`text-white p-4 flex justify-between items-center sticky top-0 z-10 ${showConflictView ? 'bg-amber-600' : 'bg-slate-900'}`}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {showConflictView ? (
                <>
                    <AlertTriangle className="text-white" size={24} />
                    Çakışma Tespit Edildi
                </>
            ) : (
                existingEvent ? (isAdmin ? 'Etkinliği Düzenle' : 'Etkinlik Detayları / Düzenle') : 'Yeni Etkinlik Talep Et'
            )}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition">
            <X size={24} />
          </button>
        </div>
                {!isLoggedIn && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mx-6 mt-4">
                        <div className="flex items-center gap-2">
                            <Info size={16} className="text-yellow-600" />
                            <p className="text-sm text-yellow-800">
                                <strong>Görüntüleme Modu:</strong> Değişiklik yapmak için lütfen giriş yapın.
                            </p>
                        </div>
                    </div>
                )}

        {/* CONFLICT VIEW OVERLAY */}
        {showConflictView && pendingEvent ? (
           <div className="p-6">
               <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                   <div className="flex gap-3 text-amber-800">
                       <AlertCircle className="shrink-0" size={24}/>
                       <div>
                           <p className="font-bold text-lg mb-1">Dikkat!</p>
                           <p className="text-sm">
                               Seçtiğiniz tarih ve saat aralığında, talep edilen <strong>mekan</strong> veya <strong>özel ekipmanlar</strong> (Projeksiyon vb.) başka bir etkinlik tarafından kullanılıyor.
                           </p>
                       </div>
                   </div>
               </div>
               
               <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">Sizin Etkinliğiniz</h3>
               <div className="flex items-start justify-between bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                    <div>
                        <h4 className="font-bold text-gray-800">{pendingEvent.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                             <MapPin size={14}/> {pendingEvent.location}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                            {new Date(pendingEvent.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                            {new Date(pendingEvent.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {pendingEvent.department}
                    </span>
               </div>

               <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">Çakışan Etkinlikler ({conflictingEvents.length})</h3>
               <div className="space-y-3 mb-8">
                   {conflictingEvents.map((item, idx) => (
                       <div key={idx} className="bg-white border-l-4 border-amber-500 shadow-sm p-4 rounded-r-lg border-y border-r border-gray-100">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800">{item.event.title}</div>
                                    <div className="text-sm text-red-600 font-bold mt-1 flex items-center gap-1">
                                        <AlertTriangle size={14} />
                                        {item.reason}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <CalendarClock size={14} />
                                        {new Date(item.event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                        {new Date(item.event.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">{item.event.department}</div>
                                    <div className="text-xs mt-1 text-gray-400">{item.event.contactPerson}</div>
                                </div>
                            </div>
                       </div>
                   ))}
               </div>

               <div className="flex gap-3 justify-end border-t pt-4">
                   <button 
                     onClick={handleBackToEdit}
                     className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition flex items-center gap-2"
                   >
                       <ChevronLeft size={16} />
                       Düzenlemeye Dön
                   </button>
                   <button 
                     onClick={handleForceSave}
                     className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition shadow-lg flex items-center gap-2"
                   >
                       <AlertTriangle size={16} />
                       Yine de Kaydet
                   </button>
               </div>
           </div>
        ) : (
            /* NORMAL FORM VIEW */
            <>
                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Etkinlik Adı</label>
                    <input 
                    required
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Departman</label>
                    {configLoading ? (
                      <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">Yükleniyor...</div>
                    ) : (
                      <CustomSelect
                        value={departmentId}
                        onChange={setDepartmentId}
                        options={departments.map(dept => ({
                          value: dept.id,
                          label: dept.name,
                          subtitle: dept.code ? `Kod: ${dept.code}` : undefined
                        }))}
                        placeholder="-- Departman Seçin --"
                        required
                      />
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mekan / Salon</label>
                    {configLoading ? (
                      <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">Yükleniyor...</div>
                    ) : (
                      <CustomSelect
                        value={locationId}
                        onChange={setLocationId}
                        options={locations.map(loc => ({
                          value: loc.id,
                          label: loc.name,
                          subtitle: loc.capacity ? `Kapasite: ${loc.capacity} kişi` : undefined
                        }))}
                        placeholder="-- Mekan Seçin --"
                        required
                      />
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tarih</label>
                    <input 
                    required
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Başlangıç</label>
                        <input 
                        required
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Bitiş</label>
                        <input 
                        required
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* SCHEDULE PREVIEW - Helps departments communicate implicitly by seeing busy slots */}
                {startDate && (
                    <div className="col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-4 shadow-md">
                         {(() => {
                             const conflictCount = Array.from(realTimeConflicts.values())
                                 .filter(c => c.hasConflict).length;
                             return (
                                 <div className={`
                                     flex items-center gap-2 mb-3 pb-3 border-b-2
                                     ${conflictCount > 0 ? 'border-red-300' : 'border-indigo-200'}
                                 `}>
                                     <div className={`
                                         p-2 rounded-lg
                                         ${conflictCount > 0 ? 'bg-red-100' : 'bg-indigo-100'}
                                     `}>
                                         <CalendarClock 
                                             size={20} 
                                             className={conflictCount > 0 ? 'text-red-600' : 'text-indigo-600'}
                                         />
                                     </div>
                                     <div className="flex-1">
                                         <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                                             {new Date(startDate).toLocaleDateString('tr-TR')} Tarihindeki Diğer Etkinlikler
                                         </h4>
                                         {eventsOnSelectedDate.length > 0 && (
                                             <p className="text-xs text-gray-600 mt-0.5">
                                                 {eventsOnSelectedDate.length} etkinlik planlanmış
                                             </p>
                                         )}
                                     </div>
                                     {conflictCount > 0 && (
                                         <span className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm animate-pulse">
                                             <AlertTriangle size={14} />
                                             {conflictCount} Çakışma
                                         </span>
                                     )}
                                 </div>
                             );
                         })()}
                         {eventsOnSelectedDate.length === 0 ? (
                             <p className="text-sm text-gray-400 italic">Bu tarihte planlanmış başka etkinlik yok. Müsait.</p>
                         ) : (
                             <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                                 {eventsOnSelectedDate.map(e => {
                                     const conflict = realTimeConflicts.get(e.id);
                                     const hasConflict = conflict?.hasConflict || false;
                                     const eStart = new Date(e.startDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                                     const eEnd = new Date(e.endDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                                     return (
                                         <div 
                                             key={e.id} 
                                             className={`
                                                 flex items-center text-sm p-2 rounded shadow-sm transition-all
                                                 ${hasConflict 
                                                     ? 'bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 animate-pulse' 
                                                     : 'bg-white border-l-4 border-green-200 border border-gray-200'
                                                 }
                                             `}
                                         >
                                             {hasConflict && (
                                                 <AlertTriangle className="text-red-500 mr-2 flex-shrink-0" size={16} />
                                             )}
                                             <div className="font-mono text-xs font-semibold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 mr-2">
                                                 {eStart}-{eEnd}
                                             </div>
                                             <div className="flex-1 truncate">
                                                 <span className="font-medium text-gray-800">{e.title}</span>
                                                 {hasConflict && (
                                                     <div className="text-xs text-red-600 font-semibold mt-0.5">
                                                         ⚠️ {conflict.reasons.join(' & ')}
                                                     </div>
                                                 )}
                                             </div>
                                             <div className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                                                 {e.department}
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Beklenen Kişi Sayısı</label>
                    <input 
                        required
                        type="number"
                        min="1"
                        value={attendees}
                        onChange={(e) => setAttendees(parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">İlgili Kişi</label>
                    <input 
                    required
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span>Gerekli Kaynaklar / Ekipmanlar</span>
                        <span className="text-xs font-normal text-gray-500">* işaretliler çakışma yaratabilir</span>
                    </label>
                    {configLoading ? (
                      <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">Yükleniyor...</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        {resources.map(res => {
                            const isExclusive = res.exclusive;
                            const isSelected = selectedResourceIds.includes(res.id);
                            return (
                                <button
                                    key={res.id}
                                    type="button"
                                    onClick={() => handleResourceToggle(res.id)}
                                    className={`
                                        px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all
                                        flex items-center gap-3 min-h-[48px] touch-manipulation
                                        ${isSelected 
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:shadow-sm active:scale-[0.98]'
                                        }
                                    `}
                                >
                                    <div className={`
                                        w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                                        ${isSelected 
                                          ? 'bg-white border-white' 
                                          : 'bg-white border-gray-400'
                                        }
                                    `}>
                                        {isSelected && <Box size={14} className="text-indigo-600" strokeWidth={3} />}
                                    </div>
                                    <span className="flex-1 text-left">{res.name}</span>
                                    {isExclusive && <span className="text-xs opacity-70 flex-shrink-0">*</span>}
                                </button>
                            );
                        })}
                      </div>
                    )}
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Açıklama & Notlar</label>
                    <textarea 
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Organizasyonun amacı, tipi..."
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Özel İstekler (Yeme/İçme vb.)</label>
                    <textarea 
                    rows={2}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Örn: Glutensiz menü, bistro masa..."
                    />
                </div>

                {/* POST EVENT REPORTING SECTION - Visible only for existing events */}
                {existingEvent && (
                    <div className="col-span-2 mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3 text-emerald-800 border-b border-emerald-200 pb-2">
                            <ClipboardCheck size={20} />
                            <h3 className="font-bold">Etkinlik Sonuç Raporu</h3>
                            <span className="text-xs font-normal text-emerald-600 ml-auto">Organizasyon sonrası doldurulur</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Gerçekleşen Katılımcı Sayısı</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number"
                                        min="0"
                                        value={actualAttendees}
                                        onChange={(e) => setActualAttendees(e.target.value ? parseInt(e.target.value) : '')}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder={attendees.toString()}
                                    />
                                    {getDeviation() !== null && (
                                        <div className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${
                                            (getDeviation() || 0) > 0 ? 'bg-green-100 text-green-700' : 
                                            (getDeviation() || 0) < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {(getDeviation() || 0) > 0 ? <TrendingUp size={12}/> : (getDeviation() || 0) < 0 ? <TrendingDown size={12}/> : <Minus size={12}/>}
                                            {Math.abs(getDeviation() || 0)} Fark
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Sonuç Notları & Değerlendirme</label>
                                <textarea 
                                    rows={2}
                                    value={outcomeNotes}
                                    onChange={(e) => setOutcomeNotes(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                    placeholder="Organizasyon nasıl geçti? Aksaklıklar, memnuniyet durumu..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="col-span-2 flex justify-between mt-4 pt-4 border-t">
                    <div>
                        {existingEvent && onReport && isAdmin && (
                            <button
                                type="button"
                                onClick={() => onReport(existingEvent)}
                                className="px-4 py-2 text-indigo-600 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition flex items-center gap-2 text-sm font-medium"
                            >
                                <Printer size={16} />
                                Rapor Al
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                        >
                        İptal
                        </button>
                        {isLoggedIn ? (
                    <button 
                        type="submit"
                        className="px-6 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition shadow-lg"
                        >
                        {existingEvent ? (isAdmin ? 'Güncelle' : 'Talep Güncelle') : 'Talep Oluştur'}
                        </button>
                ) : (
                    <button type="button" onClick={onClose} className="w-full bg-gray-400 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded transition">
                        Kapat
                    </button>
                )}
                    </div>
                </div>
                </form>
            </>
        )}
      </div>
    </div>
  );
};