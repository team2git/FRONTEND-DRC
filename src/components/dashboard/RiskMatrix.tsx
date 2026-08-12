import React from 'react';

interface RiskMatrixProps {
  hazards?: Array<{ type: string; severity: string; frequency: string }>;
}

export const RiskMatrix: React.FC<RiskMatrixProps> = ({ hazards = [] }) => {
  // 5x5 Likelihood x Impact Grid
  const likelihoods = ['Very High', 'High', 'Medium', 'Low', 'Very Low'];
  const impacts = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

  const getCellColor = (lIdx: number, iIdx: number) => {
    const score = (5 - lIdx) * (iIdx + 1);
    if (score >= 15) return 'bg-red-500/80 text-white hover:bg-red-600';
    if (score >= 10) return 'bg-orange-500/80 text-white hover:bg-orange-600';
    if (score >= 5) return 'bg-amber-400/80 text-slate-900 hover:bg-amber-500';
    return 'bg-emerald-400/80 text-slate-900 hover:bg-emerald-500';
  };

  // Map hazard frequency/severity to 5x5 coordinates
  const getHazardsInCell = (lIdx: number, iIdx: number) => {

    return hazards.filter(h => {
      const hSev = h.severity.toLowerCase();
      const hFreq = h.frequency.toLowerCase();

      const matchLikelihood = 
        (lIdx === 0 && (hFreq.includes('frequent') || hFreq.includes('very high'))) ||
        (lIdx === 1 && (hFreq.includes('high') || hFreq.includes('seasonal'))) ||
        (lIdx === 2 && (hFreq.includes('moderate') || hFreq.includes('occasional'))) ||
        (lIdx === 3 && (hFreq.includes('low') || hFreq.includes('rare'))) ||
        (lIdx === 4 && (hFreq.includes('very low') || hFreq.includes('unlikely')));

      const matchImpact = 
        (iIdx === 4 && (hSev.includes('catastrophic') || hSev.includes('very high'))) ||
        (iIdx === 3 && (hSev.includes('major') || hSev.includes('high'))) ||
        (iIdx === 2 && (hSev.includes('moderate') || hSev.includes('medium'))) ||
        (iIdx === 1 && (hSev.includes('minor') || hSev.includes('low'))) ||
        (iIdx === 0 && (hSev.includes('insignificant') || hSev.includes('negligible')));

      return matchLikelihood && matchImpact;
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          5×5 Hazard Risk Matrix (Likelihood vs Impact)
        </h3>
        <p className="text-xs text-slate-400">Classifies hazards based on risk probability and operational consequence</p>
      </div>

      <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
        {/* Y Axis Label */}
        <div className="flex flex-col justify-center items-center h-full font-bold text-[10px] text-slate-400 uppercase tracking-widest -rotate-90">
          Likelihood
        </div>

        {/* Matrix Grid */}
        <div className="space-y-1.5">
          {likelihoods.map((l, lIdx) => (
            <div key={l} className="grid grid-cols-6 gap-1.5 items-center">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-right pr-2">{l}</span>
              {impacts.map((imp, iIdx) => {
                const matched = getHazardsInCell(lIdx, iIdx);
                return (
                  <div
                    key={imp}
                    className={`h-12 rounded-lg p-1 flex flex-col justify-between items-start transition-all cursor-pointer shadow-sm ${getCellColor(lIdx, iIdx)}`}
                    title={`${l} Likelihood × ${imp} Impact (${matched.length} hazards)`}
                  >
                    <span className="text-[9px] font-extrabold opacity-75">{lIdx + 1},{iIdx + 1}</span>
                    {matched.length > 0 && (
                      <div className="flex flex-wrap gap-1 w-full">
                        {matched.map(m => (
                          <span key={m.type} className="text-[9px] font-black bg-black/30 px-1 py-0.5 rounded text-white truncate max-w-full">
                            {m.type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* X Axis Header */}
          <div className="grid grid-cols-6 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span></span>
            {impacts.map(imp => (
              <span key={imp} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center truncate">
                {imp}
              </span>
            ))}
          </div>
          <div className="text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest pt-1">
            Impact / Consequence
          </div>
        </div>
      </div>
    </div>
  );
};
