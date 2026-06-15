import React from 'react';
import {
    Heading, StickyNote, Type, MessageSquare, Hash, Calendar,
    Circle, CheckSquare, ChevronDown, Grid, Table, MapPin,
    Phone, Mail, Upload, X
} from 'lucide-react';
import { useFormBuilder, AnswerType } from '../../../context/FormBuilderContext';

export const FIELD_TYPES = [
    { type: 'header', label: 'Section Header', icon: Heading, desc: 'Group questions with a title' },
    { type: 'note', label: 'Instruction Note', icon: StickyNote, desc: 'Enumerator or user instructions' },
    { type: 'tip', label: 'Tip', icon: StickyNote, desc: 'Helpful guidance or context' },
    { type: 'text', label: 'Short Text', icon: Type, desc: 'Names, brief responses' },
    { type: 'textarea', label: 'Long Text', icon: MessageSquare, desc: 'Detailed descriptions' },
    { type: 'number', label: 'Number', icon: Hash, desc: 'Age, amounts, quantities' },
    { type: 'date', label: 'Date', icon: Calendar, desc: 'Days, months, years' },
    { type: 'radio', label: 'Single Choice', icon: Circle, desc: 'Select one option' },
    { type: 'checkbox', label: 'Multiple Choice', icon: CheckSquare, desc: 'Select multiple options' },
    { type: 'select', label: 'Dropdown', icon: ChevronDown, desc: 'Select from a list' },
    { type: 'matrix', label: 'Matrix Grid', icon: Grid, desc: 'Table-based multiple choice' },
    { type: 'table', label: 'Dynamic Table', icon: Table, desc: 'User can add multiple rows' },
    { type: 'geo', label: 'Location', icon: MapPin, desc: 'GPS Coordinates' },
    { type: 'phone', label: 'Phone', icon: Phone, desc: 'Mobile/Landline' },
    { type: 'email', label: 'Email', icon: Mail, desc: 'Standard email format' },
    { type: 'file', label: 'File Upload', icon: Upload, desc: 'Upload images or PDF' },
] as const;

const QuestionTypeSelector: React.FC = () => {
    const { state, dispatch } = useFormBuilder();

    if (!state.isSelectingType) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <header className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Select Question Type</h2>
                        <p className="text-gray-500">Pick the structure that best fits your data requirements</p>
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'CLOSE_TYPE_SELECTOR' })}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FIELD_TYPES.map((field) => (
                        <button
                            key={field.type}
                            onClick={() => {
                                if (state.targetModuleId) {
                                    dispatch({
                                        type: 'ADD_QUESTION',
                                        moduleId: state.targetModuleId,
                                        answerType: field.type as AnswerType
                                    });
                                }
                            }}
                            className="group flex flex-col items-start p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left"
                        >
                            <div className="p-3 rounded-xl bg-gray-100 group-hover:bg-blue-600 group-hover:text-white transition-colors mb-4">
                                <field.icon size={24} />
                            </div>
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-700">{field.label}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{field.desc}</p>
                        </button>
                    ))}
                </div>

                <footer className="p-6 border-t bg-gray-50/50 flex justify-end">
                    <button
                        onClick={() => dispatch({ type: 'CLOSE_TYPE_SELECTOR' })}
                        className="px-6 py-2 text-sm font-bold text-gray-600 hover:text-gray-900"
                    >
                        Cancel
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default QuestionTypeSelector;
