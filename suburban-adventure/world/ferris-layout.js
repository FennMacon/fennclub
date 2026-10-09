// One hinge per rim station. Cart geometry hangs below that hinge.
export const FERRIS = { x: -25, z: -40, radius: 12, pivotHeight: 14.4, count: 16, rimOffset: 1.3, hangerDrop: 1.55, speed: 0.48 };
export function sampleFerrisAnchor(index) {
    const angle = index * Math.PI * 2 / FERRIS.count;
    return { angle, y: Math.cos(angle) * FERRIS.radius, z: Math.sin(angle) * FERRIS.radius };
}
