import React, { useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { 
  Trophy, LayoutDashboard, ListTodo, ChevronDown, ChevronUp, PlayCircle, Dumbbell, Settings, Save, 
  Swords, CheckSquare, Bookmark, NotebookPen, X, FlaskConical, Plus, Edit3, Clock, Repeat, Star, 
  ThumbsUp, History, Upload, Download, FileJson, Trash2, CheckCircle2, Target, Users, RefreshCw, 
  Zap, ArrowRight, BookOpen, ArrowDown
} from 'lucide-react';
import { CURRICULUM } from './data';
import { IMPORTED_MARC_ANDRE } from './initialData';
import { CompetencyLevel, Technique, LessonProgress, AppData, COMPETENCY_COLORS, Variation, VariationProgress, PointThresholds, AppSettings, StudentProfile, DrillStatus, PlannedCombo, ConnectionOverride, Program } from './types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- ERROR BOUNDARY (Stabilisé) ---
interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error("Uncaught error:", error, errorInfo); }
  handleReset = () => {
    if (window.confirm("Réinitialiser l'application ?")) {
      localStorage.removeItem('bjj_tracker_data');
      window.location.reload();
    }
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
          <RefreshCw size={64} className="text-red-500 mb-4 animate-spin" />
          <h1 className="text-2xl font-bold mb-6">Erreur de données détectée</h1>
          <button onClick={this.handleReset} className="bg-red-600 p-3 rounded-lg font-bold">Réinitialiser</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- UTILS ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const getScore = (p?: VariationProgress) => p ? (p.videoCount * 0.5) + (p.trainingCount * 2.0) + (p.drillCount * 1.0) : 0;
const getLevelFromScore = (s: number, t: PointThresholds): CompetencyLevel => {
  if (s <= 0) return CompetencyLevel.None;
  if (s < t.level2) return CompetencyLevel.Level1;
  if (s < t.level3) return CompetencyLevel.Level2;
  if (s < t.level4) return CompetencyLevel.Level3;
  return CompetencyLevel.Level4;
};
const getVariationProgress = (data: Record<string, LessonProgress>, lId: string, vId: string) => data?.[lId]?.variations?.[vId];

const getTargetsFromText = (text: string): { lessonId: string, variationId: string }[] => {
  const targets: { lessonId: string, variationId: string }[] = [];
  const matches = text.match(/\(L(\d+)\)/g);
  matches?.forEach(m => {
    const num = parseInt(m.replace(/\D/g, ''));
    const tech = CURRICULUM.find(t => t.lessonNumber === num);
    if (tech) targets.push({ lessonId: tech.id, variationId: tech.variations[0].id });
  });
  return targets;
};

const getLevelTextColor = (l: CompetencyLevel) => {
  const colors = ['text-slate-500', 'text-yellow-500', 'text-orange-500', 'text-green-500', 'text-blue-500'];
  return colors[l] || colors[0];
};

const getMasteryColorClasses = (l: CompetencyLevel) => {
  const styles = [
    { border: 'border-slate-700', bg: 'bg-slate-800' },
    { border: 'border-yellow-500', bg: 'bg-yellow-900/20' },
    { border: 'border-orange-500', bg: 'bg-orange-900/20' },
    { border: 'border-green-600', bg: 'bg-green-900/20' },
    { border: 'border-blue-600', bg: 'bg-blue-900/20' }
  ];
  return styles[l] || styles[0];
};

const formatDate = (ts: number) => ts ? new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Jamais';

// --- SUB-COMPONENTS ---
const LevelBadge = ({ level }: { level: CompetencyLevel }) => {
  const styles = [
    "border-slate-700 text-slate-600", "bg-yellow-500", "bg-orange-500", "bg-green-600", "bg-blue-600"
  ];
  return (
    <div className={`w-5 h-5 flex items-center justify-center rounded-[4px] text-[9px] font-black ${styles[level]} text-white`}>
      {level > 0 ? `L${level}` : ''}
    </div>
  );
};

const VariationRow = ({ variation, progress, labels, thresholds, onUpdate, showLessonContext, lessonName, lessonNumber }: any) => {
  const [showNotes, setShowNotes] = useState(false);
  const score = getScore(progress);
  const level = getLevelFromScore(score, thresholds);
  
  const handleUpdate = (type: 'video' | 'training', change: number) => {
    const updates: any = { history: [{ date: Date.now(), type }, ...(progress.history || [])] };
    if (type === 'video') updates.videoCount = Math.max(0, progress.videoCount + change);
    else { updates.trainingCount = Math.max(0, progress.trainingCount + change); updates.lastPracticed = Date.now(); }
    onUpdate(updates);
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 mb-2">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-bold text-slate-200">{showLessonContext ? `L${lessonNumber}: ${variation.name}` : variation.name}</div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${COMPETENCY_COLORS[level]} text-white`}>{labels[level] || 'Début'}</div>
      </div>
      <div className="flex space-x-2">
        <button onClick={() => handleUpdate('video', 1)} className="flex-1 bg-slate-800 p-2 rounded text-[10px] flex items-center justify-center"><PlayCircle size={12} className="mr-1"/> Vidéo ({progress.videoCount})</button>
        <button onClick={() => handleUpdate('training', 1)} className="flex-1 bg-slate-800 p-2 rounded text-[10px] flex items-center justify-center"><Dumbbell size={12} className="mr-1"/> Tapis ({progress.trainingCount})</button>
        <button onClick={() => onUpdate({ isPlanned: !progress.isPlanned })} className={`p-2 rounded ${progress.isPlanned ? 'bg-blue-600' : 'bg-slate-800'}`}><Bookmark size={14}/></button>
        <button onClick={() => setShowNotes(!showNotes)} className="p-2 bg-slate-800 rounded"><NotebookPen size={14}/></button>
      </div>
      {showNotes && <textarea value={progress.notes || ''} onChange={e => onUpdate({ notes: e.target.value })} className="w-full mt-2 bg-slate-950 p-2 text-xs rounded border border-slate-700" placeholder="Notes..."/>}
    </div>
  );
};

const LessonCard = ({ technique, progress, labels, thresholds, onUpdate, onReset, onPracticeReflex, allProgressData }: any) => {
  const [expanded, setExpanded] = useState(false);
  const safeProgress = progress || { variations: {} };
  const avgLevel = useMemo(() => {
    const total = technique.variations.reduce((acc: number, v: any) => acc + getLevelFromScore(getScore(safeProgress.variations[v.id]), thresholds), 0);
    return Math.round(total / technique.variations.length);
  }, [safeProgress, thresholds, technique.variations]);

  return (
    <div className={`bg-slate-800 border-l-4 ${expanded ? 'border-blue-500' : 'border-slate-600'} rounded-r-xl mb-4`}>
      <div onClick={() => setExpanded(!expanded)} className="p-4 cursor-pointer flex justify-between items-center">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase">Leçon {technique.lessonNumber}</span>
          <h4 className="text-white font-semibold">{technique.name}</h4>
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold ${COMPETENCY_COLORS[avgLevel as CompetencyLevel]} text-white`}>{labels[avgLevel] || 'Début'}</div>
      </div>
      {expanded && (
        <div className="p-4 bg-slate-900/30 border-t border-slate-700">
          {technique.reflexDrill && (
            <button onClick={() => onPracticeReflex(technique.id)} className="w-full mb-4 bg-orange-900/20 text-orange-400 p-2 rounded text-xs font-bold border border-orange-900/30 flex items-center justify-center">
              <Zap size={14} className="mr-2"/> Reflex Drill
            </button>
          )}
          {technique.variations.map((v: any) => (
            <VariationRow key={v.id} variation={v} labels={labels} thresholds={thresholds} progress={safeProgress.variations[v.id] || { videoCount: 0, trainingCount: 0, drillCount: 0 }} onUpdate={(u: any) => onUpdate(technique.id, v.id, u)} />
          ))}
          <button onClick={() => onReset(technique.id)} className="text-red-500 text-[10px] mt-2 flex items-center"><Trash2 size={10} className="mr-1"/> Réinitialiser</button>
        </div>
      )}
    </div>
  );
};

// --- VIEWS ---
const DashboardView = ({ progressData, thresholds }: any) => {
  const levels = [0, 0, 0, 0, 0];
  CURRICULUM.forEach(t => t.variations.forEach(v => levels[getLevelFromScore(getScore(getVariationProgress(progressData, t.id, v.id)), thresholds)]++));
  const data = [
    { name: 'Découverte', count: levels[1], color: '#eab308' },
    { name: 'Consolidation', count: levels[2], color: '#f97316' },
    { name: 'Réflexe', count: levels[3], color: '#16a34a' },
    { name: 'Maîtrise', count: levels[4], color: '#2563eb' }
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((d, i) => (
          <div key={i} className="bg-slate-800 p-3 rounded-xl border border-slate-700">
            <div className="text-[10px] uppercase font-bold text-slate-400">{d.name}</div>
            <div className="text-xl font-black" style={{color: d.color}}>{d.count}</div>
          </div>
        ))}
      </div>
      <div className="h-48 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}><Bar dataKey="count">{data.map((e, i) => <Cell key={i} fill={e.color}/>)}</Bar></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [appData, setAppData] = useState<AppData>(() => {
    const saved = localStorage.getItem('bjj_tracker_data');
    if (saved) return JSON.parse(saved);
    return {
      settings: { thresholds: { level1: 0.5, level2: 3, level3: 6, level4: 9 }, level1Name: 'Découverte', level2Name: 'Consolidation', level3Name: 'Réflexe', level4Name: 'Maîtrise' },
      students: [{ id: 'marc-andre', name: 'Marc-André', progress: IMPORTED_MARC_ANDRE.students[0].progress, drillStatus: {}, customConnections: {}, plannedCombos: [] }],
      activeStudentId: 'marc-andre',
      programs: []
    };
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const activeStudent = appData.students.find(s => s.id === appData.activeStudentId) || appData.students[0];

  useEffect(() => { localStorage.setItem('bjj_tracker_data', JSON.stringify(appData)); }, [appData]);

  const handleUpdateProgress = (lId: string, vId: string, updates: any) => {
    setAppData(prev => {
      const newStudents = prev.students.map(s => {
        if (s.id !== prev.activeStudentId) return s;
        const currentLesson = s.progress[lId] || { variations: {} };
        const currentVar = currentLesson.variations[vId] || { videoCount: 0, trainingCount: 0, drillCount: 0 };
        return { ...s, progress: { ...s.progress, [lId]: { ...currentLesson, variations: { ...currentLesson.variations, [vId]: { ...currentVar, ...updates } } } } };
      });
      return { ...prev, students: newStudents };
    });
  };

  const handlePracticeReflex = (tId: string) => {
    const tech = CURRICULUM.find(t => t.id === tId);
    tech?.variations.forEach(v => handleUpdateProgress(tId, v.id, { drillCount: (getVariationProgress(activeStudent.progress, tId, v.id)?.drillCount || 0) + 1 }));
    alert("Reflex Drill enregistré !");
  };

  const labels = { 1: appData.settings.level1Name, 2: appData.settings.level2Name, 3: appData.settings.level3Name, 4: appData.settings.level4Name };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-200 p-4 pb-24">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-black text-white">GRACIE<span className="text-blue-500">TRACKER</span></h1>
          <div className="text-[10px] text-slate-500 uppercase font-bold">{activeStudent.name}</div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <DashboardView progressData={activeStudent.progress} thresholds={appData.settings.thresholds} />
            {CURRICULUM.map(tech => (
              <LessonCard key={tech.id} technique={tech} progress={activeStudent.progress[tech.id]} labels={labels} thresholds={appData.settings.thresholds} onUpdate={handleUpdateProgress} onReset={(id: any) => console.log('reset', id)} onPracticeReflex={handlePracticeReflex} />
            ))}
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-4">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-500'}><LayoutDashboard/></button>
          <button onClick={() => setActiveTab('plan')} className={activeTab === 'plan' ? 'text-blue-400' : 'text-slate-500'}><ListTodo/></button>
          <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-blue-400' : 'text-slate-500'}><Settings/></button>
        </nav>
      </div>
    </ErrorBoundary>
  );
};

export default App;