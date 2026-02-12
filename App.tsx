import React, { useState, useEffect, useMemo, useRef, Component, ReactNode } from 'react';
import {
  Trophy, LayoutDashboard, ListTodo,
  ChevronDown, ChevronUp, PlayCircle, Dumbbell, Settings, Save,
  Swords, CheckSquare, Lock, AlertCircle,
  Bookmark, NotebookPen, X,
  ArrowDown, Printer, FlaskConical, Loader2,
  Plus, Edit3, Clock, Repeat, Star, ThumbsUp, History, Upload, Download, FileJson, Trash2,
  CheckCircle2, Target, Users, UserPlus, Minus, RefreshCw, MinusCircle, Zap, Info, Pencil, Share2, Link, SaveAll,
  AlertTriangle, Copy,
  ArrowRight, Filter, Shield, Sword, User, BrainCircuit
} from 'lucide-react';
import { CURRICULUM } from './data';
import { DEFAULT_DATA } from './initialData';
import { CompetencyLevel, Technique, LessonProgress, AppData, COMPETENCY_COLORS, Variation, VariationProgress, PointThresholds, AppSettings, PracticeSession, StudentProfile, DrillStatus, PlannedCombo, ConnectionOverride } from './types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- ERROR BOUNDARY ---

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    if (window.confirm("Attention : Ceci va effacer les données locales pour restaurer l'application. Continuer ?")) {
      localStorage.removeItem('bjj_tracker_data');
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
          <AlertTriangle size={64} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Oups ! L'application a rencontré un problème.</h1>
          <p className="text-slate-400 mb-6 max-w-md">
            Une incompatibilité de données a provoqué une erreur. Cela arrive parfois après une mise à jour majeure.
          </p>
          <div className="bg-slate-800 p-4 rounded text-left text-xs text-red-300 font-mono mb-6 w-full max-w-md overflow-auto max-h-32">
            {this.state.error?.toString()}
          </div>
          <button
            onClick={this.handleReset}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center"
          >
            <RefreshCw size={20} className="mr-2" /> Réinitialiser l'application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- UTILS ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const getScore = (progress?: VariationProgress) => {
  if (!progress) return 0;
  return (progress.videoCount * 0.5) + (progress.trainingCount * 2.0) + (progress.drillCount * 1.0);
};

const getLevelFromScore = (score: number, thresholds: PointThresholds): CompetencyLevel => {
  if (score <= 0) return CompetencyLevel.None;
  if (score < thresholds.level2) return CompetencyLevel.Level1;
  if (score < thresholds.level3) return CompetencyLevel.Level2;
  if (score < thresholds.level4) return CompetencyLevel.Level3;
  return CompetencyLevel.Level4;
};

// Robust helper to safely get variation progress without crashing
const getVariationProgress = (progressData: Record<string, LessonProgress>, lessonId: string, variationId: string): VariationProgress | undefined => {
  if (!progressData) return undefined;
  const lesson = progressData[lessonId];
  if (!lesson || !lesson.variations) return undefined;
  return lesson.variations[variationId];
};

const getTargetsFromText = (text: string): { lessonId: string, variationId: string }[] => {
  const targets: { lessonId: string, variationId: string }[] = [];
  const lessonRegex = /\(L(\d+)\)/g;
  let match;

  while ((match = lessonRegex.exec(text)) !== null) {
    const lessonNum = parseInt(match[1]);
    const technique = CURRICULUM.find(t => t.lessonNumber === lessonNum);

    if (technique) {
      const isAllVariations = text.toLowerCase().includes("all variations") || text.toLowerCase().includes("all stages");
      if (isAllVariations) {
        technique.variations.forEach(v => {
          targets.push({ lessonId: technique.id, variationId: v.id });
        });
      } else {
        let foundSpecific = false;
        technique.variations.forEach(v => {
          if (text.toLowerCase().includes(v.name.toLowerCase())) {
            targets.push({ lessonId: technique.id, variationId: v.id });
            foundSpecific = true;
          }
        });
        if (!foundSpecific && technique.variations.length > 0) {
          targets.push({ lessonId: technique.id, variationId: technique.variations[0].id });
        }
      }
    }
  }
  return targets.filter((v, i, a) => a.findIndex(t => t.lessonId === v.lessonId && t.variationId === v.variationId) === i);
};

const getConnections = (techId: string, data: StudentProfile) => {
  if (data.customConnections && data.customConnections[techId]) {
    return data.customConnections[techId];
  }
  const tech = CURRICULUM.find(t => t.id === techId);
  return {
    parents: tech?.parents || [],
    children: tech?.children || []
  };
};

const getLevelTextColor = (level: CompetencyLevel) => {
  switch (level) {
    case CompetencyLevel.None: return 'text-slate-500';
    case CompetencyLevel.Level1: return 'text-yellow-500';
    case CompetencyLevel.Level2: return 'text-orange-500';
    case CompetencyLevel.Level3: return 'text-green-500';
    case CompetencyLevel.Level4: return 'text-blue-500';
    default: return 'text-slate-500';
  }
};

const getMasteryColorClasses = (level: CompetencyLevel) => {
  switch (level) {
    case CompetencyLevel.None: return { border: 'border-slate-700', bg: 'bg-slate-800' };
    case CompetencyLevel.Level1: return { border: 'border-yellow-500', bg: 'bg-yellow-900/20' };
    case CompetencyLevel.Level2: return { border: 'border-orange-500', bg: 'bg-orange-900/20' };
    case CompetencyLevel.Level3: return { border: 'border-green-600', bg: 'bg-green-900/20' };
    case CompetencyLevel.Level4: return { border: 'border-blue-600', bg: 'bg-blue-900/20' };
    default: return { border: 'border-slate-700', bg: 'bg-slate-800' };
  }
};

const formatDate = (timestamp: number) => {
  if (!timestamp) return 'Jamais';
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// --- VISUAL COMPONENTS ---

const LevelBadge = ({ level }: { level: CompetencyLevel }) => {
  const styles = {
    [CompetencyLevel.None]: "border border-slate-700 bg-slate-800/50 text-slate-600",
    [CompetencyLevel.Level1]: "bg-yellow-500 border border-yellow-600 text-white shadow-sm shadow-yellow-900/30",
    [CompetencyLevel.Level2]: "bg-orange-500 border border-orange-600 text-white shadow-sm shadow-orange-900/30",
    [CompetencyLevel.Level3]: "bg-green-600 border border-green-700 text-white shadow-sm shadow-green-900/30",
    [CompetencyLevel.Level4]: "bg-blue-600 border border-blue-700 text-white shadow-sm shadow-blue-900/30",
  };

  return (
    <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-[4px] text-[9px] font-black leading-none ${styles[level]}`}>
      {level > 0 ? `L${level}` : ''}
    </div>
  );
};

// --- COMPONENTS ---

interface VariationRowProps {
  variation: Variation;
  progress: VariationProgress;
  labels: Record<number, string>;
  thresholds: PointThresholds;
  onUpdate: (updates: Partial<VariationProgress>) => void;
  showLessonContext?: boolean;
  lessonName?: string;
  lessonNumber?: number;
}

const VariationRow: React.FC<VariationRowProps> = ({
  variation,
  progress,
  labels,
  thresholds,
  onUpdate,
  showLessonContext = false,
  lessonName,
  lessonNumber
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const score = getScore(progress);
  const level = getLevelFromScore(score, thresholds);

  let nextThreshold = thresholds.level4;

  if (level === CompetencyLevel.None) { nextThreshold = thresholds.level1; }
  else if (level === CompetencyLevel.Level1) { nextThreshold = thresholds.level2; }
  else if (level === CompetencyLevel.Level2) { nextThreshold = thresholds.level3; }
  else if (level === CompetencyLevel.Level3) { nextThreshold = thresholds.level4; }
  else { nextThreshold = thresholds.level4; }

  // Special case for full mastery
  const isMastered = level === CompetencyLevel.Level4;

  let progressPercent = 0;
  if (isMastered) {
    progressPercent = 100;
  } else {
    progressPercent = (score / nextThreshold) * 100;
    progressPercent = Math.min(100, Math.max(0, progressPercent));
  }

  const handleUpdate = (type: 'video' | 'training', change: number) => {
    let currentHistory = progress.history || [];
    let newHistory = [...currentHistory];

    if (change > 0) {
      newHistory = [{ date: Date.now(), type }, ...currentHistory];
    } else {
      const indexToRemove = newHistory.findIndex(h => h.type === type);
      if (indexToRemove !== -1) {
        newHistory.splice(indexToRemove, 1);
      }
    }

    const updates: Partial<VariationProgress> = { history: newHistory };

    if (type === 'video') {
      updates.videoCount = Math.max(0, progress.videoCount + change);
    } else {
      updates.trainingCount = Math.max(0, progress.trainingCount + change);
      if (change > 0) updates.lastPracticed = Date.now();
    }
    onUpdate(updates);
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 hover:bg-slate-900 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="w-full">
          <div className="flex justify-between items-start w-full">
            <div>
              {showLessonContext && (
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                  Leçon {lessonNumber} : {lessonName}
                </div>
              )}
              <h5 className="text-slate-200 font-medium text-sm">{variation.name}</h5>
            </div>
            <div className="flex flex-col items-end">
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${COMPETENCY_COLORS[level]} text-white uppercase shadow-sm`}>
                {level === 0 ? 'Non commencé' : labels[level]}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 font-mono">
                Score: <span className="text-white font-bold">{score.toFixed(1)}</span>
                {!isMastered && <span className="text-slate-500"> / {nextThreshold}</span>}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-700 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full ${COMPETENCY_COLORS[level]} transition-all duration-500`}
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="flex space-x-2">
        <div className="flex flex-1 items-stretch space-x-0.5">
          <button
            onClick={() => handleUpdate('video', 1)}
            className="flex-1 flex items-center justify-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-2 rounded-l border border-slate-700 hover:border-slate-600 transition-all active:scale-95 group"
          >
            <PlayCircle size={14} className="group-hover:text-blue-400" />
            <div className="flex flex-col leading-none items-start">
              <span className="text-[10px] font-bold">Vidéo ({progress.videoCount})</span>
            </div>
          </button>
          <button
            onClick={() => handleUpdate('video', -1)}
            disabled={progress.videoCount <= 0}
            className="w-8 flex items-center justify-center bg-slate-800 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded-r border-y border-r border-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800"
            title="Enlever 1 vidéo"
          >
            <Minus size={12} />
          </button>
        </div>

        <div className="flex flex-1 items-stretch space-x-0.5">
          <button
            onClick={() => handleUpdate('training', 1)}
            className="flex-1 flex items-center justify-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-2 rounded-l border border-slate-700 hover:border-slate-600 transition-all active:scale-95 group"
          >
            <Dumbbell size={14} className="group-hover:text-orange-400" />
            <div className="flex flex-col leading-none items-start">
              <span className="text-[10px] font-bold">Tapis ({progress.trainingCount})</span>
            </div>
          </button>
          <button
            onClick={() => handleUpdate('training', -1)}
            disabled={progress.trainingCount <= 0}
            className="w-8 flex items-center justify-center bg-slate-800 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded-r border-y border-r border-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800"
            title="Enlever 1 entraînement"
          >
            <Minus size={12} />
          </button>
        </div>

        <button
          onClick={() => onUpdate({ isPlanned: !progress.isPlanned })}
          className={`flex items-center justify-center w-10 py-2 rounded border transition-all active:scale-95 ${progress.isPlanned
            ? 'bg-blue-600 border-blue-500 text-white'
            : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'
            }`}
          title="Ajouter au plan"
        >
          <Bookmark size={16} fill={progress.isPlanned ? "currentColor" : "none"} />
        </button>

        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`flex items-center justify-center w-10 py-2 rounded border transition-all active:scale-95 ${progress.notes
            ? 'bg-slate-700 border-slate-600 text-brand-300'
            : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'
            }`}
          title="Notes personnelles"
        >
          <NotebookPen size={16} />
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center justify-center w-10 py-2 rounded border transition-all active:scale-95 ${showHistory
            ? 'bg-slate-700 border-slate-600 text-blue-300'
            : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'
            }`}
          title="Historique"
        >
          <History size={16} />
        </button>
      </div>

      <div className="flex justify-between items-center mt-2 px-1">
        <div className="flex space-x-3 text-[9px] text-slate-500">
          <span><span className="text-blue-400 font-bold">Vidéo:</span> 0.5 pts</span>
          <span><span className="text-orange-400 font-bold">Tapis:</span> 2.0 pts</span>
          <span><span className="text-green-400 font-bold">Drill:</span> 1.0 pt</span>
        </div>
        {progress.drillCount > 0 && (
          <span className="text-[9px] text-green-500 font-bold">
            + {progress.drillCount} pts (Drills/Sims)
          </span>
        )}
      </div>

      {showNotes && (
        <div className="mt-3 animate-fade-in">
          <textarea
            value={progress.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Notes personnelles..."
            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 min-h-[60px]"
          />
        </div>
      )}

      {showHistory && (
        <div className="mt-3 animate-fade-in bg-slate-950 rounded p-2 border border-slate-800">
          <h6 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Historique d'entraînement</h6>
          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {progress.history && progress.history.length > 0 ? (
              progress.history.map((h, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-300 border-b border-slate-800 pb-1 last:border-0">
                  <span>{new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={`font-bold ${h.type === 'video' ? 'text-blue-400' :
                    h.type === 'training' ? 'text-orange-400' : 'text-green-400'
                    }`}>
                    {h.type === 'video' ? 'Vidéo' : h.type === 'training' ? 'Tapis' : 'Drill'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-600 italic">Aucun historique.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface LessonCardProps {
  technique: Technique;
  progress?: LessonProgress;
  drillStatus?: DrillStatus;
  labels: Record<number, string>;
  thresholds: PointThresholds;
  onUpdate: (lessonId: string, variationId: string, updates: Partial<VariationProgress>) => void;
  onReset: (lessonId: string) => void;
  onPracticeReflex?: (techId: string) => void;
  allProgressData?: Record<string, LessonProgress>;
}

const LessonCard: React.FC<LessonCardProps> = ({
  technique,
  progress,
  drillStatus,
  labels,
  thresholds,
  onUpdate,
  onReset,
  onPracticeReflex,
  allProgressData
}) => {
  const [expanded, setExpanded] = useState(false);

  const safeProgress = progress || { techniqueId: technique.id, variations: {} };

  const variationsList = technique.variations;
  const totalLevels = variationsList.reduce((acc, v) => {
    const vp = safeProgress.variations[v.id];
    return acc + (vp ? getLevelFromScore(getScore(vp), thresholds) : 0);
  }, 0);
  const avgLevel = variationsList.length > 0 ? Math.round(totalLevels / variationsList.length) : 0;

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Êtes-vous sûr de vouloir réinitialiser tout le progrès pour "${technique.name}" ? Cette action est irréversible.`)) {
      onReset(technique.id);
    }
  };

  const lastReflexDate = drillStatus && drillStatus.history.length > 0
    ? Math.max(...drillStatus.history)
    : 0;

  const reflexDrillLines = useMemo(() => {
    if (!technique.reflexDrill) return [];
    return technique.reflexDrill.split(/(?=\bIn combination with\b)|(?=\bAnd\s+[A-Z|a-z])/).map(p => p.trim()).filter(p => p);
  }, [technique.reflexDrill]);

  return (
    <div className={`bg-slate-800 border-l-4 ${expanded ? 'border-brand-500' : 'border-slate-600'} rounded-r-xl mb-4 shadow-md overflow-hidden transition-all`}>
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer hover:bg-slate-750 flex justify-between items-center group"
      >
        <div className="flex-1">
          <div className="flex items-center justify-between md:justify-start md:space-x-4 mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">
              Leçon {technique.lessonNumber}
            </span>
          </div>
          <h4 className="text-white font-semibold text-lg leading-tight">{technique.name}</h4>
        </div>

        <div className="flex flex-col items-end space-y-2 pl-4">
          <div className="flex items-center space-x-2">
            {expanded && (
              <button
                onClick={handleReset}
                className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-900/20 rounded-full transition-colors mr-2"
                title="Réinitialiser la leçon"
              >
                <Trash2 size={14} />
              </button>
            )}
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${COMPETENCY_COLORS[avgLevel as CompetencyLevel]} text-white uppercase min-w-[80px] text-center`}>
              {avgLevel === 0 ? 'Début' : labels[avgLevel]}
            </div>
          </div>
          {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-slate-950/30 border-t border-slate-700 space-y-3 animate-fade-in">

          {technique.reflexDrill && (
            <div className="bg-slate-900 border border-orange-900/30 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-bold text-orange-400 flex items-center">
                  <Zap size={12} className="mr-1" /> REFLEX DRILL
                </h5>
                <span className="text-[10px] text-slate-500">
                  Dernière fois: {formatDate(lastReflexDate)}
                </span>
              </div>

              <div className="bg-slate-950/50 rounded p-2 mb-3 border border-slate-800">
                <ul className="space-y-3">
                  {reflexDrillLines.map((line, idx) => {
                    let textColorClass = 'text-slate-300';
                    let bgColorClass = '';
                    let numberClass = 'text-slate-600';

                    const lineTargets = getTargetsFromText(line);
                    const refersToCurrent = lineTargets.some(t => t.lessonId === technique.id);

                    if (refersToCurrent) {
                      textColorClass = 'text-fuchsia-100 font-bold';
                      bgColorClass = 'bg-fuchsia-900/30 -mx-1 px-1 rounded';
                      numberClass = 'text-fuchsia-400';
                    } else if (lineTargets.length > 0 && allProgressData) {
                      let minLevel = CompetencyLevel.Level4;
                      lineTargets.forEach(t => {
                        const prog = getVariationProgress(allProgressData, t.lessonId, t.variationId);
                        const score = prog ? getScore(prog) : 0;
                        const lvl = getLevelFromScore(score, thresholds);
                        if (lvl < minLevel) minLevel = lvl;
                      });
                      textColorClass = getLevelTextColor(minLevel);
                    }

                    return (
                      <li key={idx} className={`text-xs ${bgColorClass}`}>
                        <div className="flex items-start">
                          <span className={`mr-2 font-mono text-[10px] font-bold mt-0.5 ${numberClass}`}>{idx + 1}.</span>
                          <span className={textColorClass}>{line}</span>
                        </div>
                        {lineTargets.length > 0 && (
                          <div className="ml-6 mt-1 space-y-1">
                            {lineTargets.map((t, vIdx) => {
                              const tech = CURRICULUM.find(x => x.id === t.lessonId);
                              const variation = tech?.variations.find(v => v.id === t.variationId);
                              return (
                                <div key={vIdx} className="text-[10px] text-slate-500 flex items-center">
                                  <div className="w-1 h-1 rounded-full bg-slate-600 mr-2"></div>
                                  {variation?.name}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <button
                onClick={() => onPracticeReflex && onPracticeReflex(technique.id)}
                className="w-full bg-orange-900/20 hover:bg-orange-900/40 text-orange-300 border border-orange-900/50 rounded py-2 text-xs font-bold flex items-center justify-center transition-all"
              >
                <CheckSquare size={14} className="mr-2" /> Pratiquer le Drill
              </button>
            </div>
          )}

          {technique.variations.map(variation => (
            <VariationRow
              key={variation.id}
              variation={variation}
              labels={labels}
              thresholds={thresholds}
              progress={safeProgress.variations[variation.id] || {
                id: variation.id, videoCount: 0, trainingCount: 0, drillCount: 0
              }}
              onUpdate={(updates) => onUpdate(technique.id, variation.id, updates)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface DrillSectionProps {
  drillNumber: number;
  title: string;
  techniques: Technique[];
  progressData: Record<string, LessonProgress>;
  drillStatusMap: Record<string, DrillStatus>;
  labels: Record<number, string>;
  thresholds: PointThresholds;
  onUpdate: (lId: string, vId: string, u: Partial<VariationProgress>) => void;
  onReset: (lId: string) => void;
  onPracticeReflex: (tId: string) => void;
  isOpenDefault?: boolean;
}

const DrillSection: React.FC<DrillSectionProps> = ({
  drillNumber,
  title,
  techniques,
  progressData,
  drillStatusMap,
  labels,
  thresholds,
  onUpdate,
  onReset,
  onPracticeReflex,
  isOpenDefault = false
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  useEffect(() => {
    if (isOpenDefault) setIsOpen(true);
  }, [isOpenDefault]);

  const stats = {
    [CompetencyLevel.None]: 0,
    [CompetencyLevel.Level1]: 0,
    [CompetencyLevel.Level2]: 0,
    [CompetencyLevel.Level3]: 0,
    [CompetencyLevel.Level4]: 0,
    total: 0
  };

  techniques.forEach(t => {
    t.variations.forEach(v => {
      const vp = getVariationProgress(progressData, t.id, v.id);
      const lvl = vp ? getLevelFromScore(getScore(vp), thresholds) : CompetencyLevel.None;
      stats[lvl]++;
    });
  });

  stats.total = techniques.reduce((acc, t) => acc + t.variations.length, 0);
  const getPercent = (lvl: CompetencyLevel) => stats.total > 0 ? (stats[lvl] / stats.total) * 100 : 0;

  if (techniques.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between bg-slate-800 hover:bg-slate-750 transition-colors"
      >
        <div className="flex items-center space-x-4 w-full mr-4">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold border border-slate-600 text-lg">
            {drillNumber}
          </div>
          <div className="text-left flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{title}</h3>
            <div className="flex h-2 w-full bg-slate-900 rounded-full overflow-hidden mt-2">
              <div style={{ width: `${getPercent(CompetencyLevel.Level4)}%` }} className="bg-blue-600" />
              <div style={{ width: `${getPercent(CompetencyLevel.Level3)}%` }} className="bg-green-600" />
              <div style={{ width: `${getPercent(CompetencyLevel.Level2)}%` }} className="bg-orange-500" />
              <div style={{ width: `${getPercent(CompetencyLevel.Level1)}%` }} className="bg-yellow-500" />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
              <span>
                {stats[CompetencyLevel.Level4] > 0 && <span className="text-blue-400 font-bold mr-2">{stats[CompetencyLevel.Level4]} Maître</span>}
                {stats[CompetencyLevel.Level3] > 0 && <span className="text-green-500 font-bold mr-2">{stats[CompetencyLevel.Level3]} Réflexe</span>}
                {stats[CompetencyLevel.Level2] > 0 && <span className="text-orange-400 font-bold mr-2">{stats[CompetencyLevel.Level2]} Consol.</span>}
                {stats[CompetencyLevel.Level1] > 0 && <span className="text-yellow-500 font-bold">{stats[CompetencyLevel.Level1]} Découv.</span>}
                {stats[CompetencyLevel.None] === stats.total && <span>Non démarré</span>}
              </span>
              <span>{stats.total} Variations</span>
            </div>
          </div>
        </div>
        {isOpen ? <ChevronUp className="text-slate-400 flex-shrink-0" /> : <ChevronDown className="text-slate-400 flex-shrink-0" />}
      </button>

      {isOpen && (
        <div className="p-4 bg-slate-900/50 space-y-4 border-t border-slate-700">
          {techniques.map(tech => (
            <LessonCard
              key={tech.id}
              technique={tech}
              progress={progressData ? progressData[tech.id] : undefined}
              drillStatus={drillStatusMap ? drillStatusMap[`reflex-${tech.id}`] : undefined}
              labels={labels}
              thresholds={thresholds}
              onUpdate={onUpdate}
              onReset={onReset}
              onPracticeReflex={onPracticeReflex}
              allProgressData={progressData}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const VariationStatusList = ({
  techniques,
  progressData,
  thresholds,
  onUpdate,
  editMode = false,
  onRemove,
  autoExpand = false,
  onToggleCombo,
  plannedCombos = []
}: {
  techniques: string[],
  progressData: Record<string, LessonProgress>,
  thresholds: PointThresholds,
  onUpdate: (lid: string, vid: string, u: Partial<VariationProgress>) => void,
  editMode?: boolean,
  onRemove?: (id: string) => void,
  autoExpand?: boolean,
  onToggleCombo?: (techId: string) => void,
  plannedCombos?: string[] // IDs of items involved in a combo plan
}) => {
  return (
    <div className="space-y-2">
      {techniques.map(techId => {
        const tech = CURRICULUM.find(t => t.id === techId);
        if (!tech) return null;

        const isComboPlanned = plannedCombos.includes(techId);

        return (
          <div key={tech.id} className="bg-slate-800 rounded border border-slate-700 p-2 relative group">
            {editMode && onRemove && (
              <button
                onClick={() => onRemove(tech.id)}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-500 z-10"
              >
                <X size={12} />
              </button>
            )}
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-1 rounded flex-shrink-0">L{tech.lessonNumber}</span>
                <span className="text-xs font-semibold text-slate-200 truncate ml-2">{tech.name}</span>
              </div>
              {onToggleCombo && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCombo(tech.id);
                  }}
                  className={`ml-2 p-1 rounded transition-all flex-shrink-0 ${isComboPlanned
                    ? 'text-purple-400 bg-purple-900/30'
                    : 'text-slate-600 hover:text-slate-400'
                    }`}
                  title={isComboPlanned ? "Retirer la séquence du plan" : "Ajouter la séquence au plan"}
                >
                  <Bookmark size={14} fill={isComboPlanned ? "currentColor" : "none"} />
                </button>
              )}
            </div>
            {(autoExpand || tech.variations.length > 0) && (
              <div className="space-y-1 mt-2">
                {tech.variations.map(v => {
                  const vp = getVariationProgress(progressData, tech.id, v.id);
                  const score = vp ? getScore(vp) : 0;
                  const level = getLevelFromScore(score, thresholds);

                  return (
                    <div key={v.id} className="flex items-center justify-between text-[10px] bg-slate-900/50 p-1 rounded hover:bg-slate-800 transition-colors">
                      <div className="flex items-center flex-1 min-w-0 mr-2">
                        <LevelBadge level={level} />
                        <span className="text-slate-400 truncate ml-2">{v.name}</span>
                      </div>
                      {!editMode && (
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentHist = vp?.history || [];
                              const newHist = [{ date: Date.now(), type: 'video' as const }, ...currentHist];
                              onUpdate(tech.id, v.id, {
                                videoCount: (vp?.videoCount || 0) + 1,
                                history: newHist
                              });
                            }}
                            className="p-1 text-slate-600 hover:text-blue-400 hover:bg-slate-800 rounded active:scale-95 transition-transform"
                            title="+1 Vidéo"
                          >
                            <PlayCircle size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentHist = vp?.history || [];
                              const newHist = [{ date: Date.now(), type: 'training' as const }, ...currentHist];
                              onUpdate(tech.id, v.id, {
                                trainingCount: (vp?.trainingCount || 0) + 1,
                                lastPracticed: Date.now(),
                                history: newHist
                              });
                            }}
                            className="p-1 text-slate-600 hover:text-orange-400 hover:bg-slate-800 rounded active:scale-95 transition-transform"
                            title="+1 Tapis"
                          >
                            <Dumbbell size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdate(tech.id, v.id, { isPlanned: !(vp?.isPlanned) });
                            }}
                            className={`p-1 rounded transition-transform active:scale-95 ${vp?.isPlanned ? 'text-blue-400 bg-blue-900/30' : 'text-slate-600 hover:text-slate-400'}`}
                            title={vp?.isPlanned ? "Retirer du plan" : "Ajouter au plan"}
                          >
                            <Bookmark size={12} fill={vp?.isPlanned ? "currentColor" : "none"} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        );
      })}
      {techniques.length === 0 && !editMode && (
        <div className="text-center p-4 text-[10px] text-slate-600 italic border border-dashed border-slate-800 rounded">
          Aucune connexion
        </div>
      )}
    </div>
  );
};

const PlanView = ({
  progressData,
  labels,
  thresholds,
  onUpdate,
  plannedCombos = [],
  onRemoveCombo
}: {
  progressData: Record<string, LessonProgress>,
  labels: Record<number, string>,
  thresholds: PointThresholds,
  onUpdate: (lid: string, vid: string, u: Partial<VariationProgress>) => void,
  plannedCombos?: PlannedCombo[],
  onRemoveCombo: (id: string) => void
}) => {
  const plannedItems = useMemo(() => {
    const items: { tech: Technique, variation: Variation, progress: VariationProgress }[] = [];
    CURRICULUM.forEach(tech => {
      tech.variations.forEach(v => {
        const prog = getVariationProgress(progressData, tech.id, v.id);
        if (prog && prog.isPlanned) {
          items.push({ tech, variation: v, progress: prog });
        }
      });
    });
    return items;
  }, [progressData]);

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <Bookmark className="mr-2 text-blue-400" />
            Plan d'Entraînement
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {plannedItems.length} variation(s) et {plannedCombos.length} séquence(s) à travailler.
          </p>
        </div>
      </div>

      {/* COMBOS SECTION */}
      {plannedCombos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center">
            <FlaskConical size={14} className="mr-2" /> Séquences (Combos)
          </h3>
          {plannedCombos.map(combo => {
            const focus = CURRICULUM.find(t => t.id === combo.techniqueId);
            const source = combo.sourceId ? CURRICULUM.find(t => t.id === combo.sourceId) : null;
            const dest = combo.destinationId ? CURRICULUM.find(t => t.id === combo.destinationId) : null;

            if (!focus) return null;

            return (
              <div key={combo.id} className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-3 flex items-center justify-between relative group hover:bg-slate-800 transition-colors">
                <div className="flex items-center space-x-2 flex-1 overflow-hidden">
                  {source ? (
                    <>
                      <div className="flex items-center text-slate-400 text-xs">
                        <span className="font-bold mr-1">L{source.lessonNumber}</span>
                        <span className="truncate max-w-[100px] md:max-w-xs">{source.name}</span>
                      </div>
                      <ArrowRight size={14} className="text-purple-500 flex-shrink-0" />
                    </>
                  ) : <div className="text-xs text-slate-500 italic">Début</div>}

                  <div className="flex items-center text-white text-sm font-bold bg-purple-900/40 px-2 py-1 rounded border border-purple-500/20">
                    <span className="mr-1 text-purple-300">L{focus.lessonNumber}</span>
                    <span>{focus.name}</span>
                  </div>

                  {dest ? (
                    <>
                      <ArrowRight size={14} className="text-purple-500 flex-shrink-0" />
                      <div className="flex items-center text-slate-400 text-xs">
                        <span className="font-bold mr-1">L{dest.lessonNumber}</span>
                        <span className="truncate max-w-[100px] md:max-w-xs">{dest.name}</span>
                      </div>
                    </>
                  ) : null}
                </div>
                <button
                  onClick={() => onRemoveCombo(combo.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors"
                  title="Retirer du plan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* VARIATIONS SECTION */}
      {plannedItems.length > 0 ? (
        <div className="space-y-4">
          {plannedCombos.length > 0 && (
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center mt-6">
              <Dumbbell size={14} className="mr-2" /> Variations Individuelles
            </h3>
          )}
          {plannedItems.map(({ tech, variation, progress }) => (
            <VariationRow
              key={`${tech.id}-${variation.id}`}
              variation={variation}
              progress={progress}
              labels={labels}
              thresholds={thresholds}
              onUpdate={(u) => onUpdate(tech.id, variation.id, u)}
              showLessonContext={true}
              lessonName={tech.name}
              lessonNumber={tech.lessonNumber}
            />
          ))}
        </div>
      ) : (
        plannedCombos.length === 0 && (
          <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
            <Bookmark className="mx-auto text-slate-600 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-400">Votre plan est vide</h3>
            <p className="text-slate-500 text-sm mt-1">Ajoutez des techniques ou des combos à votre plan.</p>
          </div>
        )
      )}
    </div>
  );
};

interface SimCardProps {
  sim: {
    tech: Technique;
    total: number;
    mastered: number;
    targets: { lessonId: string; variationId: string }[];
    unknownCount: number;
    avgCompetency: number;
  };
  isRecommended?: boolean;
  recommendationType?: 'mastery' | 'access';
  onPracticeDrill: (targets: { lessonId: string; variationId: string }[], simId?: string) => void;
  selectedId?: string | null;
  progressData: Record<string, LessonProgress>;
  thresholds: PointThresholds;
  drillStatusMap: Record<string, DrillStatus>;
}

const SimCard: React.FC<SimCardProps> = ({
  sim,
  isRecommended,
  recommendationType,
  onPracticeDrill,
  selectedId,
  progressData,
  thresholds,
  drillStatusMap
}) => {
  const { tech, total, mastered, targets, unknownCount } = sim;
  const progressPercent = total > 0 ? (mastered / total) * 100 : 0;

  const lastPracticed = drillStatusMap[`sim-${tech.id}`]?.history[0];

  return (
    <div className={`rounded-xl p-4 border transition-all ${isRecommended
      ? 'bg-slate-800 border-yellow-500/50 shadow-lg shadow-yellow-900/10'
      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
      }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          {isRecommended && (
            <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider mb-1">
              {recommendationType === 'mastery' ? 'Maîtrise Conseillée' : 'Nouvelle Simulation Accessible'}
            </div>
          )}
          <h4 className="font-bold text-white text-sm">{tech.name}</h4>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {mastered}/{total} étapes maîtrisées
          </div>
        </div>
        <div className="flex flex-col items-end">
          {lastPracticed && (
            <div className="text-[9px] text-slate-500 flex items-center mb-1">
              <History size={10} className="mr-1" /> {formatDate(lastPracticed)}
            </div>
          )}
          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${unknownCount === 0 ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-slate-700 text-slate-400'
            }`}>
            {unknownCount === 0 ? 'Prêt' : `${unknownCount} inconnues`}
          </div>
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-900 rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full ${unknownCount === 0 ? 'bg-green-500' : 'bg-blue-500'} transition-all`}
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="space-y-2 mb-4">
        {tech.fightSimSteps?.map((step, idx) => {
          const stepTargets = getTargetsFromText(step);

          // Calculate minimum competency for the variations involved in this step
          let minLevel = CompetencyLevel.Level4;
          let hasTargets = false;

          stepTargets.forEach(t => {
            const prog = getVariationProgress(progressData, t.lessonId, t.variationId);
            const score = prog ? getScore(prog) : 0;
            const lvl = getLevelFromScore(score, thresholds);
            if (lvl < minLevel) minLevel = lvl;
            hasTargets = true;
          });

          // If no targets found (unlikely), default to None
          if (!hasTargets) minLevel = CompetencyLevel.None;

          const isSelectedRef = selectedId && stepTargets.some(t => t.lessonId === selectedId);

          return (
            <div key={idx} className={`text-xs p-1.5 rounded flex items-center ${isSelectedRef ? 'bg-fuchsia-900/20 text-fuchsia-200' : 'text-slate-300'
              }`}>
              <LevelBadge level={minLevel} />
              <span className="font-mono font-bold mx-2 opacity-50 text-[10px]">{idx + 1}.</span>
              <span className="flex-1">{step}</span>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onPracticeDrill(targets, `sim-${tech.id}`)}
        className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${unknownCount === 0
          ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
      >
        <Swords size={14} className="mr-2" />
        {unknownCount === 0 ? 'Lancer la Simulation' : 'Travailler les étapes'}
      </button>
    </div>
  );
};

const LabView = ({
  progressData,
  drillStatusMap,
  onUpdate,
  onConfirmPractice,
  onPracticeDrill,
  onPracticeReflex,
  appData,
  onUpdateCustomConnection,
  onUpdatePlannedCombos,
  activeStudentId
}: {
  progressData: Record<string, LessonProgress>,
  drillStatusMap: Record<string, DrillStatus>,
  onUpdate: any,
  onConfirmPractice: (msg: string) => void,
  onPracticeDrill: (targets: any[]) => void,
  onPracticeReflex: (techId: string) => void,
  appData: AppData,
  onUpdateCustomConnection: (techId: string, conn: ConnectionOverride | undefined) => void,
  onUpdatePlannedCombos: (combos: any[]) => void,
  activeStudentId: string
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false); // Restore editMode too if missing

  const activeStudent = appData.students.find(s => s.id === activeStudentId) || appData.students[0];
  const customConnections = activeStudent.customConnections || {};
  const plannedCombos = activeStudent.plannedCombos || [];

  const selectedTech = CURRICULUM.find(t => t.id === selectedId) || null;
  const connections = (selectedId && activeStudent) ? getConnections(selectedId, activeStudent) : { parents: [], children: [] };
  const parents = connections.parents;
  const children = connections.children;

  const handleConnectionChange = (type: 'parents' | 'children', targetTechId: string, action: 'add' | 'remove') => {
    // 1. Get current overrides or defaults
    if (!selectedId) return;
    const currentOverride = customConnections[selectedId] || { parents: [], children: [] };

    let newParents = currentOverride.parents ? [...currentOverride.parents] : [];
    let newChildren = currentOverride.children ? [...currentOverride.children] : [];

    if (type === 'parents') {
      if (action === 'add') newParents.push(targetTechId);
      else newParents = newParents.filter(id => id !== targetTechId);
    } else {
      if (action === 'add') newChildren.push(targetTechId);
      else newChildren = newChildren.filter(id => id !== targetTechId);
    }

    onUpdateCustomConnection(selectedTech!.id, { parents: newParents, children: newChildren });
  };

  const handleToggleCombo = (sourceId: string | undefined, focusId: string, destId: string | undefined) => {
    // Logic: Create a new combo entry or remove if exists (simplified to add for now per previous logic)
    const newComboId = `combo-${Date.now()}`;
    const newCombo = {
      id: newComboId,
      techniqueId: focusId,
      sourceId: sourceId,
      destinationId: destId,
      created: Date.now()
    };

    // Optimistic update
    onUpdatePlannedCombos([...plannedCombos, newCombo]);
    onConfirmPractice("Combo ajouté au plan !");
  };

  const relatedSims = useMemo(() => {
    if (!selectedTech) return [];

    const sims = CURRICULUM.filter(t =>
      t.fightSimSteps?.some(step => {
        const stepTargets = getTargetsFromText(step);
        return stepTargets.some(target => target.lessonId === selectedTech.id);
      })
    ).map(t => {
      const allStepTargets: any[] = [];
      t.fightSimSteps?.forEach(s => allStepTargets.push(...getTargetsFromText(s)));

      const total = allStepTargets.length;

      const unknownCount = allStepTargets.filter(target => {
        const prog = getVariationProgress(progressData, target.lessonId, target.variationId);
        const score = prog ? getScore(prog) : 0;
        return getLevelFromScore(score, appData.settings.thresholds) === CompetencyLevel.None;
      }).length;

      let totalScore = 0;
      let mastered = 0;
      allStepTargets.forEach(target => {
        const prog = getVariationProgress(progressData, target.lessonId, target.variationId);
        const score = prog ? getScore(prog) : 0;
        const level = getLevelFromScore(score, appData.settings.thresholds);
        if (level >= CompetencyLevel.Level4) mastered++;
        totalScore += level;
      });

      const avgCompetency = total > 0 ? totalScore / total : 0;

      return { tech: t, total, mastered, targets: allStepTargets, unknownCount, avgCompetency };
    });

    return sims.sort((a, b) => {
      if (a.unknownCount !== b.unknownCount) {
        return a.unknownCount - b.unknownCount;
      }
      return a.avgCompetency - b.avgCompetency;
    });
  }, [selectedTech, progressData, appData.settings.thresholds]);

  const recommendedSim = relatedSims.length > 0 ? relatedSims[0] : null;
  const otherSims = relatedSims.length > 1 ? relatedSims.slice(1) : [];
  const lastReflexDate = selectedTech ? (drillStatusMap[`reflex-${selectedTech.id}`]?.history[0] || 0) : 0;

  // IMPROVED REFLEX DRILL SPLITTING
  const reflexLines = selectedTech?.reflexDrill
    ? selectedTech.reflexDrill.split(/(?=\bIn combination with\b)|(?=\bAnd\s+[A-Z|a-z])/).map(p => p.trim()).filter(p => p)
    : [];

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <FlaskConical className="mr-2 text-purple-400" />
            Labo & Combos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {editMode ? "Mode Édition Activé : Supprimez ou ajoutez des connexions." : "Analysez et pratiquez les flux."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 select-none relative">
        {CURRICULUM.map(tech => {
          const vars = tech.variations;
          const totalLevels = vars.reduce((acc, v) => {
            const vp = getVariationProgress(progressData, tech.id, v.id);
            return acc + (vp ? getLevelFromScore(getScore(vp), appData.settings.thresholds) : 0);
          }, 0);
          const avg = vars.length ? Math.round(totalLevels / vars.length) : 0;
          const masteryStyles = getMasteryColorClasses(avg as CompetencyLevel);

          const isFullyMastered = vars.every(v => {
            const vp = getVariationProgress(progressData, tech.id, v.id);
            return vp && getLevelFromScore(getScore(vp), appData.settings.thresholds) >= CompetencyLevel.Level4;
          });

          let totalPractices = 0;
          let lastDate = 0;
          vars.forEach(v => {
            const vp = getVariationProgress(progressData, tech.id, v.id);
            if (vp) {
              totalPractices += (vp.trainingCount + vp.drillCount);
              if (vp.lastPracticed && vp.lastPracticed > lastDate) lastDate = vp.lastPracticed;
            }
          });

          const isSelected = selectedId === tech.id;
          const isFlowActive = selectedId !== null;
          const isParent = selectedId ? parents.includes(tech.id) : false;
          const isChild = selectedId ? children.includes(tech.id) : false;

          let borderColor = masteryStyles.border;
          let bgClass = masteryStyles.bg;
          let ringClass = '';
          let opacityClass = 'opacity-100';

          if (isFlowActive) {
            bgClass = 'bg-slate-800';
            if (isSelected) {
              borderColor = 'border-fuchsia-500';
              ringClass = 'ring-2 ring-fuchsia-500 z-10 scale-105 shadow-xl shadow-fuchsia-900/20';
              bgClass = 'bg-fuchsia-900/30';
            } else if (isParent) {
              borderColor = 'border-white';
              bgClass = 'bg-slate-700';
            } else if (isChild) {
              borderColor = 'border-red-500';
              bgClass = 'bg-red-900/20';
            } else {
              borderColor = 'border-slate-700';
              opacityClass = 'opacity-30 hover:opacity-100';
            }
          }

          return (
            <div
              key={tech.id}
              onClick={() => setSelectedId(isSelected ? null : tech.id)}
              className={`p-2 rounded border flex flex-col justify-between h-20 transition-all cursor-pointer ${bgClass} ${borderColor} ${ringClass} ${opacityClass}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[9px] font-bold font-mono ${isSelected ? 'text-fuchsia-300' : (isParent ? 'text-white' : (isChild ? 'text-red-400' : 'text-slate-400'))}`}>L{tech.lessonNumber}</span>
                {!isFlowActive && (
                  isFullyMastered ? (
                    <Star size={12} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${COMPETENCY_COLORS[avg as CompetencyLevel]}`}></div>
                  )
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-tight line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                {tech.name}
              </span>
              <div className="flex justify-between items-end mt-1">
                <div className="flex items-center text-[9px] font-medium text-slate-200/80">
                  <Repeat size={10} className="mr-0.5" /> {totalPractices}
                </div>
                <div className="flex items-center text-[9px] font-medium text-slate-200/80">
                  {lastDate > 0 ? new Date(lastDate).toLocaleDateString('fr-CA', { month: 'numeric', day: 'numeric' }) : '-'} <Clock size={10} className="ml-0.5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedTech ? (
        <div className="space-y-6 animate-fade-in relative mt-6">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${editMode
                ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/50'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              {editMode ? <><CheckCircle2 size={14} className="mr-2" /> Terminer</> : <><Edit3 size={14} className="mr-2" /> Modifier les Combos</>}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`space-y-2 rounded-xl p-2 transition-all ${editMode ? 'bg-slate-800/50 border border-dashed border-slate-500/30' : ''}`}>
              <div className="flex items-center justify-center space-x-2 text-white font-bold uppercase text-xs pb-2 border-b border-white/20">
                <ArrowDown className="rotate-180" size={14} /> <span>Départ (Source)</span>
              </div>
              <VariationStatusList
                techniques={parents}
                progressData={progressData}
                thresholds={appData.settings.thresholds}
                onUpdate={onUpdate}
                editMode={editMode}
                onRemove={(id) => handleConnectionChange('parents', id, 'remove')}
                autoExpand={true}
                onToggleCombo={(sourceId) => handleToggleCombo(sourceId, selectedTech.id, undefined)}
                plannedCombos={plannedCombos.filter(c => c.techniqueId === selectedTech.id && c.sourceId).map(c => c.sourceId!)}
              />
              {editMode && (
                <div className="mt-2">
                  <select
                    className="w-full bg-slate-800 text-xs p-2 rounded border border-slate-700 text-slate-300"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleConnectionChange('parents', e.target.value, 'add');
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">+ Ajouter une source</option>
                    {CURRICULUM.filter(t => t.id !== selectedId && !parents.includes(t.id)).map(t => (
                      <option key={t.id} value={t.id}>L{t.lessonNumber} - {t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-2 p-2">
              <div className="flex items-center justify-center space-x-2 text-fuchsia-400 font-bold uppercase text-xs pb-2 border-b border-fuchsia-900/30">
                <Target size={14} /> <span>Focus (Actuel)</span>
              </div>
              <VariationStatusList
                techniques={[selectedTech.id]}
                progressData={progressData}
                thresholds={appData.settings.thresholds}
                onUpdate={onUpdate}
                autoExpand={true}
              />
            </div>

            <div className={`space-y-2 rounded-xl p-2 transition-all ${editMode ? 'bg-red-900/10 border border-dashed border-red-500/30' : ''}`}>
              <div className="flex items-center justify-center space-x-2 text-red-500 font-bold uppercase text-xs pb-2 border-b border-red-900/30">
                <span>Fin (Suite)</span> <ArrowDown size={14} />
              </div>
              <VariationStatusList
                techniques={children}
                progressData={progressData}
                thresholds={appData.settings.thresholds}
                onUpdate={onUpdate}
                editMode={editMode}
                onRemove={(id) => handleConnectionChange('children', id, 'remove')}
                autoExpand={true}
                onToggleCombo={(destId) => handleToggleCombo(undefined, selectedTech.id, destId)}
                plannedCombos={plannedCombos.filter(c => c.techniqueId === selectedTech.id && c.destinationId).map(c => c.destinationId!)}
              />
              {editMode && (
                <div className="mt-2">
                  <select
                    className="w-full bg-slate-800 text-xs p-2 rounded border border-slate-700 text-slate-300"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleConnectionChange('children', e.target.value, 'add');
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">+ Ajouter une destination</option>
                    {CURRICULUM.filter(t => t.id !== selectedId && !children.includes(t.id)).map(t => (
                      <option key={t.id} value={t.id}>L{t.lessonNumber} - {t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Exercices Contextuels</h3>
            <div className="grid grid-cols-1 gap-6">

              {selectedTech.reflexDrill && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center">
                    <Zap size={12} className="mr-1 text-orange-500" /> Reflex Drill (Développement de Réflexes)
                  </h4>
                  <div className="bg-slate-800 border border-orange-500/30 rounded-xl p-4 shadow-lg shadow-orange-900/10">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-bold text-white text-sm">Drill de Réflexe - {selectedTech.name}</h5>
                      <div className="flex items-center space-x-2 bg-slate-950/50 p-1.5 rounded">
                        <Clock size={10} className="text-slate-500" />
                        <span className="text-[10px] text-slate-400">
                          Dernière: <span className="font-bold text-slate-300">{formatDate(lastReflexDate)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 rounded p-3 mb-4 border border-slate-800">
                      <ul className="space-y-3">
                        {reflexLines.map((line, idx) => {
                          let textColorClass = 'text-slate-300';
                          let bgColorClass = '';

                          const lineTargets = getTargetsFromText(line);
                          const refersToCurrent = lineTargets.some(t => t.lessonId === selectedTech.id);

                          if (refersToCurrent) {
                            textColorClass = 'text-fuchsia-100 font-bold';
                            bgColorClass = 'bg-fuchsia-900/30 -mx-1 px-1 rounded';
                          } else if (lineTargets.length > 0) {
                            let minLevel = CompetencyLevel.Level4;
                            lineTargets.forEach(t => {
                              const prog = getVariationProgress(progressData, t.lessonId, t.variationId);
                              const score = prog ? getScore(prog) : 0;
                              const lvl = getLevelFromScore(score, appData.settings.thresholds);
                              if (lvl < minLevel) minLevel = lvl;
                            });
                            textColorClass = getLevelTextColor(minLevel);
                          }

                          return (
                            <li key={idx} className={`text-xs ${bgColorClass}`}>
                              <div className="flex items-start">
                                <span className="mr-2 font-mono text-[10px] font-bold text-slate-600 mt-0.5">{idx + 1}.</span>
                                <span className={textColorClass}>{line}</span>
                              </div>
                              {lineTargets.length > 0 && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {lineTargets.map((t, vIdx) => {
                                    const tech = CURRICULUM.find(x => x.id === t.lessonId);
                                    const variation = tech?.variations.find(v => v.id === t.variationId);
                                    return (
                                      <div key={vIdx} className="text-[10px] text-slate-500 flex items-center">
                                        <div className="w-1 h-1 rounded-full bg-slate-600 mr-2"></div>
                                        {variation?.name}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>

                    <button
                      onClick={() => onPracticeReflex(selectedTech.id)}
                      className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white border border-orange-500/50 rounded-lg py-3 text-xs font-bold flex items-center justify-center transition-all shadow-md active:scale-95"
                    >
                      <Zap size={16} className="mr-2" /> Pratiquer le Reflex Drill (+1 pt)
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Simulations de Combat incluant {selectedTech.name}</h4>

                {recommendedSim && (
                  <div className="mb-6 animate-fade-in-up">
                    <h5 className="flex items-center text-xs font-bold text-yellow-500 mb-2">
                      <ThumbsUp size={12} className="mr-1" /> Recommandation du Coach
                    </h5>
                    <SimCard
                      sim={recommendedSim}
                      isRecommended={true}
                      recommendationType={recommendedSim.unknownCount === 0 ? 'mastery' : 'access'}
                      onPracticeDrill={onPracticeDrill}
                      selectedId={selectedId}
                      progressData={progressData}
                      thresholds={appData.settings.thresholds}
                      drillStatusMap={drillStatusMap}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherSims.length > 0 ? otherSims.map((sim, idx) => (
                    <SimCard
                      key={idx}
                      sim={sim}
                      onPracticeDrill={onPracticeDrill}
                      selectedId={selectedId}
                      progressData={progressData}
                      thresholds={appData.settings.thresholds}
                      drillStatusMap={drillStatusMap}
                    />
                  )) : (
                    !recommendedSim && <div className="col-span-2 text-center text-xs text-slate-500 italic py-4">Aucune simulation trouvée pour cette technique.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-slate-800 animate-fade-in">
          <FlaskConical className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-400">Sélectionnez une technique</h3>
          <p className="text-slate-500 text-sm mt-1">Cliquez sur une case de la grille ci-dessus pour analyser ses variations et ses connexions.</p>
        </div>
      )}
    </div>
  );
};

// --- COMBINED SIM VIEW (Évaluation + Coach/Drills) ---

type AgeGroup = 'kids' | 'teens' | 'adults';

interface DrillSegment {
  id: string;
  title: string;
  steps: string[];
  focusTechniqueId?: string;
}

const generateSegments = (tech: Technique, mode: AgeGroup): DrillSegment[] => {
  const steps = tech.fightSimSteps || [];
  if (steps.length === 0) return [];
  const segments: DrillSegment[] = [];
  if (mode === 'adults') {
    segments.push({ id: `${tech.id}-full`, title: "Séquence Complète", steps, focusTechniqueId: tech.id });
  } else if (mode === 'teens') {
    if (steps.length < 3) {
      segments.push({ id: `${tech.id}-trio-1`, title: "Séquence Courte", steps, focusTechniqueId: tech.id });
    } else {
      for (let i = 0; i <= steps.length - 3; i++) {
        segments.push({ id: `${tech.id}-trio-${i}`, title: `Trio ${i + 1} (${i + 1}-${i + 3})`, steps: steps.slice(i, i + 3), focusTechniqueId: tech.id });
      }
    }
  } else {
    if (steps.length < 2) {
      segments.push({ id: `${tech.id}-duo-1`, title: "Séquence Unique", steps, focusTechniqueId: tech.id });
    } else {
      for (let i = 0; i <= steps.length - 2; i++) {
        segments.push({ id: `${tech.id}-duo-${i}`, title: `Duo ${i + 1} (${i + 1}-${i + 2})`, steps: steps.slice(i, i + 2), focusTechniqueId: tech.id });
      }
    }
  }
  return segments;
};

const CombinedSimView = ({
  progressData,
  drillStatusMap,
  thresholds,
  onPracticeDrill
}: {
  progressData: Record<string, LessonProgress>,
  drillStatusMap: Record<string, DrillStatus>,
  thresholds: PointThresholds,
  onPracticeDrill: (targets: { lessonId: string, variationId: string }[], simId?: string) => void
}) => {
  const [mode, setMode] = useState<'evaluation' | 'coach'>('evaluation');
  const [selectedAge, setSelectedAge] = useState<AgeGroup>('adults');
  const [expandedLessons, setExpandedLessons] = useState<Record<number, boolean>>({});
  const [filterLesson, setFilterLesson] = useState('');

  const availableLessons = useMemo(() => {
    return CURRICULUM.filter(tech =>
      tech.lessonNumber >= 3 &&
      tech.lessonNumber <= 36 &&
      tech.fightSimSteps &&
      tech.fightSimSteps.length > 0
    );
  }, []);

  const filteredLessons = availableLessons.filter(l => {
    if (!filterLesson) return true;
    return l.lessonNumber.toString().includes(filterLesson) || l.name.toLowerCase().includes(filterLesson.toLowerCase());
  });

  const toggleLesson = (num: number) => {
    setExpandedLessons(prev => ({ ...prev, [num]: !prev[num] }));
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Header with mode toggle */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Swords className="mr-2 text-red-400" />
              Simulations de Combat
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'evaluation'
                ? 'Scénarios de combat complets pour tester vos réflexes et enchaînements.'
                : 'Exercices d\'enchaînement et de fluidité pour développer vos réflexes.'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setMode('evaluation')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center transition-all ${mode === 'evaluation' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Target size={14} className="mr-1.5" /> Évaluation
            </button>
            <button
              onClick={() => setMode('coach')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center transition-all ${mode === 'coach' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Dumbbell size={14} className="mr-1.5" /> Coach / Drills
            </button>
          </div>
        </div>

        {/* Search bar (visible in both modes) */}
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

      {/* Mode: Évaluation */}
      {mode === 'evaluation' && (
        <SimulationView
          progressData={progressData}
          drillStatusMap={drillStatusMap}
          thresholds={thresholds}
          onPracticeDrill={onPracticeDrill}
          filterText={filterLesson}
        />
      )}

      {/* Mode: Coach / Drills */}
      {mode === 'coach' && (
        <>
          {/* Age group selector */}
          <div className="flex justify-center">
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

          {/* Lessons accordion */}
          <div className="space-y-4">
            {filteredLessons.map(lesson => {
              const isExpanded = expandedLessons[lesson.lessonNumber] || filterLesson !== '';
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
        </>
      )}
    </div>
  );
};

const SimulationView = ({
  progressData,
  drillStatusMap,
  thresholds,
  onPracticeDrill,
  filterText
}: {
  progressData: Record<string, LessonProgress>,
  drillStatusMap: Record<string, DrillStatus>,
  thresholds: PointThresholds,
  onPracticeDrill: (targets: { lessonId: string, variationId: string }[], simId?: string) => void,
  filterText?: string
}) => {
  const sims = useMemo(() => {
    return CURRICULUM.filter(t => t.fightSimSteps && t.fightSimSteps.length > 0).map(t => {
      const allStepTargets: { lessonId: string, variationId: string }[] = [];
      t.fightSimSteps?.forEach(s => allStepTargets.push(...getTargetsFromText(s)));

      const total = allStepTargets.length;

      const unknownCount = allStepTargets.filter(target => {
        const prog = getVariationProgress(progressData, target.lessonId, target.variationId);
        const score = prog ? getScore(prog) : 0;
        return getLevelFromScore(score, thresholds) === CompetencyLevel.None;
      }).length;

      let totalScore = 0;
      let mastered = 0;
      allStepTargets.forEach(target => {
        const prog = getVariationProgress(progressData, target.lessonId, target.variationId);
        const score = prog ? getScore(prog) : 0;
        const level = getLevelFromScore(score, thresholds);
        if (level >= CompetencyLevel.Level4) mastered++;
        totalScore += level;
      });

      const avgCompetency = total > 0 ? totalScore / total : 0;

      return { tech: t, total, mastered, targets: allStepTargets, unknownCount, avgCompetency };
    });
  }, [progressData, thresholds]);

  const sortedSims = useMemo(() => {
    let filtered = [...sims];
    if (filterText) {
      const q = filterText.toLowerCase();
      filtered = filtered.filter(s =>
        s.tech.lessonNumber.toString().includes(q) || s.tech.name.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => {
      if (a.unknownCount === 0 && b.unknownCount > 0) return -1;
      if (a.unknownCount > 0 && b.unknownCount === 0) return 1;
      return a.tech.lessonNumber - b.tech.lessonNumber;
    });
  }, [sims, filterText]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedSims.map((sim) => (
        <SimCard
          key={sim.tech.id}
          sim={sim}
          onPracticeDrill={onPracticeDrill}
          progressData={progressData}
          thresholds={thresholds}
          drillStatusMap={drillStatusMap}
        />
      ))}
      {sortedSims.length === 0 && (
        <div className="col-span-full text-center py-10 text-slate-500">
          Aucune simulation trouvée pour cette recherche.
        </div>
      )}
    </div>
  );
};

const DashboardView = ({
  progressData,
  thresholds,
  onLevelClick
}: {
  progressData: Record<string, LessonProgress>,
  thresholds: PointThresholds,
  onLevelClick?: (level: CompetencyLevel) => void
}) => {
  const levels = {
    [CompetencyLevel.None]: 0,
    [CompetencyLevel.Level1]: 0,
    [CompetencyLevel.Level2]: 0,
    [CompetencyLevel.Level3]: 0,
    [CompetencyLevel.Level4]: 0,
  };

  CURRICULUM.forEach(tech => {
    tech.variations.forEach(v => {
      const prog = getVariationProgress(progressData, tech.id, v.id);
      const level = prog ? getLevelFromScore(getScore(prog), thresholds) : CompetencyLevel.None;
      levels[level]++;
    });
  });

  const chartData = [
    { name: 'Découverte', count: levels[CompetencyLevel.Level1], color: '#eab308', level: CompetencyLevel.Level1 },
    { name: 'Consolidation', count: levels[CompetencyLevel.Level2], color: '#f97316', level: CompetencyLevel.Level2 },
    { name: 'Réflexe', count: levels[CompetencyLevel.Level3], color: '#16a34a', level: CompetencyLevel.Level3 },
    { name: 'Maîtrise', count: levels[CompetencyLevel.Level4], color: '#2563eb', level: CompetencyLevel.Level4 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {chartData.map((d, i) => (
          <div
            key={i}
            onClick={() => onLevelClick && onLevelClick(d.level)}
            className="bg-slate-800 p-4 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-750 hover:border-slate-600 transition-all active:scale-95"
          >
            <h3 className="text-slate-400 text-xs uppercase font-bold">{d.name}</h3>
            <p className="text-2xl font-black text-white mt-1" style={{ color: d.color }}>{d.count}</p>
          </div>
        ))}
      </div>
      <div className="h-64 bg-slate-900 rounded-xl p-4 border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} onClick={(data) => {
            if (data && data.activePayload && data.activePayload.length > 0) {
              const payload = data.activePayload[0].payload;
              if (onLevelClick) onLevelClick(payload.level);
            }
          }}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
              cursor={{ fill: '#334155', opacity: 0.2 }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} className="cursor-pointer">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- SETTINGS VIEW ---

const SettingsView = ({
  appData,
  onUpdateSettings,
  onUpdateProfile,
  onImport,
  onOpenEditor,
  setAppData
}: {
  appData: AppData,
  onUpdateSettings: (settings: any) => void,
  onUpdateProfile: (name: string, belt: string) => void,
  onImport: (d: AppData) => void,
  onOpenEditor: () => void,
  setAppData: React.Dispatch<React.SetStateAction<AppData>>
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeStudent = appData.students.find(s => s.id === appData.activeStudentId) || appData.students[0];

  const [editName, setEditName] = useState(activeStudent.name);
  const [newBelt, setNewBelt] = useState(activeStudent.belt || 'White Belt');
  const [newStudentName, setNewStudentName] = useState("");

  useEffect(() => {
    if (activeStudent) {
      setEditName(activeStudent.name);
    }
  }, [activeStudent]);

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const newStudent: StudentProfile = {
      id: generateId(),
      name: newStudentName,
      progress: {},
      drillStatus: {},
      customConnections: {},
      plannedCombos: []
    };
    setAppData(prev => ({
      ...prev,
      students: [...prev.students, newStudent],
      activeStudentId: newStudent.id
    }));
    setNewStudentName("");
  };

  const handleRenameStudent = () => {
    if (!editName.trim()) return;
    onUpdateProfile(editName, newBelt);
    alert("Profil mis à jour !");
  };

  const handleDeleteStudent = () => {
    if (appData.students.length <= 1) {
      alert("Impossible de supprimer le dernier étudiant.");
      return;
    }
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le profil de ${activeStudent?.name} ? Cette action est irréversible.`)) {
      setAppData(prev => {
        const newStudents = prev.students.filter(s => s.id !== prev.activeStudentId);
        return {
          ...prev,
          students: newStudents,
          activeStudentId: newStudents[0].id
        };
      });
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `combatives_tracker_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportTrigger = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (importedData.students) {
          onImport(importedData);
        } else {
          alert("Format de fichier invalide.");
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier.");
      }
    };
    reader.readAsText(file);
  };

  const handleThresholdChange = (key: keyof PointThresholds, value: string) => {
    onUpdateSettings({ thresholds: { ...appData.settings.thresholds, [key]: Number(value) } });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <h2 className="text-xl font-bold text-white mb-2">Réglages</h2>
      </div>

      {/* Student Management */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <Users className="mr-2 text-blue-400" /> Gestion des Étudiants
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Étudiant Actif</label>
            <select
              value={appData.activeStudentId}
              onChange={(e) => setAppData(prev => ({ ...prev, activeStudentId: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-3"
            >
              {appData.students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2 items-end pt-4 border-t border-slate-700">
            <div className="flex-1">
              <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Modifier le nom</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
              />
            </div>
            <button
              onClick={handleRenameStudent}
              className="bg-slate-700 hover:bg-slate-600 text-white rounded px-3 py-2 text-sm font-bold border border-slate-600 h-[38px] flex items-center"
              title="Sauvegarder le nom"
            >
              <Save size={16} />
            </button>
            {appData.students.length > 1 && (
              <button
                onClick={handleDeleteStudent}
                className="bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded px-3 py-2 text-sm font-bold border border-red-900/50 h-[38px] flex items-center"
                title="Supprimer l'étudiant"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-slate-700">
            <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Ajouter un étudiant</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Nom de l'étudiant..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
              />
              <button
                onClick={handleAddStudent}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 text-sm font-bold flex items-center"
              >
                <Plus size={16} className="mr-1" /> Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <FileJson className="mr-2 text-green-400" /> Sauvegarde & Restauration
        </h3>
        <p className="text-xs text-slate-400 mb-4">Exportez vos données pour les sauvegarder ou transférez-les vers un autre appareil.</p>

        <div className="flex space-x-4">
          <button
            onClick={handleExport}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 border border-slate-600"
          >
            <Download size={18} />
            <span>Exporter</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 border border-slate-600"
          >
            <Upload size={18} />
            <span>Importer</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportTrigger}
            className="hidden"
            accept=".json"
          />
        </div>
      </div>

      {/* Thresholds */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Seuils de Points (Gamification)</h3>
        <p className="text-xs text-slate-400 mb-4">Définissez le score requis pour atteindre chaque niveau.</p>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="flex items-center justify-between text-sm font-bold text-slate-300 mb-2">
              <span className="text-orange-400">Niveau 2 (Débloque Drills)</span>
            </label>
            <input
              type="number"
              step="0.5"
              value={appData.settings.thresholds.level2}
              onChange={(e) => handleThresholdChange('level2', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-bold text-slate-300 mb-2">
              <span className="text-green-500">Niveau 3 (Réflexe)</span>
            </label>
            <input
              type="number"
              step="0.5"
              value={appData.settings.thresholds.level3}
              onChange={(e) => handleThresholdChange('level3', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-bold text-slate-300 mb-2">
              <span className="text-blue-500">Niveau 4 (Maîtrise)</span>
            </label>
            <input
              type="number"
              step="0.5"
              value={appData.settings.thresholds.level4}
              onChange={(e) => handleThresholdChange('level4', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- DEFAULT DATA & APP COMPONENT ---

const MARC_ANDRE_PROFILE: StudentProfile = {
  id: 'marc-andre',
  name: 'Marc-André',
  progress: DEFAULT_DATA.students[0].progress as unknown as Record<string, LessonProgress>,
  drillStatus: {}, // The import data structure had 'drillsCompleted', mapping to empty standard drillStatus
  customConnections: DEFAULT_DATA.students[0].customConnections as unknown as Record<string, ConnectionOverride>,
  plannedCombos: []
};

const DEFAULT_SETTINGS: AppSettings = {
  level1Name: 'Découverte',
  level2Name: 'Consolidation',
  level3Name: 'Réflexe',
  level4Name: 'Maîtrise',
  thresholds: { level1: 0.5, level2: 3, level3: 6, level4: 9 }
};

const DEFAULT_STUDENT: StudentProfile = {
  id: 'student-1',
  name: 'Nouvel Étudiant',
  progress: {},
  drillStatus: {},
  customConnections: {},
  plannedCombos: []
};


import LoginView from './LoginView';
import { useGJJData } from './hooks/useGJJData';


const App: React.FC = () => {
  // --- STATE MANAGEMENT VIA SUPABASE HOOK ---
  const {
    appData,
    updateProgress,
    updateDrillStatus,
    updateCustomConnection,
    resetLesson,
    updatePlannedCombos,
    updateSettings,
    updateProfile,
    loginAsGuest,
    switchStudent,
    allStudents,
    viewingStudentId,
    isAdmin,
    loading,
    user,
    setAppData
  } = useGJJData();

  // Local UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lab' | 'plan' | 'sim' | 'settings'>('dashboard');
  const [selectedLevel, setSelectedLevel] = useState<CompetencyLevel | null>(null);

  // ... (Loading & Auth screens remain the same) ...
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin mb-4" size={48} />
        <div className="text-sm text-slate-500">Chargement de la base de données...</div>
      </div>
    );
  }
  if (!user) return <LoginView onLoginAsGuest={loginAsGuest} />;

  const activeStudent = appData.students.find(s => s.id === appData.activeStudentId) || appData.students[0];
  const progressData = activeStudent.progress;

  // ... (Handlers) ...
  const handleUpdateProgress = (lessonId: string, variationId: string, updates: Partial<VariationProgress>) => {
    updateProgress(lessonId, variationId, updates);
  };

  // ... (Other handlers) ...
  // Re-declare handlers to ensure they are available in scope for JSX
  const handlePracticeDrill = (targets: { lessonId: string; variationId: string }[], simId?: string) => {
    const now = Date.now();
    targets.forEach(t => {
      const vp = getVariationProgress(progressData, t.lessonId, t.variationId);
      const currentCount = vp ? vp.drillCount : 0;
      const currentHistory = vp ? (vp.history || []) : [];
      updateProgress(t.lessonId, t.variationId, {
        drillCount: currentCount + 1,
        lastPracticed: now,
        history: [{ date: now, type: 'drill' }, ...currentHistory]
      });
    });
    if (simId) {
      const currentStatus = activeStudent.drillStatus[simId] || { id: simId, history: [] };
      updateDrillStatus(simId, { history: [now, ...currentStatus.history] });
    }
  };

  const handleUpdateCustomConnection = (techId: string, connection: ConnectionOverride | undefined) => {
    updateCustomConnection(techId, connection);
  };

  const handleResetLesson = (lessonId: string) => {
    resetLesson(lessonId);
  };

  const handlePracticeReflex = (techId: string) => {
    const now = Date.now();
    const drillId = `reflex-${techId}`;
    const currentStatus = activeStudent.drillStatus[drillId] || { id: drillId, history: [] };
    updateDrillStatus(drillId, { history: [now, ...currentStatus.history] });

    const tech = CURRICULUM.find(t => t.id === techId);
    if (tech) {
      tech.variations.forEach(v => {
        const vp = getVariationProgress(progressData, techId, v.id);
        const currentCount = vp ? vp.drillCount : 0;
        const currentHistory = vp ? (vp.history || []) : [];
        updateProgress(techId, v.id, {
          drillCount: currentCount + 1,
          lastPracticed: now,
          history: [{ date: now, type: 'drill' }, ...currentHistory]
        });
      });
    }
    alert("Reflex Drill enregistré ! (+1 pt pour toutes les variations)");
  };

  // Note: handleResetLesson was already defined above, removing duplicate.

  const handleImport = () => alert("Import désactivé en mode Cloud.");

  const handleRemovePlannedCombo = (id: string) => {
    const newCombos = activeStudent.plannedCombos ? activeStudent.plannedCombos.filter(c => c.id !== id) : [];
    updatePlannedCombos(newCombos);
  };

  const labels = {
    [CompetencyLevel.Level1]: appData.settings.level1Name,
    [CompetencyLevel.Level2]: appData.settings.level2Name,
    [CompetencyLevel.Level3]: appData.settings.level3Name,
    [CompetencyLevel.Level4]: appData.settings.level4Name
  } as Record<number, string>; // Fix type error

  // ... (Drills definition) ...
  const drills = [
    { number: 1, title: 'Mount Control & Escapes', lessons: CURRICULUM.filter(t => t.drillNumber === 1) },
    { number: 2, title: 'Guard Control & Sweeps', lessons: CURRICULUM.filter(t => t.drillNumber === 2) },
    { number: 3, title: 'Side Mount Control & Escapes', lessons: CURRICULUM.filter(t => t.drillNumber === 3) },
    { number: 4, title: 'Standing & Takedowns', lessons: CURRICULUM.filter(t => t.drillNumber === 4) },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
        <div className="max-w-7xl mx-auto min-h-screen flex flex-col">

          {/* Header (Desktop) */}
          <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-lg shadow-blue-900/20">
                  <Trophy className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white leading-none tracking-tight">
                    GRACIE<span className="text-blue-500">TRACKER</span>
                  </h1>
                  <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                    {activeStudent.name || 'Étudiant'}
                  </div>
                </div>
              </div>

              {/* Admin Student Selector */}
              {isAdmin && allStudents.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-amber-900/30 border border-amber-700/50 rounded-lg px-3 py-1.5">
                    <Shield size={14} className="text-amber-400 mr-2" />
                    <select
                      value={viewingStudentId || user?.id || ''}
                      onChange={(e) => switchStudent(e.target.value)}
                      className="bg-transparent text-amber-200 text-xs font-bold cursor-pointer focus:outline-none appearance-none pr-4"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23d97706' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0 center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                    >
                      {allStudents.map(s => (
                        <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                          {s.name}{s.belt ? ` (${s.belt})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="hidden md:flex space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`p-2 rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Tableau de bord"
                >
                  <LayoutDashboard size={18} />
                </button>
                <button
                  onClick={() => setActiveTab('lab')}
                  className={`p-2 rounded-md transition-all ${activeTab === 'lab' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Laboratoire"
                >
                  <FlaskConical size={18} />
                </button>
                <button
                  onClick={() => setActiveTab('plan')}
                  className={`p-2 rounded-md transition-all ${activeTab === 'plan' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Plan d'entraînement"
                >
                  <ListTodo size={18} />
                </button>
                <button
                  onClick={() => setActiveTab('sim')}
                  className={`p-2 rounded-md transition-all ${activeTab === 'sim' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Simulations"
                >
                  <Swords size={18} />
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`p-2 rounded-md transition-all ${activeTab === 'settings' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Réglages"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>

            {/* Admin Banner: visible when viewing another student */}
            {isAdmin && viewingStudentId && viewingStudentId !== user?.id && (
              <div className="bg-amber-900/20 border-t border-amber-700/30 px-4 py-1.5 flex items-center justify-center">
                <User size={12} className="text-amber-400 mr-1.5" />
                <span className="text-[11px] text-amber-300 font-semibold">
                  👁️ Vue Admin : {activeStudent.name}
                </span>
              </div>
            )}
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 pb-24 md:pb-10 overflow-x-hidden">
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in relative">
                <DashboardView
                  progressData={progressData}
                  thresholds={appData.settings.thresholds}
                  onLevelClick={(level) => setSelectedLevel(level)}
                />

                {selectedLevel !== null && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedLevel(null)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-xl">
                        <h3 className="text-lg font-bold text-white flex items-center">
                          <span className={`w-3 h-3 rounded-full mr-2 ${COMPETENCY_COLORS[selectedLevel]}`}></span>
                          Techniques : {labels[selectedLevel]}
                        </h3>
                        <button onClick={() => setSelectedLevel(null)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800">
                          <X size={20} />
                        </button>
                      </div>

                      <div className="p-4 overflow-y-auto custom-scrollbar space-y-2 flex-1">
                        {(() => {
                          const techsInLevel: { tech: Technique, variation: Variation, score: number }[] = [];
                          CURRICULUM.forEach(t => {
                            t.variations.forEach(v => {
                              const prog = getVariationProgress(progressData, t.id, v.id);
                              const score = prog ? getScore(prog) : 0;
                              if (getLevelFromScore(score, appData.settings.thresholds) === selectedLevel) {
                                techsInLevel.push({ tech: t, variation: v, score });
                              }
                            });
                          });

                          if (techsInLevel.length === 0) {
                            return <p className="text-slate-500 text-center py-8 italic">Aucune technique dans cette catégorie.</p>;
                          }

                          return (
                            <>
                              <div className="mb-4 flex justify-end">
                                <button
                                  onClick={() => {
                                    const random = techsInLevel[Math.floor(Math.random() * techsInLevel.length)];
                                    alert(`Suggestion Sherlock : Essayez "${random.tech.name} - ${random.variation.name}" (Leçon ${random.tech.lessonNumber})`);
                                  }}
                                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg font-bold flex items-center transition-colors shadow-lg shadow-indigo-900/20"
                                >
                                  <Zap size={14} className="mr-1" /> Suggérer une technique
                                </button>
                              </div>
                              {techsInLevel.map((item, idx) => (
                                <div key={idx} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex justify-between items-center group hover:bg-slate-750 transition-colors">
                                  <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">L{item.tech.lessonNumber}</span>
                                      <span className="text-sm font-bold text-slate-200">{item.tech.name}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 ml-1">{item.variation.name}</div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-mono text-slate-500">Score: <span className="text-white font-bold">{item.score.toFixed(1)}</span></span>
                                  </div>
                                </div>
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {drills.map(drill => (
                    <DrillSection
                      key={drill.number}
                      drillNumber={drill.number}
                      title={drill.title}
                      techniques={drill.lessons}
                      progressData={progressData}
                      drillStatusMap={activeStudent.drillStatus}
                      labels={labels}
                      thresholds={appData.settings.thresholds}
                      onUpdate={handleUpdateProgress}
                      onReset={handleResetLesson}
                      onPracticeReflex={handlePracticeReflex}
                      isOpenDefault={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'lab' && (
              <LabView
                progressData={progressData}
                drillStatusMap={activeStudent.drillStatus}
                onUpdate={handleUpdateProgress}
                onConfirmPractice={(msg) => alert(msg)}
                onPracticeDrill={handlePracticeDrill}
                onPracticeReflex={handlePracticeReflex}
                onUpdateCustomConnection={handleUpdateCustomConnection}
                onUpdatePlannedCombos={updatePlannedCombos}
                appData={appData}
                activeStudentId={appData.activeStudentId}
              />
            )}

            {activeTab === 'plan' && (
              <PlanView
                progressData={progressData}
                labels={labels}
                thresholds={appData.settings.thresholds}
                onUpdate={handleUpdateProgress}
                plannedCombos={activeStudent.plannedCombos}
                onRemoveCombo={handleRemovePlannedCombo}
              />
            )}

            {activeTab === 'sim' && (
              <CombinedSimView
                progressData={progressData}
                drillStatusMap={activeStudent.drillStatus}
                thresholds={appData.settings.thresholds}
                onPracticeDrill={handlePracticeDrill}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                appData={appData}
                setAppData={setAppData}
                onUpdateSettings={updateSettings}
                onUpdateProfile={updateProfile}
                onImport={handleImport}
                onOpenEditor={() => setActiveTab('lab')}
              />
            )}
          </main>

          {/* Bottom Nav (Mobile Only) */}
          <nav className="fixed md:hidden bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 pb-safe z-50">
            <div className="flex justify-around items-center h-16">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-500'}`}
              >
                <LayoutDashboard size={20} />
                <span className="text-[10px] mt-1 font-medium">Tableau</span>
              </button>
              <button
                onClick={() => setActiveTab('lab')}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'lab' ? 'text-purple-400' : 'text-slate-500'}`}
              >
                <FlaskConical size={20} />
                <span className="text-[10px] mt-1 font-medium">Labo</span>
              </button>
              <button
                onClick={() => setActiveTab('plan')}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'plan' ? 'text-orange-400' : 'text-slate-500'}`}
              >
                <ListTodo size={20} />
                <span className="text-[10px] mt-1 font-medium">Plan</span>
              </button>
              <button
                onClick={() => setActiveTab('sim')}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'sim' ? 'text-red-400' : 'text-slate-500'}`}
              >
                <Swords size={20} />
                <span className="text-[10px] mt-1 font-medium">Sims</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'settings' ? 'text-slate-200' : 'text-slate-500'}`}
              >
                <Settings size={20} />
                <span className="text-[10px] mt-1 font-medium">Réglages</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;