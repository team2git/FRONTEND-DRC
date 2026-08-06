import React, { useState, useEffect } from 'react';
import FormRenderer from '../TemplateEngine/FormRenderer/FormRenderer';
import { db, LocalSurveyResponse } from '../../offline/db';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface DynamicSurveyFormProps {
    template: any;
    site?: any;
    existingResponseId?: string;
    onSaveSuccess?: () => void;
    onCancel?: () => void;
}

export const DynamicSurveyForm: React.FC<DynamicSurveyFormProps> = ({
    template,
    site,
    existingResponseId,
    onSaveSuccess,
    onCancel
}) => {
    const [initialData, setInitialData] = useState<any>(null);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

    useEffect(() => {
        if (existingResponseId) {
            db.surveyResponses.where('localId').equals(existingResponseId).first().then(resp => {
                if (resp && resp.answers) {
                    setInitialData(resp.answers);
                }
            });
        }
    }, [existingResponseId]);

    // Save Survey Response to Dexie IndexedDB
    const saveResponseToIndexedDB = async (formData: any, isDraft: boolean) => {
        try {
            const localId = existingResponseId || `SURVEY-${Date.now()}-${uuidv4().substring(0, 8)}`;
            
            // Extract photos & signature if present in formData
            let signature: string | undefined = undefined;
            const photos: any[] = [];

            Object.entries(formData || {}).forEach(([, val]: [string, any]) => {
                if (typeof val === 'string' && val.startsWith('data:image')) {
                    signature = val;
                } else if (val && typeof val === 'object' && val.data && typeof val.data === 'string' && val.data.startsWith('data:image')) {
                    photos.push({
                        photoId: uuidv4(),
                        filename: val.name || `photo_${Date.now()}.jpg`,
                        base64Data: val.data
                    });
                }
            });

            const responseRecord: LocalSurveyResponse = {
                localId,
                siteId: site?.serverId || site?.siteCode || undefined,
                templateId: template.serverId || template._id || template.id || template.name || template.templateName || 'DEFAULT_TEMPLATE',
                templateVersion: template.version || 1,
                answers: formData,
                respondentMetadata: {
                    siteCode: site?.siteCode,
                    siteName: site?.name,
                    submittedAt: new Date().toISOString()
                },
                signature,
                syncStatus: 'pending',
                isDraft,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const existing = await db.surveyResponses.where('localId').equals(localId).first();
            if (existing && existing.id) {
                responseRecord.id = existing.id;
            }
            await db.surveyResponses.put(responseRecord);

            // Store photos
            await db.surveyPhotos.where('localSurveyId').equals(localId).delete();
            for (const p of photos) {
                await db.surveyPhotos.add({
                    localSurveyId: localId,
                    photoId: p.photoId,
                    base64Data: p.base64Data,
                    filename: p.filename,
                    mimeType: 'image/jpeg',
                    capturedAt: new Date().toISOString()
                });
            }

            // Queue for sync
            await db.pendingUploads.add({
                localSurveyId: localId,
                step: 'header',
                payload: { localId, isDraft },
                attempts: 0,
                createdAt: new Date().toISOString()
            });

            setSaveSuccessMsg(isDraft ? 'Draft saved locally!' : 'Survey completed & queued for synchronization!');

            setTimeout(() => {
                if (onSaveSuccess) onSaveSuccess();
            }, 1000);
        } catch (err: any) {
            console.error('Failed to save survey locally:', err);
            alert(`Save error: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Top Action Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <div className="text-right">
                    <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-full border border-brand-200">
                        {site ? `Site: ${site.name}` : 'Offline Form Renderer'}
                    </span>
                </div>
            </div>

            {saveSuccessMsg && (
                <div className="max-w-3xl mx-auto mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold text-sm">{saveSuccessMsg}</span>
                </div>
            )}

            {/* Core Form Renderer - Shared 100% with Online FormResponsePage */}
            <FormRenderer
                template={template}
                initialData={initialData}
                onSubmit={(data) => saveResponseToIndexedDB(data, false)}
                onSaveDraft={(data) => saveResponseToIndexedDB(data, true)}
            />
        </div>
    );
};
