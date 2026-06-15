import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Types & Interfaces ---
export type AnswerType =
    | 'header' | 'note' | 'tip' | 'text' | 'textarea' | 'number' | 'date'
    | 'radio' | 'checkbox' | 'select' | 'matrix' | 'table'
    | 'geo' | 'phone' | 'email' | 'file';

export interface Option {
    label: string;
    value: string;
    hasAdditionalInput?: boolean;
    additionalInput?: {
        type: 'text' | 'textarea' | 'number';
        label: string;
    };
}

export interface Question {
    questionId: string;
    questionCode: string;
    label: string;
    answerType: AnswerType;
    helperText: string;
    required: boolean;
    options: Option[];
    matrixConfig: {
        rows: { label: string; value: string }[];
        columns: { label: string; value: string }[];
        cellType: 'radio' | 'checkbox' | 'number' | 'text';
    };
    tableConfig: {
        columns: { label: string; type: string }[];
        allowAddRow: boolean;
    };
    validation: {
        min?: string | number;
        max?: string | number;
        pattern?: string;
        placeholder?: string;
    };
}

export interface Module {
    moduleId: string;
    moduleName: string;
    questions: Question[];
}

export interface FormTemplate {
    templateName: string;
    modules: Module[];
}

interface FormState {
    template: FormTemplate;
    activeQuestionId: string | null;
    isSelectingType: boolean;
    isSettingsOpen: boolean;
    isThemeOpen: boolean;
    targetModuleId: string | null;
    targetInsertIndex: number | null;
    theme: {
        primaryColor: string;
        headerImage: string;
        fontFamily: string;
        headerOpacity: number;
    };
    settings: {
        showQuestionCodes: boolean;
        autoSave: boolean;
        defaultRequired: boolean;
        publicAccess: boolean;
    };
}

// --- Actions ---
type Action =
    | { type: 'SET_TEMPLATE_NAME'; name: string }
    | { type: 'ADD_MODULE'; name: string }
    | { type: 'ADD_MODULE_AT'; name: string; index: number }
    | { type: 'REMOVE_MODULE'; moduleId: string }
    | { type: 'UPDATE_MODULE_NAME'; moduleId: string; name: string }
    | { type: 'OPEN_TYPE_SELECTOR'; moduleId: string; insertIndex?: number }
    | { type: 'CLOSE_TYPE_SELECTOR' }
    | { type: 'ADD_QUESTION'; moduleId: string; answerType: AnswerType }
    | { type: 'UPDATE_QUESTION'; questionId: string; updates: Partial<Question> }
    | { type: 'REMOVE_QUESTION'; questionId: string }
    | { type: 'DUPLICATE_QUESTION'; questionId: string }
    | { type: 'SELECT_QUESTION'; questionId: string | null }
    | { type: 'TOGGLE_SETTINGS'; open?: boolean }
    | { type: 'TOGGLE_THEME'; open?: boolean }
    | { type: 'MOVE_MODULE'; moduleId: string; direction: 'up' | 'down' }
    | { type: 'MOVE_QUESTION'; questionId: string; direction: 'up' | 'down' }
    | { type: 'REORDER_MODULES'; modules: Module[] }
    | { type: 'REORDER_QUESTIONS'; moduleId: string; questions: Question[] }
    | { type: 'UPDATE_THEME'; updates: Partial<FormState['theme']> }
    | { type: 'UPDATE_SETTINGS'; updates: Partial<FormState['settings']> }
    | { type: 'LOAD_TEMPLATE'; template: FormTemplate };

// --- Reducer ---
const formReducer = (state: FormState, action: Action): FormState => {
    switch (action.type) {
        case 'SET_TEMPLATE_NAME':
            return { ...state, template: { ...state.template, templateName: action.name } };

        case 'ADD_MODULE':
            return {
                ...state,
                template: {
                    ...state.template,
                    modules: [...state.template.modules, { moduleId: uuidv4(), moduleName: action.name, questions: [] }]
                }
            };

        case 'ADD_MODULE_AT': {
            const modules = [...state.template.modules];
            const clampedIndex = Math.max(0, Math.min(action.index, modules.length));
            modules.splice(clampedIndex, 0, { moduleId: uuidv4(), moduleName: action.name, questions: [] });
            return { ...state, template: { ...state.template, modules } };
        }

        case 'REMOVE_MODULE':
            if (state.template.modules.length <= 1) return state; // Keep at least one
            return {
                ...state,
                template: {
                    ...state.template,
                    modules: state.template.modules.filter(m => m.moduleId !== action.moduleId)
                }
            };

        case 'UPDATE_MODULE_NAME':
            return {
                ...state,
                template: {
                    ...state.template,
                    modules: state.template.modules.map(m => m.moduleId === action.moduleId ? { ...m, moduleName: action.name } : m)
                }
            };

        case 'OPEN_TYPE_SELECTOR': {
            if (action.moduleId !== 'any') {
                return {
                    ...state,
                    isSelectingType: true,
                    targetModuleId: action.moduleId,
                    targetInsertIndex: action.insertIndex ?? null
                };
            }

            const lastModuleId = state.template.modules[state.template.modules.length - 1]?.moduleId;
            if (lastModuleId) {
                return {
                    ...state,
                    isSelectingType: true,
                    targetModuleId: lastModuleId,
                    targetInsertIndex: action.insertIndex ?? null
                };
            }

            // If a backend template loads with no modules, create a default one so questions can be added.
            const newModuleId = uuidv4();
            return {
                ...state,
                isSelectingType: true,
                targetModuleId: newModuleId,
                targetInsertIndex: action.insertIndex ?? null,
                template: {
                    ...state.template,
                    modules: [{ moduleId: newModuleId, moduleName: 'Module 1', questions: [] }]
                }
            };
        }

        case 'CLOSE_TYPE_SELECTOR':
            return { ...state, isSelectingType: false, targetModuleId: null, targetInsertIndex: null };

        case 'ADD_QUESTION': {
            const newQuestion: Question = {
                questionId: uuidv4(),
                questionCode: `q${Math.floor(Math.random() * 900) + 100}`,
                label:
                    action.answerType === 'header'
                        ? 'New Header'
                        : action.answerType === 'note'
                            ? 'New Note'
                            : action.answerType === 'tip'
                                ? 'New Tip'
                                : 'New Question',
                answerType: action.answerType,
                helperText: '',
                required: state.settings.defaultRequired,
                options: [],
                matrixConfig: { rows: [], columns: [], cellType: 'radio' },
                tableConfig: { columns: [], allowAddRow: true },
                validation: {}
            };

            return {
                ...state,
                isSelectingType: false,
                targetModuleId: null,
                targetInsertIndex: null,
                activeQuestionId: newQuestion.questionId,
                template: {
                    ...state.template,
                    modules: state.template.modules.map(m =>
                        m.moduleId !== action.moduleId
                            ? m
                            : (() => {
                                const questions = [...m.questions];
                                const insertAt = state.targetInsertIndex;
                                if (typeof insertAt === 'number' && insertAt >= 0 && insertAt <= questions.length) {
                                    questions.splice(insertAt, 0, newQuestion);
                                } else {
                                    questions.push(newQuestion);
                                }
                                return { ...m, questions };
                            })()
                    )
                }
            };
        }

        case 'UPDATE_QUESTION':
            return {
                ...state,
                template: {
                    ...state.template,
                    modules: state.template.modules.map(m => ({
                        ...m,
                        questions: m.questions.map(q => q.questionId === action.questionId ? { ...q, ...action.updates } : q)
                    }))
                }
            };

        case 'REMOVE_QUESTION':
            return {
                ...state,
                activeQuestionId: state.activeQuestionId === action.questionId ? null : state.activeQuestionId,
                template: {
                    ...state.template,
                    modules: state.template.modules.map(m => ({
                        ...m,
                        questions: m.questions.filter(q => q.questionId !== action.questionId)
                    }))
                }
            };

        case 'DUPLICATE_QUESTION': {
            let found = false;
            let newQId = '';
            const newModules = state.template.modules.map(m => {
                const idx = m.questions.findIndex(q => q.questionId === action.questionId);
                if (idx !== -1) {
                    found = true;
                    const original = m.questions[idx];
                    const clone = JSON.parse(JSON.stringify(original));
                    clone.questionId = uuidv4();
                    clone.questionCode = `${original.questionCode}_copy`;
                    newQId = clone.questionId;
                    const updatedQuestions = [...m.questions];
                    updatedQuestions.splice(idx + 1, 0, clone);
                    return { ...m, questions: updatedQuestions };
                }
                return m;
            });

            if (!found) return state;

            return {
                ...state,
                activeQuestionId: newQId,
                template: { ...state.template, modules: newModules }
            };
        }

        case 'SELECT_QUESTION':
            return { ...state, activeQuestionId: action.questionId };

        case 'TOGGLE_SETTINGS':
            return { ...state, isSettingsOpen: action.open ?? !state.isSettingsOpen };

        case 'TOGGLE_THEME':
            return { ...state, isThemeOpen: action.open ?? !state.isThemeOpen };

        case 'MOVE_MODULE': {
            const modules = [...state.template.modules];
            const idx = modules.findIndex(m => m.moduleId === action.moduleId);
            if (idx === -1) return state;
            const newIdx = action.direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= modules.length) return state;

            const temp = modules[idx];
            modules[idx] = modules[newIdx];
            modules[newIdx] = temp;

            return { ...state, template: { ...state.template, modules } };
        }

        case 'MOVE_QUESTION': {
            const modules = state.template.modules.map(m => {
                const idx = m.questions.findIndex(q => q.questionId === action.questionId);
                if (idx === -1) return m;

                const newIdx = action.direction === 'up' ? idx - 1 : idx + 1;
                if (newIdx < 0 || newIdx >= m.questions.length) return m;

                const questions = [...m.questions];
                const temp = questions[idx];
                questions[idx] = questions[newIdx];
                questions[newIdx] = temp;

                return { ...m, questions };
            });

            return { ...state, template: { ...state.template, modules } };
        }

        case 'REORDER_MODULES':
            return { ...state, template: { ...state.template, modules: action.modules } };

        case 'REORDER_QUESTIONS':
            return {
                ...state,
                template: {
                    ...state.template,
                    modules: state.template.modules.map(m =>
                        m.moduleId === action.moduleId ? { ...m, questions: action.questions } : m
                    )
                }
            };

        case 'UPDATE_THEME':
            return { ...state, theme: { ...state.theme, ...action.updates } };

        case 'UPDATE_SETTINGS':
            return { ...state, settings: { ...state.settings, ...action.updates } };

        case 'LOAD_TEMPLATE':
            return { ...state, template: action.template, activeQuestionId: null };

        default:
            return state;
    }
};

const initialState: FormState = {
    template: {
        templateName: "New Questionnaire",
        modules: [
            { moduleId: uuidv4(), moduleName: "Module 1", questions: [] }
        ]
    },
    activeQuestionId: null,
    isSelectingType: false,
    isSettingsOpen: false,
    isThemeOpen: false,
    targetModuleId: null,
    targetInsertIndex: null,
    theme: {
        primaryColor: '#673AB7',
        headerImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200",
        fontFamily: 'Inter',
        headerOpacity: 100
    },
    settings: {
        showQuestionCodes: true,
        autoSave: false,
        defaultRequired: false,
        publicAccess: false
    }
};

const FormBuilderContext = createContext<{
    state: FormState;
    dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

export const FormBuilderProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(formReducer, initialState);
    return (
        <FormBuilderContext.Provider value={{ state, dispatch }}>
            {children}
        </FormBuilderContext.Provider>
    );
};

export const useFormBuilder = () => {
    const context = useContext(FormBuilderContext);
    if (!context) throw new Error('useFormBuilder must be used within a FormBuilderProvider');
    return context;
};
