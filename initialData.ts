import { AppData } from './types';

export const DEFAULT_DATA: AppData = {
  "settings": {
    "level1Name": "Découverte",
    "level2Name": "Consolidation",
    "level3Name": "Réflexe",
    "level4Name": "Maîtrise",
    "thresholds": {
      "level1": 0.5,
      "level2": 2.5,
      "level3": 7,
      "level4": 12.5
    }
  },
  "activeStudentId": "default",
  "students": [
    {
      "id": "default",
      "name": "Étudiant",
      "progress": {},
      "drillStatus": {},
      "customConnections": {},
      "plannedCombos": []
    }
  ]
};