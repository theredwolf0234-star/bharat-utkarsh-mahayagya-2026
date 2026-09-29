/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Registration, YAGYA_DATES, DevoteeUser } from './types/yagya';
import { 
  getSavedRegistrations, 
  saveRegistrations, 
  addRegistration, 
  getLatestUserBooking,
  saveLatestUserBooking,
} from './utils/storage';
import { Language, translations } from './utils/i18n';
import { VedicHeader } from './components/VedicHeader';
import { HomeTab } from './components/HomeTab';
import { RegistrationTab } from './components/RegistrationTab';
import { PaymentTab } from './components/PaymentTab';
import { PrintableSlip } from './components/PrintableSlip';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SupabaseSqlEditor } from './components/SupabaseSqlEditor';
import { DatabaseDashboard } from './components/DatabaseDashboard';
import { DevoteePortal } from './components/DevoteePortal';
import { Search, Printer, Database, Lock, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'register' | 'lookup' | 'admin' | 'database' | 'map' | 'tickets'>('home');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Persistent Language selection
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('yagya_lang');
    return (saved as Language) || 'hi';
  });

  // Devotee User Account State
  const [currentUser, setCurrentUser] = useState<DevoteeUser | null>(() => {
    try {
      const saved = localStorage.getItem('yagya_devotee_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(YAGYA_DATES[0].date);
  const [preselectedKund, setPreselectedKund] = useState<number | null>(null);

  // Registration & Payment state
  const [pendingPaymentData, setPendingPaymentData] = useState<any | null>(null);
  const [currentPaymentReg, setCurrentPaymentReg] = useState<Registration | null>(null);
  const [printSlipReg, setPrintSlipReg] = useState<Registration | null>(null);

  // Modals
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSqlEditorModal, setShowSqlEditorModal] = useState(false);

  const t = translations[lang] || translations.hi;

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('yagya_lang', newLang);
  };

  const handleUserLogin = (user: DevoteeUser, token: string) => {
    setCurrentUser(user);
    setCurrentView('tickets');
    loadData();
  };

  const handleUserLogout = () => {
    const token = localStorage.getItem('yagya_devotee_token');
    if (token) {
      fetch('/api/user/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('yagya_devotee_token');
    localStorage.removeItem('yagya_devotee_user');
    setCurrentUser(null);
    setCurrentView('home');
    loadData();
  };

  // Load system settings (test mode, expiry)
  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setIsTestMode(Boolean(data.settings.testModeEnabled));
        }
      }
    } catch (e) {}
  };

  // Load occupancy data for tracker and devotee tickets
  const loadData = async () => {
    // 1. Latest user booking for immediate state
    const latestUserBooking = getLatestUserBooking();
    if (latestUserBooking) {
      setCurrentPaymentReg(latestUserBooking);
    }

    try {
      // 2. Fetch occupancy / personal tickets from backend
      const userToken = localStorage.getItem('yagya_devotee_token');
      const headers: Record<string, string> = {};
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

      const res = await fetch('/api/registrations', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.registrations && Array.isArray(data.registrations)) {
          setRegistrations(data.registrations);
          return;
        }
      }
    } catch (e) {
      console.warn('Initial data load notice:', e);
    }
  };

  useEffect(() => {
    loadSettings();
    loadData();
  }, []);

  // Handle proceeding from Step 1 & 2 (Form) to Step 3 (Payment)
  const handleProceedToPayment = (formData: any) => {
    setPendingPaymentData(formData);
    setCurrentPaymentReg(formData);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle successful payment verification and token generation (Step 4)
  const handlePaymentSuccess = (confirmedReg: Registration) => {
    const updatedList = addRegistration(confirmedReg);
    setRegistrations(updatedList);
    saveLatestUserBooking(confirmedReg);
    setCurrentPaymentReg(confirmedReg);
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle start registration from Home page or Hawan Kund Tracker
  const handleStartRegistration = (kundNumber?: number) => {
    if (kundNumber) {
      setPreselectedKund(kundNumber);
    } else {
      setPreselectedKund(null);
    }
    setCurrentStep(1);
    setCurrentView('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#faf5eb] flex flex-col justify-between text-stone-900 selection:bg-amber-500 selection:text-white">
      {/* Vedic Header with persistent language selector */}
      <VedicHeader
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'lookup') {
            setCurrentView('tickets');
          } else if (view === 'admin') {
            setShowAdminModal(true);
          } else {
            setCurrentView(view);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        isTestMode={isTestMode}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW 1: HOME PAGE */}
        {currentView === 'home' && (
          <HomeTab
            registrations={registrations}
            selectedDate={selectedDate}
            onSelectDate={(date) => setSelectedDate(date)}
            onStartRegistration={() => handleStartRegistration()}
            onOpenLookup={() => {
              setCurrentView('tickets');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenTickets={() => {
              setCurrentView('tickets');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSlip={(reg) => setPrintSlipReg(reg)}
            lang={lang}
          />
        )}

        {/* VIEW 2: REGISTRATION & PAYMENT FLOW (STEPS 1-4) */}
        {currentView === 'register' && (
          <div>
            {currentStep <= 2 && (
              <RegistrationTab
                registrations={registrations}
                onProceedToPayment={handleProceedToPayment}
                initialKundNumber={preselectedKund}
                initialDate={selectedDate}
                lang={lang}
                currentUser={currentUser}
              />
            )}

            {currentStep >= 3 && (
              <PaymentTab
                pendingData={pendingPaymentData}
                confirmedRegistration={currentPaymentReg}
                allRegistrations={registrations}
                onPaymentSuccess={handlePaymentSuccess}
                onGoToRegistration={() => {
                  setPendingPaymentData(null);
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenSlip={(reg) => setPrintSlipReg(reg)}
                lang={lang}
                isTestMode={isTestMode}
              />
            )}
          </div>
        )}

        {/* VIEW 3: DEVOTEE TICKETS & LOGIN/SIGNUP PORTAL */}
        {(currentView === 'tickets' || currentView === 'lookup') && (
          <div className="w-full pb-14 font-sans bg-[#faf5eb] min-h-screen pt-4 sm:pt-6">
            <div className="max-w-4xl mx-auto px-4">
              <DevoteePortal
                lang={lang}
                currentUser={currentUser}
                onUserLogin={handleUserLogin}
                onUserLogout={handleUserLogout}
                onOpenPrintSlip={(reg) => setPrintSlipReg(reg)}
                onBookNewKund={() => handleStartRegistration()}
                onSelectPaymentReg={(reg) => {
                  setPendingPaymentData(reg);
                  setCurrentPaymentReg(reg);
                  setCurrentStep(3);
                  setCurrentView('register');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: DATABASE MANAGEMENT & LIVE STUDIO */}
        {currentView === 'database' && (
          <DatabaseDashboard
            onOpenSlip={(reg) => setPrintSlipReg(reg)}
            onNavigateHome={() => setCurrentView('home')}
          />
        )}
      </main>

      {/* Printable Slip Modal */}
      {printSlipReg && (
        <PrintableSlip
          registration={printSlipReg}
          onClose={() => setPrintSlipReg(null)}
          lang={lang}
        />
      )}

      {/* Admin Panel Modal */}
      {showAdminModal && (
        <AdminPanelModal
          onClose={() => {
            setShowAdminModal(false);
            loadSettings();
            loadData();
          }}
          onOpenSlip={(reg) => setPrintSlipReg(reg)}
          onRefreshData={loadData}
          lang={lang}
        />
      )}

      {/* Standalone Supabase SQL Editor Modal */}
      {showSqlEditorModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border-2 border-amber-400 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Database className="w-5 h-5 text-emerald-700" />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-stone-900">
                    Supabase PostgreSQL SQL Editor & Connection
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    Project: zpbnsolzmrsyoddxzaqj
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlEditorModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <SupabaseSqlEditor />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="no-print bg-[#240608] text-amber-100/90 py-6 border-t border-[#3d0d12] text-xs">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-2">
          <div className="text-amber-200 font-medium">
            🕉️ {t.appName} — "{t.tagline}"
          </div>
          <div className="text-stone-400 text-[11px]">
            {t.venueAddress}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setCurrentView('tickets');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 text-amber-200 bg-amber-950/60 hover:bg-amber-900 px-3 py-1 rounded-lg border border-amber-400/30 transition-all cursor-pointer text-[11px]"
            >
              <span>🎟️ यजमान प्रवेश पत्र व लॉगिन</span>
            </button>

            <button
              onClick={() => {
                setCurrentView('database');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-950/90 px-3 py-1 rounded-lg border border-emerald-500/40 transition-all cursor-pointer text-[11px]"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>⚡ Supabase SQL एडिटर एवं डेटाबेस</span>
            </button>

            <button
              onClick={() => setShowAdminModal(true)}
              className="inline-flex items-center gap-1.5 text-amber-300/80 hover:text-amber-200 bg-black/40 hover:bg-black/60 px-3 py-1 rounded-lg border border-stone-700 transition-all cursor-pointer text-[11px]"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.adminPortal}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
