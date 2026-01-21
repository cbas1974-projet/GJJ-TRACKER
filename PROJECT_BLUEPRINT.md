# 📘 Gracie Combatives Tracker 2.0 - Project Blueprint

Ce document sert de référence technique et fonctionnelle pour le développement continu de l'application.

## 1. Vue d'ensemble
Application Web (SPA) construite avec **React** et **Tailwind CSS** pour suivre la progression dans le curriculum de Jiu-Jitsu (Gracie Combatives). Elle utilise la gamification pour encourager l'apprentissage par vidéo, la pratique physique et les réflexes.

### Stack Technique
- **Framework :** React 18+ (Vite)
- **Langage :** TypeScript
- **Style :** Tailwind CSS (Mode sombre par défaut)
- **Icônes :** Lucide React
- **Graphiques :** Recharts
- **Persistance :** LocalStorage (Navigateur)

---

## 2. Logique de Scoring & Gamification

Le cœur de l'application repose sur un système de points calculé dynamiquement pour chaque variation d'une technique.

### Valeur des actions
| Action | Points | Description |
| :--- | :--- | :--- |
| **Vidéo** (`PlayCircle`) | **+ 0.5** | Visionnage du cours théorique. |
| **Tapis** (`Dumbbell`) | **+ 2.0** | Pratique physique réelle de la technique. |
| **Drill/Sim** (`Zap`) | **+ 1.0** | Pratique via un "Reflex Drill" ou une "Simulation de Combat". |

### Niveaux de Compétence
Les niveaux sont déterminés par le score total accumulé sur une variation. Les seuils sont configurables dans `Settings`.

| Niveau | Nom par défaut | Couleur | Seuil Standard |
| :--- | :--- | :--- | :--- |
| **L0** | Non commencé | Gris | 0 |
| **L1** | Découverte | Jaune | > 0 |
| **L2** | Consolidation | Orange | > 2.5 (Débloque les Drills) |
| **L3** | Réflexe | Vert | > 7.0 |
| **L4** | Maîtrise | Bleu | > 12.5 |

---

## 3. Structure des Données (`types.ts`)

### Hiérarchie
1.  **StudentProfile** : Contient toutes les données d'un utilisateur.
2.  **LessonProgress** : Progression liée à une leçon spécifique (ex: "Trap & Roll").
3.  **VariationProgress** : Les compteurs (video, training, drill) pour une sous-technique spécifique (ex: "Standard Variation").

### Fichiers Clés
- **`App.tsx`** : Contient toute la logique d'état, le routage des onglets (Dashboard, Lab, Plan, Settings) et les composants UI.
- **`data.ts`** : Contient le curriculum statique (36 techniques, variations, textes des Reflex Drills).
- **`types.ts`** : Définitions TypeScript des interfaces.
- **`initialData.ts`** : Données de démarrage / backup.

---

## 4. Fonctionnalités Clés

### A. Tableau de Bord (Dashboard)
- Vue d'ensemble des 36 techniques divisées en 4 "Drills" (Mount, Guard, Side Mount, Standing).
- Cartes extensibles pour chaque leçon permettant de noter la pratique.
- Analyse automatique des textes "Reflex Drill" pour identifier les leçons liées.

### B. Le Labo (Lab View)
- Une grille interactive des 36 techniques.
- **Logique de Flux :** Cliquer sur une technique affiche :
    - Ses Parents (D'où vient la position).
    - Ses Enfants (Où aller ensuite).
- **Mode Édition :** Permet de modifier manuellement les connexions entre techniques (Custom Connections).
- **Quick Actions :** Possibilité d'ajouter des points (+1 Vidéo / +1 Tapis) directement depuis les listes de flux sans retourner au dashboard.

### C. Planificateur (Plan View)
- Permet de marquer des techniques (`isPlanned`) ou des séquences complètes (Combos) à travailler.
- Affiche une liste filtrée pour les sessions d'entraînement.

### D. Simulations (Sim View)
- Analyse les scénarios de combat ("Fight Sim Steps") définis dans `data.ts`.
- Calcule le pourcentage de maîtrise d'une simulation basé sur la compétence de l'élève dans chaque étape individuelle du scénario.

---

## 5. Dernière Mise à Jour (État Actuel)

**Ajout : Actions Rapides dans le Labo**
- Le composant `VariationStatusList` dans `App.tsx` a été modifié.
- Il inclut désormais des boutons `PlayCircle` (+Vidéo), `Dumbbell` (+Tapis) et `Bookmark` (Plan) à côté de chaque variation dans les colonnes "Départ", "Focus" et "Fin".
- Cela permet une saisie de données beaucoup plus rapide lors de l'analyse des flux.

## 6. Pour le Futur (Idées)
- **Mode Duel :** Comparer les stats entre deux étudiants.
- **Chronomètre intégré :** Pour les sessions de sparring spécifiques.
- **Export PDF :** Générer une fiche de cours pour l'impression.
