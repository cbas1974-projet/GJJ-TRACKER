import { Technique } from './types';

export const CURRICULUM: Technique[] = [
  // --- DRILL 1: MOUNT ---
  { 
    id: 'm-l1', 
    lessonNumber: 1, 
    name: 'Trap & Roll Escape', 
    category: 'Mount', 
    drillNumber: 1,
    variations: [
      { id: 'v1', name: 'Standard Variation' },
      { id: 'v2', name: 'Punch Block Variation' },
      { id: 'v3', name: 'Headlock Variation' },
      { id: 'v4', name: 'Open Guard Pass' }
    ],
    reflexDrill: "Practice all variations of the Trap and Roll Escape – Mount (L1)",
    fightSimSteps: [
      "Trap and Roll Escape – Mount – Headlock Variation (L1)",
      "Positional Control – Mount – Low Swim (L3)",
      "Americana Armlock – Mount – Neck-hug Variation (L2)"
    ],
    parents: [], 
    children: ['g-l36', 'm-l3'] 
  },
  { 
    id: 'm-l2', 
    lessonNumber: 2, 
    name: 'Americana Armlock', 
    category: 'Mount', 
    drillNumber: 1,
    variations: [
      { id: 'v1', name: 'Basic Application' },
      { id: 'v2', name: 'Standard Variation' },
      { id: 'v3', name: 'Neck-Hug Variation' }
    ],
    reflexDrill: "Practice all variations of the Trap and Roll Escape – Mount (L1) In combination with all variations of the Americana Armlock – Mount (L2)",
    fightSimSteps: [
      "Trap and Roll Escape – Mount – Punch Block Variation (L1)",
      "Positional Control – Mount – High Swim (L3)",
      "Take the Back – Mount – Remount Technique (L4)",
      "Americana Armlock – Mount – Standard Variation (L2)"
    ],
    parents: ['m-l3'], 
    children: [] 
  },
  { 
    id: 'm-l3', 
    lessonNumber: 3, 
    name: 'Positional Control', 
    category: 'Mount', 
    drillNumber: 1,
    variations: [
      { id: 'v1', name: 'Hips and Hands' },
      { id: 'v2', name: 'Anchor and Base' },
      { id: 'v3', name: 'Low Swim' },
      { id: 'v4', name: 'High Swim' }
    ],
    reflexDrill: "Practice all variations of Positional Control – Mount (L3) In combination with all variations of the Americana Armlock – Mount (L2)",
    fightSimSteps: [
      "Trap and Roll Escape – Mount – Headlock Variation (L1)",
      "Positional Control – Mount – Low Swim (L3)",
      "Americana Armlock – Mount – Neck-hug Variation (L2)"
    ],
    parents: [
        'st-l6', 'st-l14', 'st-l17', 'st-l29',
        'sm-l13', 
        'g-l11', 'g-l20', 'g-l28', 
        'sm-l18', 'sm-l22', 'st-l26', 'st-l32',
        'm-l1' 
    ], 
    children: ['m-l2', 'm-l9', 'm-l4', 'm-l16', 'm-l35', 'm-l12']
  },
  { 
    id: 'm-l4', 
    lessonNumber: 4, 
    name: 'Take the Back', 
    category: 'Mount', 
    drillNumber: 1,
    variations: [
      { id: 'v1', name: 'Take the Back' },
      { id: 'v2', name: 'Remount Technique' }
    ],
    reflexDrill: "Practice all variations of Positional Control – Mount (L3) In combination with all variations of Take the Back – Mount (L4)",
    fightSimSteps: [
      "Trap and Roll Escape – Mount – Punch Block Variation (L1)",
      "Positional Control – Mount – High Swim (L3)",
      "Take the Back – Mount – Remount Technique (L4)",
      "Americana Armlock – Mount – Standard Variation (L2)"
    ],
    parents: ['m-l3'],
    children: ['m-l5'] 
  },
  { 
    id: 'm-l5', 
    lessonNumber: 5, 
    name: 'Rear Naked Choke', 
    category: 'Mount', 
    drillNumber: 1,
    variations: [
      { id: 'v1', name: 'Basic Application' },
      { id: 'v2', name: 'Strong Side Variation' },
      { id: 'v3', name: 'Weak Side Variation' }
    ],
    reflexDrill: "Practice all variations of Take the Back – Mount (L4) In combination with all variations of the Rear Naked Choke – Back Mount (L5)",
    fightSimSteps: [
      "Trap and Roll Escape – Mount – Standard Variation (L1)",
      "Positional Control – Mount – High Swim (L3)",
      "Take the Back – Mount (L4)",
      "Rear Naked Choke – Back Mount – Weak Side Variation (L5)"
    ],
    parents: ['m-l4', 'm-l16', 'm-l35', 'st-l29', 'g-l31'],
    children: [] 
  },
  { 
    id: 'm-l6',
    lessonNumber: 6,
    name: 'Leg Hook Takedown',
    category: 'Standing',
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Clinch Control' },
      { id: 'v2', name: 'Leg Hook Takedown' }
    ],
    reflexDrill: "Practice the Leg Hook Takedown – Standing (L6) In combination with all variations of Positional Control – Mount (L3)",
    fightSimSteps: [
      "Leg Hook Takedown – Standing (L6)",
      "Take the Back – Mount (L4)",
      "Rear Naked Choke – Back Mount – Strong Side Variation (L5)",
      "Remount Technique – Back Mount (L4)",
      "Americana Armlock – Mount – Neck-hug Variation (L2)"
    ],
    parents: ['st-l7', 'st-l15'], 
    children: ['m-l3'] 
  },
  { 
    id: 'm-l7',
    lessonNumber: 7,
    name: 'Clinch (Aggressive)',
    category: 'Standing',
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Keep the Distance' },
      { id: 'v2', name: 'Close the Distance' }
    ],
    reflexDrill: "Practice the Clinch (Aggressive Opponent) – Standing (L7) In combination with the Leg Hook Takedown – Standing (L6)",
    fightSimSteps: [
      "Clinch – Standing – Aggressive Opponent (L7)",
      "Leg Hook Takedown – Standing (L6)",
      "Positional Control – Mount – Low Swim (L3)",
      "Americana Armlock – Mount – Standard Variation (L2)",
      "Take the Back – Mount (L4)",
      "Rear Naked Choke – Back Mount – Weak Side Variation (L5)"
    ],
    parents: [], 
    children: ['m-l6', 'st-l14', 'st-l17', 'st-l29', 'st-l21', 'st-l23', 'st-l26', 'st-l32']
  },
  { 
    id: 'm-l8',
    lessonNumber: 8,
    name: 'Punch Block Series (1-4)',
    category: 'Guard',
    drillNumber: 2,
    variations: [
      { id: 'v1', name: 'Stage 1' },
      { id: 'v2', name: 'Stage 2' },
      { id: 'v3', name: 'Stage 3' },
      { id: 'v4', name: 'Stage 4' }
    ],
    reflexDrill: "Practice all variations of the Americana Armlock – Mount (L2) In combination with all variations of the Punch Block Series – Guard (L8)",
    fightSimSteps: [
      "Clinch – Standing – Aggressive Opponent (L7)",
      "Leg Hook Takedown – Standing (L6)",
      "Take the Back – Mount (L4)",
      "Rear Naked Choke – Back Mount – Strong Side Variation (L5)",
      "Punch Block Series – Guard – All Stages (L8)"
    ],
    parents: ['st-l21', 'st-l23', 'sm-l24', 'm-l12', 'sm-l33'],
    children: ['g-l19', 'm-l10', 'g-l25', 'g-l11', 'g-l20', 'g-l28', 'g-l31']
  },
  { 
    id: 'm-l9', 
    lessonNumber: 9, 
    name: 'Armbar (Straight Armlock)', 
    category: 'Mount', 
    drillNumber: 1,
    variations: [
      { id: 'v1', name: 'Final Control' },
      { id: 'v2', name: 'Standard Variation' },
      { id: 'v3', name: 'Side Variation' }
    ],
    reflexDrill: "Practice all variations of the Trap and Roll Escape – Mount (L1) In combination with all variations of the Straight Armlock – Mount (L9)",
    fightSimSteps: [
      "Clinch – Standing – Aggressive Opponent (L7)",
      "Leg Hook Takedown – Standing (L6)",
      "Positional Control – Mount – High Swim (L3)",
      "Take the Back – Mount – Remount Technique (L4)",
      "Straight Armlock – Mount – Side Variation (L9)"
    ],
    parents: ['m-l3'],
    children: []
  },
  { 
    id: 'm-l10',
    lessonNumber: 10,
    name: 'Triangle Choke',
    category: 'Guard',
    drillNumber: 2,
    variations: [
      { id: 'v1', name: 'Triangle Finish' },
      { id: 'v2', name: 'Stage 1.5 Variation' },
      { id: 'v3', name: 'Giant Killer Variation' }
    ],
    reflexDrill: "Practice all variations of the Punch Block Series (Stages 1-4) – Guard (L8) In combination with all variations of the Triangle Choke – Guard (L10)",
    fightSimSteps: [
      "Trap and Roll Escape – Mount – Punch Block Variation (L1)",
      "Positional Control – Mount – Anchor and Base (L3)",
      "Straight Armlock – Mount – Standard Variation (L9)",
      "Punch Block Series – Guard – Stages 1-4-1 (L8)",
      "Triangle Choke – Guard – Stage 1.5 Variation (L10)"
    ],
    parents: ['m-l8', 'g-l27', 'g-l19'], 
    children: []
  },
  { 
    id: 'g-l11', 
    lessonNumber: 11, 
    name: 'Elevator Sweep', 
    category: 'Guard', 
    drillNumber: 2,
    variations: [
      { id: 'v1', name: 'Standard Variation' },
      { id: 'v2', name: 'Headlock Variation' }
    ],
    reflexDrill: "Practice all variations of the Elevator Sweep – Guard (L11) In combination with all variations of the Straight Armlock – Mount (L9)",
    fightSimSteps: [
      "Clinch – Standing – Aggressive Opponent (L7)",
      "Leg Hook Takedown – Standing (L6)",
      "Punch Block Series – Guard – Stages 1-3-4-1 (L8)",
      "Elevator Sweep – Guard – Headlock Variation (L11)",
      "Straight Armlock – Mount – Side Variation (L9)"
    ],
    parents: ['m-l8', 'g-l27'],
    children: ['m-l3'] 
  },
  { 
    id: 'm-l12', 
    lessonNumber: 12, 
    name: 'Elbow Escape', 
    category: 'Mount', 
    drillNumber: 1,
    variations: [
      { id: 'v1', name: 'Shrimp Drill' },
      { id: 'v2', name: 'Standard Elbow Escape' },
      { id: 'v3', name: 'Hook Removal' },
      { id: 'v4', name: 'Fish Hook' },
      { id: 'v5', name: 'Heel Drag' }
    ],
    reflexDrill: "Practice all variations of the Elbow Escape – Mount (L12) In combination with all variations of the Triangle Choke – Guard (L10)",
    fightSimSteps: [
      "Elbow Escape – Mount – Hook Removal (L12)",
      "Punch Block Series – Guard – Stages 1-2-1 (L8)",
      "Elevator Sweep – Guard – Standard Variation (L11)",
      "Take the Back – Mount (L4)",
      "Rear Naked Choke – Back Mount – Weak Side Variation (L5)"
    ],
    parents: ['m-l3'], 
    children: ['m-l8', 'g-l27'] 
  },
  { 
    id: 'sm-l13', 
    lessonNumber: 13, 
    name: 'Positional Control', 
    category: 'Side Mount', 
    drillNumber: 3,
    variations: [
      { id: 'v1', name: 'Roll Prevention' },
      { id: 'v2', name: 'Guard Prevention' },
      { id: 'v3', name: 'Mount Transition' }
    ],
    reflexDrill: "Practice all variations of Positional Control – Side Mount (L13) In combination with all variations of Positional Control – Mount (L3)",
    fightSimSteps: [
      "Positional Control – Side Mount – Roll Prevention (L13)",
      "Americana Armlock – Mount – Neck-hug Variation (L2)",
      "Punch Block Series – Guard – Stages 1-2-4-1 (L8)",
      "Elevator Sweep – Guard – Headlock Variation (L11)",
      "Straight Armlock – Mount – Standard Variation (L9)"
    ],
    parents: ['g-l36', 'st-l17', 'st-l32'], 
    children: ['m-l3', 'sm-l18', 'sm-l22', 'sm-l24', 'sm-l33'] 
  },
  { 
    id: 'st-l14', 
    lessonNumber: 14, 
    name: 'Body Fold Takedown', 
    category: 'Standing', 
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Body Fold Takedown' }
    ],
    reflexDrill: "Practice the Body Fold Takedown – Standing (L14) In combination with Take the Back – Mount (L4) And all variations of the Rear Naked Choke – Back Mount (L5)",
    fightSimSteps: [
      "Clinch – Standing – Aggressive Opponent (L7)",
      "Body Fold Takedown – Standing (L14)",
      "Positional Control – Side Mount – Guard Prevention (L13)",
      "Take the Back – Mount (L4)",
      "Punch Block Series – Guard – Stages 1-2-1 (L8)",
      "Triangle Choke – Guard – Giant Killer Variation (L10)"
    ],
    parents: ['st-l7', 'st-l15'],
    children: ['m-l3']
  },
  { 
    id: 'st-l15', 
    lessonNumber: 15, 
    name: 'Clinch (Conservative)', 
    category: 'Standing', 
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Surprise Entry' }
    ],
    reflexDrill: "Practice the Clinch (Conservative Opponent) – Standing (L15) In combination with the Body Fold Takedown – Standing (L14)",
    fightSimSteps: [
      "Clinch – Standing – Conservative Opponent (L15)",
      "Leg Hook Takedown – Standing (L6)",
      "Take the Back – Mount – Remount Technique (L4)",
      "Straight Armlock – Mount – Side Variation (L9)",
      "Punch Block Series – Guard – Stages 1-4-1 (L8)",
      "Triangle Choke – Guard – Stage 1.5 Variation (L10)"
    ],
    parents: [],
    children: ['st-l14', 'st-l17', 'st-l26']
  },
  { 
    id: 'm-l16', 
    lessonNumber: 16, 
    name: 'Headlock Counters', 
    category: 'Mount', 
    drillNumber: 1,
    variations: [
      { id: 'v1', name: 'Basic Positioning' },
      { id: 'v2', name: 'Prevent the Getup' },
      { id: 'v3', name: 'Back Mount Finish' },
      { id: 'v4', name: 'Armlock Finish' }
    ],
    reflexDrill: "Practice all variations of the Elevator Sweep – Guard (L11) In combination with all variations of the Headlock Counters – Mount (L16)",
    fightSimSteps: [
      "Elbow Escape – Mount – Fish Hook (L12)",
      "Elevator Sweep – Guard – Standard Variation (L11)",
      "Headlock Counters – Mount – Armlock Finish (L16)",
      "Triangle Choke – Guard – Giant Killer Variation (L10)"
    ],
    parents: ['m-l3', 'st-l26', 'sm-l18', 'sm-l22'], 
    children: ['m-l5', 'm-l9'] 
  },
  { 
    id: 'st-l17', 
    lessonNumber: 17, 
    name: 'Double Leg Takedown', 
    category: 'Standing', 
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Basic Application' },
      { id: 'v2', name: 'Aggressive Opponent' },
      { id: 'v3', name: 'Conservative Opponent' }
    ],
    reflexDrill: "Practice all variations of the Double Leg Takedown – Standing (L17) In combination with all variations of Positional Control – Side Mount (L13)",
    fightSimSteps: [
      "Double Leg Takedown – Standing – Conservative Opponent (L17)",
      "Positional Control – Side Mount – Roll Prevention (L13)",
      "Headlock Counters – Mount – Back Mount Finish (L16)",
      "Rear Naked Choke – Back Mount – Weak Side Variation (L5)",
      "Elevator Sweep – Guard – Headlock Variation (L11)",
      "Straight Armlock – Mount – Standard Variation (L9)"
    ],
    parents: ['st-l7', 'st-l15'],
    children: ['m-l3', 'sm-l13'] 
  },
  { 
    id: 'sm-l18', 
    lessonNumber: 18, 
    name: 'Headlock Escape 1', 
    category: 'Side Mount', 
    drillNumber: 3,
    variations: [
      { id: 'v1', name: 'Standard Frame Escape' },
      { id: 'v2', name: 'Scissor Failure' },
      { id: 'v3', name: 'Super Lock Variation' }
    ],
    reflexDrill: "Practice all variations of Headlock Escape 1 – Side Mount (L18) In combination with all variations of the Headlock Counters – Mount (L16)",
    fightSimSteps: [
      "Double Leg Takedown – Standing – Aggressive Opponent (L17)",
      "Positional Control – Side Mount – Guard Prevention (L13)",
      "Positional Control – Mount – High Swim (L3)",
      "Straight Armlock – Mount – Side Variation (L9)",
      "Punch Block Series – Guard – Stages 1-3-4 (L8)",
      "Headlock Escape 1 – Side Mount – Super Lock Variation (L18)",
      "Headlock Counters – Mount – Armlock Finish (L16)"
    ],
    parents: ['sm-l13'], 
    children: ['m-l16', 'm-l3'] 
  },
  { 
    id: 'g-l19', 
    lessonNumber: 19, 
    name: 'Armbar (Straight Armlock)', 
    category: 'Guard', 
    drillNumber: 2,
    variations: [
      { id: 'v1', name: 'Low Variation' },
      { id: 'v2', name: 'High Variation' },
      { id: 'v3', name: 'Triangle Transition' }
    ],
    reflexDrill: "Practice all variations of the Elbow Escape – Mount (L12) In combination with all variations of the Straight Armlock – Guard (L19)",
    fightSimSteps: [
      "Clinch – Standing – Conservative Opponent (L15)",
      "Body Fold Takedown – Standing (L14)",
      "Positional Control – Mount – Anchor and Base (L3)",
      "Take the Back – Mount (L4)",
      "Punch Block Series – Guard – Stages 1-2-1 (L8)",
      "Straight Armlock – Guard – High Variation (L19)"
    ],
    parents: ['m-l8', 'g-l27'],
    children: ['m-l10'] 
  },
  { 
    id: 'g-l20', 
    lessonNumber: 20, 
    name: 'Double Ankle Sweep', 
    category: 'Guard', 
    drillNumber: 2,
    variations: [
      { id: 'v1', name: 'Knee Thrust Variation' },
      { id: 'v2', name: 'Stand up in Base' },
      { id: 'v3', name: 'Kick Variation' }
    ],
    reflexDrill: "Practice all variations of the Double Leg Takedown – Standing (L17) In combination with all variations of the Double Ankle Sweep – Guard (L20)",
    fightSimSteps: [
      "Elbow Escape – Mount – Heel Drag (L12)",
      "Double Ankle Sweep – Guard – Knee Thrust Variation (L20)",
      "Straight Armlock – Mount – Standard Variation (L9)",
      "Punch Block Series – Guard – Stages 1-2-4-1 (L8)",
      "Straight Armlock – Guard – Low Variation (L19)",
      "Headlock Escape 1 – Side Mount – Standard Frame Escape (L18)"
    ],
    parents: ['m-l8', 'g-l27'],
    children: ['m-l3']
  },
  { 
    id: 'st-l21', 
    lessonNumber: 21, 
    name: 'Pull Guard', 
    category: 'Standing', 
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Pull Guard' }
    ],
    reflexDrill: "Practice Pull Guard – Standing (L21) In combination with all variations of the Straight Armlock – Guard (L19)",
    fightSimSteps: [
      "Clinch – Standing – Aggressive Opponent (L7)",
      "Pull Guard – Standing (L21)",
      "Double Ankle Sweep – Guard – Kick Variation (L20)",
      "Positional Control – Side Mount – Guard Prevention (L13)",
      "Headlock Escape 1 – Side Mount – Scissor Failure Variation (L18)",
      "Straight Armlock – Mount – Side Variation (L9)"
    ],
    parents: ['st-l7', 'st-l15'],
    children: ['m-l8', 'g-l27'] 
  },
  { 
    id: 'sm-l22', 
    lessonNumber: 22, 
    name: 'Headlock Escape 2', 
    category: 'Side Mount', 
    drillNumber: 3,
    variations: [
      { id: 'v1', name: 'Standard Leg Hook' },
      { id: 'v2', name: 'Super Base Variation' },
      { id: 'v3', name: 'Punch Block Variation' }
    ],
    reflexDrill: "Practice all variations of Headlock Escape 2 – Side Mount (L22) In combination with all variations of Headlock Escape 1 – Side Mount (L18)",
    fightSimSteps: [
      "Clinch – Standing – Conservative Opponent (L15)",
      "Leg Hook Takedown – Standing (L6)",
      "Punch Block Series – Guard – Stages 1-4-1 (L8)",
      "Straight Armlock – Guard – Triangle Transition (L19)",
      "Triangle Choke – Guard (L10)",
      "Headlock Escape 2 – Side Mount – Standard Leg Hook Escape (L22)",
      "Headlock Counters – Mount – Armlock Finish (L16)"
    ],
    parents: ['sm-l13'],
    children: ['m-l16', 'm-l3']
  },
  { 
    id: 'st-l23', 
    lessonNumber: 23, 
    name: 'Guillotine Choke', 
    category: 'Standing', 
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Basic Application' },
      { id: 'v2', name: 'Standing Variation' },
      { id: 'v3', name: 'Guard Pull Variation' }
    ],
    reflexDrill: "Practice all variations of the Guillotine Choke – Standing (L23) In combination with all variations of the Double Ankle Sweep – Guard (L20)",
    fightSimSteps: [
      "Guillotine Choke – Standing – Standing Variation (L23)",
      "Guillotine Choke – Standing – Guard Pull Variation (L23)",
      "Headlock Escape 2 – Side Mount – Punch Block Variation (L22)",
      "Take the Back – Mount (L4)",
      "Rear Naked Choke – Back Mount – Strong Side Variation (L5)",
      "Elevator Sweep – Guard – Standard Variation (L11)",
      "Americana Armlock – Mount – Standard Variation (L2)"
    ],
    parents: ['st-l7', 'st-l15'],
    children: ['m-l8', 'g-l27'] 
  },
  { 
    id: 'sm-l24', 
    lessonNumber: 24, 
    name: 'Shrimp Escape', 
    category: 'Side Mount', 
    drillNumber: 3,
    variations: [
      { id: 'v1', name: 'Block and Shoot' },
      { id: 'v2', name: 'Shrimp and Shoot' },
      { id: 'v3', name: 'Punch Block Variation' }
    ],
    reflexDrill: "Practice all variations of the Shrimp Escape – Side Mount (L24) In combination with all variations of Headlock Escape 2 – Side Mount (L22)",
    fightSimSteps: [
      "Double Leg Takedown – Standing – Conservative Opponent (L17)",
      "Positional Control – Side Mount – Roll Prevention (L13)",
      "Straight Armlock – Mount – Standard Variation (L9)",
      "Punch Block Series – Guard – Stages 1-2-4 (L8)",
      "Shrimp Escape – Side Mount – Block and Shoot Variation (L24)",
      "Triangle Choke – Guard – Stage 1.5 Variation (L10)"
    ],
    parents: ['sm-l13'], 
    children: ['m-l8', 'g-l27'] 
  },
  { 
    id: 'g-l25', 
    lessonNumber: 25, 
    name: 'Kimura Armlock', 
    category: 'Guard', 
    drillNumber: 2,
    variations: [
      { id: 'v1', name: 'Basic Application' },
      { id: 'v2', name: 'Rider Variation' },
      { id: 'v3', name: 'Forced Variation' }
    ],
    reflexDrill: "Practice all variations of the Guillotine Choke – Standing (L23) In combination with all variations of the Kimura Armlock – Guard (L25)",
    fightSimSteps: [
      "Trap and Roll Escape – Mount – Headlock Variation (L1)",
      "Positional Control – Mount – Low Swim (L3)",
      "Headlock Counters – Mount – Back Mount Finish (L16)",
      "Rear Naked Choke – Back Mount – Weak Side Variation (L5)",
      "Punch Block Series – Guard – Stages 1-4 (L8)",
      "Shrimp Escape – Side Mount – Shrimp and Shoot Variation (L24)",
      "Kimura Armlock – Guard – Forced Variation (L25)"
    ],
    parents: ['m-l8', 'g-l27'],
    children: []
  },
  { 
    id: 'st-l26', 
    lessonNumber: 26, 
    name: 'Standing Headlock Defense', 
    category: 'Standing', 
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Standing Headlock Defense' }
    ],
    reflexDrill: "Practice the Standing Headlock Defense – Standing (L26) In combination with all variations of the Headlock Counters – Mount (L16)",
    fightSimSteps: [
      "Clinch – Standing – Conservative Opponent (L15)",
      "Standing Headlock Defense – Standing (L26)",
      "Headlock Counters – Mount – Armlock Finish (L16)",
      "Kimura Armlock – Guard – Rider Variation (L25)",
      "Double Ankle Sweep – Guard – Knee Thrust Variation (L20)",
      "Straight Armlock – Mount – Standard Variation (L9)"
    ],
    parents: [], 
    children: ['m-l3', 'm-l16'] 
  },
  { 
    id: 'g-l27', 
    lessonNumber: 27, 
    name: 'Punch Block (Stage 5)', 
    category: 'Guard', 
    drillNumber: 2,
    variations: [
      { id: 'v1', name: 'Stage 5' },
      { id: 'v2', name: 'Rollover Technique' }
    ],
    reflexDrill: "Practice all variations of the Punch Block Series (Stage 5) – Guard (L27) In combination with all variations of the Shrimp Escape – Side Mount (L24)",
    fightSimSteps: [
      "Guillotine Choke – Standing – Guard Pull Variation (L23)",
      "Punch Block Series – Guard – Stages 1-4-5-1-5 (L27)",
      "Double Leg Takedown – Standing – Aggressive Opponent (L17)",
      "Headlock Escape 2 – Side Mount – Super Base Variation (L22)",
      "Take the Back – Mount (L4)",
      "Rear Naked Choke – Back Mount – Strong Side Variation (L5)",
      "Triangle Choke – Guard – Giant Killer Variation (L10)"
    ],
    parents: ['st-l21', 'st-l23', 'sm-l24', 'm-l12', 'sm-l33'],
    children: ['g-l19', 'm-l10', 'g-l25', 'g-l11', 'g-l20', 'g-l28', 'g-l31']
  },
  { 
    id: 'g-l28', 
    lessonNumber: 28, 
    name: 'Hook Sweep', 
    category: 'Guard', 
    drillNumber: 2,
    variations: [
      { id: 'v1', name: 'Hook Sweep' },
      { id: 'v2', name: 'Sweep Follow-up' }
    ],
    reflexDrill: "Practice the Hook Sweep – Guard (L28) In combination with all variations of the Kimura Armlock – Guard (L25) And the Elbow Escape – Mount (L12)",
    fightSimSteps: [
      "Clinch – Standing – Aggressive Opponent (L7)",
      "Pull Guard – Standing (L21)",
      "Punch Block Series – Guard – Rollover Technique (L27)",
      "Hook Sweep – Guard (L28)",
      "Positional Control – Side Mount – Guard Prevention (L13)",
      "Positional Control – Mount – High Swim (L3)",
      "Straight Armlock – Guard – High Variation (L19)"
    ],
    parents: ['m-l8', 'g-l27'],
    children: ['m-l3']
  },
  { 
    id: 'st-l29', 
    lessonNumber: 29, 
    name: 'Rear Takedown', 
    category: 'Standing', 
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Achieve Rear Clinch' },
      { id: 'v2', name: 'Rear Takedown' }
    ],
    reflexDrill: "Practice the Rear Takedown – Standing (L29) In combination with all variations of Take the Back – Mount (L4) And the Rear Naked Choke – Back Mount (L5)",
    fightSimSteps: [
      "Clinch – Standing – Aggressive Opponent (L7)",
      "Rear Takedown – Standing (L29)",
      "Headlock Counters – Mount – Armlock Finish (L16)",
      "Punch Block Series – Guard – Stages 1-3-4 (L8)",
      "Shrimp Escape – Side Mount – Punch Block Variation (L24)",
      "Elevator Sweep – Guard – Standard Variation (L11)",
      "Americana Armlock – Mount – Neck-hug Variation (L2)"
    ],
    parents: ['st-l7', 'st-l15', 'st-l30'], 
    children: ['m-l3', 'm-l5'] 
  },
  { 
    id: 'st-l30', 
    lessonNumber: 30, 
    name: 'Haymaker Punch Defense', 
    category: 'Standing', 
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Haymaker Punch Defense' }
    ],
    reflexDrill: "Practice the Haymaker Punch Defense – Standing (L30) In combination with the Rear Takedown – Standing (L29)",
    fightSimSteps: [
      "Haymaker Punch Defense – Standing (L30)",
      "Rear Takedown – Standing (L29)",
      "Headlock Escape 1 – Side Mount – Super Lock Variation (L18)",
      "Headlock Counters – Mount – Back Mount Finish (L16)",
      "Rear Naked Choke – Back Mount – Weak Side Variation (L5)",
      "Triangle Choke – Guard – Stage 1.5 Variation (L10)"
    ],
    parents: [],
    children: ['st-l29'] 
  },
  { 
    id: 'g-l31', 
    lessonNumber: 31, 
    name: 'Take the Back', 
    category: 'Guard', 
    drillNumber: 2,
    variations: [
      { id: 'v1', name: 'Head and Arm Control' },
      { id: 'v2', name: 'Achieve the Angle' },
      { id: 'v3', name: 'Final Getup' }
    ],
    reflexDrill: "Practice all variations of the Punch Block Series (Stage 5) – Guard (L27) In combination with Take the Back – Guard (L31)",
    fightSimSteps: [
      "Elbow Escape – Mount – Fish Hook (L12)",
      "Take the Back – Guard (L31)",
      "Rear Naked Choke – Back Mount (L5)",
      "Double Ankle Sweep – Guard – Kick Variation (L20)",
      "Positional Control – Side Mount – Roll Prevention (L13)",
      "Take the Back – Mount – Remount Technique (L4)",
      "Straight Armlock – Mount – Side Variation (L9)"
    ],
    parents: ['m-l8', 'g-l27'],
    children: ['m-l5'] 
  },
  { 
    id: 'st-l32', 
    lessonNumber: 32, 
    name: 'Guillotine Defense', 
    category: 'Standing', 
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Guillotine Defense' }
    ],
    reflexDrill: "Practice the Guillotine Defense – Standing (L32) In combination with the Standing Headlock Defense – Standing (L26)",
    fightSimSteps: [
      "Clinch – Standing – Aggressive Opponent (L7)",
      "Guillotine Defense – Standing (L32)",
      "Headlock Escape 1 – Side Mount – Standard Frame Escape (L18)",
      "Shrimp Escape – Side Mount – Shrimp and Shoot Variation (L24)",
      "Kimura Armlock – Guard – Forced Variation (L25)"
    ],
    parents: [],
    children: ['sm-l13', 'm-l3'] 
  },
  { 
    id: 'sm-l33', 
    lessonNumber: 33, 
    name: 'Elbow Escape', 
    category: 'Side Mount', 
    drillNumber: 3,
    variations: [
      { id: 'v1', name: 'Knee Drive Variation' },
      { id: 'v2', name: 'High Step Variation' }
    ],
    reflexDrill: "Practice all variations of the Elbow Escape – Side Mount (L33) In combination with Take the Back – Guard (L31)",
    fightSimSteps: [
      "Clinch – Standing – Conservative Opponent (L15)",
      "Body Fold Takedown – Standing (L14)",
      "Punch Block Series – Guard – Stages 1-3-5 (L27)",
      "Punch Block Series – Guard - Rollover Technique (L27)",
      "Elbow Escape – Side Mount – Knee Drive Variation (L33)",
      "Straight Armlock – Guard – Triangle Transition (L19)",
      "Triangle Choke – Guard (L10)"
    ],
    parents: ['sm-l13'], 
    children: ['m-l8', 'g-l27'] 
  },
  { 
    id: 'st-l34', 
    lessonNumber: 34, 
    name: 'Standing Armbar', 
    category: 'Standing', 
    drillNumber: 4,
    variations: [
      { id: 'v1', name: 'Basic Application' },
      { id: 'v2', name: 'Walking Application' }
    ],
    reflexDrill: "Practice the Standing Armlock – Standing (L34) In combination with the Guillotine Defense – Standing (L32)",
    fightSimSteps: [
      "Standing Armlock – Standing (L34)",
      "Standing Headlock Defense – Standing (L26)",
      "Headlock Counters – Mount – Back Mount Finish (L16)",
      "Rear Naked Choke – Back Mount – Strong Side Variation (L5)",
      "Elevator Sweep – Guard – Headlock Variation (L11)",
      "Take the Back – Mount (L4)",
      "Rear Naked Choke – Back Mount – Weak Side Variation (L5)"
    ],
    parents: [],
    children: [] 
  },
  { 
    id: 'm-l35', 
    lessonNumber: 35, 
    name: 'Twisting Arm Control', 
    category: 'Mount', 
    drillNumber: 1,
    variations: [
      { id: 'v1', name: 'Basic Control' },
      { id: 'v2', name: 'Back Mount Finish' },
      { id: 'v3', name: 'Armlock Finish' }
    ],
    reflexDrill: "Practice all variations of the Elbow Escape – Side Mount (L33) In combination with all variations of the Hook Sweep – Guard (L28) And all variations of the Twisting Arm Control – Mount (L35)",
    fightSimSteps: [
      "Haymaker Punch Defense – Standing (L30)",
      "Rear Takedown – Standing (L29)",
      "Positional Control – Mount – Anchor and Base (L3)",
      "Twisting Arm Control – Mount – Armlock Finish (L35)",
      "Punch Block Series – Guard – Stages 1-4 (L8)",
      "Elbow Escape – Side Mount – High Step Variation (L33)",
      "Take the Back – Guard (L31)",
      "Rear Naked Choke – Back Mount – Strong Side Variation (L5)"
    ],
    parents: ['m-l3'],
    children: ['m-l9', 'm-l5'] 
  },
  { 
    id: 'g-l36', 
    lessonNumber: 36, 
    name: 'Double Underhook Pass', 
    category: 'Guard', 
    drillNumber: 2,
    variations: [
      { id: 'v1', name: 'Modified Side Mount' },
      { id: 'v2', name: 'Double Underhook Pass' },
      { id: 'v3', name: 'Posture and Pass' }
    ],
    reflexDrill: "Practice all variations of the Trap and Roll Escape – Mount (L1) In combination with the Double Underhook Guard Pass – Guard (L36) And all variations of the Twisting Arm Control – Mount (L35)",
    fightSimSteps: [
      "Double Leg Takedown – Standing – Aggressive Opponent (L17)",
      "Double Underhook Guard Pass – Guard (L36)",
      "Positional Control – Side Mount (L13)",
      "Hook Sweep – Guard (L28)",
      "Positional Control – Side Mount (L13)",
      "Kimura Armlock – Guard – Rider Variation (L25)",
      "Triangle Choke – Guard – Giant Killer Variation (L10)"
    ],
    parents: ['m-l1'], 
    children: ['sm-l13'] 
  },
];