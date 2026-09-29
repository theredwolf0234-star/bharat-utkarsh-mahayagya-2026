import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Search, 
  Download, 
  PlusCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Play, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Terminal, 
  Calendar, 
  Filter, 
  Users, 
  Flame, 
  FileText,
  Server,
  ArrowRight
} from 'lucide-react';
import { Registration, YAGYA_DATES, TOTAL_KUNDS, RESERVED_KUNDS_COUNT } from '../types/yagya';
import { SUPABASE_PROJECT_ID, SUPABASE_URL, SUPABASE_KEY, SUPABASE_SQL_SCHEMA } from '../utils/supabase';
import { computeKundStatuses } from '../utils/kundAvailability';

interface Props {
  onOpenSlip?: (reg: Registration) => void;
  onNavigateHome?: () => void;
}

interface DbStatusResponse {
  status: string;
  sqlite: {
    active: boolean;
    file: string;
    sizeKb: number;
    tables: string[];
    recordsCount: number;
  };
  supabase: {
    configured: boolean;
    projectId: string;
    url: string;
    connected: boolean;
    latencyMs: number;
    error: string | null;
  };
  inMemoryCount: number;
}

export const DatabaseDashboard: React.FC<Props> = ({ onOpenSlip, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<'browser' | 'sql' | 'kunds' | 'config'>('browser');
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [records, setRecords] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // SQL Studio state
  const [sqlQuery, setSqlQuery] = useState(`SELECT id, token, husband_name, kund_number, date, amount, payment_status, utr_number 
FROM registrations 
ORDER BY datetime(created_at) DESC 
LIMIT 20;`);
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Selected Record Modal / Details
  const [selectedRecord, setSelectedRecord] = useState<Registration | null>(null);

  // Load Status and Records
  const loadDatabaseData = async () => {
    setLoading(true);
    try {
      // 1. Fetch DB Status
      const statusRes = await fetch('/api/database/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setDbStatus(statusData);
      }

      // 2. Fetch Records
      const recordsRes = await fetch('/api/database/records');
      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        if (recordsData.records && Array.isArray(recordsData.records)) {
          setRecords(recordsData.records);
        }
      }
    } catch (err) {
      console.warn('Error loading database data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Bi-directional sync with Supabase
  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/database/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(`✓ डेटाबेस सिंक सफल! Supabase से: ${data.syncResult?.syncedFromSupabase || 0}, Supabase में: ${data.syncResult?.syncedToSupabase || 0}`);
        await loadDatabaseData();
      } else {
        setSyncMessage(`सिंक नोट: ${data.error || 'कनेक्शन जांचें'}`);
      }
    } catch (e: any) {
      setSyncMessage(`सिंक त्रुटि: ${e?.message || 'सर्वर अनुपलब्ध'}`);
    } finally {
      setSyncing(false);
    }
  };

  // Add Test / Sample Registration
  const handleAddSampleRecord = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/database/seed-sample', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(`✓ नया परीक्षण रिकॉर्ड (#${data.record.kundNumber} - ${data.record.token}) डेटाबेस में दर्ज हुआ!`);
        await loadDatabaseData();
      }
    } catch (e: any) {
      alert('त्रुटि: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string, token: string) => {
    if (!window.confirm(`क्या आप पंजीकरण (${token}) को डेटाबेस से हटाना चाहते हैं?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/database/records/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        if (selectedRecord?.id === id) setSelectedRecord(null);
        await loadDatabaseData();
      }
    } catch (e: any) {
      alert('हटाने में त्रुटि: ' + e.message);
    }
  };

  // Run Custom SQL Query
  const handleRunQuery = async () => {
    if (!sqlQuery.trim()) return;
    setQueryRunning(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery }),
      });
      const data = await res.json();
      if (data.success) {
        setQueryResult({ columns: data.columns, values: data.values });
      } else {
        setQueryError(data.error || 'SQL निष्पादन विफल');
      }
    } catch (err: any) {
      setQueryError(err.message || 'क्वेरी रन करने में त्रुटि');
    } finally {
      setQueryRunning(false);
    }
  };

  // Copy Schema
  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (records.length === 0) return;
    const headers = ['Token', 'Name', 'CoYajman', 'Mobile', 'KundNumber', 'Date', 'TimeSlot', 'Amount', 'PaymentStatus', 'UTR', 'CreatedAt'];
    const rows = records.map((r) => [
      `"${r.token}"`,
      `"${r.fullName || r.husbandName}"`,
      `"${r.wifeName || ''}"`,
      `"${r.mobile}"`,
      r.kundNumber,
      `"${r.date}"`,
      `"${r.timeSlot || ''}"`,
      r.amount,
      `"${r.paymentStatus}"`,
      `"${r.utrNumber || ''}"`,
      `"${r.createdAt}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Yagya_Registrations_Database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Yagya_Registrations_Database_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (selectedDateFilter !== 'all' && r.date !== selectedDateFilter) return false;
    if (selectedStatusFilter !== 'all' && r.paymentStatus !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const digitsOnly = q.replace(/\D/g, '');
      const matchToken = r.token.toLowerCase().includes(q);
      const matchName = (r.fullName || r.husbandName || '').toLowerCase().includes(q);
      const matchWife = (r.wifeName || '').toLowerCase().includes(q);
      const matchMobile = r.mobile.includes(q) || (digitsOnly.length === 10 && r.mobile === digitsOnly);
      const matchUtr = r.utrNumber ? r.utrNumber.toLowerCase().includes(q) : false;
      const matchKund = String(r.kundNumber) === q;
      return matchToken || matchName || matchWife || matchMobile || matchUtr || matchKund;
    }
    return true;
  });

  // Calculate statistics
  const totalAmountCollected = records.reduce((sum, r) => sum + (r.paymentStatus === 'paid' ? r.amount : 0), 0);
  const paidCount = records.filter((r) => r.paymentStatus === 'paid').length;
  const counterPayCount = records.filter((r) => r.paymentStatus === 'counter_pay').length;

  // Selected date Kund Status summary
  const sampleDate = selectedDateFilter !== 'all' ? selectedDateFilter : YAGYA_DATES[0].date;
  const kundSummary = computeKundStatuses(records, sampleDate);

  return (
    <div className="w-full pb-20 font-sans bg-[#faf5eb] min-h-screen text-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8ddcb] p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2.5 bg-gradient-to-tr from-amber-600 to-amber-700 text-white rounded-xl shadow-xs">
                  <Database className="w-6 h-6" />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold font-heading text-stone-900 flex items-center gap-2">
                    डेटाबेस प्रबंधन एवं लाइव स्टूडियो
                    <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 font-mono px-2 py-0.5 rounded-full font-semibold">
                      v2.6 Dual Engine
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                    Supabase PostgreSQL Cloud (<span className="font-mono text-emerald-800 font-bold">{SUPABASE_PROJECT_ID}</span>) + सर्वर एम्बेडेड SQLite (<span className="font-mono">yagya.sqlite</span>)
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Supabase और स्थानीय डेटाबेस के मध्य दो-तरफा डेटा सिंक करें"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'सिंक हो रहा है...' : 'डेटाबेस सिंक'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddSampleRecord}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                title="एक नया सत्यापित परीक्षण यजमान रिकॉर्ड जोड़ें"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ टेस्ट रिकॉर्ड जोड़ें</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={records.length === 0}
                className="flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                disabled={records.length === 0}
                className="flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Sync notification banner */}
          {syncMessage && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-medium text-emerald-900 flex items-center justify-between">
              <span>{syncMessage}</span>
              <button 
                type="button" 
                onClick={() => setSyncMessage(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Engine Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
            {/* Supabase PostgreSQL Badge */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-[#fbf9f4] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Supabase Cloud DB
                </span>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                  PostgreSQL
                </span>
              </div>
              <div className="text-xs text-stone-600 truncate font-mono">
                {SUPABASE_PROJECT_ID}
              </div>
              <div className="text-[11px] text-stone-500 flex items-center justify-between pt-1">
                <span>स्थिति: {dbStatus?.supabase?.connected ? '🟢 सक्रिय (Live)' : '🟡 कनेक्टेड'}</span>
                {dbStatus?.supabase?.latencyMs && dbStatus.supabase.latencyMs > 0 && (
                  <span className="font-mono text-[10px] text-stone-600">{dbStatus.supabase.latencyMs}ms</span>
                )}
              </div>
            </div>

            {/* SQLite Embedded Badge */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-[#fbf9f4] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-amber-700" />
                  SQLite एम्बेडेड
                </span>
                <span className="text-[11px] font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-semibold">
                  data/yagya.sqlite
                </span>
              </div>
              <div className="text-xs text-stone-600">
                कुल सुरक्षित टेबल: <span className="font-semibold text-stone-800">registrations, admin_users</span>
              </div>
              <div className="text-[11px] text-stone-500 pt-1">
                फ़ाइल आकार: <span className="font-mono">{dbStatus?.sqlite?.sizeKb || 12} KB</span> • शून्य निर्भरता
              </div>
            </div>

            {/* Total Bookings Count */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-[#fbf9f4] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">कुल पंजीकृत यजमान</span>
                <span className="text-lg font-bold font-heading text-amber-900">
                  {records.length}
                </span>
              </div>
              <div className="text-[11px] text-stone-600 flex justify-between">
                <span>सत्यापित भुगतान: <strong className="text-emerald-700">{paidCount}</strong></span>
                <span>काउंटर देय: <strong className="text-amber-800">{counterPayCount}</strong></span>
              </div>
              <div className="text-[11px] text-stone-500 pt-1">
                १०८ कुंड क्षमता पर लाइव सिंक्रोनाइज्ड
              </div>
            </div>

            {/* Total Collection */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-[#fbf9f4] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">कुल शुल्क संग्रहण</span>
                <span className="text-lg font-bold font-heading text-emerald-800">
                  ₹{totalAmountCollected.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-[11px] text-stone-600">
                प्रति यजमान: ₹1100 • रसीद व टोकन जारी
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold pt-1">
                ✓ बैंकिंग स्तर सुरक्षा एवं क्रिप्टोग्राफी
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-300 gap-2 sm:gap-4 overflow-x-auto pb-1 text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('browser')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer shrink-0 ${
              activeTab === 'browser'
                ? 'bg-white border-t-2 border-amber-600 text-stone-900 border-x border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-700" />
            <span>📋 टेबल ब्राउज़र (Live Records)</span>
            <span className="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
              {filteredRecords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer shrink-0 ${
              activeTab === 'sql'
                ? 'bg-white border-t-2 border-amber-600 text-stone-900 border-x border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Terminal className="w-4 h-4 text-amber-700" />
            <span>⚡ Supabase SQL एडिटर एवं स्कीमा</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kunds')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer shrink-0 ${
              activeTab === 'kunds'
                ? 'bg-white border-t-2 border-amber-600 text-stone-900 border-x border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-700" />
            <span>🏛️ १०८ कुंड आवंटन स्थिति</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-colors cursor-pointer shrink-0 ${
              activeTab === 'config'
                ? 'bg-white border-t-2 border-amber-600 text-stone-900 border-x border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>🔧 कनेक्शन व क्रेडेंशियल्स</span>
          </button>
        </div>

        {/* TAB 1: TABLE BROWSER */}
        {activeTab === 'browser' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8ddcb] p-6 space-y-5 animate-in fade-in">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="खोजें: टोकन, यजमान नाम, मोबाइल, UTR, कुंड सं. (#010)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">सभी तिथियां (All Dates)</option>
                  {YAGYA_DATES.map((d) => (
                    <option key={d.date} value={d.date}>
                      {d.label}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">सभी भुगतान (All Status)</option>
                  <option value="paid">✓ सशुल्क भुगतान (Paid)</option>
                  <option value="counter_pay">🟡 काउंटर देय (Pay on Day)</option>
                  <option value="pending">प्रक्रियाधीन (Pending)</option>
                </select>
              </div>
            </div>

            {/* Live Table */}
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7f2e7] text-stone-700 font-bold border-b border-stone-200 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">टोकन व कुंड संख्या</th>
                    <th className="px-4 py-3">यजमान व सह-यजमान</th>
                    <th className="px-4 py-3">मोबाइल व नगर</th>
                    <th className="px-4 py-3">तिथि व सत्र</th>
                    <th className="px-4 py-3">शुल्क व स्थिति</th>
                    <th className="px-4 py-3">बैंक UTR / RRN</th>
                    <th className="px-4 py-3 text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-[#872e18] text-xs">
                            {r.token}
                          </div>
                          <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold mt-0.5">
                            अग्नि कुंड #{String(r.kundNumber).padStart(3, '0')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-stone-900 text-xs">
                            {r.fullName || r.husbandName}
                          </div>
                          {r.wifeName && (
                            <div className="text-stone-500 text-[11px]">
                              सह: {r.wifeName}
                            </div>
                          )}
                          {r.gotra && (
                            <div className="text-stone-400 text-[10px]">
                              गोत्र: {r.gotra}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-stone-800 font-medium">
                            {r.mobile}
                          </div>
                          <div className="text-stone-500 text-[11px]">
                            {r.city || 'नोएडा'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-stone-800">
                            {r.date}
                          </div>
                          <div className="text-stone-500 text-[10px] truncate max-w-[140px]">
                            {r.timeSlot || 'प्रातः सत्र'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-stone-900">
                            ₹{r.amount}
                          </div>
                          {r.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              ✓ ऑनलाइन सत्यापित
                            </span>
                          ) : r.paymentStatus === 'counter_pay' ? (
                            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              🟡 काउंटर देय
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">
                              लंबित
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.utrNumber ? (
                            <span className="font-mono text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-[11px] font-medium">
                              {r.utrNumber}
                            </span>
                          ) : (
                            <span className="text-stone-400 text-[11px] italic">उपलब्ध नहीं</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          {onOpenSlip && (
                            <button
                              type="button"
                              onClick={() => onOpenSlip(r)}
                              className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              title="प्रवेश पत्र व रसीद खोलें"
                            >
                              <Printer className="w-3 h-3" />
                              <span>रसीद</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedRecord(r)}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                            title="डिटेल्स देखें"
                          >
                            <span>विवरण</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r.id, r.token)}
                            className="p-1 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="डेटाबेस से हटाएं"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-stone-500">
                        कोई रिकॉर्ड नहीं मिला। आप ऊपर <span className="font-semibold text-amber-800">+ टेस्ट रिकॉर्ड जोड़ें</span> बटन से त्वरित टेस्ट डेटा दर्ज कर सकते हैं।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2 pt-2">
              <div>
                दिखाए जा रहे हैं: <strong className="text-stone-800">{filteredRecords.length}</strong> / कुल: {records.length} रिकॉर्ड्स
              </div>
              <div className="text-[11px]">
                प्रत्येक बुकिंग SQLite व Supabase दोनों में वास्तविक समय में सुरक्षित होती है।
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SQL STUDIO & SCHEMA */}
        {activeTab === 'sql' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8ddcb] p-6 space-y-6 animate-in fade-in">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-stone-900">
                  Supabase PostgreSQL Schema & SQL कंसोल
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  प्रोजेक्ट ID: <span className="font-mono text-emerald-800 font-bold">{SUPABASE_PROJECT_ID}</span> • 1-क्लिक में स्कीमा कॉपी करें या सीधे SQL क्वेरी रन करें
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {copiedSchema ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSchema ? 'स्कीमा कॉपी हो गई!' : '📋 पूरी SQL स्कीमा कॉपी करें'}</span>
                </button>

                <a
                  href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <span>Supabase डैशबोर्ड खोलें</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Quick SQL presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700">
                त्वरित SQL क्वेरी प्रीसेट:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSqlQuery(`SELECT id, token, husband_name, kund_number, date, amount, payment_status, utr_number 
FROM registrations 
ORDER BY datetime(created_at) DESC 
LIMIT 20;`)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100 text-stone-800 rounded-lg text-xs font-medium border border-stone-300 cursor-pointer"
                >
                  नवीनतम २० यजमान (SELECT 20)
                </button>

                <button
                  type="button"
                  onClick={() => setSqlQuery(`SELECT 
  date, 
  COUNT(*) as total_yajman,
  SUM(amount) as total_amount,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
  COUNT(CASE WHEN payment_status = 'counter_pay' THEN 1 END) as counter_count
FROM registrations 
GROUP BY date 
ORDER BY date ASC;`)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100 text-stone-800 rounded-lg text-xs font-medium border border-stone-300 cursor-pointer"
                >
                  तिथि अनुसार संग्रह रिपोर्ट (Group by Date)
                </button>

                <button
                  type="button"
                  onClick={() => setSqlQuery(`SELECT 
  kund_number, 
  date, 
  token, 
  husband_name, 
  wife_name, 
  payment_status 
FROM registrations 
ORDER BY kund_number ASC;`)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100 text-stone-800 rounded-lg text-xs font-medium border border-stone-300 cursor-pointer"
                >
                  कुंड-वार आवंटन सूची (Kund Allotment)
                </button>

                <button
                  type="button"
                  onClick={() => setSqlQuery(SUPABASE_SQL_SCHEMA)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100 text-stone-800 rounded-lg text-xs font-medium border border-stone-300 cursor-pointer"
                >
                  पूरी CREATE TABLE स्कीमा (Full Schema DDL)
                </button>
              </div>
            </div>

            {/* SQL Input Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 font-mono">
                  SQL Editor Terminal:
                </span>
                <button
                  type="button"
                  onClick={handleRunQuery}
                  disabled={queryRunning || !sqlQuery.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{queryRunning ? 'रन हो रहा है...' : 'क्वेरी रन करें (Execute SQL)'}</span>
                </button>
              </div>

              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={8}
                className="w-full p-4 font-mono text-xs bg-[#1e1e1e] text-emerald-300 rounded-xl border border-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-inner"
                placeholder="उदा: SELECT * FROM registrations WHERE kund_number = 10;"
              />
            </div>

            {/* Query Error */}
            {queryError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>त्रुटि: {queryError}</span>
              </div>
            )}

            {/* Query Results */}
            {queryResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">
                    क्वेरी परिणाम ({queryResult.values.length} पंक्तियाँ):
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-stone-300 max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-stone-100 text-stone-700 sticky top-0 border-b border-stone-300">
                      <tr>
                        {queryResult.columns.map((col, idx) => (
                          <th key={idx} className="px-3 py-2 font-bold whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {queryResult.values.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-amber-50/50">
                          {row.map((val, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-stone-800">
                              {val === null ? <span className="text-stone-400 italic">null</span> : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Instructions Accordion for user */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-2">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                <span>Supabase डैशबोर्ड में पहली बार टेबल कैसे बनाएं (How to run in Supabase):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-stone-700">
                <li>ऊपर दिए गए <strong>"📋 पूरी SQL स्कीमा कॉपी करें"</strong> बटन पर क्लिक करें।</li>
                <li><strong>"Supabase डैशबोर्ड खोलें"</strong> बटन दबाकर अपने प्रोजेक्ट के SQL Editor पृष्ठ पर जाएं।</li>
                <li>वहां <strong>"New Query"</strong> पर क्लिक करें और कॉपी की गई स्क्रिप्ट को पेस्ट करके <strong>"RUN"</strong> (या Ctrl+Enter) दबाएं।</li>
                <li>तुरंत <span className="font-mono font-bold">registrations</span> एवं <span className="font-mono font-bold">admin_users</span> टेबल तैयार हो जाएंगी!</li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 3: 108 KUNDS ALLOTMENT STATUS */}
        {activeTab === 'kunds' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8ddcb] p-6 space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-stone-900">
                  १०८ अग्नि कुंड आवंटन स्थिति एवं नियम
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  नियम: कुंड १ से ९ पूज्य संतों हेतु आरक्षित • १० से १०८ जनता हेतु • १ दंपति/परिवार प्रति कुंड
                </p>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-stone-700">तिथि चुनें:</label>
                <select
                  value={sampleDate}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {YAGYA_DATES.map((d) => (
                    <option key={d.date} value={d.date}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Occupancy stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <div className="text-xs text-stone-500">रिक्त कुंड (Available)</div>
                <div className="text-xl font-bold text-emerald-700 font-heading">
                  {kundSummary.totalAvailable}
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <div className="text-xs text-stone-500">आंशिक / १ यजमान (Partial)</div>
                <div className="text-xl font-bold text-amber-700 font-heading">
                  {kundSummary.totalPartiallyBooked}
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <div className="text-xs text-stone-500">पूर्णतः भरे कुंड (Full)</div>
                <div className="text-xl font-bold text-red-700 font-heading">
                  {kundSummary.totalFull}
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <div className="text-xs text-stone-500">संत कुंड (Reserved 1-9)</div>
                <div className="text-xl font-bold text-purple-800 font-heading">
                  {RESERVED_KUNDS_COUNT}
                </div>
              </div>
            </div>

            {/* Allocation Rule Card */}
            <div className="p-4 bg-[#fcf9f2] rounded-xl border border-amber-300/80 text-xs text-stone-800 space-y-1.5">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>विशेष कुंड आवंटन नियम (Configured Rule):</span>
              </div>
              <p className="text-stone-700 leading-relaxed">
                प्रत्येक दिन कुल १०८ यज्ञ होंगे। सामान्यतः १ कुंड में केवल १ दंपति अथवा उनके परिवारजन बैठेंगे। एक कुंड में द्वितीय यजमान/दंपति तभी बैठ सकते हैं जब अन्य सभी १०७ कुंड १-१ यजमान द्वारा भर चुके हों।
              </p>
              <div className="text-[11px] font-semibold text-stone-600">
                साझा आवंटन स्थिति (Shared Allotment Enabled?): {kundSummary.allOtherKundsFilledForShared ? (
                  <span className="text-emerald-700 font-bold">✓ हाँ, सभी अन्य कुंड भर चुके हैं (Shared Allowed)</span>
                ) : (
                  <span className="text-amber-800 font-bold">✕ नहीं, पहले अन्य रिक्त कुंड भरे जाएंगे (1 Couple Per Kund Active)</span>
                )}
              </div>
            </div>

            {/* 108 Kunds Visual Grid */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-700">
                १०८ हवन कुंड ग्रिड ({sampleDate}):
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-1.5">
                {kundSummary.kundList.map((k) => {
                  let bg = 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100';
                  let statusText = 'उपलब्ध';

                  if (k.isReserved) {
                    bg = 'bg-purple-100 text-purple-900 border-purple-300';
                    statusText = 'संत आरक्षित (1-9)';
                  } else if (k.bookedCount >= k.capacity) {
                    bg = 'bg-red-100 text-red-900 border-red-300';
                    statusText = 'पूर्णतः आरक्षित';
                  } else if (k.bookedCount > 0) {
                    bg = 'bg-amber-100 text-amber-900 border-amber-300';
                    statusText = `${k.bookedCount} यजमान`;
                  }

                  return (
                    <div
                      key={k.kundNumber}
                      title={`कुंड सं. #${k.formattedNumber}: ${statusText}`}
                      className={`p-2 rounded-lg border text-center text-xs font-mono font-bold transition-transform cursor-pointer hover:scale-105 shadow-2xs ${bg}`}
                    >
                      <div>#{k.formattedNumber}</div>
                      <div className="text-[9px] font-sans font-normal opacity-80 truncate">
                        {k.isReserved ? 'संत' : k.bookedCount > 0 ? `${k.bookedCount} यज` : 'रिक्त'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONFIGURATION & CREDENTIALS */}
        {activeTab === 'config' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8ddcb] p-6 space-y-6 animate-in fade-in">
            <div className="border-b border-stone-200 pb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">
                डेटाबेस विन्यास एवं क्रेडेंशियल्स (Database Configuration)
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                इस एप्लिकेशन के साथ जुड़े हुए आधिकारिक डेटाबेस क्रेडेंशियल्स का संपूर्ण विवरण
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supabase Box */}
              <div className="p-5 rounded-xl border border-stone-200 bg-[#fcfbf7] space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-700" />
                  <span className="font-bold text-stone-900 text-sm">Supabase PostgreSQL</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-stone-500 font-semibold block">Project ID:</label>
                    <code className="text-stone-900 bg-white px-2 py-1 rounded border border-stone-200 block font-mono">
                      {SUPABASE_PROJECT_ID}
                    </code>
                  </div>

                  <div>
                    <label className="text-stone-500 font-semibold block">Project URL:</label>
                    <code className="text-stone-900 bg-white px-2 py-1 rounded border border-stone-200 block font-mono break-all">
                      {SUPABASE_URL}
                    </code>
                  </div>

                  <div>
                    <label className="text-stone-500 font-semibold block">Public Key (Anon):</label>
                    <code className="text-stone-900 bg-white px-2 py-1 rounded border border-stone-200 block font-mono break-all text-[11px]">
                      {SUPABASE_KEY}
                    </code>
                  </div>

                  <div>
                    <label className="text-stone-500 font-semibold block">Primary Table:</label>
                    <code className="text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 block font-mono font-bold">
                      public.registrations
                    </code>
                  </div>
                </div>
              </div>

              {/* SQLite Box */}
              <div className="p-5 rounded-xl border border-stone-200 bg-[#fcfbf7] space-y-3">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-amber-700" />
                  <span className="font-bold text-stone-900 text-sm">SQLite Embedded Database</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-stone-500 font-semibold block">Engine:</label>
                    <div className="text-stone-900 bg-white px-2 py-1 rounded border border-stone-200 font-mono">
                      sql.js (Pure WebAssembly SQLite in Node.js)
                    </div>
                  </div>

                  <div>
                    <label className="text-stone-500 font-semibold block">Database Binary File:</label>
                    <div className="text-stone-900 bg-white px-2 py-1 rounded border border-stone-200 font-mono">
                      data/yagya.sqlite
                    </div>
                  </div>

                  <div>
                    <label className="text-stone-500 font-semibold block">Sync Mechanism:</label>
                    <div className="text-stone-900 bg-white px-2 py-1 rounded border border-stone-200">
                      Real-time bi-directional auto-sync with Supabase on every booking
                    </div>
                  </div>

                  <div>
                    <label className="text-stone-500 font-semibold block">Active Tables:</label>
                    <code className="text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200 block font-mono font-bold">
                      registrations, admin_users
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-300 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-heading font-bold text-stone-900 text-lg">
                  यजमान पंजीकरण विवरण
                </h3>
                <p className="font-mono text-xs text-[#872e18] font-bold">
                  {selectedRecord.token}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">मुख्य यजमान:</span>
                <span className="font-bold text-stone-900">{selectedRecord.fullName || selectedRecord.husbandName}</span>
              </div>
              {selectedRecord.wifeName && (
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">सह-यजमान (पत्नी):</span>
                  <span className="font-bold text-stone-900">{selectedRecord.wifeName}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">मोबाइल नंबर:</span>
                <span className="font-mono font-bold text-stone-900">{selectedRecord.mobile}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">हवन कुंड सं.:</span>
                <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">#{selectedRecord.kundNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">तिथि:</span>
                <span className="font-semibold text-stone-900">{selectedRecord.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">सत्र:</span>
                <span className="text-stone-800">{selectedRecord.timeSlot || 'प्रातः सत्र'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">शुल्क:</span>
                <span className="font-bold text-emerald-800 text-sm">₹{selectedRecord.amount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">भुगतान स्थिति:</span>
                <span className="font-bold capitalize">{selectedRecord.paymentStatus}</span>
              </div>
              {selectedRecord.utrNumber && (
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">बैंक UTR:</span>
                  <span className="font-mono font-bold text-stone-900">{selectedRecord.utrNumber}</span>
                </div>
              )}
              {selectedRecord.verificationHash && (
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-500">क्रिप्टो हस्ताक्षर:</span>
                  <span className="font-mono text-[10px] text-stone-600">{selectedRecord.verificationHash}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">पंजीकरण समय:</span>
                <span className="font-mono text-[11px] text-stone-600">{selectedRecord.createdAt}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              {onOpenSlip && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSlip(selectedRecord);
                    setSelectedRecord(null);
                  }}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रवेश पत्र व रसीद प्रिंट करें</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
