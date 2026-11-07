import { suburbanRoadDefinitions } from './suburban-road-layout.js';

export const TREE_SIDEWALK_BUFFER = 0.75;

// Maximum X/Z reach in createTree, including random branch offsets and sizes.
// A square envelope is conservative at corners and remains valid when a tree respawns.
export const treeCanopyHalfWidth = (species, scale) => {
    switch (species) {
        case 'Eastern White Pine': return 2.2 * scale;
        case 'Red Maple': return 3.5 * scale + 0.5;
        case 'Northern Red Oak': return 5.2 * scale;
        case 'Eastern Hemlock': return 2.75 * scale;
        case 'Red Pine': return 2.55 * scale;
        case 'American Beech': return 3.05 * scale;
        default: throw new Error(`Unknown tree species: ${species}`);
    }
};

const roadCorridors = suburbanRoadDefinitions().map(road => {
    const halfWidth = road.width / 2 + road.sidewalk;
    return road.axis === 'x'
        ? { left: road.min, right: road.max, front: road.coordinate - halfWidth, back: road.coordinate + halfWidth }
        : { left: road.coordinate - halfWidth, right: road.coordinate + halfWidth, front: road.min, back: road.max };
});

export const treeClearsSuburbanSidewalks = (x, z, halfWidth) => {
    const reach = halfWidth + TREE_SIDEWALK_BUFFER;
    return roadCorridors.every(road =>
        x + reach < road.left || x - reach > road.right ||
        z + reach < road.front || z - reach > road.back);
};
