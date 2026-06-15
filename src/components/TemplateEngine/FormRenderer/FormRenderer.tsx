import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    TextField, TextareaField, RadioField, CheckboxField, SelectField, MatrixField, TableField, GeoField, FileField
} from './FieldComponents';
import { ChevronLeft, ChevronRight, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface FormRendererProps {
    template: any;
    onSubmit: (data: any) => void;
    onSaveDraft?: (data: any) => void;
    initialData?: any;
}

const FormRenderer: React.FC<FormRendererProps> = ({
    template,
    onSubmit,
    onSaveDraft,
    initialData
}) => {
    const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
    const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm({
        defaultValues: initialData || {}
    });

    const { user } = useAuth();

    const formValues = watch();
    const currentModule = template?.modules?.[currentModuleIdx];

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        } else if (user && template?.modules?.length > 0) {
            // Check for fields that need auto-filling
            template.modules.forEach((mod: any) => {
                mod.sections?.forEach((sec: any) => {
                    sec.fields?.forEach((field: any) => {
                        if (field.systemAutoFill && field.systemAutoFill !== 'none') {
                            let val = '';
                            switch (field.systemAutoFill) {
                                case 'user_name': val = user.fullname; break;
                                case 'user_phone': val = user.phone || ''; break;
                                case 'user_email': val = user.email; break;
                                case 'user_subcity': val = user.subcity || ''; break;
                                case 'user_kebele': val = user.kebele || ''; break;
                                case 'user_organization': val = user.organization?.name || ''; break;
                            }
                            if (val) {
                                setValue(field.questionCode, val);
                            }
                        }
                    });
                });
            });
        }
    }, [initialData, reset, user, template, setValue]);

    // Evaluate conditional logic
    const shouldShowField = (field: any) => {
        if (!field.conditionalLogic || !field.conditionalLogic.dependsOn) return true;

        const { dependsOn, operator, value } = field.conditionalLogic;
        const triggerValue = formValues[dependsOn];

        switch (operator) {
            case 'equals': return triggerValue === value;
            case 'not_equals': return triggerValue !== value;
            case 'contains': return Array.isArray(triggerValue) && triggerValue.includes(value);
            case 'greater_than': return Number(triggerValue) > Number(value);
            case 'less_than': return Number(triggerValue) < Number(value);
            default: return true;
        }
    };

    const nextStep = () => {
        if (currentModuleIdx < template.modules.length - 1) {
            setCurrentModuleIdx(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            handleSubmit(onSubmit)();
        }
    };

    const prevStep = () => {
        if (currentModuleIdx > 0) {
            setCurrentModuleIdx(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    if (!template?.modules || template.modules.length === 0) {
        return (
            <div className="max-w-3xl mx-auto py-20 px-6 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="text-gray-400" size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">This form is empty</h2>
                <p className="text-gray-500 mt-2">There are no modules or questions defined in this template yet.</p>
            </div>
        );
    }

    const progress = ((currentModuleIdx + 1) / template.modules.length) * 100;
    const getFieldType = (field: any) => String(field?.type || '').trim().toLowerCase().replace(/\s+/g, '_');

    return (
        <div className="max-w-3xl mx-auto py-10 px-6">
            {/* Progress Header */}
            <div className="mb-10 text-left">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                            Module {currentModuleIdx + 1} of {template.modules.length}
                        </span>
                        <h1 className="text-2xl font-bold text-gray-900">{currentModule?.title || 'Section'}</h1>
                    </div>
                    <span className="text-sm font-medium text-gray-500">{Math.round(progress)}% Complete</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                    />
                </div>
            </div>

            <form className="space-y-12 pb-24" onSubmit={(e) => e.preventDefault()}>
                <AnimatePresence mode="wait">
                    {currentModule && (
                        <motion.div
                            key={currentModule.moduleId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="space-y-12"
                        >
                            {currentModule.sections?.map((section: any) => (
                                <div key={section.sectionId} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
                                    <div className="border-b border-gray-50 pb-4">
                                        <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                                        {section.description && <p className="text-sm text-gray-500 mt-1">{section.description}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 gap-10">
                                        {section.fields.filter(shouldShowField).map((field: any) => {
                                            const commonProps = { field, register, errors, setValue, watch };
                                            const fieldType = getFieldType(field);
                                            return (
                                                <div key={field.fieldId} className="field-group">
                                                    {(() => {
                                                        switch (fieldType) {
                                                            case 'text':
                                                            case 'number':
                                                            case 'email':
                                                            case 'phone':
                                                            case 'date':
                                                                return <TextField {...commonProps} />;
                                                            case 'textarea':
                                                                return <TextareaField {...commonProps} />;
                                                            case 'radio':
                                                                return <RadioField {...commonProps} />;
                                                            case 'checkbox':
                                                                return <CheckboxField {...commonProps} />;
                                                            case 'select':
                                                                return <SelectField {...commonProps} />;
                                                            case 'matrix':
                                                                return <MatrixField {...commonProps} />;
                                                            case 'table':
                                                                return <TableField {...commonProps} />;
                                                            case 'geo':
                                                                return <GeoField {...commonProps} />;
                                                            case 'file':
                                                                return <FileField {...commonProps} />;
                                                            case 'header':
                                                            case 'section_header':
                                                                return (
                                                                    <div className="pt-2 pb-4 border-b border-gray-100">
                                                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                                                            {field.label}
                                                                        </h3>
                                                                        {field.helpText && (
                                                                            <p className="mt-1 text-sm text-gray-500">
                                                                                {field.helpText}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            case 'note':
                                                            case 'tip':
                                                                return (
                                                                    <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-4 text-amber-900">
                                                                        <p className="text-sm font-bold uppercase tracking-wide text-amber-700">
                                                                            {field.label || 'Note'}
                                                                        </p>
                                                                        {field.helpText ? (
                                                                            <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
                                                                                {field.helpText}
                                                                            </p>
                                                                        ) : null}
                                                                    </div>
                                                                );
                                                            default:
                                                                return <div className="text-red-400">Unsupported field type: {field.type}</div>;
                                                        }
                                                    })()}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            {/* Sticky Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t p-4 z-20 shadow-[-2px_-4px_12px_rgba(0,0,0,0.03)]">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={currentModuleIdx === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={20} /> Back
                    </button>

                    <div className="flex gap-4">
                        {onSaveDraft && (
                            <button
                                type="button"
                                onClick={() => onSaveDraft(formValues)}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all border border-gray-200"
                            >
                                <Save size={18} /> Save Draft
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={nextStep}
                            className="flex items-center gap-3 px-10 py-3 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_12px_24px_rgba(37,99,235,0.3)] transition-all"
                        >
                            {currentModuleIdx === template.modules.length - 1 ? (
                                <>Finish & Submit <CheckCircle2 size={20} /></>
                            ) : (
                                <>Next Module <ChevronRight size={20} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FormRenderer;
