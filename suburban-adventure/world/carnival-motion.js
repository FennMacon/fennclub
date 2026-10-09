// Game-scale models based on Chance product sheets; unspecified timing is artistic.
export const CARNIVAL_ADDITIONS = [
    { kind: 'fury', name: "Pharaoh’s Fury", x: -10, z: 72, rotation: Math.PI, radius: 16, contentId: 'CARNIVAL_FURY' },
    { kind: 'freestyle', name: 'Freestyle', x: 0, z: -80, radius: 14, contentId: 'CARNIVAL_FREESTYLE' },
    { kind: 'wipeout', name: 'Wipeout', x: -77, z: -20, radius: 12, contentId: 'CARNIVAL_WIPEOUT' },
    { kind: 'carousel', name: 'Carousel', x: 12, z: 44, rotation: Math.PI, radius: 6, contentId: 'CARNIVAL_CAROUSEL' },
    { kind: 'yoyo', name: 'Yo-Yo', x: 35, z: -35, radius: 11, contentId: 'CARNIVAL_YOYO' }
];
export function sampleRideMotion(kind, time) {
    const rpm = value => time * value * Math.PI / 30;
    switch (kind) {
        case 'fury': return { swing: Math.sin(time * 0.62) * 1.12 };
        case 'freestyle': return { turret: rpm(10), rim: -rpm(22), tilt: (32 + 18 * Math.sin(time * 0.16)) * Math.PI / 180 };
        case 'wipeout': return { turret: rpm(2.5), rim: -rpm(9), tilt: (20 + 12 * Math.sin(time * 0.24)) * Math.PI / 180 };
        case 'carousel': return { spin: rpm(6.5), bob: time * 1.7 };
        case 'yoyo': return { spin: -rpm(8), flare: Math.atan((8 * Math.PI / 30) ** 2 * 5.2 / 9.81) };
        default: throw new Error(`Unknown carnival ride: ${kind}`);
    }
}
