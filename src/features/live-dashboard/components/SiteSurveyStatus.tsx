import React from 'react';
import { SurveyMonitoring, ThemeOption } from '../types/dashboardTypes';
import { ClipboardList, CheckCircle, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface Props {
  data: SurveyMonitoring | null;
  loading: boolean;
  theme?: ThemeOption;
}

export const SiteSurveyStatus: React.FC<Props> = ({ data, loading, theme }) => {
  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';
  const sync = data?.syncBreakdown || { SYNCED: 0, UNSYNCED: 0, UPDATED: 0 };
  const profiles = data?.woredaProfileStatus || { Draft: 0, Submitted: 0, Reviewed: 0 };
  const onlineCount = data?.onlineSubmissions ?? 0;
  const offlineCount = data?.offlineSubmissions ?? (sync.SYNCED + sync.UNSYNCED + sync.UPDATED);

  const containerBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-md'
    : isBlueBlack
    ? 'bg-[#0f172a] border-blue-900/50 text-blue-100 shadow-xl shadow-blue-950/40'
    : 'bg-slate-900 border-slate-800 text-white shadow-xl';

  const cardBg = isLight
    ? 'bg-slate-50 border-slate-200'
    : isBlueBlack
    ? 'bg-[#080d1a] border-blue-900/50'
    : 'bg-slate-950 border-slate-800';

  return (
    <div className={`border rounded-xl p-4 flex flex-col justify-between h-full w-full min-h-[360px] transition-colors duration-300 ${containerBg}`}>
      <div className={`flex items-center justify-between mb-3 pb-3 border-b ${isLight ? 'border-slate-200' : isBlueBlack ? 'border-blue-900/50' : 'border-slate-800'}`}>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-sky-500" />
          <h2 className={`text-base font-semibold ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-100' : 'text-white'}`}>
            SITE SURVEY & PROFILE MONITORING
          </h2>
        </div>
        {/* Online vs Offline Counter Badges */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Wifi className="w-3 h-3" /> Online: {onlineCount}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <WifiOff className="w-3 h-3" /> Offline PWA: {offlineCount}
          </span>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex-1 space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className={`h-16 rounded-lg ${isLight ? 'bg-slate-100' : isBlueBlack ? 'bg-blue-950/40' : 'bg-slate-800/40'}`} />
          ))}
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Form Responses Sync Status */}
          <div className={`border p-3.5 rounded-lg ${cardBg}`}>
            <h3 className={`text-xs font-bold mb-2 flex items-center justify-between ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-200' : 'text-slate-300'}`}>
              <span>Offline Survey Sync Status</span>
              <RefreshCw className="w-3.5 h-3.5 text-sky-500" />
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className={`flex items-center gap-1.5 font-medium ${isLight ? 'text-slate-700' : isBlueBlack ? 'text-blue-200' : 'text-slate-300'}`}>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Synced Responses
                </span>
                <span className="font-extrabold text-emerald-500">{sync.SYNCED}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`flex items-center gap-1.5 font-medium ${isLight ? 'text-slate-700' : isBlueBlack ? 'text-blue-200' : 'text-slate-300'}`}>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Pending Sync
                </span>
                <span className="font-extrabold text-amber-500">{sync.UNSYNCED}</span>
              </div>
            </div>
          </div>

          {/* Woreda Profile Verification Status */}
          <div className={`border p-3.5 rounded-lg ${cardBg}`}>
            <h3 className={`text-xs font-bold mb-2 flex items-center justify-between ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-200' : 'text-slate-300'}`}>
              <span>Woreda DRM Profiles</span>
              <ClipboardList className="w-3.5 h-3.5 text-indigo-500" />
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className={`font-medium ${isLight ? 'text-slate-600' : isBlueBlack ? 'text-blue-300/70' : 'text-slate-400'}`}>Reviewed / Approved</span>
                <span className="font-extrabold text-emerald-500">{profiles.Reviewed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${isLight ? 'text-slate-600' : isBlueBlack ? 'text-blue-300/70' : 'text-slate-400'}`}>Submitted for Verification</span>
                <span className="font-extrabold text-amber-500">{profiles.Submitted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${isLight ? 'text-slate-600' : isBlueBlack ? 'text-blue-300/70' : 'text-slate-400'}`}>Draft In-Progress</span>
                <span className={`font-extrabold ${isLight ? 'text-slate-700' : isBlueBlack ? 'text-blue-200' : 'text-slate-400'}`}>{profiles.Draft}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
