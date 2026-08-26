import React from 'react';
import { PublicOfficeWorkflowData, ThemeOption } from '../types/dashboardTypes';
import { Megaphone, AlertCircle, SearchCheck, BellRing, UserCheck, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  data: PublicOfficeWorkflowData | null;
  loading: boolean;
  theme?: ThemeOption;
}

export const PublicOfficeWorkflow: React.FC<Props> = ({ data, loading, theme }) => {
  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';

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

  const pub = data?.publicSubmissions || { incidents: 0, concerns: 0, inspections: 0, alertSubscribers: 0 };
  const off = data?.officeResponses || {
    dispatchedTeams: 0,
    closedIncidents: 0,
    assignedInspectors: 0,
    inspectionBreakdown: { Submitted: 0, 'Under Review': 0, Assigned: 0, Scheduled: 0, Completed: 0, Rejected: 0 },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Assigned':
      case 'Scheduled':
        return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
      case 'Under Review':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Submitted':
      default:
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    }
  };

  return (
    <div className={`border rounded-xl p-4 flex flex-col justify-between h-full w-full min-h-[360px] transition-colors duration-300 ${containerBg}`}>
      <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isLight ? 'border-slate-200' : isBlueBlack ? 'border-blue-900/50' : 'border-slate-800'}`}>
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-indigo-500" />
          <h2 className={`text-base font-semibold ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-100' : 'text-white'}`}>
            PUBLIC SUBMISSIONS & OFFICE RESPONSE WORKFLOW
          </h2>
        </div>
        <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded ${isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
          Live Portal Sync
        </span>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 bg-slate-800/40 rounded-lg" />
          <div className="h-44 bg-slate-800/40 rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Public Submissions Column */}
          <div className="space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : isBlueBlack ? 'text-blue-300/80' : 'text-slate-400'}`}>
              📥 Citizen & Public Portal Submissions
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border ${cardBg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Public Incidents</span>
                  <Megaphone className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div className="text-xl font-extrabold text-rose-500">{pub.incidents}</div>
                <span className="text-[10px] text-slate-400">Emergency Reports</span>
              </div>

              <div className={`p-3 rounded-lg border ${cardBg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Citizen Concerns</span>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="text-xl font-extrabold text-amber-500">{pub.concerns}</div>
                <span className="text-[10px] text-slate-400">Community Hazards</span>
              </div>

              <div className={`p-3 rounded-lg border ${cardBg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Inspection Requests</span>
                  <SearchCheck className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <div className="text-xl font-extrabold text-sky-500">{pub.inspections}</div>
                <span className="text-[10px] text-slate-400">Safety Requests</span>
              </div>

              <div className={`p-3 rounded-lg border ${cardBg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>EWS Subscribers</span>
                  <BellRing className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="text-xl font-extrabold text-indigo-500">{pub.alertSubscribers}</div>
                <span className="text-[10px] text-slate-400">Active Alert Recipients</span>
              </div>
            </div>
          </div>

          {/* Office Response Tracking Column */}
          <div className="space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : isBlueBlack ? 'text-blue-300/80' : 'text-slate-400'}`}>
              🏛️ Bureau & Office Response Tracking
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div className={`p-2.5 rounded-lg border text-center ${cardBg}`}>
                <div className="text-xs font-semibold text-emerald-500 mb-0.5 flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Dispatched
                </div>
                <div className="text-lg font-extrabold text-emerald-500">{off.dispatchedTeams}</div>
              </div>

              <div className={`p-2.5 rounded-lg border text-center ${cardBg}`}>
                <div className="text-xs font-semibold text-indigo-500 mb-0.5 flex items-center justify-center gap-1">
                  <UserCheck className="w-3 h-3" /> Inspectors
                </div>
                <div className="text-lg font-extrabold text-indigo-500">{off.assignedInspectors}</div>
              </div>

              <div className={`p-2.5 rounded-lg border text-center ${cardBg}`}>
                <div className="text-xs font-semibold text-blue-500 mb-0.5 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Resolved
                </div>
                <div className="text-lg font-extrabold text-blue-500">{off.closedIncidents}</div>
              </div>
            </div>

            {/* Inspection Requests Tracking Feed */}
            <div className={`border rounded-lg p-3 ${cardBg}`}>
              <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                <span>Recent Safety Inspection Requests</span>
                <Clock className="w-3 h-3 text-sky-400" />
              </div>

              <div className="space-y-2 text-xs">
                {data?.recentInspections && data.recentInspections.length > 0 ? (
                  data.recentInspections.map((ins) => (
                    <div key={ins.id} className="flex items-center justify-between border-b border-slate-800/40 pb-1.5 last:border-b-0 last:pb-0">
                      <div>
                        <span className={`font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{ins.trackingNumber}</span>
                        <span className="text-[11px] text-slate-400 ml-2">({ins.inspectionType.replace('_', ' ')})</span>
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{ins.propertyAddress}</p>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusColor(ins.status)}`}>
                          {ins.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{ins.assignedInspector}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-400 text-center py-2">
                    No inspection requests recorded.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
