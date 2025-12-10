import { CafeEvent, EventStatus, AppNotification } from '../types';

// GERÇEK ORTAMDA BU DEĞERİ FALSE YAPIN
// VE BACKEND URL'İNİZİ GİRİN
const USE_MOCK_BACKEND = false;
const API_BASE_URL = '/api';

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
  login: async (password: string): Promise<LoginResponse> => {
    if (USE_MOCK_BACKEND) {
      await delay(800); // Simulate network latency
      if (password === 'admin123') {
        return {
          success: true,
          token: 'mock-jwt-token-xyz',
          user: { username: 'admin', role: 'admin' }
        };
      }
      return { success: false, message: 'Hatalı parola.' };
    }

    // Real Backend Call
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return res.json();
  },

  // --- EVENTS ---
  getEvents: async (): Promise<CafeEvent[]> => {
    if (USE_MOCK_BACKEND) {
      await delay(500);
      return [...MOCK_DB_EVENTS];
    }
    const res = await fetch(`${API_BASE_URL}/events`);
    return res.json();
  },

  createEvent: async (event: CafeEvent): Promise<CafeEvent> => {
    if (USE_MOCK_BACKEND) {
      await delay(600);
      MOCK_DB_EVENTS.push(event);
      localStorage.setItem('lsv_cafe_events', JSON.stringify(MOCK_DB_EVENTS));
      return event;
    }
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    return res.json();
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    return res.json();
  },

  deleteEvent: async (id: string): Promise<void> => {
    if (USE_MOCK_BACKEND) {
      await delay(400);
      MOCK_DB_EVENTS = MOCK_DB_EVENTS.filter(e => e.id !== id);
      localStorage.setItem('lsv_cafe_events', JSON.stringify(MOCK_DB_EVENTS));
      return;
    }
    await fetch(`${API_BASE_URL}/events/${id}`, { method: 'DELETE' });
  }
};
