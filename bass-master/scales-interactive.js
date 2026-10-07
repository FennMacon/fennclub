$(document).ready(function() {
        // Helper function to get the correct color for a scale position
        function getScaleDegreeColor(scalePosition) {
            if (currentScale === 'pentatonic') {
                // For pentatonic scales, use the special mapping
                const mappedPosition = pentatonicColorMap[scalePosition % pentatonicColorMap.length];
                return scaleDegreeColors[mappedPosition];
            } else {
                // For other scales, use the regular mapping
                return scaleDegreeColors[scalePosition % scaleDegreeColors.length];
            }
        }

        // Helper function to get fully opaque colors for piano visualization
        function getPianoScaleDegreeColor(scalePosition) {
            // Get the regular color first
            let color = getScaleDegreeColor(scalePosition);

            // Replace the opacity value from 0.7 to 1.0
            return color.replace('0.7)', '1.0)');
        }

        // Helper function to determine if a color is yellow and should have black text
        function isYellowColor(color) {
            return needsBlackText(color); // Use the new function for backwards compatibility
        }

        const noteSelector = '.white-key, .black-key, .string-note, .staff-note, .caged-shape';
        const controlSelector = '.scale-btn, .note-btn, .accidental-btn, .viz-btn, .caged-btn';

        // Current state
        let currentScale = 'major';
        let currentRoot = 'C';
        let currentAccidental = 'natural';
        let currentVisualization = 'piano';
        let rootIndex = 0;

        // Get note name based on current accidental preference and musical context
        function getNoteName(index, forceAccidental = null) {
            try {
            const normalizedIndex = index % 12;
            let accidentalType = forceAccidental || currentAccidental;

                // If the accidental is set to 'natural', determine the proper notation based on music theory
                if (accidentalType === 'natural') {
                    // For accidental roots, use music theory conventions for proper notation
                    if (currentRoot.includes('♯') && currentRoot.includes('♭')) {
                        // Handle based on specific key conventions in music theory
                        const keyConventions = {
                            'C♯/D♭': 'flat',  // D♭ major is more common than C♯ major
                            'D♯/E♭': 'flat',  // E♭ major is more common than D♯ major
                            'F♯/G♭': 'sharp', // F♯ major is more common than G♭ major
                            'G♯/A♭': 'flat',  // A♭ major is more common than G♯ major
                            'A♯/B♭': 'flat',  // B♭ major is more common than A♯ major
                        };

                        if (keyConventions[currentRoot]) {
                            accidentalType = keyConventions[currentRoot];
                        }
                        // Default to key signature preferences if no specific convention
                        else if (preferredAccidentals[currentRoot.split('/')[0]]) {
                            if (currentScale === 'major' || currentScale === 'pentatonic') {
                                accidentalType = preferredAccidentals[currentRoot.split('/')[0]].major;
                            } else {
                                accidentalType = preferredAccidentals[currentRoot.split('/')[0]].minor;
                            }
                        }
                    }
                    // Otherwise use the key signature preferences for the current root note
                    else if (preferredAccidentals[currentRoot]) {
                if (currentScale === 'major' || currentScale === 'pentatonic') {
                    accidentalType = preferredAccidentals[currentRoot].major;
                } else {
                    accidentalType = preferredAccidentals[currentRoot].minor;
                        }
                }
            }

            if (accidentalType === 'flat') {
                return flatNotes[normalizedIndex];
            } else if (accidentalType === 'sharp') {
                return sharpNotes[normalizedIndex];
            } else {
                return notes[normalizedIndex];
                }
            } catch (error) {
                console.error("Error in getNoteName:", error, "index:", index, "forceAccidental:", forceAccidental);
                return notes[index % 12]; // Default to standard notation if error
            }
        }

        // Get note number (1-12) starting from C
        function getNoteNumber(index) {
            return (index % 12) + 1;
        }

        // Helper function to determine root index consistently across all functions
        function determineRootIndex(rootNote) {
            try {
            let index = -1;

            if (rootNote.includes('♯')) {
                const noteName = rootNote.split('/')[0];
                index = sharpNotes.indexOf(noteName);
            } else if (rootNote.includes('♭')) {
                const noteName = rootNote.includes('/') ? rootNote.split('/')[1] : rootNote;
                index = flatNotes.indexOf(noteName);
            } else {
                // For natural notes like C, D, E, etc.
                index = notes.findIndex(n => n.startsWith(rootNote) && !n.includes('♯') && !n.includes('♭'));
            }

            // Handle case where the root note wasn't found
            if (index === -1) {
                console.error("Root note not found:", rootNote);
                if (rootNote === "F♯/G♭") {
                    index = 6; // Hardcode the index for F♯/G♭
                } else {
                    index = 0; // Default to C if no match found
                }
            }

            return index;
            } catch (error) {
                console.error("Error in determineRootIndex:", error, "rootNote:", rootNote);
                return 0; // Default to C if error
            }
        }

        // Update scale notes display with note numbers
        function updateScaleNotesDisplay() {
            try {
            const scaleInfo = scales[currentScale];

            // Use the helper function to determine root index
            rootIndex = determineRootIndex(currentRoot);

            // Calculate scale notes using the step pattern
            const scaleNoteIndices = calculateScaleNotes(rootIndex, currentScale);

                // Get the preferred accidental type for this key/scale
                // We'll reuse this for the root display and all notes
                let preferredAccidentalType = currentAccidental;

            // Get all note names in the scale using appropriate accidentals
            const scaleNotes = scaleNoteIndices.map((index, i) => {
                    const noteName = getNoteName(index, preferredAccidentalType);
                // For the last note (octave), indicate it's the same as root but higher
                if (i === scaleNoteIndices.length - 1) {
                        return `${noteName}`;
                }
                    return `${noteName}`;
            });

            // Format the scale name more cleanly
            const scaleName = { major: 'Major', minor: 'Natural Minor', 'harmonic-minor': 'Harmonic Minor', pentatonic: 'Major Pentatonic' }[currentScale];

                // Get the clean root note name with the preferred accidental format
                let displayRoot = currentRoot;

                // If current root is a dual-notation accidental (like C♯/D♭), choose the appropriate one
                if (currentRoot.includes('♯') && currentRoot.includes('♭')) {
                    // Use getNoteName to get the properly formatted root note name
                    // Pass rootIndex to use the same consistent logic in getNoteName
                    displayRoot = getNoteName(rootIndex, preferredAccidentalType);
                }

                // Update scale pattern display
                const patternDisplay = `<span class="scale-pattern">${scaleInfo.pattern}</span>`;

                // Update the display with both note names and pattern
                $('#scale-notes').html(`${displayRoot} ${scaleName} Scale: ${scaleNotes.join(' - ')}<br>Step Pattern: ${patternDisplay}`);

                // Toggle color legend based on scale type
                if (currentScale === 'pentatonic') {
                    $('#standard-color-chips').hide();
                    $('#pentatonic-color-chips').show();
                    updateColorLegendText('#pentatonic-color-chips', scaleInfo, preferredAccidentalType);
                } else {
                    $('#standard-color-chips').show();
                    $('#pentatonic-color-chips').hide();
                    updateColorLegendText('#standard-color-chips', scaleInfo, preferredAccidentalType);
        }

        // Update all visualizations
                updateAllVisualizations();
            } catch (error) {
                console.error("Error in updateScaleNotesDisplay:", error);
                $('#scale-notes').html(`Error displaying scale: ${error.message}`);
            }
        }

        // Helper function to update color legend note names based on the current key
        function updateColorLegendText(legendId, scaleInfo, preferredAccidentalType) {
            try {
                // Get all color chips in the selected legend
                const colorChips = $(`${legendId} .color-chip`);

                // Update each color chip with the correct note name
                colorChips.each(function() {
                    const degree = parseInt($(this).data('degree'));
                    if (isNaN(degree)) return;

                    // Calculate the note index for this degree
                    const noteIndex = (rootIndex + scaleInfo.intervals[degree]) % 12;

                    // Get the note name with the preferred accidental
                    const noteName = getNoteName(noteIndex, preferredAccidentalType);

                    // Update just the note name before the solfège
                    $(this).contents().filter(function() {
                        return this.nodeType === 3; // Text nodes only
                    }).first().replaceWith(" " + noteName + " ");
                });
            } catch (error) {
                console.error("Error updating color legend text:", error);
            }
        }

        // Original updateColorLegend function is no longer needed
        function updateColorLegend() {
            // This function is deprecated and no longer used
            return;
        }

        // Initialize piano visualization with white and black keys
        function initPianoVisualization() {
            try {
                // Clear container
                $('#piano-viz').empty();

                // Create piano container
            const pianoContainer = $('<div class="piano-container"></div>');
                $('#piano-viz').append(pianoContainer);

                // Create a single global tooltip if it doesn't exist
                if ($('#global-tooltip').length === 0) {
                    $('body').append('<div id="global-tooltip" class="note-tooltip"></div>');
                }

                // White key names in order - adding a C at the end
                const whiteKeyNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];

                // Add white keys first
                for (let i = 0; i < whiteKeyNames.length; i++) {
                const whiteKey = $('<div class="white-key"></div>');
                    whiteKey.text(whiteKeyNames[i]);
                    whiteKey.attr('data-note', whiteKeyNames[i]);
                    whiteKey.attr('data-index', i);
                pianoContainer.append(whiteKey);
            }

                // Black key positions and mappings
                // Each black key is positioned between two white keys
                const blackKeyMap = [
                    { pos: 0, leftKey: 'C', rightKey: 'D', noteIndex: 1, sharp: 'C♯', flat: 'D♭' },
                    { pos: 1, leftKey: 'D', rightKey: 'E', noteIndex: 3, sharp: 'D♯', flat: 'E♭' },
                    { pos: 3, leftKey: 'F', rightKey: 'G', noteIndex: 6, sharp: 'F♯', flat: 'G♭' },
                    { pos: 4, leftKey: 'G', rightKey: 'A', noteIndex: 8, sharp: 'G♯', flat: 'A♭' },
                    { pos: 5, leftKey: 'A', rightKey: 'B', noteIndex: 10, sharp: 'A♯', flat: 'B♭' },
                    { pos: 7, leftKey: 'C', rightKey: 'D', noteIndex: 1, sharp: 'C♯', flat: 'D♭' },
                    { pos: 8, leftKey: 'D', rightKey: 'E', noteIndex: 3, sharp: 'D♯', flat: 'E♭' },
                    { pos: 10, leftKey: 'F', rightKey: 'G', noteIndex: 6, sharp: 'F♯', flat: 'G♭' },
                    { pos: 11, leftKey: 'G', rightKey: 'A', noteIndex: 8, sharp: 'G♯', flat: 'A♭' },
                    { pos: 12, leftKey: 'A', rightKey: 'B', noteIndex: 10, sharp: 'A♯', flat: 'B♭' },
                    { pos: 14, leftKey: 'C', rightKey: 'D', noteIndex: 1, sharp: 'C♯', flat: 'D♭' }
                ];

                // Add black keys positioned at the boundaries between white keys
                blackKeyMap.forEach((blackKey, index) => {
                    // Skip the last black key if we're at the very end of the keyboard
                    if (blackKey.pos >= whiteKeyNames.length - 1) return;

                    // Calculate the position between the two adjacent white keys
                    const keyWidth = 100 / whiteKeyNames.length; // Width of each white key in %
                    const leftPosition = (blackKey.pos + 1) * keyWidth; // Position at the boundary between keys

                    const blackKeyElement = $('<div class="black-key"></div>');

                    // Position key exactly at the boundary, transformed to center it
                    blackKeyElement.css('left', `${leftPosition}%`);

                    // Create labels for sharp and flat names
                    const sharpLabel = $(`<div class="black-key-label">${blackKey.sharp}</div>`);
                    const flatLabel = $(`<div class="accidental-label">${blackKey.flat}</div>`);

                    blackKeyElement.append(sharpLabel);
                    blackKeyElement.append(flatLabel);

                    // Set data attributes for note information
                    blackKeyElement.attr('data-note', `${blackKey.sharp}/${blackKey.flat}`);
                    blackKeyElement.attr('data-note-index', blackKey.noteIndex);

                    pianoContainer.append(blackKeyElement);
                });


            } catch (error) {
                console.error("Error initializing piano visualization:", error);
            }
        }

        // Update piano visualization with tooltip info
        function updatePianoVisualization() {
            try {
                // Store current scale notes for transitioning
                const currentScaleNotes = [];
                $('#piano-viz .white-key.scale-note, #piano-viz .black-key.scale-note').each(function() {
                    currentScaleNotes.push($(this));
                });

                // Calculate new scale notes
                const scaleNoteIndices = calculateScaleNotes(rootIndex, currentScale);

                // Prepare gradients for all keys first before applying
                const keyGradients = {};
                const keyInfos = {};
                const scaleKeys = [];

                // Process white keys
                $('#piano-viz .white-key').each(function() {
                    const $key = $(this);
                    const keyId = $key.index();
                    const keyName = $key.text().trim();
                    let noteIndex;

                    // Map key names to chromatic indices
                    switch(keyName) {
                        case 'C': noteIndex = 0; break;
                        case 'D': noteIndex = 2; break;
                        case 'E': noteIndex = 4; break;
                        case 'F': noteIndex = 5; break;
                        case 'G': noteIndex = 7; break;
                        case 'A': noteIndex = 9; break;
                        case 'B': noteIndex = 11; break;
                        default: return; // Skip if not a recognized key
                    }

                    // Look for this note in our scale
                    const scalePosition = scaleNoteIndices.indexOf(noteIndex);
                    if (scalePosition !== -1) {
                        const color = getPianoScaleDegreeColor(scalePosition);
                        const isRoot = scalePosition === 0 || scalePosition === scaleNoteIndices.length - 1;
                        const noteName = getNoteName(noteIndex);

                        // Get scale degree for tooltip
                        const scaleDegree = scalePosition + 1;
                        const degreeText = scaleDegree <= 7 ?
                            `${scaleDegree}${['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th'][scaleDegree]} degree` :
                            'Octave';

                        // Store note info for tooltips
                        keyInfos[keyId] = `${noteName} - ${degreeText}`;

                        // Create gradient from solfege color at top to white at bottom
                        let gradient;
                        if (isRoot) {
                            // For root notes, use a slightly more intense gradient
                            gradient = `linear-gradient(to bottom, ${color} 0%, ${color} 60%, #fff 100%)`;
                    } else {
                            gradient = `linear-gradient(to bottom, ${color} 0%, ${color} 40%, #fff 100%)`;
                        }

                        // Store for later application
                        keyGradients[keyId] = gradient;
                        scaleKeys.push({key: $key, isRoot: isRoot});
                    } else {
                        // For keys not in the scale, prepare a white gradient
                        keyGradients[keyId] = 'linear-gradient(to bottom, #fff 0%, #fff 100%)';
                    }
                });

                // Process black keys
                $('#piano-viz .black-key').each(function() {
                    const $key = $(this);
                    const keyId = 'b' + $key.index(); // Prefix with 'b' to avoid collision with white key indices
                    const noteIndex = parseInt($key.attr('data-note-index'));
                    if (isNaN(noteIndex)) return; // Skip if no valid note index

                    // Look for this note in our scale
                    const scalePosition = scaleNoteIndices.indexOf(noteIndex);
                    if (scalePosition !== -1) {
                        const color = getPianoScaleDegreeColor(scalePosition);
                        const isRoot = scalePosition === 0 || scalePosition === scaleNoteIndices.length - 1;
                        const noteName = getNoteName(noteIndex);

                        // Get scale degree for tooltip
                        const scaleDegree = scalePosition + 1;
                        const degreeText = scaleDegree <= 7 ?
                            `${scaleDegree}${['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th'][scaleDegree]} degree` :
                            'Octave';

                        // Store note info for tooltips
                        keyInfos[keyId] = `${noteName} - ${degreeText}`;

                        // Create gradient from solfege color at top to black at bottom
                        let gradient;
                        if (isRoot) {
                            // For root notes, use a slightly more intense gradient
                            gradient = `linear-gradient(to bottom, ${color} 0%, ${color} 50%, #000 100%)`;
                        } else {
                            gradient = `linear-gradient(to bottom, ${color} 0%, ${color} 30%, #000 100%)`;
                        }

                        // Store for later application
                        keyGradients[keyId] = gradient;
                        scaleKeys.push({key: $key, isRoot: isRoot});
                    } else {
                        // For keys not in the scale, prepare a black gradient
                        keyGradients[keyId] = 'linear-gradient(to bottom, #000 0%, #000 100%)';
                    }
                });

                // Clear classes and reset for the new visualization
                $('#piano-viz .white-key, #piano-viz .black-key').removeClass('scale-note root-note')
                    .removeData('note-info');

                $('#piano-viz').find('.key-highlight, .piano-note').remove();

                // Reset text appearance for black keys to default
                $('#piano-viz .black-key .black-key-label, #piano-viz .black-key .accidental-label').css({
                    'color': '',
                    'top': '',
                    'text-shadow': 'none'
                });

                // Apply all gradients at once for smooth transition
                $('#piano-viz .white-key').each(function() {
                    const $key = $(this);
                    const keyId = $key.index();

                    if (keyGradients[keyId]) {
                        $key.css('background', keyGradients[keyId]);

                        // If this key is in the scale
                        if (keyInfos[keyId]) {
                            $key.addClass('scale-note')
                                .data('note-info', keyInfos[keyId]);
                        }
                    }
                });

                $('#piano-viz .black-key').each(function() {
                    const $key = $(this);
                    const keyId = 'b' + $key.index();

                    if (keyGradients[keyId]) {
                        $key.css('background', keyGradients[keyId]);

                        // If this key is in the scale
                        if (keyInfos[keyId]) {
                            $key.addClass('scale-note')
                                .data('note-info', keyInfos[keyId]);

                            // Make text white for visibility against colored background
                            $key.find('.black-key-label, .accidental-label').css({
                                'color': '#fff',
                                'top': '10%' // Move text up for better visibility
                            });
                        }
                    }
                });

                // Add root-note class to root keys
                scaleKeys.forEach(function(item) {
                    if (item.isRoot) {
                        item.key.addClass('root-note');
                    }
                });

                // Make sure global tooltip exists
                if ($('#global-tooltip').length === 0) {
                    $('body').append('<div id="global-tooltip" class="note-tooltip"></div>');
                }

                // Apply tooltip handlers

            } catch (error) {
                console.error("Error in updatePianoVisualization:", error);
            }
        }

        // Initialize bass visualization with evenly spaced frets
        function initBassVisualization() {
            try {
                // Clear container
                $('#bass-viz').empty();

                // Create fretboard container
            const fretboard = $('<div class="fretboard"></div>');
                $('#bass-viz').append(fretboard);

                // Add 4 strings (G, D, A, E from top to bottom)
                const bassStrings = ['G', 'D', 'A', 'E'];
                const bassStringIndices = [7, 2, 9, 4]; // Corresponding note indices

            for (let i = 0; i < 4; i++) {
                const string = $('<div class="string"></div>');
                    string.css('top', `${25 + (i * 50 / 4)}%`);
                    string.attr('data-string', bassStrings[i]);
                    string.attr('data-index', bassStringIndices[i]);
                fretboard.append(string);
            }

                // Add 13 frets (0 = open string, 12 = octave)
            for (let i = 0; i <= 12; i++) {
                const fret = $('<div class="fret"></div>');
                    fret.css('left', `${i * (100 / 13)}%`);
                fret.attr('data-fret', i);
                fretboard.append(fret);

                // Add fret number labels centered in the fret space
                // Display all fret numbers 0-12
                const fretLabel = $('<div class="fret-label"></div>');
                fretLabel.text(i);
                fretLabel.css({
                    'left': `${(i * (100 / 13)) + ((100 / 13) / 2)}%` // Position in middle of fret
                });
                fretboard.append(fretLabel);
            }

                // Add fretboard markers (dots)
            addFretboardMarkers(fretboard, 'bass');

                // Use the global tooltip
            } catch (error) {
                console.error("Error initializing bass visualization:", error);
            }
        }

        // Function to add fretboard inlay markers (dots)
        function addFretboardMarkers(fretboard, instrumentType) {
            try {
                // Standard fret markers at positions 3, 5, 7, 9, 12
                const markerPositions = [4, 6, 8, 10, 13]; // Position 13 represents the 12th fret

                // Calculate string positions based on instrument type
                let stringPositions = [];

                if (instrumentType === 'bass') {
                    // Bass strings are positioned from 25% to 25% + (3 * 50/4)%
                    // Initialize positions for G, D, A, E strings
                    const bassFirstPos = 25;
                    const bassSpacing = 50 / 4;

                    // G string (first string, top)
                    stringPositions[0] = bassFirstPos;
                    // D string (second string)
                    stringPositions[1] = bassFirstPos + bassSpacing;
                    // A string (third string)
                    stringPositions[2] = bassFirstPos + (2 * bassSpacing);
                    // E string (fourth string, bottom)
                    stringPositions[3] = bassFirstPos + (3 * bassSpacing);

                } else { // guitar
                    // Guitar strings are positioned from 15% to 15% + (5 * 70/6)%
                    // Initialize positions for e, B, G, D, A, E strings
                    const guitarFirstPos = 15;
                    const guitarSpacing = 70 / 6;

                    // e string (first string, top)
                    stringPositions[0] = guitarFirstPos;
                    // B string (second string)
                    stringPositions[1] = guitarFirstPos + guitarSpacing;
                    // G string (third string)
                    stringPositions[2] = guitarFirstPos + (2 * guitarSpacing);
                    // D string (fourth string)
                    stringPositions[3] = guitarFirstPos + (3 * guitarSpacing);
                    // A string (fifth string)
                    stringPositions[4] = guitarFirstPos + (4 * guitarSpacing);
                    // E string (sixth string, bottom)
                    stringPositions[5] = guitarFirstPos + (5 * guitarSpacing);
                }

                // Calculate vertical center between first and last string for single dots
                const centerPos = (stringPositions[0] + stringPositions[stringPositions.length - 1]) / 2;

                // For double dots, calculate specific positions between designated strings
                let topDotPos, bottomDotPos;

                if (instrumentType === 'bass') {
                    // Bass: top dot between G (string 0) and D (string 1)
                    topDotPos = (stringPositions[0] + stringPositions[1]) / 2;
                    // Bass: bottom dot between A (string 2) and E (string 3)
                    bottomDotPos = (stringPositions[2] + stringPositions[3]) / 2;
                } else { // guitar
                    // Guitar: top dot between B (string 1) and G (string 2)
                    topDotPos = (stringPositions[1] + stringPositions[2]) / 2;
                    // Guitar: bottom dot between D (string 3) and A (string 4)
                    bottomDotPos = (stringPositions[3] + stringPositions[4]) / 2;
                }

                markerPositions.forEach(pos => {
                    // Calculate horizontal center position in the middle of the fret
                    const xPos = (pos - 0.5) * (100 / 13); // Center between frets

                    if (pos === 13) {
                        // Add double dots at the 12th fret (position 13)
                        // Position dots between specific strings as requested

                        // Top dot
                        const topDot = $('<div class="fret-marker double"></div>');
                        topDot.css({
                            left: `${xPos}%`, // Horizontally centered in the fret
                            top: `${topDotPos}%` // Positioned between specific strings as requested
                        });
                        fretboard.append(topDot);

                        // Bottom dot
                        const bottomDot = $('<div class="fret-marker double-bottom"></div>');
                        bottomDot.css({
                            left: `${xPos}%`, // Horizontally centered in the fret
                            top: `${bottomDotPos}%` // Positioned between specific strings as requested
                        });
                        fretboard.append(bottomDot);
                    } else {
                        // Add single dots for other positions (centered between all strings)
                        const dot = $('<div class="fret-marker"></div>');
                        dot.css({
                            left: `${xPos}%`, // Horizontally centered in the fret
                            top: `${centerPos}%` // Vertically centered between all strings
                        });
                        fretboard.append(dot);
                    }

                    // Add small side markers
                    if (instrumentType === 'bass' || instrumentType === 'guitar') {
                        const sideMarker = $('<div class="side-marker"></div>');
                        sideMarker.css({
                            left: `${xPos}%`, // Horizontally centered in the fret
                            top: '90%' // Near bottom edge
                        });
                        fretboard.append(sideMarker);
                    }
                });
            } catch (error) {
                console.error("Error adding fretboard markers:", error);
            }
        }

        // Update bass visualization with tooltip and string/fret info
        function updateBassVisualization() {
            try {
                const scaleNoteIndices = calculateScaleNotes(rootIndex, currentScale);

                // Remove existing note markers
                $('#bass-viz').find('.string-note').remove();

                // Get strings and their base notes
                const strings = $('#bass-viz').find('.string');

                // For each string
                strings.each(function() {
                    const $string = $(this);
                    const stringBaseIndex = parseInt($string.attr('data-index'));
                    const stringName = $string.attr('data-string');

                    // For each fret (0-12)
                    for (let fret = 0; fret <= 12; fret++) {
                        // Calculate the note at this fret
                        const noteIndex = (stringBaseIndex + fret) % 12;

                        // Check if note is in the scale
                        const scaleIndex = scaleNoteIndices.indexOf(noteIndex);
                        if (scaleIndex !== -1) {
                            // It's in the scale - show a note marker
                            const color = getScaleDegreeColor(scaleIndex);
                            const isRoot = scaleIndex === 0 || scaleIndex === scaleNoteIndices.length - 1;

                            // Create note marker
                            const noteMarker = $('<div class="string-note"></div>');

                            // Position the note in the middle of the fret
                            noteMarker.css({
                                'background-color': color,
                                'left': `${(fret * (100 / 13)) + ((100 / 13) / 2)}%`, // Position in middle of fret
                                'top': $string.css('top')
                            });

                            // Set black text color for yellow notes
                            if (isYellowColor(color)) {
                                noteMarker.css('color', 'black');
                            }

                            // Add root note styling if it's the root
                            if (isRoot) {
                                noteMarker.attr('data-root', 'true');
                            }

                            // Get scale degree and add it to the note marker
                            const scaleDegree = scaleIndex + 1;
                            noteMarker.text(scaleDegree > 7 ? 'R' : scaleDegree);

                            // Get note info for tooltip
                            const noteName = getNoteName(noteIndex);

                            // Scale degree info
                            let degreeText = '';
                            if (scaleDegree <= 7) {
                                const degreeSuffix = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th'][scaleDegree];
                                degreeText = `${scaleDegree}${degreeSuffix} degree`;
                            } else {
                                degreeText = 'Octave';
                            }

                            // Set tooltip content
                            noteMarker.attr('title', `${noteName} - ${degreeText}\nString: ${stringName}, Fret: ${fret}`);

                            // Add the note marker to the fretboard
                            $('#bass-viz').find('.fretboard').append(noteMarker);
                        }
                    }
                });
            } catch (error) {
                console.error("Error updating bass visualization:", error);
            }
        }

        // Initialize guitar visualization with evenly spaced frets
        function initGuitarVisualization() {
            try {
                // Clear container
                $('#guitar-viz').empty();

                // Create fretboard container
            const fretboard = $('<div class="fretboard"></div>');
                $('#guitar-viz').append(fretboard);

                // Add 6 strings (e, B, G, D, A, E from top to bottom)
                const guitarStrings = ['e', 'B', 'G', 'D', 'A', 'E'];
                const guitarStringIndices = [4, 11, 7, 2, 9, 4]; // Note indices, with high e = E + octave

            for (let i = 0; i < 6; i++) {
                const string = $('<div class="string"></div>');
                    string.css('top', `${15 + (i * 70 / 6)}%`);
                    string.attr('data-string', guitarStrings[i]);
                    string.attr('data-index', guitarStringIndices[i]);
                fretboard.append(string);
            }

                // Add 13 frets (0 = open string, 12 = octave)
            for (let i = 0; i <= 12; i++) {
                const fret = $('<div class="fret"></div>');
                    fret.css('left', `${i * (100 / 13)}%`);
                fret.attr('data-fret', i);
                fretboard.append(fret);

                    // Add fret number labels centered in the fret space
                    // Display all fret numbers 0-12
                    const fretLabel = $('<div class="fret-label"></div>');
                    fretLabel.text(i);
                    fretLabel.css({
                        'left': `${(i * (100 / 13)) + ((100 / 13) / 2)}%` // Position in middle of fret
                    });
                    fretboard.append(fretLabel);
                }

                // Add fretboard markers (dots)
            addFretboardMarkers(fretboard, 'guitar');

                // Use the global tooltip
            } catch (error) {
                console.error("Error initializing guitar visualization:", error);
            }
        }

        // Update guitar visualization with tooltip and string/fret info
        function updateGuitarVisualization() {
            try {
                const scaleNoteIndices = calculateScaleNotes(rootIndex, currentScale);

                // Remove existing note markers
                $('#guitar-viz').find('.string-note').remove();

                // Get strings and their base notes
                const strings = $('#guitar-viz').find('.string');

                // For each string
                strings.each(function() {
                    const $string = $(this);
                    const stringBaseIndex = parseInt($string.attr('data-index'));
                    const stringName = $string.attr('data-string');

                    // For each fret (0-12)
                for (let fret = 0; fret <= 12; fret++) {
                        // Calculate the note at this fret
                        const noteIndex = (stringBaseIndex + fret) % 12;

                        // Check if note is in the scale
                        const scaleIndex = scaleNoteIndices.indexOf(noteIndex);
                        if (scaleIndex !== -1) {
                            // It's in the scale - show a note marker
                            const color = getScaleDegreeColor(scaleIndex);
                            const isRoot = scaleIndex === 0 || scaleIndex === scaleNoteIndices.length - 1;

                            // Create note marker
                            const noteMarker = $('<div class="string-note"></div>');

                            // Position the note in the middle of the fret
                            noteMarker.css({
                                'background-color': color,
                                'left': `${(fret * (100 / 13)) + ((100 / 13) / 2)}%`, // Position in middle of fret
                                'top': $string.css('top')
                            });

                            // Set black text color for yellow notes
                            if (isYellowColor(color)) {
                                noteMarker.css('color', 'black');
                            }

                            // Add root note styling if it's the root
                            if (isRoot) {
                                noteMarker.attr('data-root', 'true');
                            }

                            // Add scale degree number inside the note
                            const scaleDegree = scaleIndex + 1;
                            noteMarker.text(scaleDegree > 7 ? 'R' : scaleDegree);

                            // Get note info for tooltip
                        const noteName = getNoteName(noteIndex);

                            // Scale degree info
                            let degreeText = '';
                            if (scaleDegree <= 7) {
                                const degreeSuffix = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th'][scaleDegree];
                                degreeText = `${scaleDegree}${degreeSuffix} degree`;
                            } else {
                                degreeText = 'Octave';
                            }

                            // Set tooltip content
                            noteMarker.attr('title', `${noteName} - ${degreeText}\nString: ${stringName}, Fret: ${fret}`);

                            // Add the note marker to the fretboard
                            $('#guitar-viz').find('.fretboard').append(noteMarker);
                    }
                }
            });
            } catch (error) {
                console.error("Error updating guitar visualization:", error);
            }
        }

        // Initialize treble clef visualization
        function initTrebleVisualization() {
            try {
                // Clear container
                $('#treble-viz').empty();

                // Create staff container
            const staffContainer = $('<div class="staff-container"></div>');
                $('#treble-viz').append(staffContainer);

                // Add treble clef symbol
                const clefSymbol = $('<div class="clef-symbol">𝄞</div>');
                clefSymbol.css({
                    'position': 'absolute',
                    'left': '20px',
                    'top': '50%',
                    'transform': 'translateY(-55%)',
                    'font-size': '100px',
                    'font-family': 'serif',
                    'color': '#333'
                });
                staffContainer.append(clefSymbol);

                // Add 5 staff lines
            for (let i = 0; i < 5; i++) {
                const staffLine = $('<div class="staff-line"></div>');
                    staffLine.css('top', `${35 + (i * 10)}%`);
                staffContainer.append(staffLine);
            }

                // Use the global tooltip
            } catch (error) {
                console.error("Error initializing treble visualization:", error);
            }
        }

        // Initialize bass clef visualization
        function initBassClefVisualization() {
            try {
                // Clear container
                $('#bass-clef-viz').empty();

                // Create staff container
            const staffContainer = $('<div class="staff-container"></div>');
                $('#bass-clef-viz').append(staffContainer);

                // Add bass clef symbol
                const clefSymbol = $('<div class="clef-symbol">𝄢</div>');
                clefSymbol.css({
                    'position': 'absolute',
                    'left': '20px',
                    'top': '50%',
                    'transform': 'translateY(-35%)',
                    'font-size': '80px',
                    'font-family': 'serif',
                    'color': '#333'
                });
                staffContainer.append(clefSymbol);

                // Add 5 staff lines
            for (let i = 0; i < 5; i++) {
                const staffLine = $('<div class="staff-line"></div>');
                    staffLine.css('top', `${35 + (i * 10)}%`);
                staffContainer.append(staffLine);
            }

                // Use the global tooltip
            } catch (error) {
                console.error("Error initializing bass clef visualization:", error);
            }
        }

        // Update treble clef visualization
        function updateTrebleVisualization() {
            try {
                // Use extended scale to get more notes going up
                const scaleNoteIndices = calculateExtendedScale(rootIndex, currentScale, 'treble');
                const scaleNotes = scaleNoteIndices.map(index => getNoteName(index));

                // Remove existing notes and key signature
                $('#treble-viz').find('.staff-note, .leger-line, .key-signature, .note-accidental').remove();

                // Add key signature information
                addKeySignature('#treble-viz', currentRoot, currentScale);

                // Staff lines are positioned exactly at 35%, 45%, 55%, 65%, 75% from top
                // Spaces between lines are at 40%, 50%, 60%, 70%
                // In treble clef, the lines from bottom to top are E4, G4, B4, D5, F5

                // Create a comprehensive mapping of notes to positions
                // This maps note names directly to their standard treble clef positions
                const trebleStaffPositions = {
                    // Below the staff (ledger lines)
                    'A3': 95,  // Below Middle C
                    'B3': 90,  // Below Middle C
                    'C4': 85,  // Middle C (first ledger line below staff)
                    'D4': 80,

                    // On the staff (lines and spaces)
                    'E4': 75, // Bottom line
                    'F4': 70, // First space
                    'G4': 65, // Second line
                    'A4': 60, // Second space
                    'B4': 55, // Middle line
                    'C5': 50, // Third space
                    'D5': 45, // Fourth line
                    'E5': 40, // Fourth space
                    'F5': 35, // Top line

                    // Above the staff (ledger lines)
                    'G5': 30,
                    'A5': 25, // First ledger line above staff
                    'B5': 20,
                    'C6': 15
                };

                // Calculate octaves for all notes in the scale using the new function
                const noteOctaves = calculateNoteOctaves(scaleNotes, 'treble');

                // Keep pitches ascending; omit notes outside the visible staff range.
                const displayableNotes = [];
                scaleNoteIndices.forEach((noteIndex, scalePosition) => {
                    const noteName = getNoteName(noteIndex);
                    const baseNote = noteName.split('/')[0].charAt(0);
                    const octave = noteOctaves[scalePosition];
                    const pitch = octave * 12 + noteIndex;
                    if (pitch < 45 || pitch > 72) return;

                    displayableNotes.push({
                        noteIndex,
                        scalePosition,
                        baseNote,
                        octave,
                        noteName
                    });
                });

                // Get the staff container width for evenly spacing notes
                const staffContainer = $('#treble-viz').find('.staff-container');
                const staffWidth = staffContainer.width() || 800; // Default width if not available

                // Calculate available space (leave margins on left and right)
                const leftMargin = 120; // Space for clef and key signature
                const rightMargin = 50; // Space at right edge
                const availableWidth = staffWidth - leftMargin - rightMargin;

                // Calculate spacing between notes
                const noteSpacing = availableWidth / (displayableNotes.length - 1 || 1);

                // For each displayable note
                displayableNotes.forEach((noteData, displayIndex) => {
                    const { noteIndex, scalePosition, baseNote, octave, noteName } = noteData;

                    const color = getScaleDegreeColor(scalePosition);
                    const isRoot = scalePosition % scales[currentScale].intervals.length === 0; // First note or any octave of the root

                    // Determine if this note has an accidental
                    const hasAccidental = noteName.includes('♯') || noteName.includes('♭');
                    let accidentalType = null;

                    if (hasAccidental) {
                        // Determine whether to use sharp or flat based on current accidental setting
                        if (currentAccidental === 'sharp' || (currentAccidental === 'natural' && noteName.includes('♯'))) {
                            accidentalType = 'sharp';
                        } else {
                            accidentalType = 'flat';
                        }
                    }

                    // Construct the full note name with octave for positioning
                    const noteWithOctave = baseNote + octave;

                    // Get the position from our mapping
                    let position = trebleStaffPositions[noteWithOctave];

                    // If the position isn't defined in our mapping, calculate an approximation
                    if (!position) {
                        // Base position on the letter and octave
                        const letterIndex = 'CDEFGAB'.indexOf(baseNote);
                        position = 85 - (letterIndex * 5) - ((octave - 4) * 35);

                        // Check if the position would be out of reasonable range
                        if (position < 10 || position > 100) {
                            return; // Skip this note - out of range
                        }
                    }

                    // Calculate the horizontal position - spread them out evenly
                    const xPosition = leftMargin + (displayIndex * noteSpacing);

                    // Create note element
                    const noteElement = $('<div class="staff-note"></div>');
                    noteElement.css({
                        'background-color': color,
                        'left': `${xPosition}px`,
                        'top': `${position}%`
                    });

                    // Set black text color for bright notes
                    if (isYellowColor(color)) {
                        noteElement.css('color', 'black');
                    }

                    // Add root note styling if it's the root - keep consistent styling but don't change on hover
                    if (isRoot) {
                        noteElement.attr('data-root', 'true');
                        noteElement.css('border', '2px solid white');
                    }

                    // Show note name instead of scale degree
                    const noteDisplayText = baseNote;
                    noteElement.text(noteDisplayText);

                    // Get note info for tooltip including octave
                    const displayNoteName = noteName;

                    // Scale degree info
                    const scaleDegree = (scalePosition % 7) + 1;
                    let degreeText = '';
                    if (scaleDegree <= 7) {
                        const degreeSuffix = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th'][scaleDegree];
                        degreeText = `${scaleDegree}${degreeSuffix} degree`;
                    } else {
                        degreeText = 'Octave';
                    }

                    // Set tooltip content - include octave info
                    noteElement.attr('title', `${displayNoteName}${octave} - ${degreeText}`);
                    noteElement.attr('data-octave', octave);

                    // Add the note to the staff
                    $('#treble-viz').find('.staff-container').append(noteElement);

                    // Add accidental if needed
                    if (hasAccidental) {
                        let accidentalSymbol = accidentalType === 'sharp' ? '♯' : '♭';
                        const accidentalElement = $(`<div class="note-accidental note-${accidentalType}">${accidentalSymbol}</div>`);
                        accidentalElement.css({
                            'left': `${xPosition + 14}px`, // Position to right of note
                            'top': `${position}%`
                        });
                        $('#treble-viz').find('.staff-container').append(accidentalElement);
                    }

                    // Add leger lines if necessary (for notes outside the staff)
                    // Below the staff (E4 is the bottom line at 75%)
                    if (position > 75) {
                        // Add all needed ledger lines for this note
                        // We need to add lines at every 10% position that ends with 5
                        // Start from 85 (one ledger line below the staff) and go downward (increasing values)
                        for (let linePos = 85; linePos <= position + 5; linePos += 10) {
                            // Only add lines that don't fall on the staff
                            if (linePos > 75) {
                                const legerLine = $('<div class="leger-line"></div>');
                                legerLine.css({
                                    'top': `${linePos}%`,
                                    'left': `${xPosition}px`,
                                    'z-index': 5
                                });
                                $('#treble-viz').find('.staff-container').append(legerLine);
                            }
                        }
                    }
                    // Above the staff (F5 is the top line at 35%)
                    else if (position < 35) {
                        // Add all needed ledger lines for this note
                        // Start from 25 (one ledger line above the staff) and go upward (decreasing values)
                        for (let linePos = 25; linePos >= position - 5; linePos -= 10) {
                            // Only add lines that don't fall on the staff
                            if (linePos < 35) {
                                const legerLine = $('<div class="leger-line"></div>');
                                legerLine.css({
                                    'top': `${linePos}%`,
                                    'left': `${xPosition}px`,
                                    'z-index': 5
                                });
                                $('#treble-viz').find('.staff-container').append(legerLine);
                            }
                        }
                    }
                });
            } catch (error) {
                console.error("Error in updateTrebleVisualization:", error);
            }
        }

        // Update bass clef visualization
        function updateBassClefVisualization() {
            try {
                // Use extended scale to get more notes going up
                const scaleNoteIndices = calculateExtendedScale(rootIndex, currentScale, 'bass');
                const scaleNotes = scaleNoteIndices.map(index => getNoteName(index));

                // Remove existing notes and key signature
                $('#bass-clef-viz').find('.staff-note, .leger-line, .key-signature, .note-accidental').remove();

                // Add key signature information
                addKeySignature('#bass-clef-viz', currentRoot, currentScale);

                // Staff lines are positioned exactly at 35%, 45%, 55%, 65%, 75% from top
                // Spaces between lines are at 40%, 50%, 60%, 70%
                // In bass clef, the lines from bottom to top are G2, B2, D3, F3, A3

                // Create a comprehensive mapping of notes to positions
                // This maps note names directly to their standard bass clef positions
                const bassStaffPositions = {
                    // Below the staff (ledger lines)
                    'C2': 95,
                    'D2': 90,
                    'E2': 85,
                    'F2': 80,

                    // On the staff (lines and spaces)
                    'G2': 75, // Bottom line
                    'A2': 70, // First space
                    'B2': 65, // Second line
                    'C3': 60, // Second space
                    'D3': 55, // Middle line
                    'E3': 50, // Third space
                    'F3': 45, // Fourth line
                    'G3': 40, // Fourth space
                    'A3': 35, // Top line

                    // Above the staff (ledger lines)
                    'B3': 30,
                    'C4': 25, // Middle C (first ledger line above staff)
                    'D4': 20,
                    'E4': 15
                };

                // Calculate octaves for all notes in the scale using the new function
                const noteOctaves = calculateNoteOctaves(scaleNotes, 'bass');

                // Keep pitches ascending; omit notes outside the visible staff range.
                const displayableNotes = [];
                scaleNoteIndices.forEach((noteIndex, scalePosition) => {
                    const noteName = getNoteName(noteIndex);
                    const baseNote = noteName.split('/')[0].charAt(0);
                    const octave = noteOctaves[scalePosition];
                    const pitch = octave * 12 + noteIndex;
                    if (pitch < 24 || pitch > 52) return;

                    displayableNotes.push({
                        noteIndex,
                        scalePosition,
                        baseNote,
                        octave,
                        noteName
                    });
                });

                // Get the staff container width for evenly spacing notes
                const staffContainer = $('#bass-clef-viz').find('.staff-container');
                const staffWidth = staffContainer.width() || 800; // Default width if not available

                // Calculate available space (leave margins on left and right)
                const leftMargin = 120; // Space for clef and key signature
                const rightMargin = 50; // Space at right edge
                const availableWidth = staffWidth - leftMargin - rightMargin;

                // Calculate spacing between notes
                const noteSpacing = availableWidth / (displayableNotes.length - 1 || 1);

                // For each displayable note
                displayableNotes.forEach((noteData, displayIndex) => {
                    const { noteIndex, scalePosition, baseNote, octave, noteName } = noteData;

                    const color = getScaleDegreeColor(scalePosition);
                    const isRoot = scalePosition % scales[currentScale].intervals.length === 0; // First note or any octave of the root

                    // Determine if this note has an accidental
                    const hasAccidental = noteName.includes('♯') || noteName.includes('♭');
                    let accidentalType = null;

                    if (hasAccidental) {
                        // Determine whether to use sharp or flat based on current accidental setting
                        if (currentAccidental === 'sharp' || (currentAccidental === 'natural' && noteName.includes('♯'))) {
                            accidentalType = 'sharp';
                        } else {
                            accidentalType = 'flat';
                        }
                    }

                    // Construct the full note name with octave for positioning
                    const noteWithOctave = baseNote + octave;

                    // Get the position from our mapping
                    let position = bassStaffPositions[noteWithOctave];

                    // If the position isn't defined in our mapping, calculate an approximation
                    if (!position) {
                        // Base position on the letter and octave
                        const letterIndex = 'CDEFGAB'.indexOf(baseNote);
                        position = 95 - (letterIndex * 5) - ((octave - 2) * 35);

                        // Check if the position would be out of reasonable range
                        if (position < 10 || position > 100) {
                            return; // Skip this note - out of range
                        }
                    }

                    // Calculate the horizontal position - spread them out evenly
                    const xPosition = leftMargin + (displayIndex * noteSpacing);

                    // Create note element
                    const noteElement = $('<div class="staff-note"></div>');
                    noteElement.css({
                        'background-color': color,
                        'left': `${xPosition}px`,
                        'top': `${position}%`
                    });

                    // Set black text color for bright notes
                    if (isYellowColor(color)) {
                        noteElement.css('color', 'black');
                    }

                    // Add root note styling if it's the root - keep consistent styling but don't change on hover
                    if (isRoot) {
                        noteElement.attr('data-root', 'true');
                        noteElement.css('border', '2px solid white');
                    }

                    // Show note name instead of scale degree
                    const noteDisplayText = baseNote;
                    noteElement.text(noteDisplayText);

                    // Get note info for tooltip including octave
                    const displayNoteName = noteName;

                    // Scale degree info
                    const scaleDegree = (scalePosition % 7) + 1;
                    let degreeText = '';
                    if (scaleDegree <= 7) {
                        const degreeSuffix = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th'][scaleDegree];
                        degreeText = `${scaleDegree}${degreeSuffix} degree`;
                    } else {
                        degreeText = 'Octave';
                    }

                    // Set tooltip content - include octave info
                    noteElement.attr('title', `${displayNoteName}${octave} - ${degreeText}`);
                    noteElement.attr('data-octave', octave);

                    // Add the note to the staff
                    $('#bass-clef-viz').find('.staff-container').append(noteElement);

                    // Add accidental if needed
                    if (hasAccidental) {
                        let accidentalSymbol = accidentalType === 'sharp' ? '♯' : '♭';
                        const accidentalElement = $(`<div class="note-accidental note-${accidentalType}">${accidentalSymbol}</div>`);
                        accidentalElement.css({
                            'left': `${xPosition + 14}px`, // Position to right of note
                            'top': `${position}%`
                        });
                        $('#bass-clef-viz').find('.staff-container').append(accidentalElement);
                    }

                    // Add leger lines if necessary (for notes outside the staff)
                    // Below the staff (G2 is the bottom line at 75%)
                    if (position > 75) {
                        // Add all needed ledger lines for this note
                        // We need to add lines at every 10% position that ends with 5
                        // Start from 85 (one ledger line below the staff) and go downward (increasing values)
                        for (let linePos = 85; linePos <= position + 5; linePos += 10) {
                            // Only add lines that don't fall on the staff
                            if (linePos > 75) {
                                const legerLine = $('<div class="leger-line"></div>');
                                legerLine.css({
                                    'top': `${linePos}%`,
                                    'left': `${xPosition}px`,
                                    'z-index': 5
                                });
                                $('#bass-clef-viz').find('.staff-container').append(legerLine);
                            }
                        }
                    }
                    // Above the staff (A3 is the top line at 35%)
                    else if (position < 35) {
                        // Add all needed ledger lines for this note
                        // Start from 25 (one ledger line above the staff) and go upward (decreasing values)
                        for (let linePos = 25; linePos >= position - 5; linePos -= 10) {
                            // Only add lines that don't fall on the staff
                            if (linePos < 35) {
                                const legerLine = $('<div class="leger-line"></div>');
                                legerLine.css({
                                    'top': `${linePos}%`,
                                    'left': `${xPosition}px`,
                                    'z-index': 5
                                });
                                $('#bass-clef-viz').find('.staff-container').append(legerLine);
                            }
                        }
                    }
                });
            } catch (error) {
                console.error("Error in updateBassClefVisualization:", error);
            }
        }

        // EVENT HANDLERS - Fixed implementation

        // Scale button click handler
        $('.scale-btn').on('click', function() {
            try {
                $('.scale-btn').removeClass('active');
                $(this).addClass('active');
                currentScale = $(this).data('scale');
                updateScaleNotesDisplay();

                // Color legend toggling is now handled in updateScaleNotesDisplay
                // No need for duplicate code here

            } catch (error) {
                console.error("Error in scale button click:", error);
            }
        });

        // Root note button click handler
        $('.note-btn').on('click', function() {
            try {
                $('.note-btn').removeClass('active');
                $(this).addClass('active');
                currentRoot = $(this).data('label');
                updateScaleNotesDisplay();
            } catch (error) {
                console.error("Error in note button handler:", error);
            }
        });

        // Accidental button click handler
        $('.accidental-btn').on('click', function() {
            try {
                $('.accidental-btn').removeClass('active');
                $(this).addClass('active');
                currentAccidental = $(this).data('accidental');

                // Update the scale notes display
                updateScaleNotesDisplay();

            } catch (error) {
                console.error("Error in accidental button handler:", error);
            }
        });

        // Visualization button click handler
        $('.viz-btn').on('click', function() {
            try {
                $('.viz-btn').removeClass('active');
                $(this).addClass('active');

                // Hide all visualizations
                $('.piano-visual, .bass-visual, .guitar-visual, .treble-visual, .bass-clef-visual').removeClass('active');

                // Get the selected visualization
                const vizType = $(this).data('viz');
                currentVisualization = vizType;

                // Show the selected visualization
                $(`.${vizType}-visual`).addClass('active');

                // Update all visualizations
                updateAllVisualizations();
            } catch (error) {
                console.error("Error in visualization toggle:", error);
            }
        });

        // Function to add key signature to staff
        function addKeySignature(selector, rootNote, scaleType) {
            try {
                // Define sharp and flat key signatures
                const keySignatures = {
                    'C': { sharps: 0, flats: 0 },
                    'G': { sharps: 1, flats: 0 },
                    'D': { sharps: 2, flats: 0 },
                    'A': { sharps: 3, flats: 0 },
                    'E': { sharps: 4, flats: 0 },
                    'B': { sharps: 5, flats: 0 },
                    'F♯': { sharps: 6, flats: 0 },
                    'C♯': { sharps: 7, flats: 0 },
                    'F': { sharps: 0, flats: 1 },
                    'B♭': { sharps: 0, flats: 2 },
                    'E♭': { sharps: 0, flats: 3 },
                    'A♭': { sharps: 0, flats: 4 },
                    'D♭': { sharps: 0, flats: 5 },
                    'G♭': { sharps: 0, flats: 6 },
                    'C♭': { sharps: 0, flats: 7 }
                };

                // Get the base note from rootNote (removing any accidentals)
                const baseNote = rootNote.charAt(0);
                const hasSharp = rootNote.includes('♯');
                const hasFlat = rootNote.includes('♭');

                // Determine number of sharps or flats based on key
                let sharps = 0;
                let flats = 0;

                if (keySignatures[rootNote]) {
                    // Direct match (like 'C', 'G', etc.)
                    sharps = keySignatures[rootNote].sharps;
                    flats = keySignatures[rootNote].flats;
                } else if (hasSharp && keySignatures[baseNote + '♯']) {
                    // Sharp key
                    sharps = keySignatures[baseNote + '♯'].sharps;
                    flats = keySignatures[baseNote + '♯'].flats;
                } else if (hasFlat && keySignatures[baseNote + '♭']) {
                    // Flat key
                    sharps = keySignatures[baseNote + '♭'].sharps;
                    flats = keySignatures[baseNote + '♭'].flats;
                } else {
                    // Default for unrecognized keys
                    if (hasSharp) {
                        sharps = 3; // Arbitrary default
                    } else if (hasFlat) {
                        flats = 3; // Arbitrary default
                    }
                }

                // For minor scales, adjust based on relative major
                if (scaleType === 'minor' || scaleType === 'harmonic-minor') {
                    // Minor keys have the same signature as their relative major
                    // (3 semitones up or 9 semitones down)
                    // This is a simplification - more complex logic could be added
                    // to handle all minor key signatures properly
                }

                // Create key signature display
                let keyText = '';
                if (sharps > 0) {
                    keyText = `${sharps}♯`;
                } else if (flats > 0) {
                    keyText = `${flats}♭`;
                } else {
                    keyText = '♮'; // Natural sign for no sharps/flats
                }

                const keySignature = $(`<div class="key-signature">${keyText}</div>`);
                $(selector).find('.staff-container').append(keySignature);

            } catch (error) {
                console.error("Error adding key signature:", error);
            }
        }

        // CAGED System Implementation
        let cagedCurrentRoot = 'C';
        let cagedCurrentShape = 'C';
        let cagedCurrentPattern = '1';
        let cagedCurrentInstrument = 'guitar';



        // Root note selection for CAGED
        $('.caged-chord-select .caged-btn').on('click', function() {
            $('.caged-chord-select .caged-btn').removeClass('active');
            $(this).addClass('active');
            cagedCurrentRoot = $(this).data('root');
            updateCagedFretboard();
            refreshNoteAccess();
        });

        // Shape selection for guitar CAGED
        $('.caged-shape-select .caged-btn').on('click', function() {
            $('.caged-shape-select .caged-btn').removeClass('active');
            $(this).addClass('active');
            cagedCurrentShape = $(this).data('shape');
            updateCagedFretboard();
            refreshNoteAccess();
        });

        // Initialize CAGED fretboard
        function initCagedFretboard() {
            const fretboard = $('#caged-fretboard');
            fretboard.empty();

            // Add fret lines
            for (let i = 0; i <= 12; i++) {
                const fret = $('<div class="fret"></div>');
                fret.css('left', `${i * (100 / 13)}%`);
                fret.attr('data-fret', i);
                fretboard.append(fret);

                // Add fret number labels at the bottom
                if (i <= 12) {
                    const fretNumber = $('<div class="fret-number fret-label"></div>');
                    fretNumber.text(i);
                    fretNumber.css('left', `${(i * (100 / 13)) + ((100 / 13) / 2)}%`);
                    fretboard.append(fretNumber);
                }
            }

            // Special styling for the nut (0th fret)
            // The CSS should apply via the data-fret="0" attribute, but let's make sure
            fretboard.find('.fret[data-fret="0"]').css({
                'width': '4px',
                'background': 'linear-gradient(to right, #888, #444, #888)',
                'box-shadow': '2px 0 3px rgba(0, 0, 0, 0.3)',
                'z-index': '10'
            });

            // Add fret markers (dots)
            const markerPositions = [4, 6, 8, 10, 13]; // Frets with markers (3rd, 5th, 7th, 9th, 12th)

            markerPositions.forEach(pos => {
                // Calculate horizontal center position in the middle of the fret
                const xPos = (pos - 0.5) * (100 / 13); // Center between frets

                if (pos === 13) {
                    // Add double dots at the 12th fret

                    // For guitar: top dot between B and G strings, bottom dot between D and A
                    // For bass: adjust positions accordingly with 4 strings
                    const numStrings = (cagedCurrentInstrument === 'guitar') ? 6 : 4;

                    // Define positions based on number of strings
                    // Guitar: Top dot between strings 4 and 5 (G and B)
                    // Bass: Top dot positioned proportionally
                    const topDotPos = 85 - (numStrings === 6 ? 3.5 : 2.5) * (70 / numStrings);

                    // Guitar: Bottom dot between strings 2 and 3 (A and D)
                    // Bass: Bottom dot positioned proportionally
                    const bottomDotPos = 85 - (numStrings === 6 ? 1.5 : 0.75) * (70 / numStrings);

                    // Add top dot
                    $('<div></div>').css({
                        'position': 'absolute',
                        'width': '16px',
                        'height': '16px',
                        'border-radius': '50%',
                        'background-color': 'rgba(245, 245, 245, 0.9)',
                        'box-shadow': 'inset 0 0 4px rgba(0, 0, 0, 0.8), 0 0 2px rgba(255, 255, 255, 0.5)',
                        'transform': 'translate(-50%, -50%)',
                        'left': `${xPos}%`,
                        'top': `${topDotPos}%`,
                        'z-index': '2'
                    }).appendTo(fretboard);

                    // Add bottom dot
                    $('<div></div>').css({
                        'position': 'absolute',
                        'width': '16px',
                        'height': '16px',
                        'border-radius': '50%',
                        'background-color': 'rgba(245, 245, 245, 0.9)',
                        'box-shadow': 'inset 0 0 4px rgba(0, 0, 0, 0.8), 0 0 2px rgba(255, 255, 255, 0.5)',
                        'transform': 'translate(-50%, -50%)',
                        'left': `${xPos}%`,
                        'top': `${bottomDotPos}%`,
                        'z-index': '2'
                    }).appendTo(fretboard);
                } else {
                    // Single dot should be between G and D string (or positioned proportionally for bass)
                    const numStrings = (cagedCurrentInstrument === 'guitar') ? 6 : 4;

                    // For guitar: single dot between strings 3 and 4 (D and G)
                    // For bass: position proportionally
                    const dotPos = 85 - (numStrings === 6 ? 2.5 : 1.5) * (70 / numStrings);

                    // Add single dot
                    $('<div></div>').css({
                        'position': 'absolute',
                        'width': '16px',
                        'height': '16px',
                        'border-radius': '50%',
                        'background-color': 'rgba(240, 240, 240, 0.8)',
                        'box-shadow': 'inset 0 0 3px rgba(0, 0, 0, 0.7)',
                        'transform': 'translate(-50%, -50%)',
                        'left': `${xPos}%`,
                        'top': `${dotPos}%`,
                        'z-index': '2'
                    }).appendTo(fretboard);
                }
            });

            // Add strings based on instrument
            if (cagedCurrentInstrument === 'guitar') {
                // Add 6 strings for guitar
                const guitarStrings = ['E', 'A', 'D', 'G', 'B', 'e'];

                for (let i = 0; i < 6; i++) {
                    const stringTop = 85 - (i * 70 / 6);

                    // Create string line
                    const string = $('<div class="caged-string"></div>');
                    string.css('top', `${stringTop}%`);
                    string.attr('data-string', guitarStrings[i]);
                    string.attr('data-string-num', i + 1); // 1=E, 2=A, etc.

                    // Add string label with white round background
                    const stringLabel = $('<div></div>').css({
                        'position': 'absolute',
                        'width': '18px',
                        'height': '18px',
                        'border-radius': '50%',
                        'background-color': 'white',
                        'display': 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'font-weight': 'bold',
                        'font-size': '12px',
                        'color': '#333',
                        'box-shadow': '0 1px 2px rgba(0,0,0,0.2)',
                        'z-index': '3',
                        'left': '4px',
                        'top': `${stringTop}%`,
                        'transform': 'translateY(-50%)'
                    }).text(guitarStrings[i]);

                    fretboard.append(string);
                    fretboard.append(stringLabel);
                }

                // Update to show current guitar shape
                updateCagedFretboard();
            }
        }

        // Update CAGED fretboard with current settings
        function updateCagedFretboard() {
            const fretboard = $('#caged-fretboard');

            // Remove existing shapes
            fretboard.find('.caged-shape').remove();

            // Get the root note index (0-11)
            const rootIndex = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(cagedCurrentRoot);

            if (cagedCurrentInstrument === 'guitar') {
                updateGuitarCagedFretboard(fretboard, rootIndex);
            }
        }

        // Update guitar CAGED visualization
        function updateGuitarCagedFretboard(fretboard, rootIndex) {
            // CAGED system chord shapes
            const cShapePositions = calculateShapePositions('C', rootIndex);
            const aShapePositions = calculateShapePositions('A', rootIndex);
            const gShapePositions = calculateShapePositions('G', rootIndex);
            const eShapePositions = calculateShapePositions('E', rootIndex);
            const dShapePositions = calculateShapePositions('D', rootIndex);

            // Display the appropriate shape(s)
            if (cagedCurrentShape === 'all') {
                addShapeToFretboard(fretboard, cShapePositions, 'C');
                addShapeToFretboard(fretboard, aShapePositions, 'A');
                addShapeToFretboard(fretboard, gShapePositions, 'G');
                addShapeToFretboard(fretboard, eShapePositions, 'E');
                addShapeToFretboard(fretboard, dShapePositions, 'D');
            } else {
                // Show selected shape
                const positions = {
                    'C': cShapePositions,
                    'A': aShapePositions,
                    'G': gShapePositions,
                    'E': eShapePositions,
                    'D': dShapePositions
                }[cagedCurrentShape];

                addShapeToFretboard(fretboard, positions, cagedCurrentShape);
            }
        }


        // Calculate positions for a guitar CAGED shape
        function calculateShapePositions(shape, rootIndex) {
            // Define the chord shapes in terms of finger positions
            // [string, fret, note_type] where note_type is: 1=root, 3=third, 5=fifth
            // String numbers: 1=E(bottom), 2=A, 3=D, 4=G, 5=B, 6=e(top)
            const baseShapes = {
                'C': [
                    [2, 3, 1], // Root on A string
                    [3, 2, 5], // 5th on D string
                    [4, 0, 3], // 3rd on G string
                    [5, 1, 1], // Root on B string
                    [6, 0, 5]  // 5th on e string
                ],
                'A': [
                    [2, 0, 1], // Root on A string
                    [3, 2, 5], // 5th on D string
                    [4, 2, 1], // Root on G string
                    [5, 2, 3], // 3rd on B string
                    [6, 0, 5]  // 5th on e string
                ],
                'G': [
                    [1, 3, 1], // Root on E string
                    [2, 2, 3], // 3rd on A string
                    [3, 0, 5], // 5th on D string
                    [4, 0, 1], // Root on G string
                    [5, 0, 3], // 3rd on B string
                    [6, 3, 1]  // Root on e string
                ],
                'E': [
                    [1, 0, 1], // Root on E string
                    [2, 2, 5], // 5th on A string
                    [3, 2, 1], // Root on D string
                    [4, 1, 3], // 3rd on G string
                    [5, 0, 5], // 5th on B string
                    [6, 0, 1]  // Root on e string
                ],
                'D': [
                    [3, 0, 1], // Root on D string
                    [4, 2, 5], // 5th on G string
                    [5, 3, 1], // Root on B string
                    [6, 2, 3]  // 3rd on e string
                ]
            };

            // Calculate fret offset based on root note
            let fretOffset = 0;

            switch(shape) {
                case 'C':
                    fretOffset = (rootIndex - 0 + 12) % 12; // C shape: root on A string 3rd fret is C
                    break;
                case 'A':
                    fretOffset = (rootIndex - 9 + 12) % 12; // A shape: root on E string open is A
                    break;
                case 'G':
                    fretOffset = (rootIndex - 7 + 12) % 12; // G shape: root on E string 3rd fret is G
                    break;
                case 'E':
                    fretOffset = (rootIndex - 4 + 12) % 12; // E shape: root on E string open is E
                    break;
                case 'D':
                    fretOffset = (rootIndex - 2 + 12) % 12; // D shape: root on D string open is D
                    break;
            }

            // Get positions with fret offset applied
            let adjustedPositions = baseShapes[shape].map(pos => {
                const [string, fret, noteType] = pos;
                return [string, (fret + fretOffset) % 12, noteType];
            });

            // Add duplicate positions at fret 12 for any notes at fret 0
            // This ensures that open string notes also appear at the octave
            let octavePositions = [];
            adjustedPositions.forEach(pos => {
                const [string, fret, noteType] = pos;
                if (fret === 0) {
                    octavePositions.push([string, 12, noteType]);
                }
            });

            // Combine the original positions with octave positions
            return [...adjustedPositions, ...octavePositions];
        }


        // Add a guitar chord shape to the fretboard
        function addShapeToFretboard(fretboard, positions, shape) {
            // Colors for different note types
            const noteColors = {
                1: '#ff5252', // Root - red
                3: '#2196f3', // 3rd - blue
                5: '#4caf50'  // 5th - green
            };

            // Add each note in the shape
            positions.forEach(pos => {
                const [stringIndex, fret, noteType] = pos;

                // Convert string index to actual string number based on our new string layout
                // In our layout: 1=E(bottom), 2=A, 3=D, 4=G, 5=B, 6=e(top)
                // This directly maps to the stringElements array since we've reordered the strings

                // Find the string position
                const stringElements = fretboard.find('.caged-string');
                const stringElement = $(stringElements[stringIndex - 1]);
                if (stringElement.length === 0) return; // Skip if string not found

                const stringPosition = stringElement.css('top');

                // Create the note element
                const note = $('<div class="caged-shape"></div>');
                note.css({
                    'background-color': noteColors[noteType],
                    'left': `${(fret * (100 / 13)) + ((100 / 13) / 2)}%`,
                    'top': stringPosition
                });

                // Add root note styling
                if (noteType === 1) {
                    note.addClass('caged-root');
                }

                // Add note text inside the circle
                if (noteType === 1) {
                    note.text('R');
                } else if (noteType === 3) {
                    note.text('3');
                } else if (noteType === 5) {
                    note.text('5');
                }

                // Add shape info to the note
                note.attr('data-shape', shape);
                note.attr('data-string', stringIndex);
                note.attr('data-fret', fret);

                // Add tooltip
                const noteNames = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
                const rootNoteName = noteNames[['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(cagedCurrentRoot)];

                let noteName;
                if (noteType === 1) {
                    noteName = rootNoteName;
                } else if (noteType === 3) {
                    // Calculate major 3rd (4 semitones up)
                    const thirdIndex = (['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(cagedCurrentRoot) + 4) % 12;
                    noteName = noteNames[thirdIndex];
                } else if (noteType === 5) {
                    // Calculate perfect 5th (7 semitones up)
                    const fifthIndex = (['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(cagedCurrentRoot) + 7) % 12;
                    noteName = noteNames[fifthIndex];
                }

                note.attr('title', `${noteName} (${noteType === 1 ? 'Root' : noteType === 3 ? '3rd' : '5th'})`);

                // Add to fretboard
                fretboard.append(note);
            });
        }

        // Initialize all visualizations
        function initAllVisualizations() {
            try {
                // Initialize all visualizations - to be called once at setup
                    initPianoVisualization();
                    initBassVisualization();
                    initGuitarVisualization();
                    initTrebleVisualization();
                    initBassClefVisualization();

                // Initialize CAGED and pattern fretboard
                initCagedFretboard();
            } catch (error) {
                console.error("Error initializing visualizations:", error);
            }
        }

        restoreSelections();

        // Initialize everything on document ready
        try {
            // Create a global tooltip element that will be used by all visualizations
            if ($('#global-tooltip').length === 0) {
                $('body').append('<div id="global-tooltip" class="note-tooltip"></div>');
            }

            // Make tooltip appear above everything else
            $('#global-tooltip').css({
                'position': 'fixed',
                'z-index': 9999,
                'pointer-events': 'none'
            });

            // Initialize and show the first visualization (piano)
            initAllVisualizations();
            updateScaleNotesDisplay();

            // Ensure piano tooltips are working on initial load

        } catch (error) {
            console.error("Error during initialization:", error);
            $('#scale-notes').html(`Error initializing: ${error.message}`);
        }

        // Update all visualizations when something changes
        function updateAllVisualizations() {
            try {
                // Update the relevant visualization based on the current one
                switch(currentVisualization) {
                    case 'piano':
                        updatePianoVisualization();
                        break;
                    case 'bass':
                        updateBassVisualization();
                        break;
                    case 'guitar':
                        updateGuitarVisualization();
                        break;
                    case 'treble':
                        updateTrebleVisualization();
                        break;
                    case 'bass-clef':
                        updateBassClefVisualization();
                        break;
                    default:
                        console.error("Unknown visualization type:", currentVisualization);
                }
                refreshNoteAccess();
                syncControls();
            } catch (error) {
                console.error("Error updating visualizations:", error);
            }
        }

        // Helper function to determine if a color needs black text for better contrast
        function needsBlackText(color) {
            // Check if the color is yellow, red, or orange with 1.0 opacity
            return color.includes('255, 255, 0, 1.0') || // Yellow
                   color.includes('255, 0, 0, 1.0') ||   // Red
                   color.includes('255, 165, 0, 1.0');   // Orange
        }

        function noteDetails(element) {
            const note = $(element);
            return note.data('note-info') || note.attr('title') || note.data('title') ||
                `${note.attr('data-note') || note.text().trim()} — outside the selected scale`;
        }
        function refreshNoteAccess() {
            $(noteSelector).each(function() {
                const info = noteDetails(this);
                const visual = this.closest('.piano-visual, .bass-visual, .guitar-visual, .treble-visual, .bass-clef-visual');
                const visible = !visual || visual.classList.contains('active');
                $(this).attr({ role: 'button', tabindex: visible ? '0' : '-1', 'aria-label': info,
                    'aria-describedby': this.closest('#caged-fretboard') ? 'caged-note-details' : 'note-details' });
            });
        }
        function syncControls() {
            $(controlSelector).each(function() {
                $(this).attr('aria-pressed', this.classList.contains('active') ? 'true' : 'false');
            });
            $('.piano-visual, .bass-visual, .guitar-visual, .treble-visual, .bass-clef-visual').each(function() {
                $(this).attr('aria-hidden', this.classList.contains('active') ? 'false' : 'true');
            });
            $('#selection-link').attr('href', location.href);
        }
        function restoreSelections() {
            const params = new URLSearchParams(location.search);
            const choose = (key, selector, attribute) => {
                const value = params.get(key);
                return $(selector).filter(function() { return this.getAttribute(attribute) === value; }).first();
            };
            const root = choose('root', '.note-btn', 'data-note');
            currentRoot = root.length ? root.attr('data-label') : 'C';
            currentScale = Object.hasOwn(scales, params.get('scale')) ? params.get('scale') : 'major';
            currentAccidental = ['natural', 'flat', 'sharp'].includes(params.get('spelling')) ? params.get('spelling') : 'natural';
            currentVisualization = ['piano', 'bass', 'guitar', 'treble', 'bass-clef'].includes(params.get('instrument')) ? params.get('instrument') : 'piano';
            const cagedRoot = choose('chord', '.caged-chord-select .caged-btn', 'data-root');
            cagedCurrentRoot = cagedRoot.length ? cagedRoot.attr('data-root') : 'C';
            cagedCurrentShape = ['C', 'A', 'G', 'E', 'D', 'all'].includes(params.get('shape')) ? params.get('shape') : 'C';
            const activate = (selector, attribute, value) => $(selector).each(function() {
                $(this).toggleClass('active', this.getAttribute(attribute) === value);
            });
            activate('.note-btn', 'data-label', currentRoot);
            activate('.scale-btn', 'data-scale', currentScale);
            activate('.accidental-btn', 'data-accidental', currentAccidental);
            activate('.viz-btn', 'data-viz', currentVisualization);
            activate('.caged-chord-select .caged-btn', 'data-root', cagedCurrentRoot);
            activate('.caged-shape-select .caged-btn', 'data-shape', cagedCurrentShape);
            $('.piano-visual, .bass-visual, .guitar-visual, .treble-visual, .bass-clef-visual').removeClass('active');
            $(`#${currentVisualization}-viz`).addClass('active');
        }
        function saveSelections() {
            const url = new URL(location.href);
            url.searchParams.set('root', $('.note-btn.active').attr('data-note'));
            url.searchParams.set('scale', currentScale);
            url.searchParams.set('spelling', currentAccidental);
            url.searchParams.set('instrument', currentVisualization);
            url.searchParams.set('chord', cagedCurrentRoot);
            url.searchParams.set('shape', cagedCurrentShape);
            try { history.replaceState(null, '', url); } catch (error) { /* Some file:// browsers restrict history. */ }
            syncControls();
        }
        function showNoteDetails(element) {
            $(element.closest('#caged-fretboard') ? '#caged-note-details' : '#note-details').text(noteDetails(element));
        }
        $(document).on('click.noteAccess focusin.noteAccess', noteSelector, function() {
            showNoteDetails(this);
        }).on('keydown.noteAccess', noteSelector, function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                showNoteDetails(this);
            } else if (event.key === 'Escape') {
                $('#note-details, #caged-note-details').text('Select a note to see its details.');
                $('#global-tooltip').css('opacity', 0);
            }
        }).on('mouseenter.noteAccess', noteSelector, function(event) {
            const tooltip = $('#global-tooltip');
            tooltip.text(noteDetails(this)).css('opacity', 1);
            const rect = this.getBoundingClientRect();
            tooltip.css({ left: `${Math.max(8, Math.min(rect.left, innerWidth - tooltip.outerWidth() - 8))}px`,
                top: `${Math.max(8, rect.top - tooltip.outerHeight() - 8)}px` });
        }).on('mouseleave.noteAccess', noteSelector, function() {
            $('#global-tooltip').css('opacity', 0);
        }).on('click.selection', controlSelector, function() {
            $('#global-tooltip').css('opacity', 0);
            $('#note-details, #caged-note-details').text('Select a note to see its details.');
            saveSelections();
        });
        window.addEventListener('popstate', () => {
            restoreSelections();
            updateScaleNotesDisplay();
            updateCagedFretboard();
            refreshNoteAccess();
        });
        let pendingResize;
        new ResizeObserver(() => {
            cancelAnimationFrame(pendingResize);
            pendingResize = requestAnimationFrame(() => {
                $('#global-tooltip').css('opacity', 0);
                if (currentVisualization === 'treble' || currentVisualization === 'bass-clef') updateAllVisualizations();
            });
        }).observe(document.querySelector('.visualization-container'));
        refreshNoteAccess();
        syncControls();
    });
