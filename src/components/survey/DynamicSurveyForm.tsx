import React, { useState, useEffect } from 'react';
import FormRenderer from '../TemplateEngine/FormRenderer/FormRenderer';
import { db, LocalSurveyResponse, LocalAssignedSite } from '../../offline/db';
import { CheckCircle, ArrowLeft, FileText, MapPin } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { checkHouseholdHouseNo } from '../../api/woredaProfileService';
import { DuplicateHousePromptModal, type DuplicateConflictDetails } from './DuplicateHousePromptModal';

interface DynamicSurveyFormProps {
    template: any;
    site?: LocalAssignedSite | null;
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
    const [conflictModalOpen, setConflictModalOpen] = useState(false);
    const [conflictDetails, setConflictDetails] = useState<DuplicateConflictDetails | null>(null);
    const [pendingSubmission, setPendingSubmission] = useState<{ data: any; isDraft: boolean } | null>(null);

    useEffect(() => {
        if (existingResponseId) {
            db.surveyResponses.where('localId').equals(existingResponseId).first().then(resp => {
                if (resp && resp.answers) {
                    setInitialData(resp.answers);
                }
            });
        }
    }, [existingResponseId]);

    // Extract house_no and woreda helper from dynamic answers
    const extractLocationInfo = (formData: any) => {
        let houseNo = '';
        let woreda = site?.woreda || '';
        let subcity = site?.region || '';

        Object.entries(formData || {}).forEach(([k, v]) => {
            const keyLower = k.toLowerCase();
            const valStr = typeof v === 'string' ? v : (v && typeof v === 'object' && 'value' in v ? String(v.value) : '');
            if (!houseNo && (keyLower.includes('house_no') || keyLower.includes('house_number') || keyLower === 'house' || keyLower === 'house_num')) {
                houseNo = valStr;
            }
            if (!woreda && keyLower.includes('woreda')) {
                woreda = valStr;
            }
            if (!subcity && (keyLower.includes('subcity') || keyLower.includes('sub_city'))) {
                subcity = valStr;
            }
        });

        return { houseNo: houseNo.trim(), woreda: woreda.trim(), subcity: subcity.trim() };
    };

    // Pre-save duplicate check
    const handleFormSubmit = async (formData: any, isDraft: boolean) => {
        const { houseNo, woreda, subcity } = extractLocationInfo(formData);
        const isUnnumbered = !houseNo || ['none', 'n/a', 'no house no', 'no house number', 'unnumbered'].includes(houseNo.toLowerCase());

        if (!isDraft && !isUnnumbered && !existingResponseId) {
            // Check IndexedDB local responses first
            const allLocal = await db.surveyResponses.toArray();
            const duplicateLocal = allLocal.find(r => {
                const loc = extractLocationInfo(r.answers);
                return loc.houseNo.toLowerCase() === houseNo.toLowerCase() &&
                       (!woreda || !loc.woreda || loc.woreda.toLowerCase() === woreda.toLowerCase());
            });

            if (duplicateLocal) {
                setConflictDetails({
                    house_no: houseNo,
                    woreda: woreda || 'this area',
                    subcity,
                    targetType: 'household',
                    existingId: duplicateLocal.localId,
                    existingData: duplicateLocal
                });
                setPendingSubmission({ data: formData, isDraft });
                setConflictModalOpen(true);
                return;
            }

            // If online, check server
            try {
                const checkRes = await checkHouseholdHouseNo({
                    woreda,
                    subcity,
                    house_no: houseNo
                });
                if (checkRes && checkRes.exists) {
                    setConflictDetails({
                        house_no: houseNo,
                        woreda: woreda || 'this area',
                        subcity,
                        targetType: 'household',
                        existingId: checkRes.profile?._id,
                        existingData: checkRes.profile
                    });
                    setPendingSubmission({ data: formData, isDraft });
                    setConflictModalOpen(true);
                    return;
                }
            } catch (e) {
                // If offline or check fails, proceed
            }
        }

        await saveResponseToIndexedDB(formData, isDraft);
    };

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

            const templateIdentifier = String(
                template.serverId || template._id || template.id || template.name || 'DEFAULT_TEMPLATE'
            );

            const responseRecord: LocalSurveyResponse = {
                localId,
                siteId: site?.serverId || site?.siteCode || undefined,
                templateId: templateIdentifier,
                templateVersion: template.version || 1,
                answers: formData || {},
                respondentMetadata: {
                    templateName: template.name || 'Site Survey',
                    category: template.category || 'General',
                    siteName: site?.name,
                    siteCode: site?.siteCode,
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

            // Store photos if any
            if (photos.length > 0) {
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
            }

            // Queue for sync
            await db.pendingUploads.add({
                localSurveyId: localId,
                step: 'header',
                payload: { localId, isDraft },
                attempts: 0,
                createdAt: new Date().toISOString()
            });

            const answerCount = Object.keys(formData || {}).length;
            const message = isDraft
                ? `Draft saved locally (${answerCount} fields)!`
                : `Survey completed & queued for synchronization (${answerCount} fields)!`;

            setSaveSuccessMsg(message);

            setTimeout(() => {
                if (onSaveSuccess) onSaveSuccess();
            }, 600);
        } catch (err: any) {
            console.error('Failed to save survey locally:', err);
            alert(`Failed to save survey locally: ${err.message}`);
        }
    };

    const handleUpdateExisting = async () => {
        if (!pendingSubmission) return;
        setConflictModalOpen(false);
        // Save using conflict's existing localId if local, or continue with current submission
        await saveResponseToIndexedDB(pendingSubmission.data, pendingSubmission.isDraft);
        setPendingSubmission(null);
    };

    const handleRegisterNewHouseNo = async (newHouseNo: string) => {
        if (!pendingSubmission) return;
        setConflictModalOpen(false);

        const updatedData = { ...pendingSubmission.data };
        // Find and replace house number keys
        Object.keys(updatedData).forEach(k => {
            const keyLower = k.toLowerCase();
            if (keyLower.includes('house_no') || keyLower.includes('house_number') || keyLower === 'house' || keyLower === 'house_num') {
                if (typeof updatedData[k] === 'object' && updatedData[k] !== null && 'value' in updatedData[k]) {
                    updatedData[k] = { ...updatedData[k], value: newHouseNo };
                } else {
                    updatedData[k] = newHouseNo;
                }
            }
        });

        await saveResponseToIndexedDB(updatedData, pendingSubmission.isDraft);
        setPendingSubmission(null);
    };

    const handleRegisterAsNoHouseNo = async () => {
        await handleRegisterNewHouseNo('No House No');
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
            {/* Top Action Bar */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-30 flex flex-wrap justify-between items-center gap-3 shadow-xs">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Survey Templates
                </button>
                <div className="flex items-center gap-2">
                    {site && (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                            <MapPin className="w-3.5 h-3.5" />
                            {site.name} ({site.siteCode})
                        </span>
                    )}
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800">
                        <FileText className="w-3.5 h-3.5" />
                        {template.name}
                    </span>
                    {template.version && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold rounded-md">
                            v{template.version}
                        </span>
                    )}
                </div>
            </div>

            {saveSuccessMsg && (
                <div className="max-w-3xl mx-auto mt-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
                    <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
                    <span className="font-bold text-sm">{saveSuccessMsg}</span>
                </div>
            )}

            {/* Core Form Renderer */}
            <FormRenderer
                template={template}
                initialData={initialData}
                onSubmit={(data) => handleFormSubmit(data, false)}
                onSaveDraft={(data) => handleFormSubmit(data, true)}
            />

            {/* Duplicate House Prompt Modal */}
            <DuplicateHousePromptModal
                isOpen={conflictModalOpen}
                conflict={conflictDetails}
                onClose={() => {
                    setConflictModalOpen(false);
                    setPendingSubmission(null);
                }}
                onUpdateExisting={handleUpdateExisting}
                onRegisterNewHouseNo={handleRegisterNewHouseNo}
                onRegisterAsNoHouseNo={handleRegisterAsNoHouseNo}
            />
        </div>
    );
};
