export type DashboardCardId =
  | 'kpi_cards'
  | 'early_warning'
  | 'public_workflow'
  | 'gis_map'
  | 'incident_feed'
  | 'incident_trend'
  | 'hazard_analysis'
  | 'response_status'
  | 'survey_status'
  | 'assessment_analytics'
  | 'disaster_history';

export type GridColSpan = 12 | 8 | 6 | 4 | 3;

export type GridPresetType = 'custom' | 'standard' | 'two_column' | 'three_column' | 'stacked';

export interface DashboardCardConfig {
  id: DashboardCardId;
  label: string;
  category: 'overview' | 'spatial' | 'analytics' | 'operations';
  enabled: boolean;
  order: number;
  colSpan: GridColSpan; // 12 = 100%, 8 = 66%, 6 = 50%, 4 = 33%, 3 = 25%
}

export interface CustomScreenProfile {
  id: string;
  name: string;
  description?: string;
  isBuiltIn?: boolean;
  gridPreset?: GridPresetType;
  cards: DashboardCardConfig[];
}

export const DEFAULT_CARD_ORDER: DashboardCardConfig[] = [
  { id: 'kpi_cards', label: 'Key Performance Indicators (KPI Cards)', category: 'overview', enabled: true, order: 1, colSpan: 12 },
  { id: 'early_warning', label: 'Active Early Warning & Disaster Alerts', category: 'overview', enabled: true, order: 2, colSpan: 12 },
  { id: 'public_workflow', label: 'Public Submissions & Office Workflow', category: 'operations', enabled: true, order: 3, colSpan: 12 },
  { id: 'gis_map', label: 'Live GIS Incident Map', category: 'spatial', enabled: true, order: 4, colSpan: 8 },
  { id: 'incident_feed', label: 'Live Activity & Incident Feed', category: 'spatial', enabled: true, order: 5, colSpan: 4 },
  { id: 'incident_trend', label: 'Incident Severity Trends', category: 'analytics', enabled: true, order: 6, colSpan: 6 },
  { id: 'hazard_analysis', label: 'Hazard Severity Breakdown', category: 'analytics', enabled: true, order: 7, colSpan: 6 },
  { id: 'response_status', label: 'Response Activities & Monitoring', category: 'operations', enabled: true, order: 8, colSpan: 6 },
  { id: 'survey_status', label: 'Site Survey & Inspection Status', category: 'operations', enabled: true, order: 9, colSpan: 6 },
  { id: 'assessment_analytics', label: 'Household Vulnerability & Woreda Capacity', category: 'analytics', enabled: true, order: 10, colSpan: 12 },
  { id: 'disaster_history', label: 'Historical Disaster Impact Trend', category: 'analytics', enabled: true, order: 11, colSpan: 12 },
];

export const BUILTIN_SCREEN_PROFILES: CustomScreenProfile[] = [
  {
    id: 'integrated',
    name: 'Integrated Command',
    description: 'Unified command view with all cards enabled',
    isBuiltIn: true,
    gridPreset: 'standard',
    cards: DEFAULT_CARD_ORDER.map((c) => ({ ...c, enabled: true })),
  },
  {
    id: 'screen_gis',
    name: 'Screen 1: GIS Map & Alerts',
    description: 'Dedicated spatial command display for TV walls',
    isBuiltIn: true,
    gridPreset: 'custom',
    cards: [
      { id: 'gis_map', label: 'Live GIS Incident Map', category: 'spatial', enabled: true, order: 1, colSpan: 8 },
      { id: 'incident_feed', label: 'Live Activity & Incident Feed', category: 'spatial', enabled: true, order: 2, colSpan: 4 },
      { id: 'early_warning', label: 'Active Early Warning & Disaster Alerts', category: 'overview', enabled: true, order: 3, colSpan: 12 },
      { id: 'kpi_cards', label: 'Key Performance Indicators (KPI Cards)', category: 'overview', enabled: true, order: 4, colSpan: 12 },
      { id: 'public_workflow', label: 'Public Submissions & Office Workflow', category: 'operations', enabled: false, order: 5, colSpan: 12 },
      { id: 'incident_trend', label: 'Incident Severity Trends', category: 'analytics', enabled: false, order: 6, colSpan: 6 },
      { id: 'hazard_analysis', label: 'Hazard Severity Breakdown', category: 'analytics', enabled: false, order: 7, colSpan: 6 },
      { id: 'response_status', label: 'Response Activities & Monitoring', category: 'operations', enabled: false, order: 8, colSpan: 6 },
      { id: 'survey_status', label: 'Site Survey & Inspection Status', category: 'operations', enabled: false, order: 9, colSpan: 6 },
      { id: 'assessment_analytics', label: 'Household Vulnerability & Woreda Capacity', category: 'analytics', enabled: false, order: 10, colSpan: 12 },
      { id: 'disaster_history', label: 'Historical Disaster Impact Trend', category: 'analytics', enabled: false, order: 11, colSpan: 12 },
    ],
  },
  {
    id: 'screen_analytics',
    name: 'Screen 2: Executive Analytics',
    description: 'Executive KPIs, Statistical Trends & Risk Assessments',
    isBuiltIn: true,
    gridPreset: 'two_column',
    cards: [
      { id: 'kpi_cards', label: 'Key Performance Indicators (KPI Cards)', category: 'overview', enabled: true, order: 1, colSpan: 12 },
      { id: 'incident_trend', label: 'Incident Severity Trends', category: 'analytics', enabled: true, order: 2, colSpan: 6 },
      { id: 'hazard_analysis', label: 'Hazard Severity Breakdown', category: 'analytics', enabled: true, order: 3, colSpan: 6 },
      { id: 'assessment_analytics', label: 'Household Vulnerability & Woreda Capacity', category: 'analytics', enabled: true, order: 4, colSpan: 12 },
      { id: 'disaster_history', label: 'Historical Disaster Impact Trend', category: 'analytics', enabled: true, order: 5, colSpan: 12 },
      { id: 'early_warning', label: 'Active Early Warning & Disaster Alerts', category: 'overview', enabled: true, order: 6, colSpan: 12 },
      { id: 'public_workflow', label: 'Public Submissions & Office Workflow', category: 'operations', enabled: false, order: 7, colSpan: 12 },
      { id: 'gis_map', label: 'Live GIS Incident Map', category: 'spatial', enabled: false, order: 8, colSpan: 8 },
      { id: 'incident_feed', label: 'Live Activity & Incident Feed', category: 'spatial', enabled: false, order: 9, colSpan: 4 },
      { id: 'response_status', label: 'Response Activities & Monitoring', category: 'operations', enabled: false, order: 10, colSpan: 6 },
      { id: 'survey_status', label: 'Site Survey & Inspection Status', category: 'operations', enabled: false, order: 11, colSpan: 6 },
    ],
  },
  {
    id: 'screen_operations',
    name: 'Screen 3: Dispatch & Field Ops',
    description: 'Public workflow & field survey status',
    isBuiltIn: true,
    gridPreset: 'three_column',
    cards: [
      { id: 'kpi_cards', label: 'Key Performance Indicators (KPI Cards)', category: 'overview', enabled: true, order: 1, colSpan: 12 },
      { id: 'public_workflow', label: 'Public Submissions & Office Workflow', category: 'operations', enabled: true, order: 2, colSpan: 12 },
      { id: 'response_status', label: 'Response Activities & Monitoring', category: 'operations', enabled: true, order: 3, colSpan: 6 },
      { id: 'survey_status', label: 'Site Survey & Inspection Status', category: 'operations', enabled: true, order: 4, colSpan: 6 },
      { id: 'early_warning', label: 'Active Early Warning & Disaster Alerts', category: 'overview', enabled: true, order: 5, colSpan: 12 },
      { id: 'gis_map', label: 'Live GIS Incident Map', category: 'spatial', enabled: false, order: 6, colSpan: 8 },
      { id: 'incident_feed', label: 'Live Activity & Incident Feed', category: 'spatial', enabled: false, order: 7, colSpan: 4 },
      { id: 'incident_trend', label: 'Incident Severity Trends', category: 'analytics', enabled: false, order: 8, colSpan: 6 },
      { id: 'hazard_analysis', label: 'Hazard Severity Breakdown', category: 'analytics', enabled: false, order: 9, colSpan: 6 },
      { id: 'assessment_analytics', label: 'Household Vulnerability & Woreda Capacity', category: 'analytics', enabled: false, order: 10, colSpan: 12 },
      { id: 'disaster_history', label: 'Historical Disaster Impact Trend', category: 'analytics', enabled: false, order: 11, colSpan: 12 },
    ],
  },
];
