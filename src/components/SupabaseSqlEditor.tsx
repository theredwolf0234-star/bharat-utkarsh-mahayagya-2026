import React, { useState, useEffect } from 'react';
import { Database, Play, Copy, Check, ExternalLink, ShieldCheck, RefreshCw, AlertCircle, Terminal } from 'lucide-react';
import { supabase, SUPABASE_SQL_SCHEMA, SUPABASE_PROJECT_ID, SUPABASE_URL } from '../utils/supabase';

export const SupabaseSqlEditor: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    projectId: string;
    url: string;
    latencyMs?: number;
    error?: string | null;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<'all' | 'registrations' | 'audit' | 'settings'>('all');
  const [sqlQuery, setSqlQuery] = useState(SUPABASE_SQL_SCHEMA);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const presets = {
    all: SUPABASE_SQL_SCHEMA,
    registrations: `SELECT id, token, husband_name, kund_number, date, amount, payment_status, utr_number, expires_at 
FROM public.registrations 
ORDER BY created_at DESC 
LIMIT 25;`,
    audit: `SELECT id, admin_username, action, token, customer_name, utr_number, reason, created_at 
FROM public.audit_logs 
ORDER BY created_at DESC 
LIMIT 25;`,
    settings: `SELECT * FROM public.system_settings;`,
  };

  const checkConnection = async () => {
    setLoading(true);
    try {
      const start = Date.now();
      const { error } = await supabase.from('registrations').select('count', { count: 'exact', head: true });
      const latency = Date.now() - start;

      setConnectionStatus({
        connected: !error,
        projectId: SUPABASE_PROJECT_ID,
        url: SUPABASE_URL,
        latencyMs: latency,
        error: error ? error.message : null,
      });
    } catch (err: any) {
      setConnectionStatus({
        connected: false,
        projectId: SUPABASE_PROJECT_ID,
        url: SUPABASE_URL,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunQuery = async () => {
    setIsRunning(true);
    setQueryResult(null);

    try {
      const res = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery }),
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (err: any) {
      setQueryResult({ success: false, error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-stone-900">
      {/* Status Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
            <Database className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-stone-900">
                Supabase PostgreSQL Cloud DB
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  connectionStatus?.connected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {connectionStatus?.connected ? 'सक्रिय (Connected)' : 'सत्यापित / सेटअप आवश्यक'}
              </span>
            </div>
            <div className="text-xs text-stone-500 font-mono mt-0.5">
              Project ID: {SUPABASE_PROJECT_ID} • {SUPABASE_URL}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={checkConnection}
            disabled={loading}
            className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>जांचें (Refresh)</span>
          </button>

          <a
            href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-[#8a1523] hover:bg-[#70101b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 flex-wrap">
        <span className="text-xs font-bold text-stone-600 mr-1 flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5" />
          <span>SQL स्क्रिप्ट्स:</span>
        </span>

        <button
          onClick={() => {
            setActivePreset('all');
            setSqlQuery(presets.all);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
            activePreset === 'all'
              ? 'bg-[#8a1523] text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          संपूर्ण स्कीमा (Full Schema & RLS)
        </button>

        <button
          onClick={() => {
            setActivePreset('registrations');
            setSqlQuery(presets.registrations);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
            activePreset === 'registrations'
              ? 'bg-[#8a1523] text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          SELECT Registrations
        </button>

        <button
          onClick={() => {
            setActivePreset('audit');
            setSqlQuery(presets.audit);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
            activePreset === 'audit'
              ? 'bg-[#8a1523] text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          SELECT Audit Logs
        </button>

        <button
          onClick={() => {
            setActivePreset('settings');
            setSqlQuery(presets.settings);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
            activePreset === 'settings'
              ? 'bg-[#8a1523] text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          SELECT Settings
        </button>
      </div>

      {/* SQL Editor Area */}
      <div className="relative border border-stone-300 rounded-2xl overflow-hidden shadow-inner bg-stone-900 text-stone-100">
        <div className="bg-stone-950 px-4 py-2 border-b border-stone-800 flex items-center justify-between">
          <span className="text-xs font-mono text-stone-400">
            PostgreSQL SQL Editor • tables: registrations, audit_logs, system_settings, admin_users
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'कॉपी हुआ!' : 'कॉपी करें'}</span>
            </button>

            <button
              onClick={handleRunQuery}
              disabled={isRunning}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'निष्पादित हो रहा है...' : 'चलाएं (Run Query)'}</span>
            </button>
          </div>
        </div>

        <textarea
          rows={10}
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          className="w-full bg-stone-900 text-amber-200 font-mono text-xs sm:text-sm p-4 focus:outline-hidden leading-relaxed resize-y"
          spellCheck={false}
        />
      </div>

      {/* Query Result Box */}
      {queryResult && (
        <div className="p-4 bg-white border border-stone-300 rounded-2xl shadow-xs space-y-2">
          <div className="text-xs font-bold text-stone-700">निष्पादन परिणाम (Query Output):</div>
          {queryResult.error ? (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-mono">
              {queryResult.error}
            </div>
          ) : queryResult.values ? (
            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                  <tr>
                    {queryResult.columns?.map((c: string, idx: number) => (
                      <th key={idx} className="py-1.5 px-2">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {queryResult.values?.map((row: any[], rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-amber-50/40">
                      {row.map((cell: any, cIdx: number) => (
                        <td key={cIdx} className="py-1.5 px-2 truncate max-w-[200px]">
                          {String(cell ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-xs text-stone-600 font-mono">
              {queryResult.message || 'सफलतापूर्वक निष्पादित।'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
