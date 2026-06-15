import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import api from '@/api/axios';
import FormRenderer from '@/components/TemplateEngine/FormRenderer/FormRenderer';
import { toast } from 'react-toastify';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageMeta from '@/components/common/PageMeta';
import { useAuth } from '@/context/AuthContext';

const FormResponsePage: React.FC = () => {
    const { templateId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    
    // Check if we are in Edit Mode
    const searchParams = new URLSearchParams(location.search);
    const editResponseId = searchParams.get('edit');

    const [template, setTemplate] = useState<any>(null);
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // 1. Fetch Template
                const tRes = await api.get(`/templates/${templateId}`);
                setTemplate(tRes.data);

                // 2. If Editing, fetch original response
                if (editResponseId) {
                    const rRes = await api.get(`/responses/${editResponseId}`);
                    const responseData = rRes.data;
                    
                    // Transform answers { key: { value } } -> { key: value }
                    const transformedAnswers: any = {};
                    if (responseData.answers) {
                        Object.entries(responseData.answers).forEach(([key, val]: [string, any]) => {
                            transformedAnswers[key] = val.value ?? val;
                        });
                    }
                    setInitialData(transformedAnswers);
                }
            } catch (error: any) {
                console.error("Error fetching data:", error);
                toast.error(error.response?.data?.message || 'Failed to initialize form');
            } finally {
                setLoading(false);
            }
        };

        if (templateId) {
            fetchData();
        }
    }, [templateId, editResponseId]);

    const onSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);

            const payload = {
                templateId,
                templateVersion: template?.version,
                moduleContextId: templateId,
                moduleContextType: template?.category || 'Assessment',
                answers: data,
                respondentMetadata: {
                    fullName: user?.fullname || "Survey Respondent",
                    enumeratorId: user?.id,
                    submittedAt: new Date().toISOString()
                }
            };

            if (editResponseId) {
                // Update existing
                await api.put(`/responses/${editResponseId}`, payload);
                toast.success('Response updated successfully!');
            } else {
                // Submit new
                await api.post('/responses', payload);
                toast.success('Response submitted successfully!');
            }
            setSubmitted(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit response');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <Loader2 className="animate-spin text-blue-600 mb-6" size={48} />
                <div className="text-center">
                    <p className="text-xl font-black text-gray-900 mb-1">Preparing Questionnaire</p>
                    <p className="text-gray-400 font-medium">Please wait while we fetch the latest version...</p>
                </div>
            </div>
        );
    }

    if (!template) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-gray-900">
                <div className="bg-white p-12 rounded-[40px] shadow-2xl shadow-red-100 border border-red-50 text-center max-w-lg">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <AlertCircle className="text-red-500" size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Template Not Found</h2>
                    <p className="text-gray-500 mb-10 text-lg leading-relaxed">The questionnaire link might be expired, deleted, or in a draft state. Please check with your administrator.</p>
                    <button
                        onClick={() => navigate('/admin/template-library')}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:shadow-xl transition-all"
                    >
                        Return to Library
                    </button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-gray-900">
                <PageMeta title="Submission Successful | IDRMIS" description="Form submitted" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-12 rounded-[40px] shadow-2xl shadow-blue-100 border border-blue-50 text-center max-w-lg"
                >
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="text-green-600" size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Submission Complete!</h2>
                    <p className="text-gray-500 mb-10 text-lg">Thank you. Your responses for <span className="font-bold text-gray-800">"{template.name}"</span> have been securely recorded.</p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all"
                        >
                            Submit Another Response
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans antialiased text-gray-900">
            <PageMeta
                title={`${template.name} | Questionnaire`}
                description={template.description || 'Questionnaire'}
            />

            <nav className="bg-white/90 backdrop-blur-xl border-b sticky top-0 z-50 px-6 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 hover:bg-gray-100 rounded-2xl text-gray-500 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">{template.name}</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Version {template.version}</p>
                    </div>
                    <div className="w-10" />
                </div>
            </nav>

            <FormRenderer
                template={template}
                onSubmit={onSubmit}
                initialData={initialData}
            />

            <AnimatePresence>
                {isSubmitting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-sm flex items-center justify-center flex-col"
                    >
                        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                        <p className="text-xl font-black text-gray-900">Uploading Responses...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FormResponsePage;
