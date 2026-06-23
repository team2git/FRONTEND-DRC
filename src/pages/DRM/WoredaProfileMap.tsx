import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    ArrowLeft, Search, Filter, Map as MapIcon,
    X, ChevronRight, RefreshCw, GitCompare
} from 'lucide-react';
import { getWoredaProfiles, type WoredaProfile } from '../../api/woredaProfileService';
import { addisAbabaGeoData, RISK_LEVELS, getRiskColor, getRiskLevel } from './addisAbabaGeoData';

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
    { id: 'risk_classification', label: 'DRM Risk Score', category: 'Risk', format: (v: number) => v.toFixed(1), unit: 'score', colors: ['#ffffff', '#000000'] },
    { id: 'hazard_index', label: 'Hazard Index', category: 'Risk', format: (v: number) => v.toFixed(1), unit: 'index', colors: ['#ffffff', '#000000'] },
    { id: 'exposure_index', label: 'Exposure Index', category: 'Risk', format: (v: number) => v.toFixed(1), unit: 'index', colors: ['#ffffff', '#000000'] },
    { id: 'vulnerability_index', label: 'Vulnerability Index', category: 'Risk', format: (v: number) => v.toFixed(1), unit: 'index', colors: ['#ffffff', '#000000'] },
    { id: 'capacity_index', label: 'Capacity Index', category: 'Risk', format: (v: number) => v.toFixed(1), unit: 'index', colors: ['#ffffff', '#000000'] },
    { id: 'total_population', label: 'Total Population', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#f0fdf4', '#15803d'] },
    { id: 'male_population', label: 'Male Population', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#eff6ff', '#1d4ed8'] },
    { id: 'female_population', label: 'Female Population', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#fdf2f8', '#be185d'] },
    { id: 'youth_population', label: 'Youth Population (18-29)', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#fafaf9', '#57534e'] },
    { id: 'household_count', label: 'Household Count', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'HHs', colors: ['#f5f3ff', '#6d28d9'] },
    { id: 'area_size', label: 'Area Size (km²)', category: 'Geography', format: (v: number) => v.toFixed(2), unit: 'km²', colors: ['#f0fdfa', '#0f766e'] },
    { id: 'population_density', label: 'Population Density', category: 'Geography', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people/km²', colors: ['#fff7ed', '#c2410c'] },
    { id: 'schools', label: 'Schools count', category: 'Infrastructure', format: (v: number) => Math.round(v).toString(), unit: 'schools', colors: ['#ecfdf5', '#047857'] },
    { id: 'health_centers', label: 'Health Centers count', category: 'Infrastructure', format: (v: number) => Math.round(v).toString(), unit: 'clinics', colors: ['#f0fdf4', '#166534'] },
    { id: 'water_coverage', label: 'Water Coverage (%)', category: 'Services', format: (v: number) => `${v.toFixed(1)}%`, unit: 'coverage', colors: ['#e0f2fe', '#0369a1'] },
    { id: 'electricity_coverage', label: 'Electricity Coverage (%)', category: 'Services', format: (v: number) => `${v.toFixed(1)}%`, unit: 'coverage', colors: ['#fefce8', '#a16207'] },
    { id: 'road_coverage', label: 'Road Access Coverage (%)', category: 'Services', format: (v: number) => `${v.toFixed(1)}%`, unit: 'coverage', colors: ['#f5f5f4', '#44403c'] },
    { id: 'public_facilities', label: 'Public Service Facilities', category: 'Infrastructure', format: (v: number) => Math.round(v).toString(), unit: 'facilities', colors: ['#faf5ff', '#7c3aed'] },
    { id: 'economic_activities', label: 'Economic Activities Index', category: 'Economy', format: (v: number) => v.toFixed(1), unit: 'index', colors: ['#f0fdf4', '#15803d'] },
    { id: 'vulnerable_groups', label: 'Vulnerable Groups Count', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#fff5f5', '#9b1c1c'] },
    { id: 'idp_population', label: 'IDP Population', category: 'Demographics', format: (v: number) => Math.round(v).toLocaleString(), unit: 'people', colors: ['#fffbeb', '#b45309'] },
    { id: 'social_service_coverage', label: 'Social Service Index', category: 'Services', format: (v: number) => `${v.toFixed(1)}%`, unit: 'index', colors: ['#ecfdf5', '#047857'] }
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

    const [selectedLayer, setSelectedLayer] = useState<string>('total_population');
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
                if (['risk_classification', 'hazard_index', 'exposure_index', 'vulnerability_index', 'capacity_index'].includes(selectedLayer)) {
                    fillColor = getRiskColor(val);
                } else {
                    const range = bounds.max - bounds.min;
                    const factor = range > 0 ? (val - bounds.min) / range : 0.5;
                    fillColor = interpolateColor(activeLayerConfig.colors[0], activeLayerConfig.colors[1], factor);
                }
                const isSelected = selectedRegion && selectedRegion.feature.properties.fullName === prop.fullName;
                return { fillColor, weight: isSelected ? 3.5 : 1.5, opacity: 1, color: isSelected ? '#4f46e5' : '#ffffff', fillOpacity: isSelected ? 0.9 : 0.75, dashArray: isSelected ? '' : '3' };
            },
            onEachFeature: (feature: any, layer: any) => {
                const prop = feature.properties;
                const regionData = filteredRegions.find(r => r.feature.properties.fullName === prop.fullName);
                layer.on({
                    mouseover: (e: any) => { const t = e.target; t.setStyle({ weight: 3, color: '#1e293b', fillOpacity: 0.85 }); t.bringToFront(); if (regionData) setHoveredRegion(regionData); },
                    mouseout: (e: any) => { geoJsonLayer.resetStyle(e.target); setHoveredRegion(null); },
                    click: () => {
                        if (regionData) {
                            setSelectedRegion(regionData);
                            if (compareActive) { if (!compareIdA) setCompareIdA(regionData.profile._id); else if (!compareIdB && compareIdA !== regionData.profile._id) setCompareIdB(regionData.profile._id); }
                        }
                    }
                });
            }
        }).addTo(mapRef.current);
        geoJsonLayerRef.current = geoJsonLayer;
        if (filteredRegions.length > 0 && subcityFilter !== 'ALL') { const b = geoJsonLayer.getBounds(); mapRef.current.fitBounds(b, { padding: [40, 40] }); }
    }, [filteredRegions, bounds, activeLayerConfig, selectedRegion, compareActive]);

    return (
        <div className="h-screen w-screen flex overflow-hidden bg-slate-950 font-outfit text-slate-100 relative">

            {/* Sidebar */}
            <div className={`w-96 bg-white border-r border-slate-200 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)] flex flex-col transition-all duration-300 z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full md:relative md:translate-x-0'}`}>

                {/* Back & Title */}
                <div className="p-6 border-b border-slate-100 space-y-4">
                    <button onClick={() => navigate('/woreda-profile')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-500 font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer">
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm"><MapIcon size={20} /></div>
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
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Filter Sub-City</label>
                            <select value={subcityFilter} onChange={e => setSubcityFilter(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm">
                                <option value="ALL">All Subcities</option>
                                {Object.keys(SUBCITY_CENTERS).map(sc => <option key={sc} value={sc}>{sc}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Polygon Level</label>
                            <select value={viewLevel} onChange={e => setViewLevel(e.target.value as any)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm">
                                <option value="subcity">Sub-City</option>
                                <option value="woreda">Woreda</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Analysis Layer</label>
                        <select value={selectedLayer} onChange={e => setSelectedLayer(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm">
                            {Array.from(new Set(ANALYSIS_LAYERS.map(l => l.category))).map(cat => (
                                <optgroup key={cat} label={cat} className="bg-white text-indigo-600 font-black">
                                    {ANALYSIS_LAYERS.filter(l => l.category === cat).map(l => <option key={l.id} value={l.id} className="text-slate-700 font-bold">{l.label}</option>)}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* Tile Layer Switcher */}
                    <div className="flex gap-1.5">
                        {(['light', 'streets', 'satellite'] as const).map(type => (
                            <button key={type} onClick={() => setTileLayerType(type)} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tileLayerType === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Sidebar Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'none' }}>

                    {/* Compare Tool */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2"><GitCompare size={14} /> Compare Regions</h3>
                            <button onClick={() => { setCompareActive(!compareActive); if (compareActive) { setCompareIdA(''); setCompareIdB(''); } }}
                                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border ${compareActive ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                                {compareActive ? 'Cancel' : 'Active'}
                            </button>
                        </div>
                        {compareActive && (
                            <div className="space-y-3 pt-1">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Region A</label>
                                    <select value={compareIdA} onChange={e => setCompareIdA(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500">
                                        <option value="">Select Region A</option>
                                        {comparisonDropdownItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Region B</label>
                                    <select value={compareIdB} onChange={e => setCompareIdB(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-indigo-500">
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
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-5 text-white space-y-4 shadow-lg shadow-indigo-100">
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Addis Ababa — City Overview</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Population', value: (citySummary.population).toLocaleString() },
                                { label: 'Households', value: (citySummary.households).toLocaleString() },
                                { label: 'Woredas Mapped', value: citySummary.woredas },
                                { label: 'Avg Coverage', value: `${citySummary.avgCoverage}%` }
                            ].map(s => (
                                <div key={s.label} className="bg-white/10 rounded-2xl p-3 border border-white/10">
                                    <p className="text-[8px] font-black text-indigo-200 uppercase tracking-wider mb-1">{s.label}</p>
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
                            const rl = getRiskLevel(riskVal);
                            return (
                                <button key={prop.fullName} onClick={() => setSelectedRegion(r)}
                                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left hover:shadow-sm ${selectedRegion?.feature.properties.fullName === prop.fullName ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: rl.color }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-slate-900 truncate">{prop.fullName}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{activeLayerConfig.format(r.value)} {activeLayerConfig.unit}</p>
                                    </div>
                                    <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    {['risk_classification', 'hazard_index', 'exposure_index', 'vulnerability_index', 'capacity_index'].includes(selectedLayer) && (
                        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Risk Classification Legend</p>
                            {RISK_LEVELS.map(l => (
                                <div key={l.label} className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-md flex-shrink-0" style={{ backgroundColor: l.color }} />
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex-1">{l.label}</span>
                                    <span className="text-[9px] font-bold text-slate-400">{l.min}–{l.max}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                {/* Top Bar */}
                <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-3 pointer-events-none">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="pointer-events-auto w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all">
                        <Filter size={16} />
                    </button>
                    <div className="pointer-events-auto flex-1 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 px-5 py-3 flex items-center gap-3">
                        <MapIcon size={16} className="text-indigo-600 flex-shrink-0" />
                        <p className="text-sm font-black text-slate-900 flex-1">
                            {filteredRegions.length} Regions — <span className="text-indigo-600">{activeLayerConfig.label}</span>
                        </p>
                        <button onClick={loadGISData} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">
                            <RefreshCw size={13} />
                        </button>
                    </div>
                </div>

                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 z-[500] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
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
                            <p className="text-[10px] font-bold text-indigo-600">{activeLayerConfig.label}: <span className="font-black">{activeLayerConfig.format(hoveredRegion.value)} {activeLayerConfig.unit}</span></p>
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
                            className="absolute top-20 right-4 z-[1000] w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                            <div className="bg-indigo-600 px-5 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Selected Region</p>
                                    <p className="text-sm font-black text-white mt-0.5 leading-tight">{selectedRegion.feature.properties.fullName}</p>
                                </div>
                                <button onClick={() => setSelectedRegion(null)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"><X size={14} /></button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="bg-indigo-50 rounded-2xl p-4 text-center">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">{activeLayerConfig.label}</p>
                                    <p className="text-2xl font-black text-indigo-700">{activeLayerConfig.format(selectedRegion.value)}</p>
                                    <p className="text-[9px] font-bold text-indigo-400">{activeLayerConfig.unit}</p>
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
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
