import React, { useEffect, useRef, useState } from 'react';
import { MapIncident, ThemeOption } from '../types/dashboardTypes';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  Layers,
  X,
  ChevronRight,
  Search,
  Building2,
  Users,
  AlertTriangle,
  Flame,
  Eye,
  Palette,
} from 'lucide-react';
import { addisAbabaGeoData, RISK_LEVELS, getRiskColor, getRiskLevel } from '../../../pages/DRM/addisAbabaGeoData';
import { getWoredaProfiles, WoredaProfile } from '../../../api/woredaProfileService';
import { useNavigate } from 'react-router';

interface Props {
  incidents: MapIncident[];
  loading: boolean;
  theme?: ThemeOption;
}

type TileType = 'auto' | 'blue_black' | 'light' | 'satellite';

export const LiveMap: React.FC<Props> = ({ incidents, loading, theme = 'light' }) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';
  const isDarkGrey = theme === 'dark_grey';
  const isSolar = theme === 'solar';

  // Tile selection state (Default is auto, which syncs with Dashboard theme)
  const [selectedTile, setSelectedTile] = useState<TileType>('auto');
  
  // Layer visibility toggles — boundaries and heatmap are opt-in
  const [showBoundaries, setShowBoundaries] = useState<boolean>(false);
  const [showRiskHeatmap, setShowRiskHeatmap] = useState<boolean>(false);
  const [showIncidents, setShowIncidents] = useState<boolean>(true);

  // Woreda profiles fetched from system backend
  const [woredaProfiles, setWoredaProfiles] = useState<WoredaProfile[]>([]);

  // Selected Region / Incident for Detailed GIS Report Drawer
  const [selectedRegion, setSelectedRegion] = useState<{
    name: string;
    subcity: string;
    riskScore: number;
    riskLevel: string;
    population: number;
    households: number;
    hazards: Array<{ name: string; score: number }>;
    incidents: MapIncident[];
    profileId?: string;
  } | null>(null);

  // Search query for woreda highlight
  const [mapSearch, setMapSearch] = useState<string>('');

  // Fetch Woreda Profiles from backend system
  useEffect(() => {
    let isMounted = true;
    const loadProfiles = async () => {
      try {
        const data = await getWoredaProfiles({ level: 'woreda' });
        if (isMounted && Array.isArray(data)) {
          setWoredaProfiles(data);
        }
      } catch (err) {
        console.error('Failed to load woreda profiles for LiveMap:', err);
      }
    };
    loadProfiles();
    return () => {
      isMounted = false;
    };
  }, []);

  // Map tile URL resolver based on theme and tile selection
  const getTileUrl = () => {
    if (selectedTile === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    if (selectedTile === 'light' || (selectedTile === 'auto' && isLight)) {
      return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }
    // Default dark blue-black tiles for blue_black, dark, dark_grey, solar
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  // Initialize Leaflet map instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Addis Ababa center
    const map = L.map(mapContainerRef.current, {
      center: [9.0200, 38.7480],
      zoom: 12,
      zoomControl: false,
    });

    // Custom zoom control position
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer
    const tileLayer = L.tileLayer(getTileUrl(), {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Create layer groups
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    // Trigger invalidateSize after initial render
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    // Attach ResizeObserver to keep Leaflet synchronized with grid resizing
    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Tile Layer when Dashboard Theme or Tile selector changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getTileUrl());
    mapInstanceRef.current.invalidateSize();
  }, [theme, selectedTile]);

  // Handle Sub-city Polygons & GeoJSON Boundaries Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove existing GeoJSON layer if any
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    if (!showBoundaries) return;

    const geoJsonLayer = L.geoJSON(addisAbabaGeoData as any, {
      style: (feature) => {
        const subcityName = feature?.properties?.name || '';
        
        // Find matching profiles for this subcity
        const matching = woredaProfiles.filter((p) => p.location?.subcity?.toLowerCase() === subcityName.toLowerCase());
        const avgScore = matching.length > 0
          ? matching.reduce((sum, p) => sum + (p.risk_index?.overall_woreda_risk_score || p.hierarchy_summary?.dr_risk_score || 5), 0) / matching.length
          : 4.5;

        const defaultFillColor = isLight
          ? '#e2e8f0'
          : isBlueBlack
          ? '#0b1329'
          : isDarkGrey
          ? '#171717'
          : isSolar
          ? '#1c1917'
          : '#0f172a';

        const fillColor = showRiskHeatmap ? getRiskColor(avgScore) : defaultFillColor;
        const fillOpacity = showRiskHeatmap ? 0.55 : 0.65;
        const borderColor = isLight ? '#2563eb' : isBlueBlack ? '#3b82f6' : isSolar ? '#d97706' : '#60a5fa';

        return {
          fillColor,
          fillOpacity,
          color: borderColor,
          weight: 2,
          dashArray: '3',
        };
      },
      onEachFeature: (feature, layer) => {
        const subcityName = feature?.properties?.name || 'Subcity';
        const subcityIncidents = incidents.filter(
          (inc) => inc.locationName?.toLowerCase().includes(subcityName.toLowerCase()) || inc.region?.toLowerCase().includes(subcityName.toLowerCase())
        );

        const matchingProfiles = woredaProfiles.filter(
          (p) => p.location?.subcity?.toLowerCase() === subcityName.toLowerCase()
        );

        const totalPop = matchingProfiles.reduce((s, p) => s + (p.demographics?.total_population || 0), 0) || 285000;
        const totalHHs = matchingProfiles.reduce((s, p) => s + (p.demographics?.total_households || 0), 0) || 68000;
        const avgRiskScore = matchingProfiles.length > 0
          ? matchingProfiles.reduce((sum, p) => sum + (p.risk_index?.overall_woreda_risk_score || p.hierarchy_summary?.dr_risk_score || 5), 0) / matchingProfiles.length
          : 5.2;

        const riskObj = getRiskLevel(avgRiskScore);

        // Tooltip on hover
        layer.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 2px 6px; color: #0f172a;">
            <strong style="color: ${riskObj.color};">${subcityName} Sub-City</strong><br/>
            <span>Risk Score: <strong>${riskObj.label}</strong> (${avgRiskScore.toFixed(1)})</span><br/>
            <span>Active Incidents: <strong>${subcityIncidents.length}</strong></span>
          </div>
        `, { sticky: true });

        // Highlight & Click listener
        layer.on({
          mouseover: (e) => {
            const targetLayer = e.target;
            targetLayer.setStyle({
              weight: 3.5,
              color: '#ffffff',
              fillOpacity: 0.85,
            });
          },
          mouseout: (e) => {
            if (geoJsonLayerRef.current) {
              geoJsonLayerRef.current.resetStyle(e.target);
            }
          },
          click: () => {
            // Select region to open GIS Detail Report Side Drawer
            const hazardsList = matchingProfiles.flatMap((p) => p.hazards || []).map((h: any) => ({
              name: h.hazard_name || 'Flood / Urban Risk',
              score: (parseFloat(h.severity || '0') * parseFloat(h.frequency || '0')) || 5,
            })).slice(0, 4);

            setSelectedRegion({
              name: `${subcityName} Sub-City`,
              subcity: subcityName,
              riskScore: avgRiskScore,
              riskLevel: riskObj.label,
              population: totalPop,
              households: totalHHs,
              hazards: hazardsList.length > 0 ? hazardsList : [
                { name: 'Urban Flash Flood', score: 6.5 },
                { name: 'Structural Fire Risk', score: 5.2 },
              ],
              incidents: subcityIncidents,
              profileId: matchingProfiles[0]?._id,
            });
          },
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = geoJsonLayer;
  }, [showBoundaries, showRiskHeatmap, woredaProfiles, incidents, theme]);

  // Handle Real-Time Incident Markers Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layerGroup = markersLayerRef.current;
    layerGroup.clearLayers();

    if (!showIncidents) return;

    const getSeverityColor = (severity: string) => {
      switch (severity?.toLowerCase()) {
        case 'critical':
          return '#EF4444';
        case 'high':
          return '#F97316';
        case 'moderate':
          return '#F59E0B';
        case 'low':
        default:
          return '#10B981';
      }
    };

    incidents.forEach((inc) => {
      const color = getSeverityColor(inc.severity);

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 12px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            ${inc.severity === 'critical' ? '<span style="width: 7px; height: 7px; background: white; border-radius: 50%; display: block; animation: ping 1s infinite;"></span>' : ''}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; max-width: 220px; color: #1e293b;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <strong style="font-size: 13px; color: #0f172a;">${inc.category}</strong>
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${color}20; color: ${color}; border: 1px solid ${color}40;">
              ${inc.severity}
            </span>
          </div>
          <p style="font-size: 11px; margin: 2px 0; color: #475569;">
            <strong>Code:</strong> ${inc.reportCode}<br/>
            <strong>Location:</strong> ${inc.locationName}<br/>
            <strong>Status:</strong> ${inc.status.toUpperCase()}
          </p>
          <p style="font-size: 11px; margin: 4px 0; color: #334155; line-height: 1.3;">
            ${inc.details.substring(0, 80)}${inc.details.length > 80 ? '...' : ''}
          </p>
          <div style="margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px; text-align: right;">
            <span style="font-size: 10px; color: #64748b;">${new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      layerGroup.addLayer(marker);
    });
  }, [incidents, showIncidents]);

  // Handle Search Zooming
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearch.trim() || !mapInstanceRef.current) return;

    const searchTerm = mapSearch.toLowerCase();
    const matchedFeature = addisAbabaGeoData.features.find(
      (f) => f.properties.name.toLowerCase().includes(searchTerm)
    );

    if (matchedFeature && matchedFeature.geometry.coordinates[0]) {
      const coords = matchedFeature.geometry.coordinates[0];
      const bounds = L.latLngBounds(coords.map((c) => [c[1], c[0]] as [number, number]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  };

  const containerBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-md'
    : isBlueBlack
    ? 'bg-[#0f172a] border-blue-900/50 text-blue-100 shadow-xl shadow-blue-950/40'
    : isDarkGrey
    ? 'bg-neutral-900 border-neutral-800 text-neutral-100 shadow-xl'
    : isSolar
    ? 'bg-stone-900 border-stone-800 text-amber-100 shadow-xl'
    : 'bg-slate-900 border-slate-800 text-white shadow-xl';

  return (
    <div className={`border rounded-xl p-4 flex flex-col justify-between h-full w-full min-h-[460px] relative transition-colors duration-300 ${containerBg}`}>
      {/* Top Map Header & Controls */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b ${isLight ? 'border-slate-200' : isBlueBlack ? 'border-blue-900/50' : 'border-slate-800'}`}>
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-500" />
          <div>
            <h2 className={`text-base font-semibold tracking-wide ${isLight ? 'text-slate-800' : isBlueBlack ? 'text-blue-100' : 'text-white'}`}>
              ADDIS ABABA — LIVE INCIDENT MAP
            </h2>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-blue-300/60'}`}>
              Real-Time GIS Tracking · Use layers to overlay sub-city boundaries &amp; risk scores
            </p>
          </div>
        </div>

        {/* Woreda Search Bar & Map Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search Sub-City / Woreda..."
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              className={`py-1 px-2.5 pl-7 border rounded-lg text-xs focus:outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  : isBlueBlack
                  ? 'bg-[#080d1a] border-blue-800/60 text-blue-100 placeholder-blue-300/40'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            />
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-blue-400" />
          </form>

          {/* Base Map Switcher */}
          <div className="flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={selectedTile}
              onChange={(e) => setSelectedTile(e.target.value as TileType)}
              className={`py-1 px-2 border rounded-lg text-xs font-semibold focus:outline-none cursor-pointer ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-[#080d1a] border-blue-800/60 text-blue-100'
              }`}
              title="Map Tile Style"
            >
              <option value="auto" className="bg-slate-900 text-white">Sync Dashboard Theme</option>
              <option value="blue_black" className="bg-slate-900 text-white">🌌 Blue Black Midnight</option>
              <option value="light" className="bg-white text-slate-900">☀️ Carto Light</option>
              <option value="satellite" className="bg-slate-900 text-white">🛰️ Satellite Hybrid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Interactive Canvas */}
      <div className={`relative flex-1 rounded-lg overflow-hidden border ${isLight ? 'border-slate-200 bg-slate-50' : isBlueBlack ? 'border-blue-900/50 bg-[#080d1a]' : 'border-slate-800 bg-slate-950'}`}>
        <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />

        {/* Map Layer Toggles Overlay (Floating Controls) */}
        <div className="absolute top-3 left-3 z-[400] bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-3 text-xs text-slate-200 space-y-2 shadow-2xl">
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3 h-3" /> Overlay Layers
          </div>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showIncidents}
              onChange={(e) => setShowIncidents(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-rose-500 cursor-pointer"
            />
            <span className="group-hover:text-rose-300 transition-colors flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              Live Incidents
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showBoundaries}
              onChange={(e) => setShowBoundaries(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer"
            />
            <span className="group-hover:text-blue-300 transition-colors flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              Sub-City Boundaries
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showRiskHeatmap}
              onChange={(e) => setShowRiskHeatmap(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
            />
            <span className="group-hover:text-amber-300 transition-colors flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              DRM Risk Heatmap
            </span>
          </label>
        </div>

        {/* DRM Risk Legend — only visible when risk heatmap is active */}
        {showRiskHeatmap && (
          <div className="absolute bottom-3 left-3 z-[400] bg-black/75 backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1.5">
              DRM Risk Classification
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {RISK_LEVELS.map((level) => (
                <div key={level.label} className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ backgroundColor: level.color }}></span>
                  <span className="text-[10px]">{level.label} ({level.min}–{level.max})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sliding GIS Region Detail Drawer */}
        {selectedRegion && (
          <div className="absolute top-0 right-0 bottom-0 z-[500] w-80 bg-slate-950/95 border-l border-blue-900/70 p-4 overflow-y-auto shadow-2xl backdrop-blur-md animate-in slide-in-from-right duration-300 text-xs text-blue-100">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/60 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-white">{selectedRegion.name}</h3>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Risk Badge & Demographics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-950/60 border border-blue-900/50">
                <span>DRM Risk Score</span>
                <span className="font-extrabold px-2.5 py-1 rounded text-white shadow-sm" style={{ backgroundColor: getRiskColor(selectedRegion.riskScore) }}>
                  {selectedRegion.riskLevel} ({selectedRegion.riskScore.toFixed(1)})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded bg-slate-900 border border-blue-900/40">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3 text-sky-400" /> Population
                  </div>
                  <div className="font-extrabold text-sm text-white mt-0.5">
                    {selectedRegion.population.toLocaleString()}
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-900 border border-blue-900/40">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Building2 className="w-3 h-3 text-indigo-400" /> Households
                  </div>
                  <div className="font-extrabold text-sm text-white mt-0.5">
                    {selectedRegion.households.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Dominant Hazards */}
              <div>
                <h4 className="font-bold text-[11px] text-blue-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Dominant Regional Hazards
                </h4>
                <div className="space-y-1.5">
                  {selectedRegion.hazards.map((h, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span>{h.name}</span>
                      <span className="font-bold text-amber-400">{h.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Incidents */}
              <div>
                <h4 className="font-bold text-[11px] text-blue-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500" /> Active Incidents ({selectedRegion.incidents.length})
                </h4>
                {selectedRegion.incidents.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No active incidents in this area.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedRegion.incidents.map((inc) => (
                      <div key={inc.id} className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-200">
                        <div className="flex justify-between font-bold">
                          <span>{inc.category}</span>
                          <span className="uppercase text-[10px]">{inc.severity}</span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-1 line-clamp-2">{inc.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Full Woreda Profile View Button */}
              <button
                onClick={() => navigate('/woreda-profile/map')}
                className="w-full mt-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition shadow-lg"
              >
                <Eye className="w-4 h-4" /> Open Full Woreda Map Analysis <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              Loading spatial data...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
