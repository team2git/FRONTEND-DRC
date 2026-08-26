import React from 'react';
import { CriticalAlert, ThemeOption } from '../types/dashboardTypes';
import { Bell, X, AlertTriangle, MapPin, Clock } from 'lucide-react';

interface Props {
  alert: CriticalAlert | null;
  onClose: () => void;
  theme?: ThemeOption;
}

export const CriticalAlerts: React.FC<Props> = ({ alert, onClose, theme }) => {
  const isLight = theme === 'light';
  if (!alert) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999999] max-w-md w-full animate-bounce">
      <div
        className={`border-2 border-rose-500 rounded-xl p-4 shadow-2xl relative ${
          isLight ? 'bg-white text-slate-900 shadow-rose-200' : 'bg-slate-900 text-white shadow-rose-950/80'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-1 rounded-lg transition ${
            isLight ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>

          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                CRITICAL DRM ALERT
              </span>
              <span className="text-xs text-rose-600 font-mono font-bold">{alert.reportCode}</span>
            </div>

            <h3 className={`text-sm font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{alert.title}</h3>

            <div className={`text-xs space-y-1 mb-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <p className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-rose-600" />
                <span>Hazard: <strong>{alert.category}</strong></span>
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Location: <strong>{alert.location}</strong></span>
              </p>
              <p className={`flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg transition"
              >
                Acknowledge Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
