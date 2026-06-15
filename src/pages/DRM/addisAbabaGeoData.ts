/**
 * Addis Ababa Sub-City GeoJSON Boundary Data
 * Approximate polygon boundaries for the 11 sub-cities of Addis Ababa
 * Used for choropleth risk visualization on the Strategic City Map
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

export const ADDIS_ABABA_CENTER: [number, number] = [9.015, 38.755];
export const ADDIS_ABABA_ZOOM = 12;

export const ADDIS_ABABA_BOUNDS: [[number, number], [number, number]] = [
    [8.84, 38.62],
    [9.11, 38.92]
];

export const addisAbabaGeoData: AddisAbabaGeoJSON = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: { name: 'Arada', id: 'arada' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.740, 9.030], [38.750, 9.035], [38.758, 9.040],
                    [38.762, 9.038], [38.760, 9.030], [38.755, 9.024],
                    [38.745, 9.022], [38.740, 9.025], [38.740, 9.030]
                ]]
            }
        },
        {
            type: 'Feature',
            properties: { name: 'Addis Ketema', id: 'addis-ketema' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.722, 9.025], [38.730, 9.032], [38.740, 9.030],
                    [38.740, 9.025], [38.745, 9.022], [38.740, 9.018],
                    [38.732, 9.016], [38.724, 9.018], [38.722, 9.025]
                ]]
            }
        },
        {
            type: 'Feature',
            properties: { name: 'Lideta', id: 'lideta' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.722, 9.025], [38.724, 9.018], [38.732, 9.016],
                    [38.735, 9.010], [38.730, 9.003], [38.722, 9.002],
                    [38.715, 9.008], [38.714, 9.018], [38.722, 9.025]
                ]]
            }
        },
        {
            type: 'Feature',
            properties: { name: 'Kirkos', id: 'kirkos' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.740, 9.018], [38.745, 9.022], [38.755, 9.024],
                    [38.760, 9.020], [38.758, 9.012], [38.752, 9.005],
                    [38.742, 9.002], [38.735, 9.010], [38.740, 9.018]
                ]]
            }
        },
        {
            type: 'Feature',
            properties: { name: 'Bole', id: 'bole' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.760, 9.020], [38.770, 9.025], [38.790, 9.020],
                    [38.810, 9.010], [38.815, 8.995], [38.800, 8.975],
                    [38.780, 8.970], [38.765, 8.980], [38.758, 8.995],
                    [38.752, 9.005], [38.758, 9.012], [38.760, 9.020]
                ]]
            }
        },
        {
            type: 'Feature',
            properties: { name: 'Yeka', id: 'yeka' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.758, 9.040], [38.770, 9.050], [38.790, 9.060],
                    [38.810, 9.055], [38.820, 9.040], [38.810, 9.025],
                    [38.790, 9.020], [38.770, 9.025], [38.762, 9.038],
                    [38.758, 9.040]
                ]]
            }
        },
        {
            type: 'Feature',
            properties: { name: 'Gullele', id: 'gullele' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.710, 9.045], [38.720, 9.060], [38.735, 9.070],
                    [38.750, 9.065], [38.758, 9.055], [38.758, 9.040],
                    [38.750, 9.035], [38.740, 9.030], [38.730, 9.032],
                    [38.720, 9.038], [38.710, 9.045]
                ]]
            }
        },
        {
            type: 'Feature',
            properties: { name: 'Kolfe Keranio', id: 'kolfe-keranio' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.670, 9.030], [38.680, 9.045], [38.695, 9.050],
                    [38.710, 9.045], [38.720, 9.038], [38.730, 9.032],
                    [38.722, 9.025], [38.714, 9.018], [38.700, 9.010],
                    [38.685, 9.012], [38.672, 9.020], [38.670, 9.030]
                ]]
            }
        },
        {
            type: 'Feature',
            properties: { name: 'Nifas Silk Lafto', id: 'nifas-silk-lafto' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.700, 9.010], [38.715, 9.008], [38.722, 9.002],
                    [38.730, 9.003], [38.742, 9.002], [38.752, 9.005],
                    [38.758, 8.995], [38.750, 8.978], [38.738, 8.960],
                    [38.720, 8.955], [38.705, 8.960], [38.695, 8.975],
                    [38.690, 8.990], [38.700, 9.010]
                ]]
            }
        },
        {
            type: 'Feature',
            properties: { name: 'Akaki Kality', id: 'akaki-kality' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.720, 8.955], [38.738, 8.960], [38.750, 8.978],
                    [38.765, 8.980], [38.780, 8.970], [38.790, 8.950],
                    [38.785, 8.920], [38.775, 8.900], [38.755, 8.890],
                    [38.735, 8.895], [38.720, 8.910], [38.715, 8.935],
                    [38.720, 8.955]
                ]]
            }
        },
        {
            type: 'Feature',
            properties: { name: 'Lemi Kura', id: 'lemi-kura' },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [38.800, 8.975], [38.815, 8.995], [38.830, 8.990],
                    [38.840, 8.975], [38.835, 8.955], [38.820, 8.940],
                    [38.800, 8.945], [38.790, 8.950], [38.800, 8.975]
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
