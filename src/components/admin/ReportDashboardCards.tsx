import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileWarning,
  PauseCircle,
  Radio,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DashboardKind = "concern" | "incident" | "subscription";

type ReportDashboardCardsProps = {
  kind: DashboardKind;
  total: number;
  open: number;
  priority: number;
  completed: number;
  notResolved?: number;
};

type CardTone = "blue" | "green" | "amber" | "rose";

type DashboardCard = {
  label: string;
  value: number | string;
  note: string;
  icon: LucideIcon;
  tone: CardTone;
};

const numberFormatter = new Intl.NumberFormat();

const kindCopy: Record<DashboardKind, { eyebrow: string; title: string; subtitle: string }> = {
  concern: {
    eyebrow: "Concern reports",
    title: "Community concerns",
    subtitle: "All submitted concerns",
  },
  incident: {
    eyebrow: "Incident reports",
    title: "Public incidents",
    subtitle: "All submitted incidents",
  },
  subscription: {
    eyebrow: "Alert subscriptions",
    title: "Alert subscribers",
    subtitle: "All registered subscribers",
  },
};

const formatNumber = (value: number) => numberFormatter.format(value);

export default function ReportDashboardCards({
  kind,
  total,
  open,
  priority,
  completed,
  notResolved = 0,
}: ReportDashboardCardsProps) {
  const copy = kindCopy[kind];
  const cards: DashboardCard[] = kind === "subscription"
    ? [
        { label: "TOTAL SUBSCRIBERS", value: total, note: "ALL RECORDS", icon: Users, tone: "blue" },
        { label: "ACTIVE SUBSCRIBERS", value: open, note: "READY FOR ALERTS", icon: Radio, tone: "green" },
        { label: "PAUSED SUBSCRIBERS", value: priority, note: "TEMPORARILY PAUSED", icon: PauseCircle, tone: "amber" },
        { label: "ALERT COVERAGE", value: `${completed}%`, note: "WITH HAZARD INTERESTS", icon: BellRing, tone: "rose" },
      ]
    : [
        { label: `TOTAL ${kind.toUpperCase()}S`, value: total, note: copy.subtitle.toUpperCase(), icon: FileWarning, tone: "blue" },
        { label: "OPEN CASES", value: open, note: "NEEDS FOLLOW-UP", icon: Clock3, tone: "amber" },
        { label: "HIGH PRIORITY", value: priority, note: "REQUIRES ATTENTION", icon: AlertTriangle, tone: "rose" },
        { label: "NOT RESOLVED", value: notResolved, note: "STATUS: NOT SOLVED", icon: CircleAlert, tone: "amber" },
        { label: "RESOLVED", value: completed, note: "CLOSED OR SOLVED", icon: CheckCircle2, tone: "green" },
      ];

  const toneClasses: Record<CardTone, string> = {
    blue: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
  } as const;

  return (
    <section className="mb-5 border-t border-slate-200 pt-5 dark:border-gray-800" aria-label={`${copy.title} summary`}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{copy.eyebrow}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white">{copy.title}</h2>
        </div>
        <p className="hidden text-xs text-slate-400 sm:block">Live summary from current records</p>
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 ${kind === "subscription" ? "xl:grid-cols-4" : "xl:grid-cols-5"}`}>
        {cards.map(({ label, value, note, icon: Icon, tone }) => (
          <div
            key={label}
            className="flex min-h-[154px] items-center justify-between rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-[0_2px_5px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div>
              <p className="max-w-[150px] text-[12px] font-bold uppercase leading-5 tracking-[0.08em] text-slate-400">{label}</p>
              <p className="mt-2 text-[30px] font-black leading-none tracking-tight text-slate-950 dark:text-white">
                {typeof value === "number" ? formatNumber(value) : value}
              </p>
              <p className="mt-3 text-[11px] font-bold uppercase text-slate-400">{note}</p>
            </div>
            <div className={`flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[1.35rem] shadow-sm ${toneClasses[tone]}`}>
              <Icon className="h-9 w-9" strokeWidth={1.8} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
