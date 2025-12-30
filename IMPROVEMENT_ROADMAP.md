# 🚀 LSV CAFE - GELİŞTİRME YOLU HARİTASI
**Dünya Standartları Production-Ready Önerileri**

## 📋 İÇİNDEKİLER
1. [UI/UX İyileştirmeleri](#1-uiux-iyileştirmeleri)
2. [State Management](#2-state-management)
3. [Performance Optimizasyonları](#3-performance-optimizasyonları)
4. [Güvenlik](#4-güvenlik)
5. [Error Handling & Logging](#5-error-handling--logging)
6. [Testing](#6-testing)
7. [Accessibility (A11y)](#7-accessibility-a11y)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [DevOps & CI/CD](#9-devops--cicd)
10. [Monitoring & Analytics](#10-monitoring--analytics)

---

## 1. UI/UX İYİLEŞTİRMELERİ

### ✅ 1.1 Design System Implementasyonu
**Öncelik:** 🔴 YÜKSEK  
**Etki:** Tutarlılık, Maintainability, Developer Experience

**Durum:** ✅ TAMAMLANDI
- `/components/ui/Button.tsx` - Reusable button component
- `/components/ui/Input.tsx` - Form input with validation
- `/components/ui/Card.tsx` - Card components

**Kullanım Örneği:**
```tsx
import { Button, Input, Card } from './components/ui';

// Eski
<button className="w-full bg-indigo-500 hover:bg-indigo-600...">

// Yeni
<Button variant="primary" fullWidth isLoading={loading}>
  Etkinlik Oluştur
</Button>
```

**Faydalar:**
- ✅ Kod tekrarı azalır
- ✅ Tutarlı UI
- ✅ Kolay tema değişikliği
- ✅ Accessibility built-in

---

### 🔶 1.2 Loading States & Skeleton Screens
**Öncelik:** 🟡 ORTA  
**Etki:** User Experience, Perceived Performance

**Problem:** Kullanıcı veri yüklenirken beyaz ekran görüyor

**Çözüm: Skeleton Loader**

```tsx
// components/ui/Skeleton.tsx
export const Skeleton = ({ className = '', variant = 'rectangular' }) => (
  <div
    className={`
      animate-pulse bg-gray-200 rounded
      ${variant === 'circular' ? 'rounded-full' : ''}
      ${variant === 'text' ? 'h-4 rounded' : ''}
      ${className}
    `}
  />
);

export const EventCardSkeleton = () => (
  <Card>
    <CardBody>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="flex gap-2">
        <Skeleton variant="circular" className="w-8 h-8" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
    </CardBody>
  </Card>
);

// App.tsx kullanımı
{isLoading ? (
  <div className="grid grid-cols-3 gap-4">
    {[1, 2, 3].map(i => <EventCardSkeleton key={i} />)}
  </div>
) : (
  events.map(event => <EventCard event={event} />)
)}
```

**Faydalar:**
- ✅ Perceived performance artışı
- ✅ Layout shift önlenir
- ✅ Professional görünüm

---

### 🔶 1.3 Empty States & Error States
**Öncelik:** 🟡 ORTA

```tsx
// components/EmptyState.tsx
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
      <Icon className="text-gray-400" size={32} />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-4 max-w-sm">{description}</p>
    {action}
  </div>
);

// Kullanım
{events.length === 0 && !isLoading && (
  <EmptyState
    icon={CalendarIcon}
    title="Henüz etkinlik yok"
    description="İlk etkinliğinizi oluşturarak başlayın"
    action={<Button onClick={openModal}>Etkinlik Oluştur</Button>}
  />
)}
```

---

### 🔶 1.4 Responsive Design İyileştirmeleri
**Öncelik:** 🔴 YÜKSEK

```tsx
// Mobile-first approach
const App = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="container mx-auto px-4">
      {/* Mobile: Hamburger menu */}
      {isMobile ? <MobileNav /> : <DesktopNav />}
      
      {/* Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(event => <EventCard event={event} />)}
      </div>
    </div>
  );
};
```

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

### 🔶 1.5 Dark Mode Support
**Öncelik:** 🟢 DÜŞÜK  
**Etki:** Modern UX, User Preference

```tsx
// hooks/useDarkMode.ts
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => 
    localStorage.getItem('theme') === 'dark' ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return [isDark, setIsDark] as const;
};

// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark mode colors
      }
    }
  }
};
```

---

## 2. STATE MANAGEMENT

### 🔴 2.1 Context API ile Global State
**Öncelik:** 🔴 YÜKSEK  
**Problem:** Prop drilling, State her yerde dağınık

**Çözüm: Context + Custom Hooks**

```tsx
// contexts/AppContext.tsx
interface AppContextType {
  user: User | null;
  isLoggedIn: boolean;
  departments: DepartmentConfig[];
  resources: ResourceConfig[];
  locations: LocationConfig[];
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const AppContext = createContext<AppContextType>(undefined!);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<DepartmentConfig[]>([]);
  // ... other state

  const login = async (credentials) => {
    const response = await api.login(credentials);
    setUser(response.user);
    localStorage.setItem('token', response.token);
  };

  const value = {
    user,
    isLoggedIn: !!user,
    departments,
    resources,
    locations,
    login,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom Hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// Kullanım
const EventModal = () => {
  const { departments, resources, locations } = useApp();
  // No more prop drilling!
};
```

---

### 🔶 2.2 React Query (TanStack Query) - Server State Management
**Öncelik:** 🔴 YÜKSEK  
**Etki:** Caching, Auto-refetch, Optimistic Updates

**Kurulum:**
```bash
npm install @tanstack/react-query
```

**Implementation:**
```tsx
// hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: api.getEvents,
    staleTime: 5 * 60 * 1000, // 5 dakika
    refetchOnWindowFocus: true,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createEvent,
    onSuccess: () => {
      // Cache'i invalidate et, otomatik refetch
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    // Optimistic update
    onMutate: async (newEvent) => {
      await queryClient.cancelQueries({ queryKey: ['events'] });
      const previousEvents = queryClient.getQueryData(['events']);
      queryClient.setQueryData(['events'], (old: CafeEvent[]) => [...old, newEvent]);
      return { previousEvents };
    },
    onError: (err, newEvent, context) => {
      // Rollback on error
      queryClient.setQueryData(['events'], context?.previousEvents);
    },
  });
};

// Kullanım
const App = () => {
  const { data: events, isLoading, error } = useEvents();
  const createEvent = useCreateEvent();

  const handleSave = async (event: CafeEvent) => {
    await createEvent.mutateAsync(event);
    // Cache otomatik güncellenir!
  };

  if (isLoading) return <EventCardSkeleton />;
  if (error) return <ErrorState error={error} />;

  return <EventList events={events} />;
};
```

**Faydalar:**
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Request deduplication
- ✅ Offline support
- ✅ DevTools

---

## 3. PERFORMANCE OPTIMIZASYONLARI

### 🔴 3.1 React.memo & useMemo & useCallback
**Öncelik:** 🔴 YÜKSEK

```tsx
// components/EventCard.tsx
export const EventCard = React.memo<EventCardProps>(({ event, onClick }) => {
  // Component only re-renders when event or onClick changes
  return (
    <Card onClick={onClick}>
      <CardBody>
        <h3>{event.title}</h3>
        <p>{event.description}</p>
      </CardBody>
    </Card>
  );
});

// App.tsx
const App = () => {
  const [events, setEvents] = useState<CafeEvent[]>([]);
  
  // Memoize expensive calculations
  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      e.status === 'APPROVED' && 
      new Date(e.startDate) > new Date()
    );
  }, [events]); // Only recalculate when events change
  
  // Memoize callbacks to prevent child re-renders
  const handleEventClick = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId);
    setEditingEvent(event);
    setIsModalOpen(true);
  }, [events]);
  
  return (
    <>
      {filteredEvents.map(event => (
        <EventCard 
          key={event.id} 
          event={event} 
          onClick={() => handleEventClick(event.id)}
        />
      ))}
    </>
  );
};
```

---

### 🔴 3.2 Code Splitting & Lazy Loading
**Öncelik:** 🔴 YÜKSEK  
**Etki:** Initial Bundle Size ↓ , FCP ↓

```tsx
// App.tsx - Lazy load admin panel
const AdminPanel = React.lazy(() => import('./components/admin/AdminPanel'));

const App = () => {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      {isAdmin && <AdminPanel />}
    </Suspense>
  );
};

// Route-based code splitting
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const EventDetail = React.lazy(() => import('./pages/EventDetail'));
const AdminPage = React.lazy(() => import('./pages/Admin'));

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
```

**Sonuç:**
- Initial bundle: ~300KB → ~150KB (50% azalma)
- Time to Interactive: ~2s → ~1s

---

### 🟡 3.3 Virtual Scrolling (Large Lists)
**Öncelik:** 🟡 ORTA  
**Ne Zaman:** 100+ event listelerinde

```tsx
import { FixedSizeList } from 'react-window';

const EventListVirtualized = ({ events }: { events: CafeEvent[] }) => (
  <FixedSizeList
    height={600}
    itemCount={events.length}
    itemSize={120}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <EventCard event={events[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

---

### 🟡 3.4 Image Optimization
**Öncelik:** 🟡 ORTA

```tsx
// Lazy load images
<img 
  src={event.imageUrl} 
  loading="lazy" 
  alt={event.title}
  className="w-full h-48 object-cover"
/>

// Next.js Image component alternative (Vite plugin)
import { defineConfig } from 'vite';
import imageOptimizer from 'vite-plugin-image-optimizer';

export default defineConfig({
  plugins: [
    imageOptimizer({
      jpg: { quality: 80 },
      png: { quality: 80 },
      webp: { quality: 80 }
    })
  ]
});
```

---

## 4. GÜVENLİK

### 🔴 4.1 XSS Protection
**Öncelik:** 🔴 YÜKSEK

```tsx
// ❌ YANLIŞ - XSS riski
<div dangerouslySetInnerHTML={{ __html: event.description }} />

// ✅ DOĞRU - Sanitize
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }: { html: string }) => (
  <div dangerouslySetInnerHTML={{ 
    __html: DOMPurify.sanitize(html) 
  }} />
);
```

---

### 🔴 4.2 CSRF Protection
**Öncelik:** 🔴 YÜKSEK

```typescript
// backend/src/middleware/csrf.ts
import csrf from 'csurf';

const csrfProtection = csrf({ 
  cookie: { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  } 
});

// Apply to state-changing routes
router.post('/events', csrfProtection, authenticate, createEvent);
```

---

### 🔴 4.3 Rate Limiting
**Öncelik:** 🔴 YÜKSEK

```typescript
// backend/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 min
  skipSuccessfulRequests: true,
});

// server.ts
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
```

---

### 🟡 4.4 Input Validation (Zod)
**Öncelik:** 🟡 ORTA

```typescript
import { z } from 'zod';

// Shared validation schema
const EventSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  departmentId: z.string().uuid(),
  locationId: z.string().uuid(),
  resourceIds: z.array(z.string().uuid()),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  attendees: z.number().int().positive().max(500),
});

// Frontend validation
const EventForm = () => {
  const handleSubmit = (data: unknown) => {
    try {
      const validData = EventSchema.parse(data);
      api.createEvent(validData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Show validation errors
        setErrors(error.flatten());
      }
    }
  };
};

// Backend validation
router.post('/events', authenticate, (req, res) => {
  try {
    const validData = EventSchema.parse(req.body);
    // Process valid data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.flatten() 
      });
    }
  }
});
```

---

## 5. ERROR HANDLING & LOGGING

### 🔴 5.1 Error Boundary
**Öncelik:** 🔴 YÜKSEK

```tsx
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service (Sentry, etc.)
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to backend logging
    api.logError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Bir Hata Oluştu
            </h2>
            <p className="text-gray-600 mb-4">
              Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.
            </p>
            <Button onClick={() => window.location.reload()}>
              Sayfayı Yenile
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// App.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

### 🔴 5.2 Structured Logging (Backend)
**Öncelik:** 🔴 YÜKSEK

```typescript
// backend/src/lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;

// Usage
import logger from './lib/logger';

router.post('/events', authenticate, async (req, res) => {
  try {
    logger.info('Creating event', { 
      userId: req.user.userId, 
      eventTitle: req.body.title 
    });
    
    const event = await createEvent(req.body);
    
    logger.info('Event created successfully', { eventId: event.id });
    res.json(event);
  } catch (error) {
    logger.error('Event creation failed', { 
      error: error.message, 
      userId: req.user.userId,
      stack: error.stack 
    });
    res.status(500).json({ error: 'Event creation failed' });
  }
});
```

---

### 🟡 5.3 Sentry Integration (Error Tracking)
**Öncelik:** 🟡 ORTA

```bash
npm install @sentry/react @sentry/tracing
```

```tsx
// index.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Wrap app
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</Sentry.ErrorBoundary>
```

---

## 6. TESTING

### 🔴 6.1 Frontend Unit Tests (Vitest + React Testing Library)
**Öncelik:** 🔴 YÜKSEK  
**Hedef Coverage:** %80+

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

```typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../ui/Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when isLoading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when isLoading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toContainHTML('animate-spin');
  });
});
```

```typescript
// hooks/__tests__/useEvents.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEvents } from '../useEvents';
import { describe, it, expect, vi } from 'vitest';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useEvents', () => {
  it('fetches events successfully', async () => {
    const { result } = renderHook(() => useEvents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

---

### 🟡 6.2 E2E Tests (Playwright)
**Öncelik:** 🟡 ORTA

```bash
npm install -D @playwright/test
```

```typescript
// e2e/event-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Event Creation Flow', () => {
  test('should create a new event', async ({ page }) => {
    // Login
    await page.goto('http://localhost:9980');
    await page.click('text=Giriş Yap');
    await page.fill('[name="username"]', 'admin');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button:has-text("Giriş")');

    // Create event
    await page.click('text=Etkinlik Oluştur');
    await page.fill('[name="title"]', 'Test Event');
    await page.selectOption('[name="departmentId"]', { index: 1 });
    await page.fill('[name="description"]', 'Test description');
    await page.click('button:has-text("Kaydet")');

    // Verify success
    await expect(page.locator('text=Test Event')).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    await page.goto('http://localhost:9980');
    await page.click('text=Etkinlik Oluştur');
    await page.click('button:has-text("Kaydet")');
    
    await expect(page.locator('text=Etkinlik adı gereklidir')).toBeVisible();
  });
});
```

---

## 7. ACCESSIBILITY (A11Y)

### 🔴 7.1 Semantic HTML
**Öncelik:** 🔴 YÜKSEK  
**WCAG 2.1 AA Standard**

```tsx
// ❌ YANLIŞ
<div onClick={handleClick}>Click me</div>

// ✅ DOĞRU
<button onClick={handleClick} aria-label="Etkinlik oluştur">
  <Plus /> Etkinlik Oluştur
</button>

// ❌ YANLIŞ
<div className="modal">...</div>

// ✅ DOĞRU
<dialog 
  open={isOpen} 
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Etkinlik Oluştur</h2>
  <p id="modal-description">Yeni bir etkinlik oluşturun</p>
</dialog>
```

---

### 🔴 7.2 Keyboard Navigation
**Öncelik:** 🔴 YÜKSEK

```tsx
const EventModal = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus first input
      const firstInput = modalRef.current?.querySelector('input');
      firstInput?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    
    // Trap focus inside modal
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements) return;
      
      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div 
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
    >
      {/* Modal content */}
    </div>
  );
};
```

---

### 🟡 7.3 Screen Reader Support
**Öncelik:** 🟡 ORTA

```tsx
// ARIA live regions for dynamic content
const Toast = ({ message, type }: ToastProps) => (
  <div 
    role="alert"
    aria-live="polite"
    aria-atomic="true"
    className={toastStyles[type]}
  >
    {message}
  </div>
);

// ARIA labels for icon-only buttons
<button aria-label="Etkinliği sil" onClick={handleDelete}>
  <TrashIcon />
</button>

// ARIA descriptions
<input
  type="password"
  aria-describedby="password-requirements"
/>
<div id="password-requirements" className="text-sm text-gray-600">
  En az 8 karakter, bir büyük harf ve bir rakam içermelidir
</div>
```

---

## 8. INTERNATIONALIZATION (i18n)

### 🟢 8.1 Multi-language Support
**Öncelik:** 🟢 DÜŞÜK (İleride gerekli olabilir)

```bash
npm install react-i18next i18next
```

```tsx
// i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    tr: {
      translation: {
        'event.create': 'Etkinlik Oluştur',
        'event.edit': 'Etkinliği Düzenle',
        'event.delete': 'Etkinliği Sil',
        'event.title': 'Etkinlik Adı',
      },
    },
    en: {
      translation: {
        'event.create': 'Create Event',
        'event.edit': 'Edit Event',
        'event.delete': 'Delete Event',
        'event.title': 'Event Title',
      },
    },
  },
  lng: 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
});

// Usage
import { useTranslation } from 'react-i18next';

const EventForm = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('event.create')}</h2>
      <input placeholder={t('event.title')} />
    </div>
  );
};
```

---

## 9. DEVOPS & CI/CD

### 🔴 9.1 GitHub Actions CI/CD
**Öncelik:** 🔴 YÜKSEK

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: docker-compose build
      
      - name: Run E2E tests
        run: npm run test:e2e

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          ssh user@server "cd /opt/LSV_Cafe && git pull && docker-compose up -d"
```

---

### 🟡 9.2 Environment Management
**Öncelik:** 🟡 ORTA

```bash
# .env.development
VITE_API_URL=http://localhost:3000
VITE_SENTRY_DSN=
VITE_ANALYTICS_ID=

# .env.production
VITE_API_URL=https://api.lsvcafe.com
VITE_SENTRY_DSN=https://...
VITE_ANALYTICS_ID=UA-XXXXX

# .env.test
VITE_API_URL=http://localhost:3001
```

```typescript
// config/env.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;
```

---

## 10. MONITORING & ANALYTICS

### 🔴 10.1 Health Checks & Uptime Monitoring
**Öncelik:** 🔴 YÜKSEK

```typescript
// backend/src/routes/health.ts
router.get('/health', async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    checks: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.checks.database = 'healthy';
  } catch (error) {
    healthCheck.checks.database = 'unhealthy';
    healthCheck.status = 'DEGRADED';
  }

  const statusCode = healthCheck.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Use external monitoring: UptimeRobot, Pingdom, etc.
// https://uptimerobot.com - Check every 5 minutes
```

---

### 🟡 10.2 Application Performance Monitoring (APM)
**Öncelik:** 🟡 ORTA

```typescript
// Google Analytics 4
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');

// Track page views
const usePageTracking = () => {
  const location = useLocation();
  
  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname });
  }, [location]);
};

// Track events
const handleEventCreate = (event: CafeEvent) => {
  ReactGA.event({
    category: 'Event',
    action: 'Create',
    label: event.departmentId,
  });
  
  await api.createEvent(event);
};

// Custom metrics
ReactGA.event({
  category: 'Performance',
  action: 'Time to Interactive',
  value: Math.round(performance.now()),
  label: 'Initial Load',
});
```

---

### 🟡 10.3 User Behavior Analytics
**Öncelik:** 🟢 DÜŞÜK

```typescript
// Hotjar, FullStory, or similar
// Track user journeys, heatmaps, session recordings

// Example: Track funnel
const EventCreationFunnel = () => {
  useEffect(() => {
    analytics.track('Funnel Step: Open Modal');
  }, []);

  const handleNextStep = () => {
    analytics.track('Funnel Step: Fill Form');
  };

  const handleSubmit = () => {
    analytics.track('Funnel Step: Submit Event');
  };
};
```

---

## 📊 ÖNCELİK MATRISI

| Kategori | Öneri | Öncelik | Etki | Efor | ROI |
|----------|-------|---------|------|------|-----|
| **UI/UX** | Design System | 🔴 Yüksek | Yüksek | Orta | ⭐⭐⭐⭐⭐ |
| **UI/UX** | Loading States | 🟡 Orta | Yüksek | Düşük | ⭐⭐⭐⭐⭐ |
| **UI/UX** | Dark Mode | 🟢 Düşük | Orta | Orta | ⭐⭐⭐ |
| **State** | Context API | 🔴 Yüksek | Yüksek | Orta | ⭐⭐⭐⭐⭐ |
| **State** | React Query | 🔴 Yüksek | Yüksek | Orta | ⭐⭐⭐⭐⭐ |
| **Perf** | React.memo | 🔴 Yüksek | Orta | Düşük | ⭐⭐⭐⭐ |
| **Perf** | Code Splitting | 🔴 Yüksek | Yüksek | Orta | ⭐⭐⭐⭐⭐ |
| **Perf** | Virtual Scroll | 🟡 Orta | Orta | Yüksek | ⭐⭐⭐ |
| **Güvenlik** | XSS Protection | 🔴 Yüksek | Kritik | Düşük | ⭐⭐⭐⭐⭐ |
| **Güvenlik** | Rate Limiting | 🔴 Yüksek | Yüksek | Düşük | ⭐⭐⭐⭐⭐ |
| **Güvenlik** | Input Validation | 🟡 Orta | Yüksek | Orta | ⭐⭐⭐⭐ |
| **Error** | Error Boundary | 🔴 Yüksek | Kritik | Düşük | ⭐⭐⭐⭐⭐ |
| **Error** | Logging | 🔴 Yüksek | Yüksek | Düşük | ⭐⭐⭐⭐⭐ |
| **Error** | Sentry | 🟡 Orta | Yüksek | Düşük | ⭐⭐⭐⭐ |
| **Test** | Unit Tests | 🔴 Yüksek | Yüksek | Yüksek | ⭐⭐⭐⭐ |
| **Test** | E2E Tests | 🟡 Orta | Orta | Yüksek | ⭐⭐⭐ |
| **A11y** | Semantic HTML | 🔴 Yüksek | Yüksek | Düşük | ⭐⭐⭐⭐⭐ |
| **A11y** | Keyboard Nav | 🔴 Yüksek | Yüksek | Orta | ⭐⭐⭐⭐ |
| **i18n** | Multi-language | 🟢 Düşük | Düşük | Yüksek | ⭐⭐ |
| **DevOps** | CI/CD | 🔴 Yüksek | Yüksek | Orta | ⭐⭐⭐⭐⭐ |
| **Monitor** | Health Checks | 🔴 Yüksek | Kritik | Düşük | ⭐⭐⭐⭐⭐ |
| **Monitor** | APM | 🟡 Orta | Orta | Orta | ⭐⭐⭐ |

---

## 🗓️ IMPLEMENTATION ROADMAP

### Sprint 1 (2 hafta) - Critical Foundation
- ✅ Design System (Button, Input, Card)
- ✅ Error Boundary
- ✅ Context API
- ✅ Rate Limiting
- ✅ Health Checks

### Sprint 2 (2 hafta) - State & Performance
- React Query integration
- React.memo optimization
- Code splitting
- Loading states

### Sprint 3 (2 hafta) - Testing & Security
- Unit test setup
- XSS protection
- Input validation (Zod)
- Structured logging

### Sprint 4 (2 hafta) - DevOps & Monitoring
- CI/CD pipeline
- Sentry integration
- Analytics setup
- E2E tests

### Sprint 5+ (Ongoing) - Polish
- Accessibility improvements
- Dark mode
- Virtual scrolling
- i18n (if needed)

---

## 📚 KAR NOMLAR & REF

ANSLAR

### React Best Practices
- [React Official Docs](https://react.dev/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TanStack Query Docs](https://tanstack.com/query/latest)

### Performance
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### Accessibility
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project](https://www.a11yproject.com/)

### Testing
- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)

---

**Son Güncelleme:** 16 Aralık 2025  
**Versiyon:** 1.0  
**Durum:** Implementation başladı (Design System ✅)
