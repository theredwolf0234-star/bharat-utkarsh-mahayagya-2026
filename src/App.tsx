import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import {
  TOTAL_KUNDS,
  RESERVED_KUNDS_COUNT,
  YAGYA_DATES,
  INITIAL_REGISTRATIONS,
  INITIAL_DEVOTEES,
} from './constants/yagya';
import {
  Registration,
  DevoteeUser,
  AuditLog,
  SystemSettings,
  KundItem,
  KundSummary,
  RegistrationDraft,
} from './types/yagya';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { RegistrationStepView } from './components/RegistrationStepView';
import { PaymentStepView } from './components/PaymentStepView';
import { DevoteeTicketsPortal } from './components/DevoteeTicketsPortal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { PrintableSlipModal } from './components/PrintableSlipModal';
import { StatusLookupModal } from './components/StatusLookupModal';
import { OpeningSlideshow } from './components/OpeningSlideshow';

export interface AppNavState {
  view: 'home' | 'register' | 'tickets';
  step: number;
  modal?: 'admin' | 'status' | 'slip' | null;
}

export default function App() {
  const [showOpeningSlideshow, setShowOpeningSlideshow] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'home' | 'register' | 'tickets'>('home');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(YAGYA_DATES[0].date);
  const [preselectedKund, setPreselectedKund] = useState<number | null>(null);

  // Modals & Navigation state
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [printSlipReg, setPrintSlipReg] = useState<Registration | null>(null);
  const [exitToast, setExitToast] = useState<boolean>(false);

  // Devotee Authentication State
  const [currentUser, setCurrentUser] = useState<DevoteeUser | null>(() => {
    try {
      const saved = localStorage.getItem('yagya_devotee_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Persistent Form Draft State (Preserves all devotee inputs when moving backward/forward)
  const [formDraft, setFormDraft] = useState<Partial<RegistrationDraft>>(() => {
    try {
      const saved = sessionStorage.getItem('yagya_booking_draft_v1');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const handleDraftChange = useCallback((updates: Partial<RegistrationDraft>) => {
    setFormDraft((prev) => {
      const next = { ...prev, ...updates };
      try {
        sessionStorage.setItem('yagya_booking_draft_v1', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  // Persistent Database State
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    try {
      localStorage.removeItem('yagya_registrations');
      localStorage.removeItem('maharishi_yagya_registrations_2026_v1');
      const saved = localStorage.getItem('yagya_registrations_v2');
      return saved ? JSON.parse(saved) : INITIAL_REGISTRATIONS;
    } catch (e) {
      return INITIAL_REGISTRATIONS;
    }
  });

  const [devotees, setDevotees] = useState<DevoteeUser[]>(() => {
    try {
      const saved = localStorage.getItem('yagya_devotees');
      return saved ? JSON.parse(saved) : INITIAL_DEVOTEES;
    } catch (e) {
      return INITIAL_DEVOTEES;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('yagya_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yagya_registrations_v2', JSON.stringify(registrations));
    } catch (e) {}
  }, [registrations]);

  useEffect(() => {
    try {
      localStorage.setItem('yagya_devotees', JSON.stringify(devotees));
    } catch (e) {}
  }, [devotees]);

  useEffect(() => {
    try {
      localStorage.setItem('yagya_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {}
  }, [auditLogs]);

  // Synchronize live bookings with backend server
  useEffect(() => {
    const syncServerBookings = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await fetch('/api/registrations');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.registrations)) {
            setRegistrations(data.registrations);
          }
        }
      } catch (e) {
        // Silently ignore offline network disconnects
      }
    };

    syncServerBookings();
    const interval = setInterval(syncServerBookings, 8000);
    return () => clearInterval(interval);
  }, []);

  const [pendingPaymentData, setPendingPaymentData] = useState<Registration | null>(null);
  const [currentPaymentReg, setCurrentPaymentReg] = useState<Registration | null>(null);

  // System settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    expiryMinutes: 5,
    upiId: 'yespay.bizsbiz296352@yesbankltd',
    pricePerPerson: 2100,
    testModeEnabled: false,
  });

  // Refs for tracking active state in popstate & hardware back listeners without stale closures
  const viewRef = useRef(currentView);
  viewRef.current = currentView;
  const stepRef = useRef(currentStep);
  stepRef.current = currentStep;
  const showAdminRef = useRef(showAdminModal);
  showAdminRef.current = showAdminModal;
  const showStatusRef = useRef(showStatusModal);
  showStatusRef.current = showStatusModal;
  const printSlipRef = useRef(printSlipReg);
  printSlipRef.current = printSlipReg;
  const exitTimeoutRef = useRef<any>(null);
  const lastBackPressRef = useRef<number>(0);

  // Central Navigation Dispatcher: Maintains correct browser history & eliminates infinite loops
  const navigateTo = useCallback(
    (
      view: 'home' | 'register' | 'tickets',
      step: number = 1,
      modal: 'admin' | 'status' | 'slip' | null = null,
      replace: boolean = false
    ) => {
      let hash = '#home';
      if (modal === 'admin') hash = '#admin';
      else if (modal === 'status') hash = '#lookup';
      else if (modal === 'slip') hash = '#slip';
      else if (view === 'tickets') hash = '#tickets';
      else if (view === 'register') {
        hash = step >= 3 ? '#payment' : '#register';
      }

      const state: AppNavState = { view, step, modal };
      try {
        if (replace) {
          window.history.replaceState(state, '', hash);
        } else {
          // Avoid duplicate history entries for the exact same page state
          const currentHash = window.location.hash || '#home';
          if (currentHash !== hash) {
            window.history.pushState(state, '', hash);
          }
        }
      } catch (e) {}

      setCurrentView(view);
      setCurrentStep(step);
      setShowAdminModal(modal === 'admin');
      setShowStatusModal(modal === 'status');
      if (modal !== 'slip') setPrintSlipReg(null);
    },
    []
  );

  // Validate and restore persistent devotee session on startup
  useEffect(() => {
    const token = localStorage.getItem('yagya_devotee_token');
    if (!token) return;

    fetch('/api/user/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Invalid session');
      })
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('yagya_devotee_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {
        localStorage.removeItem('yagya_devotee_token');
        localStorage.removeItem('yagya_devotee_user');
        sessionStorage.removeItem('yagya_devotee_token');
        setCurrentUser(null);
      });
  }, []);

  const handleUserLogout = useCallback(async () => {
    const token = localStorage.getItem('yagya_devotee_token');
    if (token) {
      try {
        await fetch('/api/user/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {}
    }
    localStorage.removeItem('yagya_devotee_token');
    localStorage.removeItem('yagya_devotee_user');
    sessionStorage.removeItem('yagya_devotee_token');
    setCurrentUser(null);
    navigateTo('home', 1, null);
  }, [navigateTo]);

  // Popstate Listener: Native Mobile Back Gesture & Browser Back/Forward Handling
  useEffect(() => {
    // 1. Establish base state on page entry
    const initialHash = window.location.hash;
    let initialView: 'home' | 'register' | 'tickets' = 'home';
    let initialStep = 1;
    let initialModal: 'admin' | 'status' | 'slip' | null = null;

    if (initialHash === '#tickets') initialView = 'tickets';
    else if (initialHash === '#register') initialView = 'register';
    else if (initialHash === '#payment') {
      initialView = 'register';
      initialStep = 3;
    } else if (initialHash === '#admin') initialModal = 'admin';
    else if (initialHash === '#lookup') initialModal = 'status';

    try {
      window.history.replaceState(
        { view: initialView, step: initialStep, modal: initialModal },
        '',
        initialHash || '#home'
      );
    } catch (e) {}

    // 2. Handle user pressing Android Back, edge swipe on iOS Safari, or browser Back/Forward
    const handlePopState = (e: PopStateEvent) => {
      // Priority A: Close any active modal dialog first
      if (showAdminRef.current || showStatusRef.current || printSlipRef.current) {
        setShowAdminModal(false);
        setShowStatusModal(false);
        setPrintSlipReg(null);
        return;
      }

      // Priority B: If inside payment instructions (Step 3 or 4), Back returns to Registration Form (Step 1)
      if (viewRef.current === 'register' && stepRef.current > 1) {
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Priority C: If on Registration Form (Step 1) or My Tickets, Back returns to Home
      if (viewRef.current !== 'home') {
        setCurrentView('home');
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Priority D: If already on Homepage, handle double-back exit confirmation without crashing
      const now = Date.now();
      if (now - lastBackPressRef.current < 2500) {
        // Devotee confirmed exit: Allow browser natural exit
        setExitToast(false);
        window.history.back();
      } else {
        lastBackPressRef.current = now;
        // Keep user on home and show non-intrusive Android toast
        try {
          window.history.pushState({ view: 'home', step: 1, modal: null }, '', '#home');
        } catch (err) {}
        setExitToast(true);
        if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = setTimeout(() => {
          setExitToast(false);
        }, 2500);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  // Native Android Capacitor Hardware Back Button Support
  useEffect(() => {
    let removeCapListener: (() => void) | undefined;
    try {
      CapApp.addListener('backButton', () => {
        if (showAdminRef.current || showStatusRef.current || printSlipRef.current) {
          setShowAdminModal(false);
          setShowStatusModal(false);
          setPrintSlipReg(null);
          return;
        }

        if (viewRef.current === 'register' && stepRef.current > 1) {
          setCurrentStep(1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        if (viewRef.current !== 'home') {
          setCurrentView('home');
          setCurrentStep(1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        const now = Date.now();
        if (now - lastBackPressRef.current < 2500) {
          CapApp.exitApp();
        } else {
          lastBackPressRef.current = now;
          setExitToast(true);
          if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
          exitTimeoutRef.current = setTimeout(() => setExitToast(false), 2500);
        }
      }).then((handle) => {
        removeCapListener = () => handle.remove();
      }).catch(() => {});
    } catch (e) {
      // In web browser mode, Capacitor listener fails silently
    }

    return () => {
      if (removeCapListener) removeCapListener();
    };
  }, []);

  // Prevent accidental loss of unsaved form changes & active temporary holds
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasActiveHold = pendingPaymentData?.paymentStatus === 'temp_hold';
      const hasFormDraft = Boolean(formDraft.fullName || formDraft.mobile);
      if (hasActiveHold || (viewRef.current === 'register' && hasFormDraft)) {
        e.preventDefault();
        e.returnValue = 'आपके द्वारा भरा गया विवरण या लॉक किया गया हवन कुंड निरस्त हो सकता है। क्या आप सचमुच बाहर जाना चाहते हैं?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingPaymentData, formDraft]);

  const kundSummary = useMemo<KundSummary>(() => {
    const dateRegs = registrations.filter(
      (r) => r.date === selectedDate && r.paymentStatus !== 'rejected' && r.paymentStatus !== 'expired'
    );
    const map = new Map<number, KundItem>();
    for (let i = 1; i <= TOTAL_KUNDS; i++) {
      map.set(i, {
        kundNumber: i,
        formattedNumber: String(i).padStart(3, '0'),
        isReserved: i <= RESERVED_KUNDS_COUNT,
        bookedCount: 0,
        occupants: [],
      });
    }
    dateRegs.forEach((r) => {
      const k = map.get(r.kundNumber);
      if (k) {
        k.bookedCount += 1;
        k.occupants.push(r);
      }
    });

    const list = Array.from(map.values());
    const bookable = list.filter((k) => !k.isReserved);
    const totalAvailable = bookable.filter((k) => k.bookedCount === 0).length;
    const totalPartial = bookable.filter((k) => k.bookedCount === 1).length;
    const totalFull = bookable.filter((k) => k.bookedCount >= 2).length;

    return { list, totalAvailable, totalPartial, totalFull, totalReserved: RESERVED_KUNDS_COUNT };
  }, [registrations, selectedDate]);

  const handleStartBooking = (kundNum: number | null = null) => {
    setPreselectedKund(kundNum);
    if (kundNum) {
      handleDraftChange({ selectedKunds: [kundNum] });
    }
    navigateTo('register', 1, null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToPayment = (tempReg: Registration) => {
    setPendingPaymentData(tempReg);
    setCurrentPaymentReg(tempReg);
    navigateTo('register', 3, null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Full-screen opening flyer slideshow on website entry (2-3s each)
  if (showOpeningSlideshow) {
    return (
      <OpeningSlideshow
        slideDurationMs={2500}
        onComplete={() => setShowOpeningSlideshow(false)}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#faf5eb] flex flex-col justify-between text-stone-900 font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Pure Vedic Header with Navigation, Booking CTA, and Profile Menu Bar */}
      <Header
        currentView={currentView}
        setCurrentView={(view) => navigateTo(view as 'home' | 'register' | 'tickets', 1, null)}
        currentStep={currentStep}
        setCurrentStep={(step) => navigateTo('register', step, null)}
        currentUser={currentUser}
        onStartBooking={handleStartBooking}
        onOpenStatusLookup={() => navigateTo(currentView, currentStep, 'status')}
        onOpenAdmin={() => navigateTo(currentView, currentStep, 'admin')}
        onLogout={handleUserLogout}
      />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {currentView === 'home' && (
          <HomeView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            kundSummary={kundSummary}
            onStartBooking={handleStartBooking}
            onOpenTickets={() => navigateTo('tickets', 1, null)}
            onOpenStatusLookup={() => navigateTo('home', 1, 'status')}
          />
        )}

        {currentView === 'register' && (
          <div className="w-full max-w-full pb-14 bg-[#faf5eb] min-h-[80vh]">
            {currentStep <= 2 && (
              <RegistrationStepView
                initialKund={preselectedKund}
                selectedDate={selectedDate}
                currentUser={currentUser}
                devotees={devotees}
                setDevotees={setDevotees}
                setCurrentUser={setCurrentUser}
                onProceedToPayment={handleProceedToPayment}
                kundSummary={kundSummary}
                registrations={registrations}
                onBack={() => navigateTo('home', 1, null)}
                draftData={formDraft}
                onDraftChange={handleDraftChange}
              />
            )}
            {currentStep >= 3 && (
              <PaymentStepView
                pendingReg={currentPaymentReg || pendingPaymentData}
                systemSettings={systemSettings}
                allRegistrations={registrations}
                setRegistrations={setRegistrations}
                setAuditLogs={setAuditLogs}
                onOpenSlip={(reg) => {
                  setPrintSlipReg(reg);
                  navigateTo('register', currentStep, 'slip');
                }}
                onGoHome={() => navigateTo('home', 1, null)}
                onGoBooking={() => navigateTo('register', 1, null)}
              />
            )}
          </div>
        )}

        {currentView === 'tickets' && (
          <DevoteeTicketsPortal
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            devotees={devotees}
            setDevotees={setDevotees}
            registrations={registrations}
            onOpenSlip={(reg) => {
              setPrintSlipReg(reg);
              navigateTo('tickets', 1, 'slip');
            }}
            onBookNew={() => handleStartBooking(null)}
            onLogout={handleUserLogout}
            onGoHome={() => navigateTo('home', 1, null)}
          />
        )}
      </main>

      {/* PRINTABLE SLIP MODAL */}
      {printSlipReg && (
        <PrintableSlipModal
          registration={printSlipReg}
          onClose={() => {
            setPrintSlipReg(null);
            navigateTo(currentView, currentStep, null, true);
          }}
        />
      )}

      {/* STATUS LOOKUP MODAL */}
      {showStatusModal && (
        <StatusLookupModal
          onClose={() => {
            setShowStatusModal(false);
            navigateTo(currentView, currentStep, null, true);
          }}
          registrations={registrations}
          onOpenSlip={(reg) => {
            setShowStatusModal(false);
            setPrintSlipReg(reg);
            navigateTo(currentView, currentStep, 'slip');
          }}
        />
      )}

      {/* ADMIN & DATABASE MANAGEMENT MODAL */}
      {showAdminModal && (
        <AdminPortalModal
          onClose={() => {
            setShowAdminModal(false);
            navigateTo(currentView, currentStep, null, true);
          }}
          registrations={registrations}
          setRegistrations={setRegistrations}
          devotees={devotees}
          auditLogs={auditLogs}
          setAuditLogs={setAuditLogs}
          systemSettings={systemSettings}
          setSystemSettings={setSystemSettings}
          onOpenSlip={(reg) => {
            setPrintSlipReg(reg);
            navigateTo(currentView, currentStep, 'slip');
          }}
        />
      )}

      {/* Exit Confirmation Toast (Android Style Double-Back Exit) */}
      {exitToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-amber-200 border border-amber-500/50 px-4 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <span className="text-base">🚪</span>
          <span>वेबसाइट से बाहर जाने के लिए एक बार और बैक दबाएं</span>
        </div>
      )}

      {/* FOOTER */}
      <Footer
        onGoHome={() => navigateTo('home', 1, null)}
        onStartBooking={() => handleStartBooking(null)}
        onOpenTickets={() => navigateTo('tickets', 1, null)}
        onOpenAdmin={() => navigateTo(currentView, currentStep, 'admin')}
      />
    </div>
  );
}
