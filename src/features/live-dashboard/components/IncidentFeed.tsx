import React from 'react';
import { ActivityItem, ThemeOption } from '../types/dashboardTypes';
import { Activity, Bell, Shield, FileText } from 'lucide-react';

interface Props {
  activities: ActivityItem[];
  loading: boolean;
  theme?: ThemeOption;
}

export const IncidentFeed: React.FC<Props> = ({ activities, loading, theme }) => {
  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';

  const getIcon = (type: string, severity: string) => {
    if (severity === 'critical') return <Bell className="w-4 h-4 text-rose-500 animate-bounce" />;
    switch (type) {
      case 'incident':
        return <Activity className="w-4 h-4 text-amber-500" />;
      case 'survey':
        return <FileText className="w-4 h-4 text-sky-400" />;
      case 'audit':
      default:
        return <Shield className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    try {
      const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch {
      return '';
    }
  };

  const containerBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-md'
    : isBlueBlack
    ? 'bg-[#0f172a] border-blue-900/50 text-blue-100 shadow-xl shadow-blue-950/40'
    : 'bg-slate-900 border-slate-800 text-white shadow-xl';

  return (
    <div className={`border rounded-xl p-4 flex flex-col justify-between h-full w-full min-h-[460px] transition-colors duration-300 ${containerBg}`}>
      <div className={`flex items-center justify-between mb-2.5 pb-2.5 border-b ${isLight ? 'border-slate-200' : isBlueBlack ? 'border-blue-900/50' : 'border-slate-800'}`}>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500" />
          <h2 className={`text-base font-semibold ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-100' : 'text-white'}`}>
            LIVE ACTIVITY STREAM
          </h2>
        </div>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isLight ? 'bg-slate-100 text-slate-700' : isBlueBlack ? 'bg-blue-950 text-blue-300 border border-blue-800/40' : 'bg-slate-800 text-slate-400'}`}>
          {activities.length} Events
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1.5 space-y-2 custom-scrollbar max-h-[380px]">
        {loading && activities.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`h-12 rounded-lg animate-pulse ${isLight ? 'bg-slate-100' : isBlueBlack ? 'bg-blue-950/40' : 'bg-slate-800/40'}`} />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className={`h-full flex items-center justify-center text-xs ${isLight ? 'text-slate-500' : isBlueBlack ? 'text-blue-300/60' : 'text-slate-400'}`}>
            No recent activity events.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className={`p-2.5 rounded-lg border transition ${
                act.severity === 'critical'
                  ? isLight
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-rose-500/10 border-rose-500/30'
                  : isLight
                  ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  : isBlueBlack
                  ? 'bg-[#080d1a] border-blue-900/50 hover:bg-[#0c1428]'
                  : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`p-1 rounded-md border mt-0.5 shrink-0 ${isLight ? 'bg-white border-slate-200' : isBlueBlack ? 'bg-[#050812] border-blue-900/60' : 'bg-slate-900 border-slate-700'}`}>
                  {getIcon(act.type, act.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-100' : 'text-slate-200'}`}>{act.title}</h3>
                    <span className={`text-[10px] font-mono shrink-0 ${isLight ? 'text-slate-500 font-semibold' : isBlueBlack ? 'text-blue-300/60' : 'text-slate-400'}`}>
                      {getTimeAgo(act.timestamp)}
                    </span>
                  </div>
                  <p className={`text-[11px] line-clamp-1 leading-normal ${isLight ? 'text-slate-600' : isBlueBlack ? 'text-blue-200/70' : 'text-slate-400'}`}>
                    {act.description}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer scroll hint if more than 6 activities exist */}
      {activities.length > 6 && (
        <div className={`pt-2 mt-1 border-t text-center text-[10px] font-semibold ${isLight ? 'border-slate-100 text-slate-400' : 'border-slate-800 text-slate-500'}`}>
          Showing top 6 events · Scroll list to view all {activities.length}
        </div>
      )}
    </div>
  );
};

export default IncidentFeed;
