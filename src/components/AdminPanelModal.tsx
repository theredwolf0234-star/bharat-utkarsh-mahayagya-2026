import React, { useState, useEffect } from 'react';
import { Registration, AuditLog, SystemSettings } from '../types/yagya';
import { exportToCSV } from '../utils/storage';
import { SupabaseSqlEditor } from './SupabaseSqlEditor';
import { Language, translations } from '../utils/i18n';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Key, 
  X, 
  LogOut, 
  Search, 
  FileSpreadsheet, 
  Printer, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Flame, 
  Eye, 
  AlertCircle,
  Database,
  List,
  CheckCircle2,
  XCircle,
  Settings as SettingsIcon,
  History,
  Beaker,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onOpenSlip: (reg: Registration) => void;
  onRefreshData?: () => void;
  lang?: Language;
}

export const AdminPanelModal: React.FC<Props> = ({ onClose, onOpenSlip, onRefreshData, lang = 'hi' }) => {
  const t = translations[lang] || translations.hi;

  const [adminStatus, setAdminStatus] = useState<{ adminExists: boolean; totalBookings: number; pendingCount?: number } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState<string>('');
  const [adminUser, setAdminUser] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'pending' | 'bookings' | 'audit' | 'settings' | 'sql_editor'>('pending');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bookings list state
  const [bookings, setBookings] = useState<Registration[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'counter_pay' | 'pending' | 'rejected'>('all');

  // Reject Modal state
  const [rejectingBooking, setRejectingBooking] = useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = useState('अमान्य 12-अंकीय UTR अथवा बैंक खाते में राशि अप्राप्त।');

  // Zoom screenshot state
  const [zoomedScreenshot, setZoomedScreenshot] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<SystemSettings>({
    reservationExpiryMinutes: 15,
    testModeEnabled: false,
    upiId: 'maharishivedvigyan@sbi',
    pricePerPerson: 1100,
  });
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  // Copied UTR tooltip
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
    loadSettings();
  }, []);

  const checkAdminStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/status');
      const data = await res.json();
      setAdminStatus(data);
    } catch (e) {
      setAdminStatus({ adminExists: false, totalBookings: 0, pendingCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (e) {}
  };

  const fetchBookings = async (token: string) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (e) {
      console.warn('Fetch bookings note:', e);
    }
  };

  const fetchAuditLogs = async (token: string) => {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {}
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password !== confirmPassword) {
      setErrorMsg('पासवर्ड एवं कन्फर्म पासवर्ड मेल नहीं खाते।');
      return;
    }

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'खाता निर्माण में त्रुटि।');
        return;
      }

      setAdminToken(data.token);
      setAdminUser(data.username);
      setIsLoggedIn(true);
      fetchBookings(data.token);
      fetchAuditLogs(data.token);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'त्रुटि।');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'अमान्य क्रेडेंशियल।');
        return;
      }

      setAdminToken(data.token);
      setAdminUser(data.username);
      setIsLoggedIn(true);
      fetchBookings(data.token);
      fetchAuditLogs(data.token);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'लॉगिन में त्रुटि।');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAdminToken('');
    setAdminUser('');
    checkAdminStatus();
  };

  // ADMIN ACTION 1: APPROVE BOOKING & MARK PAID
  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/admin/approve-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        const data = await res.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? data.registration : b))
        );
        fetchAuditLogs(adminToken);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ADMIN ACTION 2: REJECT BOOKING & RELEASE KUND
  const handleConfirmReject = async () => {
    if (!rejectingBooking) return;
    try {
      const res = await fetch('/api/admin/reject-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ id: rejectingBooking.id, reason: rejectReason }),
      });

      if (res.ok) {
        const data = await res.json();
        setBookings((prev) =>
          prev.map((b) => (b.id === rejectingBooking.id ? data.registration : b))
        );
        setRejectingBooking(null);
        fetchAuditLogs(adminToken);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm('क्या आप निश्चित रूप से इस रिकॉर्ड को हटाना चाहते हैं?')) return;
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        fetchAuditLogs(adminToken);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSettingsSavedMsg('सेटिंग्स सफलतापूर्वक सुरक्षित कर दी गईं!');
        setTimeout(() => setSettingsSavedMsg(''), 3000);
        fetchAuditLogs(adminToken);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingBookings = bookings.filter((b) => b.paymentStatus === 'pending' || b.paymentStatus === 'temp_hold');

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.paymentStatus !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.husbandName.toLowerCase().includes(q) ||
      (b.wifeName && b.wifeName.toLowerCase().includes(q)) ||
      b.token.toLowerCase().includes(q) ||
      b.mobile.includes(q) ||
      String(b.kundNumber).includes(q) ||
      (b.utrNumber && b.utrNumber.toLowerCase().includes(q))
    );
  });

  const totalAmountCollected = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border-2 border-stone-300 my-auto overflow-hidden animate-in fade-in flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="bg-[#4a0e17] text-white px-6 py-4 flex items-center justify-between border-b border-amber-600 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300 border border-amber-400/30">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-[#ffea79]">
                {t.adminTitle}
              </h3>
              <p className="text-[11px] text-amber-200/80">
                {t.adminSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logoutBtn}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-amber-200 hover:text-white p-1 rounded-md text-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 text-center text-stone-500">व्यवस्थापक स्थिति जांची जा रही है...</div>
          ) : !isLoggedIn ? (
            /* Login & Setup Section */
            <div className="max-w-md mx-auto py-6">
              {!adminStatus?.adminExists ? (
                <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-6 shadow-sm">
                  <div className="text-center mb-5">
                    <span className="p-3 bg-amber-100 text-amber-800 rounded-full inline-block mb-2">
                      <Lock className="w-6 h-6 text-amber-800" />
                    </span>
                    <h4 className="text-lg font-bold font-heading text-stone-900">
                      {t.adminSetupTitle}
                    </h4>
                    <p className="text-xs text-stone-600 mt-1">
                      ⚠️ <strong>सूचना:</strong> सिस्टम में केवल 1 व्यवस्थापक स्लॉट अनुमत है।
                    </p>
                  </div>

                  <form onSubmit={handleSetup} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        {t.adminUsername}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="उदा. maharishi_admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        {t.adminPassword}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        {t.adminConfirmPassword}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    {errorMsg && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 text-white font-bold text-sm rounded-xl shadow cursor-pointer"
                    >
                      व्यवस्थापक खाता सुरक्षित करें
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-center mb-5">
                    <span className="p-3 bg-amber-100 text-amber-800 rounded-full inline-block mb-2">
                      <Lock className="w-6 h-6 text-amber-800" />
                    </span>
                    <h4 className="text-lg font-bold font-heading text-stone-900">
                      {t.adminLoginTitle}
                    </h4>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        {t.adminUsername}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="व्यवस्थापक यूज़रनेम"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        {t.adminPassword}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    {errorMsg && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-[#8a1523] to-[#4a0e17] text-white font-bold text-sm rounded-xl shadow cursor-pointer"
                    >
                      {t.loginBtn}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* Logged-In Admin Dashboard */
            <div className="space-y-5">
              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
                <button
                  onClick={() => setActiveSection('pending')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeSection === 'pending'
                      ? 'bg-[#8a1523] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{t.pendingQueueTab}</span>
                  {pendingBookings.length > 0 && (
                    <span className="bg-amber-400 text-amber-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                      {pendingBookings.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveSection('bookings')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeSection === 'bookings'
                      ? 'bg-[#8a1523] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>{t.allBookingsTab} ({bookings.length})</span>
                </button>

                <button
                  onClick={() => setActiveSection('audit')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeSection === 'audit'
                      ? 'bg-[#8a1523] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>{t.auditLogsTab}</span>
                </button>

                <button
                  onClick={() => setActiveSection('settings')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeSection === 'settings'
                      ? 'bg-[#8a1523] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>{t.settingsTab}</span>
                </button>

                <button
                  onClick={() => setActiveSection('sql_editor')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeSection === 'sql_editor'
                      ? 'bg-[#8a1523] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Supabase SQL</span>
                </button>
              </div>

              {/* TAB 1: PENDING VERIFICATION QUEUE */}
              {activeSection === 'pending' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-amber-950">
                        सत्यापन कतार (Pending UTR & Screenshot Verification)
                      </h4>
                      <p className="text-xs text-amber-800">
                        यजमानों द्वारा जमा किए गए UTR और भुगतान स्क्रीनशॉट की जांच कर स्वीकृत या अस्वीकृत करें।
                      </p>
                    </div>
                    <span className="text-xl font-black text-amber-950 bg-amber-200 px-3 py-1 rounded-xl">
                      {pendingBookings.length}
                    </span>
                  </div>

                  {pendingBookings.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <div className="font-bold text-sm">कोई लंबित भुगतान नहीं है!</div>
                      <div className="text-xs text-stone-400 mt-1">सभी प्रस्तुतियाँ सत्यापित की जा चुकी हैं।</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingBookings.map((b) => (
                        <div
                          key={b.id}
                          className="bg-white border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-mono font-bold text-base text-[#8a1523] block">
                                {b.token}
                              </span>
                              <span className="font-bold text-stone-900 text-sm">
                                {b.husbandName} {b.wifeName ? `• सह: ${b.wifeName}` : ''}
                              </span>
                            </div>
                            <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-lg text-xs">
                              कुंड #{b.kundNumber}
                            </span>
                          </div>

                          <div className="text-xs text-stone-600 space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
                            <div><strong>मोबाइल:</strong> {b.mobile}</div>
                            <div><strong>तिथि व सत्र:</strong> {b.date} • {b.timeSlot || 'प्रातः सत्र'}</div>
                            <div><strong>राशि:</strong> ₹{b.amount} ({b.personCount} यजमान)</div>
                            <div className="flex items-center gap-2">
                              <strong>UTR:</strong>
                              <span className="font-mono font-bold text-stone-900">{b.utrNumber || '-'}</span>
                              {b.utrNumber && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(b.utrNumber!);
                                    setCopiedUtr(b.utrNumber!);
                                    setTimeout(() => setCopiedUtr(null), 1500);
                                  }}
                                  className="text-amber-800 p-0.5 hover:bg-stone-200 rounded cursor-pointer"
                                  title="UTR कॉपी करें"
                                >
                                  {copiedUtr === b.utrNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Screenshot preview if available */}
                          {b.paymentProofUrl ? (
                            <div className="flex items-center gap-3 p-2 bg-stone-100 rounded-xl">
                              <img
                                src={b.paymentProofUrl}
                                alt="Proof"
                                className="w-14 h-14 object-cover rounded-lg border border-stone-300 cursor-pointer shadow-2xs hover:opacity-90"
                                onClick={() => setZoomedScreenshot(b.paymentProofUrl!)}
                              />
                              <div>
                                <span className="text-xs font-bold text-stone-800 block">
                                  भुगतान स्क्रीनशॉट
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setZoomedScreenshot(b.paymentProofUrl!)}
                                  className="text-[11px] text-amber-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>बड़ा आकार देखें</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-stone-400 italic">
                              कोई स्क्रीनशॉट संलग्न नहीं है (केवल UTR दर्ज है)
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(b.id)}
                              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{t.approveBookingBtn}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRejectingBooking(b)}
                              className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>{t.rejectBookingBtn}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ALL BOOKINGS LIST */}
              {activeSection === 'bookings' && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <div className="text-xs text-stone-500 font-medium">कुल बुकिंग्स</div>
                      <div className="text-2xl font-black text-amber-950 mt-1">{bookings.length}</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                      <div className="text-xs text-emerald-700 font-medium">सत्यापित UPI राशि</div>
                      <div className="text-2xl font-black text-emerald-900 mt-1">₹{totalAmountCollected.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                      <div className="text-xs text-blue-700 font-medium">काउंटर देय</div>
                      <div className="text-2xl font-black text-blue-900 mt-1">{bookings.filter((b) => b.paymentStatus === 'counter_pay').length}</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                      <div className="text-xs text-rose-700 font-medium">लंबित / निरस्त</div>
                      <div className="text-2xl font-black text-rose-900 mt-1">{bookings.filter((b) => b.paymentStatus === 'pending' || b.paymentStatus === 'rejected').length}</div>
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <div className="relative max-w-sm w-full">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="यजमान, टोकन, मोबाइल, कुंड या UTR खोजें..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 bg-stone-50"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                        className="text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 font-medium"
                      >
                        <option value="all">सभी स्थितियां ({bookings.length})</option>
                        <option value="paid">सत्यापित (Paid)</option>
                        <option value="pending">सत्यापन लंबित (Pending)</option>
                        <option value="counter_pay">काउंटर देय</option>
                        <option value="rejected">अस्वीकृत (Rejected)</option>
                      </select>

                      <button
                        onClick={() => exportToCSV(bookings)}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>{t.exportExcel}</span>
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-amber-50 text-stone-700 font-bold border-b border-amber-200 sticky top-0 z-10">
                          <tr>
                            <th className="py-2.5 px-3">टोकन</th>
                            <th className="py-2.5 px-3">कुंड सं.</th>
                            <th className="py-2.5 px-3">यज्ञ तिथि</th>
                            <th className="py-2.5 px-3">यजमान नाम</th>
                            <th className="py-2.5 px-3">मोबाइल</th>
                            <th className="py-2.5 px-3">राशि</th>
                            <th className="py-2.5 px-3">स्थिति</th>
                            <th className="py-2.5 px-3">UTR / प्रमाण</th>
                            <th className="py-2.5 px-3 text-right">क्रियाएँ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {filteredBookings.map((b) => (
                            <tr key={b.id} className="hover:bg-amber-50/40">
                              <td className="py-2.5 px-3 font-mono font-bold text-[#8a1523]">
                                {b.token}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-stone-800">
                                #{b.kundNumber}
                              </td>
                              <td className="py-2.5 px-3 text-stone-600 whitespace-nowrap">
                                {b.date}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-stone-900">
                                <div>{b.husbandName}</div>
                                {b.wifeName && <div className="text-[10px] text-stone-500">सह: {b.wifeName}</div>}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-stone-600">
                                {b.mobile}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-stone-800">
                                ₹{b.amount}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    b.paymentStatus === 'paid'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : b.paymentStatus === 'pending'
                                      ? 'bg-amber-100 text-amber-900'
                                      : b.paymentStatus === 'rejected'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {b.paymentStatus === 'paid'
                                    ? 'सत्यापित'
                                    : b.paymentStatus === 'pending'
                                    ? 'लंबित'
                                    : b.paymentStatus === 'rejected'
                                    ? 'अस्वीकृत'
                                    : 'काउंटर देय'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600">
                                <div className="flex items-center gap-1">
                                  <span>{b.utrNumber || '-'}</span>
                                  {b.paymentProofUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setZoomedScreenshot(b.paymentProofUrl!)}
                                      className="text-amber-700 hover:text-amber-900"
                                      title="स्क्रीनशॉट देखें"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                                {b.paymentStatus === 'pending' && (
                                  <button
                                    onClick={() => handleApprove(b.id)}
                                    className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold"
                                    title="स्वीकृत करें"
                                  >
                                    पास करें
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    onOpenSlip(b);
                                    onClose();
                                  }}
                                  className="p-1 text-stone-700 hover:bg-stone-100 rounded text-[11px]"
                                  title="प्रवेश पत्र देखें"
                                >
                                  <Eye className="w-3.5 h-3.5 inline" />
                                </button>

                                <button
                                  onClick={() => handleDeleteBooking(b.id)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded text-[11px]"
                                  title="हटाएं"
                                >
                                  <Trash2 className="w-3.5 h-3.5 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AUDIT LOGS */}
              {activeSection === 'audit' && (
                <div className="space-y-4">
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
                    <h4 className="font-bold text-sm text-stone-900">
                      ऑडिट ट्रेल (Admin Verification Audit Logs)
                    </h4>
                    <p className="text-xs text-stone-500">
                      व्यवस्थापक द्वारा लिए गए सभी निर्णयों, स्वीकृतियों, अस्वीकृतियों और सेटिंग्स परिवर्तनों का अपरिवर्तनीय इतिहास।
                    </p>
                  </div>

                  <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">समय (Timestamp)</th>
                            <th className="py-2.5 px-3">व्यवस्थापक</th>
                            <th className="py-2.5 px-3">क्रिया (Action)</th>
                            <th className="py-2.5 px-3">टोकन / ग्राहक</th>
                            <th className="py-2.5 px-3">विवरण / कारण</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-stone-50">
                              <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-stone-800">
                                {log.adminUsername}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    log.action === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : log.action === 'REJECTED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-stone-100 text-stone-800'
                                  }`}
                                >
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-stone-900">
                                {log.token && <span className="font-mono font-bold text-[#8a1523] block">{log.token}</span>}
                                {log.customerName && <span>{log.customerName}</span>}
                              </td>
                              <td className="py-2.5 px-3 text-stone-600">
                                {log.reason ? <span className="text-rose-700 font-medium">{log.reason}</span> : log.details || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {auditLogs.length === 0 && (
                        <div className="text-center py-10 text-stone-400 text-xs">
                          अभी तक कोई ऑडिट लॉग रिकॉर्ड नहीं है।
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SYSTEM SETTINGS & TEST MODE */}
              {activeSection === 'settings' && (
                <div className="max-w-xl mx-auto space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <h4 className="font-bold text-sm text-amber-950">
                      सिस्टम सेटिंग्स, समय सीमा एवं निःशुल्क टेस्ट मोड
                    </h4>
                    <p className="text-xs text-amber-800">
                      आरक्षण समाप्ति समय सीमा, परीक्षण मोड और आधिकारिक UPI विवरण कॉन्फ़िगर करें।
                    </p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                    {/* Test Mode Toggle */}
                    <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-purple-950 flex items-center gap-1.5">
                          <Beaker className="w-4 h-4 text-purple-700" />
                          <span>{t.testModeToggle}</span>
                        </div>
                        <p className="text-[11px] text-purple-800 mt-0.5">
                          सक्रिय करने पर यजमान बिना वास्तविक UPI भुगतान के त्वरित परीक्षण कर सकते हैं।
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.testModeEnabled}
                        onChange={(e) => setSettings({ ...settings, testModeEnabled: e.target.checked })}
                        className="w-5 h-5 accent-purple-700 cursor-pointer"
                      />
                    </div>

                    {/* Expiry Setting */}
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        {t.reservationExpirySetting}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={settings.reservationExpiryMinutes}
                        onChange={(e) => setSettings({ ...settings, reservationExpiryMinutes: Number(e.target.value) })}
                        className="w-full text-sm px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                      />
                      <p className="text-[11px] text-stone-500 mt-1">
                        निर्धारित समय तक UTR जमा न करने पर चयनित कुंड अन्य यजमानों हेतु स्वतः मुक्त हो जाएगा।
                      </p>
                    </div>

                    {/* UPI ID Setting */}
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        आधिकारिक SBI UPI ID:
                      </label>
                      <input
                        type="text"
                        value={settings.upiId}
                        onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                        className="w-full text-sm px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                    </div>

                    {/* Price per Person */}
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        प्रति यजमान समर्पण दक्षिणा (₹):
                      </label>
                      <input
                        type="number"
                        min={100}
                        value={settings.pricePerPerson}
                        onChange={(e) => setSettings({ ...settings, pricePerPerson: Number(e.target.value) })}
                        className="w-full text-sm px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
                      />
                    </div>

                    {settingsSavedMsg && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl font-bold">
                        {settingsSavedMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#8a1523] hover:bg-[#70101b] text-white font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-all"
                    >
                      {t.saveSettingsBtn}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 5: SUPABASE SQL EDITOR */}
              {activeSection === 'sql_editor' && (
                <SupabaseSqlEditor />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border-2 border-rose-400 animate-in fade-in space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <XCircle className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-base text-stone-900">
                बुकिंग अस्वीकृत करें (Reject Payment)
              </h4>
            </div>

            <p className="text-xs text-stone-600">
              यजमान <strong>{rejectingBooking.husbandName}</strong> (टोकन: {rejectingBooking.token}) की बुकिंग अस्वीकृत करने पर कुंड #{rejectingBooking.kundNumber} तुरंत अन्य यजमानों हेतु मुक्त हो जाएगा।
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                {t.rejectReasonPrompt}
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t.rejectionReasonPlaceholder}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                {t.cancelBtn}
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                {t.confirmRejectBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Zoom Modal */}
      {zoomedScreenshot && (
        <div
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedScreenshot(null)}
        >
          <img
            src={zoomedScreenshot}
            alt="Payment Screenshot Zoom"
            className="max-h-[92vh] max-w-[92vw] rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
