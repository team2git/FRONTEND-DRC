import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Map as MapIcon, Loader2, Activity, Info } from 'lucide-react';
import { getWoredaProfiles, type WoredaProfile as WProfile } from '../../api/woredaProfileService';
import {
    addisAbabaGeoData, ADDIS_ABABA_CENTER, ADDIS_ABABA_ZOOM, ADDIS_ABABA_BOUNDS,
    RISK_LEVELS, getRiskLevel, getRiskColor
} from './addisAbabaGeoData';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function WoredaGeneralMap() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const geoLayerRef = useRef<L.GeoJSON | null>(null);
    
    const [profiles, setProfiles] = useState<WProfile[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch all profiles on mount
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                setLoading(true);
                const res = await getWoredaProfiles();
                setProfiles(res);
            } catch (err) {
                console.error('Failed to load profiles for General Risk Map', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, []);

    // Build a lookup: subcity name -> risk data from profiles
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

    // Compute overall city stats
    const cityStats = useMemo(() => {
        const names = Object.keys(subcityRiskMap);
        if (names.length === 0) return { assessed: 0, avgRisk: 0, highRisk: 0, totalPop: 0 };
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

    // Initialize Map and Render Layers
    useEffect(() => {
        if (!mapContainerRef.current || loading) return;

        // Cleanup existing map if present
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            minZoom: 11,
            maxZoom: 15,
            maxBounds: L.latLngBounds(ADDIS_ABABA_BOUNDS[0], ADDIS_ABABA_BOUNDS[1]),
            maxBoundsViscosity: 1.0
        }).setView(ADDIS_ABABA_CENTER, ADDIS_ABABA_ZOOM);

        L.tileLayer('https://{s.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        L.control.zoom({ position: 'bottomleft' }).addTo(map);

        const geoLayer = L.geoJSON(addisAbabaGeoData as any, {
            style: (feature) => {
                const name = (feature as any)?.properties?.name || '';
                const data = subcityRiskMap[name];
                const riskScore = data ? data.risk : 0;
                const fillColor = data ? getRiskColor(riskScore) : '#94a3b8';

                return {
                    fillColor,
                    weight: 2,
                    opacity: 1,
                    color: '#ffffff',
                    dashArray: '',
                    fillOpacity: 0.75
                };
            },
            onEachFeature: (feature, layer) => {
                const name = (feature as any)?.properties?.name || '';
                const data = subcityRiskMap[name];
                const riskScore = data ? data.risk : 0;
                const riskLevel = getRiskLevel(riskScore);
                const population = data ? data.population : 0;

                // Tooltip
                layer.bindTooltip(`
                    <div style="min-width: 220px; font-family: 'Outfit', sans-serif; padding: 4px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${riskLevel.color}; flex-shrink: 0;"></div>
                            <span style="font-weight: 900; color: #0f172a; font-size: 14px; letter-spacing: -0.5px;">${name}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px;">
                                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Risk Score</div>
                                <div style="font-size: 16px; font-weight: 900; color: ${riskLevel.color};">${riskScore.toFixed(1)}</div>
                            </div>
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px;">
                                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Status</div>
                                <div style="font-size: 11px; font-weight: 900; color: ${riskLevel.color};">${riskLevel.label}</div>
                            </div>
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px;">
                                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Population</div>
                                <div style="font-size: 12px; font-weight: 900; color: #0f172a;">${population.toLocaleString()}</div>
                            </div>
                            <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px;">
                                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Profiles</div>
                                <div style="font-size: 12px; font-weight: 900; color: #0f172a;">${data?.profiles || 0}</div>
                            </div>
                        </div>
                        ${data ? `
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
                            <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Risk Components</div>
                            <div style="display: flex; gap: 4px;">
                                <div style="flex: 1; text-align: center; background: #f8fafc; border-radius: 6px; padding: 4px; border: 1px solid #f1f5f9;">
                                    <div style="font-size: 10px; font-weight: 900; color: ${getRiskColor(data.hazard)};">H</div>
                                    <div style="font-size: 9px; color: #64748b; font-weight: 800;">${data.hazard.toFixed(1)}</div>
                                </div>
                                <div style="flex: 1; text-align: center; background: #f8fafc; border-radius: 6px; padding: 4px; border: 1px solid #f1f5f9;">
                                    <div style="font-size: 10px; font-weight: 900; color: ${getRiskColor(data.exposure)};">E</div>
                                    <div style="font-size: 9px; color: #64748b; font-weight: 800;">${data.exposure.toFixed(1)}</div>
                                </div>
                                <div style="flex: 1; text-align: center; background: #f8fafc; border-radius: 6px; padding: 4px; border: 1px solid #f1f5f9;">
                                    <div style="font-size: 10px; font-weight: 900; color: ${getRiskColor(data.vulnerability)};">V</div>
                                    <div style="font-size: 9px; color: #64748b; font-weight: 800;">${data.vulnerability.toFixed(1)}</div>
                                </div>
                                <div style="flex: 1; text-align: center; background: #f8fafc; border-radius: 6px; padding: 4px; border: 1px solid #f1f5f9;">
                                    <div style="font-size: 10px; font-weight: 900; color: ${getRiskColor(data.capacity)};">C</div>
                                    <div style="font-size: 9px; color: #64748b; font-weight: 800;">${data.capacity.toFixed(1)}</div>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `, {
                    permanent: false,
                    direction: 'top',
                    className: 'risk-map-tooltip',
                    offset: [0, -10]
                });

                // Add subcity label markers
                const bounds = (layer as any).getBounds?.();
                if (bounds) {
                    const center = bounds.getCenter();
                    L.marker(center, {
                        icon: L.divIcon({
                            className: 'subcity-label',
                            html: `<div style="
                                font-family: 'Outfit', sans-serif;
                                font-weight: 900;
                                font-size: 10px;
                                color: #0f172a;
                                text-shadow: 0 0 4px rgba(255,255,255,0.95), 0 0 8px rgba(255,255,255,0.8);
                                white-space: nowrap;
                                text-transform: uppercase;
                                letter-spacing: 1.5px;
                                pointer-events: none;
                            ">${name}</div>`,
                            iconSize: [0, 0],
                            iconAnchor: [0, 0]
                        }),
                        interactive: false
                    }).addTo(map);
                }

                // Mouse handlers
                layer.on({
                    mouseover: (e) => {
                        const target = e.target;
                        target.setStyle({
                            weight: 3.5,
                            color: '#1e293b',
                            fillOpacity: 0.9
                        });
                        target.bringToFront();
                    },
                    mouseout: (e) => {
                        geoLayer.resetStyle(e.target);
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
    }, [profiles, subcityRiskMap, loading]);

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-950 font-outfit text-slate-100 overflow-hidden relative">
            {/* Header bar */}
            <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-4 flex items-center justify-between border-b border-white/5 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.close()} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                        <ArrowLeft size={14} /> Close Map
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-sm">
                            <MapIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-tight text-white">Addis Ababa General Risk Map</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sub-City DRM Risk Distribution Choropleth</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-2 flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{cityStats.assessed} Sub-cities</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Avg Risk: <span className={`${cityStats.avgRisk >= 7 ? 'text-rose-400' : cityStats.avgRisk >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>{cityStats.avgRisk.toFixed(1)}</span></span>
                    </div>
                </div>
            </header>

            {/* Map Area */}
            <div className="flex-1 relative">
                {loading && (
                    <div className="absolute inset-0 z-[500] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                            <p className="text-sm font-bold text-slate-300">Loading General DRM Layer…</p>
                        </div>
                    </div>
                )}

                {/* Map Div */}
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Risk Legend - Bottom Right */}
                <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl max-w-[220px]">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white mb-4 flex items-center gap-2">
                        <Activity size={12} className="text-indigo-400" />
                        Risk Classification
                    </p>
                    <div className="space-y-1.5">
                        {RISK_LEVELS.map(level => (
                            <div key={level.label} className="flex items-center gap-3 group cursor-default">
                                <div
                                    className="w-5 h-3 rounded-sm flex-shrink-0 transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: level.color }}
                                />
                                <div className="flex items-center justify-between flex-1 gap-2">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{level.label}</span>
                                    <span className="text-[9px] font-bold text-slate-400">{level.min}&ndash;{level.max}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-3 rounded-sm bg-slate-600 flex-shrink-0" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">No Data Available</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer summary bar */}
            <footer className="bg-slate-900 border-t border-white/5 px-8 py-4 flex items-center justify-between z-30">
                <div className="flex items-center gap-6">
                    {[
                        { label: 'Assessed Population', value: cityStats.totalPop.toLocaleString(), color: 'text-indigo-400' },
                        { label: 'High Risk Zones', value: `${cityStats.highRisk} sub-cities`, color: 'text-rose-400' },
                        { label: 'Avg DRM Risk Score', value: cityStats.avgRisk.toFixed(1), color: cityStats.avgRisk >= 7 ? 'text-rose-400' : cityStats.avgRisk >= 4 ? 'text-amber-400' : 'text-emerald-400' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            {i > 0 && <div className="w-px h-6 bg-white/10" />}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{item.label}</p>
                                <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                    <Info size={12} />
                    <span>Click on any sub-city boundary on the map for detailed metrics.</span>
                </div>
            </footer>
        </div>
    );
}
