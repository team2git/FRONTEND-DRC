import React, { useState } from 'react';
import {
  DashboardCardConfig,
  DashboardCardId,
  GridColSpan,
  GridPresetType,
  CustomScreenProfile,
  DEFAULT_CARD_ORDER,
  BUILTIN_SCREEN_PROFILES,
} from '../types/layoutTypes';
import { ThemeOption } from '../types/dashboardTypes';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  X,
  Sliders,
  Eye,
  EyeOff,
  RotateCcw,
  Monitor,
  Layers,
  MapPin,
  BarChart2,
  PhoneCall,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  Tv,
  LayoutGrid,
  Columns,
  Square,
  Grid3X3,
  GripVertical,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cards: DashboardCardConfig[];
  onCardsChange: (cards: DashboardCardConfig[]) => void;
  activeProfileId: string;
  onSelectProfile: (profileId: string, cards: DashboardCardConfig[]) => void;
  customProfiles: CustomScreenProfile[];
  onSaveCustomProfile: (profile: CustomScreenProfile) => void;
  onDeleteCustomProfile: (profileId: string) => void;
  onPopoutCard?: (cardId: DashboardCardId) => void;
  theme?: ThemeOption;
}

// ─── Sortable Card Item ────────────────────────────────────────────────────────
interface SortableCardItemProps {
  card: DashboardCardConfig;
  index: number;
  total: number;
  isLight: boolean;
  cardItemBg: (enabled: boolean) => string;
  onToggle: (id: DashboardCardId) => void;
  onColSpanChange: (id: DashboardCardId, span: GridColSpan) => void;
  onPopout?: (id: DashboardCardId) => void;
  getColSpanLabel: (span: GridColSpan) => string;
  isDragging?: boolean;
}

const SortableCardItem: React.FC<SortableCardItemProps> = ({
  card,
  index,
  isLight,
  cardItemBg,
  onToggle,
  onColSpanChange,
  onPopout,
  getColSpanLabel,
  isDragging = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
    zIndex: isSortableDragging ? 999 : undefined,
  };

  const currentSpan = card.colSpan || 12;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all gap-2.5 ${
        isDragging ? 'shadow-2xl ring-2 ring-blue-500' : ''
      } ${cardItemBg(card.enabled)}`}
    >
      {/* Left: Drag Handle + Index + Visibility + Title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Drag Handle */}
        <button
          type="button"
          className={`p-1 rounded cursor-grab active:cursor-grabbing shrink-0 touch-none ${
            isLight ? 'text-slate-300 hover:text-slate-500' : 'text-slate-600 hover:text-slate-400'
          } transition`}
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span className="w-5 text-center text-xs font-bold text-slate-400 shrink-0">
          {index + 1}
        </span>

        {/* Visibility Toggle */}
        <button
          type="button"
          onClick={() => onToggle(card.id)}
          className={`p-1.5 rounded-lg transition shrink-0 ${
            card.enabled
              ? 'bg-blue-500 text-white'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
          }`}
          title={card.enabled ? 'Click to Hide Card' : 'Click to Show Card'}
        >
          {card.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        <span className={`text-xs font-bold truncate ${!card.enabled ? 'line-through text-slate-400 opacity-70' : ''}`}>
          {card.label}
        </span>
      </div>

      {/* Right: Grid Span Selector + Popout */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        {/* Grid Col Span Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-black/5 dark:bg-black/20 border border-slate-200 dark:border-slate-700/60">
          {([3, 4, 6, 8, 12] as GridColSpan[]).map((span) => {
            const isSelected = currentSpan === span;
            const spanLabel =
              span === 3 ? '1/4' : span === 4 ? '1/3' : span === 6 ? '1/2' : span === 8 ? '2/3' : 'Full';
            return (
              <button
                key={span}
                type="button"
                onClick={() => onColSpanChange(card.id, span)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-black transition ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title={`Set grid width to ${getColSpanLabel(span)}`}
              >
                {spanLabel}
              </button>
            );
          })}
        </div>

        {/* Popout */}
        {onPopout && (
          <button
            type="button"
            onClick={() => onPopout(card.id)}
            className="p-1 rounded-md text-slate-400 hover:text-blue-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Pop-out card into full focus view"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Modal Component ──────────────────────────────────────────────────────
export const DashboardLayoutModal: React.FC<Props> = ({
  isOpen,
  onClose,
  cards,
  onCardsChange,
  activeProfileId,
  onSelectProfile,
  customProfiles,
  onSaveCustomProfile,
  onDeleteCustomProfile,
  onPopoutCard,
  theme = 'light',
}) => {
  const [isCreatingScreen, setIsCreatingScreen] = useState<boolean>(false);
  const [newScreenName, setNewScreenName] = useState<string>('');
  const [newScreenDesc, setNewScreenDesc] = useState<string>('');
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const isBlueBlack = theme === 'blue_black';

  const modalBg = isLight
    ? 'bg-white border-slate-200 text-slate-900 shadow-2xl'
    : isBlueBlack
    ? 'bg-[#0f172a] border-blue-900/60 text-blue-50 shadow-2xl shadow-blue-950/80'
    : 'bg-slate-900 border-slate-800 text-white shadow-2xl';

  const cardItemBg = (enabled: boolean) => {
    if (isLight) {
      return enabled
        ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
        : 'bg-slate-100/60 border-dashed border-slate-300 text-slate-400 opacity-60';
    }
    if (isBlueBlack) {
      return enabled
        ? 'bg-[#15233e] border-blue-900/60 text-blue-100 hover:border-blue-700'
        : 'bg-blue-950/20 border-dashed border-blue-900/30 text-blue-400/40 opacity-60';
    }
    return enabled
      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
      : 'bg-slate-950/40 border-dashed border-slate-800 text-slate-500 opacity-60';
  };

  const handleToggleCard = (id: DashboardCardId) => {
    const updated = cards.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    onCardsChange(updated);
  };

  const handleCardColSpanChange = (id: DashboardCardId, span: GridColSpan) => {
    const updated = cards.map((c) => (c.id === id ? { ...c, colSpan: span } : c));
    onCardsChange(updated);
  };

  // Drag end: reorder and re-index
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(cards, oldIndex, newIndex).map((c, i) => ({ ...c, order: i + 1 }));
    onCardsChange(reordered);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleApplyGridPreset = (preset: GridPresetType) => {
    let updatedCards: DashboardCardConfig[];
    if (preset === 'stacked') {
      updatedCards = cards.map((c) => ({ ...c, colSpan: 12 }));
    } else if (preset === 'two_column') {
      updatedCards = cards.map((c) => ({ ...c, colSpan: 6 }));
    } else if (preset === 'three_column') {
      updatedCards = cards.map((c) => ({ ...c, colSpan: 4 }));
    } else {
      updatedCards = cards.map((c) => {
        const def = DEFAULT_CARD_ORDER.find((d) => d.id === c.id);
        return { ...c, colSpan: def ? def.colSpan : 12 };
      });
    }
    onCardsChange(updatedCards);
  };

  const handleChooseBuiltInProfile = (profile: CustomScreenProfile) => {
    onSelectProfile(profile.id, profile.cards);
  };

  const handleCreateNewScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScreenName.trim()) return;

    const newProfile: CustomScreenProfile = {
      id: `screen_custom_${Date.now()}`,
      name: newScreenName.trim(),
      description: newScreenDesc.trim() || 'Custom user screen display',
      isBuiltIn: false,
      cards: [...cards],
    };

    onSaveCustomProfile(newProfile);
    onSelectProfile(newProfile.id, newProfile.cards);
    setNewScreenName('');
    setNewScreenDesc('');
    setIsCreatingScreen(false);
  };

  const handleResetDefault = () => {
    onCardsChange(DEFAULT_CARD_ORDER);
    onSelectProfile('integrated', DEFAULT_CARD_ORDER);
  };

  const allProfiles = [...BUILTIN_SCREEN_PROFILES, ...customProfiles];

  const getProfileIcon = (id: string) => {
    switch (id) {
      case 'integrated': return <Layers className="w-4 h-4 text-blue-500" />;
      case 'screen_gis': return <MapPin className="w-4 h-4 text-emerald-500" />;
      case 'screen_analytics': return <BarChart2 className="w-4 h-4 text-amber-500" />;
      case 'screen_operations': return <PhoneCall className="w-4 h-4 text-purple-500" />;
      default: return <Tv className="w-4 h-4 text-cyan-500" />;
    }
  };

  const getColSpanLabel = (span: GridColSpan) => {
    switch (span) {
      case 12: return 'Full (100%)';
      case 8: return '2/3 (66%)';
      case 6: return 'Half (50%)';
      case 4: return '1/3 (33%)';
      case 3: return '1/4 (25%)';
      default: return `${span} cols`;
    }
  };

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border ${modalBg} overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? 'border-slate-200' : isBlueBlack ? 'border-blue-900/60' : 'border-slate-800'}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Dashboard Grid &amp; Screen Customizer</h2>
              <p className="text-xs text-slate-400">Drag to reorder cards · Configure grid widths and display screens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Screen Configurations & Display Presets */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-blue-500" /> Screen Configurations
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingScreen((prev) => !prev)}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline transition"
              >
                <Plus className="w-3.5 h-3.5" />
                {isCreatingScreen ? 'Cancel' : 'Add Screen Configuration'}
              </button>
            </div>

            {/* Create New Screen Form */}
            {isCreatingScreen && (
              <form
                onSubmit={handleCreateNewScreen}
                className={`p-3.5 mb-3 rounded-xl border ${
                  isLight ? 'bg-blue-50/50 border-blue-200' : isBlueBlack ? 'bg-blue-950/40 border-blue-800/60' : 'bg-slate-800/60 border-slate-700'
                } space-y-2.5`}
              >
                <div className="text-xs font-bold text-blue-600 dark:text-blue-300">
                  Save Current Card Layout &amp; Grid Widths as a New Screen
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Screen Name (e.g. TV Wall 2, Ops Center)"
                    value={newScreenName}
                    onChange={(e) => setNewScreenName(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newScreenDesc}
                    onChange={(e) => setNewScreenDesc(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingScreen(false)}
                    className="px-3 py-1 text-xs rounded-lg border text-slate-500 border-slate-300 dark:border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition shadow-sm"
                  >
                    Save &amp; Activate Screen
                  </button>
                </div>
              </form>
            )}

            {/* Profile Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {allProfiles.map((profile) => {
                const isActive = activeProfileId === profile.id;
                return (
                  <div
                    key={profile.id}
                    className={`relative p-3 rounded-xl border text-left flex flex-col justify-between transition group ${
                      isActive
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                        : isLight
                        ? 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleChooseBuiltInProfile(profile)}
                      className="w-full text-left flex-1"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        {getProfileIcon(profile.id)}
                        {isActive && <Check className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <div className="text-xs font-bold truncate">{profile.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {profile.description || `${profile.cards.filter((c) => c.enabled).length} cards active`}
                      </div>
                    </button>

                    {!profile.isBuiltIn && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomProfile(profile.id);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
                        title="Delete custom screen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Quick Grid Type Preset Applicator */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Columns className="w-4 h-4 text-indigo-500" /> Apply Quick Grid Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleApplyGridPreset('standard')}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
                title="Standard command grid with wide and side-by-side cards"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-blue-500" />
                <span>Command Grid</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyGridPreset('two_column')}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
                title="All cards split equally into 2 columns (50% / 50%)"
              >
                <Columns className="w-3.5 h-3.5 text-emerald-500" />
                <span>2-Column Grid</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyGridPreset('three_column')}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
                title="All cards split into 3 columns (33% each)"
              >
                <Grid3X3 className="w-3.5 h-3.5 text-amber-500" />
                <span>3-Column Grid</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyGridPreset('stacked')}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                }`}
                title="All cards take full width 100%"
              >
                <Square className="w-3.5 h-3.5 text-purple-500" />
                <span>Full Stack (100%)</span>
              </button>
            </div>
          </div>

          {/* Section 3: Drag-and-Drop Card Reordering */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-500" /> Card Sequence &amp; Grid Width
                <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <GripVertical className="w-3 h-3" /> Drag to reorder
                </span>
              </label>
              <button
                type="button"
                onClick={handleResetDefault}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-blue-500 transition"
              >
                <RotateCcw className="w-3 h-3" /> Reset Default
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {cards.map((card, idx) => (
                    <SortableCardItem
                      key={card.id}
                      card={card}
                      index={idx}
                      total={cards.length}
                      isLight={isLight}
                      cardItemBg={cardItemBg}
                      onToggle={handleToggleCard}
                      onColSpanChange={handleCardColSpanChange}
                      onPopout={onPopoutCard}
                      getColSpanLabel={getColSpanLabel}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Drag Overlay — renders while dragging */}
              <DragOverlay>
                {activeCard ? (
                  <div
                    className={`flex items-center gap-3 p-3 rounded-xl border shadow-2xl ring-2 ring-blue-500 opacity-95 ${cardItemBg(activeCard.enabled)}`}
                  >
                    <GripVertical className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-xs font-bold truncate">{activeCard.label}</span>
                    <span className="ml-auto text-[10px] font-black text-blue-400 shrink-0">
                      {activeCard.colSpan === 12 ? 'Full' : activeCard.colSpan === 8 ? '2/3' : activeCard.colSpan === 6 ? '1/2' : activeCard.colSpan === 4 ? '1/3' : '1/4'}
                    </span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-3.5 border-t ${isLight ? 'border-slate-200 bg-slate-50' : isBlueBlack ? 'border-blue-900/60 bg-[#0c1322]' : 'border-slate-800 bg-slate-950'}`}>
          <div className="text-[11px] text-slate-400">
            <strong>{cards.filter((c) => c.enabled).length}</strong> of {cards.length} cards visible
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done &amp; Apply Layout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
