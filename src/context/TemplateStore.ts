import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

interface Field {
    fieldId: string;
    questionCode: string;
    label: string;
    type: string;
    options: { label: string; value: any }[];
    required: boolean;
    validation: any;
    conditionalLogic: any;
    repeatable: boolean;
    helpText: string;
    matrixConfig?: {
        rows: { label: string; value: string }[];
        columns: { label: string; value: string }[];
        cellType: string;
    };
}

interface Section {
    sectionId: string;
    title: string;
    fields: Field[];
}

interface Module {
    moduleId: string;
    title: string;
    order: number;
    sections: Section[];
}

interface TemplateState {
    template: {
        name: string;
        category: string;
        moduleType: string;
        modules: Module[];
    };
    selectedModuleId: string | null;
    selectedSectionId: string | null;
    selectedFieldId: string | null;

    // Actions
    setName: (name: string) => void;
    setCategory: (category: string) => void;
    addModule: (title: string) => void;
    removeModule: (moduleId: string) => void;
    addSection: (moduleId: string, title: string) => void;
    addField: (sectionId: string, fieldType: string) => void;
    updateField: (fieldId: string, updates: Partial<Field>) => void;
    removeField: (fieldId: string) => void;
    selectField: (fieldId: string | null) => void;
    reorderModules: (modules: Module[]) => void;
    setTemplate: (template: any) => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
    template: {
        name: 'New Questionnaire',
        category: 'Household',
        moduleType: 'HHQ',
        modules: [],
    },
    selectedModuleId: null,
    selectedSectionId: null,
    selectedFieldId: null,

    setName: (name) => set((state) => ({ template: { ...state.template, name } })),
    setCategory: (category) => set((state) => ({ template: { ...state.template, category } })),

    addModule: (title) => set((state) => {
        const newModule: Module = {
            moduleId: uuidv4(),
            title,
            order: state.template.modules.length,
            sections: [],
        };
        return {
            template: {
                ...state.template,
                modules: [...state.template.modules, newModule],
            },
            selectedModuleId: newModule.moduleId,
        };
    }),

    removeModule: (moduleId) => set((state) => ({
        template: {
            ...state.template,
            modules: state.template.modules.filter(m => m.moduleId !== moduleId)
        }
    })),

    addSection: (moduleId, title) => set((state) => ({
        template: {
            ...state.template,
            modules: state.template.modules.map(m =>
                m.moduleId === moduleId
                    ? { ...m, sections: [...m.sections, { sectionId: uuidv4(), title, fields: [] }] }
                    : m
            )
        }
    })),

    addField: (sectionId, fieldType) => set((state) => {
        const newField: Field = {
            fieldId: uuidv4(),
            questionCode: `q${Math.floor(Math.random() * 1000)}`,
            label: 'New Question',
            type: fieldType,
            options: [],
            required: false,
            validation: {},
            conditionalLogic: null,
            repeatable: false,
            helpText: '',
            matrixConfig: fieldType === 'matrix' ? { rows: [{ label: 'Row 1', value: 'r1' }], columns: [{ label: 'Col 1', value: 'c1' }], cellType: 'radio' } : undefined
        };

        return {
            template: {
                ...state.template,
                modules: state.template.modules.map(m => ({
                    ...m,
                    sections: m.sections.map(s =>
                        s.sectionId === sectionId
                            ? { ...s, fields: [...s.fields, newField] }
                            : s
                    )
                }))
            },
            selectedFieldId: newField.fieldId
        };
    }),

    updateField: (fieldId, updates) => set((state) => ({
        template: {
            ...state.template,
            modules: state.template.modules.map(m => ({
                ...m,
                sections: m.sections.map(s => ({
                    ...s,
                    fields: s.fields.map(f => f.fieldId === fieldId ? { ...f, ...updates } : f)
                }))
            }))
        }
    })),

    removeField: (fieldId) => set((state) => ({
        template: {
            ...state.template,
            modules: state.template.modules.map(m => ({
                ...m,
                sections: m.sections.map(s => ({
                    ...s,
                    fields: s.fields.filter(f => f.fieldId !== fieldId)
                }))
            }))
        },
        selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId
    })),

    selectField: (fieldId) => set({ selectedFieldId: fieldId }),

    reorderModules: (modules) => set((state) => ({
        template: { ...state.template, modules }
    })),

    setTemplate: (template) => set({ template }),
}));
