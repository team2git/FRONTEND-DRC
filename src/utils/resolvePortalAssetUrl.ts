import api from "@/api/axios";

export const resolvePortalAssetUrl = (value?: string) => {
  if (!value) return value;
  if (value.startsWith("data:")) return value;

  // If the stored URL contains '/uploads/', ensure it is prefixed with '/api/uploads/'
  // so Nginx's location /api/ rule forwards the GET request to the Node backend
  if (value.includes("/uploads/")) {
    const uploadsPath = value.substring(value.indexOf("/uploads/"));
    const apiUploadsPath = uploadsPath.startsWith("/api/uploads/")
      ? uploadsPath
      : `/api${uploadsPath}`;

    const apiBase = api.defaults.baseURL || "";
    if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
      const origin = apiBase.replace(/\/api\/?$/, "");
      return `${origin}${apiUploadsPath}`;
    }
    return apiUploadsPath;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return value;
};
