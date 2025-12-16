/** @deprecated - Departments are now fetched from API as DepartmentConfig */
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

/** @deprecated - Locations are now fetched from API as LocationConfig */
export const LOCATIONS = ['LSV Cafe'];

/** @deprecated - Resources are now fetched from API as ResourceConfig */
export const RESOURCES = ['Kuru Pasta', 'Kutlama Pastası', 'Soğuk İçecek', 'Sıcak İçecek', 'Projeksiyon', 'Ses Sistemi'];

export interface CafeEvent {
  id: string;
  title: string;
  
  // UUID bazlı yeni alanlar (backend ile uyumlu)
  departmentId?: string | null;
  locationId?: string | null;
  resourceIds?: string[];
  
  // Geriye dönük uyumluluk için deprecated alanlar
  /** @deprecated Use departmentId instead */
  department?: string;
  /** @deprecated Use locationId instead */
  location?: string;
  /** @deprecated Use resourceIds instead - only for display */
  resources?: string[];
  
  description: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  attendees: number;
  status: EventStatus;
  contactPerson: string;
  requirements?: string;
  
  // Post-Event Reporting Fields
  actualAttendees?: number;
  outcomeNotes?: string;
  
  // Audit fields (backend'den gelecek)
  createdBy?: { id: string; username: string };
  updatedBy?: { id: string; username: string };
  createdAt?: string;
  updatedAt?: string;
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

// Admin Panel Types
export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt?: string;
}

export interface DepartmentConfig {
  id: string;
  name: string;
  code?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceConfig {
  id: string;
  name: string;
  type: 'equipment' | 'consumable';
  exclusive: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationConfig {
  id: string;
  name: string;
  capacity?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventLog {
  id: string;
  eventId: string;
  action: string;
  actorId?: string;
  payload?: string;
  createdAt: string;
  event?: {
    id: string;
    title: string;
  };
  actor?: {
    id: string;
    username: string;
  };
}