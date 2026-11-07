# Whole-game review — November 7, 2026

The next useful investment is connecting the existing world: reliable interactions, readable destinations, better memories of discoveries, and a short story with a payoff. Preserve the wireframe look, abstract storefront signs, atmospheric fog, and organic woodland/carnival layouts.

This was a source review plus inspection of the live opening and phone. The latest implementation checks passed 37 unit tests, 33 desktop checks, and 36 simulated-mobile checks before this review. Those checks do not cover long sessions, stalled network requests, real phone performance, or the experience of a first-time player. No gameplay code was changed during this review.

## Fix first: confirmed problems

1. **Make prompts and actions agree.** Front-shop prompts appear within 6 units, but entering requires less than 5. Some city and mansion prompts use an outdated destination table and can say “Downtown” even though the action enters the correct interior. Multiple proximity prompts can overlap, and targets behind the player can take priority. Use one shared interaction resolver for display, desktop input, and mobile input, with a common radius, a facing preference, and one selected target. Evidence: [prompt selection](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/npcs.js:397>), [duplicate destination table](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/npcs.js:478>), and [action selection](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/main.js:259>). The opening inspection showed a Hospital prompt while looking across the road at the karaoke building.

2. **Keep optional music from blocking startup.** The catalog request has no abort timeout, while startup awaits it before constructing the neighborhood. A request that never settles can leave the loading screen indefinitely. Let exploration start while music loads; timeout and retry the optional catalog. Evidence: [music-library.js:17](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/music-library.js:17>) and [main.js:232](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/main.js:232>). Dialogue/content requests already have a timeout in [content-loader.js:157](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/content-loader.js:157>).

3. **Repair traffic retirement and temporary graphics cleanup.** Vertical cars move toward the opposite limits from the ones used by their retirement checks. An isolated execution of the actual function confirmed that vertical cars pass ±500 without removal; they remain counted toward the traffic cap. Retired horizontal cars and replaced item-glow materials also lose their references without disposing their graphics resources. Fix retirement and pool or dispose those resources. Evidence: [animation.js:124–137](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/animation.js:124>), [npcs.js:789–806](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/npcs.js:789>). A longer-session regression should cover both traffic directions and repeated approach/leave cycles.

4. **Blend suburban fog at actual boundaries.** The current calculation blends within 90 units of zone centers, although neighboring centers are 333 units apart. It therefore blends in the wrong region and can snap at the radius threshold and the real border. Blend using the relative distances to neighboring centers, preserving the current colors and density. Evidence: [fog.js:81–85](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/fog.js:81>) and [scenes.js:43–52](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/scenes.js:43>).

5. **Cull signs with their city blocks.** Building chunks are hidden by distance, but storefront signs are attached directly to the root and bypass that culling. Each sign adds line geometry and two textured label meshes. Fog conceals them visually but does not eliminate their render submissions. Put signs into the associated visibility groups. Evidence: [world/city-districts.js:85](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/world/city-districts.js:85>), `150–162`; [world/city-signs.js:29–35](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/world/city-signs.js:29>). This is an optimization opportunity; its frame-rate benefit has not been measured.

## Make exploration easier to read

6. **Add a small discovery map and useful journal to the phone.** Show the current district, an optional sketch of the nine areas, discovered landmarks, visited businesses, and the last concrete lead. Store discovery descriptions and locations as well as names so players can reread clues. Keep unexplored areas vague. The current phone only shows the global map name, a generic instruction paragraph, song titles, and object names ([phone-ui.js:377–409](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/phone-ui.js:377>)).

7. **Distinguish usable doors and visible discoveries.** Generated lots have similar door geometry whether or not they are enterable. Give usable thresholds a restrained light or distinctive wireframe detail. Nine city district observations are empty groups, so there is no visible object for a player to notice or for the glow system to highlight. Attach those observations to a bench, poster, radio, or other recognizable prop. Evidence: [world/city-districts.js:89–114](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/world/city-districts.js:89>).

8. **Improve travel and returning sessions.** Buses currently cycle through the three center stops. Offer a choice among discovered destinations, including on mobile. Save a validated safe location and view direction at useful checkpoints, and provide a return-to-last-safe-place action. Current restoration consumes transition positions and does not save normal walking position ([main.js:176–214](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/main.js:176>)). Keep the requested 1–9 inspection shortcuts available for testing.

9. **Add simple traversal limits carefully.** Outdoor movement currently has no building-footprint collision or map-edge bounds; most ordinary interiors only clamp the perimeter. The mansion already has proper room collision. Add coarse exterior footprints and soft map boundaries, keeping doors, alleys, and trails passable. Preserve a developer mode for freely inspecting the world. Evidence: [controls.js:103–114](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/controls.js:103>).

10. **Offer visibility and control adjustments.** Add brightness, text size, look sensitivity, and an accessible controls reminder. Use local entrance lights, strong landmark silhouettes, and eventually spatial sound cues to guide players through the fog. Keep these adjustments optional so the nighttime atmosphere remains intentional. This is a design recommendation, not a measured accessibility test result.

## Give the existing places a purpose

11. **Build a small, finishable farewell-compilation story.** The premise already exists: Rex says developers are replacing the plaza with condos; Theo proposes a farewell mix and a meeting at the karaoke stage; Clara talks about demonstrating what the plaza means. Maya is the onboarding destination but does not currently introduce that goal. Suggested arc:
    - Maya asks the player to help make tonight’s compilation.
    - Collect a handful of meaningful contributions from the plaza, Allston, and the woods, in flexible order.
    - Bring the contributions to the stage and choose a short setlist.
    - Hold a farewell performance and let neighbors respond afterward.

    Avoid requiring every interior or imposing a timer. “Plaza Finale” is currently awarded by an ordinary conversation, so give that reward a real completion event. Evidence: [content/dialogue/Rex.txt](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/content/dialogue/Rex.txt>), `Theo.txt`, `Clara.txt`, and `Maya.txt`; progression currently stores songs and encountered item names in [dialogue.js](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/dialogue.js>).

12. **Add people and memorable encounters before more city buildings.** The current plan has 440 buildings, 321 retail lots, and 121 enterable buildings. City exteriors currently have no configured NPC branches, and most generated shop interiors lack configured residents. Start with one authored encounter or activity per district, prioritizing the rehearsal hall, food blocks, and community garden. Let generated shops provide atmosphere around those destinations. Evidence: [npcs.js:74–171](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/npcs.js:74>), [world-runtime.js:119](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/world-runtime.js:119>), [world/city-districts.js:91](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/world/city-districts.js:91>).

13. **Finish one carnival activity.** Ride entrances and game counters currently provide inspection text. Ring Toss describes three tries for a prize, but no playable game exists. A small ring-toss game with a souvenir would vary the pace; a seated Ferris-wheel ride could later provide a scenic reward. Start with one polished interaction. Evidence: [world/carnival-midway.js:133](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/world/carnival-midway.js:133>), [world/landmarks.js:202](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/world/landmarks.js:202>), and [content/flavor/carnival.txt:26](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/content/flavor/carnival.txt:26>).

14. **Connect the woods and mansion through an optional mystery.** The repeated-time timetable, sealed invitation, empty plinth, silent piano, and empty treasury case are strong existing ingredients. Let a few clues lead to a sequence at the piano that reveals an unusual recording. Keep the explanation ambiguous and this branch optional. Evidence: [content/flavor/clearings.txt:57–85](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/content/flavor/clearings.txt:57>), [buildings/mansion-interior.js:30–51](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/buildings/mansion-interior.js:30>).

15. **Let completed conversations change.** Conversations currently restart at step zero; reward deduplication does not make the dialogue respond to completion. Add a short return greeting, a lead to another person, and a post-show response. This gives discoveries consequences without requiring a large branching-dialogue system. Evidence: [dialogue.js:430](</Users/fennmacon/Documents/Web/Fenn Club/suburban-adventure/dialogue.js:430>) and `499`.

The provisional two-song-titles-per-MP3 mapping was explicitly requested and is not a defect. More recordings or named alternate versions can be a later content pass.

## Recommended implementation order

1. Interaction consistency, startup timeout, graphics cleanup, traffic, fog transitions, and sign culling.
2. Phone map/journal, usable-door cues, safe resume points, and transit choices.
3. A complete compilation story using a small selection of existing characters and locations.
4. One carnival game and the optional woodland/mansion mystery, then more district encounters.

For distribution reliability, also consider shipping the existing pinned Three.js build with the project instead of requiring the CDN on a first load. Keep the current runtime revision mechanism and expand tests around the concrete gaps above.


## Implementation follow-up

The reviewed pass is now implemented: shared interactions, nonblocking music loading, local Three.js assets, traffic/resource cleanup, fog blending, sign culling, visible entrances/discoveries, versioned journal/map/settings/checkpoints, discovered-destination travel, exterior/fixture collision, nine city encounters, a three-contribution farewell performance, ring toss, returning dialogue, the optional piano mystery, and directional landmark sounds. The original art and layouts remain intact. The review above records the problems and design rationale before implementation; see README.md for the resulting play flow and verification instructions.

Final verification: 66 unit tests, 50 desktop browser checks, and 53 simulated-touch mobile browser checks pass. Portrait checks ran at 390×844; phone layouts were also inspected at 320×568. Real iOS/Android testing remains separate from these browser fixtures.
