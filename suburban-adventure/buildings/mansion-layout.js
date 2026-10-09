// Nine chambers, offset doorways, a circular route and a secluded treasury.
export const MANSION_ROOMS = [
    ['Drawing room', 'Entrance hall', 'Music salon'],
    ['Library', 'Portrait gallery', 'Dining room'],
    ['Treasury', 'Throne room', 'Winter garden']
];
export const MANSION_CONNECTIONS = [
    [1, 0], [0, 3], [3, 4], [4, 7], [7, 6], [7, 8], [8, 5], [5, 2], [2, 1]
];
export const roomCenter = id => ({ x: (id % 3 - 1) * 16, z: (1 - Math.floor(id / 3)) * 16 });
const connected = (a, b) => MANSION_CONNECTIONS.some(edge => edge.includes(a) && edge.includes(b));
export const getMansionWalls = () => {
    const walls = [];
    const add = (x, z, width, depth) => walls.push({ x, z, width, depth });
    const divide = (vertical, fixed, center, opening) => {
        if (opening === null) {
            add(vertical ? fixed : center, vertical ? center : fixed, vertical ? .4 : 16, vertical ? 16 : .4);
            return;
        }
        const lo = center - 8, hi = center + 8, doorLo = opening - 2, doorHi = opening + 2;
        for (const [a, b] of [[lo, doorLo], [doorHi, hi]])
            add(vertical ? fixed : (a + b) / 2, vertical ? (a + b) / 2 : fixed,
                vertical ? .4 : b - a, vertical ? b - a : .4);
    };
    add(-24, 0, .4, 48); add(24, 0, .4, 48); add(0, -24, 48, .4);
    add(-13, 24, 22, .4); add(13, 24, 22, .4);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) {
        const id = row * 3 + col, center = roomCenter(id);
        divide(true, center.x + 8, center.z, connected(id, id + 1) ? center.z + (row % 2 ? -3 : 3) : null);
    }
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
        const id = row * 3 + col, center = roomCenter(id);
        divide(false, center.z - 8, center.x, connected(id, id + 3) ? center.x + (col % 2 ? 3 : -3) : null);
    }
    return walls;
};

// Substeps prevent sprinting through thin walls; resolve axes separately to slide along them.
export const resolveInteriorMovement = (start, target, obstacles, radius = .45) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(target.x - start.x, target.z - start.z) / .2));
    const dx = (target.x - start.x) / steps, dz = (target.z - start.z) / steps;
    const result = { x: start.x, z: start.z };
    const blocked = (x, z) => obstacles.some(o => x > o.x - o.width / 2 - radius && x < o.x + o.width / 2 + radius
        && z > o.z - o.depth / 2 - radius && z < o.z + o.depth / 2 + radius);
    for (let i = 0; i < steps; i++) {
        if (!blocked(result.x + dx, result.z)) result.x += dx;
        if (!blocked(result.x, result.z + dz)) result.z += dz;
    }
    return result;
};
