import React, { useState, useEffect, useMemo } from 'react';
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

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'register' | 'tickets'>('home');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(YAGYA_DATES[0].date);
  const [preselectedKund, setPreselectedKund] = useState<number | null>(null);

  // Devotee Authentication State
  const [currentUser, setCurrentUser] = useState<DevoteeUser | null>(() => {
    try {
      const saved = localStorage.getItem('yagya_devotee_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Persistent / In-memory Database State (Fresh Start for Kunds 10-108)
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    try {
      const saved = localStorage.getItem('yagya_registrations');
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
      localStorage.setItem('yagya_registrations', JSON.stringify(registrations));
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

  // Synchronize live bookings with backend server every 4 seconds
  useEffect(() => {
    const syncServerBookings = async () => {
      try {
        const res = await fetch('/api/admin/bookings', {
          headers: { Authorization: 'Bearer maharishi_master_session_token' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.bookings)) {
            setRegistrations((prev) => {
              // Merge server bookings with local bookings
              const serverMap = new Map<string, Registration>();
              data.bookings.forEach((b: Registration) => serverMap.set(b.id, b));
              // Also keep any local un-synced bookings
              prev.forEach((p) => {
                if (!serverMap.has(p.id)) {
                  serverMap.set(p.id, p);
                }
              });
              return Array.from(serverMap.values());
            });
          }
        }
      } catch (e) {
        // Ignore offline
      }
    };

    syncServerBookings();
    const interval = setInterval(syncServerBookings, 4000);
    return () => clearInterval(interval);
  }, []);

  // Admin and Modals State
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [printSlipReg, setPrintSlipReg] = useState<Registration | null>(null);
  const [pendingPaymentData, setPendingPaymentData] = useState<Registration | null>(null);
  const [currentPaymentReg, setCurrentPaymentReg] = useState<Registration | null>(null);

  // System settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    expiryMinutes: 15,
    upiId: 'maharishivedvigyan@sbi',
    pricePerPerson: 1100,
    testModeEnabled: false,
  });

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
    setCurrentStep(1);
    setCurrentView('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToPayment = (tempReg: Registration) => {
    setPendingPaymentData(tempReg);
    setCurrentPaymentReg(tempReg);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#faf5eb] flex flex-col justify-between text-stone-900 font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Pure Vedic Header with Navigation and Stepper */}
      <Header
        currentView={currentView}
        setCurrentView={(view) => setCurrentView(view as 'home' | 'register' | 'tickets')}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        currentUser={currentUser}
        onStartBooking={handleStartBooking}
        onOpenStatusLookup={() => setShowStatusModal(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {currentView === 'home' && (
          <HomeView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            kundSummary={kundSummary}
            onStartBooking={handleStartBooking}
            onOpenTickets={() => setCurrentView('tickets')}
            onOpenStatusLookup={() => setShowStatusModal(true)}
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
              />
            )}
            {currentStep >= 3 && (
              <PaymentStepView
                pendingReg={currentPaymentReg || pendingPaymentData}
                systemSettings={systemSettings}
                allRegistrations={registrations}
                setRegistrations={setRegistrations}
                setAuditLogs={setAuditLogs}
                onOpenSlip={(reg) => setPrintSlipReg(reg)}
                onGoHome={() => setCurrentView('home')}
                onGoBooking={() => {
                  setCurrentStep(1);
                  setCurrentView('register');
                }}
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
            onOpenSlip={(reg) => setPrintSlipReg(reg)}
            onBookNew={() => handleStartBooking(null)}
          />
        )}
      </main>

      {/* PRINTABLE SLIP MODAL (Without QR code, with direct print preview & PDF save) */}
      {printSlipReg && (
        <PrintableSlipModal
          registration={printSlipReg}
          onClose={() => setPrintSlipReg(null)}
        />
      )}

      {/* STATUS LOOKUP MODAL (Quick check payment / token status) */}
      {showStatusModal && (
        <StatusLookupModal
          onClose={() => setShowStatusModal(false)}
          registrations={registrations}
          onOpenSlip={(reg) => {
            setShowStatusModal(false);
            setPrintSlipReg(reg);
          }}
        />
      )}

      {/* ADMIN & DATABASE MANAGEMENT MODAL */}
      {showAdminModal && (
        <AdminPortalModal
          onClose={() => setShowAdminModal(false)}
          registrations={registrations}
          setRegistrations={setRegistrations}
          devotees={devotees}
          auditLogs={auditLogs}
          setAuditLogs={setAuditLogs}
          systemSettings={systemSettings}
          setSystemSettings={setSystemSettings}
          onOpenSlip={(reg) => setPrintSlipReg(reg)}
        />
      )}

      {/* HIGHLIGHTED FOOTER WITH DEDICATED ADMIN & DATABASE PORTAL BUTTON */}
      <Footer
        onGoHome={() => setCurrentView('home')}
        onStartBooking={() => handleStartBooking(null)}
        onOpenTickets={() => setCurrentView('tickets')}
        onOpenAdmin={() => setShowAdminModal(true)}
      />
    </div>
  );
}
