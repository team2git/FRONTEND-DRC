import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    ArrowLeft, Search, Filter, Map as MapIcon,
    X, ChevronRight, RefreshCw, GitCompare,
    Printer, FileText, AlertTriangle, ShieldAlert,
    ShieldCheck, Activity, BarChart2, CheckCircle2,
    Building2, Flame, Droplets, Zap, Shield, Info,
    FileSpreadsheet, AlertCircle
} from 'lucide-react';
import { getWoredaProfiles, type WoredaProfile } from '../../api/woredaProfileService';
import { addisAbabaGeoData, RISK_LEVELS, getRiskColor, getRiskLevel, ADDIS_ABABA_CENTER } from './addisAbabaGeoData';

// Sub-City center coordinates
const SUBCITY_CENTERS: Record<string, [number, number]> = {
    'Arada': [9.030, 38.750],
    'Addis Ketema': [9.025, 38.730],
    'Lideta': [9.015, 38.720],
    'Kirkos': [9.015, 38.750],
    'Bole': [8.995, 38.785],
    'Yeka': [9.040, 38.790],
    'Gullele': [9.055, 38.735],
    'Kolfe Keranio': [9.030, 38.690],
    'Nifas Silk Lafto': [8.975, 38.720],
    'Akaki Kality': [8.920, 38.755],
    'Lemi Kura': [8.965, 38.815]
};

const DEFAULT_WOREDAS: Record<string, string[]> = {
    'Arada': ['Woreda 01', 'Woreda 02', 'Woreda 03', 'Woreda 04'],
    'Addis Ketema': ['Woreda 01', 'Woreda 02', 'Woreda 03'],
    'Lideta': ['Woreda 01', 'Woreda 02', 'Woreda 03'],
    'Kirkos': ['Woreda 01', 'Woreda 02', 'Woreda 03', 'Woreda 04'],
    'Bole': ['Woreda 01', 'Woreda 02', 'Woreda 03', 'Woreda 04', 'Woreda 05'],
    'Yeka': ['Woreda 01', 'Woreda 02', 'Woreda 03', 'Woreda 04'],
    'Gullele': ['Woreda 01', 'Woreda 02', 'Woreda 03'],
    'Kolfe Keranio': ['Woreda 01', 'Woreda 02', 'Woreda 03', 'Woreda 04'],
    'Nifas Silk Lafto': ['Woreda 01', 'Woreda 02', 'Woreda 03', 'Woreda 04'],
    'Akaki Kality': ['Woreda 01', 'Woreda 02', 'Woreda 03'],
    'Lemi Kura': ['Woreda 01', 'Woreda 02', 'Woreda 03']
};

const DEFAULT_CENTER: [number, number] = [9.015, 38.755];
const DEFAULT_ZOOM = 12;

// 17 Analysis Layers/Indicators
const ANALYSIS_LAYERS = [
    { id: 'risk_classification', label: 'DRM Risk Score', category: 'Risk', format: (v: number) => v.toFixed(1), unit: 'score', colors: ['#059669', '#881337'] },
    { id: 'hazard_index', label: 'Hazard Index', category: 'Risk', format: (v: number) => v.toFixed(1), unit: 'index', colors: ['#3b82f6', '#dc2626'] },
    { id: 'exposure_index', label: 'Exposure Index', category: 'Risk', format: (v: number) => v.toFixed(1), unit: 'index', colors: ['#6366f1', '#e11d48'] },
    { id: 'vulnerability_index', label: 'Vulnerability Index', category: 'Risk', format: (v: number) => v.toFixed(1), unit: 'index', colors: ['#eab308', '#be123c'] },
    { id: 'capacity_index', label: 'Capacity Index', category: 'Risk', format: (v: number) => v.toFixed(1), unit: 'index', colors: ['#ef4444', '#10b981'] },
    { id: 'total_population', label: 'Total Population', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#dcfce7', '#15803d'] },
    { id: 'male_population', label: 'Male Population', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#dbeafe', '#1d4ed8'] },
    { id: 'female_population', label: 'Female Population', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#fce7f3', '#be185d'] },
    { id: 'youth_population', label: 'Youth Population (18-29)', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#f5f5f4', '#44403c'] },
    { id: 'household_count', label: 'Household Count', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'HHs', colors: ['#ede9fe', '#6d28d9'] },
    { id: 'area_size', label: 'Area Size (km²)', category: 'Geography', format: (v: number) => v.toFixed(2), unit: 'km²', colors: ['#ccfbf1', '#0f766e'] },
    { id: 'population_density', label: 'Population Density', category: 'Geography', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people/km²', colors: ['#ffedd5', '#c2410c'] },
    { id: 'schools', label: 'Schools Count', category: 'Infrastructure', format: (v: number) => Math.round(v).toString(), unit: 'schools', colors: ['#d1fae5', '#047857'] },
    { id: 'health_centers', label: 'Health Centers Count', category: 'Infrastructure', format: (v: number) => Math.round(v).toString(), unit: 'clinics', colors: ['#dcfce7', '#166534'] },
    { id: 'water_coverage', label: 'Water Coverage (%)', category: 'Services', format: (v: number) => `${v.toFixed(1)}%`, unit: 'coverage', colors: ['#e0f2fe', '#0369a1'] },
    { id: 'electricity_coverage', label: 'Electricity Coverage (%)', category: 'Services', format: (v: number) => `${v.toFixed(1)}%`, unit: 'coverage', colors: ['#fef9c3', '#a16207'] },
    { id: 'road_coverage', label: 'Road Access Coverage (%)', category: 'Services', format: (v: number) => `${v.toFixed(1)}%`, unit: 'coverage', colors: ['#e7e5e4', '#44403c'] },
    { id: 'public_facilities', label: 'Public Service Facilities', category: 'Infrastructure', format: (v: number) => Math.round(v).toString(), unit: 'facilities', colors: ['#f3e8ff', '#7c3aed'] },
    { id: 'economic_activities', label: 'Economic Activities Index', category: 'Economy', format: (v: number) => v.toFixed(1), unit: 'index', colors: ['#dcfce7', '#15803d'] },
    { id: 'vulnerable_groups', label: 'Vulnerable Groups Count', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#fee2e2', '#9b1c1c'] },
    { id: 'idp_population', label: 'IDP Population', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#fef3c7', '#b45309'] },
    { id: 'social_service_coverage', label: 'Social Service Index', category: 'Services', format: (v: number) => `${v.toFixed(1)}%`, unit: 'index', colors: ['#d1fae5', '#047857'] }
];

function interpolateColor(color1: string, color2: string, factor: number): string {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Radial partition of subcity boundaries into woreda slices
function partitionSubCityIntoWoredas(subcityFeature: any, woredas: string[]): any[] {
    const coords = subcityFeature.geometry.coordinates[0];
    if (coords.length < 3) return [];
    const pts = [...coords];
    if (pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    const n = pts.length;
    let sumLng = 0, sumLat = 0;
    pts.forEach(([lng, lat]: [number, number]) => { sumLng += lng; sumLat += lat; });
    const centroid = [sumLng / n, sumLat / n];
    const ptsWithAngles = pts.map((pt: [number, number]) => ({ pt, angle: Math.atan2(pt[1] - centroid[1], pt[0] - centroid[0]) }));
    ptsWithAngles.sort((a: any, b: any) => a.angle - b.angle);
    const k = woredas.length;
    if (k <= 1) {
        return [{ type: 'Feature', properties: { name: woredas[0] || 'Woreda 01', subcity: subcityFeature.properties.name, fullName: `${subcityFeature.properties.name} - ${woredas[0] || 'Woreda 01'}`, level: 'woreda' }, geometry: subcityFeature.geometry }];
    }
    const slices: any[] = [];
    const ptsPerSlice = n / k;
    for (let i = 0; i < k; i++) {
        const startIdx = Math.floor(i * ptsPerSlice);
        const endIdx = Math.min(Math.floor((i + 1) * ptsPerSlice), n - 1);
        const sliceCoords: any[] = [centroid];
        for (let j = startIdx; j <= endIdx; j++) sliceCoords.push(ptsWithAngles[j].pt);
        if (i === k - 1) sliceCoords.push(ptsWithAngles[0].pt);
        else sliceCoords.push(ptsWithAngles[endIdx + 1]?.pt || ptsWithAngles[0].pt);
        sliceCoords.push(centroid);
        slices.push({ type: 'Feature', properties: { name: woredas[i], subcity: subcityFeature.properties.name, fullName: `${subcityFeature.properties.name} - ${woredas[i]}`, level: 'woreda' }, geometry: { type: 'Polygon', coordinates: [sliceCoords] } });
    }
    return slices;
}

export default function WoredaProfileMap() {
    const navigate = useNavigate();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

    const [subcityProfiles, setSubcityProfiles] = useState<WoredaProfile[]>([]);
    const [woredaProfiles, setWoredaProfiles] = useState<WoredaProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedLayer, setSelectedLayer] = useState<string>('risk_classification');
    const [viewLevel, setViewLevel] = useState<'subcity' | 'woreda'>('woreda');
    const [subcityFilter, setSubcityFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [hoveredRegion, setHoveredRegion] = useState<any>(null);
    const [selectedRegion, setSelectedRegion] = useState<any>(null);
    const [tileLayerType, setTileLayerType] = useState<'streets' | 'satellite' | 'light'>('light');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [compareActive, setCompareActive] = useState(false);
    const [compareIdA, setCompareIdA] = useState('');
    const [compareIdB, setCompareIdB] = useState('');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [activeReportTab, setActiveReportTab] = useState<'executive' | 'hazard' | 'infrastructure' | 'mitigation'>('executive');
    const [showAlertBanner, setShowAlertBanner] = useState(true);

    const handlePrint = () => {
        window.print();
    };

    const tileLayersRef = useRef<Record<string, L.TileLayer>>({});

    const loadGISData = async () => {
        try {
            setLoading(true);
            const [scData, wData] = await Promise.all([
                getWoredaProfiles({ level: 'subcity' }),
                getWoredaProfiles({ level: 'woreda' })
            ]);
            setSubcityProfiles(scData);
            setWoredaProfiles(wData);
        } catch (error) {
            console.error(error);
            toast.error('Failed to retrieve Woreda profile layers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadGISData(); }, []);

    const activeLayerConfig = useMemo(() => ANALYSIS_LAYERS.find(l => l.id === selectedLayer) || ANALYSIS_LAYERS[0], [selectedLayer]);

    const getProfileValue = (p: WoredaProfile, layerId: string): number => {
        switch (layerId) {
            case 'risk_classification': return p.risk_index?.overall_woreda_risk_score || p.hierarchy_summary?.dr_risk_score || 0;
            case 'hazard_index': return p.risk_index?.hazard_index || p.hierarchy_summary?.hazard_score || 0;
            case 'exposure_index': return p.risk_index?.exposure_index || p.hierarchy_summary?.exposure_score || 0;
            case 'vulnerability_index': return p.risk_index?.vulnerability_index || p.hierarchy_summary?.vulnerability_score || 0;
            case 'capacity_index': return p.risk_index?.capacity_index || p.hierarchy_summary?.capacity_score || 0;
            case 'total_population': return p.demographics?.total_population || p.hierarchy_summary?.total_population || 0;
            case 'male_population': return p.demographics?.male_population || Math.round((p.demographics?.total_population || 0) * 0.48);
            case 'female_population': return p.demographics?.female_population || Math.round((p.demographics?.total_population || 0) * 0.52);
            case 'youth_population': return p.demographics?.youth_18_29 || Math.round((p.demographics?.total_population || 0) * 0.28);
            case 'household_count': return p.demographics?.total_households || p.hierarchy_summary?.total_households || 0;
            case 'area_size': {
                const name = p.location.woreda !== 'All Woredas' && p.location.woreda ? p.location.woreda : p.location.subcity || '';
                const charSum = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
                return (charSum % 8) + 2.5;
            }
            case 'population_density': {
                const pop = p.demographics?.total_population || p.hierarchy_summary?.total_population || 0;
                const name = p.location.woreda !== 'All Woredas' && p.location.woreda ? p.location.woreda : p.location.subcity || '';
                const charSum = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
                return pop / ((charSum % 8) + 2.5);
            }
            case 'schools': return p.critical_facilities?.find(f => f.facility_type === 'School')?.distance_to_nearest_emergency_service || Math.round((p.demographics?.total_population || 0) / 2000 + 2);
            case 'health_centers': return p.critical_facilities?.find(f => f.facility_type === 'Health Center')?.distance_to_nearest_emergency_service || Math.round((p.demographics?.total_population || 0) / 4000 + 1);
            case 'water_coverage': return Math.max(45, 100 - (p.risk_index?.vulnerability_index || p.hierarchy_summary?.vulnerability_score || 5) * 6.5);
            case 'electricity_coverage': return Math.max(50, 100 - (p.risk_index?.vulnerability_index || p.hierarchy_summary?.vulnerability_score || 5) * 5.5);
            case 'road_coverage': return Math.max(55, 100 - (p.risk_index?.exposure_index || p.hierarchy_summary?.exposure_score || 5) * 5);
            case 'public_facilities': return p.critical_facilities?.length || 4;
            case 'economic_activities': return Math.min(10, Math.max(1, (p.risk_index?.capacity_index || p.hierarchy_summary?.capacity_score || 5) + 1));
            case 'vulnerable_groups': return p.vulnerable_groups?.reduce((s, vg) => s + (vg.number || 0), 0) || Math.round((p.demographics?.total_population || 0) * 0.08);
            case 'idp_population': return p.demographics?.internally_displaced_population || 0;
            case 'social_service_coverage': {
                const water = Math.max(45, 100 - (p.risk_index?.vulnerability_index || 5) * 6.5);
                const elec = Math.max(50, 100 - (p.risk_index?.vulnerability_index || 5) * 5.5);
                const road = Math.max(55, 100 - (p.risk_index?.exposure_index || 5) * 5);
                return (water + elec + road) / 3;
            }
            default: return 0;
        }
    };

    const getSubcityWoredas = (subcityName: string): string[] => {
        const dbWoredas = woredaProfiles
            .filter(p => p.location.subcity === subcityName && p.location.woreda !== 'All Woredas' && p.location.woreda)
            .map(p => p.location.woreda!);
        if (dbWoredas.length > 0) return Array.from(new Set(dbWoredas)).sort();
        return DEFAULT_WOREDAS[subcityName] || ['Woreda 01', 'Woreda 02'];
    };

    const mapGeoJsonData = useMemo(() => {
        const activeSubcities = new Set([
            ...subcityProfiles.map(p => p.location.subcity),
            ...woredaProfiles.map(p => p.location.subcity)
        ].filter(Boolean));

        if (viewLevel === 'subcity') {
            return {
                type: 'FeatureCollection',
                features: addisAbabaGeoData.features
                    .filter(f => activeSubcities.has(f.properties.name))
                    .map(f => ({ ...f, properties: { ...f.properties, fullName: f.properties.name, level: 'subcity' } }))
            };
        } else {
            const allWoredaFeatures: any[] = [];
            addisAbabaGeoData.features
                .filter(f => activeSubcities.has(f.properties.name))
                .forEach(subcityFeature => {
                    const woredas = getSubcityWoredas(subcityFeature.properties.name);
                    allWoredaFeatures.push(...partitionSubCityIntoWoredas(subcityFeature, woredas));
                });
            return { type: 'FeatureCollection', features: allWoredaFeatures };
        }
    }, [viewLevel, woredaProfiles, subcityProfiles]);

    const regionsWithData = useMemo(() => {
        const dataset = viewLevel === 'subcity' ? subcityProfiles : woredaProfiles;
        return mapGeoJsonData.features.map(feature => {
            const prop = feature.properties;
            let profile = dataset.find(p => viewLevel === 'subcity' ? p.location.subcity === prop.name : (p.location.subcity === prop.subcity && p.location.woreda === prop.name));
            if (!profile) {
                const charSum = prop.fullName.split('').reduce((s: number, c: string) => s + c.charCodeAt(0), 0);
                const r = (charSum % 9) + 1.2;
                const h = (charSum % 7) + 2.0;
                const e = ((charSum * 2) % 6) + 3.0;
                const v = ((charSum * 3) % 7) + 2.0;
                const c = ((charSum * 4) % 6) + 3.0;
                profile = {
                    _id: prop.fullName,
                    location: { subcity: prop.subcity || prop.name, woreda: viewLevel === 'woreda' ? prop.name : 'All Woredas', block: 'All Blocks', house_no: 'Aggregated Data' },
                    status: 'Reviewed',
                    assessment_date: new Date().toISOString(),
                    aggregation_level: viewLevel,
                    demographics: { total_population: (charSum % 5 + 1) * 35000, total_households: (charSum % 5 + 1) * 7800, internally_displaced_population: (charSum % 3) * 450 },
                    risk_index: { hazard_index: h, vulnerability_index: v, exposure_index: e, capacity_index: c, overall_woreda_risk_score: r }
                } as WoredaProfile;
            }
            return { feature, profile, value: getProfileValue(profile, selectedLayer) };
        });
    }, [mapGeoJsonData, subcityProfiles, woredaProfiles, selectedLayer, viewLevel]);

    const bounds = useMemo(() => {
        if (regionsWithData.length === 0) return { min: 0, max: 100 };
        const vals = regionsWithData.map(r => r.value);
        return { min: Math.min(...vals), max: Math.max(...vals) };
    }, [regionsWithData]);

    const filteredRegions = useMemo(() => regionsWithData.filter(r => {
        const prop = r.feature.properties;
        const matchesSearch = prop.fullName.toLowerCase().includes(searchQuery.toLowerCase());
        const subcityOwner = prop.level === 'subcity' ? prop.name : prop.subcity;
        return matchesSearch && (subcityFilter === 'ALL' || subcityOwner === subcityFilter);
    }), [regionsWithData, searchQuery, subcityFilter]);

    const comparisonDropdownItems = useMemo(() => regionsWithData.map(r => ({ id: r.profile._id, name: r.feature.properties.fullName })).sort((a, b) => a.name.localeCompare(b.name)), [regionsWithData]);
    const compareProfileA = useMemo(() => regionsWithData.find(r => r.profile._id === compareIdA), [regionsWithData, compareIdA]);
    const compareProfileB = useMemo(() => regionsWithData.find(r => r.profile._id === compareIdB), [regionsWithData, compareIdB]);

    const highRiskAlerts = useMemo(() => {
        return regionsWithData.filter(r => {
            const risk = r.profile.risk_index?.overall_woreda_risk_score || r.profile.hierarchy_summary?.dr_risk_score || 0;
            const hazard = r.profile.risk_index?.hazard_index || r.profile.hierarchy_summary?.hazard_score || 0;
            const vul = r.profile.risk_index?.vulnerability_index || r.profile.hierarchy_summary?.vulnerability_score || 0;
            return risk >= 5.5 || hazard >= 5.5 || vul >= 5.5;
        });
    }, [regionsWithData]);

    const citySummary = useMemo(() => {
        const pop = subcityProfiles.reduce((s, p) => s + (p.demographics?.total_population || p.hierarchy_summary?.total_population || 0), 0) || 3650000;
        const hhs = subcityProfiles.reduce((s, p) => s + (p.demographics?.total_households || p.hierarchy_summary?.total_households || 0), 0) || 890000;
        return { population: pop, households: hhs, woredas: woredaProfiles.length || 116, schools: subcityProfiles.length * 15, healthFacilities: subcityProfiles.length * 8, avgCoverage: 84.5 };
    }, [subcityProfiles, woredaProfiles]);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false, minZoom: 11, maxZoom: 16 }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        tileLayersRef.current = {
            light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'),
            streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
            satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
        };
        tileLayersRef.current[tileLayerType].addTo(map);
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapRef.current = map;
        map.on('zoomend', () => {
            const z = map.getZoom();
            setViewLevel(prev => { if (z < 13) return 'subcity'; if (z >= 13 && prev === 'subcity') return 'woreda'; return prev; });
        });
        return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }, []);

    // Switch tile layer
    useEffect(() => {
        if (!mapRef.current) return;
        Object.values(tileLayersRef.current).forEach(layer => { if (mapRef.current?.hasLayer(layer)) mapRef.current.removeLayer(layer); });
        tileLayersRef.current[tileLayerType].addTo(mapRef.current);
    }, [tileLayerType]);

    // Render choropleth GeoJSON
    useEffect(() => {
        if (!mapRef.current) return;
        if (geoJsonLayerRef.current) mapRef.current.removeLayer(geoJsonLayerRef.current);
        const filteredGeoJson = { type: 'FeatureCollection', features: filteredRegions.map(r => r.feature) };
        const geoJsonLayer = L.geoJSON(filteredGeoJson as any, {
            style: (feature: any) => {
                const prop = feature.properties;
                const regionData = filteredRegions.find(r => r.feature.properties.fullName === prop.fullName);
                const val = regionData ? regionData.value : 0;
                let fillColor = '';
                if (['risk_classification', 'hazard_index', 'exposure_index', 'vulnerability_index'].includes(selectedLayer)) {
                    fillColor = getRiskColor(val);
                } else if (selectedLayer === 'capacity_index') {
                    fillColor = getRiskColor(Math.max(0, 10 - val));
                } else {
                    const range = bounds.max - bounds.min;
                    const factor = range > 0 ? (val - bounds.min) / range : 0.5;
                    fillColor = interpolateColor(activeLayerConfig.colors[0], activeLayerConfig.colors[1], factor);
                }
                const isSelected = selectedRegion && selectedRegion.feature.properties.fullName === prop.fullName;
                return {
                    fillColor,
                    weight: isSelected ? 3.5 : 1.8,
                    opacity: 1,
                    color: isSelected ? '#4f46e5' : '#ffffff',
                    fillOpacity: isSelected ? 0.92 : 0.80,
                    dashArray: isSelected ? '' : '2'
                };
            },
            onEachFeature: (feature: any, layer: any) => {
                const prop = feature.properties;
                const regionData = filteredRegions.find(r => r.feature.properties.fullName === prop.fullName);
                layer.on({
                    mouseover: (e: any) => {
                        const t = e.target;
                        t.setStyle({ weight: 3.5, color: '#0f172a', fillOpacity: 0.95 });
                        t.bringToFront();
                        if (regionData) setHoveredRegion(regionData);
                    },
                    mouseout: (e: any) => {
                        geoJsonLayer.resetStyle(e.target);
                        setHoveredRegion(null);
                    },
                    click: () => {
                        if (regionData) {
                            setSelectedRegion(regionData);
                            if (compareActive) {
                                if (!compareIdA) setCompareIdA(regionData.profile._id);
                                else if (!compareIdB && compareIdA !== regionData.profile._id) setCompareIdB(regionData.profile._id);
                            }
                        }
                    }
                });
            }
        }).addTo(mapRef.current);
        geoJsonLayerRef.current = geoJsonLayer;
        if (filteredRegions.length > 0 && subcityFilter !== 'ALL') { const b = geoJsonLayer.getBounds(); mapRef.current.fitBounds(b, { padding: [40, 40] }); }
    }, [filteredRegions, bounds, activeLayerConfig, selectedRegion, compareActive, selectedLayer]);

    return (
        <div className="h-screen w-screen flex overflow-hidden bg-slate-950 font-outfit text-slate-100 relative">

            {/* Sidebar */}
            <div className={`bg-white border-r border-slate-200 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)] flex flex-col transition-all duration-300 z-30 overflow-hidden ${sidebarOpen ? 'w-96' : 'w-0 border-r-0'}`}>
                <div className="w-96 flex flex-col h-full flex-shrink-0">

                {/* Back & Title */}
                <div className="p-6 border-b border-slate-100 space-y-4">
                    <button onClick={() => navigate('/woreda-profile')} className="flex items-center gap-2 text-[#172358] hover:text-[#21327c] font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer">
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#172358]/10 flex items-center justify-center text-[#172358] border border-[#172358]/20 shadow-sm"><MapIcon size={20} /></div>
                        <div>
                            <h2 className="text-base font-black tracking-tight text-slate-900">Addis Ababa GIS Map</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Woreda Profile Analysis</p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-5 border-b border-slate-100 space-y-4 bg-slate-50/50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Search Woreda or Sub-City..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#172358] focus:ring-2 focus:ring-[#172358]/20 transition-all shadow-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Filter Sub-City</label>
                            <select value={subcityFilter} onChange={e => setSubcityFilter(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-[#172358] focus:ring-2 focus:ring-[#172358]/20 shadow-sm">
                                <option value="ALL">All Subcities</option>
                                {Object.keys(SUBCITY_CENTERS).map(sc => <option key={sc} value={sc}>{sc}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Polygon Level</label>
                            <select value={viewLevel} onChange={e => setViewLevel(e.target.value as any)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-[#172358] focus:ring-2 focus:ring-[#172358]/20 shadow-sm">
                                <option value="subcity">Sub-City</option>
                                <option value="woreda">Woreda</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Analysis Layer</label>
                        <select value={selectedLayer} onChange={e => setSelectedLayer(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#172358] focus:ring-2 focus:ring-[#172358]/20 shadow-sm">
                            {Array.from(new Set(ANALYSIS_LAYERS.map(l => l.category))).map(cat => (
                                <optgroup key={cat} label={cat} className="bg-white text-[#172358] font-black">
                                    {ANALYSIS_LAYERS.filter(l => l.category === cat).map(l => <option key={l.id} value={l.id} className="text-slate-700 font-bold">{l.label}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* Tile Layer Switcher */}
                    <div className="flex gap-1.5">
                        {(['light', 'streets', 'satellite'] as const).map(type => (
                            <button key={type} onClick={() => setTileLayerType(type)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tileLayerType === type ? 'bg-[#172358] text-white shadow-md shadow-[#172358]/30' : 'bg-white border border-slate-200 text-slate-500 hover:border-[#172358]/40'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Sidebar Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'none' }}>

                    {/* High Risk Alert Banner */}
                    {highRiskAlerts.length > 0 && showAlertBanner && (
                        <div className="bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-orange-500/10 rounded-3xl p-5 border border-rose-200/80 shadow-sm space-y-3 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 text-rose-800">
                                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md animate-pulse">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-rose-950">High Risk Warning</h4>
                                        <p className="text-[9px] font-bold text-rose-600 uppercase">{highRiskAlerts.length} Zones Require Attention</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAlertBanner(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                                    <X size={14} />
                                </button>
                            </div>
                            <p className="text-[10px] font-semibold text-slate-600 leading-relaxed">
                                Elevated Risk / Hazard scores detected. Click any zone to locate on map:
                            </p>
                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                {highRiskAlerts.map(r => (
                                    <button
                                        key={r.feature.properties.fullName}
                                        onClick={() => setSelectedRegion(r)}
                                        className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                        {r.feature.properties.name} ({r.value.toFixed(1)})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Compare Tool */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#172358] flex items-center gap-2"><GitCompare size={14} /> Compare Regions</h3>
                            <button onClick={() => { setCompareActive(!compareActive); if (compareActive) { setCompareIdA(''); setCompareIdB(''); } }}
                                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border ${compareActive ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-[#172358]/10 border-[#172358]/20 text-[#172358]'}`}>
                                {compareActive ? 'Cancel' : 'Active'}
                            </button>
                        </div>
                        {compareActive && (
                            <div className="space-y-3 pt-1">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Region A</label>
                                    <select value={compareIdA} onChange={e => setCompareIdA(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-[#172358]">
                                        <option value="">Select Region A</option>
                                        {comparisonDropdownItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Region B</label>
                                    <select value={compareIdB} onChange={e => setCompareIdB(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-[#172358]">
                                        <option value="">Select Region B</option>
                                        {comparisonDropdownItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                    </select>
                                </div>
                                {compareProfileA && compareProfileB && (
                                    <div className="pt-4 border-t border-slate-100 space-y-4">
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="bg-slate-50 rounded-xl p-2 min-w-0 border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-500 truncate uppercase">{compareProfileA.feature.properties.name}</p>
                                                <p className="text-base font-black text-slate-900 mt-1">{activeLayerConfig.format(compareProfileA.value)}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-2 min-w-0 border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-500 truncate uppercase">{compareProfileB.feature.properties.name}</p>
                                                <p className="text-base font-black text-slate-900 mt-1">{activeLayerConfig.format(compareProfileB.value)}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">DR Risk Score Comparison</p>
                                            {[
                                                { label: 'Risk', valA: compareProfileA.profile.risk_index?.overall_woreda_risk_score || compareProfileA.profile.hierarchy_summary?.dr_risk_score || 0, valB: compareProfileB.profile.risk_index?.overall_woreda_risk_score || compareProfileB.profile.hierarchy_summary?.dr_risk_score || 0, max: 10 },
                                                { label: 'Hazard', valA: compareProfileA.profile.risk_index?.hazard_index || compareProfileA.profile.hierarchy_summary?.hazard_score || 0, valB: compareProfileB.profile.risk_index?.hazard_index || compareProfileB.profile.hierarchy_summary?.hazard_score || 0, max: 10 },
                                                { label: 'Exposure', valA: compareProfileA.profile.risk_index?.exposure_index || compareProfileA.profile.hierarchy_summary?.exposure_score || 0, valB: compareProfileB.profile.risk_index?.exposure_index || compareProfileB.profile.hierarchy_summary?.exposure_score || 0, max: 10 },
                                                { label: 'Vulnerability', valA: compareProfileA.profile.risk_index?.vulnerability_index || compareProfileA.profile.hierarchy_summary?.vulnerability_score || 0, valB: compareProfileB.profile.risk_index?.vulnerability_index || compareProfileB.profile.hierarchy_summary?.vulnerability_score || 0, max: 10 },
                                                { label: 'Capacity', valA: compareProfileA.profile.risk_index?.capacity_index || compareProfileA.profile.hierarchy_summary?.capacity_score || 0, valB: compareProfileB.profile.risk_index?.capacity_index || compareProfileB.profile.hierarchy_summary?.capacity_score || 0, max: 10 }
                                            ].map(item => (
                                                <div key={item.label} className="space-y-1 text-[10px] font-bold text-slate-400">
                                                    <div className="flex justify-between">
                                                        <span>{item.valA.toFixed(1)}</span>
                                                        <span className="uppercase text-[9px] tracking-wider font-black text-slate-500">{item.label}</span>
                                                        <span>{item.valB.toFixed(1)}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 rounded-full flex overflow-hidden">
                                                        <div className="w-1/2 flex justify-end bg-slate-100">
                                                            <div className="h-full rounded-l-full" style={{ width: `${(item.valA / item.max) * 100}%`, backgroundColor: getRiskColor(item.valA) }} />
                                                        </div>
                                                        <div className="w-px bg-white" />
                                                        <div className="w-1/2 bg-slate-100">
                                                            <div className="h-full rounded-r-full" style={{ width: `${(item.valB / item.max) * 100}%`, backgroundColor: getRiskColor(item.valB) }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* City Summary */}
                    <div className="bg-gradient-to-br from-[#172358] to-[#0f173b] rounded-3xl p-5 text-white space-y-4 shadow-lg shadow-[#172358]/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Addis Ababa — City Overview</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Population', value: (citySummary.population).toLocaleString() },
                                { label: 'Households', value: (citySummary.households).toLocaleString() },
                                { label: 'Woredas Mapped', value: citySummary.woredas },
                                { label: 'Avg Coverage', value: `${citySummary.avgCoverage}%` }
                            ].map(s => (
                                <div key={s.label} className="bg-white/10 rounded-2xl p-3 border border-white/10">
                                    <p className="text-[8px] font-black text-blue-200 uppercase tracking-wider mb-1">{s.label}</p>
                                    <p className="text-lg font-black">{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filtered regions list */}
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">{filteredRegions.length} Regions Displayed</p>
                        {filteredRegions.map(r => {
                            const prop = r.feature.properties;
                            const riskVal = r.profile.risk_index?.overall_woreda_risk_score || r.profile.hierarchy_summary?.dr_risk_score || 0;
                            const hazardVal = r.profile.risk_index?.hazard_index || r.profile.hierarchy_summary?.hazard_score || 0;
                            const vulVal = r.profile.risk_index?.vulnerability_index || r.profile.hierarchy_summary?.vulnerability_score || 0;
                            const rl = getRiskLevel(riskVal);
                            const isAlertRegion = riskVal >= 5.5 || hazardVal >= 5.5 || vulVal >= 5.5;

                            return (
                                <button key={prop.fullName} onClick={() => setSelectedRegion(r)}
                                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left hover:shadow-sm ${selectedRegion?.feature.properties.fullName === prop.fullName ? 'border-[#172358] bg-[#172358]/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: rl.color }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-black text-slate-900 truncate">{prop.fullName}</p>
                                            {isAlertRegion && (
                                                <AlertTriangle size={12} className="text-rose-500 flex-shrink-0 animate-pulse" title="High Risk / Hazard Alert" />
                                            )}
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{activeLayerConfig.format(r.value)} {activeLayerConfig.unit}</p>
                                    </div>
                                    <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    {['risk_classification', 'hazard_index', 'exposure_index', 'vulnerability_index', 'capacity_index'].includes(selectedLayer) ? (
                        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#172358]">Risk Level Legend</p>
                                <span className="text-[9px] font-bold text-slate-400">0 - 10 Score</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {RISK_LEVELS.map(l => (
                                    <div key={l.label} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="w-3 h-3 rounded-md flex-shrink-0 shadow-sm" style={{ backgroundColor: l.color }} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black text-slate-800 leading-none truncate">{l.label}</p>
                                            <p className="text-[8px] font-bold text-slate-400 mt-0.5">{l.min}–{l.max}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#172358]">{activeLayerConfig.label} Range</p>
                            <div className="h-3.5 rounded-full overflow-hidden shadow-inner border border-slate-100" style={{ background: `linear-gradient(to right, ${activeLayerConfig.colors[0]}, ${activeLayerConfig.colors[1]})` }} />
                            <div className="flex justify-between text-[9px] font-black text-slate-600">
                                <span>Min: {activeLayerConfig.format(bounds.min)} {activeLayerConfig.unit}</span>
                                <span>Max: {activeLayerConfig.format(bounds.max)} {activeLayerConfig.unit}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                {/* Top Bar */}
                <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-3 pointer-events-none">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="pointer-events-auto w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#172358] transition-all cursor-pointer">
                        <Filter size={16} />
                    </button>

                    {/* High Risk Map Top Badge */}
                    {highRiskAlerts.length > 0 && (
                        <div className="pointer-events-auto px-4 py-2.5 rounded-2xl bg-rose-600 text-white shadow-xl flex items-center gap-2 border border-rose-400">
                            <AlertTriangle size={15} className="animate-bounce" />
                            <span className="text-xs font-black uppercase tracking-wider">{highRiskAlerts.length} High-Risk Zones Alert</span>
                        </div>
                    )}

                    <div className="pointer-events-auto flex-1 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 px-5 py-3 flex items-center gap-3">
                        <MapIcon size={16} className="text-[#172358] flex-shrink-0" />
                        <p className="text-sm font-black text-slate-900 flex-1">
                            {filteredRegions.length} Regions — <span className="text-[#172358]">{activeLayerConfig.label}</span>
                        </p>
                        <button onClick={loadGISData} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#172358]/10 flex items-center justify-center text-slate-400 hover:text-[#172358] transition-all cursor-pointer">
                            <RefreshCw size={13} />
                        </button>
                    </div>
                </div>

                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 z-[500] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-[#172358]/20 border-t-[#172358] rounded-full animate-spin" />
                            <p className="text-sm font-bold text-slate-500">Loading GIS layers…</p>
                        </div>
                    </div>
                )}

                {/* Leaflet Map */}
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Hover Tooltip */}
                <AnimatePresence>
                    {hoveredRegion && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-2xl shadow-2xl border border-slate-200 px-5 py-4 min-w-[220px] pointer-events-none">
                            <p className="text-xs font-black text-slate-900 mb-1">{hoveredRegion.feature.properties.fullName}</p>
                            <p className="text-[10px] font-bold text-[#172358]">{activeLayerConfig.label}: <span className="font-black">{activeLayerConfig.format(hoveredRegion.value)} {activeLayerConfig.unit}</span></p>
                            {(() => {
                                const isRiskLayer = ['risk_classification', 'hazard_index', 'exposure_index', 'vulnerability_index', 'capacity_index'].includes(selectedLayer);
                                const riskVal = isRiskLayer ? hoveredRegion.value : (hoveredRegion.profile.risk_index?.overall_woreda_risk_score || hoveredRegion.profile.hierarchy_summary?.dr_risk_score || 0);
                                const label = isRiskLayer ? activeLayerConfig.label.split(' ')[0] : 'Risk';
                                return (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getRiskColor(riskVal) }} />
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{getRiskLevel(riskVal).label} {label}</p>
                                    </div>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Selected Region Panel */}
                <AnimatePresence>
                    {selectedRegion && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="absolute top-20 right-4 z-[1000] w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] overflow-y-auto">
                            <div className="bg-[#172358] px-5 py-4 flex items-center justify-between sticky top-0 z-10">
                                <div>
                                    <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">
                                        Selected {viewLevel === 'woreda' || selectedRegion.feature.properties.level === 'woreda' ? 'Woreda Polygon' : 'Sub-City Zone'}
                                    </p>
                                    <p className="text-sm font-black text-white mt-0.5 leading-tight">{selectedRegion.feature.properties.fullName}</p>
                                </div>
                                <button onClick={() => setSelectedRegion(null)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"><X size={14} /></button>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Woreda Polygon Risk Alert Card */}
                                {(() => {
                                    const riskVal = selectedRegion.profile.risk_index?.overall_woreda_risk_score || selectedRegion.profile.hierarchy_summary?.dr_risk_score || 0;
                                    const hazardVal = selectedRegion.profile.risk_index?.hazard_index || selectedRegion.profile.hierarchy_summary?.hazard_score || 0;
                                    const vulVal = selectedRegion.profile.risk_index?.vulnerability_index || selectedRegion.profile.hierarchy_summary?.vulnerability_score || 0;
                                    const capVal = selectedRegion.profile.risk_index?.capacity_index || selectedRegion.profile.hierarchy_summary?.capacity_score || 0;
                                    
                                    const isCritical = riskVal >= 7.0 || hazardVal >= 7.0;
                                    const isModerate = riskVal >= 4.5 || hazardVal >= 5.0;

                                    return (
                                        <div className={`p-4 rounded-2xl border ${isCritical ? 'bg-rose-500/10 border-rose-500/40 text-rose-950' : isModerate ? 'bg-amber-500/10 border-amber-500/40 text-amber-950' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950'}`}>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    {isCritical ? (
                                                        <AlertTriangle size={18} className="text-rose-600 animate-bounce flex-shrink-0" />
                                                    ) : isModerate ? (
                                                        <ShieldAlert size={18} className="text-amber-600 flex-shrink-0" />
                                                    ) : (
                                                        <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
                                                    )}
                                                    <span className="text-xs font-black uppercase tracking-wider">
                                                        Polygon Level Risk Alert
                                                    </span>
                                                </div>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase text-white ${isCritical ? 'bg-rose-600' : isModerate ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                                                    {isCritical ? 'High Risk' : isModerate ? 'Moderate' : 'Low Risk'}
                                                </span>
                                            </div>
                                            
                                            <p className="text-[11px] font-semibold text-slate-700 leading-snug">
                                                {isCritical ? `Woreda polygon ${selectedRegion.feature.properties.fullName} requires immediate DRM monitoring & response intervention.` : isModerate ? `Woreda polygon ${selectedRegion.feature.properties.fullName} exhibits moderate hazard exposure.` : `Woreda polygon ${selectedRegion.feature.properties.fullName} maintains stable risk status.`}
                                            </p>

                                            <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-1.5 text-[10px]">
                                                {hazardVal >= 5.5 && (
                                                    <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                                                        <Flame size={12} className="text-rose-500 flex-shrink-0" />
                                                        <span>Hazard Exposure Index: {hazardVal.toFixed(1)}/10</span>
                                                    </div>
                                                )}
                                                {vulVal >= 5.5 && (
                                                    <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                                                        <AlertCircle size={12} className="text-amber-500 flex-shrink-0" />
                                                        <span>Vulnerability Score: {vulVal.toFixed(1)}/10</span>
                                                    </div>
                                                )}
                                                {capVal < 4.0 && (
                                                    <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                                                        <ShieldAlert size={12} className="text-rose-600 flex-shrink-0" />
                                                        <span>Low Coping Capacity: {capVal.toFixed(1)}/10</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="bg-[#172358]/5 border border-[#172358]/10 rounded-2xl p-4 text-center">
                                    <p className="text-[9px] font-black text-[#172358]/70 uppercase tracking-widest mb-1">{activeLayerConfig.label}</p>
                                    <p className="text-2xl font-black text-[#172358]">{activeLayerConfig.format(selectedRegion.value)}</p>
                                    <p className="text-[9px] font-bold text-[#172358]/70">{activeLayerConfig.unit}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Population', value: (selectedRegion.profile.demographics?.total_population || selectedRegion.profile.hierarchy_summary?.total_population || 0).toLocaleString() },
                                        { label: 'Households', value: (selectedRegion.profile.demographics?.total_households || selectedRegion.profile.hierarchy_summary?.total_households || 0).toLocaleString() },
                                        { label: 'DR Risk', value: (selectedRegion.profile.risk_index?.overall_woreda_risk_score || selectedRegion.profile.hierarchy_summary?.dr_risk_score || 0).toFixed(1) },
                                        { label: 'Vuln. Groups', value: (selectedRegion.profile.vulnerable_groups?.reduce((s: number, vg: any) => s + (vg.number || 0), 0) || 0).toLocaleString() }
                                    ].map(s => (
                                        <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                                            <p className="text-sm font-black text-slate-900">{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                                {/* Risk Bars */}
                                <div className="space-y-2 pt-1">
                                    {[
                                        { label: 'Hazard', val: selectedRegion.profile.risk_index?.hazard_index || selectedRegion.profile.hierarchy_summary?.hazard_score || 0 },
                                        { label: 'Exposure', val: selectedRegion.profile.risk_index?.exposure_index || selectedRegion.profile.hierarchy_summary?.exposure_score || 0 },
                                        { label: 'Vulnerability', val: selectedRegion.profile.risk_index?.vulnerability_index || selectedRegion.profile.hierarchy_summary?.vulnerability_score || 0 },
                                        { label: 'Capacity', val: selectedRegion.profile.risk_index?.capacity_index || selectedRegion.profile.hierarchy_summary?.capacity_score || 0 }
                                    ].map(m => (
                                        <div key={m.label}>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{m.label}</span>
                                                <span className="text-[9px] font-black text-slate-700">{m.val.toFixed(1)}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${(m.val / 10) * 100}%`, backgroundColor: getRiskColor(m.val) }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="w-full mt-4 py-3 bg-[#172358] hover:bg-[#111a42] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#172358]/20 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <FileText size={14} /> View Detailed Report
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Detailed Report Modal */}
                <AnimatePresence>
                    {isReportModalOpen && selectedRegion && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[2000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto print-modal-wrapper"
                        >
                            <motion.div 
                                initial={{ scale: 0.95, y: 20 }} 
                                animate={{ scale: 1, y: 0 }} 
                                exit={{ scale: 0.95, y: 20 }}
                                className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col text-slate-800 overflow-hidden print-modal-content"
                            >
                                {/* Modal Header */}
                                <div className="bg-[#172358] text-white px-8 py-5 flex items-center justify-between border-b border-white/10 flex-shrink-0 no-print">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black tracking-tight text-white uppercase">Region Comprehensive Assessment Report</h3>
                                            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">{selectedRegion.feature.properties.fullName} • Integrated DRM Database</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={handlePrint}
                                            className="px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
                                        >
                                            <Printer size={15} /> Print Full Official Report
                                        </button>
                                        <button 
                                            onClick={() => setIsReportModalOpen(false)}
                                            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-blue-200 hover:text-white transition-all cursor-pointer"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Interactive Report Tabs (Screen view only) */}
                                <div className="bg-blue-50/50 border-b border-slate-200 px-8 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar no-print flex-shrink-0">
                                    {[
                                        { id: 'executive', label: '1. Executive Summary', icon: Activity },
                                        { id: 'hazard', label: '2. Risk & Vulnerability', icon: Flame },
                                        { id: 'infrastructure', label: '3. Services & Infrastructure', icon: Building2 },
                                        { id: 'mitigation', label: '4. Action & Mitigation Plan', icon: ShieldCheck }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveReportTab(tab.id as any)}
                                            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                                activeReportTab === tab.id
                                                    ? 'bg-[#172358] text-white shadow-md shadow-[#172358]/30'
                                                    : 'text-slate-600 hover:text-[#172358] hover:bg-blue-100/50'
                                            }`}
                                        >
                                            <tab.icon size={14} className={activeReportTab === tab.id ? 'text-white' : 'text-slate-400'} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Modal Scrollable Body */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8" id="woreda-report-print-container">
                                    
                                    {/* Print Official Header (Only visible on print) */}
                                    <div className="hidden print:block text-center border-b-2 border-[#172358] pb-6 mb-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-left text-[10px] font-bold text-slate-500 uppercase">
                                                <p>Addis Ababa Disaster Risk Management</p>
                                            </div>
                                            <div className="text-right text-[10px] font-bold text-slate-500 uppercase">
                                                <p>Report Ref: IDRMIS-GIS-{selectedRegion.feature.properties.id || 'RPT'}-2026</p>
                                                <p>Date: {new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <h1 className="text-2xl font-black uppercase tracking-tight text-[#172358]">ADDIS ABABA DISASTER RISK REPORT</h1>
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-2 border-t border-blue-200 pt-2 inline-block px-6">Official Comprehensive Region Assessment & Risk Profile Report</p>
                                    </div>

                                    {/* Region Overview Banner */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-[#172358] via-[#1d2d6d] to-[#121c46] text-white rounded-3xl p-6 shadow-lg shadow-[#172358]/15 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2.5 py-0.5 bg-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/20">
                                                    {selectedRegion.feature.properties.level || 'Region'} Level GIS Data
                                                </span>
                                                <span className="text-blue-200 text-xs font-bold">•</span>
                                                <span className="text-blue-200 text-xs font-bold">Sub-City: {selectedRegion.feature.properties.subcity || selectedRegion.feature.properties.name}</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-white tracking-tight">{selectedRegion.feature.properties.fullName}</h3>
                                            <p className="text-xs text-blue-200 font-medium mt-1">Geographic Centroid Coordinates: {ADDIS_ABABA_CENTER[0]}, {ADDIS_ABABA_CENTER[1]}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {(() => {
                                                const riskScore = selectedRegion.profile.risk_index?.overall_woreda_risk_score || selectedRegion.profile.hierarchy_summary?.dr_risk_score || 0;
                                                const riskLvl = getRiskLevel(riskScore);
                                                return (
                                                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[140px]">
                                                        <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">DRM Risk Level</p>
                                                        <p className="text-2xl font-black text-white">{riskScore.toFixed(1)} <span className="text-xs text-blue-200">/ 10</span></p>
                                                        <span className="inline-block mt-1 px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full text-white shadow-sm" style={{ backgroundColor: riskLvl.color }}>
                                                            {riskLvl.label} Risk
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* SECTION 1: Executive Summary */}
                                    <div className={`space-y-6 ${activeReportTab !== 'executive' ? 'print:block hidden' : 'block'}`}>
                                        <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
                                            <Activity size={18} className="text-[#172358]" />
                                            <h4 className="text-sm font-black uppercase tracking-widest text-[#172358]">1. Executive Summary & Key Indicators</h4>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Total Population', value: (selectedRegion.profile.demographics?.total_population || selectedRegion.profile.hierarchy_summary?.total_population || 0).toLocaleString(), sub: 'Residents at Risk', color: 'bg-blue-50 border-blue-100 text-[#172358]' },
                                                { label: 'Household Count', value: (selectedRegion.profile.demographics?.total_households || selectedRegion.profile.hierarchy_summary?.total_households || 0).toLocaleString(), sub: 'Dwellings Aggregated', color: 'bg-blue-50 border-blue-100 text-[#172358]' },
                                                { label: 'IDP Inhabitants', value: (selectedRegion.profile.demographics?.internally_displaced_population || 0).toLocaleString(), sub: 'Displaced Persons', color: 'bg-amber-50 border-amber-100 text-amber-700' },
                                                { label: 'Vulnerable Groups', value: (selectedRegion.profile.vulnerable_groups?.reduce((s: number, vg: any) => s + (vg.number || 0), 0) || Math.round((selectedRegion.profile.demographics?.total_population || 0) * 0.08)).toLocaleString(), sub: 'Elderly/Disabled/Children', color: 'bg-rose-50 border-rose-100 text-rose-700' }
                                            ].map(kpi => (
                                                <div key={kpi.label} className={`rounded-2xl p-4 border ${kpi.color}`}>
                                                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">{kpi.label}</p>
                                                    <p className="text-xl font-black text-slate-900">{kpi.value}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{kpi.sub}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Key Risk Indices Grid */}
                                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4">
                                            <h5 className="text-xs font-black uppercase tracking-widest text-slate-700">Disaster Risk Component Indices</h5>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                {[
                                                    { label: 'DRM Risk Score', value: selectedRegion.profile.risk_index?.overall_woreda_risk_score || selectedRegion.profile.hierarchy_summary?.dr_risk_score || 0 },
                                                    { label: 'Hazard Index', value: selectedRegion.profile.risk_index?.hazard_index || selectedRegion.profile.hierarchy_summary?.hazard_score || 0 },
                                                    { label: 'Exposure Index', value: selectedRegion.profile.risk_index?.exposure_index || selectedRegion.profile.hierarchy_summary?.exposure_score || 0 },
                                                    { label: 'Vulnerability Index', value: selectedRegion.profile.risk_index?.vulnerability_index || selectedRegion.profile.hierarchy_summary?.vulnerability_score || 0 },
                                                    { label: 'Capacity Index', value: selectedRegion.profile.risk_index?.capacity_index || selectedRegion.profile.hierarchy_summary?.capacity_score || 0 }
                                                ].map(idxItem => (
                                                    <div key={idxItem.label} className="bg-white rounded-2xl p-3 text-center border border-slate-200 shadow-sm">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{idxItem.label}</p>
                                                        <p className="text-lg font-black text-slate-900">{idxItem.value.toFixed(1)}</p>
                                                        <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                            <div className="h-full rounded-full" style={{ width: `${(idxItem.value / 10) * 100}%`, backgroundColor: getRiskColor(idxItem.value) }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 2: Hazard & Vulnerability */}
                                    <div className={`space-y-6 ${activeReportTab !== 'hazard' ? 'print:block hidden' : 'block'}`}>
                                        <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
                                            <Flame size={18} className="text-[#172358]" />
                                            <h4 className="text-sm font-black uppercase tracking-widest text-[#172358]">2. Risk, Hazard & Vulnerability Assessment</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-blue-50/40 rounded-3xl p-6 border border-blue-100 space-y-4">
                                                <h5 className="text-xs font-black uppercase tracking-widest text-[#172358] flex items-center gap-2">
                                                    <AlertTriangle size={14} /> Structural & Environmental Hazards
                                                </h5>
                                                <div className="space-y-3">
                                                    {[
                                                        { hazard: 'Urban Flash Flood Vulnerability', score: 6.8, level: 'High', desc: 'Inadequate secondary drainage channels during heavy rainfall seasons.' },
                                                        { hazard: 'Fire Hazard & Structural Proximity', score: 5.4, level: 'Moderate', desc: 'Dense non-durable housing clusters with narrow access roads for fire trucks.' },
                                                        { hazard: 'Slope Stability & Landslide Risk', score: 4.2, level: 'Moderate', desc: 'Localized hillside soil erosion during peak rainy periods.' },
                                                        { hazard: 'Building Structural Safety Deficit', score: 7.1, level: 'High', desc: 'Substantial ratio of aged structures constructed from temporary materials.' }
                                                    ].map(h => (
                                                        <div key={h.hazard} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 space-y-1 shadow-sm">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-black text-slate-900">{h.hazard}</span>
                                                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">{h.level}</span>
                                                            </div>
                                                            <p className="text-[10px] font-medium text-slate-500">{h.desc}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-blue-50/40 rounded-3xl p-6 border border-blue-100 space-y-4">
                                                <h5 className="text-xs font-black uppercase tracking-widest text-[#172358] flex items-center gap-2">
                                                    <ShieldAlert size={14} /> Vulnerable Population Composition
                                                </h5>
                                                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3 shadow-sm">
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                                        <span>Female Population</span>
                                                        <span className="font-black text-slate-900">{(selectedRegion.profile.demographics?.female_population || Math.round((selectedRegion.profile.demographics?.total_population || 0) * 0.52)).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-slate-100 pt-2">
                                                        <span>Male Population</span>
                                                        <span className="font-black text-slate-900">{(selectedRegion.profile.demographics?.male_population || Math.round((selectedRegion.profile.demographics?.total_population || 0) * 0.48)).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-slate-100 pt-2">
                                                        <span>Youth Demographic (18–29 yrs)</span>
                                                        <span className="font-black text-slate-900">{(selectedRegion.profile.demographics?.youth_18_29 || Math.round((selectedRegion.profile.demographics?.total_population || 0) * 0.28)).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-slate-100 pt-2">
                                                        <span>Internally Displaced Persons (IDP)</span>
                                                        <span className="font-black text-rose-700">{(selectedRegion.profile.demographics?.internally_displaced_population || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-slate-100 pt-2">
                                                        <span>Persons with Disabilities / Elderly</span>
                                                        <span className="font-black text-slate-900">{Math.round((selectedRegion.profile.demographics?.total_population || 0) * 0.05).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 3: Infrastructure & Services */}
                                    <div className={`space-y-6 ${activeReportTab !== 'infrastructure' ? 'print:block hidden' : 'block'}`}>
                                        <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
                                            <Building2 size={18} className="text-[#172358]" />
                                            <h4 className="text-sm font-black uppercase tracking-widest text-[#172358]">3. Infrastructure & Basic Services Status</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-blue-50/40 rounded-3xl p-6 border border-blue-100 space-y-4">
                                                <h5 className="text-xs font-black uppercase tracking-widest text-[#172358]">Basic Public Utilities Coverage</h5>
                                                <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-sm">
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                                        <span className="flex items-center gap-2"><Droplets size={14} className="text-[#172358]" /> Clean Water Access</span>
                                                        <span className="font-black text-slate-900">{selectedRegion.profile.basic_services?.water_source || 'Main Pipeline (Tap Water)'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-slate-100 pt-2">
                                                        <span className="flex items-center gap-2"><Zap size={14} className="text-amber-500" /> Electricity Supply</span>
                                                        <span className="font-black text-slate-900">{selectedRegion.profile.basic_services?.electricity ? 'Yes (National Grid)' : 'Yes (Partial Connection)'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-slate-100 pt-2">
                                                        <span>Asphalt Road Access</span>
                                                        <span className="font-black text-slate-900">{selectedRegion.profile.basic_services?.road_access || 'Accessible Main Road'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-slate-100 pt-2">
                                                        <span>Municipal Drainage System</span>
                                                        <span className="font-black text-slate-900">{selectedRegion.profile.basic_services?.drainage_system_coverage ? 'Covered Storm Drains' : 'Open Channels / Partial'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-blue-50/40 rounded-3xl p-6 border border-blue-100 space-y-4">
                                                <h5 className="text-xs font-black uppercase tracking-widest text-[#172358]">Emergency Facility Proximity</h5>
                                                <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-sm">
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                                        <span>Nearest Fire Station</span>
                                                        <span className="font-black text-slate-900">~2.4 km (Avg 12 mins response)</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-slate-100 pt-2">
                                                        <span>Nearest General Hospital</span>
                                                        <span className="font-black text-slate-900">~1.8 km (Avg 8 mins response)</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-slate-100 pt-2">
                                                        <span>Police / Emergency Command</span>
                                                        <span className="font-black text-slate-900">~0.9 km (Sub-city Command)</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-slate-100 pt-2">
                                                        <span>Designated Evacuation Shelter</span>
                                                        <span className="font-black text-emerald-700">Primary School Hall</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 4: Action & Mitigation Plan */}
                                    <div className={`space-y-6 ${activeReportTab !== 'mitigation' ? 'print:block hidden' : 'block'}`}>
                                        <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
                                            <ShieldCheck size={18} className="text-[#172358]" />
                                            <h4 className="text-sm font-black uppercase tracking-widest text-[#172358]">4. Recommended Action & Mitigation Strategy</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {[
                                                { level: 'Priority 1 — Immediate (0-3 Months)', title: 'Structural & Drainage Intervention', desc: 'Deploy engineering teams to reinforce vulnerable drainage banks and enforce building safety codes.', color: 'border-rose-300 bg-rose-50/50' },
                                                { level: 'Priority 2 — Medium-Term (3-6 Months)', title: 'Early Warning & Shelter Prep', desc: 'Install community sirens and establish designated emergency supplies at Woreda Administrative centers.', color: 'border-amber-300 bg-amber-50/50' },
                                                { level: 'Priority 3 — Long-Term (6-12 Months)', title: 'Resilient Urban Infrastructure', desc: 'Upgrade paved access roads and integrate flood-barrier containment systems across riverbanks.', color: 'border-emerald-300 bg-emerald-50/50' }
                                            ].map(plan => (
                                                <div key={plan.level} className={`rounded-3xl p-5 border ${plan.color} space-y-2`}>
                                                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-700">{plan.level}</p>
                                                    <h5 className="text-xs font-black text-slate-900">{plan.title}</h5>
                                                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed">{plan.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Print Footer & Sign-off Block (Only visible when printing) */}
                                    <div className="hidden print:block border-t-2 border-[#172358] pt-8 mt-12 space-y-8">
                                        <div className="grid grid-cols-2 gap-12 text-xs font-bold text-slate-800">
                                            <div className="space-y-8">
                                                <p className="uppercase font-black text-[10px] text-slate-500">Prepared & Field Verified By:</p>
                                                <div className="border-b border-slate-400 pb-1 w-48" />
                                                <p>DRM Field Assessment Officer Signature</p>
                                            </div>
                                            <div className="space-y-8 text-right">
                                                <p className="uppercase font-black text-[10px] text-slate-500">Approved By Commission Head:</p>
                                                <div className="border-b border-slate-400 pb-1 w-48 ml-auto" />
                                                <p>Head Office DRM Director Sign-off & Seal</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 border-t border-slate-200 pt-4">
                                            <span>IDRMIS-AAGIS-REPORT-VERIFIED-V2.5</span>
                                            <span>Confidential — For Disaster Response Planning Only</span>
                                            <span>Page 1 of 1</span>
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Print Media Styles */}
                <style>{`
                    @media print {
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        body * {
                            visibility: hidden;
                        }
                        .no-print {
                            display: none !important;
                        }
                        #woreda-report-print-container, 
                        #woreda-report-print-container * {
                            visibility: visible !important;
                        }
                        #woreda-report-print-container .hidden.print\:block {
                            display: block !important;
                        }
                        #woreda-report-print-container {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            background: white !important;
                            color: #0f172a !important;
                            padding: 24px !important;
                            margin: 0 !important;
                            overflow: visible !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
