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
- Touch devices: left stick moves, right stick looks, HOLD TO RUN sprints. The center button changes to TALK, INSPECT, ENTER, EXIT, TRAVEL, or CONTINUE. Each control tracks its own finger. The × button ends a conversation.
- The phone pauses movement and gameplay actions. It contains discoveries, exploration hints, and a soundtrack player. Playback starts only when the player presses play. The included soundtrack files are independent of discovered song titles; add an explicit title-to-file mapping before tying playback to rewards.

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
- `/tests/browser.html?mobile`: the same suite with simulated touch capability, pointer cancellation, multitouch ownership, sprint release, and modal reset checks.
- `/tests/mobile-preview.html`: touch-control layout preview on a desktop browser.

Run the browser suites one at a time. They temporarily use fixture saves and restore the origin's previous saved data afterward. Test in portrait (320×568 and 390×844) and landscape (844×390). The synthetic pointer tests stub pointer capture; they do not substitute for real iOS/Android testing.

On real phones, check three-finger move/look/run, finger cancellation while switching apps, opening and scrolling the phone, rotating during movement, reward dismissal, and repeated indoor/subway travel. Verify audio playback and volume on both Safari and Chrome.
