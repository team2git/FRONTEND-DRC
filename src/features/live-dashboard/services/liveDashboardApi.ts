import api from '@/api/axios';
import {
  SummaryStats,
  MapIncident,
  HazardAnalysisData,
  TrendItem,
  TrendTimeInterval,
  ResponseMonitoring,
  SurveyMonitoring,
  ActivityItem,
  FilterState,
  PublicOfficeWorkflowData,
  AssessmentAnalyticsData,
  DisasterHistoryItem,
} from '../types/dashboardTypes';

export const fetchDashboardSummary = async (filters?: Partial<FilterState>): Promise<SummaryStats> => {
  const response = await api.get('/live-dashboard/summary', { params: filters });
  return response.data;
};

export const fetchMapIncidents = async (filters?: Partial<FilterState>): Promise<MapIncident[]> => {
  const response = await api.get('/live-dashboard/map', { params: filters });
  return response.data;
};

export const fetchHazardAnalysis = async (filters?: Partial<FilterState>): Promise<HazardAnalysisData> => {
  const response = await api.get('/live-dashboard/hazards', { params: filters });
  if (Array.isArray(response.data)) {
    return {
      incidents: response.data,
      concerns: [],
    };
  }
  return response.data;
};

export const fetchIncidentTrends = async (filters?: Partial<FilterState> & { days?: number; interval?: TrendTimeInterval }): Promise<TrendItem[]> => {
  const response = await api.get('/live-dashboard/trends', { params: filters });
  return response.data;
};

export const fetchResponseMonitoring = async (filters?: Partial<FilterState>): Promise<ResponseMonitoring> => {
  const response = await api.get('/live-dashboard/responses', { params: filters });
  return response.data;
};

export const fetchSurveyMonitoring = async (filters?: Partial<FilterState>): Promise<SurveyMonitoring> => {
  const response = await api.get('/live-dashboard/surveys', { params: filters });
  return response.data;
};

export const fetchActivityFeed = async (filters?: Partial<FilterState>): Promise<ActivityItem[]> => {
  const response = await api.get('/live-dashboard/activity', { params: filters });
  return response.data;
};

export const fetchPublicOfficeWorkflow = async (filters?: Partial<FilterState>): Promise<PublicOfficeWorkflowData> => {
  const response = await api.get('/live-dashboard/public-office-workflow', { params: filters });
  return response.data;
};

export const fetchAssessmentAnalytics = async (filters?: Partial<FilterState>): Promise<AssessmentAnalyticsData> => {
  const response = await api.get('/live-dashboard/assessments', { params: filters });
  return response.data;
};

/**
 * Reuses the normal dashboard stats endpoint to pull the disasterHistory array.
 * The same Woreda assessment data powers both dashboards.
 */
export const fetchDisasterHistory = async (): Promise<DisasterHistoryItem[]> => {
  const response = await api.get('/dashboard/stats');
  return response.data?.disasterHistory ?? [];
};
