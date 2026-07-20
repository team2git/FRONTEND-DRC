/**
 * Addis Ababa Sub-City GeoJSON Boundary Data
 * Improved polygon boundaries for the 11 sub-cities of Addis Ababa
 * Coordinates are more accurate representations based on known geographic references
 */

export interface SubCityFeature {
    type: 'Feature';
    properties: {
        name: string;
        id: string;
    };
    geometry: {
        type: 'Polygon';
        coordinates: number[][][];
    };
}

export interface AddisAbabaGeoJSON {
    type: 'FeatureCollection';
    features: SubCityFeature[];
}

export const ADDIS_ABABA_CENTER: [number, number] = [9.020, 38.748];
export const ADDIS_ABABA_ZOOM = 12;

export const ADDIS_ABABA_BOUNDS: [[number, number], [number, number]] = [
    [8.85, 38.63],
    [9.12, 38.90]
];

/**
 * Improved Addis Ababa sub-city boundaries
 * Based on the official 11 sub-cities layout:
 * Northern: Gullele, Arada, Yeka
 * Central: Addis Ketema, Lideta, Kirkos, Bole
 * Southern: Kolfe Keranio, Nifas Silk-Lafto, Akaki Kality, Lemi Kura
 */
export const addisAbabaGeoData: AddisAbabaGeoJSON = {
    type: 'FeatureCollection',
    features: [
        {
            // Arada - Central-North, includes Piazza, Arat Kilo, Sidist Kilo areas
            type: 'Feature',
            properties: { name: 'Arada', id: 'arada' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.7340, 9.0200],
                    [38.7380, 9.0250],
                    [38.7430, 9.0330],
                    [38.7490, 9.0380],
                    [38.7560, 9.0400],
                    [38.7610, 9.0370],
                    [38.7620, 9.0300],
                    [38.7590, 9.0240],
                    [38.7540, 9.0190],
                    [38.7480, 9.0170],
                    [38.7420, 9.0160],
                    [38.7360, 9.0165],
                    [38.7320, 9.0185],
                    [38.7340, 9.0200]
                ]]
            }
        },
        {
            // Addis Ketema - West-Central, includes Mercato area
            type: 'Feature',
            properties: { name: 'Addis Ketema', id: 'addis-ketema' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.7060, 9.0210],
                    [38.7140, 9.0280],
                    [38.7220, 9.0310],
                    [38.7320, 9.0300],
                    [38.7380, 9.0250],
                    [38.7340, 9.0200],
                    [38.7320, 9.0185],
                    [38.7280, 9.0140],
                    [38.7230, 9.0100],
                    [38.7160, 9.0075],
                    [38.7090, 9.0090],
                    [38.7045, 9.0150],
                    [38.7060, 9.0210]
                ]]
            }
        },
        {
            // Lideta - West, includes Lideta, Mexico area
            type: 'Feature',
            properties: { name: 'Lideta', id: 'lideta' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.7090, 9.0090],
                    [38.7160, 9.0075],
                    [38.7230, 9.0100],
                    [38.7280, 9.0140],
                    [38.7320, 9.0185],
                    [38.7360, 9.0165],
                    [38.7350, 9.0095],
                    [38.7300, 9.0010],
                    [38.7250, 8.9965],
                    [38.7180, 8.9950],
                    [38.7110, 8.9970],
                    [38.7065, 9.0030],
                    [38.7090, 9.0090]
                ]]
            }
        },
        {
            // Kirkos - Central, includes Kazanchis, Stadium area
            type: 'Feature',
            properties: { name: 'Kirkos', id: 'kirkos' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.7420, 9.0160],
                    [38.7480, 9.0170],
                    [38.7540, 9.0190],
                    [38.7590, 9.0240],
                    [38.7620, 9.0300],
                    [38.7680, 9.0250],
                    [38.7700, 9.0170],
                    [38.7680, 9.0095],
                    [38.7620, 9.0020],
                    [38.7550, 8.9970],
                    [38.7480, 8.9960],
                    [38.7420, 8.9990],
                    [38.7380, 9.0060],
                    [38.7360, 9.0095],
                    [38.7360, 9.0165],
                    [38.7420, 9.0160]
                ]]
            }
        },
        {
            // Bole - East-Central, includes Bole International Airport area
            type: 'Feature',
            properties: { name: 'Bole', id: 'bole' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.7680, 9.0250],
                    [38.7700, 9.0170],
                    [38.7680, 9.0095],
                    [38.7700, 9.0040],
                    [38.7740, 9.0100],
                    [38.7800, 9.0170],
                    [38.7900, 9.0220],
                    [38.8050, 9.0250],
                    [38.8200, 9.0150],
                    [38.8250, 9.0020],
                    [38.8200, 8.9840],
                    [38.8100, 8.9720],
                    [38.7950, 8.9680],
                    [38.7800, 8.9700],
                    [38.7680, 8.9780],
                    [38.7600, 8.9870],
                    [38.7570, 8.9950],
                    [38.7620, 9.0020],
                    [38.7680, 9.0095],
                    [38.7700, 9.0170],
                    [38.7680, 9.0250]
                ]]
            }
        },
        {
            // Yeka - North-East, includes CMC, Mekanisa, Akaki areas (north)
            type: 'Feature',
            properties: { name: 'Yeka', id: 'yeka' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.7560, 9.0400],
                    [38.7610, 9.0370],
                    [38.7620, 9.0300],
                    [38.7680, 9.0250],
                    [38.7800, 9.0170],
                    [38.7900, 9.0220],
                    [38.8050, 9.0250],
                    [38.8180, 9.0380],
                    [38.8280, 9.0490],
                    [38.8350, 9.0580],
                    [38.8280, 9.0680],
                    [38.8150, 9.0720],
                    [38.7980, 9.0700],
                    [38.7820, 9.0620],
                    [38.7700, 9.0520],
                    [38.7610, 9.0450],
                    [38.7560, 9.0400]
                ]]
            }
        },
        {
            // Gullele - North, includes Entoto Hill area
            type: 'Feature',
            properties: { name: 'Gullele', id: 'gullele' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.7050, 9.0390],
                    [38.7120, 9.0490],
                    [38.7200, 9.0580],
                    [38.7310, 9.0660],
                    [38.7420, 9.0720],
                    [38.7560, 9.0740],
                    [38.7660, 9.0680],
                    [38.7700, 9.0560],
                    [38.7700, 9.0520],
                    [38.7560, 9.0400],
                    [38.7490, 9.0380],
                    [38.7430, 9.0330],
                    [38.7380, 9.0250],
                    [38.7320, 9.0300],
                    [38.7220, 9.0310],
                    [38.7140, 9.0280],
                    [38.7070, 9.0320],
                    [38.7050, 9.0390]
                ]]
            }
        },
        {
            // Kolfe Keranio - West, includes Kality and western industrial zone
            type: 'Feature',
            properties: { name: 'Kolfe Keranio', id: 'kolfe-keranio' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.6600, 9.0120],
                    [38.6700, 9.0250],
                    [38.6800, 9.0340],
                    [38.6920, 9.0390],
                    [38.7050, 9.0390],
                    [38.7070, 9.0320],
                    [38.7140, 9.0280],
                    [38.7060, 9.0210],
                    [38.7045, 9.0150],
                    [38.7090, 9.0090],
                    [38.7065, 9.0030],
                    [38.7020, 8.9960],
                    [38.6930, 8.9910],
                    [38.6820, 8.9920],
                    [38.6720, 8.9970],
                    [38.6640, 9.0040],
                    [38.6600, 9.0120]
                ]]
            }
        },
        {
            // Nifas Silk Lafto - South-West, includes Lafto area
            type: 'Feature',
            properties: { name: 'Nifas Silk Lafto', id: 'nifas-silk-lafto' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.7020, 8.9960],
                    [38.7065, 9.0030],
                    [38.7110, 8.9970],
                    [38.7180, 8.9950],
                    [38.7250, 8.9965],
                    [38.7300, 9.0010],
                    [38.7350, 9.0095],
                    [38.7360, 9.0165],
                    [38.7360, 9.0095],
                    [38.7380, 9.0060],
                    [38.7420, 8.9990],
                    [38.7480, 8.9960],
                    [38.7550, 8.9970],
                    [38.7570, 8.9950],
                    [38.7560, 8.9830],
                    [38.7480, 8.9700],
                    [38.7360, 8.9620],
                    [38.7220, 8.9600],
                    [38.7110, 8.9640],
                    [38.7020, 8.9720],
                    [38.6970, 8.9830],
                    [38.7020, 8.9960]
                ]]
            }
        },
        {
            // Akaki Kality - South, largest sub-city, industrial/Kality prison area
            type: 'Feature',
            properties: { name: 'Akaki Kality', id: 'akaki-kality' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.7220, 8.9600],
                    [38.7360, 8.9620],
                    [38.7480, 8.9700],
                    [38.7560, 8.9830],
                    [38.7600, 8.9870],
                    [38.7680, 8.9780],
                    [38.7800, 8.9700],
                    [38.7950, 8.9680],
                    [38.8100, 8.9720],
                    [38.8150, 8.9620],
                    [38.8120, 8.9480],
                    [38.8050, 8.9320],
                    [38.7900, 8.9150],
                    [38.7720, 8.9060],
                    [38.7530, 8.9050],
                    [38.7360, 8.9130],
                    [38.7220, 8.9280],
                    [38.7150, 8.9450],
                    [38.7170, 8.9560],
                    [38.7220, 8.9600]
                ]]
            }
        },
        {
            // Lemi Kura - East, newest sub-city (split from Bole)
            type: 'Feature',
            properties: { name: 'Lemi Kura', id: 'lemi-kura' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.8050, 9.0250],
                    [38.8200, 9.0150],
                    [38.8250, 9.0020],
                    [38.8300, 8.9920],
                    [38.8380, 8.9860],
                    [38.8450, 8.9760],
                    [38.8400, 8.9650],
                    [38.8300, 8.9590],
                    [38.8200, 8.9570],
                    [38.8100, 8.9620],
                    [38.8050, 8.9720],
                    [38.8100, 8.9720],
                    [38.8200, 8.9840],
                    [38.8250, 9.0020],
                    [38.8200, 9.0150],
                    [38.8050, 9.0250]
                ]]
            }
        }
    ]
};

/**
 * Risk level color configuration
 * Maps risk score ranges to colors for the choropleth map
 */
export const RISK_LEVELS = [
    { min: 0, max: 2, label: 'Very Low', color: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
    { min: 2, max: 4, label: 'Low', color: '#34d399', bgClass: 'bg-emerald-400', textClass: 'text-emerald-500' },
    { min: 4, max: 5.5, label: 'Moderate', color: '#fbbf24', bgClass: 'bg-amber-400', textClass: 'text-amber-500' },
    { min: 5.5, max: 7, label: 'High', color: '#f97316', bgClass: 'bg-orange-500', textClass: 'text-orange-600' },
    { min: 7, max: 8.5, label: 'Very High', color: '#ef4444', bgClass: 'bg-rose-500', textClass: 'text-rose-600' },
    { min: 8.5, max: 10, label: 'Critical', color: '#991b1b', bgClass: 'bg-rose-900', textClass: 'text-rose-900' }
] as const;

export type RiskLevel = typeof RISK_LEVELS[number];

export const getRiskLevel = (score: number): RiskLevel => {
    for (const level of RISK_LEVELS) {
        if (score >= level.min && score < level.max) return level;
    }
    return RISK_LEVELS[RISK_LEVELS.length - 1];
};

export const getRiskColor = (score: number): string => {
    return getRiskLevel(score).color;
};
