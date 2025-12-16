import { CafeEvent, EventStatus, AppNotification } from '../types';

// GERÇEK ORTAMDA BU DEĞERİ FALSE YAPIN
// VE BACKEND URL'İNİZİ GİRİN
const USE_MOCK_BACKEND = false;
const API_BASE_URL = '/api';

// Token helper functions
const getToken = (): string | null => {
  return localStorage.getItem('lsv_cafe_token');
};

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Types
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    username: string;
    role: 'admin' | 'user';
  };
  message?: string;
}

// Mock Data Storage (Memory for session, simulating DB)
let MOCK_DB_EVENTS: CafeEvent[] = [];
try {
  const saved = localStorage.getItem('lsv_cafe_events');
  if (saved) MOCK_DB_EVENTS = JSON.parse(saved);
} catch (e) { }

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- AUTH ---
  login: async (username: string, password: string): Promise<LoginResponse> => {
    if (USE_MOCK_BACKEND) {
      await delay(800); // Simulate network latency
      if (username === 'admin' && password === 'admin123') {
        return {
          success: true,
          token: 'mock-jwt-token-xyz',
          user: { username: 'admin', role: 'admin' }
        };
      }
      return { success: false, message: 'Hatalı kullanıcı adı veya parola.' };
    }

    // Real Backend Call
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  // --- EVENTS ---
  getEvents: async (): Promise<CafeEvent[]> => {
    if (USE_MOCK_BACKEND) {
      await delay(500);
      return [...MOCK_DB_EVENTS];
    }
    const res = await fetch(`${API_BASE_URL}/events`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  createEvent: async (event: CafeEvent): Promise<CafeEvent> => {
    if (USE_MOCK_BACKEND) {
      await delay(600);
      MOCK_DB_EVENTS.push(event);
      localStorage.setItem('lsv_cafe_events', JSON.stringify(MOCK_DB_EVENTS));
      return event;
    }
    console.log('Creating event:', event);
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(event)
    });
    console.log('Create event response status:', res.status);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Create event error:', errorData);
      throw new Error(errorData.message || errorData.error || 'Failed to create event');
    }
    const result = await res.json();
    console.log('Create event success:', result);
    return result;
  },

  updateEvent: async (event: CafeEvent): Promise<CafeEvent> => {
    if (USE_MOCK_BACKEND) {
      await delay(600);
      MOCK_DB_EVENTS = MOCK_DB_EVENTS.map(e => e.id === event.id ? event : e);
      localStorage.setItem('lsv_cafe_events', JSON.stringify(MOCK_DB_EVENTS));
      return event;
    }
    const res = await fetch(`${API_BASE_URL}/events/${event.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(event)
    });
    if (!res.ok) throw new Error('Failed to update event');
    return res.json();
  },

  deleteEvent: async (id: string): Promise<void> => {
    if (USE_MOCK_BACKEND) {
      await delay(400);
      MOCK_DB_EVENTS = MOCK_DB_EVENTS.filter(e => e.id !== id);
      localStorage.setItem('lsv_cafe_events', JSON.stringify(MOCK_DB_EVENTS));
      return;
    }
    const res = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete event');
  },

  // Logout helper
  logout: (): void => {
    localStorage.removeItem('lsv_cafe_token');
    localStorage.removeItem('lsv_cafe_user');
  },

  // --- ADMIN: USERS ---
  getUsers: async () => {
    const res = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  createUser: async (data: { username: string; password: string; role?: string }) => {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return res.json();
  },

  updateUser: async (id: string, data: { username?: string; role?: string; password?: string }) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update user');
    }
    return res.json();
  },

  deleteUser: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete user');
    }
  },

  resetPassword: async (id: string, newPassword: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to reset password');
    }
    return res.json();
  },

  // --- ADMIN: DEPARTMENTS ---
  getDepartments: async () => {
    const res = await fetch(`${API_BASE_URL}/config/departments`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },

  createDepartment: async (data: { name: string; code?: string }) => {
    const res = await fetch(`${API_BASE_URL}/config/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create department');
    }
    return res.json();
  },

  updateDepartment: async (id: string, data: { name?: string; code?: string; active?: boolean }) => {
    const res = await fetch(`${API_BASE_URL}/config/departments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update department');
    }
    return res.json();
  },

  deleteDepartment: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/config/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete department');
    }
  },

  // --- ADMIN: RESOURCES ---
  getResources: async () => {
    const res = await fetch(`${API_BASE_URL}/config/resources`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
  },

  createResource: async (data: { name: string; type: string; exclusive?: boolean }) => {
    const res = await fetch(`${API_BASE_URL}/config/resources`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create resource');
    }
    return res.json();
  },

  updateResource: async (id: string, data: { name?: string; type?: string; exclusive?: boolean; active?: boolean }) => {
    const res = await fetch(`${API_BASE_URL}/config/resources/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update resource');
    }
    return res.json();
  },

  deleteResource: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/config/resources/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete resource');
    }
  },

  // --- ADMIN: LOCATIONS ---
  getLocations: async () => {
    const res = await fetch(`${API_BASE_URL}/config/locations`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch locations');
    return res.json();
  },

  createLocation: async (data: { name: string; capacity?: number }) => {
    const res = await fetch(`${API_BASE_URL}/config/locations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create location');
    }
    return res.json();
  },

  updateLocation: async (id: string, data: { name?: string; capacity?: number; active?: boolean }) => {
    const res = await fetch(`${API_BASE_URL}/config/locations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update location');
    }
    return res.json();
  },

  deleteLocation: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/config/locations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete location');
    }
  },

  // --- ADMIN: EVENT APPROVAL ---
  approveEvent: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/events/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to approve event');
    }
    return res.json();
  },

  rejectEvent: async (id: string, reason?: string) => {
    const res = await fetch(`${API_BASE_URL}/events/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to reject event');
    }
    return res.json();
  },

  // --- ADMIN: LOGS ---
  getEventLogs: async (eventId: string) => {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/logs`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch event logs');
    return res.json();
  },

  getAllLogs: async () => {
    const res = await fetch(`${API_BASE_URL}/events/logs/all`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  }
};
