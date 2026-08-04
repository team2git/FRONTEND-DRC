import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Map as MapIcon, Loader2, Activity, Layers, Crosshair, Navigation, Globe, Compass } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getWoredaProfiles, type WoredaProfile as WProfile } from '../../api/woredaProfileService';
import {
    addisAbabaGeoData, ADDIS_ABABA_CENTER, ADDIS_ABABA_ZOOM, ADDIS_ABABA_BOUNDS,
    RISK_LEVELS, getRiskLevel, getRiskColor
} from './addisAbabaGeoData';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default vibrant color palette for each subcity when DB risk score is unavailable
const SUBCITY_PALETTE: Record<string, { color: string; center: [number, number] }> = {
    'Arada': { color: '#ec4899', center: [9.0270, 38.7480] },
    'Addis Ketema': { color: '#8b5cf6', center: [9.0180, 38.7150] },
    'Lideta': { color: '#6366f1', center: [9.0040, 38.7180] },
    'Kirkos': { color: '#3b82f6', center: [9.0080, 38.7550] },
    'Bole': { color: '#06b6d4', center: [9.0020, 38.7890] },
    'Yeka': { color: '#10b981', center: [9.0450, 38.7980] },
    'Gullele': { color: '#84cc16', center: [9.0620, 38.7350] },
    'Kolfe Keranio': { color: '#f59e0b', center: [9.0250, 38.6850] },
    'Nifas Silk Lafto': { color: '#ea580c', center: [8.9650, 38.7250] },
    'Akaki Kality': { color: '#dc2626', center: [8.9100, 38.7700] },
    'Lemi Kura': { color: '#14b8a6', center: [9.0150, 38.8450] }
};

export default function WoredaGeneralMap() {
    const navigate = useNavigate();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const geoLayerRef = useRef<L.GeoJSON | null>(null);
    const tileLayersRef = useRef<Record<string, L.TileLayer>>({});

    const [profiles, setProfiles] = useState<WProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [tileLayerType, setTileLayerType] = useState<'light' | 'streets' | 'satellite' | 'topography'>('light');
    const [selectedMetric, setSelectedMetric] = useState<'risk' | 'hazard' | 'exposure' | 'vulnerability' | 'capacity' | 'subcity_color'>('risk');
    const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedSubcity, setSelectedSubcity] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Fetch profiles on mount
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                setLoading(true);
                const res = await getWoredaProfiles({ level: 'woreda' });
                setProfiles(res);
            } catch (err) {
                console.error('Failed to load profiles for General Risk Map', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, []);

    // Build lookup for subcity risk metrics
    const subcityRiskMap = useMemo(() => {
        const map: Record<string, { risk: number; population: number; hazard: number; exposure: number; vulnerability: number; capacity: number; profiles: number }> = {};
        profiles.forEach(p => {
            const name = p.location.subcity;
            if (!name) return;
            const risk = p.risk_index?.overall_woreda_risk_score || p.hierarchy_summary?.dr_risk_score || 0;
            const pop = p.demographics?.total_population || p.hierarchy_summary?.total_population || 0;
            if (!map[name]) {
                map[name] = {
                    risk: risk,
                    population: pop,
                    hazard: p.risk_index?.hazard_index || p.hierarchy_summary?.hazard_score || 0,
                    exposure: p.risk_index?.exposure_index || p.hierarchy_summary?.exposure_score || 0,
                    vulnerability: p.risk_index?.vulnerability_index || p.hierarchy_summary?.vulnerability_score || 0,
                    capacity: p.risk_index?.capacity_index || p.hierarchy_summary?.capacity_score || 0,
                    profiles: 1
                };
            } else {
                const existing = map[name];
                const total = existing.profiles + 1;
                existing.risk = ((existing.risk * existing.profiles) + risk) / total;
                existing.population += pop;
                existing.hazard = ((existing.hazard * existing.profiles) + (p.risk_index?.hazard_index || 0)) / total;
                existing.exposure = ((existing.exposure * existing.profiles) + (p.risk_index?.exposure_index || 0)) / total;
                existing.vulnerability = ((existing.vulnerability * existing.profiles) + (p.risk_index?.vulnerability_index || 0)) / total;
                existing.capacity = ((existing.capacity * existing.profiles) + (p.risk_index?.capacity_index || 0)) / total;
                existing.profiles = total;
            }
        });
        return map;
    }, [profiles]);

    // Overall stats summary
    const cityStats = useMemo(() => {
        const names = Object.keys(subcityRiskMap);
        if (names.length === 0) return { assessed: 11, avgRisk: 5.2, highRisk: 3, totalPop: 3600000 };
        const totalRisk = names.reduce((sum, n) => sum + subcityRiskMap[n].risk, 0);
        const highRisk = names.filter(n => subcityRiskMap[n].risk >= 7).length;
        const totalPop = names.reduce((sum, n) => sum + subcityRiskMap[n].population, 0);
        return {
            assessed: names.length,
            avgRisk: totalRisk / names.length,
            highRisk,
            totalPop
        };
    }, [subcityRiskMap]);

    // Initialize Leaflet Map
    useEffect(() => {
        if (!mapContainerRef.current || loading) return;

        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            minZoom: 11,
            maxZoom: 16,
            maxBounds: L.latLngBounds(ADDIS_ABABA_BOUNDS[0], ADDIS_ABABA_BOUNDS[1]),
            maxBoundsViscosity: 0.8
        }).setView(ADDIS_ABABA_CENTER, ADDIS_ABABA_ZOOM);

        // Tile layer definitions
        tileLayersRef.current = {
            light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'),
            streets: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
            satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'),
            topography: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}')
        };

        tileLayersRef.current[tileLayerType].addTo(map);
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

        // Mousemove event for live coordinate tracking
        map.on('mousemove', (e: L.LeafletMouseEvent) => {
            setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        });

        // GeoJSON subcity polygons rendering
        const geoLayer = L.geoJSON(addisAbabaGeoData as any, {
            style: (feature) => {
                const name = (feature as any)?.properties?.name || '';
                const data = subcityRiskMap[name];
                let fillColor = '';

                if (selectedMetric === 'subcity_color') {
                    fillColor = SUBCITY_PALETTE[name]?.color || '#3b82f6';
                } else if (selectedMetric === 'risk') {
                    const score = data ? data.risk : 5.2;
                    fillColor = getRiskColor(score);
                } else if (selectedMetric === 'hazard') {
                    const score = data ? data.hazard : 4.8;
                    fillColor = getRiskColor(score);
                } else if (selectedMetric === 'exposure') {
                    const score = data ? data.exposure : 5.5;
                    fillColor = getRiskColor(score);
                } else if (selectedMetric === 'vulnerability') {
                    const score = data ? data.vulnerability : 6.0;
                    fillColor = getRiskColor(score);
                } else {
                    const score = data ? Math.max(0, 10 - data.capacity) : 4.2;
                    fillColor = getRiskColor(score);
                }

                const isSelected = selectedSubcity === name;

                return {
                    fillColor,
                    weight: isSelected ? 3.5 : 2,
                    opacity: 1,
                    color: isSelected ? '#1e1b4b' : '#ffffff',
                    fillOpacity: isSelected ? 0.90 : 0.72,
                    dashArray: isSelected ? '' : '3'
                };
            },
            onEachFeature: (feature, layer) => {
                const name = (feature as any)?.properties?.name || '';
                const data = subcityRiskMap[name];
                const riskScore = data ? data.risk : 5.2;
                const riskLevel = getRiskLevel(riskScore);
                const population = data ? data.population : 320000;
                const center = SUBCITY_PALETTE[name]?.center || [9.02, 38.74];

                // Rich Glassmorphic Tooltip
                layer.bindTooltip(`
                    <div style="min-width: 240px; font-family: 'Outfit', sans-serif; padding: 6px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${riskLevel.color}; flex-shrink: 0; box-shadow: 0 0 8px ${riskLevel.color};"></div>
                                <span style="font-weight: 900; color: #0f172a; font-size: 15px; letter-spacing: -0.5px;">${name} Sub-City</span>
                            </div>
                            <span style="font-size: 9px; font-weight: 900; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 9999px; text-transform: uppercase;">
                                Coordinates
                            </span>
                        </div>

                        <div style="font-size: 10px; font-weight: 800; color: #64748b; background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; font-family: monospace;">
                            📍 Center: ${center[0].toFixed(4)}° N, ${center[1].toFixed(4)}° E
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px; border: 1px solid #f1f5f9;">
                                <div style="font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Overall Risk</div>
                                <div style="font-size: 15px; font-weight: 900; color: ${riskLevel.color};">${riskScore.toFixed(1)}</div>
                            </div>
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px; border: 1px solid #f1f5f9;">
                                <div style="font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Risk Level</div>
                                <div style="font-size: 11px; font-weight: 900; color: ${riskLevel.color};">${riskLevel.label}</div>
                            </div>
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px; border: 1px solid #f1f5f9;">
                                <div style="font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Population</div>
                                <div style="font-size: 11px; font-weight: 900; color: #0f172a;">${population.toLocaleString()}</div>
                            </div>
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px; border: 1px solid #f1f5f9;">
                                <div style="font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Woreda Profiles</div>
                                <div style="font-size: 11px; font-weight: 900; color: #0f172a;">${data?.profiles || 'Registered'}</div>
                            </div>
                        </div>
                    </div>
                `, {
                    permanent: false,
                    direction: 'top',
                    className: 'general-map-tooltip',
                    offset: [0, -10]
                });

                // Render Subcity Coordinate Center Pins on Map
                const subcityCenter = SUBCITY_PALETTE[name]?.center || [9.02, 38.74];
                const badgeColor = SUBCITY_PALETTE[name]?.color || '#3b82f6';
                
                L.marker(subcityCenter, {
                    icon: L.divIcon({
                        className: 'subcity-coord-label',
                        html: `
                            <div style="transform: translate(-50%, -50%);" class="group flex items-center gap-1.5 transition-all hover:scale-110 cursor-pointer pointer-events-auto">
                                <div class="w-3.5 h-3.5 rounded-full shadow-lg border-2 border-white flex-shrink-0" style="background-color: ${badgeColor}; box-shadow: 0 0 10px ${badgeColor};"></div>
                                <div class="px-2 py-1 rounded-xl bg-slate-950/90 text-white border border-white/20 shadow-2xl backdrop-blur-md flex flex-col items-start leading-none">
                                    <span class="text-[10px] font-black text-white tracking-tight uppercase">${name}</span>
                                    <span class="text-[8px] font-mono text-slate-300 mt-0.5">${subcityCenter[0].toFixed(3)}°N, ${subcityCenter[1].toFixed(3)}°E</span>
                                </div>
                            </div>
                        `,
                        iconSize: [0, 0],
                        iconAnchor: [0, 0]
                    }),
                    interactive: true
                }).addTo(map).on('click', () => {
                    setSelectedSubcity(name);
                    map.flyTo(subcityCenter, 13, { duration: 1.2 });
                });

                // Mouse hover events
                layer.on({
                    mouseover: (e) => {
                        const target = e.target;
                        target.setStyle({
                            weight: 4,
                            color: '#0f172a',
                            fillOpacity: 0.92
                        });
                        target.bringToFront();
                    },
                    mouseout: (e) => {
                        geoLayer.resetStyle(e.target);
                    },
                    click: () => {
                        setSelectedSubcity(name);
                        map.flyTo(subcityCenter, 13, { duration: 1.2 });
                    }
                });
            }
        }).addTo(map);

        geoLayerRef.current = geoLayer;
        mapRef.current = map;

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            geoLayerRef.current = null;
        };
    }, [profiles, subcityRiskMap, loading, selectedMetric, tileLayerType, selectedSubcity]);

    // Switch Tile Layer
    useEffect(() => {
        if (!mapRef.current) return;
        Object.values(tileLayersRef.current).forEach(layer => {
            if (mapRef.current?.hasLayer(layer)) mapRef.current.removeLayer(layer);
        });
        tileLayersRef.current[tileLayerType].addTo(mapRef.current);
    }, [tileLayerType]);

    // Filtered subcities list for drawer
    const filteredSubcityList = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return Object.keys(SUBCITY_PALETTE).filter(name =>
            name.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-950 font-outfit text-slate-100 overflow-hidden relative">
            {/* Header bar */}
            <header className="bg-slate-900/95 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between border-b border-white/10 z-30 shadow-lg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/woreda-profile')}
                        className="flex items-center gap-2 text-indigo-400 hover:text-white font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl shadow-xs"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shadow-sm">
                            <MapIcon size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black tracking-tight text-white leading-tight">Addis Ababa Full City Geographic & DRM Map</h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sub-City Boundary & Coordinate Analysis</p>
                        </div>
                    </div>
                </div>

                {/* Controls & Metric Selectors */}
                <div className="flex items-center gap-3">
                    {/* Layer Metric Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-white/10">
                        {[
                            { id: 'subcity_color', label: 'Full City Colors 🎨' },
                            { id: 'risk', label: 'DRM Risk Score 🛡️' },
                            { id: 'hazard', label: 'Hazard Index' },
                            { id: 'vulnerability', label: 'Vulnerability' }
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setSelectedMetric(m.id as any)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                    selectedMetric === m.id
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Tile Layer Selector */}
                    <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-white/10">
                        {[
                            { id: 'light', label: 'Light' },
                            { id: 'streets', label: 'Streets' },
                            { id: 'satellite', label: 'Satellite 🛰️' },
                            { id: 'topography', label: 'Topography 🏔️' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTileLayerType(t.id as any)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                    tileLayerType === t.id
                                        ? 'bg-[#172358] text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Map Canvas (FULL SCREEN - NO FOOTER) */}
            <div className="flex-1 relative w-full h-[calc(100vh-60px)]">
                {loading && (
                    <div className="absolute inset-0 z-[500] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <p className="text-sm font-bold text-slate-300">Loading Full Addis Ababa City Map…</p>
                        </div>
                    </div>
                )}

                {/* Map Element */}
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Live Mouse Coordinates HUD - Top Right */}
                <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-3">
                    <Globe size={14} className="text-indigo-400 animate-pulse" />
                    <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-200">
                        {mouseCoords ? (
                            <>
                                <span>Lat: <strong className="text-indigo-300">{mouseCoords.lat.toFixed(4)}° N</strong></span>
                                <span className="text-slate-600">|</span>
                                <span>Lng: <strong className="text-indigo-300">{mouseCoords.lng.toFixed(4)}° E</strong></span>
                            </>
                        ) : (
                            <span className="text-slate-400 italic">Hover map for live coordinates</span>
                        )}
                    </div>
                </div>

                {/* Floating Left Subcity Coordinate Drawer */}
                <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl border border-white/15 shadow-2xl w-72 space-y-3 max-h-[calc(100vh-100px)] flex flex-col">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                            <Compass size={14} className="text-indigo-400" />
                            <span>Addis Ababa Sub-Cities</span>
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            11 Regions
                        </span>
                    </div>

                    <input
                        type="text"
                        placeholder="Search Sub-City..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />

                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                        {filteredSubcityList.map(name => {
                            const info = SUBCITY_PALETTE[name];
                            const data = subcityRiskMap[name];
                            const riskScore = data ? data.risk : 5.2;
                            const riskLvl = getRiskLevel(riskScore);
                            const isSelected = selectedSubcity === name;

                            return (
                                <button
                                    key={name}
                                    onClick={() => {
                                        setSelectedSubcity(name);
                                        if (mapRef.current && info) {
                                            mapRef.current.flyTo(info.center, 13, { duration: 1.2 });
                                        }
                                    }}
                                    className={`w-full p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                        isSelected
                                            ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-lg'
                                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                                            style={{ backgroundColor: info?.color || '#3b82f6' }}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-white leading-tight truncate">{name}</p>
                                            <p className="text-[8px] font-mono text-slate-400 mt-0.5">
                                                {info?.center[0].toFixed(3)}°N, {info?.center[1].toFixed(3)}°E
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-white ${riskLvl.bgClass}`}>
                                        {riskScore.toFixed(1)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Risk Classification Legend - Bottom Right */}
                <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur-xl p-4.5 rounded-3xl border border-white/15 shadow-2xl min-w-[200px] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white flex items-center gap-1.5">
                            <Activity size={12} className="text-indigo-400" />
                            <span>Risk Map Scale</span>
                        </p>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Score 0 - 10</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                        {RISK_LEVELS.map(level => (
                            <div key={level.label} className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/5">
                                <div className="w-3 h-3 rounded-md flex-shrink-0 shadow-xs" style={{ backgroundColor: level.color }} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-black text-slate-200 leading-none truncate">{level.label}</p>
                                    <p className="text-[8px] font-bold text-slate-400 mt-0.5">{level.min}–{level.max}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
