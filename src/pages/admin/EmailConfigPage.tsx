import React, { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import api from "../../api/axios";
import { toast } from "react-toastify";
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Server,
  ShieldCheck,
  Bell,
  Lock,
} from "lucide-react";

type EmailConfig = {
  _id?: string;
  service: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  enableOtp: boolean;
  enableAlertBroadcast: boolean;
  isActive: boolean;
  lastTestedAt?: string | null;
  lastTestStatus?: "success" | "failed" | "not_tested";
  lastTestMessage?: string;
};

const SERVICE_PRESETS: Record<string, Partial<EmailConfig>> = {
  Gmail: { host: "smtp.gmail.com", port: 587, secure: false },
  Office365: { host: "smtp.office365.com", port: 587, secure: false },
  Outlook: { host: "smtp-mail.outlook.com", port: 587, secure: false },
  SendGrid: { host: "smtp.sendgrid.net", port: 587, secure: false },
  Mailgun: { host: "smtp.mailgun.org", port: 587, secure: false },
  Custom: { host: "", port: 587, secure: false },
};

export default function EmailConfigPage() {
  const [config, setConfig] = useState<EmailConfig>({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    fromName: "FDRMC Early Warning & Comms",
    fromEmail: "",
    replyTo: "",
    enableOtp: true,
    enableAlertBroadcast: true,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; latency?: number } | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [activeTab, setActiveTab] = useState<"smtp" | "sender" | "features" | "test">("smtp");
  const [testEmail, setTestEmail] = useState("");
  const [testMsg, setTestMsg] = useState("Test notification from FDRMC IDRMIS email gateway.");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get("/email-config");
      setConfig({ ...res.data, pass: "" });
    } catch {
      toast.error("Failed to load email configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (service: string) => {
    const preset = SERVICE_PRESETS[service] || {};
    setConfig((prev) => ({ ...prev, service, ...preset }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...config };
      if (!payload.pass) delete payload.pass;
      await api.put("/email-config", payload);
      toast.success("Email configuration saved successfully!");
      setConfig((prev) => ({ ...prev, pass: "" }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const payload: Record<string, any> = {
        service: config.service,
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
      };
      if (config.pass) payload.pass = config.pass;
      const res = await api.post("/email-config/test-connection", payload);
      setTestResult(res.data);
      if (res.data.success) toast.success("SMTP connection verified!");
      else toast.error("Connection test failed");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Connection test failed";
      setTestResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error("Please enter a recipient email address");
      return;
    }
    setSendingTest(true);
    try {
      const res = await api.post("/email-config/send-test-email", {
        to: testEmail,
        message: testMsg,
      });
      if (res.data.success) toast.success(`Test email sent to ${testEmail}`);
      else toast.error(res.data.message || "Failed to send test email");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-amber-500";
  const labelCls = "mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide";

  const tabs = [
    { key: "smtp", label: "SMTP Server", icon: <Server className="h-3.5 w-3.5" /> },
    { key: "sender", label: "Sender Identity", icon: <Mail className="h-3.5 w-3.5" /> },
    { key: "features", label: "Features", icon: <Bell className="h-3.5 w-3.5" /> },
    { key: "test", label: "Test & Send", icon: <Send className="h-3.5 w-3.5" /> },
  ] as const;

  return (
    <>
      <PageMeta
        title="Email Gateway Configuration | IDRMIS"
        description="Configure SMTP email server, OTP, and alert broadcast settings"
      />
      <PageBreadcrumb pageTitle="Email Gateway Configuration" />

      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Mail className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Email Gateway (SMTP)</h3>
                  {!loading && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        config.isActive
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${config.isActive ? "bg-emerald-500 animate-ping" : "bg-gray-400"}`} />
                      {config.isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Manage SMTP credentials, OTP delivery, and alert subscription email broadcasting.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {config.lastTestStatus && config.lastTestStatus !== "not_tested" && (
                <div
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-medium ${
                    config.lastTestStatus === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300"
                  }`}
                >
                  {config.lastTestStatus === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {config.lastTestStatus === "success" ? "Last test passed" : "Last test failed"}
                </div>
              )}
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <RefreshCw className={`h-4 w-4 ${testing ? "animate-spin" : ""}`} />
                {testing ? "Testing..." : "Test SMTP Connection"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>

          {/* Connection test result banner */}
          {testResult && (
            <div
              className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${
                testResult.success
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10"
                  : "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/10"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              )}
              <div>
                <p className={`text-sm font-semibold ${testResult.success ? "text-emerald-800 dark:text-emerald-200" : "text-rose-800 dark:text-rose-200"}`}>
                  {testResult.success ? "SMTP Connection Verified" : "Connection Failed"}
                </p>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{testResult.message}</p>
                {testResult.latency && (
                  <p className="mt-1 text-xs text-gray-400">Latency: {testResult.latency}ms</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: SMTP Server */}
        {activeTab === "smtp" && (
          <form onSubmit={handleSave} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
            <h4 className="mb-5 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
              <Server className="h-4 w-4 text-blue-500" />
              SMTP Server Settings
            </h4>
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Service Preset */}
              <div>
                <label className={labelCls}>Email Service</label>
                <select
                  className={inputCls}
                  value={config.service}
                  onChange={(e) => handleServiceChange(e.target.value)}
                >
                  {Object.keys(SERVICE_PRESETS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">Selecting a preset fills in the server address and port.</p>
              </div>

              {/* Secure */}
              <div>
                <label className={labelCls}>Encryption</label>
                <select
                  className={inputCls}
                  value={config.secure ? "ssl" : config.port === 465 ? "ssl" : "tls"}
                  onChange={(e) => {
                    const ssl = e.target.value === "ssl";
                    setConfig((prev) => ({ ...prev, secure: ssl, port: ssl ? 465 : 587 }));
                  }}
                >
                  <option value="tls">STARTTLS (Port 587)</option>
                  <option value="ssl">SSL/TLS (Port 465)</option>
                </select>
              </div>

              {/* Host */}
              <div>
                <label className={labelCls}>SMTP Host</label>
                <input
                  type="text"
                  className={inputCls}
                  value={config.host}
                  onChange={(e) => setConfig((prev) => ({ ...prev, host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                />
              </div>

              {/* Port */}
              <div>
                <label className={labelCls}>SMTP Port</label>
                <input
                  type="number"
                  className={inputCls}
                  value={config.port}
                  onChange={(e) => setConfig((prev) => ({ ...prev, port: parseInt(e.target.value, 10) || 587 }))}
                />
              </div>

              {/* Username */}
              <div>
                <label className={labelCls}>Username / Email Account</label>
                <input
                  type="email"
                  className={inputCls}
                  value={config.user}
                  onChange={(e) => setConfig((prev) => ({ ...prev, user: e.target.value }))}
                  placeholder="your@gmail.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className={labelCls}>
                  <Lock className="mr-1 inline h-3 w-3" />
                  Password / App Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className={`${inputCls} pr-10`}
                    value={config.pass || ""}
                    onChange={(e) => setConfig((prev) => ({ ...prev, pass: e.target.value }))}
                    placeholder="Leave blank to keep current password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  For Gmail: generate an App Password from your Google Account security settings.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {saving ? "Saving..." : "Save SMTP Settings"}
              </button>
            </div>
          </form>
        )}

        {/* Tab: Sender Identity */}
        {activeTab === "sender" && (
          <form onSubmit={handleSave} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
            <h4 className="mb-5 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
              <Mail className="h-4 w-4 text-blue-500" />
              Sender Identity
            </h4>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Sender Display Name</label>
                <input
                  type="text"
                  className={inputCls}
                  value={config.fromName}
                  onChange={(e) => setConfig((prev) => ({ ...prev, fromName: e.target.value }))}
                  placeholder="FDRMC Early Warning & Comms"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  This name appears in the recipient's inbox (e.g. "FDRMC Early Warning &lt;…&gt;").
                </p>
              </div>
              <div>
                <label className={labelCls}>From Email Address</label>
                <input
                  type="email"
                  className={inputCls}
                  value={config.fromEmail}
                  onChange={(e) => setConfig((prev) => ({ ...prev, fromEmail: e.target.value }))}
                  placeholder="alerts@fdrmc.gov.et"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Reply-To Address <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                <input
                  type="email"
                  className={inputCls}
                  value={config.replyTo || ""}
                  onChange={(e) => setConfig((prev) => ({ ...prev, replyTo: e.target.value }))}
                  placeholder="noreply@fdrmc.gov.et"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  When recipients click Reply, this address will receive the response.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Identity Settings"}
              </button>
            </div>
          </form>
        )}

        {/* Tab: Features */}
        {activeTab === "features" && (
          <form onSubmit={handleSave} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
            <h4 className="mb-5 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
              <Bell className="h-4 w-4 text-blue-500" />
              Email Features & Delivery Channels
            </h4>
            <div className="space-y-4">
              {(
                [
                  {
                    key: "enableOtp",
                    title: "OTP / Verification Emails",
                    desc: "Send One-Time Passwords and account verification codes via email for user login and registration.",
                    color: "blue",
                  },
                  {
                    key: "enableAlertBroadcast",
                    title: "Alert Subscription Broadcasts",
                    desc: "Allow this gateway to deliver emergency alerts (floods, earthquakes, drought, etc.) to subscribed users by email.",
                    color: "amber",
                  },
                  {
                    key: "isActive",
                    title: "Gateway Active",
                    desc: "Globally enable or disable this email gateway. When off, no emails will be sent from the system.",
                    color: "emerald",
                  },
                ] as { key: keyof EmailConfig; title: string; desc: string; color: string }[]
              ).map((feat) => (
                <label
                  key={feat.key}
                  htmlFor={`feat-${feat.key}`}
                  className="flex cursor-pointer items-start gap-4 rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                >
                  <div className="relative mt-0.5">
                    <input
                      id={`feat-${feat.key}`}
                      type="checkbox"
                      className="peer sr-only"
                      checked={!!config[feat.key]}
                      onChange={(e) => setConfig((prev) => ({ ...prev, [feat.key]: e.target.checked }))}
                    />
                    <div className={`h-6 w-11 rounded-full border-2 border-gray-200 bg-gray-100 transition peer-checked:border-${feat.color}-500 peer-checked:bg-${feat.color}-500 dark:border-gray-700 dark:bg-gray-800`} />
                    <div className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{feat.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{feat.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Feature Settings"}
              </button>
            </div>
          </form>
        )}

        {/* Tab: Test & Send */}
        {activeTab === "test" && (
          <div className="space-y-5">
            {/* SMTP Connection Test */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
              <h4 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                SMTP Connection Test
              </h4>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Verifies SMTP credentials by establishing a connection to <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">{config.host}:{config.port}</code> and authenticating with the configured account.
              </p>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${testing ? "animate-spin" : ""}`} />
                {testing ? "Testing SMTP Connection..." : "Run Connection Test"}
              </button>

              {testResult && (
                <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${testResult.success ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10" : "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/10"}`}>
                  {testResult.success ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-600" />}
                  <div>
                    <p className={`text-sm font-semibold ${testResult.success ? "text-emerald-800 dark:text-emerald-200" : "text-rose-800 dark:text-rose-200"}`}>
                      {testResult.success ? "Connection Verified" : "Connection Failed"}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{testResult.message}</p>
                    {testResult.latency && <p className="mt-1 text-xs text-gray-400">Latency: {testResult.latency}ms</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Send Test Email */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
              <h4 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                <Send className="h-4 w-4 text-blue-500" />
                Send Test Email
              </h4>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Recipient Email Address</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="admin@fdrmc.gov.et"
                  />
                </div>
                <div>
                  <label className={labelCls}>Test Message <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                  <textarea
                    className={`${inputCls} min-h-[80px] resize-none`}
                    value={testMsg}
                    onChange={(e) => setTestMsg(e.target.value)}
                    rows={3}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTest || !testEmail}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 disabled:opacity-50"
                >
                  {sendingTest ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sendingTest ? "Sending..." : "Send Test Email"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
