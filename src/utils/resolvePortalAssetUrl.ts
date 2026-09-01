import api from "@/api/axios";

export const resolvePortalAssetUrl = (value?: string) => {
  if (!value) return value;
  if (value.startsWith("data:")) return value;

  const isBrowser = typeof window !== "undefined";
  const isRemoteClient =
    isBrowser &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  // If the stored URL contains '/uploads/', ensure it is prefixed with '/api/uploads/'
  // so Nginx's location /api/ rule forwards the GET request to the Node backend
  if (value.includes("/uploads/")) {
    const uploadsPath = value.substring(value.indexOf("/uploads/"));
    const apiUploadsPath = uploadsPath.startsWith("/api/uploads/")
      ? uploadsPath
      : `/api${uploadsPath}`;

    const apiBase = api.defaults.baseURL || "";

    // If client is on a remote Ubuntu server and apiBase is localhost or empty,
    // use the current server's origin so the client doesn't call their own localhost
    if (isRemoteClient && (apiBase.includes("localhost") || apiBase.includes("127.0.0.1") || !apiBase)) {
      return `${window.location.origin}${apiUploadsPath}`;
    }

    if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
      const origin = apiBase.replace(/\/api\/?$/, "");
      return `${origin}${apiUploadsPath}`;
    }
    return apiUploadsPath;
  }

  // If a full absolute localhost URL was saved in the database during local testing
  if (value.startsWith("http://") || value.startsWith("https://")) {
    if (isRemoteClient && (value.includes("localhost:") || value.includes("127.0.0.1:"))) {
      const pathPart = value.replace(/^https?:\/\/[^/]+/, "");
      return `${window.location.origin}${pathPart}`;
    }
    return value;
  }

  return value;
};
