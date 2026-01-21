# 📘 Gracie Combatives Tracker 2.0 - Blueprint & État du Projet

**Date de dernière mise à jour :** Session actuelle
**Version :** 2.0.1

Ce document sert de référence technique et fonctionnelle. Il résume l'état actuel de l'application pour permettre une reprise rapide du développement.

---

## 1. Vue d'ensemble
Application Web (SPA) construite avec **React** et **Tailwind CSS** pour suivre la progression dans le curriculum de Jiu-Jitsu (Gracie Combatives - 36 techniques). Elle utilise la gamification pour encourager l'apprentissage.

### Stack Technique
- **Framework :** React 18+ (Vite)
- **Langage :** TypeScript (Strict mode, mais `noUnusedLocals` désactivé)
- **Style :** Tailwind CSS (Mode sombre par défaut)
- **Icônes :** Lucide React
- **Persistance :** LocalStorage (`bjj_tracker_data`)

---

## 2. Fonctionnalités Actuelles (Ce qui est en place)

### A. Cœur du Système (Tracking)
- **36 Techniques** classées en 4 Drills (Mount, Guard, Side Mount, Standing).
- **Système de Points :**
    - Vidéo (+0.5), Tapis (+2.0), Drill/Sim (+1.0).
- **Niveaux de Compétence :** Calcul automatique (L1 à L4) basé sur des seuils configurables.

### B. Le Labo (Lab View)
- **Grille Interactive :** Visualisation des 36 techniques.
- **Flux (Flowchart) :** Affichage dynamique des parents (sources) et enfants (destinations) d'une technique.
- **Actions Rapides (Nouveau) :** Boutons directs pour ajouter +1 Vidéo / +1 Tapis ou planifier sans quitter la vue Labo.
- **Mode Édition :** Permet de modifier les connexions entre techniques (Custom Connections).

### C. Planificateur (Plan View)
- Gestion des **Combos** (Séquences planifiées A -> B -> C).
- Liste des variations marquées "À planifier".

### D. Simulations & Dashboard
- Analyse des textes "Reflex Drill" pour lier automatiquement les leçons concernées.
- Calcul de maîtrise des scénarios de combat ("Fight Sims").

---

## 3. État Technique : Ce qui a été Réglé (Fixed) ✅

Lors de la dernière session, les points suivants ont été corrigés et stabilisés :

1.  **Actions Rapides dans le Labo :**
    *   Ajout des boutons `PlayCircle` (Vidéo), `Dumbbell` (Tapis) et `Bookmark` dans les listes `VariationStatusList` du Labo.
    *   La mise à jour de l'historique se fait correctement depuis cette vue.
2.  **Stabilité (ErrorBoundary) :**
    *   Correction du composant `ErrorBoundary` qui causait des erreurs de type TypeScript. Il étend maintenant correctement `React.Component`.
3.  **Nettoyage du Code :**
    *   Suppression des imports inutilisés (ex: `BarChartIcon`, `@google/genai` remplacé/nettoyé).
    *   Mise à jour de `tsconfig.json` pour désactiver les erreurs bloquantes sur les variables inutilisées (`noUnusedLocals: false`).
4.  **Structure des Données :**
    *   Le fichier `types.ts` est robuste et gère les profils étudiants multiples.

---

## 4. Ce qui Fonctionne Bien (Points Forts) 🌟

*   **Gamification :** Le feedback visuel (barres de progression, couleurs de badges L1-L4) est très motivant.
*   **Logique de Parsing :** La fonction `getTargetsFromText` identifie intelligemment les leçons mentionnées dans les descriptions textuelles (ex: "(L12)") pour créer des liens dynamiques.
*   **Interface Sombre :** L'UI est propre, réactive et agréable sur mobile (Tailwind).
*   **Autonomie :** L'application fonctionne entièrement hors ligne (LocalStorage).

---

## 5. Défis & Enjeux (À surveiller / To-Do) ⚠️

*   **Performance du Rendu :** Avec beaucoup d'historique, le fichier JSON dans le LocalStorage peut grossir. À terme, il faudra peut-être paginer ou archiver l'historique ancien.
*   **Mise à jour du Curriculum :** Les données sont dans `data.ts`. Si on renomme une variation, l'historique lié (basé sur l'ID) reste, mais il faut être prudent en modifiant la structure des ID (`m-l1`, etc.).
*   **Expérience Mobile (Labo) :** La vue Labo affiche beaucoup d'informations. Sur très petit écran, la gestion des colonnes Parent/Focus/Enfant est fonctionnelle mais dense.
*   **API Google GenAI :** Le package est installé (`@google/generative-ai`) mais n'est pas encore utilisé activement dans le code actuel. Il est prêt pour de futures fonctionnalités (ex: Coach IA).

---

## 6. Prochaines Étapes pour l'Amélioration

Si vous relancez le projet, voici les axes prioritaires :
1.  **Backup Cloud :** Ajouter une option pour sauvegarder le JSON sur un service simple ou via un copier-coller facile pour éviter la perte de données si le cache du navigateur est vidé.
2.  **Mode "Entraînement Guidé" :** Utiliser les données pour suggérer automatiquement quoi travailler aujourd'hui (basé sur les techniques avec le score le plus bas).
3.  **Statistiques Avancées :** Ajouter des graphiques sur l'évolution dans le temps (ex: "Points gagnés cette semaine").

---

*Utilisez ce fichier pour donner le contexte à la prochaine session de développement.*