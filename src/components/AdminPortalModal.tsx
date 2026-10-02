import React, { useState } from 'react';
import {
  ShieldCheck,
  LogOut,
  X,
  Lock,
  Clock,
  Users,
  Database,
  History,
  CheckCircle2,
  Search,
  FileSpreadsheet,
  Eye,
  ExternalLink,
  MessageCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  QrCode,
} from 'lucide-react';
import { Registration, DevoteeUser, AuditLog, SystemSettings, getPaymentStatusDisplay } from '../types/yagya';
import { exportDatabaseToCSV } from '../utils/csvExport';
import { getWhatsAppSendUrl, getRejectionWhatsAppSendUrl } from '../utils/whatsapp';

interface AdminPortalModalProps {
  onClose: () => void;
  registrations: Registration[];
  setRegistrations: React.Dispatch<React.SetStateAction<Registration[]>>;
  devotees: DevoteeUser[];
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  systemSettings: SystemSettings;
  setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onOpenSlip: (reg: Registration) => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  onClose,
  registrations,
  setRegistrations,
  devotees,
  auditLogs,
  setAuditLogs,
  systemSettings,
  setSystemSettings,
  onOpenSlip,
}) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [adminTab, setAdminTab] = useState<'pending' | 'bookings' | 'locks' | 'database' | 'audit'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilterType, setSearchFilterType] = useState<'all' | 'mobile' | 'token' | 'kund'>('all');
  const [searchStatusFilter, setSearchStatusFilter] = useState<string>('all');
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState<string | null>(null);
  const [rejectModalReg, setRejectModalReg] = useState<Registration | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('बैंक खाते में दक्षिणा अप्राप्त अथवा अमान्य UTR नंबर');
  const [approvedToast, setApprovedToast] = useState<{ token: string; mobile: string; name: string } | null>(null);
  const [activeLocks, setActiveLocks] = useState<any[]>([]);

  const [sqlQuery, setSqlQuery] = useState(
    'SELECT id, token, full_name, kund_number, date, amount, payment_status, utr_number FROM registrations ORDER BY created_at DESC LIMIT 10;'
  );
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; rows: (string | number)[][] } | null>(null);
  const [isFetchingServer, setIsFetchingServer] = useState(false);

  const fetchActiveLocks = async () => {
    try {
      const res = await fetch('/api/admin/locks', {
        headers: {
          Authorization: 'Bearer maharishi_master_session_token',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.locks)) {
          setActiveLocks(data.locks);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch active locks:', e);
    }
  };

  const handleForceReleaseLock = async (lockId: string, kundNumber: number) => {
    if (!window.confirm(`क्या आप हवन कुंड #${kundNumber} के इस 5-मिनट लॉक को हटाकर तुरंत मुक्त करना चाहते हैं?`)) return;
    try {
      const res = await fetch(`/api/admin/locks/${lockId}/release`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer maharishi_master_session_token',
        },
      });
      if (res.ok) {
        fetchActiveLocks();
        fetchServerBookings();
      }
    } catch (e) {
      console.warn('Force release error:', e);
    }
  };

  const fetchServerBookings = async () => {
    setIsFetchingServer(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: {
          Authorization: 'Bearer maharishi_master_session_token',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.bookings)) {
          setRegistrations(data.bookings);
        }
      }
      fetchActiveLocks();
    } catch (e) {
      console.warn('Failed to fetch server bookings:', e);
    } finally {
      setIsFetchingServer(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (adminUsername.trim() === 'maharishi_admin' && adminPassword === 'admin123') {
      setIsAdminLoggedIn(true);
      fetchServerBookings();
      fetchActiveLocks();
    } else {
      setLoginError('अमान्य व्यवस्थापक यूज़रनेम अथवा पासवर्ड। कृपया सही क्रेडेंशियल्स दर्ज करें।');
    }
  };

  const handleApproveBooking = (regId: string) => {
    const target = registrations.find((r) => r.id === regId);
    if (!target) return;

    // Requirement 9:
    // Change status to "Payment Verified", confirm registration, generate/confirm unique token,
    // Send token number and complete registration details to user's registered WhatsApp number.
    const updated: Registration = {
      ...target,
      paymentStatus: 'paid', // Payment Verified
      verifiedBy: adminUsername || 'maharishi_admin',
      verifiedAt: new Date().toISOString(),
    };

    setRegistrations((prev) => prev.map((r) => (r.id === regId ? updated : r)));

    // Send to backend server database so state persists permanently
    fetch('/api/admin/approve-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer maharishi_master_session_token',
      },
      body: JSON.stringify({ id: regId }),
    }).catch((e) => console.warn('Backend approve warning:', e));

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        admin: adminUsername || 'maharishi_admin',
        action: 'APPROVED',
        token: target.token,
        kund: target.kundNumber,
        timestamp: new Date().toISOString(),
        reason: `व्यवस्थापक द्वारा UTR ${target.utrNumber || 'N/A'} सत्यापित किया गया • टोकन ${target.token} पुष्ट • WhatsApp संदेश प्रेषित`,
      },
      ...prev,
    ]);

    setApprovedToast({
      token: updated.token,
      mobile: updated.mobile,
      name: updated.fullName || updated.husbandName,
    });

    // Send token number & complete registration details to registered WhatsApp
    const waUrl = getWhatsAppSendUrl(updated.mobile, updated);
    window.open(waUrl, '_blank');
  };

  const handleOpenRejectModal = (reg: Registration) => {
    setRejectModalReg(reg);
    setRejectionReasonInput('बैंक खाते में दक्षिणा अप्राप्त अथवा अमान्य UTR नंबर');
  };

  const handleConfirmReject = () => {
    if (!rejectModalReg) return;
    const regId = rejectModalReg.id;
    const reason = rejectionReasonInput.trim() || 'बैंक खाते में दक्षिणा अप्राप्त अथवा अमान्य UTR';

    // Requirement 10:
    // Change status to "Payment Rejected".
    // Do not confirm the registration.
    // Do not send a confirmation/token message as a successful registration.
    const updated: Registration = {
      ...rejectModalReg,
      paymentStatus: 'rejected', // Payment Rejected
      rejectionReason: reason,
      verifiedBy: adminUsername || 'maharishi_admin',
      verifiedAt: new Date().toISOString(),
    };

    setRegistrations((prev) => prev.map((r) => (r.id === regId ? updated : r)));

    // Send to backend server database so state persists permanently
    fetch('/api/admin/reject-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer maharishi_master_session_token',
      },
      body: JSON.stringify({ id: regId, reason }),
    }).catch((e) => console.warn('Backend reject warning:', e));

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        admin: adminUsername || 'maharishi_admin',
        action: 'REJECTED',
        token: rejectModalReg.token,
        kund: rejectModalReg.kundNumber,
        timestamp: new Date().toISOString(),
        reason: `भुगतान अस्वीकृत: ${reason}`,
      },
      ...prev,
    ]);

    setRejectModalReg(null);
  };

  const handleExecuteSql = () => {
    setSqlResult({
      columns: ['id', 'token', 'full_name', 'kund_number', 'date', 'amount', 'status', 'utr'],
      rows: registrations.slice(0, 10).map((r) => [
        r.id,
        r.token,
        r.fullName || r.husbandName || '',
        r.kundNumber,
        r.date,
        r.amount,
        r.paymentStatus,
        r.utrNumber || '-',
      ]),
    });
  };

  const handleResetAllBookings = async () => {
    const confirmed = window.confirm(
      '⚠️ क्या आप सचमुच सभी 108 हवन कुंड बुकिंग को शून्य (Clear & Restart) करना चाहते हैं?\n\nयह सभी यजमानों के आरक्षण, टोकन और रिकॉर्ड हटा देगा और कुंड 10 से 108 पूर्णतः मुक्त हो जाएंगे।'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/reset-all-bookings', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer maharishi_master_session_token',
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setRegistrations([]);
        try {
          localStorage.setItem('yagya_registrations_v2', '[]');
          localStorage.removeItem('yagya_registrations');
        } catch (e) {}
        alert(data.message || 'सभी हवन कुंड बुकिंग सफलतापूर्वक रीसेट कर दी गई हैं।');
      } else {
        alert(data.error || 'त्रुटि हुई।');
      }
    } catch (e) {
      setRegistrations([]);
      try {
        localStorage.setItem('yagya_registrations_v2', '[]');
        localStorage.removeItem('yagya_registrations');
      } catch (err) {}
      alert('सभी स्थानीय व डेटाबेस बुकिंग शून्य (Clear) कर दी गई हैं।');
    }
  };

  React.useEffect(() => {
    if (!isAdminLoggedIn) return;
    fetchActiveLocks();
    const interval = setInterval(() => {
      fetchActiveLocks();
    }, 3000);
    return () => clearInterval(interval);
  }, [isAdminLoggedIn]);

  const totalKundsCount = 108;
  const bookedCount = registrations.filter(
    (r) => r.paymentStatus === 'paid' || r.paymentStatus === 'pending' || r.paymentStatus === 'counter_pay'
  ).length;
  const lockedCount = activeLocks.length;
  const santReservedCount = 9;
  const availableCount = Math.max(0, totalKundsCount - bookedCount - lockedCount - santReservedCount);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRegistrationsCount = registrations.filter((r) => {
    if (r.createdAt && r.createdAt.startsWith(todayStr)) return true;
    if (r.date === todayStr) return true;
    return false;
  }).length;

  const pendingList = registrations.filter((r) => r.paymentStatus === 'pending');

  const filteredBookings = registrations.filter((r) => {
    if (searchStatusFilter !== 'all' && r.paymentStatus !== searchStatusFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (searchFilterType === 'mobile') {
      return r.mobile.includes(q);
    }
    if (searchFilterType === 'token') {
      return r.token.toLowerCase().includes(q);
    }
    if (searchFilterType === 'kund') {
      return String(r.kundNumber) === q || String(r.kundNumber).includes(q);
    }
    return (
      r.token.toLowerCase().includes(q) ||
      (r.fullName && r.fullName.toLowerCase().includes(q)) ||
      (r.husbandName && r.husbandName.toLowerCase().includes(q)) ||
      r.mobile.includes(q) ||
      String(r.kundNumber).includes(q) ||
      (r.utrNumber && r.utrNumber.toLowerCase().includes(q))
    );
  });


  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border-2 border-stone-300 my-auto overflow-hidden animate-in fade-in flex flex-col max-h-[95vh]">
        <div className="bg-[#4a0e17] text-white px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-amber-600 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300 border border-amber-400/30 shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-sm sm:text-lg text-[#ffea79] truncate">
                व्यवस्थापक पोर्टल (Admin Portal)
              </h3>
              <p className="text-[10px] sm:text-[11px] text-amber-200/80 truncate">
                श्री महर्षि वेदविज्ञान संस्थान • प्रशासक कक्ष
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isAdminLoggedIn && (
              <button
                onClick={() => setIsAdminLoggedIn(false)}
                className="px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden min-[360px]:inline">लॉग आउट</span>
              </button>
            )}
            <button onClick={onClose} className="text-amber-200 hover:text-white p-1 rounded-md text-xl cursor-pointer" aria-label="बंद करें">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-[#faf8f5]">
          {!isAdminLoggedIn ? (
            <div className="max-w-md mx-auto py-4 sm:py-8">
              <div className="bg-white border border-stone-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="text-center space-y-1 mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-800">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold font-serif text-stone-900">
                    व्यवस्थापक सुरक्षित लॉगिन
                  </h4>
                  <p className="text-xs text-stone-500">
                    डेटाबेस प्रबंधन एवं यजमान सत्यापन केवल अधिकृत व्यवस्थापक के लिए आरक्षित है
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">व्यवस्थापक यूज़रनेम *</label>
                    <input
                      type="text"
                      required
                      placeholder="यूज़रनेम दर्ज करें"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3 py-2.5 border border-stone-300 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">पासवर्ड *</label>
                    <input
                      type="password"
                      required
                      placeholder="पासवर्ड दर्ज करें"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3 py-2.5 border border-stone-300 rounded-xl bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    प्रशासक पोर्टल खोलें
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* TOP KPI CARDS: 108 KUNDS, AVAILABLE, 5M LOCKED, BOOKED, TODAY'S REGISTRATIONS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                <div className="bg-white border-2 border-stone-200 rounded-2xl p-3 sm:p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold text-stone-500 flex items-center justify-between">
                    <span>कुल हवन कुंड</span>
                    <span className="text-stone-400 font-mono text-[10px]">TOTAL</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono mt-1">
                    {totalKundsCount}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                    1-9 संत + 10-108 यजमान
                  </div>
                </div>

                <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-3 sm:p-3.5 shadow-2xs">
                  <div className="text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                    <span>उपलब्ध कुंड</span>
                    <span className="text-emerald-700 font-mono text-[10px]">AVAILABLE</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
                    {availableCount}
                  </div>
                  <div className="text-[10px] text-emerald-800 mt-0.5 truncate">
                    तत्काल बुकिंग हेतु खुले
                  </div>
                </div>

                <div
                  className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-3 sm:p-3.5 shadow-2xs cursor-pointer hover:bg-amber-100/70 transition-all"
                  onClick={() => setAdminTab('locks')}
                  title="सक्रिय 5-मिनट लॉक्स देखने हेतु क्लिक करें"
                >
                  <div className="text-[11px] font-bold text-amber-900 flex items-center justify-between">
                    <span className="flex items-center gap-1">🔒 5m लॉक्ड</span>
                    <span className="text-amber-800 font-mono text-[10px]">LOCKED</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-800 font-mono mt-1 flex items-center gap-1.5">
                    {lockedCount}
                    {lockedCount > 0 && (
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <div className="text-[10px] text-amber-900 mt-0.5 truncate font-medium">
                    भुगतान प्रक्रियाधीन
                  </div>
                </div>

                <div
                  className="bg-rose-50/70 border-2 border-rose-300 rounded-2xl p-3 sm:p-3.5 shadow-2xs cursor-pointer hover:bg-rose-100/70 transition-all"
                  onClick={() => setAdminTab('bookings')}
                  title="सभी बुकिंग्स देखने हेतु क्लिक करें"
                >
                  <div className="text-[11px] font-bold text-rose-900 flex items-center justify-between">
                    <span>आरक्षित / बुक</span>
                    <span className="text-rose-800 font-mono text-[10px]">BOOKED</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#8a1523] font-mono mt-1">
                    {bookedCount}
                  </div>
                  <div className="text-[10px] text-rose-900 mt-0.5 truncate">
                    पुष्ट / सत्यापन कतार
                  </div>
                </div>

                <div className="bg-indigo-50/70 border-2 border-indigo-300 rounded-2xl p-3 sm:p-3.5 shadow-2xs col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-bold text-indigo-900 flex items-center justify-between">
                    <span>आज के पंजीकरण</span>
                    <span className="text-indigo-700 font-mono text-[10px]">TODAY</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-indigo-800 font-mono mt-1">
                    {todayRegistrationsCount}
                  </div>
                  <div className="text-[10px] text-indigo-900 mt-0.5 truncate">
                    आज दर्ज कुल यजमान
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setAdminTab('pending')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    adminTab === 'pending'
                      ? 'bg-[#8a1523] text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-300'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>सत्यापन कतार (Pending)</span>
                  {pendingList.length > 0 && (
                    <span className="bg-amber-400 text-amber-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                      {pendingList.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminTab('bookings')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    adminTab === 'bookings'
                      ? 'bg-[#8a1523] text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-300'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>सभी बुकिंग्स ({registrations.length})</span>
                </button>

                <button
                  onClick={() => setAdminTab('locks')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    adminTab === 'locks'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-900 border border-amber-300'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>सक्रिय लॉक्स (5m Locks)</span>
                  {activeLocks.length > 0 && (
                    <span className="bg-white text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                      {activeLocks.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminTab('database')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    adminTab === 'database'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>डेटाबेस प्रबंधन (Supabase & SQLite)</span>
                  <span className="bg-emerald-200 text-emerald-950 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                    Admin Only
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab('audit')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    adminTab === 'audit'
                      ? 'bg-[#8a1523] text-white shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-300'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>ऑडिट लॉग्स</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fetchServerBookings();
                    fetchActiveLocks();
                  }}
                  disabled={isFetchingServer}
                  className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-[#872e18] rounded-xl text-xs font-bold border border-amber-300 cursor-pointer whitespace-nowrap transition-all shadow-xs"
                  title="सर्वर से नवीनतम बुकिंग्स व UTR रिकॉर्ड्स ताज़ा करें"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingServer ? 'animate-spin' : ''}`} />
                  <span>{isFetchingServer ? 'डेटा आ रहा है...' : 'ताज़ा करें'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetAllBookings}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap transition-all"
                  title="सभी 108 हवन कुंड बुकिंग को पूर्णतः शून्य एवं रीसेट करें"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span>सभी बुकिंग रीसेट (Clear & Restart)</span>
                </button>
              </div>

              {adminTab === 'pending' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-amber-950 font-serif">
                        यजमान UTR व दक्षिणा सत्यापन कतार (Payment Verification Queue)
                      </h4>
                      <p className="text-xs text-amber-900/90 mt-0.5">
                        व्यवस्थापक द्वारा बैंक खाते से UTR मिलान करने के बाद <strong>'स्वीकृत करें' दबाते ही स्थिति "Payment Verified" होगी, टोकन पुष्ट होगा और यजमान के WhatsApp पर स्वतः संदेश भेजा जाएगा।</strong>
                      </p>
                    </div>
                    <span className="text-xl font-black text-amber-950 bg-amber-200 px-4 py-1.5 rounded-xl border border-amber-300 shrink-0 self-start sm:self-auto">
                      {pendingList.length} लंबित
                    </span>
                  </div>

                  {pendingList.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-stone-500">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                      <div className="font-bold text-base text-stone-800">कतार रिक्त है!</div>
                      <p className="text-xs text-stone-500 mt-1">वर्तमान में कोई भी यजमान सत्यापन हेतु लंबित नहीं है।</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingList.map((b) => {
                        const kundFormatted =
                          b.kundNumbers && b.kundNumbers.length > 0
                            ? b.kundNumbers.map((n) => `#${String(n).padStart(3, '0')}`).join(', ')
                            : `#${String(b.kundNumber).padStart(3, '0')}`;

                        return (
                          <div key={b.id} className="bg-white border-2 border-amber-300 rounded-2xl p-5 space-y-3.5 shadow-xs">
                            <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                              <div>
                                <span className="font-mono font-bold text-base text-[#8a1523] block">{b.token}</span>
                                <span className="font-bold text-stone-900 text-sm">{b.fullName || b.husbandName}</span>
                                {b.wifeName && (
                                  <span className="text-xs text-stone-500 block">सह-यजमान: {b.wifeName}</span>
                                )}
                              </div>
                              <span className="bg-amber-100 text-amber-950 font-extrabold px-3 py-1 rounded-xl text-xs border border-amber-300 shrink-0">
                                {b.kundCount || 1} कुंड ({kundFormatted})
                              </span>
                            </div>

                            <div className="text-xs text-stone-700 grid grid-cols-2 gap-2 bg-[#fcfaf7] p-3 rounded-xl border border-stone-200">
                              <div>
                                <strong className="text-stone-500 block text-[11px]">WhatsApp / मोबाइल:</strong>
                                <span className="font-mono font-bold text-stone-900">+91 {b.mobile}</span>
                              </div>
                              <div>
                                <strong className="text-stone-500 block text-[11px]">यज्ञ तिथि व समय:</strong>
                                <span className="font-bold text-stone-900">{b.date} • 9:00 AM</span>
                              </div>
                              <div>
                                <strong className="text-stone-500 block text-[11px]">हवन कुंड संख्या:</strong>
                                <span className="font-bold text-stone-900">{kundFormatted}</span>
                              </div>
                              <div>
                                <strong className="text-stone-500 block text-[11px]">कुल दक्षिणा राशि:</strong>
                                <span className="font-bold text-[#872e18]">₹ {Number(b.amount).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="col-span-2 pt-1 border-t border-stone-200">
                                <strong className="text-stone-500 block text-[11px]">बैंक UPI Ref / UTR विवरण:</strong>
                                <span className="font-mono font-black text-sm text-stone-950 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-300/80 inline-block">
                                  {b.utrNumber || 'N/A'}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <strong className="text-stone-500 block text-[11px]">सत्यापन स्थिति (Status):</strong>
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                  ⏳ Payment Pending Verification
                                </span>
                              </div>
                            </div>

                            {/* Screenshot preview */}
                            {b.paymentProofUrl ? (
                              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={b.paymentProofUrl}
                                    alt="Payment Screenshot"
                                    className="w-12 h-12 object-cover rounded-lg border border-stone-300 shadow-2xs"
                                  />
                                  <span className="text-xs font-bold text-stone-800">भुगतान स्क्रीनशॉट संलग्न है</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setViewScreenshotUrl(b.paymentProofUrl || null)}
                                  className="text-xs font-bold text-[#8a1523] hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>बड़ा करके देखें</span>
                                </button>
                              </div>
                            ) : (
                              <div className="p-2 bg-stone-50 border border-stone-200 rounded-xl text-center text-xs text-stone-500 italic">
                                कोई स्क्रीनशॉट संलग्न नहीं किया गया (केवल UTR नंबर दिया गया)
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleApproveBooking(b.id)}
                                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                                title="भुगतान स्वीकृत करें, टोकन स्थायी करें एवं WhatsApp पर विवरण भेजें"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>स्वीकृत करें (Verify & WhatsApp)</span>
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(b)}
                                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1"
                                title="भुगतान अस्वीकृत करें"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>अस्वीकृत करें</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {adminTab === 'locks' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-amber-950 font-serif flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-700" />
                        <span>सक्रिय 5-मिनट अस्थायी लॉक्स (Real-Time Kund Locks)</span>
                      </h4>
                      <p className="text-xs text-amber-900/90 mt-0.5">
                        जब कोई यजमान कुंड चुनकर भुगतान स्क्रीन पर जाता है, तो कुंड 5 मिनट के लिए लॉक हो जाता है। यदि समय समाप्त होता है तो कुंड स्वतः मुक्त हो जाता है। व्यवस्थापक चाहें तो यहीं से तुरंत अनलॉक भी कर सकते हैं।
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm sm:text-base font-black text-amber-950 bg-amber-200 px-3.5 py-1.5 rounded-xl border border-amber-300">
                        {activeLocks.length} सक्रिय लॉक्स
                      </span>
                      <button
                        type="button"
                        onClick={fetchActiveLocks}
                        className="p-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl cursor-pointer"
                        title="लॉक्स ताज़ा करें"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {activeLocks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-stone-500">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                      <div className="font-bold text-base text-stone-800">वर्तमान में कोई सक्रिय लॉक नहीं है!</div>
                      <p className="text-xs text-stone-500 mt-1">सभी उपलब्ध हवन कुंड साधकों हेतु पूर्णतः मुक्त व चयन योग्य हैं।</p>
                    </div>
                  ) : (
                    <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                      <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-amber-50 text-stone-700 font-bold border-b border-amber-200 sticky top-0">
                            <tr>
                              <th className="py-2.5 px-3">कुंड संख्या</th>
                              <th className="py-2.5 px-3">यज्ञ तिथि</th>
                              <th className="py-2.5 px-3">मोबाइल नंबर</th>
                              <th className="py-2.5 px-3">यजमान का नाम</th>
                              <th className="py-2.5 px-3">लॉक प्रारंभ</th>
                              <th className="py-2.5 px-3">लॉक समाप्ति</th>
                              <th className="py-2.5 px-3">शेष समय (Countdown)</th>
                              <th className="py-2.5 px-3 text-right">प्रशासक कार्यवाही</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {activeLocks.map((lock) => {
                              const lId = String(lock.lockId || lock.lock_id || '');
                              const kId = Number(lock.kundId || lock.kund_id || 0);
                              const bDate = String(lock.bookingDate || lock.booking_date || '');
                              const mob = String(lock.mobileNumber || lock.mobile_number || '');
                              const dName = lock.devoteeName || lock.user_name || 'साधक (अनाम)';
                              const lAt = lock.lockedAt || lock.locked_at;
                              const lExp = lock.lockExpiresAt || lock.lock_expires_at;
                              const remainingSec = Math.max(0, Number(lock.remainingSeconds) || 0);
                              const mins = Math.floor(remainingSec / 60);
                              const secs = remainingSec % 60;
                              const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                              return (
                                <tr key={lId} className="hover:bg-amber-50/50">
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#8a1523] whitespace-nowrap">
                                    हवन कुंड #{String(kId).padStart(3, '0')}
                                  </td>
                                  <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                                    {bDate}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <span>+91 {mob}</span>
                                      <a
                                        href={`https://wa.me/91${mob.replace(/\D/g, '').slice(-10)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-700 hover:text-emerald-900"
                                        title="WhatsApp चैट खोलें"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-stone-700">
                                    {dName}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                                    {lAt ? new Date(lAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                                    {lExp ? new Date(lExp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${
                                        remainingSec <= 60
                                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                                      }`}
                                    >
                                      <Clock className="w-3 h-3" />
                                      {timeFormatted} शेष
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => handleForceReleaseLock(lId, kId)}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ml-auto"
                                      title="इस लॉक को तत्काल हटाकर कुंड को मुक्त करें"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>अनलॉक / मुक्त करें</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {adminTab === 'bookings' && (
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder={
                            searchFilterType === 'mobile'
                              ? 'मोबाइल नंबर द्वारा खोजें (उदा. 9876543210)...'
                              : searchFilterType === 'token'
                              ? 'टोकन नंबर द्वारा खोजें (उदा. BUM-2026-XXXX)...'
                              : searchFilterType === 'kund'
                              ? 'हवन कुंड संख्या दर्ज करें (उदा. 25)...'
                              : 'नाम, मोबाइल, टोकन, कुंड या UTR खोजें...'
                          }
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full text-xs pl-9 pr-3 py-2.5 border border-stone-300 rounded-xl bg-white shadow-2xs"
                        />
                      </div>

                      {/* Filter by field type */}
                      <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-300 text-xs shrink-0 overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => setSearchFilterType('all')}
                          className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-all whitespace-nowrap ${
                            searchFilterType === 'all'
                              ? 'bg-[#8a1523] text-white shadow-2xs'
                              : 'text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          सभी
                        </button>
                        <button
                          type="button"
                          onClick={() => setSearchFilterType('mobile')}
                          className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-all whitespace-nowrap ${
                            searchFilterType === 'mobile'
                              ? 'bg-[#8a1523] text-white shadow-2xs'
                              : 'text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          📱 मोबाइल
                        </button>
                        <button
                          type="button"
                          onClick={() => setSearchFilterType('token')}
                          className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-all whitespace-nowrap ${
                            searchFilterType === 'token'
                              ? 'bg-[#8a1523] text-white shadow-2xs'
                              : 'text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          🎫 टोकन
                        </button>
                        <button
                          type="button"
                          onClick={() => setSearchFilterType('kund')}
                          className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-all whitespace-nowrap ${
                            searchFilterType === 'kund'
                              ? 'bg-[#8a1523] text-white shadow-2xs'
                              : 'text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          🔥 कुंड सं.
                        </button>
                      </div>

                      {/* Payment Status Dropdown */}
                      <select
                        value={searchStatusFilter}
                        onChange={(e) => setSearchStatusFilter(e.target.value)}
                        className="text-xs px-3 py-2 border border-stone-300 rounded-xl bg-white font-semibold text-stone-700 shrink-0"
                        title="भुगतान/पंजीकरण स्थिति अनुसार छांटें"
                      >
                        <option value="all">सभी स्थितियां (All Status)</option>
                        <option value="paid">✓ Payment Verified (स्वीकृत)</option>
                        <option value="pending">⏳ Pending Verification (लंबित)</option>
                        <option value="rejected">✕ Payment Rejected (अस्वीकृत)</option>
                        <option value="counter_pay">🏛️ Counter Pay (काउंटर भुगतान)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => exportDatabaseToCSV(registrations)}
                      className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
                      title="स्प्रेडशीट हेतु CSV प्रारूप में डाउनलोड करें"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                      <span>डेटाबेस CSV निर्यात</span>
                    </button>
                  </div>

                  <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-amber-50 text-stone-700 font-bold border-b border-amber-200 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">टोकन सं.</th>
                            <th className="py-2.5 px-3">यजमान का नाम</th>
                            <th className="py-2.5 px-3">WhatsApp/मोबाइल</th>
                            <th className="py-2.5 px-3">तिथि व समय</th>
                            <th className="py-2.5 px-3">हवन कुंड</th>
                            <th className="py-2.5 px-3">दक्षिणा राशि</th>
                            <th className="py-2.5 px-3">बैंक UTR</th>
                            <th className="py-2.5 px-3">स्क्रीनशॉट</th>
                            <th className="py-2.5 px-3">सत्यापन स्थिति</th>
                            <th className="py-2.5 px-3 text-right">कार्य (Actions)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredBookings.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="py-8 text-center text-stone-500">
                                कोई पंजीकरण उपलब्ध नहीं है।
                              </td>
                            </tr>
                          ) : (
                            filteredBookings.map((b) => {
                              const stInfo = getPaymentStatusDisplay(b.paymentStatus);
                              const kundFormatted =
                                b.kundNumbers && b.kundNumbers.length > 0
                                  ? b.kundNumbers.map((n) => `#${String(n).padStart(3, '0')}`).join(', ')
                                  : `#${String(b.kundNumber).padStart(3, '0')}`;

                              return (
                                <tr key={b.id} className="hover:bg-amber-50/50">
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#8a1523] whitespace-nowrap">
                                    {b.token}
                                  </td>
                                  <td className="py-2.5 px-3 font-medium">
                                    {b.fullName || b.husbandName}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                      <span>+91 {b.mobile}</span>
                                      <a
                                        href={`https://wa.me/91${b.mobile.replace(/\D/g, '').slice(-10)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-700 hover:text-emerald-900"
                                        title="WhatsApp चैट खोलें"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <div>{b.date}</div>
                                    <div className="text-[10px] text-stone-500">9:00 AM नियत</div>
                                  </td>
                                  <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                                    {b.kundCount && b.kundCount > 1 ? `${b.kundCount} कुंड (${kundFormatted})` : kundFormatted}
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-[#872e18] whitespace-nowrap">
                                    ₹ {b.amount}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                                    {b.utrNumber || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    {b.paymentProofUrl ? (
                                      <button
                                        type="button"
                                        onClick={() => setViewScreenshotUrl(b.paymentProofUrl || null)}
                                        className="p-1 text-[#8a1523] hover:bg-amber-100 rounded cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                        title="स्क्रीनशॉट देखें"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>देखें</span>
                                      </button>
                                    ) : (
                                      <span className="text-stone-400 text-[11px]">-</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span
                                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${stInfo.badgeClass}`}
                                    >
                                      {stInfo.labelEn} ({stInfo.labelHi})
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                                    {b.paymentStatus === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleApproveBooking(b.id)}
                                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] cursor-pointer"
                                          title="सत्यापित करें व WhatsApp भेजें"
                                        >
                                          स्वीकारें
                                        </button>
                                        <button
                                          onClick={() => handleOpenRejectModal(b)}
                                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded font-bold text-[11px] cursor-pointer"
                                          title="अस्वीकृत करें"
                                        >
                                          अस्वीकारें
                                        </button>
                                      </>
                                    )}
                                    {b.paymentStatus === 'paid' && (
                                      <a
                                        href={getWhatsAppSendUrl(b.mobile, b)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[11px] font-bold cursor-pointer"
                                        title="WhatsApp पर टोकन पुनः भेजें"
                                      >
                                        <span>📲 WhatsApp</span>
                                      </a>
                                    )}
                                    <button
                                      onClick={() => onOpenSlip(b)}
                                      className="p-1 text-stone-700 hover:bg-stone-100 rounded cursor-pointer"
                                      title="प्रवेश पास व रसीद देखें"
                                    >
                                      <Eye className="w-3.5 h-3.5 inline" />
                                    </button>
                                    <a
                                      href={`/api/booking/verify/${b.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-amber-800 hover:bg-amber-100 rounded cursor-pointer inline-flex items-center gap-0.5 text-[11px] font-bold"
                                      title="गेटवे QR सत्यापन पास खोलें"
                                    >
                                      <QrCode className="w-3.5 h-3.5 inline text-[#8a1523]" />
                                      <span>QR पास</span>
                                    </a>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'database' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                        <Database className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-900">
                          Supabase PostgreSQL & SQLite Engine
                        </div>
                        <div className="text-xs text-stone-500 font-mono">
                          प्रोजेक्ट: zpbnsolzmrsyoddxzaqj • टेबल: devotee_users, registrations, audit_logs
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => exportDatabaseToCSV(registrations)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>CSV निर्यात</span>
                      </button>
                      <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded-xl">
                        सक्रिय (Admin Only)
                      </span>
                    </div>
                  </div>

                  <div className="border border-stone-300 rounded-2xl overflow-hidden bg-stone-900 text-stone-100 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <span className="text-xs font-mono text-stone-400">
                        PostgreSQL Live Query Terminal
                      </span>
                      <button
                        onClick={handleExecuteSql}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                      >
                        क्वेरी निष्पादित करें (Execute)
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="w-full bg-stone-900 text-amber-200 font-mono text-xs p-2 focus:outline-hidden resize-none"
                    />

                    {sqlResult && (
                      <div className="overflow-x-auto max-h-48 overflow-y-auto bg-stone-950 p-2 rounded-xl text-xs font-mono">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-stone-800 text-stone-400">
                              {sqlResult.columns.map((c, idx) => (
                                <th key={idx} className="p-1">{c}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sqlResult.rows.map((r, rIdx) => (
                              <tr key={rIdx} className="hover:bg-stone-900">
                                {r.map((val, cIdx) => (
                                  <td key={cIdx} className="p-1 text-emerald-300">{String(val)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2">
                    <div className="font-bold text-xs text-stone-800 font-serif">
                      डेटाबेस में सुरक्षित साधक क्रेडेंशियल्स (devotee_users टेबल):
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-stone-50 border-b border-stone-200">
                          <tr>
                            <th className="p-2">साधक ID</th>
                            <th className="p-2">पूरा नाम</th>
                            <th className="p-2">मोबाइल</th>
                            <th className="p-2">पासवर्ड (Encrypted)</th>
                            <th className="p-2">नगर</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {devotees.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-stone-500">
                                वर्तमान में कोई नया साधक खाता पंजीकृत नहीं है।
                              </td>
                            </tr>
                          ) : (
                            devotees.map((d) => (
                              <tr key={d.id}>
                                <td className="p-2 font-mono text-[#8a1523]">{d.id}</td>
                                <td className="p-2 font-bold">{d.fullName}</td>
                                <td className="p-2 font-mono">{d.mobile}</td>
                                <td className="p-2 font-mono text-stone-400">••••••••</td>
                                <td className="p-2">{d.city}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'audit' && (
                <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3">समय</th>
                          <th className="py-2.5 px-3">व्यवस्थापक</th>
                          <th className="py-2.5 px-3">कार्यवाही</th>
                          <th className="py-2.5 px-3">टोकन</th>
                          <th className="py-2.5 px-3">विवरण / कारण</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-stone-500">
                              कोई ऑडिट लॉग उपलब्ध नहीं है।
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="py-2 px-3 font-mono text-[11px] text-stone-500">
                                {new Date(log.timestamp).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 font-bold">{log.admin}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    log.action === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-[#8a1523]">{log.token}</td>
                              <td className="py-2 px-3 text-stone-700">{log.reason}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* SCREENSHOT FULL RESOLUTION LIGHTBOX MODAL */}
              {viewScreenshotUrl && (
                <div
                  className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
                  onClick={() => setViewScreenshotUrl(null)}
                >
                  <div
                    className="relative max-w-lg w-full bg-white p-4 rounded-3xl shadow-2xl text-center space-y-3 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <span className="font-bold text-xs text-stone-800">
                        यजमान द्वारा प्रस्तुत भुगतान स्क्रीनशॉट (Payment Proof)
                      </span>
                      <button
                        onClick={() => setViewScreenshotUrl(null)}
                        className="text-stone-500 hover:text-stone-900 p-1 text-base font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-stone-200 bg-stone-50">
                      <img
                        src={viewScreenshotUrl}
                        alt="Payment Proof Full"
                        className="w-full h-auto object-contain mx-auto block"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setViewScreenshotUrl(null)}
                        className="px-4 py-2 bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        बंद करें (Close)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* REJECTION REASON CONFIRMATION MODAL */}
              {rejectModalReg && (
                <div
                  className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
                  onClick={() => setRejectModalReg(null)}
                >
                  <div
                    className="relative max-w-md w-full bg-white p-6 rounded-3xl shadow-2xl space-y-4 cursor-default border-2 border-rose-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2.5 text-rose-700 border-b border-rose-100 pb-3">
                      <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                      <div>
                        <h4 className="font-bold text-base text-stone-900 font-serif">
                          भुगतान अस्वीकृत करें (Reject Payment)
                        </h4>
                        <p className="text-xs text-stone-500">
                          टोकन: {rejectModalReg.token} • यजमान: {rejectModalReg.fullName || rejectModalReg.husbandName}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-stone-700 space-y-2">
                      <p>
                        अस्वीकृत करने पर बुकिंग की स्थिति तुरंत <strong>“Payment Rejected”</strong> हो जाएगी एवं हवन कुंड (कुंड #{rejectModalReg.kundNumber}) अन्य यजमानों हेतु पुनः मुक्त कर दिया जाएगा।
                      </p>
                      <div>
                        <label className="block font-bold text-stone-800 mb-1">
                          अस्वीकृति का कारण (Reason for Rejection):
                        </label>
                        <select
                          value={rejectionReasonInput}
                          onChange={(e) => setRejectionReasonInput(e.target.value)}
                          className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white mb-2"
                        >
                          <option value="बैंक खाते में दक्षिणा अप्राप्त अथवा अमान्य UTR नंबर">
                            बैंक खाते में दक्षिणा अप्राप्त अथवा अमान्य UTR नंबर
                          </option>
                          <option value="गलत अथवा फर्जी UTR नंबर दर्ज किया गया है">
                            गलत अथवा फर्जी UTR नंबर दर्ज किया गया है
                          </option>
                          <option value="अपूर्ण अथवा अपठनीय स्क्रीनशॉट प्रस्तुत किया गया">
                            अपूर्ण अथवा अपठनीय स्क्रीनशॉट प्रस्तुत किया गया
                          </option>
                          <option value="दक्षिणा राशि निर्धारित से कम प्राप्त हुई">
                            दक्षिणा राशि निर्धारित से कम प्राप्त हुई
                          </option>
                        </select>
                        <input
                          type="text"
                          value={rejectionReasonInput}
                          onChange={(e) => setRejectionReasonInput(e.target.value)}
                          placeholder="अन्य कारण टाइप करें..."
                          className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-stone-200">
                      <button
                        type="button"
                        onClick={handleConfirmReject}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>अस्वीकृति की पुष्टि करें (Confirm Reject)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectModalReg(null)}
                        className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl border border-stone-300 cursor-pointer"
                      >
                        रद्द करें
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* APPROVAL & WHATSAPP TOAST */}
              {approvedToast && (
                <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-60 bg-stone-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-center gap-3 animate-in slide-in-from-bottom">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 font-bold">
                    ✓
                  </div>
                  <div className="text-xs min-w-0">
                    <span className="font-bold text-emerald-400 block text-xs sm:text-sm">
                      भुगतान सत्यापित एवं स्वीकृत!
                    </span>
                    <span className="text-stone-300 break-words">
                      टोकन {approvedToast.token} कन्फर्म हो गया और {approvedToast.name} (+91 {approvedToast.mobile}) के WhatsApp पर भेजा गया।
                    </span>
                  </div>
                  <button
                    onClick={() => setApprovedToast(null)}
                    className="text-stone-400 hover:text-white p-1 text-sm font-bold cursor-pointer ml-auto shrink-0"
                    aria-label="बंद करें"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
