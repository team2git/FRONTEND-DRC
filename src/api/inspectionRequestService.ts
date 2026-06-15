import api from "./axios";

export type InspectionStatus =
  | "Submitted"
  | "Under Review"
  | "Assigned"
  | "Scheduled"
  | "Completed"
  | "Rejected";

export type InspectionType =
  | "building_safety"
  | "fire_safety"
  | "electrical"
  | "sanitation"
  | "structural"
  | "occupancy"
  | "other";

export type InspectionRequest = {
  _id: string;
  trackingNumber: string;
  propertyAddress: string;
  inspectionType: InspectionType;
  inspectionTypeLabel: string;
  preferredDate: string;
  additionalNotes?: string;
  requesterName?: string;
  requesterPhone?: string;
  requesterEmail?: string;
  status: InspectionStatus;
  assignedInspector?: string;
  assignedInspectorContact?: string;
  certificateUrl?: string;
  adminNotes?: string;
  submittedFrom?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateInspectionPayload = {
  propertyAddress: string;
  inspectionType: InspectionType;
  preferredDate: string;
  additionalNotes?: string;
  requesterName?: string;
  requesterPhone?: string;
  requesterEmail?: string;
};

export const inspectionRequestService = {
  async createPublic(payload: CreateInspectionPayload) {
    const response = await api.post<{ message: string; request: InspectionRequest }>(
      "/inspection-requests/public",
      payload
    );
    return response.data;
  },

  async trackPublic(trackingNumber: string) {
    const response = await api.get<{ request: InspectionRequest }>(
      `/inspection-requests/public/track/${encodeURIComponent(trackingNumber)}`
    );
    return response.data.request;
  },

  async list(params?: { search?: string; status?: string; inspectionType?: string }) {
    const response = await api.get<{ requests: InspectionRequest[] }>("/inspection-requests", {
      params,
    });
    return response.data.requests;
  },

  async update(
    id: string,
    payload: Partial<
      Pick<
        InspectionRequest,
        | "status"
        | "assignedInspector"
        | "assignedInspectorContact"
        | "certificateUrl"
        | "adminNotes"
        | "preferredDate"
      >
    >
  ) {
    const response = await api.patch<{ message: string; request: InspectionRequest }>(
      `/inspection-requests/${id}`,
      payload
    );
    return response.data.request;
  },

  async uploadCertificate(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ url: string }>("/uploads/inspection-certificate", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.url;
  },
};
