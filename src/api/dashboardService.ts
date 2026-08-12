import api from './axios';

export interface WoredaHeaderInfo {
    woredaName: string;
    zone: string;
    region: string;
    totalWoredas?: number;
    totalPopulation: number;
    totalHouseholds: number;
    reportingPeriod: string;
    lastDataUpdate: string;
    dataStatus: string;
}

export interface ExecutiveKpis {
    totalPopulation: number;
    totalHouseholds: number;
    populationAtRisk: number;
    householdsAtRisk: number;
    numberOfHazards: number;
    highRiskWoredasCount?: number;
    recordedDisasters: number;
    affectedPeopleCount: number;
    vulnerablePeopleCount: number;
    estimatedDamageLossETB: string;
    preparednessScore: number;
    openResponseActionsCount: number;
}

export interface HazardItem {
    type: string;
    occurrences: number;
    frequency: string;
    severity: string;
    affectedPop: number;
    affectedWoredas?: number;
    trend: string;
    status: string;
}

export interface WoredaRankingItem {
    name: string;
    subcity?: string;
    displayName?: string;
    hazard: string;
    exposure: number;
    vulnerability: number;
    score: number;
    level: string;
    pop: number;
    hh: number;
}

export interface VulnerabilityAnalysisInfo {
    totalPopulation: number;
    totalVulnerablePeople: number;
    vulnerableChildren: number;
    vulnerableElderly: number;
    vulnerablePwd: number;
    vulnerablePregnant: number;
    femaleHeadedHH: number;
    idpHouseholds: number;
}

export interface ExposureItem {
    category: string;
    total: number;
    exposed: number;
    percentage: number;
    riskLevel: string;
}

export interface ExposureAnalysisInfo {
    population: { total: number; exposed: number; percentage: number; riskLevel: string };
    households: { total: number; exposed: number; percentage: number; riskLevel: string };
    infrastructure: ExposureItem[];
    livelihoods: ExposureItem[];
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

export interface CapacityGapItem {
    resource: string;
    required: number | string;
    available: number | string;
    gap: number | string;
    status: string;
}

export interface ActiveAlertItem {
    id: string;
    code: string;
    title: string;
    hazard: string;
    location: string;
    severity: string;
    time: string | Date;
    affectedPop: string;
    action: string;
    responsible: string;
    status: string;
}

export interface ResponseActionItem {
    id: string;
    action: string;
    location: string;
    responsible: string;
    priority: string;
    startDate: string;
    dueDate: string;
    status: string;
    progress: number;
    overdue: boolean;
}

export interface PriorityRecommendationItem {
    priority: number;
    title: string;
    riskContext: string;
    recommendedAction: string;
    status: string;
}

export interface DashboardStats {
    permissions: {
        canViewOrganizations: boolean;
        canViewSectors: boolean;
        canViewDepartments: boolean;
        canViewUsers: boolean;
        canViewRoles: boolean;
        canViewAdvancedStats: boolean;
    };
    totalDepartments?: number;
    totalUsers?: number;
    totalRoles?: number;
    totalOrganizations?: number;
    totalSectors?: number;
    totalWoredaProfiles?: number;
    totalHouseholdProfiles?: number;
    totalWoredaAssessments?: number;
    totalSurveys?: number;
    totalMappings?: number;
    totalTemplates?: number;
    
    // Status breakdowns
    woredaByStatus?: { Draft: number; Submitted: number; Reviewed: number };
    templatesByStatus?: { Draft: number; Published: number; Archived: number };
    mappingsByStatus?: { Draft: number; Published: number; Archived: number };
    surveysBySyncStatus?: { SYNCED: number; UNSYNCED: number; UPDATED: number };
    
    // Woreda DRM Dashboard Aggregations
    woredaHeader?: WoredaHeaderInfo;
    executiveKpis?: ExecutiveKpis;
    hazardAnalysis?: HazardItem[];
    woredaRankings?: WoredaRankingItem[];
    vulnerabilityAnalysis?: VulnerabilityAnalysisInfo;
    exposureAnalysis?: ExposureAnalysisInfo;
    disasterHistory?: DisasterHistoryItem[];
    capacityGaps?: CapacityGapItem[];
    activeAlerts?: ActiveAlertItem[];
    responseActions?: ResponseActionItem[];
    executiveSummaryText?: string;
    priorityRecommendations?: PriorityRecommendationItem[];

    recentDatabaseChanges?: Array<{
        _id: string;
        userId?: {
            _id: string;
            fullname: string;
            email: string;
        };
        action: string;
        resource: string;
        resourceId?: string;
        severity?: string;
        status?: string;
        timestamp: string;
    }>;
    userInfo: {
        accessLevel: string;
        organizationType: string;
        organizationName: string;
        sectorName: string;
        departmentName: string;
    };
    usersByAccessLevel?: Array<{
        accessLevel: string;
        count: number;
    }>;
    usersByOrganization?: Array<{
        organizationId: string;
        organizationName: string;
        count: number;
    }>;
}

export const getDashboardStats = async (params?: Record<string, any>): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats', { params });
    return response.data;
};
