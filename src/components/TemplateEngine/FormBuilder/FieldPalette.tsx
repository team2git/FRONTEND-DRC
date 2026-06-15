import React from 'react';
import {
    Type, Hash, Calendar, CheckSquare, Circle,
    ChevronDown, MessageSquare, Grid, Table,
    MapPin, Phone, Upload, Mail,
    StickyNote, Heading
} from 'lucide-react';

const FIELD_TYPES = [
    { type: 'header', label: 'Section Header', icon: Heading },
    { type: 'note', label: 'Instruction Note', icon: StickyNote },
    { type: 'tip', label: 'Tip', icon: StickyNote },
    { type: 'text', label: 'Short Text', icon: Type },
    { type: 'textarea', label: 'Long Text', icon: MessageSquare },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'date', label: 'Date', icon: Calendar },
    { type: 'radio', label: 'Single Choice', icon: Circle },
    { type: 'checkbox', label: 'Multiple Choice', icon: CheckSquare },
    { type: 'select', label: 'Dropdown', icon: ChevronDown },
    { type: 'matrix', label: 'Matrix Grid', icon: Grid },
    { type: 'table', label: 'Dynamic Table', icon: Table },
    { type: 'geo', label: 'Location', icon: MapPin },
    { type: 'phone', label: 'Phone', icon: Phone },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'file', label: 'File Upload', icon: Upload },
];

interface FieldPaletteProps {
    onAddField: (type: string) => void;
}

const FieldPalette: React.FC<FieldPaletteProps> = ({ onAddField }) => {
    return (
        <div className="p-4 bg-white border-r h-full overflow-y-auto w-64">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Question Types
            </h3>
            <div className="grid grid-cols-1 gap-2">
                {FIELD_TYPES.map((field) => (
                    <button
                        key={field.type}
                        onClick={() => onAddField(field.type)}
                        className="flex items-center gap-3 p-3 text-left rounded-lg border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <div className="p-2 bg-gray-50 rounded text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600">
                            <field.icon size={18} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                            {field.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FieldPalette;
