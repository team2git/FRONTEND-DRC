import { Flame, Mountain, Waves, Wind } from "lucide-react";

export const ALERT_CATEGORY_LABELS: Record<string, string> = {
  floods: "Floods",
  heat_wave: "Heat Wave",
  drought: "Drought",
  earthquake: "Earthquake",
  landslides: "Landslides",
  subsidence_fissures: "Subsidence/Fissures",
  forest_fires: "Forest Fires",
  structural_fire: "Structural Fire",
  groundwater_pollution: "Groundwater Pollution",
  lake_water_pollution: "Lake Water Pollution",
  air_pollution: "Air Pollution",
  human_epidemics: "Human Epidemics",
  other: "Other...",
};

export const ALERT_HAZARD_GROUPS = [
  {
    id: "weather",
    title: "Weather & Climate",
    icon: Waves,
    items: ["floods", "heat_wave", "drought"],
  },
  {
    id: "geo",
    title: "Geological",
    icon: Mountain,
    items: ["earthquake", "landslides", "subsidence_fissures"],
  },
  {
    id: "fire",
    title: "Fire Events",
    icon: Flame,
    items: ["forest_fires", "structural_fire"],
  },
  {
    id: "env",
    title: "Environmental & Health",
    icon: Wind,
    items: [
      "groundwater_pollution",
      "lake_water_pollution",
      "air_pollution",
      "human_epidemics",
      "other",
    ],
  },
] as const;

export const formatAlertCategory = (value: string) => ALERT_CATEGORY_LABELS[value] || value;
