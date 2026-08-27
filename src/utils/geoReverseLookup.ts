import { addisAbabaGeoData } from "@/pages/DRM/addisAbabaGeoData";
import { type LocationHierarchyItem } from "@/api/locationService";

/**
 * Standard ray-casting Point-in-Polygon test.
 * point is [lng, lat] to match GeoJSON coordinates [lng, lat].
 */
export function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if coordinates [lat, lng] fall inside any Addis Ababa subcity polygon.
 */
export function findSubcityByCoordinates(lat: number, lng: number): string | null {
  const point: [number, number] = [lng, lat]; // GeoJSON uses [lng, lat]

  for (const feature of addisAbabaGeoData.features) {
    if (feature.geometry && feature.geometry.type === "Polygon") {
      const ring = feature.geometry.coordinates[0];
      if (ring && isPointInPolygon(point, ring)) {
        return feature.properties.name;
      }
    }
  }

  return null;
}

/**
 * Checks if coordinates are approximately within Addis Ababa metropolitan area bounds.
 */
export function isInsideAddisAbaba(lat: number, lng: number): boolean {
  return lat >= 8.75 && lat <= 9.20 && lng >= 38.55 && lng <= 39.05;
}

/**
 * Normalizes text for comparison (lowercase, removing spaces, hyphens, prefixes).
 */
export function normalizeName(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Known Addis Ababa neighbourhood to Subcity and Woreda mapping.
 */
const NEIGHBOURHOOD_WOREDA_MAP: Record<string, { subcity: string; woredaKeywords: string[] }> = {
  // Bole
  "atlas": { subcity: "Bole", woredaKeywords: ["01", "02", "1", "2"] },
  "olympia": { subcity: "Bole", woredaKeywords: ["01", "02", "1", "2"] },
  "rwanda": { subcity: "Bole", woredaKeywords: ["01", "02", "1", "2"] },
  "wollo sefer": { subcity: "Bole", woredaKeywords: ["01", "02", "1", "2"] },
  "22 mazoria": { subcity: "Bole", woredaKeywords: ["02", "03", "2", "3"] },
  "bole medhanealem": { subcity: "Bole", woredaKeywords: ["03", "04", "3", "4"] },
  "medhanialem": { subcity: "Bole", woredaKeywords: ["03", "04", "3", "4"] },
  "edna mall": { subcity: "Bole", woredaKeywords: ["03", "04", "3", "4"] },
  "friendship": { subcity: "Bole", woredaKeywords: ["03", "04", "3", "4"] },
  "brass": { subcity: "Bole", woredaKeywords: ["03", "04", "3", "4"] },
  "gerji": { subcity: "Bole", woredaKeywords: ["05", "06", "07", "5", "6", "7"] },
  "jackros": { subcity: "Bole", woredaKeywords: ["06", "07", "6", "7"] },
  "imperial": { subcity: "Bole", woredaKeywords: ["05", "06", "5", "6"] },
  "bulbula": { subcity: "Bole", woredaKeywords: ["08", "09", "8", "9"] },
  "goro": { subcity: "Bole", woredaKeywords: ["08", "09", "8", "9"] },

  // Kirkos
  "kazanchis": { subcity: "Kirkos", woredaKeywords: ["01", "02", "1", "2"] },
  "kasanchis": { subcity: "Kirkos", woredaKeywords: ["01", "02", "1", "2"] },
  "eca": { subcity: "Kirkos", woredaKeywords: ["01", "02", "1", "2"] },
  "bambis": { subcity: "Kirkos", woredaKeywords: ["01", "02", "1", "2"] },
  "meskel square": { subcity: "Kirkos", woredaKeywords: ["04", "05", "4", "5"] },
  "stadium": { subcity: "Kirkos", woredaKeywords: ["04", "05", "4", "5"] },
  "legehar": { subcity: "Kirkos", woredaKeywords: ["04", "05", "4", "5"] },
  "gotera": { subcity: "Kirkos", woredaKeywords: ["07", "08", "7", "8"] },
  "kera": { subcity: "Kirkos", woredaKeywords: ["07", "08", "7", "8"] },
  "beklobet": { subcity: "Kirkos", woredaKeywords: ["07", "08", "7", "8"] },
  "sarbet": { subcity: "Kirkos", woredaKeywords: ["09", "10", "9", "10"] },
  "mexico": { subcity: "Kirkos", woredaKeywords: ["09", "10", "9", "10"] },

  // Arada
  "piazza": { subcity: "Arada", woredaKeywords: ["01", "02", "1", "2"] },
  "piassa": { subcity: "Arada", woredaKeywords: ["01", "02", "1", "2"] },
  "de gaulle": { subcity: "Arada", woredaKeywords: ["01", "02", "1", "2"] },
  "churchill": { subcity: "Arada", woredaKeywords: ["01", "02", "1", "2"] },
  "arat kilo": { subcity: "Arada", woredaKeywords: ["03", "04", "3", "4"] },
  "sidist kilo": { subcity: "Arada", woredaKeywords: ["05", "06", "5", "6"] },
  "jan meda": { subcity: "Arada", woredaKeywords: ["07", "08", "7", "8"] },

  // Addis Ketema
  "mercato": { subcity: "Addis Ketema", woredaKeywords: ["01", "02", "1", "2"] },
  "merkato": { subcity: "Addis Ketema", woredaKeywords: ["01", "02", "1", "2"] },
  "autobus tera": { subcity: "Addis Ketema", woredaKeywords: ["03", "04", "3", "4"] },
  "sebategna": { subcity: "Addis Ketema", woredaKeywords: ["01", "02", "1", "2"] },
  "abenet": { subcity: "Addis Ketema", woredaKeywords: ["05", "06", "5", "6"] },

  // Yeka
  "megenagna": { subcity: "Yeka", woredaKeywords: ["01", "02", "1", "2"] },
  "lem hotel": { subcity: "Yeka", woredaKeywords: ["01", "02", "1", "2"] },
  "signal": { subcity: "Yeka", woredaKeywords: ["01", "02", "1", "2"] },
  "kotebe": { subcity: "Yeka", woredaKeywords: ["03", "04", "3", "4"] },
  "ferensay": { subcity: "Yeka", woredaKeywords: ["06", "07", "6", "7"] },
  "shola": { subcity: "Yeka", woredaKeywords: ["06", "07", "6", "7"] },

  // Gullele
  "shiro meda": { subcity: "Gullele", woredaKeywords: ["01", "02", "1", "2"] },
  "entoto": { subcity: "Gullele", woredaKeywords: ["01", "02", "1", "2"] },
  "kechene": { subcity: "Gullele", woredaKeywords: ["03", "04", "3", "4"] },
  "pasteur": { subcity: "Gullele", woredaKeywords: ["04", "05", "4", "5"] },
  "wingate": { subcity: "Gullele", woredaKeywords: ["05", "06", "5", "6"] },

  // Lideta
  "balcha": { subcity: "Lideta", woredaKeywords: ["01", "02", "1", "2"] },
  "abinet": { subcity: "Lideta", woredaKeywords: ["03", "04", "3", "4"] },
  "tor hailoch": { subcity: "Lideta", woredaKeywords: ["04", "05", "4", "5"] },
  "coca": { subcity: "Lideta", woredaKeywords: ["05", "06", "5", "6"] },

  // Nifas Silk-Lafto
  "saris": { subcity: "Nifas Silk-Lafto", woredaKeywords: ["01", "02", "1", "2"] },
  "jemo": { subcity: "Nifas Silk-Lafto", woredaKeywords: ["06", "07", "6", "7"] },
  "lebu": { subcity: "Nifas Silk-Lafto", woredaKeywords: ["06", "07", "6", "7"] },
  "lafto": { subcity: "Nifas Silk-Lafto", woredaKeywords: ["06", "07", "6", "7"] },
  "mekanisa": { subcity: "Nifas Silk-Lafto", woredaKeywords: ["09", "10", "9", "10"] },
  "bisrate gabriel": { subcity: "Nifas Silk-Lafto", woredaKeywords: ["09", "10", "9", "10"] },

  // Kolfe Keranio
  "ayer tena": { subcity: "Kolfe Keranio", woredaKeywords: ["04", "05", "4", "5"] },
  "bethel": { subcity: "Kolfe Keranio", woredaKeywords: ["04", "05", "4", "5"] },
  "zenebework": { subcity: "Kolfe Keranio", woredaKeywords: ["01", "02", "1", "2"] },
  "alert": { subcity: "Kolfe Keranio", woredaKeywords: ["07", "08", "7", "8"] },

  // Akaki Kality
  "kality": { subcity: "Akaki Kality", woredaKeywords: ["01", "02", "1", "2"] },
  "akaki": { subcity: "Akaki Kality", woredaKeywords: ["04", "05", "4", "5"] },
  "tulu dimtu": { subcity: "Akaki Kality", woredaKeywords: ["04", "05", "4", "5"] },
  "koye feche": { subcity: "Akaki Kality", woredaKeywords: ["05", "06", "5", "6"] },
  "kilinto": { subcity: "Akaki Kality", woredaKeywords: ["07", "08", "7", "8"] },

  // Lemi Kura
  "cmc": { subcity: "Lemi Kura", woredaKeywords: ["01", "02", "1", "2"] },
  "ayat": { subcity: "Lemi Kura", woredaKeywords: ["03", "04", "3", "4"] },
  "summit": { subcity: "Lemi Kura", woredaKeywords: ["01", "02", "1", "2"] },
  "tafo": { subcity: "Lemi Kura", woredaKeywords: ["04", "05", "4", "5"] },
};

/**
 * Fuzzy/exact match subcity name against database hierarchy.
 */
export function matchSubcity(
  candidate: string,
  hierarchy: LocationHierarchyItem[]
): LocationHierarchyItem | null {
  if (!candidate || !hierarchy?.length) return null;
  const normCandidate = normalizeName(candidate);

  // Exact or normalized match
  for (const item of hierarchy) {
    const normItem = normalizeName(item.name);
    if (normItem === normCandidate || normItem.includes(normCandidate) || normCandidate.includes(normItem)) {
      return item;
    }
  }

  // Handle special aliases
  const aliases: Record<string, string[]> = {
    "nifassilklafto": ["nifassilk", "lafto", "nifas", "nefassilk", "nifassilklafto"],
    "kolfekeranio": ["kolfe", "keranio", "kolfeqeranyo", "kolfekeranyo"],
    "addisketema": ["addis ketema", "mercato", "merkato", "addisketema"],
    "lemikura": ["lemi", "kura", "lemikura"],
    "akakikality": ["akaki", "kality", "kaliti", "akakikaliti", "akakikality"],
  };

  for (const item of hierarchy) {
    const normItem = normalizeName(item.name);
    const itemAliases = aliases[normItem] || [];
    if (itemAliases.some((alias) => normCandidate.includes(normalizeName(alias)))) {
      return item;
    }
  }

  return null;
}

/**
 * Spatial coordinate partitioning estimation for Woredas within a subcity polygon.
 */
export function estimateWoredaByCoordinates(
  lat: number,
  lng: number,
  subcityName: string,
  availableWoredas: Array<{ _id: string; name: string }>
): string | null {
  if (!availableWoredas || availableWoredas.length === 0) return null;
  if (availableWoredas.length === 1) return availableWoredas[0].name;

  const feature = addisAbabaGeoData.features.find(
    (f) => normalizeName(f.properties.name) === normalizeName(subcityName)
  );

  if (feature && feature.geometry && feature.geometry.type === "Polygon") {
    const coords = feature.geometry.coordinates[0];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of coords) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const normX = Math.max(0, Math.min(1, (lng - minX) / (maxX - minX || 0.001)));
    const normY = Math.max(0, Math.min(1, (lat - minY) / (maxY - minY || 0.001)));

    // Spatial diagonal projection across available woredas
    const factor = (normX + (1 - normY)) / 2;
    const idx = Math.min(availableWoredas.length - 1, Math.max(0, Math.floor(factor * availableWoredas.length)));
    return availableWoredas[idx]?.name || availableWoredas[0].name;
  }

  return availableWoredas[0].name;
}

/**
 * Extracts and matches woreda from address string or OpenStreetMap address tags against available woredas in subcity.
 */
export function matchWoreda(
  rawText: string,
  addressObj: Record<string, any>,
  availableWoredas: Array<{ _id: string; name: string }>,
  lat?: number,
  lng?: number,
  subcityName?: string
): string | null {
  if (!availableWoredas?.length) return null;

  const combinedSearchText = [
    rawText,
    addressObj.woreda,
    addressObj.subdistrict,
    addressObj.quarter,
    addressObj.neighbourhood,
    addressObj.residential,
    addressObj.suburb,
    addressObj.road,
    addressObj.amenity,
    addressObj.building,
  ]
    .filter(Boolean)
    .join(" ");

  const normCombined = normalizeName(combinedSearchText);

  // 1. Direct regex match for "Woreda 01", "Woreda 1", "W 01", "Kebele 01", etc.
  const woredaNumMatch = combinedSearchText.match(/(?:woreda|wereda|w\.|kebele)\s*(\d+)/i);
  if (woredaNumMatch) {
    const num = parseInt(woredaNumMatch[1], 10);
    const padded = num < 10 ? `0${num}` : `${num}`;

    const matched = availableWoredas.find((w) => {
      const match = w.name.match(/\d+/);
      return match && parseInt(match[0], 10) === num;
    });

    if (matched) return matched.name;

    const directName = availableWoredas.find(
      (w) => normalizeName(w.name) === `woreda${padded}` || normalizeName(w.name) === `woreda${num}`
    );
    if (directName) return directName.name;
  }

  // 2. Match against known Addis Ababa landmark & neighbourhood map
  for (const [key, mapping] of Object.entries(NEIGHBOURHOOD_WOREDA_MAP)) {
    if (normCombined.includes(normalizeName(key))) {
      // Find matching woreda in available woredas
      for (const kw of mapping.woredaKeywords) {
        const found = availableWoredas.find((w) => {
          const match = w.name.match(/\d+/);
          return match && (match[0] === kw || parseInt(match[0], 10) === parseInt(kw, 10));
        });
        if (found) return found.name;
      }
    }
  }

  // 3. Direct name matching against all available woredas in this subcity
  for (const w of availableWoredas) {
    const normW = normalizeName(w.name);
    if (normW && normCombined.includes(normW)) {
      return w.name;
    }
  }

  // 4. Spatial / Coordinate partition fallback if coordinates & subcity are available
  if (typeof lat === "number" && typeof lng === "number" && subcityName) {
    return estimateWoredaByCoordinates(lat, lng, subcityName, availableWoredas);
  }

  return availableWoredas[0]?.name || null;
}

export interface ResolvedLocation {
  city: string;
  subCity: string;
  woreda: string;
  addressLine: string;
  placeName: string;
  country: string;
  displayName: string;
  matchedFromPolygon: boolean;
}

/**
 * Reverse lookup location given coordinates and the loaded location hierarchy.
 * Combines Point-in-Polygon spatial boundary matching + Nominatim reverse geocode + Woreda spatial estimation.
 */
export async function reverseLookupLocation(
  latStr: string,
  lngStr: string,
  hierarchy: LocationHierarchyItem[] = []
): Promise<ResolvedLocation> {
  const lat = Number(latStr);
  const lng = Number(lngStr);

  const result: ResolvedLocation = {
    city: "",
    subCity: "",
    woreda: "",
    addressLine: "",
    placeName: "",
    country: "Ethiopia",
    displayName: "",
    matchedFromPolygon: false,
  };

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return result;
  }

  // 1. Point-in-Polygon Spatial check for Subcity
  const polygonSubcity = findSubcityByCoordinates(lat, lng);
  if (polygonSubcity) {
    result.subCity = polygonSubcity;
    result.matchedFromPolygon = true;
    if (isInsideAddisAbaba(lat, lng)) {
      result.city = "Addis Ababa";
    }
  } else if (isInsideAddisAbaba(lat, lng)) {
    result.city = "Addis Ababa";
  }

  let rawOsmAddress: Record<string, any> = {};

  // 2. Query Nominatim for high-resolution address details
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      latStr
    )}&lon=${encodeURIComponent(lngStr)}&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      rawOsmAddress = data?.address || {};
      result.displayName = data?.display_name || "";

      // City detection
      const detectedCity =
        rawOsmAddress.city ||
        rawOsmAddress.town ||
        rawOsmAddress.municipality ||
        rawOsmAddress.city_district ||
        rawOsmAddress.state ||
        (isInsideAddisAbaba(lat, lng) ? "Addis Ababa" : "");

      if (detectedCity) {
        result.city = detectedCity;
      }

      // Country detection
      if (rawOsmAddress.country) {
        result.country = rawOsmAddress.country;
      }

      // Subcity candidate from OSM
      const osmSubcityCandidate =
        rawOsmAddress.suburb ||
        rawOsmAddress.city_district ||
        rawOsmAddress.district ||
        rawOsmAddress.county ||
        rawOsmAddress.borough ||
        "";

      let matchedHierarchySubcity = matchSubcity(result.subCity || osmSubcityCandidate, hierarchy);
      if (!matchedHierarchySubcity && osmSubcityCandidate) {
        matchedHierarchySubcity = matchSubcity(osmSubcityCandidate, hierarchy);
      }

      if (matchedHierarchySubcity) {
        result.subCity = matchedHierarchySubcity.name;
      }

      // Place / Street Landmark
      const placeCandidates = [
        rawOsmAddress.amenity,
        rawOsmAddress.building,
        rawOsmAddress.shop,
        rawOsmAddress.tourism,
        rawOsmAddress.historic,
        rawOsmAddress.leisure,
        rawOsmAddress.neighbourhood,
      ].filter(Boolean);

      if (placeCandidates.length > 0) {
        result.placeName = placeCandidates[0];
      }

      const streetCandidates = [
        rawOsmAddress.road,
        rawOsmAddress.pedestrian,
        rawOsmAddress.street,
        rawOsmAddress.neighbourhood,
        rawOsmAddress.suburb,
      ].filter(Boolean);

      if (streetCandidates.length > 0) {
        result.addressLine = streetCandidates.join(", ");
      } else if (result.displayName) {
        result.addressLine = result.displayName.split(",").slice(0, 3).join(",").trim();
      }
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode error or timeout, relying on spatial detection:", err);
  }

  // 3. Normalize subcity against loaded hierarchy
  if (result.subCity && hierarchy.length) {
    const found = hierarchy.find(
      (h) => normalizeName(h.name) === normalizeName(result.subCity)
    );
    if (found) {
      result.subCity = found.name;
    }
  }

  // 4. Resolve Woreda
  const targetSubcityItem = hierarchy.find(
    (item) => normalizeName(item.name) === normalizeName(result.subCity)
  );

  if (targetSubcityItem && targetSubcityItem.woredas?.length) {
    const matchedW = matchWoreda(
      result.displayName,
      rawOsmAddress,
      targetSubcityItem.woredas,
      lat,
      lng,
      result.subCity
    );
    if (matchedW) {
      result.woreda = matchedW;
    }
  }

  return result;
}
