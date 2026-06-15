import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import {
  emergencyContactService,
  type EmergencyContact,
} from "../../api/emergencyContactService";

type ContactFormState = {
  title: string;
  description: string;
  phoneNumber: string;
  alternatePhoneNumber: string;
  iconKey: EmergencyContact["iconKey"];
  accentColor: string;
  directoryType: EmergencyContact["directoryType"];
  regions: string;
  addressLine: string;
  availabilityText: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: ContactFormState = {
  title: "",
  description: "",
  phoneNumber: "",
  alternatePhoneNumber: "",
  iconKey: "phone",
  accentColor: "#D7000F",
  directoryType: "national",
  regions: "",
  addressLine: "",
  availabilityText: "24/7 response line",
  sortOrder: "0",
  isActive: true,
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-red-500/40 dark:focus:ring-red-500/10";

const parseRegions = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toFormState = (contact?: EmergencyContact): ContactFormState => {
  if (!contact) return emptyForm;
  return {
    title: contact.title || "",
    description: contact.description || "",
    phoneNumber: contact.phoneNumber || "",
    alternatePhoneNumber: contact.alternatePhoneNumber || "",
    iconKey: contact.iconKey || "phone",
    accentColor: contact.accentColor || "#D7000F",
    directoryType: contact.directoryType || "national",
    regions: (contact.regions || []).join(", "),
    addressLine: contact.addressLine || "",
    availabilityText: contact.availabilityText || "24/7 response line",
    sortOrder: String(contact.sortOrder ?? 0),
    isActive: contact.isActive !== false,
  };
};

const iconLabel: Record<EmergencyContact["iconKey"], string> = {
  phone: "General line",
  police: "Police",
  fire: "Fire",
  hospital: "Hospital",
};

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ContactFormState>(emptyForm);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await emergencyContactService.list(searchTerm.trim(), regionFilter);
      setContacts(response.contacts || []);
      setAvailableRegions(response.availableRegions || []);
    } catch (error) {
      console.error("Failed to load emergency contacts", error);
      toast.error("Failed to load emergency contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (regionFilter) {
        const matchesRegion =
          contact.directoryType === "national" ||
          (contact.regions || []).some((region) => region.toLowerCase() === regionFilter.toLowerCase());
        if (!matchesRegion) return false;
      }

      if (!term) return true;
      const haystack = [
        contact.title,
        contact.description,
        contact.phoneNumber,
        contact.alternatePhoneNumber,
        contact.addressLine,
        contact.availabilityText,
        ...(contact.regions || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [contacts, regionFilter, searchTerm]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (contact: EmergencyContact) => {
    setEditingId(contact._id);
    setForm(toFormState(contact));
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      phoneNumber: form.phoneNumber.trim(),
      alternatePhoneNumber: form.alternatePhoneNumber.trim(),
      iconKey: form.iconKey,
      accentColor: form.accentColor.trim() || "#D7000F",
      directoryType: form.directoryType,
      regions: parseRegions(form.regions),
      addressLine: form.addressLine.trim(),
      availabilityText: form.availabilityText.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        const updated = await emergencyContactService.update(editingId, payload);
        setContacts((prev) => prev.map((item) => (item._id === editingId ? updated : item)));
        toast.success("Emergency contact updated");
      } else {
        const created = await emergencyContactService.create(payload);
        setContacts((prev) => [...prev, created].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
        toast.success("Emergency contact created");
      }
      closeForm();
      const refresh = await emergencyContactService.list();
      setContacts(refresh.contacts || []);
      setAvailableRegions(refresh.availableRegions || []);
    } catch (error) {
      console.error("Failed to save emergency contact", error);
      toast.error("Failed to save emergency contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact: EmergencyContact) => {
    const confirmed = window.confirm(`Delete ${contact.title}?`);
    if (!confirmed) return;

    try {
      await emergencyContactService.remove(contact._id);
      setContacts((prev) => prev.filter((item) => item._id !== contact._id));
      toast.success("Emergency contact deleted");
    } catch (error) {
      console.error("Failed to delete emergency contact", error);
      toast.error("Failed to delete emergency contact");
    }
  };

  return (
    <>
      <PageMeta
        title="Emergency Contacts | IDRMIS"
        description="Manage emergency contact directory entries"
      />
      <PageBreadcrumb pageTitle="Emergency Contact Directory" />

      <div className="space-y-6">
        <div className="rounded-[28px] border border-gray-200 bg-white px-5 py-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Emergency Contact Directory
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Manage the contacts shown on the public portal emergency directory page.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="sm" variant="outline" onClick={loadContacts}>
                Refresh
              </Button>
              <Button size="sm" onClick={openCreateForm} startIcon={<Plus className="h-4 w-4" />}>
                Add contact
              </Button>
            </div>
          </div>
        </div>

        {showForm ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingId ? "Edit contact" : "Add new contact"}
                </h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configure what responders and visitors will see on the public page.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Contact title
                </label>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Police"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Primary number
                </label>
                <input
                  className={inputClass}
                  value={form.phoneNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="911"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Alternate number
                </label>
                <input
                  className={inputClass}
                  value={form.alternatePhoneNumber}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, alternatePhoneNumber: e.target.value }))
                  }
                  placeholder="+251..."
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Icon
                </label>
                <select
                  className={inputClass}
                  value={form.iconKey}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      iconKey: e.target.value as EmergencyContact["iconKey"],
                    }))
                  }
                >
                  {Object.entries(iconLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Directory scope
                </label>
                <select
                  className={inputClass}
                  value={form.directoryType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      directoryType: e.target.value as EmergencyContact["directoryType"],
                    }))
                  }
                >
                  <option value="national">National</option>
                  <option value="regional">Regional</option>
                  <option value="local">Local</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Accent color
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 dark:border-gray-700">
                  <input
                    type="color"
                    className="h-10 w-14 rounded-lg border-0 bg-transparent p-0"
                    value={form.accentColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, accentColor: e.target.value }))}
                  />
                  <input
                    className="w-full bg-transparent text-sm text-gray-800 outline-none dark:text-white/90"
                    value={form.accentColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, accentColor: e.target.value }))}
                  />
                </div>
              </div>
              <div className="md:col-span-2 xl:col-span-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Description
                </label>
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Immediate police dispatch and security support."
                />
              </div>
              <div className="md:col-span-2 xl:col-span-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Regions
                </label>
                <input
                  className={inputClass}
                  value={form.regions}
                  onChange={(e) => setForm((prev) => ({ ...prev, regions: e.target.value }))}
                  placeholder="Addis Ababa, Oromia, Amhara"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Separate multiple regions with commas. Leave blank for nationwide coverage.
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Address or office
                </label>
                <input
                  className={inputClass}
                  value={form.addressLine}
                  onChange={(e) => setForm((prev) => ({ ...prev, addressLine: e.target.value }))}
                  placeholder="Head Office, Addis Ababa"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Availability label
                </label>
                <input
                  className={inputClass}
                  value={form.availabilityText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, availabilityText: e.target.value }))
                  }
                  placeholder="24/7 response line"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Sort order
                </label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active on public directory
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update contact" : "Create contact"}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contact name, number, or address"
                className={`${inputClass} min-w-[260px]`}
              />
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className={`${inputClass} min-w-[200px]`}
              >
                <option value="">All regions</option>
                {availableRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredContacts.length} contact{filteredContacts.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Numbers
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Scope
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Regions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                    Availability
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      Loading emergency contacts...
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      No emergency contacts found.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr
                      key={contact._id}
                      className="border-b border-gray-100 align-top transition hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-gray-900/30"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <span
                            className="mt-0.5 h-3 w-3 rounded-full"
                            style={{ backgroundColor: contact.accentColor || "#D7000F" }}
                          />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {contact.title}
                            </div>
                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {contact.description || "No description provided"}
                            </div>
                            <div className="mt-2 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {contact.isActive ? "Visible" : "Hidden"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-semibold">{contact.phoneNumber}</div>
                        <div className="mt-1 text-gray-500 dark:text-gray-400">
                          {contact.alternatePhoneNumber || "No alternate line"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm capitalize text-gray-700 dark:text-gray-300">
                        {contact.directoryType}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {(contact.regions || []).length > 0
                          ? (contact.regions || []).join(", ")
                          : "All regions"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div>{contact.availabilityText || "24/7 response line"}</div>
                        <div className="mt-1 text-gray-500 dark:text-gray-400">
                          {contact.addressLine || "No location note"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditForm(contact)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(contact)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
