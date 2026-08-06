import { db, LocalSurveyResponse } from './db';
import { getCachedAuthSession, isOnline } from './offlineAuth';
import api from '../api/axios';

export interface SyncProgress {
    localId: string;
    step: string;
    status: 'idle' | 'in_progress' | 'completed' | 'failed';
    message: string;
}

export const executeSurveySync = async (
    surveyResponse: LocalSurveyResponse,
    onProgress?: (progress: SyncProgress) => void
): Promise<{ success: boolean; serverId?: string; error?: string }> => {
    const { token } = getCachedAuthSession();

    if (!token) {
        return { success: false, error: 'Authentication token not available. Please login.' };
    }

    if (!isOnline()) {
        return { success: false, error: 'Device is offline. Synchronization will resume when online.' };
    }

    const localId = surveyResponse.localId;

    const reportProgress = (step: string, status: 'in_progress' | 'completed' | 'failed', message: string) => {
        if (onProgress) {
            onProgress({ localId, step, status, message });
        }
    };

    try {
        // Step 1 & 2 & 3 & 4 & 5 & 6 & 7: Package payload for ordered sync server execution
        reportProgress('header', 'in_progress', 'Preparing survey header & responses payload...');

        // Retrieve local photos
        const photos = await db.surveyPhotos.where('localSurveyId').equals(localId).toArray();
        // Retrieve local attachments
        const attachments = await db.surveyAttachments.where('localSurveyId').equals(localId).toArray();

        reportProgress('responses', 'in_progress', 'Packaging responses and dynamic form fields...');

        const syncPayload = {
            localId: surveyResponse.localId,
            siteId: surveyResponse.siteId,
            templateId: surveyResponse.templateId,
            templateVersion: surveyResponse.templateVersion,
            answers: surveyResponse.answers,
            respondentMetadata: surveyResponse.respondentMetadata || {},
            gpsLocation: surveyResponse.gpsLocation,
            photos: photos.map(p => ({
                photoId: p.photoId,
                filename: p.filename,
                base64Data: p.base64Data,
                capturedAt: p.capturedAt
            })),
            attachments: attachments.map(a => ({
                attachmentId: a.attachmentId,
                filename: a.filename,
                base64Data: a.base64Data,
                size: a.size
            })),
            signature: surveyResponse.signature,
            isDraft: surveyResponse.isDraft
        };

        reportProgress('gps', 'in_progress', 'Verifying GPS coordinates...');
        reportProgress('photos', 'in_progress', `Synchronizing ${photos.length} captured photos...`);
        reportProgress('attachments', 'in_progress', `Synchronizing ${attachments.length} attachments...`);
        reportProgress('signatures', 'in_progress', 'Synchronizing electronic signature...');

        // Send synchronization request to backend
        const response = await api.post('/site-survey/sync', syncPayload);
        const result = response.data;

        if (!result.success) {
            throw new Error(result.message || 'Server failed to process sync request');
        }

        reportProgress('status', 'in_progress', 'Updating local database sync status...');

        // Step 7: Post-sync update - mark survey as synced in IndexedDB
        await db.surveyResponses.where('localId').equals(localId).modify({
            syncStatus: 'synced',
            serverId: result.serverId,
            syncedAt: new Date().toISOString()
        });

        // Update corresponding site status if siteId exists
        if (surveyResponse.siteId) {
            await db.assignedSites.where('serverId').equals(surveyResponse.siteId).modify({
                status: 'Synced'
            });
        }

        // Clean up pending uploads queue for this survey
        await db.pendingUploads.where('localSurveyId').equals(localId).delete();

        // Record local sync log
        await db.syncLogs.add({
            localSurveyId: localId,
            serverSurveyId: result.serverId,
            siteId: surveyResponse.siteId,
            templateId: surveyResponse.templateId,
            syncStatus: 'synced',
            stepsCompleted: result.stepsCompleted || [],
            errors: [],
            timestamp: new Date().toISOString()
        });

        reportProgress('status', 'completed', 'Survey successfully synchronized!');
        return { success: true, serverId: result.serverId };

    } catch (err: any) {
        console.error('Survey sync error:', err);
        reportProgress('status', 'failed', err.message || 'Sync failed');

        await db.surveyResponses.where('localId').equals(localId).modify({
            syncStatus: 'failed'
        });

        await db.syncLogs.add({
            localSurveyId: localId,
            siteId: surveyResponse.siteId,
            templateId: surveyResponse.templateId,
            syncStatus: 'failed',
            stepsCompleted: [],
            errors: [{ step: 'sync', message: err.message, timestamp: new Date().toISOString() }],
            timestamp: new Date().toISOString()
        });

        return { success: false, error: err.message };
    }
};

// Batch Sync Engine for all pending survey responses
export const syncAllPendingSurveys = async (
    onProgress?: (index: number, total: number, message: string) => void
): Promise<{ total: number; synced: number; failed: number }> => {
    const pendingSurveys = await db.surveyResponses.where('syncStatus').equals('pending').toArray();
    let synced = 0;
    let failed = 0;

    for (let i = 0; i < pendingSurveys.length; i++) {
        const survey = pendingSurveys[i];
        if (onProgress) {
            onProgress(i + 1, pendingSurveys.length, `Syncing survey ${i + 1} of ${pendingSurveys.length}...`);
        }
        const res = await executeSurveySync(survey);
        if (res.success) {
            synced++;
        } else {
            failed++;
        }
    }

    return { total: pendingSurveys.length, synced, failed };
};
