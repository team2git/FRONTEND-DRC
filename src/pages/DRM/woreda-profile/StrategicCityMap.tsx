import React, { useEffect, useRef, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Activity, Info } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type WoredaProfile as WProfile } from '../../../api/woredaProfileService';
import {
    addisAbabaGeoData, ADDIS_ABABA_CENTER, ADDIS_ABABA_ZOOM, ADDIS_ABABA_BOUNDS,
    RISK_LEVELS, getRiskLevel, getRiskColor
} from '../addisAbabaGeoData';

export const StrategicCityMap: React.FC<{ profiles: WProfile[] }> = ({ profiles }) => {
    const mapRef = useRef<L.Map | null>(null);
    const geoLayerRef = useRef<L.GeoJSON | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredSubCity, setHoveredSubCity] = useState<string | null>(null);

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
                // Average scores across multiple profiles for same sub-city
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

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            zoomControl: false,
            attributionControl: false,
            minZoom: 11,
            maxZoom: 15,
            maxBounds: L.latLngBounds(ADDIS_ABABA_BOUNDS[0], ADDIS_ABABA_BOUNDS[1]),
            maxBoundsViscosity: 1.0
        }).setView(ADDIS_ABABA_CENTER, ADDIS_ABABA_ZOOM);

        // Light-themed tile layer for better contrast with colored polygons
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Add zoom control to bottom-left
        L.control.zoom({ position: 'bottomleft' }).addTo(map);

        // Create GeoJSON layer with choropleth coloring
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
                    fillOpacity: 0.7
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

                // Sub-city name labels at center
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

                // Hover effects
                layer.on({
                    mouseover: (e) => {
                        const target = e.target;
                        target.setStyle({
                            weight: 3,
                            color: '#1e293b',
                            fillOpacity: 0.9
                        });
                        target.bringToFront();
                        setHoveredSubCity(name);
                    },
                    mouseout: (e) => {
                        geoLayer.resetStyle(e.target);
                        setHoveredSubCity(null);
                    }
                });
            }
        }).addTo(map);

        geoLayerRef.current = geoLayer;
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            geoLayerRef.current = null;
        };
    }, [profiles, subcityRiskMap]);

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

    return (
        <div className="relative w-full rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl bg-white">
            {/* Map Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <MapPin size={22} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-white tracking-tight">Addis Ababa Risk Map</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sub-City Choropleth &middot; Disaster Risk Distribution</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{cityStats.assessed} Sub-cities</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Avg Risk: <span className={`${cityStats.avgRisk >= 7 ? 'text-rose-400' : cityStats.avgRisk >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>{cityStats.avgRisk.toFixed(1)}</span></span>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative h-[550px]">
                <div ref={containerRef} className="w-full h-full" />

                {/* Risk Legend - Bottom Right */}
                <div className="absolute bottom-6 right-6 z-[1000] bg-white/95 backdrop-blur-xl p-5 rounded-3xl border border-slate-200 shadow-2xl max-w-[200px]">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-2">
                        <Activity size={12} className="text-indigo-600" />
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
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{level.label}</span>
                                    <span className="text-[9px] font-bold text-slate-400">{level.min}&ndash;{level.max}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-3 rounded-sm bg-slate-300 flex-shrink-0" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">No Data</span>
                        </div>
                    </div>
                </div>

                {/* Hovered Sub-city Quick Info - Top Right */}
                <AnimatePresence>
                    {hoveredSubCity && subcityRiskMap[hoveredSubCity] && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute top-6 right-6 z-[1000] bg-slate-900/95 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl min-w-[220px]"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getRiskColor(subcityRiskMap[hoveredSubCity].risk) }}
                                />
                                <h5 className="text-sm font-black text-white tracking-tight">{hoveredSubCity}</h5>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Risk</p>
                                    <p className="text-lg font-black" style={{ color: getRiskColor(subcityRiskMap[hoveredSubCity].risk) }}>
                                        {subcityRiskMap[hoveredSubCity].risk.toFixed(1)}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pop</p>
                                    <p className="text-lg font-black text-white">
                                        {subcityRiskMap[hoveredSubCity].population.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg"
                                    style={{
                                        backgroundColor: getRiskColor(subcityRiskMap[hoveredSubCity].risk) + '22',
                                        color: getRiskColor(subcityRiskMap[hoveredSubCity].risk)
                                    }}
                                >
                                    {getRiskLevel(subcityRiskMap[hoveredSubCity].risk).label}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Map Attribution */}
                <div className="absolute bottom-6 left-6 z-[1000]">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400">Addis Ababa City Administration &middot; PDRM</p>
                    </div>
                </div>
            </div>

            {/* Bottom Summary Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-white border-t border-slate-100 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {[
                        { label: 'Total Population', value: cityStats.totalPop.toLocaleString(), color: 'text-indigo-600' },
                        { label: 'High Risk Areas', value: `${cityStats.highRisk} sub-cities`, color: 'text-rose-600' },
                        { label: 'Avg Risk Score', value: cityStats.avgRisk.toFixed(1), color: cityStats.avgRisk >= 7 ? 'text-rose-600' : cityStats.avgRisk >= 4 ? 'text-amber-600' : 'text-emerald-600' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            {i > 0 && <div className="w-px h-6 bg-slate-200" />}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{item.label}</p>
                                <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                    <Info size={12} />
                    <span>Hover over sub-cities for detailed risk breakdown</span>
                </div>
            </div>
        </div>
    );
};
export default StrategicCityMap;
