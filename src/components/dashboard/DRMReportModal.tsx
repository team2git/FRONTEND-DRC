import React, { useState } from 'react';
import { X, FileText, Download, CheckSquare, Square, Printer, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { DashboardStats } from '../../api/dashboardService';

interface DRMReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DashboardStats | null;
}

export const DRMReportModal: React.FC<DRMReportModalProps> = ({ isOpen, onClose, stats }) => {
  const [reportType, setReportType] = useState('Woreda DRM Profile');
  const [period, setPeriod] = useState('2025/26');
  const [locationFilter, setLocationFilter] = useState('Entire Woreda Zone');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'word'>('pdf');

  const [sections, setSections] = useState({
    executiveSummary: true,
    population: true,
    hazardAnalysis: true,
    vulnerability: true,
    exposure: true,
    riskMap: true,
    woredaRanking: true,
    disasterHistory: true,
    preparedness: true,
    capacityGaps: true,
    alerts: true,
    responseActions: true,
    recommendations: true,
  });

  if (!isOpen) return null;

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    const allTrue = Object.keys(sections).reduce((acc, k) => ({ ...acc, [k]: true }), {} as typeof sections);
    setSections(allTrue);
  };

  const deselectAll = () => {
    const allFalse = Object.keys(sections).reduce((acc, k) => ({ ...acc, [k]: false }), {} as typeof sections);
    setSections(allFalse);
  };

  const rankings = stats?.woredaRankings || [];

  const handleGenerateReport = () => {
    if (format === 'excel') {
      const header = stats?.woredaHeader;
      const csvRows = [
        ['OFFICIAL WOREDA DISASTER RISK MANAGEMENT REPORT'],
        [`Woreda Region: ${header?.woredaName || 'Addis Ababa Central Woreda'}`, `Zone: ${header?.zone || 'Zone 01'}`, `Region: ${header?.region || 'Addis Ababa'}`],
        [`Reporting Period: ${period}`, `Generated On: ${new Date().toLocaleDateString()}`],
        [],
        ['EXECUTIVE SUMMARY'],
        [stats?.executiveSummaryText || 'N/A'],
        [],
        ['WOREDA RISK RANKINGS'],
        ['Woreda Unit', 'Main Hazard', 'Exposure Score', 'Vulnerability Score', 'Risk Score', 'Risk Level'],
        ...rankings.map(k => [k.name, k.hazard, k.exposure, k.vulnerability, k.score, k.level]),
        [],
        ['HAZARD ANALYSIS'],
        ['Hazard Type', 'Occurrences', 'Frequency', 'Severity', 'Affected Pop', 'Affected Woredas', 'Trend', 'Status'],
        ...(stats?.hazardAnalysis || []).map(h => [h.type, h.occurrences, h.frequency, h.severity, h.affectedPop, h.affectedWoredas || 0, h.trend, h.status]),
        [],
        ['CAPACITY GAPS ANALYSIS'],
        ['Resource', 'Required', 'Available', 'Gap', 'Status'],
        ...(stats?.capacityGaps || []).map(c => [c.resource, c.required, c.available, c.gap, c.status]),
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `DRM_Report_${reportType.replace(/\s+/g, '_')}_${period.replace('/', '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onClose();
      return;
    }

    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-900/30 text-[#C8102E]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Generate DRM Report</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Export official decision-support report for administrators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Config Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Report Type</label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200"
              >
                <option value="Woreda DRM Profile">Woreda DRM Profile</option>
                <option value="Risk Assessment Report">Risk Assessment Report</option>
                <option value="Disaster History Report">Disaster History Report</option>
                <option value="Preparedness & Capacity Report">Preparedness & Capacity Report</option>
                <option value="Hazard Analysis Report">Hazard Analysis Report</option>
                <option value="Woreda Risk Report">Woreda Risk Report</option>
                <option value="Executive Summary">Executive Summary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Reporting Period</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200"
              >
                <option value="2025/26">2025/26 (Current)</option>
                <option value="2024/25">2024/25</option>
                <option value="2023/24">2023/24</option>
                <option value="Custom">Custom Date Range</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target Location</label>
              <select
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-800 dark:text-slate-200"
              >
                <option value="Entire Woreda Zone">Entire Woreda Zone</option>
                {rankings.map(r => (
                  <option key={r.name} value={r.name}>{r.name} ({r.level})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'pdf', label: 'PDF (Print Optimized)', icon: Printer, desc: 'Formatted official report' },
                { id: 'excel', label: 'Excel / CSV Data', icon: FileSpreadsheet, desc: 'Raw dataset spreadsheet' },
                { id: 'word', label: 'Document / JSON', icon: FileText, desc: 'Structured text output' },
              ].map(f => {
                const Icon = f.icon;
                const isSel = format === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id as any)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSel
                        ? 'border-[#C8102E] bg-red-50/50 dark:bg-red-950/20 text-[#C8102E] ring-1 ring-[#C8102E]'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2" />
                    <div>
                      <div className="text-xs font-bold">{f.label}</div>
                      <div className="text-[10px] opacity-75">{f.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Report Sections</label>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[11px] font-bold text-[#C8102E] hover:underline">Select All</button>
                <span className="text-slate-300">•</span>
                <button onClick={deselectAll} className="text-[11px] font-bold text-slate-400 hover:underline">Deselect All</button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {[
                { key: 'executiveSummary', label: 'Executive Summary' },
                { key: 'population', label: 'Demographics' },
                { key: 'hazardAnalysis', label: 'Hazard Analysis' },
                { key: 'vulnerability', label: 'Vulnerability Index' },
                { key: 'exposure', label: 'Infrastructure Exposure' },
                { key: 'riskMap', label: 'Woreda Risk Map' },
                { key: 'woredaRanking', label: 'Woreda Risk Ranking' },
                { key: 'disasterHistory', label: 'Disaster History' },
                { key: 'preparedness', label: 'Preparedness Score' },
                { key: 'capacityGaps', label: 'Capacity Gap Table' },
                { key: 'alerts', label: 'Early Warnings' },
                { key: 'responseActions', label: 'Response Actions' },
                { key: 'recommendations', label: 'Priority Actions' },
              ].map(sec => {
                const checked = sections[sec.key as keyof typeof sections];
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => toggleSection(sec.key as keyof typeof sections)}
                    className="flex items-center gap-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    {checked ? <CheckSquare className="w-4 h-4 text-[#C8102E] flex-shrink-0" /> : <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    <span className="truncate">{sec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> System Verified Report
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#C8102E] hover:bg-[#a00d24] rounded-xl shadow-lg shadow-red-900/20 transition active:scale-95"
            >
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
