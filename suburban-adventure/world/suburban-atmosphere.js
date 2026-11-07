export const DAY_LENGTH = 600;
export const INITIAL_DAY_PROGRESS = 0.42;
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = (a, b, value) => { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); };
const mixColor = (a, b, t) => [16, 8, 0].reduce((color, shift) =>
    color | (Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t) << shift), 0);
const phases = [
    { fog: 0x515c75, sky: 0x101a32 },
    { fog: 0xb2a99f, sky: 0x656879 },
    { fog: 0xaab9b6, sky: 0x66889c },
    { fog: 0xa59390, sky: 0x53516b }
];

export const getSuburbanAtmosphere = (progress = INITIAL_DAY_PROGRESS, zoneFog = { color: 0x1a1a2e, near: 40, far: 280 }) => {
    const phase = ((progress % 1) + 1) % 1;
    // Midnight: moon overhead. Dawn: sun rises east (+X). Noon: sun overhead.
    const angle = (phase - 0.25) * Math.PI * 2;
    const sun = { x: Math.cos(angle), y: Math.sin(angle), z: 0 };
    const moon = { x: -sun.x, y: -sun.y, z: 0 };
    const daylight = smooth(-0.12, 0.35, sun.y);
    const index = Math.floor(phase * 4), t = smooth(0, 1, phase * 4 - index);
    const from = phases[index], to = phases[(index + 1) % 4];
    // Keep district character subtle: distant objects and the sky share one horizon color.
    const fogColor = mixColor(mixColor(from.fog, to.fog, t), zoneFog.color, 0.06);
    return {
        phase, sun, moon, daylight, fogColor,
        zenithColor: mixColor(from.sky, to.sky, t),
        sunOpacity: smooth(0, 0.14, sun.y), moonOpacity: smooth(0, 0.12, moon.y),
        starOpacity: 1 - smooth(-0.18, 0.08, sun.y),
        near: Math.min(25, zoneFog.near * 0.55),
        far: Math.min(115, 85 + zoneFog.far * 0.1) - (1 - daylight) * 10,
        exposure: 0.8 + daylight * 0.2
    };
};
