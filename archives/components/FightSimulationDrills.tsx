import React, { useState, useMemo } from 'react';
import { CURRICULUM } from './data';
import { CompetencyLevel, Technique, AppData, VariationProgress } from './types';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Filter, Users, User, Shield, Sword, Swords, BrainCircuit } from 'lucide-react';

interface FightSimulationDrillsProps {
    appData: AppData;
    onUpdate: (lessonId: string, variationId: string, updates: Partial<VariationProgress>) => void; // Garder la signature générique pour l'instant
}

// Types pour la segmentation
type AgeGroup = 'kids' | 'teens' | 'adults';

interface DrillSegment {
    id: string;
    title: string;
    steps: string[];
    focusTechniqueId?: string; // L'ID de la technique centrale (pour le filtrage contextuel)
}

const FightSimulationDrills: React.FC<FightSimulationDrillsProps> = ({ appData, onUpdate }) => {
    const [selectedAge, setSelectedAge] = useState<AgeGroup>('adults');
    const [expandedLessons, setExpandedLessons] = useState<Record<number, boolean>>({});
    const [filterLesson, setFilterLesson] = useState<string>('');

    // Filtrer les leçons 1 et 2, et ne garder que celles qui ont des étapes de sim
    const availableLessons = useMemo(() => {
        return CURRICULUM.filter(tech =>
            tech.lessonNumber >= 3 &&
            tech.lessonNumber <= 36 &&
            tech.fightSimSteps &&
            tech.fightSimSteps.length > 0
        );
    }, []);

    // Fonction génératrice de segments
    const generateSegments = (tech: Technique, mode: AgeGroup): DrillSegment[] => {
        const steps = tech.fightSimSteps || [];
        if (steps.length === 0) return [];

        const segments: DrillSegment[] = [];

        if (mode === 'adults') {
            // Adultes: La séquence complète
            segments.push({
                id: `${tech.id}-full`,
                title: "Séquence Complète",
                steps: steps,
                focusTechniqueId: tech.id
            });
        } else if (mode === 'teens') {
            // Ados: Trios (Fenêtre de 3)
            if (steps.length < 3) {
                segments.push({ id: `${tech.id}-trio-1`, title: "Séquence Courte", steps: steps, focusTechniqueId: tech.id });
            } else {
                for (let i = 0; i <= steps.length - 3; i++) {
                    segments.push({
                        id: `${tech.id}-trio-${i}`,
                        title: `Trio ${i + 1} (${i + 1}-${i + 3})`,
                        steps: steps.slice(i, i + 3),
                        focusTechniqueId: tech.id
                    });
                }
            }
        } else {
            // Enfants: Duos (Fenêtre de 2)
            if (steps.length < 2) {
                segments.push({ id: `${tech.id}-duo-1`, title: "Séquence Unique", steps: steps, focusTechniqueId: tech.id });
            } else {
                for (let i = 0; i <= steps.length - 2; i++) {
                    segments.push({
                        id: `${tech.id}-duo-${i}`,
                        title: `Duo ${i + 1} (${i + 1}-${i + 2})`,
                        steps: steps.slice(i, i + 2),
                        focusTechniqueId: tech.id
                    });
                }
            }
        }

        return segments;
    };

    const toggleLesson = (num: number) => {
        setExpandedLessons(prev => ({ ...prev, [num]: !prev[num] }));
    };

    // Filtrage pour la recherche
    const filteredLessons = availableLessons.filter(l => {
        if (!filterLesson) return true;
        return l.lessonNumber.toString().includes(filterLesson) || l.name.toLowerCase().includes(filterLesson.toLowerCase());
    });

    return (
        <div className="space-y-6 animate-fade-in p-4 pb-24 md:pb-10">

            {/* En-tête et Contrôles */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white flex items-center">
                            <Swords className="mr-3 text-red-500" size={28} />
                            Fight Simulation Drills
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Exercices d'enchaînement et de fluidité pour développer vos réflexes.
                        </p>
                    </div>

                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button
                            onClick={() => setSelectedAge('kids')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center transition-all ${selectedAge === 'kids' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <User size={14} className="mr-1.5" /> Enfants (Duos)
                        </button>
                        <button
                            onClick={() => setSelectedAge('teens')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center transition-all ${selectedAge === 'teens' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Users size={14} className="mr-1.5" /> Ados (Trios)
                        </button>
                        <button
                            onClick={() => setSelectedAge('adults')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center transition-all ${selectedAge === 'adults' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Shield size={14} className="mr-1.5" /> Adultes (Full)
                        </button>
                    </div>
                </div>

                {/* Barre de recherche */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter size={16} className="text-slate-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher une leçon (ex: 21 ou 'Guillotine')"
                        value={filterLesson}
                        onChange={(e) => setFilterLesson(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5"
                    />
                </div>
            </div>

            {/* Liste des Leçons */}
            <div className="space-y-4">
                {filteredLessons.map(lesson => {
                    const isExpanded = expandedLessons[lesson.lessonNumber] || filterLesson !== ''; // Auto-expand si filtre actif
                    const segments = generateSegments(lesson, selectedAge);

                    return (
                        <div key={lesson.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm hover:border-slate-600 transition-colors">
                            <button
                                onClick={() => toggleLesson(lesson.lessonNumber)}
                                className="w-full p-4 flex items-center justify-between bg-slate-800 hover:bg-slate-750 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-slate-900 border border-slate-700 flex flex-col items-center justify-center text-slate-300 font-bold">
                                        <span className="text-[9px] text-slate-500 uppercase">Leçon</span>
                                        <span className="text-lg leading-none">{lesson.lessonNumber}</span>
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-bold text-white leading-tight">{lesson.name}</h3>
                                        <div className="flex items-center mt-1 space-x-2">
                                            <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-700 flex items-center">
                                                <BrainCircuit size={10} className="mr-1" />
                                                {segments.length} Séquence{segments.length > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                            </button>

                            {isExpanded && (
                                <div className="p-4 bg-slate-950/30 border-t border-slate-700 space-y-4">
                                    {segments.map((segment, idx) => (
                                        <div key={segment.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 relative group">
                                            {/* Numéro de séquence discret */}
                                            <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-600 font-bold opacity-50">
                                                #{idx + 1}
                                            </div>

                                            {selectedAge !== 'adults' && (
                                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center">
                                                    <Sword size={12} className="mr-1.5" />
                                                    {segment.title}
                                                </h4>
                                            )}

                                            <div className="space-y-2">
                                                {segment.steps.map((step, sIdx) => {
                                                    // Petit highlight pour la technique courante si détectée (logique simple basée sur le texte pour l'instant)
                                                    const isFocus = step.includes(`(L${lesson.lessonNumber})`);
                                                    return (
                                                        <div key={sIdx} className="flex items-start">
                                                            <div className="flex flex-col items-center mr-3 mt-0.5">
                                                                <div className={`w-2 h-2 rounded-full ${isFocus ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-700'}`}></div>
                                                                {sIdx < segment.steps.length - 1 && (
                                                                    <div className="w-0.5 h-full bg-slate-800 my-0.5 min-h-[12px]"></div>
                                                                )}
                                                            </div>
                                                            <span className={`text-sm ${isFocus ? 'text-white font-medium' : 'text-slate-400'}`}>
                                                                {step}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredLessons.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        Aucune leçon trouvée pour cette recherche.
                    </div>
                )}
            </div>
        </div>
    );
};

export default FightSimulationDrills;
