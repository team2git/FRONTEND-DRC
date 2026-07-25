import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface ActionItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    danger?: boolean;
    hidden?: boolean;
}

interface RowActionMenuProps {
    actions: ActionItem[];
}

export const RowActionMenu: React.FC<RowActionMenuProps> = ({ actions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const visibleActions = actions.filter(a => !a.hidden);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (visibleActions.length === 0) return null;

    return (
        <div className="relative inline-block text-left" ref={menuRef} onClick={e => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#172358] hover:border-[#172358]/30 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                aria-label="Row Actions"
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-52 rounded-2xl bg-white shadow-2xl border border-slate-200/80 z-[100] overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100">
                    {visibleActions.map((action, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                action.onClick();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all text-left cursor-pointer ${
                                action.danger
                                    ? 'text-rose-600 hover:bg-rose-50'
                                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-[#172358]'
                            }`}
                        >
                            {action.icon && <span className="flex-shrink-0 text-slate-400 group-hover:text-current">{action.icon}</span>}
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
