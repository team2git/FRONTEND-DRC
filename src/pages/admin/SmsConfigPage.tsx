import React, { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import api from "../../api/axios";
import { toast } from "react-toastify";
import {
  Server,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Phone,
  Sliders,
  HelpCircle,
  Eye,
  EyeOff,
} from "lucide-react";

type SmsConfig = {
  _id?: string;
  systemId: string;
  password?: string;
  host: string;
  port: number;
  protocol: string;
  systemType?: string;
  sourceAddr?: string;
  sourceAddrTon?: number;
  sourceAddrNpi?: number;
  destAddrTon?: number;
  destAddrNpi?: number;
  dataCoding?: number;
  enquireLinkIntervalMs?: number;
  reconnectIntervalMs?: number;
  isActive?: boolean;
  lastTestedAt?: string | null;
  lastTestStatus?: "success" | "failed" | "not_tested";
  lastTestMessage?: string;
};

export default function SmsConfigPage() {
  const [config, setConfig] = useState<SmsConfig>({
    systemId: "6524",
    password: "",
    host: "10.204.181.70",
    port: 5019,
    protocol: "SMPP3.4",
    systemType: "",
    sourceAddr: "IDRMIS",
    sourceAddrTon: 5,
    sourceAddrNpi: 0,
    destAddrTon: 1,
    destAddrNpi: 1,
    dataCoding: 0,
    enquireLinkIntervalMs: 30000,
    reconnectIntervalMs: 10000,
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    latency?: number;
  } | null>(null);

  // Show/Hide password toggle
  const [showPassword, setShowPassword] = useState(false);

  // Test SMS state
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Test emergency notification from IDRMIS SMPP 3.4 Gateway."
  );
  const [sendingTestSms, setSendingTestSms] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "advanced" | "test">("general");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get("/sms-config");
      if (response.data) {
        setConfig(response.data);
        if (response.data.lastTestStatus && response.data.lastTestStatus !== "not_tested") {
          setTestResult({
            success: response.data.lastTestStatus === "success",
            message: response.data.lastTestMessage || "Previous test recorded",
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to load SMS configuration", error);
      toast.error(error?.response?.data?.message || "Failed to load SMS configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.put("/sms-config", config);
      toast.success(response.data?.message || "SMS Gateway configuration saved successfully!");
      if (response.data?.config) {
        setConfig(response.data.config);
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error?.response?.data?.message || "Failed to save SMS configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const response = await api.post("/sms-config/test-connection", config);
      setTestResult(response.data);
      if (response.data.success) {
        toast.success(response.data.message || "Connected to SMSC successfully!");
      } else {
        toast.error(response.data.message || "Failed to connect to SMSC");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || "Connection test failed";
      setTestResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.warning("Please enter a recipient phone number");
      return;
    }
    setSendingTestSms(true);
    try {
      const response = await api.post("/sms-config/send-test-sms", {
        phone: testPhone,
        message: testMessage,
      });
      if (response.data?.success) {
        toast.success(response.data.message || `Test SMS sent to ${testPhone}`);
      } else {
        toast.error(response.data?.message || "Failed to send test SMS");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send test SMS");
    } finally {
      setSendingTestSms(false);
    }
  };

  return (
    <>
      <PageMeta
        title="SMS Gateway Configuration | IDRMIS"
        description="Configure SMPP 3.4 SMS Gateway, credentials, and test connectivity"
      />
      <PageBreadcrumb pageTitle="SMS Gateway Configuration" />

      <div className="space-y-6">
        {loading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-amber-500" />
            Loading SMS gateway configurations...
          </div>
        ) : null}

        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                <Radio className="h-7 w-7 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    SMS Gateway (SMPP 3.4)
                  </h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Protocol Active
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Configure direct telecom SMSC connectivity for early warning broadcasts and instant alert distribution.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 shadow-sm transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
              >
                <RefreshCw className={`h-4 w-4 ${testingConnection ? "animate-spin" : ""}`} />
                {testingConnection ? "Testing Connection..." : "Test SMSC Connection"}
              </button>
            </div>
          </div>

          {/* Connection Test Result Alert */}
          {testResult ? (
            <div
              className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm transition-all ${
                testResult.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <div className="flex-1">
                <div className="font-semibold">
                  {testResult.success ? "Connection Verified" : "Connection Failed"}
                </div>
                <div className="mt-0.5 text-xs opacity-90">{testResult.message}</div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
              activeTab === "general"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Server className="h-4 w-4" />
            Gateway Credentials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("advanced")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
              activeTab === "advanced"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Sliders className="h-4 w-4" />
            SMPP Addressing & Encoding
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("test")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
              activeTab === "test"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Send className="h-4 w-4" />
            Send Live Test SMS
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          {activeTab === "test" ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
              <div className="border-b border-gray-200 pb-4 dark:border-gray-800">
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  Send Test SMS Message
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Send a real-time test SMS via the configured SMPP 3.4 gateway to any phone number.
                </p>
              </div>

              <form onSubmit={handleSendTestSms} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Recipient Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="e.g. 0911223344 or 251911223344"
                      className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      required
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Format: Ethiopian local (09... / 07...) or international format (251...).
                  </p>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Message Content
                    </label>
                    <span className="text-[11px] text-gray-400">
                      {testMessage.length} / 160 chars
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={testMessage}
                    maxLength={160}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={sendingTestSms}
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600 disabled:opacity-60"
                  >
                    <Send className={`h-4 w-4 ${sendingTestSms ? "animate-bounce" : ""}`} />
                    {sendingTestSms ? "Transmitting SMS..." : "Send Test SMS Now"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <form
              onSubmit={handleSave}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-slate-950/40"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">
                    {activeTab === "general" ? "Connection & Authentication" : "SMPP PDU Addressing"}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activeTab === "general"
                      ? "Telecom SMSC gateway IP, port, system ID and bind credentials."
                      : "Type of Number (TON), Numbering Plan Indicator (NPI) and alphabet coding."}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>

              {activeTab === "general" ? (
                <div className="mt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        System ID (Username)
                      </label>
                      <input
                        type="text"
                        value={config.systemId}
                        onChange={(e) => setConfig({ ...config, systemId: e.target.value })}
                        placeholder="e.g. 6524"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                        >
                          {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={config.password || ""}
                          onChange={(e) => setConfig({ ...config, password: e.target.value })}
                          placeholder="Aacai$73"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        SMSC Host / IP Address
                      </label>
                      <input
                        type="text"
                        value={config.host}
                        onChange={(e) => setConfig({ ...config, host: e.target.value })}
                        placeholder="10.204.181.70"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        SMSC Port
                      </label>
                      <input
                        type="number"
                        value={config.port}
                        onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value, 10) || 5019 })}
                        placeholder="5019"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Protocol
                      </label>
                      <select
                        value={config.protocol}
                        onChange={(e) => setConfig({ ...config, protocol: e.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value="SMPP3.4">SMPP v3.4 (Standard Telecom)</option>
                        <option value="SMPP5.0">SMPP v5.0</option>
                        <option value="HTTP">HTTP Gateway</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Sender ID (Source Address)
                      </label>
                      <input
                        type="text"
                        value={config.sourceAddr || ""}
                        onChange={(e) => setConfig({ ...config, sourceAddr: e.target.value })}
                        placeholder="IDRMIS or 6524"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Source TON (Type of Number)
                      </label>
                      <select
                        value={config.sourceAddrTon ?? 5}
                        onChange={(e) => setConfig({ ...config, sourceAddrTon: parseInt(e.target.value, 10) })}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value={5}>5 - Alphanumeric (e.g. IDRMIS)</option>
                        <option value={1}>1 - International (e.g. 2519...)</option>
                        <option value={2}>2 - National</option>
                        <option value={0}>0 - Unknown</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Source NPI (Numbering Plan)
                      </label>
                      <select
                        value={config.sourceAddrNpi ?? 0}
                        onChange={(e) => setConfig({ ...config, sourceAddrNpi: parseInt(e.target.value, 10) })}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value={0}>0 - Unknown</option>
                        <option value={1}>1 - ISDN / E.164</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Destination TON
                      </label>
                      <select
                        value={config.destAddrTon ?? 1}
                        onChange={(e) => setConfig({ ...config, destAddrTon: parseInt(e.target.value, 10) })}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value={1}>1 - International (E.164)</option>
                        <option value={2}>2 - National</option>
                        <option value={0}>0 - Unknown</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Destination NPI
                      </label>
                      <select
                        value={config.destAddrNpi ?? 1}
                        onChange={(e) => setConfig({ ...config, destAddrNpi: parseInt(e.target.value, 10) })}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value={1}>1 - ISDN / E.164 (Recommended)</option>
                        <option value={0}>0 - Unknown</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Keepalive Interval (Enquire Link)
                      </label>
                      <input
                        type="number"
                        value={config.enquireLinkIntervalMs || 30000}
                        onChange={(e) => setConfig({ ...config, enquireLinkIntervalMs: parseInt(e.target.value, 10) })}
                        placeholder="30000"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-amber-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                      <p className="mt-1 text-[11px] text-gray-400">Time in milliseconds (default 30000ms = 30s)</p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        System Type
                      </label>
                      <input
                        type="text"
                        value={config.systemType || ""}
                        onChange={(e) => setConfig({ ...config, systemType: e.target.value })}
                        placeholder="Leave empty or SMSC identifier"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-amber-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Quick Help & Status Card */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-slate-950/40">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                SMPP Gateway Summary
              </h4>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                  <span className="text-gray-500">System ID:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{config.systemId}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                  <span className="text-gray-500">SMSC Host:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{config.host}:{config.port}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                  <span className="text-gray-500">Protocol:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{config.protocol}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                  <span className="text-gray-500">Sender ID:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{config.sourceAddr || "IDRMIS"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Unicode (UCS-2):</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Auto-detected (Amharic & English)</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <HelpCircle className="h-4 w-4" />
                <span>Alert Broadcast Tip</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/80">
                When sending SMS broadcasts to alert subscribers, the system automatically matches clients opted-in to the specific hazard category (e.g. Floods, Drought, Structural Fire) and routes messages through this SMPP 3.4 session.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
