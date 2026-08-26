export interface SummaryStats {
  activeIncidents: number;
  criticalIncidents: number;
  incidentsToday: number;
  affectedPeople: number;
  affectedWoredas: number;
  pendingVerification: number;
  activeResponses: number;
  pendingResponseRequests: number;
  siteSurveysToday: number;
  totalHouseholdProfiles: number;
  publicIncidentsCount?: number;
  publicConcernsCount?: number;
  inspectionRequestsCount?: number;
  alertSubscriptionsCount?: number;
}

export interface PublicOfficeWorkflowData {
  publicSubmissions: {
    incidents: number;
    concerns: number;
    inspections: number;
    alertSubscribers: number;
  };
  officeResponses: {
    dispatchedTeams: number;
    closedIncidents: number;
    assignedInspectors: number;
    inspectionBreakdown: {
      Submitted: number;
      'Under Review': number;
      Assigned: number;
      Scheduled: number;
      Completed: number;
      Rejected: number;
    };
  };
  recentInspections: Array<{
    id: string;
    trackingNumber: string;
    propertyAddress: string;
    inspectionType: string;
    status: string;
    assignedInspector: string;
    createdAt: string;
  }>;
}

export interface MapIncident {
  id: string;
  reportCode: string;
  reportType: 'incident' | 'concern';
  category: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  status: 'submitted' | 'received' | 'dispatched' | 'closed';
  details: string;
  locationName: string;
  region: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  affectedPeopleEstimate?: string;
}

export interface HazardItem {
  hazardType: string;
  totalIncidents: number;
  criticalIncidents: number;
  activeIncidents: number;
}

export interface ConcernCategoryItem {
  concernCategory: string;
  totalConcerns: number;
  urgentConcerns: number;
}

export interface HazardAnalysisData {
  incidents: HazardItem[];
  concerns: ConcernCategoryItem[];
}

export type TrendTimeInterval = 'hourly' | 'daily' | 'monthly' | 'yearly';

export interface TrendItem {
  date: string;
  interval?: TrendTimeInterval;
  total: number;
  incidents?: number;
  concerns?: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

export interface ResponseMonitoring {
  responseStatus: {
    submitted: number;
    received: number;
    dispatched: number;
    closed: number;
  };
  inspectionStatus: Record<string, number>;
  activeResponses: number;
  completedResponses: number;
  pendingResponses: number;
}

export interface SurveyMonitoring {
  syncBreakdown: {
    SYNCED: number;
    UNSYNCED: number;
    UPDATED: number;
  };
  woredaProfileStatus: {
    Draft: number;
    Submitted: number;
    Reviewed: number;
  };
  siteBreakdown: Array<{ _id: string; count: number }>;
  onlineSubmissions?: number;
  offlineSubmissions?: number;
}

export interface AssessmentAnalyticsData {
  householdAssessment: {
    totalHouseholdProfiles: number;
    femaleHeadedCount: number;
    idpCount: number;
    informalSettlementCount: number;
    hasEmergencyPlanCount: number;
    femaleHeadedPercentage: number;
    idpPercentage: number;
    informalSettlementPercentage: number;
    emergencyPlanPercentage: number;
  };
  woredaAssessment: {
    totalWoredasAssessed: number;
    avgKiiEwsScore: number;
    avgKiiInstitutionalScore: number;
    avgKiiInfrastructureScore: number;
    totalDisasterLossETB: number;
    totalDisasterDeaths: number;
  };
}

export interface ActivityItem {
  id: string;
  type: 'incident' | 'survey' | 'audit';
  severity: string;
  title: string;
  description: string;
  timestamp: string;
  location?: string;
}

export interface FilterState {
  region: string;
  zone: string;
  woreda: string;
  hazard: string;
  severity: string;
  status: string;
  datePreset: 'all' | 'today' | 'yesterday' | 'custom';
  startDate: string;
  endDate: string;
}

export type SocketStatus = 'LIVE' | 'RECONNECTING' | 'DISCONNECTED';

export type ThemeOption = 'light' | 'blue_black' | 'dark' | 'dark_grey' | 'solar';

export interface CriticalAlert {
  title: string;
  category: string;
  location: string;
  severity: string;
  reportCode: string;
  createdAt: string;
}

export interface DisasterHistoryItem {
  year: number;
  hazard: string;
  location: string;
  affected: number;
  displaced: number;
  deaths: number;
  injuries: number;
  housesDamaged: number;
  infraDamaged: string;
  lossETB: string;
}
