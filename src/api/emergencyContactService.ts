import api from "./axios";

export type EmergencyContact = {
  _id: string;
  title: string;
  description?: string;
  phoneNumber: string;
  alternatePhoneNumber?: string;
  iconKey: "phone" | "police" | "fire" | "hospital";
  accentColor?: string;
  directoryType: "national" | "regional" | "local";
  regions?: string[];
  addressLine?: string;
  availabilityText?: string;
  sortOrder?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type EmergencyDirectoryResponse = {
  title: string;
  description: string;
  primaryAction: {
    label: string;
    href: string;
  };
  helperText: string;
  crisisText: string;
  region: string;
  availableRegions: string[];
  contacts: EmergencyContact[];
};

export const emergencyContactService = {
  async getPublicDirectory(region?: string) {
    const response = await api.get<EmergencyDirectoryResponse>("/emergency-contacts/public", {
      params: region ? { region } : undefined,
    });
    return response.data;
  },

  async list(search?: string, region?: string) {
    const response = await api.get<{ contacts: EmergencyContact[]; availableRegions: string[] }>(
      "/emergency-contacts",
      {
        params: {
          ...(search ? { search } : {}),
          ...(region ? { region } : {}),
        },
      }
    );
    return response.data;
  },

  async create(payload: Omit<EmergencyContact, "_id" | "createdAt" | "updatedAt">) {
    const response = await api.post<EmergencyContact>("/emergency-contacts", payload);
    return response.data;
  },

  async update(id: string, payload: Omit<EmergencyContact, "_id" | "createdAt" | "updatedAt">) {
    const response = await api.put<EmergencyContact>(`/emergency-contacts/${id}`, payload);
    return response.data;
  },

  async remove(id: string) {
    const response = await api.delete<{ message: string }>(`/emergency-contacts/${id}`);
    return response.data;
  },
};
