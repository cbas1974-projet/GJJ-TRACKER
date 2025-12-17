import React, { useState, useEffect, useMemo, useRef, ReactNode, ErrorInfo } from 'react';
import { 
  Trophy, LayoutDashboard, ListTodo, 
  ChevronDown, ChevronUp, PlayCircle, Dumbbell, Settings, Save, 
  Swords, CheckSquare, 
  Bookmark, NotebookPen, X, 
  ArrowDown, FlaskConical, 
  Plus, Edit3, Clock, Repeat, Star, ThumbsUp, History, Upload, Download, FileJson, Trash2,
  CheckCircle2, Target, Users, Minus, RefreshCw, Zap, 
  AlertTriangle,
  ArrowRight
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

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
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
             Plan d'Entraî