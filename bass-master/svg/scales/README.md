# Scale SVG Overlay Files

This directory contains SVG overlays that highlight specific musical scales on various instruments.

## Organization

Each scale is represented by a separate SVG file named according to this pattern:
`{key}{scale-type}.svg`

For example:
- `cmajor.svg` - C Major scale
- `aminor.svg` - A Minor scale
- `gmajor.svg` - G Major scale

## Color Coding

All scales use a consistent color scheme for notes:
- C/Do: Red - rgba(255, 0, 0, 0.3-0.5)
- D/Re: Orange - rgba(255, 165, 0, 0.3-0.5)
- E/Mi: Yellow - rgba(255, 255, 0, 0.3-0.5)
- F/Fa: Green - rgba(0, 128, 0, 0.3-0.5)
- G/Sol: Blue - rgba(0, 0, 255, 0.3-0.5)
- A/La: Indigo - rgba(75, 0, 130, 0.3-0.5)
- B/Ti: Violet - rgba(143, 0, 255, 0.3-0.5)

For accidentals (flats/sharps), use the same color as the note they're derived from.

## Context-Aware Visualization Groups

Each SVG file is divided into specific visualization groups that are shown or hidden based on the currently active panel:

1. `piano-highlights` - Shown when piano keyboard is active
2. `bass-highlights` - Shown when bass fretboard is active
3. `treble-highlights` - Shown when treble clef is active
4. `bass-clef-highlights` - Shown when bass clef is active

The JavaScript code (`script.js`) determines which group to display based on the active panel.

## Adding New Scales

1. Duplicate an existing SVG file with similar structure
2. Rename according to the naming convention
3. Update the scale notes in the SVG comment at the top
4. Adjust the highlighted elements in each of the four sections:
   - Piano keyboard (`piano-highlights`)
   - Bass fretboard (`bass-highlights`)
   - Treble clef notation (`treble-highlights`)
   - Bass clef notation (`bass-clef-highlights`)
5. Add the appropriate class to CSS in `output.css`
6. Add the corresponding div in `index.html`

## SVG Structure

Each scale SVG contains four main sections:
1. Piano keyboard overlay
2. Bass/guitar fretboard overlay
3. Treble clef notation overlay
4. Bass clef notation overlay

With this structure, scales will be context-aware, meaning they'll only show the relevant visualization for the currently active panel. 