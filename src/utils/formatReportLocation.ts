type ReportLocation = {
  addressLine?: string;
  city?: string;
  subCity?: string;
  woreda?: string;
  placeName?: string;
  region?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
};

const formatCoordinate = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "";

export const formatReportLocation = (location?: ReportLocation) => {
  const latitude = formatCoordinate(location?.latitude);
  const longitude = formatCoordinate(location?.longitude);
  if (latitude && longitude) {
    const locationParts = [
      `GPS: ${latitude}, ${longitude}`,
      location?.subCity,
      location?.woreda,
      location?.placeName,
    ].filter(Boolean);
    return locationParts.join(", ");
  }

  const fallbackParts = [location?.subCity, location?.woreda, location?.placeName].filter(Boolean);
  if (fallbackParts.length > 0) {
    return fallbackParts.join(", ");
  }

  return "N/A";
};

export type { ReportLocation };
