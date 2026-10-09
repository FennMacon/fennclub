# Carnival expansion
Eight rides surround the central road: the existing Ferris wheel, Zipper and teacups, four additions, and a rebuilt Yo-Yo. Six ride entrance signs and eleven booth counters support INSPECT and the discovery journal. Rides are scenery; boarding remains future work.

## Manufacturer references
- [Pharaoh’s Fury](https://www.chancerides.com/pharaohsfury-portable/): horizontal axle, twin hangers, ten rows in a swinging boat. The model uses a periodic 64° pendulum arc; timing is artistic.
- [Freestyle sheet](https://www.chancerides.com/wp-content/uploads/2025/06/freestyle_portable_spec_sheet_2025_proposed.pdf): 24 outward-facing seats, opposite turret/rim drives at 10/22 RPM, tilt limited to 50°. Structure is simplified at game scale.
- [Wipeout](https://dev.tech.chancerides.com/wipeout/): spinning and tilting disk, face-to-face benches. Ten four-seat sections and timing are a visual approximation of the classic ride, not the current 60-passenger product.
- [Carousel sheet](https://www.chancerides.com/wp-content/uploads/2025/07/20-ft-Carousel-Spec-Sheet_2025.pdf): 14 horses in two rows plus a chariot, approximately 6.3m canopy, counterclockwise at 6.5 RPM. Horse motion is artistic.
- [Yo-Yo](https://www.chancerides.com/yoyo/): 32 chain-hung seats. Only the crown rotates; the tower and platform stay still. Chain flare follows a steady centrifugal/gravity estimate at an artistic 8 RPM.

## Layout and rendering
Positions and reserved radii live in world/carnival-motion.js. Footprints clear the street at z=0–22, other rides, stalls and the tree boundary. Shared low-segment geometry and rigid pieces merged by material reduce draw calls while preserving moving assemblies. No point lights or added external assets.

Open /tests/carnival-preview.html for the whole midway or individual rides, pause and draw-call display. Use entrance signs for discoveries in the game.

## Teacups and themed alleys
Twilight Teacups has six open curved bowls with entry gaps, handles, saucers, benches and handwheels. Cup pivots and the main turntable rotate independently; the perimeter, gate and entrance sign remain stationary. A teapot occupies the center. Motion is artistic.

The Zipper group rotates 180° around Y, putting its front sign toward the road north of it.

Food Alley sits south of the road at x=78, with five vendors. Game Alley sits north at x=-54, with six games. Facing rows leave a seven-unit walking aisle, under overhead bulbs. New Duck Pond, Hoop Shot and Skee Ball discoveries supplement the original stall content. Canopies, prizes and food props are batched by material. Inspection targets sit at the counters, accessible from the aisle at the normal two-unit camera height.

Layout definitions are in world/carnival-midway-layout.js; tests check road, trees, ride clearance and aisle width. The preview offers teacups, both alleys, and the Zipper as seen from the road.
