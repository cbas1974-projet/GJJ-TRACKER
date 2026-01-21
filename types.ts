

export enum CompetencyLevel {
  None = 0,
  Level1 = 1, // Découverte
  Level2 = 2, // Consolidation (Unlocks Drills)
  Level3 = 3, // Réflexe
  Level4 = 4  // Maîtrise
}

export interface Variation {
  id: string;
  name: string;
}

export interface Technique {
  id: string;
  lessonNumber: number;
  name: string;
  category: 'Mount' | 'Guard' | 'Side Mount' | 'Standing';
  drillNumber: 1 | 2 | 3 | 4;
  variations: Variation[];
  reflexDrill?: string; 
  fightSimSteps?: string[];
  // Hardcoded Flow Chart Connections
  parents?: string[]; // IDs of techniques leading TO this one (Prefixes)
  children?: string[]; // IDs of techniques coming FROM this one (Suffixes)
}

export interface PracticeSession {
  date: number;
  type: 'video' | 'training' | 'drill';
}

export interface VariationProgress {
  id: string;
  videoCount: number;   // +0.5 points
  trainingCount: number; // +2.0 points
  drillCount: number;    // +1.0 points (Reflex or Sim)
  isPlanned?: boolean;   // Planning feature
  notes?: string;        // Notes feature
  lastPracticed?: number; // Timestamp of last physical practice
  history?: PracticeSession[]; // Log of practice sessions
}

export interface LessonProgress {
  techniqueId: string;
  variations: Record<string, VariationProgress>;
}

export interface PointThresholds {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
}

export interface AppSettings {
  level1Name: string;
  level2Name: string;
  level3Name: string;
  level4Name: string;
  thresholds: PointThresholds;
}

export interface ConnectionOverride {
  parents: string[];
  children: string[];
}

export interface DrillStatus {
  id: string;
  history: number[]; // Array of timestamps
}

export interface PlannedCombo {
  id: string;
  sourceId?: string;
  techniqueId: string; // The central technique (Focus)
  destinationId?: string;
  created: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  progress: Record<string, LessonProgress>;
  // Stores history for specific drills (Reflex Drills) and Simulations (Fight Sims)
  // Key format: 'reflex-[techId]' or 'sim-[techId]'
  drillStatus: Record<string, DrillStatus>;
  customConnections: Record<string, ConnectionOverride>;
  plannedCombos?: PlannedCombo[]; // New field for planned sequences
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  techniqueIds: string[];
  createdAt: number;
}

export interface AppData {
  settings: AppSettings;
  students: StudentProfile[];
  activeStudentId: string;
  programs: Program[]; // New field for teaching documents/classes
}

export const COMPETENCY_COLORS: Record<CompetencyLevel, string> = {
  [CompetencyLevel.None]: "bg-slate-700",
  [CompetencyLevel.Level1]: "bg-yellow-500", // Start
  [CompetencyLevel.Level2]: "bg-orange-500", // Intermediate
  [CompetencyLevel.Level3]: "bg-green-600",  // Advanced
  [CompetencyLevel.Level4]: "bg-blue-600"    // Mastery
};