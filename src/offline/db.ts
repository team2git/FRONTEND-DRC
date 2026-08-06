import Dexie, { Table } from 'dexie';

export interface LocalAssignedSite {
    id?: number;
    siteCode: string;
    name: string;
    description?: string;
    region?: string;
    zone?: string;
    woreda?: string;
    kebele?: string;
    location?: {
        latitude?: number;
        longitude?: number;
        address?: string;
    };
    assignedSurveyor?: string;
    assignedTemplate: any; // Full template definition or ID
    templateId: string;
    status: 'Assigned' | 'In Progress' | 'Completed' | 'Synced';
    priority?: string;
    dueDate?: string;
    cachedAt: string;
    serverId?: string;
}

export interface LocalSurveyTemplate {
    id?: number;
    serverId: string;
    name: string;
    description?: string;
    version: number;
    category?: string;
    status: string;
    modules: any[];
    sections?: any[];
    questions?: any[];
    cachedAt: string;
}

export interface LocalTemplateSection {
    id?: number;
    templateId: string;
    sectionId: string;
    title: string;
    description?: string;
    order: number;
}

export interface LocalTemplateQuestion {
    id?: number;
    templateId: string;
    sectionId?: string;
    questionId: string;
    questionCode: string;
    label: string;
    type: string;
    required: boolean;
    options?: any[];
    validation?: any;
    conditionalLogic?: any;
    defaultValue?: any;
    order: number;
}

export interface LocalLookupValue {
    id?: number;
    category: string;
    label: string;
    value: string;
}

export interface LocalSurveyResponse {
    id?: number;
    localId: string;
    serverId?: string;
    siteId?: string;
    templateId: string;
    templateVersion: number;
    answers: Record<string, any>;
    respondentMetadata?: any;
    gpsLocation?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        altitude?: number;
        capturedAt?: string;
    };
    photos?: any[];
    attachments?: any[];
    signature?: string; // base64 data URI
    syncStatus: 'pending' | 'synced' | 'failed';
    isDraft: boolean;
    createdAt: string;
    updatedAt: string;
    syncedAt?: string;
}

export interface LocalSurveyPhoto {
    id?: number;
    localSurveyId: string;
    photoId: string;
    base64Data: string;
    filename: string;
    mimeType: string;
    capturedAt: string;
    caption?: string;
}

export interface LocalSurveyAttachment {
    id?: number;
    localSurveyId: string;
    attachmentId: string;
    base64Data: string;
    filename: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

export interface LocalPendingUpload {
    id?: number;
    localSurveyId: string;
    step: 'header' | 'responses' | 'gps' | 'photos' | 'attachments' | 'signatures' | 'status';
    payload: any;
    attempts: number;
    lastError?: string;
    createdAt: string;
}

export interface LocalSyncLog {
    id?: number;
    localSurveyId: string;
    serverSurveyId?: string;
    siteId?: string;
    templateId?: string;
    syncStatus: 'pending' | 'synced' | 'failed' | 'partial';
    stepsCompleted: any[];
    errors: any[];
    timestamp: string;
}

export class SiteSurveyDatabase extends Dexie {
    assignedSites!: Table<LocalAssignedSite>;
    surveyTemplates!: Table<LocalSurveyTemplate>;
    templateSections!: Table<LocalTemplateSection>;
    templateQuestions!: Table<LocalTemplateQuestion>;
    lookupValues!: Table<LocalLookupValue>;
    surveyResponses!: Table<LocalSurveyResponse>;
    surveyPhotos!: Table<LocalSurveyPhoto>;
    surveyAttachments!: Table<LocalSurveyAttachment>;
    pendingUploads!: Table<LocalPendingUpload>;
    syncLogs!: Table<LocalSyncLog>;

    constructor() {
        super('SiteSurveyPWA_DB');
        this.version(1).stores({
            assignedSites: '++id, siteCode, templateId, status, serverId',
            surveyTemplates: '++id, serverId, name, version, status',
            templateSections: '++id, templateId, sectionId, order',
            templateQuestions: '++id, templateId, sectionId, questionId, questionCode',
            lookupValues: '++id, category, value',
            surveyResponses: '++id, localId, serverId, siteId, templateId, syncStatus, isDraft',
            surveyPhotos: '++id, localSurveyId, photoId',
            surveyAttachments: '++id, localSurveyId, attachmentId',
            pendingUploads: '++id, localSurveyId, step, attempts',
            syncLogs: '++id, localSurveyId, syncStatus, timestamp'
        });
    }
}

export const db = new SiteSurveyDatabase();
