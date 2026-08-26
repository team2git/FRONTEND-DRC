import React from 'react';
import { ResponseMonitoring, ThemeOption } from '../types/dashboardTypes';
import { ShieldCheck, CheckCircle2, Clock, Truck } from 'lucide-react';

interface Props {
  data: ResponseMonitoring | null;
  loading: boolean;
  theme?: ThemeOption;
}

export const ResponseStatus: React.FC<Props> = ({ data, loading, theme }) => {
  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';
  const status = data?.responseStatus || { submitted: 0, received: 0, dispatched: 0, closed: 0 };
  const total = status.submitted + status.received + status.dispatched + status.closed || 1;

  const items = [
    { label: 'Dispatched / Active', count: status.dispatched, icon: Truck, color: 'text-emerald-400', bg: 'bg-emerald-500' },
    { label: 'Received / Queued', count: status.received, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500' },
    { label: 'Submitted / Pending', count: status.submitted, icon: Clock, color: 'text-rose-400', bg: 'bg-rose-500' },
    { label: 'Closed / Resolved', count: status.closed, icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500' },
  ];

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
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h2 className={`text-base font-semibold ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-100' : 'text-white'}`}>
            EMERGENCY RESPONSE MONITORING
          </h2>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex-1 space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-10 rounded-lg ${isLight ? 'bg-slate-100' : isBlueBlack ? 'bg-blue-950/40' : 'bg-slate-800/40'}`} />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-around">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className={`border p-3 rounded-lg text-center ${cardBg}`}>
                  <div className={`flex items-center justify-center gap-1.5 mb-1 text-xs font-semibold ${isLight ? 'text-slate-600' : isBlueBlack ? 'text-blue-300/80' : 'text-slate-400'}`}>
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className={`text-xl font-extrabold ${item.color}`}>{item.count}</div>
                </div>
              );
            })}
          </div>

          {/* Response Progress Bar */}
          <div className="mt-2">
            <div className={`flex items-center justify-between text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-600' : isBlueBlack ? 'text-blue-300/80' : 'text-slate-400'}`}>
              <span>Overall Incident Resolution Progress</span>
              <span>{Math.round((status.closed / total) * 100)}% Resolved</span>
            </div>
            <div className={`h-3 w-full rounded-full overflow-hidden flex border ${isLight ? 'bg-slate-200 border-slate-300' : isBlueBlack ? 'bg-[#050812] border-blue-900/60' : 'bg-slate-950 border-slate-800'}`}>
              <div
                style={{ width: `${(status.closed / total) * 100}%` }}
                className="bg-blue-500 h-full transition-all duration-500"
                title="Closed"
              />
              <div
                style={{ width: `${(status.dispatched / total) * 100}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title="Dispatched"
              />
              <div
                style={{ width: `${(status.received / total) * 100}%` }}
                className="bg-amber-500 h-full transition-all duration-500"
                title="Received"
              />
              <div
                style={{ width: `${(status.submitted / total) * 100}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
                title="Submitted"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
