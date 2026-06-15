import api from "@/api/axios";

const resolveBaseUrl = () => {
  const baseUrl = api.defaults.baseURL || "";
  return baseUrl.replace(/\/api\/?$/, "");
};

export const resolvePortalAssetUrl = (value?: string) => {
  if (!value) return value;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
    return value;
  }
  if (value.startsWith("/uploads/")) {
    return `${resolveBaseUrl()}${value}`;
  }
  return value;
};
