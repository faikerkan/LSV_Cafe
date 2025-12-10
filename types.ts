
export enum Department {
  PR = 'Halkla İlişkiler',
  CORP_COMM = 'Kurumlarla İletişim',
  VOLUNTEER_COMM = 'Gönüllü İletişimi',
  CORP_PR = 'Kurumsal Halkla İlişkiler',
  SOCIAL_SERVICES = 'Sosyal Hizmetler',
  ACTIVE_COMM = 'Aktif İletişim',
  FAYDA = 'FAYDA',
  INCI = 'İnci'
}

export enum EventStatus {
  PENDING = 'Onay Bekliyor',
  APPROVED = 'Onaylandı',
  REJECTED = 'İptal/Red',
  COMPLETED = 'Tamamlandı'
}

export const LOCATIONS = ['LSV Cafe'];
export const RESOURCES = ['Kuru Pasta', 'Kutlama Pastası', 'Soğuk İçecek', 'Sıcak İçecek', 'Projeksiyon', 'Ses Sistemi'];

export interface CafeEvent {
  id: string;
  title: string;
  department: Department;
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  attendees: number;
  status: EventStatus;
  contactPerson: string;
  requirements?: string;
  location: string;
  resources: string[];
  
  // Post-Event Reporting Fields
  actualAttendees?: number;
  outcomeNotes?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictingEvents: CafeEvent[];
  message: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  type: 'status_change' | 'reminder' | 'system';
  eventId?: string;
}