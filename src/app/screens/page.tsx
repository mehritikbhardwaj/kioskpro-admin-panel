'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { 
  Layers, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  Code2,
  ListFilter,
  Monitor,
  Clock,
  User,
  ShieldCheck,
  Camera
} from 'lucide-react';
import { DomCaptureSnapshot } from '@/lib/types';

export default function ScreensIntelligencePage() {
  const [screens, setScreens] = useState<DomCaptureSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedScreen, setSelectedScreen] = useState<DomCaptureSnapshot | null>(null);
  const [screenshotEnabled, setScreenshotEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchScreens = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dom-capture?mode=screens');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setScreens(data.data);
        if (data.data.length > 0 && !selectedScreen) {
          setSelectedScreen(data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load captured screens:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchToggleStatus = async () => {
    try {
      const res = await fetch('/api/dom-capture?mode=toggle');
      const data = await res.json();
      if (data.success) {
        setScreenshotEnabled(Boolean(data.enabled));
      }
    } catch (err) {}
  };

  const toggleRemoteScreenshot = async () => {
    try {
      setToggling(true);
      const nextVal = !screenshotEnabled;
      const res = await fetch('/api/dom-capture?mode=toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextVal })
      });
      const data = await res.json();
      if (data.success) {
        setScreenshotEnabled(nextVal);
      }
    } catch (err) {
      console.error('Failed to toggle remote screenshot:', err);
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    fetchScreens();
    fetchToggleStatus();
  }, []);

  const filteredScreens = screens.filter(s => {
    const q = search.toLowerCase();
    return (
      (s.pageTitle || '').toLowerCase().includes(q) ||
      (s.urlPath || '').toLowerCase().includes(q) ||
      (s.activeMenu || '').toLowerCase().includes(q) ||
      (s.cspCode || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Screen Intelligence & DOM Explorer
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Live portal screens captured automatically from CSP terminals
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleRemoteScreenshot}
                disabled={toggling}
                title="When enabled, Kiosk terminals will take and upload a visual screenshot along with the DOM structure"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm border ${
                  screenshotEnabled
                    ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Camera className={`h-3.5 w-3.5 ${screenshotEnabled ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`} />
                <span>
                  {screenshotEnabled ? '📸 Remote Screenshots: ON (Click to Pause)' : '📸 Remote Screenshots: OFF (Click to Enable)'}
                </span>
              </button>

              <button
                onClick={fetchScreens}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Main 2-column layout */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
            {/* Left Column: Screen List */}
            <div className="md:col-span-5 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by title, route, or CSP code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1 font-semibold">
                  <span>{filteredScreens.length} unique screens</span>
                  <span>Auto-updated live</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                {loading && screens.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    Loading captured screens...
                  </div>
                ) : filteredScreens.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    {screens.length === 0 
                      ? 'No screens captured yet. Screens will appear automatically as CSPs use KioskPro.' 
                      : 'No screens matched your search.'}
                  </div>
                ) : (
                  filteredScreens.map((s) => {
                    const isSelected = selectedScreen?.screenKey === s.screenKey;
                    return (
                      <button
                        key={s.screenKey}
                        onClick={() => setSelectedScreen(s)}
                        className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-teal-50 border border-teal-200 text-teal-900 shadow-sm'
                            : 'hover:bg-slate-50 border border-transparent text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate max-w-[220px]">
                            {s.pageTitle || 'Untitled Screen'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {s.screenshotBase64 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Monitor className="h-2.5 w-2.5" />
                                SS
                              </span>
                            )}
                            {s.hasModal && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Modal
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {s.urlPath || '/'}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            CSP: {s.cspCode}
                          </span>
                          <span>•</span>
                          <span>{s.inputs.length} inputs</span>
                          <span>•</span>
                          <span>{s.buttons.length} buttons</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Screen Details / Inspect */}
            <div className="md:col-span-7 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {selectedScreen ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Top Bar of details */}
                  <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-slate-900">
                        {selectedScreen.pageTitle}
                      </h2>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Key: {selectedScreen.screenKey}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {selectedScreen.urlPath}
                      </span>
                      {selectedScreen.activeMenu && (
                        <span className="text-[11px] text-slate-500">
                          Menu: <b>{selectedScreen.activeMenu}</b>
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        Captured: {new Date(selectedScreen.capturedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Scrollable details */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Visual Screenshot Preview */}
                    {selectedScreen.screenshotBase64 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden shadow-sm">
                        <div className="p-2.5 bg-slate-800 text-slate-300 text-[11px] font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Monitor className="h-3.5 w-3.5 text-teal-400" />
                            Live Portal Screenshot (Pixel-Perfect)
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const w = window.open('');
                                if (w) {
                                  w.document.write(`<img src="data:image/jpeg;base64,${selectedScreen.screenshotBase64}" style="max-width:100%;height:auto;display:block;margin:auto;" />`);
                                }
                              }}
                              className="text-[10px] text-teal-300 hover:text-teal-200 underline font-medium"
                            >
                              Open Full Size ↗
                            </button>
                            <span className="text-[10px] text-slate-400">• Captured live</span>
                          </div>
                        </div>
                        <div className="p-3 flex items-center justify-center bg-slate-950">
                          <img
                            src={`data:image/jpeg;base64,${selectedScreen.screenshotBase64}`}
                            alt={selectedScreen.pageTitle}
                            className="max-h-[420px] w-auto object-contain rounded-lg shadow-md border border-slate-800"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-center">
                        <div className="mx-auto w-9 h-9 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-500 mb-2">
                          <Monitor className="h-4 w-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-700">No Visual Screenshot Stored Yet</h4>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
                          With Remote Screenshots turned <b>ON</b> (top-right), KioskPro captures live portal screenshots automatically as CSPs navigate. You can also press <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-mono font-bold text-[10px]">Ctrl+Shift+S</kbd> inside KioskPro to upload instantly.
                        </p>
                      </div>
                    )}

                    {/* Inputs Table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Code2 className="h-3.5 w-3.5 text-teal-600" />
                          Form Input Fields ({selectedScreen.inputs.length})
                        </h3>
                      </div>

                      {selectedScreen.inputs.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                          No visible text inputs found on this screen
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px]">
                              <tr>
                                <th className="p-2.5">Field / Placeholder</th>
                                <th className="p-2.5">Element ID</th>
                                <th className="p-2.5">Name</th>
                                <th className="p-2.5">Type</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                              {selectedScreen.inputs.map((inp, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="p-2.5 font-sans font-medium text-slate-900">
                                    {inp.placeholder || inp.label || '(No label)'}
                                  </td>
                                  <td className="p-2.5 text-teal-700 font-semibold">
                                    {inp.id ? `#${inp.id}` : '-'}
                                  </td>
                                  <td className="p-2.5 text-slate-600">
                                    {inp.name || '-'}
                                  </td>
                                  <td className="p-2.5 text-slate-400 uppercase text-[10px]">
                                    {inp.type || 'text'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Radio Options (if any) */}
                    {selectedScreen.radios && selectedScreen.radios.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                          Radio Options ({selectedScreen.radios.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedScreen.radios.map((r, idx) => (
                            <div
                              key={idx}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                                r.checked
                                  ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="font-bold">{r.label || r.value}</span>
                              <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                val: "{r.value}"
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dropdown Selects (if any) */}
                    {selectedScreen.selects && selectedScreen.selects.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <ListFilter className="h-3.5 w-3.5 text-teal-600" />
                          Dropdown Selects ({selectedScreen.selects.length})
                        </h3>
                        <div className="space-y-2">
                          {selectedScreen.selects.map((sel, idx) => (
                            <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-slate-800">{sel.label || sel.name || 'Dropdown'}</span>
                                {sel.id && <span className="font-mono text-[10px] text-teal-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">#{sel.id}</span>}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {sel.options.map((opt, oIdx) => (
                                  <span key={oIdx} className="bg-white border border-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Buttons List */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                        Clickable Action Buttons & Controls ({selectedScreen.buttons.length})
                      </h3>

                      {selectedScreen.buttons.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                          No primary buttons detected
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedScreen.buttons.map((btn, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-2 shadow-2xs"
                            >
                              <span>{btn.text}</span>
                              {btn.id && (
                                <span className="font-mono text-[10px] text-teal-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  #{btn.id}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Table Headers (if any) */}
                    {selectedScreen.tableHeaders && selectedScreen.tableHeaders.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-teal-600" />
                          Detected Data Table Columns ({selectedScreen.tableHeaders.length})
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedScreen.tableHeaders.map((th, idx) => (
                            <span key={idx} className="bg-teal-50 border border-teal-200 text-teal-800 font-mono text-[11px] px-2.5 py-1 rounded-lg font-semibold">
                              {th}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Modal Popup (if present) */}
                    {selectedScreen.hasModal && selectedScreen.modalHtml && (
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-amber-700">
                          Active Modal / Dialog HTML
                        </h3>
                        <pre className="p-3 bg-slate-900 text-teal-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 leading-relaxed">
                          {selectedScreen.modalHtml}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <Monitor className="h-10 w-10 stroke-[1.5] mb-2 text-slate-300" />
                  <p className="text-xs font-medium">Select a screen on the left to inspect its form selectors and action buttons.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
