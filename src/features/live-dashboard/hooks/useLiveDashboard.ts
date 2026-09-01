import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SummaryStats,
  MapIncident,
  HazardAnalysisData,
  TrendItem,
  ResponseMonitoring,
  SurveyMonitoring,
  ActivityItem,
  FilterState,
  SocketStatus,
  CriticalAlert,
  PublicOfficeWorkflowData,
  AssessmentAnalyticsData,
  DisasterHistoryItem,
} from '../types/dashboardTypes';
import {
  fetchDashboardSummary,
  fetchMapIncidents,
  fetchHazardAnalysis,
  fetchIncidentTrends,
  fetchResponseMonitoring,
  fetchSurveyMonitoring,
  fetchActivityFeed,
  fetchPublicOfficeWorkflow,
  fetchAssessmentAnalytics,
  fetchDisasterHistory,
} from '../services/liveDashboardApi';
import { connectDashboardSocket, disconnectDashboardSocket } from '../socket/dashboardSocket';

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getInitialFilters = (): FilterState => {
  const todayStr = getTodayStr();
  return {
    region: '',
    zone: '',
    woreda: '',
    hazard: '',
    severity: '',
    status: '',
    datePreset: 'today',
    startDate: todayStr,
    endDate: todayStr,
  };
};

export const useLiveDashboard = () => {
  const [filters, setFilters] = useState<FilterState>(getInitialFilters);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [mapIncidents, setMapIncidents] = useState<MapIncident[]>([]);
  const [hazards, setHazards] = useState<HazardAnalysisData>({ incidents: [], concerns: [] });
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [responseMonitoring, setResponseMonitoring] = useState<ResponseMonitoring | null>(null);
  const [surveyMonitoring, setSurveyMonitoring] = useState<SurveyMonitoring | null>(null);
  const [publicOfficeWorkflow, setPublicOfficeWorkflow] = useState<PublicOfficeWorkflowData | null>(null);
  const [assessmentAnalytics, setAssessmentAnalytics] = useState<AssessmentAnalyticsData | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [disasterHistory, setDisasterHistory] = useState<DisasterHistoryItem[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('DISCONNECTED');
  const [activeAlert, setActiveAlert] = useState<CriticalAlert | null>(null);

  const isMounted = useRef<boolean>(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        summaryRes,
        mapRes,
        hazardRes,
        trendRes,
        responseRes,
        surveyRes,
        activityRes,
        workflowRes,
        assessmentRes,
        disasterHistoryRes,
      ] = await Promise.all([
        fetchDashboardSummary(filters),
        fetchMapIncidents(filters),
        fetchHazardAnalysis(filters),
        fetchIncidentTrends(filters),
        fetchResponseMonitoring(filters),
        fetchSurveyMonitoring(filters),
        fetchActivityFeed(filters),
        fetchPublicOfficeWorkflow(filters),
        fetchAssessmentAnalytics(filters),
        fetchDisasterHistory(),
      ]);

      if (isMounted.current) {
        setSummary(summaryRes);
        setMapIncidents(mapRes);
        setHazards(hazardRes);
        setTrends(trendRes);
        setResponseMonitoring(responseRes);
        setSurveyMonitoring(surveyRes);
        setActivityFeed(activityRes);
        setPublicOfficeWorkflow(workflowRes);
        setAssessmentAnalytics(assessmentRes);
        setDisasterHistory(disasterHistoryRes);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      if (isMounted.current) {
        console.error('Error loading live dashboard data:', err);
        setError(err?.response?.data?.message || err.message || 'Failed to load live dashboard data');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    isMounted.current = true;
    loadDashboardData();

    return () => {
      isMounted.current = false;
    };
  }, [loadDashboardData]);

  // Real-time Socket.IO Connection Setup
  useEffect(() => {
    const socket = connectDashboardSocket();

    const onConnect = () => {
      console.log('🟢 Socket Connected to Live Dashboard');
      setSocketStatus('LIVE');
      loadDashboardData(); // Refresh data on reconnect
    };

    const onDisconnect = () => {
      console.log('🔴 Socket Disconnected');
      setSocketStatus('DISCONNECTED');
    };

    const onConnecting = () => {
      setSocketStatus('RECONNECTING');
    };

    const onIncidentCreated = (data: any) => {
      console.log('⚡ Event: incident:created', data);
      const inc = data.payload || data;
      setLastUpdated(new Date());

      // Update Summary metrics dynamically
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              activeIncidents: prev.activeIncidents + 1,
              incidentsToday: prev.incidentsToday + 1,
              criticalIncidents:
                inc.severity === 'critical' ? prev.criticalIncidents + 1 : prev.criticalIncidents,
            }
          : null
      );

      // Add marker to map
      if (inc._id && inc.location) {
        setMapIncidents((prev) => [
          {
            id: inc._id,
            reportCode: inc.reportCode || `INC-${inc._id.substring(0, 6)}`,
            reportType: inc.reportType || 'incident',
            category: inc.category || 'General Hazard',
            severity: inc.severity || 'moderate',
            status: inc.status || 'submitted',
            details: inc.details || 'New incident reported',
            locationName: inc.location?.addressLine || inc.location?.city || 'Location area',
            region: inc.location?.region || 'Addis Ababa',
            latitude: Number(inc.location?.latitude || 9.03),
            longitude: Number(inc.location?.longitude || 38.74),
            createdAt: inc.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      // Prepend to activity feed
      setActivityFeed((prev) => [
        {
          id: `inc_${inc._id || Date.now()}`,
          type: 'incident',
          severity: inc.severity || 'moderate',
          title: `New Incident: ${inc.category || 'Hazard'}`,
          description: `Reported in ${inc.location?.addressLine || inc.location?.city || 'Woreda'}. Status: ${inc.status || 'submitted'}`,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 19),
      ]);

      // Re-fetch all aggregated chart datasets instantly via Socket event
      loadDashboardData();
    };

    const onIncidentUpdated = (data: any) => {
      console.log('⚡ Event: incident:updated', data);
      setLastUpdated(new Date());
      loadDashboardData();
    };

    const onSurveyEvent = (data: any) => {
      console.log('⚡ Event: survey event', data);
      setLastUpdated(new Date());
      loadDashboardData();
    };

    const onResponseEvent = (data: any) => {
      console.log('⚡ Event: response event', data);
      setLastUpdated(new Date());
      loadDashboardData();
    };

    const onCriticalAlert = (data: any) => {
      console.log('🚨 Event: alert:critical', data);
      const alertPayload = data.payload || data;
      setActiveAlert({
        title: alertPayload.title || 'CRITICAL DRM ALERT',
        category: alertPayload.category || 'Disaster Risk',
        location: alertPayload.location || 'Woreda Area',
        severity: 'critical',
        reportCode: alertPayload.reportCode || 'N/A',
        createdAt: alertPayload.createdAt || new Date().toISOString(),
      });
      loadDashboardData();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connecting', onConnecting);
    socket.on('incident:created', onIncidentCreated);
    socket.on('incident:updated', onIncidentUpdated);
    socket.on('survey:created', onSurveyEvent);
    socket.on('survey:updated', onSurveyEvent);
    socket.on('response:created', onResponseEvent);
    socket.on('response:updated', onResponseEvent);
    socket.on('alert:critical', onCriticalAlert);

    if (socket.connected) {
      setSocketStatus('LIVE');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connecting', onConnecting);
      socket.off('incident:created', onIncidentCreated);
      socket.off('incident:updated', onIncidentUpdated);
      socket.off('survey:created', onSurveyEvent);
      socket.off('survey:updated', onSurveyEvent);
      socket.off('response:created', onResponseEvent);
      socket.off('response:updated', onResponseEvent);
      socket.off('alert:critical', onCriticalAlert);
      disconnectDashboardSocket();
    };
  }, [loadDashboardData]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    if (key === 'datePreset') {
      const preset = value as FilterState['datePreset'];
      const todayStr = new Date().toISOString().split('T')[0];

      if (preset === 'all') {
        setFilters((prev) => ({ ...prev, datePreset: 'all', startDate: '', endDate: '' }));
      } else if (preset === 'today') {
        setFilters((prev) => ({ ...prev, datePreset: 'today', startDate: todayStr, endDate: todayStr }));
      } else if (preset === 'yesterday') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yestStr = yest.toISOString().split('T')[0];
        setFilters((prev) => ({ ...prev, datePreset: 'yesterday', startDate: yestStr, endDate: yestStr }));
      } else if (preset === 'custom') {
        setFilters((prev) => ({ ...prev, datePreset: 'custom' }));
      }
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const resetFilters = () => {
    setFilters(getInitialFilters());
  };

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return {
    summary,
    mapIncidents,
    hazards,
    trends,
    responseMonitoring,
    surveyMonitoring,
    publicOfficeWorkflow,
    assessmentAnalytics,
    activityFeed,
    disasterHistory,
    loading,
    error,
    lastUpdated,
    socketStatus,
    activeAlert,
    filters,
    updateFilter,
    resetFilters,
    dismissAlert,
    refreshData: loadDashboardData,
  };
};
