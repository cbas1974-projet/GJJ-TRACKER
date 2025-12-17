import React, { useState, useEffect, useMemo, useRef, ReactNode, Component, ErrorInfo } from 'react';
import { 
  Trophy, LayoutDashboard, ListTodo, 
  ChevronDown, ChevronUp, PlayCircle, Dumbbell, Settings, Save, 
  Swords, CheckSquare, Lock, AlertCircle, 
  Bookmark, NotebookPen, X, 
  ArrowDown, Printer, FlaskConical, 
  Plus, Edit3, Clock, Repeat, Star, ThumbsUp, History, Upload, Download, FileJson, Trash2,
  CheckCircle2, Target, Users, UserPlus, Minus, RefreshCw, MinusCircle, Zap, Info, Pencil, Share2, Link, SaveAll,
  AlertTriangle, Copy,
  BarChart as BarChartIcon, ArrowRight
} from 'lucide-react';
import { CURRICULUM } from './data';
import { IMPORTED_MARC_ANDRE } from './initialData';
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
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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
          style={{width: `${progressPercent}%`}}
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
          className={`flex items-center justify-center w-10 py-2 rounded border transition-all active:scale-95 ${
            progress.isPlanned 
            ? 'bg-blue-600 border-blue-500 text-white' 
            : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'
          }`}
          title="Ajouter au plan"
        >
          <Bookmark size={16} fill={progress.isPlanned ? "currentColor" : "none"} />
        </button>

        <button 
          onClick={() => setShowNotes(!showNotes)}
          className={`flex items-center justify-center w-10 py-2 rounded border transition-all active:scale-95 ${
            progress.notes 
            ? 'bg-slate-700 border-slate-600 text-brand-300' 
            : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white hover:border-slate-500'
          }`}
          title="Notes personnelles"
        >
          <NotebookPen size={16} />
        </button>

        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center justify-center w-10 py-2 rounded border transition-all active:scale-95 ${
            showHistory
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
                  <span>{new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span className={`font-bold ${
                    h.type === 'video' ? 'text-blue-400' : 
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
           {expanded ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
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
    if(isOpenDefault) setIsOpen(true);
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
        {isOpen ? <ChevronUp className="text-slate-400 flex-shrink-0"/> : <ChevronDown className="text-slate-400 flex-shrink-0"/>}
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
                    className={`ml-2 p-1 rounded transition-all flex-shrink-0 ${
                       isComboPlanned
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
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               onUpdate(tech.id, v.id, { isPlanned: !(vp?.isPlanned) });
                             }}
                             className={`p-1 rounded transition-all ${vp?.isPlanned ? 'text-blue-400 bg-blue-900/30' : 'text-slate-600 hover:text-slate-400'}`}
                             title={vp?.isPlanned ? "Retirer du plan" : "Ajouter au plan"}
                           >
                             <Bookmark size={12} fill={vp?.isPlanned ? "currentColor" : "none"} />
                           </button>
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
               
               if(!focus) return null;

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
    <div className={`rounded-xl p-4 border transition-all ${
      isRecommended 
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
           <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
             unknownCount === 0 ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-slate-700 text-slate-400'
           }`}>
             {unknownCount === 0 ? 'Prêt' : `${unknownCount} inconnues`}
           </div>
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-900 rounded-full mb-4 overflow-hidden">
        <div 
          className={`h-full ${unknownCount === 0 ? 'bg-green-500' : 'bg-blue-500'} transition-all`} 
          style={{width: `${progressPercent}%`}}
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
               <div key={idx} className={`text-xs p-1.5 rounded flex items-center ${
                  isSelectedRef ? 'bg-fuchsia-900/20 text-fuchsia-200' : 'text-slate-300'
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
        className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
           unknownCount === 0 
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

const LabView = ({ progressData, drillStatusMap, onUpdate, onConfirmPractice, onPracticeDrill, onPracticeReflex, appData, setAppData, activeStudentId }: { 
  progressData: Record<string, LessonProgress>, 
  drillStatusMap: Record<string, DrillStatus>,
  onUpdate: any,
  onConfirmPractice: (msg: string) => void,
  onPracticeDrill: (targets: any[]) => void, 
  onPracticeReflex: (techId: string) => void,
  appData: AppData,
  setAppData: React.Dispatch<React.SetStateAction<AppData>>,
  activeStudentId: string
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  const student = appData.students.find(s => s.id === activeStudentId);
  const selectedTech = CURRICULUM.find(t => t.id === selectedId);
  const connections = (selectedId && student) ? getConnections(selectedId, student) : { parents: [], children: [] };
  const parents = connections.parents;
  const children = connections.children;
  
  const plannedCombos = student?.plannedCombos || [];

  const handleConnectionChange = (type: 'parents' | 'children', targetTechId: string, action: 'add' | 'remove') => {
    if (!selectedId || !student) return;
    setAppData(prev => {
      const studentIndex = prev.students.findIndex(s => s.id === activeStudentId);
      if (studentIndex === -1) return prev;
      
      const newStudents = [...prev.students];
      const currentStudent = newStudents[studentIndex];
      
      const selectedTechObj = CURRICULUM.find(t => t.id === selectedId);
      const currentOverrides = currentStudent.customConnections[selectedId] || { 
        parents: selectedTechObj?.parents || [], 
        children: selectedTechObj?.children || [] 
      };

      let newList = [...currentOverrides[type]];
      if (action === 'remove') {
        newList = newList.filter(id => id !== targetTechId);
      } else {
        if (!newList.includes(targetTechId)) newList.push(targetTechId);
      }

      newStudents[studentIndex] = {
        ...currentStudent,
        customConnections: {
          ...currentStudent.customConnections,
          [selectedId]: { ...currentOverrides, [type]: newList }
        }
      };

      return { ...prev, students: newStudents };
    });
  };

  const handleToggleCombo = (sourceId: string | undefined, focusId: string, destId: string | undefined) => {
     if(!student) return;

     // Check if combo already exists
     const existingIndex = plannedCombos.findIndex(c => 
        c.techniqueId === focusId && 
        c.sourceId === sourceId && 
        c.destinationId === destId
     );

     setAppData(prev => {
        const studentIdx = prev.students.findIndex(s => s.id === activeStudentId);
        if (studentIdx === -1) return prev;
        const s = prev.students[studentIdx];
        const newCombos = s.plannedCombos ? [...s.plannedCombos] : [];
        
        if (existingIndex >= 0) {
           newCombos.splice(existingIndex, 1);
        } else {
           newCombos.push({
              id: generateId(),
              techniqueId: focusId,
              sourceId: sourceId,
              destinationId: destId,
              created: Date.now()
           });
        }
        
        const newStudents = [...prev.students];
        newStudents[studentIdx] = { ...s, plannedCombos: newCombos };
        return { ...prev, students: newStudents };
     });
  };

  const relatedSims = useMemo(() => {
    if(!selectedTech) return [];
    
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
             if(vp) {
               totalPractices += (vp.trainingCount + vp.drillCount);
               if(vp.lastPracticed && vp.lastPracticed > lastDate) lastDate = vp.lastPracticed;
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
                     {lastDate > 0 ? new Date(lastDate).toLocaleDateString('fr-CA', {month:'numeric', day:'numeric'}) : '-'} <Clock size={10} className="ml-0.5" />
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
                className={`flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  editMode 
                  ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/50' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
                {editMode ? <><CheckCircle2 size={14} className="mr-2"/> Terminer</> : <><Edit3 size={14} className="mr-2"/> Modifier les Combos</>}
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
                      if(e.target.value) {
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
                      if(e.target.value) {
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
                       <Zap size={12} className="mr-1 text-orange-500"/> Reflex Drill (Développement de Réflexes)
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

const SimulationView = ({ 
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
     return [...sims].sort((a, b) => {
        if (a.unknownCount === 0 && b.unknownCount > 0) return -1;
        if (a.unknownCount > 0 && b.unknownCount === 0) return 1;
        return a.tech.lessonNumber - b.tech.lessonNumber;
     });
  }, [sims]);

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
       <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
         <h2 className="text-xl font-bold text-white flex items-center">
           <Swords className="mr-2 text-red-400" />
           Simulations de Combat
         </h2>
         <p className="text-xs text-slate-400 mt-1">
           Scénarios de combat complets pour tester vos réflexes et enchaînements.
         </p>
       </div>

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
       </div>
    </div>
  );
};

const DashboardView = ({ progressData, thresholds }: { progressData: Record<string, LessonProgress>, thresholds: PointThresholds }) => {
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
    { name: 'Découverte', count: levels[CompetencyLevel.Level1], color: '#eab308' },
    { name: 'Consolidation', count: levels[CompetencyLevel.Level2], color: '#f97316' },
    { name: 'Réflexe', count: levels[CompetencyLevel.Level3], color: '#16a34a' },
    { name: 'Maîtrise', count: levels[CompetencyLevel.Level4], color: '#2563eb' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {chartData.map((d, i) => (
          <div key={i} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
             <h3 className="text-slate-400 text-xs uppercase font-bold">{d.name}</h3>
             <p className="text-2xl font-black text-white mt-1" style={{ color: d.color }}>{d.count}</p>
          </div>
        ))}
      </div>
      <div className="h-64 bg-slate-900 rounded-xl p-4 border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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
  setAppData, 
  onImport,
  onOpenEditor 
}: { 
  appData: AppData, 
  setAppData: React.Dispatch<React.SetStateAction<AppData>>, 
  onImport: (d: AppData) => void,
  onOpenEditor: () => void 
}) => {
  const [newStudentName, setNewStudentName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activeStudent = appData.students.find(s => s.id === appData.activeStudentId);
  const [editName, setEditName] = useState(activeStudent?.name || "");

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
    setAppData(prev => ({
      ...prev,
      students: prev.students.map(s => 
        s.id === prev.activeStudentId ? { ...s, name: editName } : s
      )
    }));
    alert("Nom modifié !");
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
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setAppData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          thresholds: { ...prev.settings.thresholds, [key]: num }
        }
      }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
        <h2 className="text-xl font-bold text-white mb-2">Réglages</h2>
      </div>

      {/* Student Management */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <Users className="mr-2 text-blue-400"/> Gestion des Étudiants
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
          <FileJson className="mr-2 text-green-400"/> Sauvegarde & Restauration
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
  progress: IMPORTED_MARC_ANDRE.students[0].progress as unknown as Record<string, LessonProgress>,
  drillStatus: {}, // The import data structure had 'drillsCompleted', mapping to empty standard drillStatus
  customConnections: IMPORTED_MARC_ANDRE.students[0].customConnections as unknown as Record<string, ConnectionOverride>,
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

const DEFAULT_DATA: AppData = {
  settings: DEFAULT_SETTINGS,
  students: [MARC_ANDRE_PROFILE, DEFAULT_STUDENT], // Added Marc-Andre as first student
  activeStudentId: 'marc-andre'
};

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem('bjj_tracker_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure student structure is up to date (handling missing plannedCombos)
        if (parsed.students) {
           parsed.students = parsed.students.map((s: any) => ({
              ...s,
              plannedCombos: s.plannedCombos || []
           }));
        }
        return parsed;
      }
    } catch (e) {
      console.error("Failed to load local data, using default", e);
    }
    return DEFAULT_DATA;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'lab' | 'plan' | 'sim' | 'settings'>('dashboard');
  const activeStudent = appData.students.find(s => s.id === appData.activeStudentId) || appData.students[0];
  const progressData = activeStudent.progress;

  useEffect(() => {
    localStorage.setItem('bjj_tracker_data', JSON.stringify(appData));
  }, [appData]);

  const handleUpdateProgress = (lessonId: string, variationId: string, updates: Partial<VariationProgress>) => {
    setAppData(prev => {
      const studentIdx = prev.students.findIndex(s => s.id === prev.activeStudentId);
      if (studentIdx === -1) return prev;
      
      const newStudents = [...prev.students];
      const student = newStudents[studentIdx];
      const currentLesson = student.progress[lessonId] || { techniqueId: lessonId, variations: {} };
      const currentVar = currentLesson.variations[variationId] || { 
        id: variationId, videoCount: 0, trainingCount: 0, drillCount: 0 
      };
      
      const newVar = { ...currentVar, ...updates };
      
      newStudents[studentIdx] = {
        ...student,
        progress: {
          ...student.progress,
          [lessonId]: {
            ...currentLesson,
            variations: {
              ...currentLesson.variations,
              [variationId]: newVar
            }
          }
        }
      };
      
      return { ...prev, students: newStudents };
    });
  };

  const handlePracticeDrill = (targets: { lessonId: string; variationId: string }[], simId?: string) => {
    setAppData(prev => {
       const studentIdx = prev.students.findIndex(s => s.id === prev.activeStudentId);
       if (studentIdx === -1) return prev;
       
       const newStudents = [...prev.students];
       const student = newStudents[studentIdx];
       let newProgress = { ...student.progress };
       let newDrillStatus = { ...student.drillStatus };

       const now = Date.now();

       // Update history for Simulation itself if simId provided
       if (simId) {
          const currentStatus = newDrillStatus[simId] || { id: simId, history: [] };
          newDrillStatus[simId] = { ...currentStatus, history: [now, ...currentStatus.history] };
       }

       // Update all targeted variations
       targets.forEach(t => {
          const currentLesson = newProgress[t.lessonId] || { techniqueId: t.lessonId, variations: {} };
          const currentVar = currentLesson.variations[t.variationId] || { 
             id: t.variationId, videoCount: 0, trainingCount: 0, drillCount: 0 
          };
          
          newProgress[t.lessonId] = {
             ...currentLesson,
             variations: {
                ...currentLesson.variations,
                [t.variationId]: {
                   ...currentVar,
                   drillCount: currentVar.drillCount + 1,
                   lastPracticed: now,
                   history: [{ date: now, type: 'drill' }, ...(currentVar.history || [])]
                }
             }
          };
       });

       newStudents[studentIdx] = { ...student, progress: newProgress, drillStatus: newDrillStatus };
       return { ...prev, students: newStudents };
    });
    alert("Entraînement enregistré ! (+1 pt pour chaque variation impliquée)");
  };

  const handlePracticeReflex = (techId: string) => {
     setAppData(prev => {
        const studentIdx = prev.students.findIndex(s => s.id === prev.activeStudentId);
        if (studentIdx === -1) return prev;

        const newStudents = [...prev.students];
        const student = newStudents[studentIdx];
        let newProgress = { ...student.progress };
        let newDrillStatus = { ...student.drillStatus };
        const now = Date.now();

        // Update Reflex Drill History
        const drillId = `reflex-${techId}`;
        const currentStatus = newDrillStatus[drillId] || { id: drillId, history: [] };
        newDrillStatus[drillId] = { ...currentStatus, history: [now, ...currentStatus.history] };

        // Update all variations of this technique
        const tech = CURRICULUM.find(t => t.id === techId);
        if (tech) {
           const currentLesson = newProgress[techId] || { techniqueId: techId, variations: {} };
           const newVariations = { ...currentLesson.variations };

           tech.variations.forEach(v => {
              const currentVar = newVariations[v.id] || { id: v.id, videoCount: 0, trainingCount: 0, drillCount: 0 };
              newVariations[v.id] = {
                 ...currentVar,
                 drillCount: currentVar.drillCount + 1,
                 lastPracticed: now,
                 history: [{ date: now, type: 'drill' }, ...(currentVar.history || [])]
              };
           });

           newProgress[techId] = { ...currentLesson, variations: newVariations };
        }

        newStudents[studentIdx] = { ...student, progress: newProgress, drillStatus: newDrillStatus };
        return { ...prev, students: newStudents };
     });
     alert("Reflex Drill enregistré ! (+1 pt pour toutes les variations)");
  };

  const handleResetLesson = (lessonId: string) => {
    setAppData(prev => {
      const studentIdx = prev.students.findIndex(s => s.id === prev.activeStudentId);
      if (studentIdx === -1) return prev;
      
      const newStudents = [...prev.students];
      const student = newStudents[studentIdx];
      const newProgress = { ...student.progress };
      delete newProgress[lessonId];
      
      newStudents[studentIdx] = { ...student, progress: newProgress };
      return { ...prev, students: newStudents };
    });
  };

  const handleImport = (data: AppData) => {
     if(window.confirm("Ceci va remplacer vos données actuelles. Continuer ?")) {
        setAppData(data);
        alert("Données importées avec succès !");
     }
  };

  const handleRemovePlannedCombo = (id: string) => {
     setAppData(prev => {
        const studentIdx = prev.students.findIndex(s => s.id === prev.activeStudentId);
        if (studentIdx === -1) return prev;
        const s = prev.students[studentIdx];
        const newCombos = s.plannedCombos ? s.plannedCombos.filter(c => c.id !== id) : [];
        const newStudents = [...prev.students];
        newStudents[studentIdx] = { ...s, plannedCombos: newCombos };
        return { ...prev, students: newStudents };
     });
  };

  const labels = {
    [CompetencyLevel.Level1]: appData.settings.level1Name,
    [CompetencyLevel.Level2]: appData.settings.level2Name,
    [CompetencyLevel.Level3]: appData.settings.level3Name,
    [CompetencyLevel.Level4]: appData.settings.level4Name
  };

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
                         {activeStudent.name}
                      </div>
                   </div>
                </div>
                
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
                    title="Plan"
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
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 pb-24 md:pb-10 overflow-x-hidden">
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                <DashboardView progressData={progressData} thresholds={appData.settings.thresholds} />
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
                      isOpenDefault={drill.number === 1}
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
                appData={appData}
                setAppData={setAppData}
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
               <SimulationView 
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