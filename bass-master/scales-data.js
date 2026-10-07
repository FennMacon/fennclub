// Scale data and pitch calculations. Note spelling intentionally uses the existing sharp/flat lists.
// Scale definitions with whole/half step patterns
const scales = {
    'major': {
        'intervals': [0, 2, 4, 5, 7, 9, 11], // W-W-H-W-W-W-H pattern (2-2-1-2-2-2-1)
        'description': 'Major Scale: {0} - {1} - {2} - {3} - {4} - {5} - {6} - {0}',
        'pattern': 'W-W-H-W-W-W-H',
        'steps': [2, 2, 1, 2, 2, 2, 1]
    },
    'minor': {
        'intervals': [0, 2, 3, 5, 7, 8, 10], // W-H-W-W-H-W-W pattern (2-1-2-2-1-2-2)
        'description': 'Natural Minor Scale: {0} - {1} - {2} - {3} - {4} - {5} - {6} - {0}',
        'pattern': 'W-H-W-W-H-W-W',
        'steps': [2, 1, 2, 2, 1, 2, 2]
    },
    'harmonic-minor': {
        'intervals': [0, 2, 3, 5, 7, 8, 11], // W-H-W-W-H-W+H-H pattern (2-1-2-2-1-3-1)
        'description': 'Harmonic Minor Scale: {0} - {1} - {2} - {3} - {4} - {5} - {6} - {0}',
        'pattern': 'W-H-W-W-H-W+H-H',
        'steps': [2, 1, 2, 2, 1, 3, 1]
    },
    'pentatonic': {
        'intervals': [0, 2, 4, 7, 9], // W-W-W+H-W-W+H pattern (2-2-3-2-3)
        'description': 'Pentatonic Scale: {0} - {1} - {2} - {3} - {4} - {0}',
        'pattern': 'W-W-W+H-W-W+H',
        'steps': [2, 2, 3, 2, 3]
    }
};

// Note definitions
const notes = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
const flatNotes = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const sharpNotes = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

// Note numbering (1-based) - two options
const noteNumbersFromC = {
    'C': 1, 'C♯': 2, 'D♭': 2, 'D': 3, 'D♯': 4, 'E♭': 4, 'E': 5, 'F': 6,
    'F♯': 7, 'G♭': 7, 'G': 8, 'G♯': 9, 'A♭': 9, 'A': 10, 'A♯': 11, 'B♭': 11, 'B': 12
};

// Key signature preferences for proper music theory notation
const preferredAccidentals = {
    'C': { major: 'sharp', minor: 'flat' },
    'C♯': { major: 'sharp', minor: 'sharp' },
    'D♭': { major: 'flat', minor: 'flat' },
    'D': { major: 'sharp', minor: 'flat' },
    'D♯': { major: 'sharp', minor: 'sharp' },
    'E♭': { major: 'flat', minor: 'flat' },
    'E': { major: 'sharp', minor: 'sharp' },
    'F': { major: 'flat', minor: 'flat' },
    'F♯': { major: 'sharp', minor: 'sharp' },
    'G♭': { major: 'flat', minor: 'flat' },
    'G': { major: 'sharp', minor: 'flat' },
    'G♯': { major: 'sharp', minor: 'sharp' },
    'A♭': { major: 'flat', minor: 'flat' },
    'A': { major: 'sharp', minor: 'flat' },
    'A♯': { major: 'sharp', minor: 'sharp' },
    'B♭': { major: 'flat', minor: 'flat' },
    'B': { major: 'sharp', minor: 'sharp' }
};

// Color definitions for notes
const noteColors = [
    'rgba(255, 0, 0, 0.7)',      // C - Red
    'rgba(255, 128, 0, 0.7)',    // C#/Db - Orange-Red
    'rgba(255, 165, 0, 0.7)',    // D - Orange
    'rgba(255, 210, 0, 0.7)',    // D#/Eb - Yellow-Orange
    'rgba(255, 255, 0, 0.7)',    // E - Yellow
    'rgba(0, 128, 0, 0.7)',      // F - Green
    'rgba(0, 200, 175, 0.7)',    // F#/Gb - Teal
    'rgba(0, 0, 255, 0.7)',      // G - Blue
    'rgba(75, 0, 210, 0.7)',     // G#/Ab - Blue-Indigo
    'rgba(75, 0, 130, 0.7)',     // A - Indigo
    'rgba(110, 0, 190, 0.7)',    // A#/Bb - Purple
    'rgba(143, 0, 255, 0.7)'     // B - Violet
];

// Color definitions for scale degrees
const scaleDegreeColors = [
    'rgba(255, 0, 0, 1.0)',      // Root (1) - Red
    'rgba(255, 165, 0, 1.0)',    // 2nd - Orange
    'rgba(255, 255, 0, 1.0)',    // 3rd - Yellow
    'rgba(0, 128, 0, 1.0)',      // 4th - Green
    'rgba(0, 0, 255, 1.0)',      // 5th - Blue
    'rgba(75, 0, 130, 1.0)',     // 6th - Indigo
    'rgba(143, 0, 255, 1.0)'     // 7th - Violet
];

// Mapping for pentatonic scale to maintain consistent colors with the legend
// This maps pentatonic scale positions to the corresponding color in the full scale
const pentatonicColorMap = [0, 1, 2, 4, 5]; // Maps to Root, 2nd, 3rd, 5th, 6th colors

// Calculate scale notes based on whole/half step patterns
function calculateScaleNotes(rootIndex, scaleType) {
    try {
        const scaleInfo = scales[scaleType];
        if (!scaleInfo) {
            console.error("Invalid scale type:", scaleType);
            return [0, 2, 4, 5, 7, 9, 11].map(i => (rootIndex + i) % 12); // Default to major if invalid
        }

        const intervals = scaleInfo.intervals;

        // Map intervals to absolute note indices
        let scaleNoteIndices = intervals.map(interval => (rootIndex + interval) % 12);

        // Add the root note at the end (octave higher) for completeness
        scaleNoteIndices.push(rootIndex);

        return scaleNoteIndices;
    } catch (error) {
        console.error("Error in calculateScaleNotes:", error);
        return [0, 2, 4, 5, 7, 9, 11].map(i => (rootIndex + i) % 12); // Default to major if error
    }
}

// Calculate extended scale going upwards until reaching the top of the clef range
function calculateExtendedScale(rootIndex, scaleType, clefType) {
    try {
        const scaleInfo = scales[scaleType];
        if (!scaleInfo) {
            console.error("Invalid scale type:", scaleType);
            return calculateScaleNotes(rootIndex, scaleType);
        }

        const baseIntervals = scaleInfo.intervals;
        const notesPerOctave = 12;

        // Start with the base scale (first octave)
        let extendedNoteIndices = [...baseIntervals.map(interval => (rootIndex + interval) % 12)];

        // Define the max octaves we want to go up to (based on clef)
        const maxOctaves = clefType === 'treble' ? 3 : 2; // This should give enough notes

        // Add additional octaves upward
        for (let octave = 1; octave < maxOctaves; octave++) {
            const nextOctaveNotes = baseIntervals.map(interval =>
                (rootIndex + interval) % 12
            );
            extendedNoteIndices = [...extendedNoteIndices, ...nextOctaveNotes];
        }

        return extendedNoteIndices;
    } catch (error) {
        console.error("Error in calculateExtendedScale:", error);
        return calculateScaleNotes(rootIndex, scaleType);
    }
}


// Octaves follow ascending sounding pitch, including sharps/flats. Do not clamp
// at the display ceiling: renderers filter out-of-range notes instead.
function calculateNoteOctaves(scaleNotes, clefType) {
    const naturalPitches = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const minimumPitch = clefType === 'treble' ? 45 : 24; // A3 / C2
    let previousPitch = minimumPitch - 1;
    return scaleNotes.map(note => {
        const spelling = note.split('/')[0];
        const accidental = spelling.includes('♯') ? 1 : spelling.includes('♭') ? -1 : 0;
        const pitchClass = (naturalPitches[spelling[0]] + accidental + 12) % 12;
        const octave = Math.floor(previousPitch / 12) + (pitchClass <= previousPitch % 12 ? 1 : 0);
        previousPitch = octave * 12 + pitchClass;
        return octave;
    });
}
