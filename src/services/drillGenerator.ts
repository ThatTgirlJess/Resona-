/**
 * Personalized Daily Drill Generator
 * Analyzes historical session metrics (resonance control, pitch stability, vocal weight)
 * and generates 3-5 tailored exercises targeting specific user weaknesses.
 */

import { VocalTrack, Drill, SessionRecord } from '../types/voice';

export interface PersonalizedRoutine {
  id: string;
  generatedAt: string;
  track: VocalTrack;
  diagnosedNeeds: {
    primaryWeakness: 'pitch-stability' | 'resonance-elevation' | 'resonance-darkening' | 'vocal-weight' | 'inflection-range';
    description: string;
    recentStabilityAvg: number;
    recentResonanceAvg: number;
    recommendedFocus: string;
  };
  drills: TailoredDrill[];
  completedCount: number;
  totalXpReward: number;
}

export interface TailoredDrill extends Drill {
  tailoredReason: string;
  specificGoal: string;
  isCompleted?: boolean;
  bestScore?: number;
}

// Master Exercise Library
const MASTER_DRILLS: Drill[] = [
  // FEMINIZATION DRILLS
  {
    id: 'fem-whisper-siren',
    title: 'Silent Whisper Siren',
    track: 'feminization',
    category: 'resonance',
    difficulty: 'beginner',
    durationSec: 30,
    summary: 'Elevate the larynx and narrow the pharynx without engaging vocal cords or causing strain.',
    instructions: [
      'Take a relaxed diaphragmatic breath in.',
      'Exhale on an unvoiced whisper, shaping a silent "ee" or gentle sigh.',
      'Smoothly glide your whisper from a low whisper to a high, bright whisper.',
      'Feel the larynx float effortlessly upward toward your chin. Never squeeze your neck.',
    ],
    physiologicalCues: [
      'Thyrohyoid contraction floats larynx upward.',
      'Back of tongue arches toward upper molars (high vowel posture).',
      'Soft palate gently elevates, reducing pharyngeal volume.',
    ],
    targetDescription: 'Target bright F2 resonance > 75% on the spectrograph with zero vocal cord pressure.',
    expectedPattern: 'siren-up',
  },
  {
    id: 'fem-small-dog-pant',
    title: 'The Small Dog Pant (Vocal Tract Shortening)',
    track: 'feminization',
    category: 'resonance',
    difficulty: 'beginner',
    durationSec: 45,
    summary: 'A classic speech therapy exercise to isolate vocal tract length from breath flow.',
    instructions: [
      'Breathe like a tired puppy: quick, relaxed, silent panting.',
      'Now shift into a tiny dog pant: higher, lighter, faster air pulses.',
      'Place a gentle finger on your Adam\'s apple/thyroid notch. Notice it resting in an elevated position.',
      'After 5 silent pants, smoothly voice a gentle "hah" on your target pitch (~210 Hz).',
    ],
    physiologicalCues: [
      'Shortens the pharyngeal cavity by 1.5–2 cm.',
      'Shifts formant frequencies (F1 and F2) up by 200–400 Hz.',
      'Keep false vocal folds retracted (open airway sensation).',
    ],
    targetDescription: 'Maintain resonance gauge in the "Bright Oral" zone (>70%) while sustaining "hah".',
    expectedPattern: 'sustained',
  },
  {
    id: 'fem-bright-vowel-shaping',
    title: 'Bright Vowel Chain (/i/ → /e/ → /æ/)',
    track: 'feminization',
    category: 'resonance',
    difficulty: 'intermediate',
    durationSec: 60,
    summary: 'Train forward oral resonance across vowels without letting resonance collapse into the throat.',
    instructions: [
      'Anchor on your comfortable feminine pitch (~200–220 Hz, around A3).',
      'Sustain "ee" (/i/), maintaining bright frontal resonance in your cheekbones.',
      'Transition fluidly to "eh" (/e/), keeping the same high larynx and bright timbre.',
      'Open into "cat" (/æ/) without dropping resonance into your chest.',
    ],
    physiologicalCues: [
      'Tongue blade stays forward near the lower incisors.',
      'Lip corners remain relaxed and neutral, not rounded.',
      'Watch your F2 formant line on the spectrograph stay above 1800 Hz.',
    ],
    targetDescription: 'Hold steady at 210 Hz with resonance above 70% throughout all 3 vowel shifts.',
    expectedPattern: 'sustained',
  },
  {
    id: 'fem-pitch-corridor-sustain',
    title: 'Laser Pitch Stability Corridor',
    track: 'feminization',
    category: 'pitch',
    difficulty: 'intermediate',
    durationSec: 45,
    summary: 'Eliminate involuntary pitch wobbles and micro-tremors in the 200–230 Hz zone.',
    instructions: [
      'Select target frequency: 215 Hz (A3).',
      'Take a silent, supported breath from the lower abdomen.',
      'Voice a steady "mmm" or "laaa", keeping the pitch cursor precisely centered in the green corridor.',
      'Focus on steady, even air pressure like blowing a steady bubble.',
    ],
    physiologicalCues: [
      'Cricothyroid muscle keeps gentle, constant tension.',
      'Abdominal wall provides steady support to prevent air surges.',
      'Relax jaw and tongue to eliminate tension wobbles.',
    ],
    targetDescription: 'Achieve > 90% pitch stability score for 15 consecutive seconds.',
    expectedPattern: 'sustained',
  },
  {
    id: 'fem-melodic-inflection-phrase',
    title: 'Dynamic Upward Inflection Reading',
    track: 'feminization',
    category: 'inflection',
    difficulty: 'advanced',
    durationSec: 60,
    summary: 'Practice natural feminine sentence intonation with rising phrase contours and bright cadence.',
    instructions: [
      'Read the passage aloud with buoyant, musical inflection.',
      'Start sentences at your median pitch (~205 Hz).',
      'Glide upward at the end of clauses and questions rather than dropping heavily.',
      'Keep vocal weight light and airy—never slam into low chest notes.',
    ],
    physiologicalCues: [
      'Continuous pitch contour with micro-glides.',
      'Light vocal fold contact (thin-fold phonation).',
      'Check spectrograph: upper harmonics should dance gracefully.',
    ],
    targetDescription: 'Maintain median pitch >= 195 Hz with expressive upward pitch movement.',
    expectedPattern: 'reading',
    passageText:
      'Good morning! The weather today looks absolutely bright and sunny. I am looking forward to taking a nice walk through the garden this afternoon, would you like to join me?',
  },

  // MASCULINIZATION DRILLS
  {
    id: 'masc-yawn-sigh',
    title: 'Yawn-Sigh Larynx Depression',
    track: 'masculinization',
    category: 'resonance',
    difficulty: 'beginner',
    durationSec: 45,
    summary: 'Expand the pharyngeal cavern and gently lower the larynx for rich, deep acoustic warmth.',
    instructions: [
      'Initiate a natural, relaxed silent yawn.',
      'Notice the wide, cool sensation at the very back of your throat as the soft palate raises and larynx descends.',
      'At the peak of the yawn, sigh gently downward: "haaaaww" or "ohhhh".',
      'Feel the deep reverberation in your sternum and collarbones.',
    ],
    physiologicalCues: [
      'Sternothyroid and omohyoid muscles gently guide the larynx down.',
      'Pharyngeal space widens by expanding lateral throat walls.',
      'Lengthens the acoustic vocal tract by 2–3 cm.',
    ],
    targetDescription: 'Target resonance score in the "Dark Pharyngeal" zone (<30%) with rich low harmonics.',
    expectedPattern: 'siren-down',
  },
  {
    id: 'masc-big-dog-breath',
    title: 'The Big Dog Breath (Pharyngeal Expansion)',
    track: 'masculinization',
    category: 'resonance',
    difficulty: 'beginner',
    durationSec: 40,
    summary: 'The counter-exercise to small dog panting; isolates pharyngeal expansion and vocal tract length.',
    instructions: [
      'Open the back of your mouth as if biting into a giant apple.',
      'Breathe deeply like a heavy St. Bernard dog: slow, deep, warm exhalations.',
      'Feel the air resonance sounding hollow, deep, and cavernous.',
      'Add sound into the exhale on an open "huh" or "woof" around 110 Hz.',
    ],
    physiologicalCues: [
      'Lowers F1 and F2 formants toward 400 Hz and 1000 Hz.',
      'Maximizes pharyngeal resonance volume without tongue tension.',
      'Keeps tongue root forward and relaxed in the jaw.',
    ],
    targetDescription: 'Maintain low resonance (<30%) and dark spectral centroid on the spectrograph.',
    expectedPattern: 'sustained',
  },
  {
    id: 'masc-chest-resonance-transfer',
    title: 'Chest Bone Vibration Transfer',
    track: 'masculinization',
    category: 'resonance',
    difficulty: 'intermediate',
    durationSec: 50,
    summary: 'Train sympathetic chest resonance and thick vocal fold phonation on sustained open vowels.',
    instructions: [
      'Place one flat palm firmly against the center of your chest (sternum).',
      'Hum a relaxed "mmmm" around 100–120 Hz until your palm feels physical buzzing vibrations.',
      'Open the lips into a deep "mohh" or "maah", retaining the exact same chest buzzing.',
      'Keep the neck loose—the power comes from relaxed diaphragmatic breath, not a squeezed throat.',
    ],
    physiologicalCues: [
      'Encourages subglottic acoustic coupling.',
      'Increases closed-quotient of vocal folds for grounded vocal weight.',
      'Dominant lower harmonic series below 500 Hz.',
    ],
    targetDescription: 'Sustain pitch at 105–125 Hz with vocal weight >= 65% and high stability.',
    expectedPattern: 'sustained',
  },
  {
    id: 'masc-pitch-grounding-stability',
    title: 'Deep Pitch Grounding Anchor',
    track: 'masculinization',
    category: 'pitch',
    difficulty: 'intermediate',
    durationSec: 45,
    summary: 'Build steady pitch control and muscular endurance in the 90–120 Hz masculine range.',
    instructions: [
      'Target frequency: 110 Hz (A2).',
      'Inhale deeply and ground your posture (shoulders relaxed, spine tall).',
      'Sustain an authoritative, relaxed "bohh" or "noon".',
      'Keep the green pitch cursor steady without wavering or cracking into head voice.',
    ],
    physiologicalCues: [
      'Thyroarytenoid muscle dominant (thick fold configuration).',
      'Even subglottic air pressure.',
      'Zero jaw clenching.',
    ],
    targetDescription: 'Hold pitch between 95–125 Hz with > 88% stability.',
    expectedPattern: 'sustained',
  },
  {
    id: 'masc-falling-cadence-reading',
    title: 'Downward Inflection Grounding Passage',
    track: 'masculinization',
    category: 'inflection',
    difficulty: 'advanced',
    durationSec: 60,
    summary: 'Practice masculine speech melody: steady plateaus with confident downward sentence-final falls.',
    instructions: [
      'Read the passage aloud with steady, grounded presence.',
      'Keep your speaking pitch between 100 Hz and 130 Hz.',
      'At the end of every sentence, allow your pitch to drop smoothly to your bottom resonance.',
      'Avoid upward questioning inflections on factual statements.',
    ],
    physiologicalCues: [
      'Falling sentence-final intonation curve.',
      'Controlled phrase deceleration.',
      'Full glottal contact throughout the phrase.',
    ],
    targetDescription: 'Keep average pitch <= 125 Hz with steady downward final cadence.',
    expectedPattern: 'reading',
    passageText:
      'The morning briefing begins at eight. All team reports must be finalized before noon. Let us review the project architecture and establish our clear direction for the week.',
  },
];

/**
 * Generate a personalized daily routine tailored to the user's historical performance
 */
export function generatePersonalizedDrills(
  track: VocalTrack,
  history: SessionRecord[] = []
): PersonalizedRoutine {
  const isFem = track === 'feminization';

  // Default baseline stats if history is empty or short
  let avgStability = 78;
  let avgResonance = isFem ? 56 : 48; // Baseline starting stats
  let avgWeight = 50;

  if (history.length > 0) {
    const relevantSessions = history.filter((s) => s.track === track || history.length < 3);
    const pool = relevantSessions.length > 0 ? relevantSessions : history;
    const recent = pool.slice(-6); // last 6 sessions

    avgStability = Math.round(recent.reduce((acc, s) => acc + s.pitchStability, 0) / recent.length);
    avgResonance = Math.round(recent.reduce((acc, s) => acc + s.avgResonance, 0) / recent.length);
    avgWeight = Math.round(recent.reduce((acc, s) => acc + s.avgVocalWeight, 0) / recent.length);
  }

  // Diagnose primary weakness
  let primaryWeakness: PersonalizedRoutine['diagnosedNeeds']['primaryWeakness'] = 'pitch-stability';
  let weaknessDesc = '';
  let recommendedFocus = '';

  if (isFem) {
    // Feminization logic
    if (avgResonance < 68) {
      primaryWeakness = 'resonance-elevation';
      weaknessDesc = `Recent resonance averaged ${avgResonance}% (Target: 75%+). Your voice needs more vocal tract shortening and larynx elevation.`;
      recommendedFocus = 'Larynx elevation drills & forward tongue postures to boost upper formants.';
    } else if (avgStability < 82) {
      primaryWeakness = 'pitch-stability';
      weaknessDesc = `Pitch stability scored ${avgStability}% (Target: 88%+). Pitch micro-wobbles detected during sustained phonation.`;
      recommendedFocus = 'Breath pressure stabilization and steady sustained vocalization.';
    } else if (avgWeight > 48) {
      primaryWeakness = 'vocal-weight';
      weaknessDesc = `Vocal weight averaged ${avgWeight}% (Target: 25–45%). Vocal fold contact is slightly too heavy, causing chesty strain.`;
      recommendedFocus = 'Thin-fold phonation, unvoiced whisper onsets, and breathy release.';
    } else {
      primaryWeakness = 'inflection-range';
      weaknessDesc = 'Pitch and resonance are solid! Time to build dynamic sentence-level melodic agility.';
      recommendedFocus = 'Reading passages with upward feminine pitch contours.';
    }
  } else {
    // Masculinization logic
    if (avgResonance > 36) {
      primaryWeakness = 'resonance-darkening';
      weaknessDesc = `Recent resonance averaged ${avgResonance}% (Target: <30%). Timbre is sitting too forward; needs pharyngeal expansion.`;
      recommendedFocus = 'Yawn-sigh drills and chest resonance transfer to lower formants.';
    } else if (avgStability < 82) {
      primaryWeakness = 'pitch-stability';
      weaknessDesc = `Pitch stability scored ${avgStability}% in the lower register. Unsteady breath support in deep range.`;
      recommendedFocus = 'Low register grounding and diaphragmatic control.';
    } else if (avgWeight < 60) {
      primaryWeakness = 'vocal-weight';
      weaknessDesc = `Vocal weight averaged ${avgWeight}% (Target: 65–85%). Voice lacks grounded chest vibration.`;
      recommendedFocus = 'Chest bone vibration and thick vocal fold phonation.';
    } else {
      primaryWeakness = 'inflection-range';
      weaknessDesc = 'Resonance depth is great! Focus on natural downward sentence-final cadence.';
      recommendedFocus = 'Authoritative downward sentence inflection readings.';
    }
  }

  // Filter master drills by track
  const trackDrills = MASTER_DRILLS.filter((d) => d.track === track);

  // Score & sort drills by relevance to diagnosed weakness
  const sortedDrills = [...trackDrills].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (primaryWeakness.includes('resonance') && a.category === 'resonance') scoreA += 5;
    if (primaryWeakness.includes('resonance') && b.category === 'resonance') scoreB += 5;

    if (primaryWeakness === 'pitch-stability' && a.category === 'pitch') scoreA += 5;
    if (primaryWeakness === 'pitch-stability' && b.category === 'pitch') scoreB += 5;

    if (primaryWeakness === 'vocal-weight' && (a.category === 'vocal-weight' || a.category === 'resonance')) scoreA += 4;
    if (primaryWeakness === 'vocal-weight' && (b.category === 'vocal-weight' || b.category === 'resonance')) scoreB += 4;

    if (primaryWeakness === 'inflection-range' && a.category === 'inflection') scoreA += 5;
    if (primaryWeakness === 'inflection-range' && b.category === 'inflection') scoreB += 5;

    return scoreB - scoreA;
  });

  // Pick top 4 tailored drills
  const selected = sortedDrills.slice(0, 4);

  const tailoredDrills: TailoredDrill[] = selected.map((d, index) => {
    let tailoredReason = '';
    let specificGoal = '';

    if (d.category === 'resonance') {
      tailoredReason = isFem
        ? `Selected to boost your F2 resonance (currently ${avgResonance}%) towards the 80% mark.`
        : `Selected to deepen pharyngeal volume and pull resonance down into your chest (<30%).`;
      specificGoal = isFem ? 'Target 75%+ resonance score' : 'Target <30% dark resonance';
    } else if (d.category === 'pitch') {
      tailoredReason = `Selected to eliminate pitch wobble (recent stability: ${avgStability}%).`;
      specificGoal = 'Target > 88% stability score';
    } else {
      tailoredReason = `Selected to apply your gains into practical speaking cadence.`;
      specificGoal = 'Complete full reading passage with smooth inflection';
    }

    return {
      ...d,
      tailoredReason,
      specificGoal,
      isCompleted: false,
    };
  });

  return {
    id: `routine-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    track,
    diagnosedNeeds: {
      primaryWeakness,
      description: weaknessDesc,
      recentStabilityAvg: avgStability,
      recentResonanceAvg: avgResonance,
      recommendedFocus,
    },
    drills: tailoredDrills,
    completedCount: 0,
    totalXpReward: 250,
  };
}
