import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  BookmarkPlus,
  Loader2,
  X,
  Check,
} from 'lucide-react';
import { exportQuery, saveTemplate } from '../../../api/reportBuilderApi';
import type { ReportConfig, DataSource } from './types';
import { toast } from 'react-toastify';

interface Props {
  config: ReportConfig;
  source: DataSource | null;
  onTemplateSaved?: () => void;
  onAdjustFilters?: () => void;
}

const getNestedValue = (obj: Record<string, unknown>, path: string): string => {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return '';
    current = (current as Record<string, unknown>)[part];
  }
  if (current === null || current === undefined) return '';
  if (current instanceof Date || (typeof current === 'string' && /^\d{4}-\d{2}-\d{2}/.test(current as string))) {
    return new Date(current as string).toLocaleDateString();
  }
  if (typeof current === 'boolean') return current ? 'Yes' : 'No';
  return String(current).replace(/"/g, '""');
};

export const ExportToolbar: React.FC<Props> = ({
  config,
  source,
  onTemplateSaved,
  onAdjustFilters,
}) => {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPrint, setExportingPrint] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Generate and download CSV
  const handleExportCsv = async () => {
    if (!source) return;
    try {
      setExportingCsv(true);
      const res = await exportQuery(config);
      const rows = res.data;
      const fields = res.fields && res.fields.length > 0 ? res.fields : config.fields;

      const headers = fields.map((f) => {
        const found = source.fields.find((field) => field.key === f);
        return `"${(found ? found.label : f).replace(/"/g, '""')}"`;
      });

      const csvLines = [headers.join(',')];
      rows.forEach((row) => {
        const line = fields.map((f) => `"${getNestedValue(row, f)}"`);
        csvLines.push(line.join(','));
      });

      const csvContent = '\uFEFF' + csvLines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${source.key}_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length.toLocaleString()} records to CSV!`);
    } catch (err: any) {
      console.error('CSV export failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to export CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  // Printable / PDF Report View
  const handlePrintPdf = async () => {
    if (!source) return;
    try {
      setExportingPrint(true);
      const res = await exportQuery(config);
      const rows = res.data;
      const fields = res.fields && res.fields.length > 0 ? res.fields : config.fields;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.warn('Please allow popups to open the print report.');
        return;
      }

      const fieldLabels = fields.map((f) => {
        const found = source.fields.find((field) => field.key === f);
        return found ? found.label : f;
      });

      const rowsHtml = rows
        .map(
          (row, idx) => `
          <tr>
            <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-family: monospace;">${idx + 1}</td>
            ${fields
              .map(
                (f) =>
                  `<td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${
                    getNestedValue(row, f) || '—'
                  }</td>`
              )
              .join('')}
          </tr>`
        )
        .join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${source.label} - System Report</title>
            <style>
              body { font-family: Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; color: #081d3c; }
              .header { border-bottom: 3px solid #143f84; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
              .title { font-size: 22px; font-weight: 800; color: #081d3c; margin: 0; }
              .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
              table { width: 100%; border-collapse: collapse; text-align: left; }
              th { background-color: #f5f7ff; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; font-weight: 800; color: #143f84; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1 class="title">${source.label} Executive Report</h1>
                <div class="meta">PDRM Disaster Risk Management System • Generated on ${new Date().toLocaleString()}</div>
              </div>
              <div style="font-size: 13px; font-weight: 800; color: #143f84;">
                ${rows.length.toLocaleString()} Total Records
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 36px;">#</th>
                  ${fieldLabels.map((l) => `<th>${l}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err: any) {
      console.error('Print PDF failed:', err);
      toast.error('Failed to prepare print report');
    } finally {
      setExportingPrint(false);
    }
  };

  // Save template handler
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !source) return;

    try {
      setSavingTemplate(true);
      await saveTemplate({
        name: templateName.trim(),
        description: templateDesc.trim(),
        source: source.key,
        filters: config.filters,
        fields: config.fields,
        groupBy: config.groupBy,
        chartType: config.chartType,
        isShared,
      });
      toast.success('Report preset saved successfully!');
      setIsSaveModalOpen(false);
      setTemplateName('');
      setTemplateDesc('');
      if (onTemplateSaved) onTemplateSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 transition cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4 text-brand-600" />
            Save as Preset
          </button>

          {onAdjustFilters && (
            <button
              type="button"
              onClick={onAdjustFilters}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-brand-600 px-3 py-2 transition cursor-pointer"
            >
              Adjust Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
          >
            {exportingCsv ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Download Excel / CSV
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={exportingPrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition disabled:opacity-50 cursor-pointer"
          >
            {exportingPrint ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            Print / PDF Report
          </button>
        </div>
      </div>

      {/* Save Template Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in font-outfit">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
                  <BookmarkPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Save Report Preset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preset Name *
                </label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Monthly Incident Severity Distribution"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  placeholder="What insights does this report present?"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/60 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="shareTemplate"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                />
                <label
                  htmlFor="shareTemplate"
                  className="text-xs text-slate-800 dark:text-slate-200 font-bold cursor-pointer select-none"
                >
                  Share this template with other staff members
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate || !templateName.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-black rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {savingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
