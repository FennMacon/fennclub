# Suburban Adventure

A browser exploration game built with Three.js: meet neighbors, discover songs and objects, and travel between the suburbs and Allston.

## Run locally

Requires Python 3. Node.js is needed for the automated checks. There are no npm dependencies to install.

```sh
npm start
```

Open http://127.0.0.1:8765. Alternatively, run `python3 -m http.server 8765 --bind 127.0.0.1`. Serve the files over HTTP; opening `index.html` directly does not support module and content loading. Three.js is pinned to 0.160.0 and loaded from unpkg, so the first load needs internet access.

## Controls

- Desktop: WASD/arrows move, mouse drag looks, Shift runs, Space interacts, F opens the phone, Escape closes it or ends a conversation. Q/E adjust camera height.
- Touch devices: left stick moves, right stick looks, RUN above the right stick toggles running. The center button changes to TALK, INSPECT, ENTER, EXIT, TRAVEL, or CONTINUE. Each control tracks its own finger. The × button ends a conversation.
- The phone pauses movement and gameplay actions. It contains discoveries, exploration hints, and a soundtrack player. Tap an unlocked song to play or pause it. `music/catalog.json` maps the original dialogue titles to recordings; each MP3 temporarily backs two rewards. The unrestricted dropdown has been removed. Playback continues through phone closure and travel.

## Project layout

- `bootstrap.js`: startup failure and retry UI.
- `main.js`: camera, input routing, travel, onboarding, and the running game.
- `world-runtime.js`: reusable scene construction and resource disposal. Travel retains the renderer, audio player, content cache, and animation loop.
- `world/zone-scene.js`: ground and populated street zones.
- `world/landmarks.js`, `transport.js`, `streaming.js`, `config.js`: landmarks, roads/vehicles, distance-based scenery, and shared layout data.
- `buildings.js`: facades, exterior props, and shared effects. `buildings/` contains individual interiors and their registry.
- `controls.js`, `mobile-controls.js`: keyboard/mouse and pointer-based touch controls.
- `dialogue.js`, `npcs.js`, `content-loader.js`: conversations, proximity, rewards, and editable text.
- `phone-ui.js`, `game.css`: phone, journal, audio, and responsive controls.
- `storage.js`: validated camera positions and persistence with an in-memory fallback when browser storage is blocked/full.

See `content/README.txt` for content editing. `UNLOCKS` awards a song; headers identify location keys from `scenes.js`. Failed content requests report diagnostics and use embedded fallback dialogue when available.

## Verify changes

```sh
npm test
npm run check
```

The tests cover dialogue/flavor parsing, concurrent loading, fallback content, rewards, corrupt saved positions, blocked storage, and soundtrack file availability. Module checks validate syntax and local import paths.

With the server running, open:

- `/tests/browser.html`: browser regression suite, including all 15 interiors and subway round trips.
- `/tests/browser.html?mobile`: the same suite with simulated touch capability, pointer cancellation, multitouch ownership, run toggle, and modal reset checks.
- `/tests/mobile-preview.html`: touch-control layout preview on a desktop browser.

Run the browser suites one at a time. They temporarily use fixture saves and restore the origin's previous saved data afterward. Test in portrait (320×568 and 390×844) and landscape (844×390). The synthetic pointer tests stub pointer capture; they do not substitute for real iOS/Android testing.

On real phones, check simultaneous move/look with running toggled on, finger cancellation while switching apps, opening and scrolling the phone, rotating during movement, reward dismissal, and repeated indoor/subway travel. Verify audio playback and volume on both Safari and Chrome.

## Zipper model

`world/zipper.js` builds the portable trailer, A-frame, oblong truss, end pulleys and 12 enclosed capsules. `world/zipper-motion.js` uses a constant-speed stadium cable path and a boom rotating in the same vertical plane. Each capsule has one off-center hinge, driven by gravity and the acceleration of its moving anchor, integrated at a fixed step. This is a visual approximation, not an engineering simulation. Boom/cable speeds follow the Chance Rides specification (7.5/4 RPM).

Open `/tests/zipper-preview.html` to inspect the isolated ride from the front or at an angle, with pause/resume controls. See `MUSIC-IMPLEMENTATION.md` for the discovered-song player design and provisional title-to-recording mapping.

Carnival: eight animated rides, including Chance-inspired Pharaoh’s Fury, Freestyle, Wipeout, carousel, and Yo-Yo. See CARNIVAL-IMPLEMENTATION.md for sources and /tests/carnival-preview.html for the animated preview.

Suburb layout (north at top): river / Forest Suburban Plaza / mansion; river / Massachusetts Plaza / carnival; river and subway / pond / forest clearings. The outer columns are now west river and east landmarks. /tests/suburban-map-preview.html shows the layout from the live configuration.

The northeast mansion sits deep in the woods, reached by a narrow winding dirt trail from the road. Its sheltered courtyard, gate, and garage sit together near the house.

The woodland mansion faces its courtyard and has an enterable regal interior: nine chambers joined by offset doorways, including a library, portrait gallery, throne room, and secluded treasury. Interior walls block movement on desktop and mobile; the front doors return to the courtyard facing the woodland trail. Preview it at `/tests/mansion-interior-preview.html`.

Floating candles light every mansion chamber. Woodland trails share smooth, uneven dirt ribbons and matching tree clearance; pond approaches now join the road correctly. The southeast woods contain seven developed clearings and fourteen discoveries along two branching trail systems. Preview the woods and pond at `/tests/woodland-preview.html`.

For area testing, press **1–9** (top row or numpad) to teleport to the current map’s section centers. Read the grid left to right, north to south: **1 river / 2 north plaza / 3 mansion; 4 river / 5 main plaza / 6 carnival; 7 river and subway / 8 pond / 9 forest clearings**. The same grid order works in the city. Shortcuts also leave interiors, and are disabled while using the phone, talking, or typing.

`npm run check` regenerates the production import map using a content hash of all runtime modules. Commit the generated `index.html` with each release so browsers load one consistent revision. Startup failures expose error details and offer a fresh-page retry.
