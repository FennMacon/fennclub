import { sampleTrail, nearTrail, POND_TRAILS } from './trail-layout.js';
import { SCENE_CONFIGS } from '../scenes.js';
// world/zone-scene.js - Zone and world creation
import * as THREE from 'three';
import { createTree } from '../utils.js';
import { createParkElements, createTripleDeckerBuilding, createSimpleTower } from '../buildings.js';
import { UNIFIED_MAP_ZONES, UNIFIED_MAP_ZONE_OFFSETS, SUBWAY_POSITIONS } from '../scenes.js';
import { VERTICAL_BOUNDS, SUBURBAN_ZONE_STREET_X_MIN, SUBURBAN_ZONE_STREET_X_MAX, CITY_CONNECTOR_X } from '../roads.js';
import { ZONE_SIZE, STREET_DEPTH, CONNECTOR_ROAD_WIDTH, CONNECTOR_SIDEWALK_DEPTH } from './constants.js';

import { MANSION_CONFIG, getMansionPathSamples, CARNIVAL_CONFIG, FOREST_CLEARINGS, FOREST_TRAILS, RIVER_CONFIG } from './config.js';
const TD_CORE_RADIUS = 100;
const TD_FORWARD_RADIUS = 200;
const TD_LATERAL_SPAN = 140;
const TD_REAR_RADIUS = 80;
const TD_CORE_KEEP = 140;
const TD_FORWARD_KEEP = 240;
const TD_LATERAL_KEEP = 160;
const TD_REAR_KEEP = 110;
const TD_SPAWN_BATCH = 8;
const TD_STEP = 18;
const TD_PROB = 0.38;
const CITY_CORRIDOR_HALF = CONNECTOR_ROAD_WIDTH / 2 + CONNECTOR_SIDEWALK_DEPTH;


const disposeTripleDecker = (mesh) => {
    mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
        }
    });
};

export const createCityTripleDeckers = (scene) => {
    const group = new THREE.Group();
    group.name = "CityTripleDeckers";

    const MAP_X_MIN = -500;
    const MAP_X_MAX = 500;
    const MAP_Z_MIN = -500;
    const MAP_Z_MAX = 500;

    const rect = (left, right, front, back) => ({ left, right, front, back });
    const inRect = (x, z, r) => x >= r.left && x <= r.right && z >= r.front && z <= r.back;

    const exclusions = [];
    CITY_CONNECTOR_X.forEach((connX) => {
        exclusions.push(rect(connX - CITY_CORRIDOR_HALF, connX + CITY_CORRIDOR_HALF, MAP_Z_MIN, MAP_Z_MAX));
    });
    const allHorizontalZ = [11, 166, 344, -166, -322];
    allHorizontalZ.forEach((connZ) => {
        exclusions.push(rect(MAP_X_MIN, MAP_X_MAX, connZ - CITY_CORRIDOR_HALF, connZ + CITY_CORRIDOR_HALF));
    });

    const isExcluded = (wx, wz) => exclusions.some((r) => inRect(wx, wz, r));

    const registry = [];
    for (let wx = MAP_X_MIN; wx <= MAP_X_MAX; wx += TD_STEP) {
        for (let wz = MAP_Z_MIN; wz <= MAP_Z_MAX; wz += TD_STEP) {
            if (isExcluded(wx, wz)) continue;
            if (Math.random() > TD_PROB) continue;
            const x = wx + (Math.random() - 0.5) * 4;
            const z = wz + (Math.random() - 0.5) * 4;
            if (isExcluded(x, z)) continue;

            const rotation = (Math.floor(Math.random() * 4) * Math.PI) / 2;
            registry.push({ x, z, rotation, mesh: null });
        }
    }

    const cameraDir = new THREE.Vector3();
    const inSpawnRegion = (dx, dz, d, dot, lateral, useKeep) => {
        const core = useKeep ? TD_CORE_KEEP : TD_CORE_RADIUS;
        const fwd = useKeep ? TD_FORWARD_KEEP : TD_FORWARD_RADIUS;
        const lat = useKeep ? TD_LATERAL_KEEP : TD_LATERAL_SPAN;
        const rear = useKeep ? TD_REAR_KEEP : TD_REAR_RADIUS;
        return d < core || (dot > 0 && dot < fwd && lateral < lat) || (dot < 0 && d < rear);
    };

    const update = (camera) => {
        const cx = camera.position.x;
        const cz = camera.position.z;
        camera.getWorldDirection(cameraDir);
        const lenXZ = Math.sqrt(cameraDir.x * cameraDir.x + cameraDir.z * cameraDir.z) || 1e-6;
        const dirX = cameraDir.x / lenXZ;
        const dirZ = cameraDir.z / lenXZ;

        const toSpawn = [];
        for (const entry of registry) {
            const dx = entry.x - cx;
            const dz = entry.z - cz;
            const d = Math.sqrt(dx * dx + dz * dz);
            const dot = dx * dirX + dz * dirZ;
            const lateral = Math.sqrt(Math.max(0, d * d - dot * dot));

            const shouldSpawn = inSpawnRegion(dx, dz, d, dot, lateral, false);
            const shouldKeep = inSpawnRegion(dx, dz, d, dot, lateral, true);

            if (entry.mesh) {
                if (!shouldKeep) {
                    group.remove(entry.mesh);
                    disposeTripleDecker(entry.mesh);
                    entry.mesh = null;
                }
            } else if (shouldSpawn) {
                toSpawn.push({ entry, d });
            }
        }

        toSpawn.sort((a, b) => a.d - b.d);
        for (let i = 0; i < Math.min(TD_SPAWN_BATCH, toSpawn.length); i++) {
            const { entry } = toSpawn[i];
            const b = createTripleDeckerBuilding();
            b.position.set(entry.x, 0, entry.z);
            b.rotation.y = entry.rotation;
            entry.mesh = b;
            group.add(b);
        }
    };

    console.log(`🏠 City triple deckers: ${registry.length} positions (step=${TD_STEP}, prob=${TD_PROB}, batch=${TD_SPAWN_BATCH})`);
    scene.add(group);
    return { group, update };
};

/** City map: edge skyscrapers - tall towers in peripheral band, distance-based spawn */
const SKY_EDGE_BAND = 380;
const SKY_STEP = 28;
const SKY_PROB = 0.22;
const SKY_SPAWN_BATCH = 4;
const SKY_COLORS = [0x4a5568, 0x3d4f5f, 0x5a6a7a, 0x3a4a5a];

const disposeTower = (mesh) => {
    mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
        }
    });
};

export const createCitySkyline = (scene) => {
    const group = new THREE.Group();
    group.name = "CitySkyline";

    const MAP_X_MIN = -500;
    const MAP_X_MAX = 500;
    const MAP_Z_MIN = -500;
    const MAP_Z_MAX = 500;

    const rect = (left, right, front, back) => ({ left, right, front, back });
    const inRect = (x, z, r) => x >= r.left && x <= r.right && z >= r.front && z <= r.back;

    const exclusions = [];
    CITY_CONNECTOR_X.forEach((connX) => {
        exclusions.push(rect(connX - CITY_CORRIDOR_HALF, connX + CITY_CORRIDOR_HALF, MAP_Z_MIN, MAP_Z_MAX));
    });
    const allHorizontalZ = [11, 166, 344, -166, -322];
    allHorizontalZ.forEach((connZ) => {
        exclusions.push(rect(MAP_X_MIN, MAP_X_MAX, connZ - CITY_CORRIDOR_HALF, connZ + CITY_CORRIDOR_HALF));
    });

    const isExcluded = (wx, wz) => exclusions.some((r) => inRect(wx, wz, r));
    const inEdgeBand = (x, z) => Math.abs(x) > SKY_EDGE_BAND || Math.abs(z) > SKY_EDGE_BAND;

    const registry = [];
    for (let wx = MAP_X_MIN; wx <= MAP_X_MAX; wx += SKY_STEP) {
        for (let wz = MAP_Z_MIN; wz <= MAP_Z_MAX; wz += SKY_STEP) {
            if (!inEdgeBand(wx, wz)) continue;
            if (isExcluded(wx, wz)) continue;
            if (Math.random() > SKY_PROB) continue;
            const x = wx + (Math.random() - 0.5) * 6;
            const z = wz + (Math.random() - 0.5) * 6;
            if (isExcluded(x, z)) continue;

            const width = 12 + Math.random() * 10;
            const height = 15 + Math.random() * 25;
            const depth = 10 + Math.random() * 8;
            const color = SKY_COLORS[Math.floor(Math.random() * SKY_COLORS.length)];
            registry.push({ x, z, width, height, depth, color, mesh: null });
        }
    }

    const cameraDir = new THREE.Vector3();
    const inSpawnRegion = (dx, dz, d, dot, lateral, useKeep) => {
        const core = useKeep ? TD_CORE_KEEP : TD_CORE_RADIUS;
        const fwd = useKeep ? TD_FORWARD_KEEP : TD_FORWARD_RADIUS;
        const lat = useKeep ? TD_LATERAL_KEEP : TD_LATERAL_SPAN;
        const rear = useKeep ? TD_REAR_KEEP : TD_REAR_RADIUS;
        return d < core || (dot > 0 && dot < fwd && lateral < lat) || (dot < 0 && d < rear);
    };

    const update = (camera) => {
        const cx = camera.position.x;
        const cz = camera.position.z;
        camera.getWorldDirection(cameraDir);
        const lenXZ = Math.sqrt(cameraDir.x * cameraDir.x + cameraDir.z * cameraDir.z) || 1e-6;
        const dirX = cameraDir.x / lenXZ;
        const dirZ = cameraDir.z / lenXZ;

        const toSpawn = [];
        for (const entry of registry) {
            const dx = entry.x - cx;
            const dz = entry.z - cz;
            const d = Math.sqrt(dx * dx + dz * dz);
            const dot = dx * dirX + dz * dirZ;
            const lateral = Math.sqrt(Math.max(0, d * d - dot * dot));

            const shouldSpawn = inSpawnRegion(dx, dz, d, dot, lateral, false);
            const shouldKeep = inSpawnRegion(dx, dz, d, dot, lateral, true);

            if (entry.mesh) {
                if (!shouldKeep) {
                    group.remove(entry.mesh);
                    disposeTower(entry.mesh);
                    entry.mesh = null;
                }
            } else if (shouldSpawn) {
                toSpawn.push({ entry, d });
            }
        }

        toSpawn.sort((a, b) => a.d - b.d);
        for (let i = 0; i < Math.min(SKY_SPAWN_BATCH, toSpawn.length); i++) {
            const { entry } = toSpawn[i];
            const tower = createSimpleTower(entry.width, entry.height, entry.depth, entry.color);
            tower.position.set(entry.x, 0, entry.z);
            tower.rotation.y = (Math.floor(Math.random() * 4) * Math.PI) / 2;
            entry.mesh = tower;
            group.add(tower);
        }
    };

    console.log(`🏙️ City skyline: ${registry.length} positions (edge band |x| or |z| > ${SKY_EDGE_BAND}, batch=${SKY_SPAWN_BATCH})`);
    scene.add(group);
    return { group, update };
};

// Direction-aware tree spawn: immediate area + extended in look direction
const CORE_RADIUS = 100;      // Always load - immediate area around player
const FORWARD_RADIUS = 200;   // Load far in camera look direction
const LATERAL_SPAN = 140;     // Width of forward cone (each side)
const REAR_RADIUS = 80;       // Smaller radius behind player
const CORE_KEEP = 140;        // Hysteresis - keep core trees until here
const FORWARD_KEEP = 240;
const LATERAL_KEEP = 160;
const REAR_KEEP = 110;
const SPAWN_BATCH = 25;       // Max trees to spawn per frame (avoid hitches)

const disposeTree = (tree) => {
    tree.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
        }
    });
};

/** Unified tree placement across the 1000x1000 map - context-aware density, distance-based spawn/despawn */
export const createUnifiedMapTrees = (scene) => {
    const treeGroup = new THREE.Group();
    treeGroup.name = "UnifiedMapTrees";

    const halfZone = ZONE_SIZE / 2;
    const { zMin: MAP_Z_MIN, zMax: MAP_Z_MAX } = VERTICAL_BOUNDS;
    const MAP_X_MIN = -500;
    const MAP_X_MAX = 500;

    const selectTreeType = () => {
        const rand = Math.random() * 100;
        if (rand < 25) return 'Eastern White Pine';
        if (rand < 45) return 'Red Maple';
        if (rand < 65) return 'Northern Red Oak';
        if (rand < 80) return 'Eastern Hemlock';
        if (rand < 92) return 'American Beech';
        return 'Red Pine';
    };

    const rect = (left, right, front, back) => ({ left, right, front, back });
    const inRect = (x, z, r) => x >= r.left && x <= r.right && z >= r.front && z <= r.back;

    // World-space exclusion zones
    const exclusions = [];

    // Connector corridors (full z)
    exclusions.push(rect(-182, -158, MAP_Z_MIN, MAP_Z_MAX));
    exclusions.push(rect(158, 182, MAP_Z_MIN, MAP_Z_MAX));

    // Zone streets (horizontal strips) - suburban streets stop before river
    const PLAZA_Z = UNIFIED_MAP_ZONE_OFFSETS.PLAZA.z;
    const FOREST_Z = UNIFIED_MAP_ZONE_OFFSETS.FOREST_SUBURBAN.z;
    const POND_Z = UNIFIED_MAP_ZONE_OFFSETS.POND.z;
    const stDep = STREET_DEPTH / 2;
    exclusions.push(rect(SUBURBAN_ZONE_STREET_X_MIN, SUBURBAN_ZONE_STREET_X_MAX, PLAZA_Z + 11 - stDep, PLAZA_Z + 11 + stDep));
    exclusions.push(rect(SUBURBAN_ZONE_STREET_X_MIN, SUBURBAN_ZONE_STREET_X_MAX, FOREST_Z + 11 - stDep, FOREST_Z + 11 + stDep));
    exclusions.push(rect(SUBURBAN_ZONE_STREET_X_MIN, SUBURBAN_ZONE_STREET_X_MAX, POND_Z + 11 - stDep, POND_Z + 11 + stDep));

    // PLAZA sidewalks, parking, buildings (world = local for plaza at 0,0)
    exclusions.push(rect(SUBURBAN_ZONE_STREET_X_MIN, SUBURBAN_ZONE_STREET_X_MAX, -1, 5));   // near sidewalk
    exclusions.push(rect(SUBURBAN_ZONE_STREET_X_MIN, SUBURBAN_ZONE_STREET_X_MAX, 17, 23));  // far sidewalk
    exclusions.push(rect(SUBURBAN_ZONE_STREET_X_MIN, SUBURBAN_ZONE_STREET_X_MAX, 27, 87));  // parking (after buffer fix)
    exclusions.push(rect(-70, 70, -10, 15));
    exclusions.push(rect(-70, 70, 20, 50));
    exclusions.push(rect(-50, 50, 50, 70));

    // PLAZA park - skip entirely (createParkElements has curated trees)
    const plazaPark = rect(-45, 45, -50, 5);

    // FOREST zone sidewalks, buildings, park (world = local + FOREST_Z)
    const fz = FOREST_Z;
    exclusions.push(rect(SUBURBAN_ZONE_STREET_X_MIN, SUBURBAN_ZONE_STREET_X_MAX, fz - 1, fz + 5));
    exclusions.push(rect(SUBURBAN_ZONE_STREET_X_MIN, SUBURBAN_ZONE_STREET_X_MAX, fz + 17, fz + 23));
    exclusions.push(rect(-70, 70, fz - 10, fz + 15));
    exclusions.push(rect(-70, 70, fz + 20, fz + 50));
    exclusions.push(rect(-50, 50, fz + 50, fz + 70));
    const forestPark = rect(-45, 45, fz - 50, fz + 5);

    // POND zone - road, sidewalks, pond, campsite, paths (local + POND_Z)
    const pz = POND_Z;
    exclusions.push(rect(-156, 150, pz - 10, pz + 30));
    exclusions.push(rect(-94, -88, pz - 150, pz + 150));
    exclusions.push(rect(-112, -106, pz - 150, pz + 150));
    exclusions.push(rect(-37, 37, pz + 70, pz + 130));
    exclusions.push(rect(20, 75, pz - 100, pz - 25));



    // Southeast forest clearings + path
    FOREST_CLEARINGS.forEach((c) => {
        exclusions.push(rect(c.x - c.radius, c.x + c.radius, c.z - c.radius, c.z + c.radius));
    });
    // East carnival - no trees on grounds
    exclusions.push(rect(
        CARNIVAL_CONFIG.x - CARNIVAL_CONFIG.radius,
        CARNIVAL_CONFIG.x + CARNIVAL_CONFIG.radius,
        CARNIVAL_CONFIG.z - CARNIVAL_CONFIG.radius,
        CARNIVAL_CONFIG.z + CARNIVAL_CONFIG.radius
    ));

    // Northeast mansion compound
    const m = MANSION_CONFIG;
    exclusions.push(rect(
        m.x - m.width / 2,
        m.x + m.width / 2,
        m.z - m.depth / 2,
        m.z + m.depth / 2
    ));

    // River (west column) - no trees in water, plus 10 feet buffer on each bank
    const r = RIVER_CONFIG;
    const RIVER_TREE_BUFFER = 10;
    exclusions.push(rect(
        r.x - r.halfWidth - RIVER_TREE_BUFFER,
        r.x + r.halfWidth + RIVER_TREE_BUFFER,
        r.zMin,
        r.zMax
    ));

    const subway = SUBWAY_POSITIONS.suburban;
    exclusions.push(rect(subway.x - 8, subway.x + 8, subway.z - 8, subway.z + 10));

    const mansionTrail = getMansionPathSamples();
    const forestTrails=FOREST_TRAILS.map(points=>sampleTrail(points));
    const pondOffset=POND_Z+SCENE_CONFIGS.POND.FRONT_SHOPS_Z;
    const pondTrails=Object.values(POND_TRAILS).map(points=>sampleTrail(points).map(p=>({x:p.x,z:p.z+pondOffset})));

    const woodlandTrails=[mansionTrail,...forestTrails,...pondTrails].map(samples=>({
        samples,minX:Math.min(...samples.map(p=>p.x))-4.5,maxX:Math.max(...samples.map(p=>p.x))+4.5,
        minZ:Math.min(...samples.map(p=>p.z))-4.5,maxZ:Math.max(...samples.map(p=>p.z))+4.5
    }));
    const isExcluded = (wx, wz) => {
        if (woodlandTrails.some(path=>wx>=path.minX&&wx<=path.maxX&&wz>=path.minZ&&wz<=path.maxZ&&nearTrail(wx,wz,path.samples))) return true;
        for (const r of exclusions) if (inRect(wx, wz, r)) return true;
        return false;
    };
    const isInPlazaPark = (wx, wz) => inRect(wx, wz, plazaPark);
    const isInForestPark = (wx, wz) => inRect(wx, wz, forestPark);

    const getZoneAt = (wx, wz) => {
        for (const zone of UNIFIED_MAP_ZONES) {
            if (wx >= zone.x - halfZone && wx <= zone.x + halfZone &&
                wz >= zone.z - halfZone && wz <= zone.z + halfZone) {
                return zone;
            }
        }
        return null;
    };

    const registry = [];
    const step = 6;
    for (let wx = MAP_X_MIN; wx <= MAP_X_MAX; wx += step) {
        for (let wz = MAP_Z_MIN; wz <= MAP_Z_MAX; wz += step) {
            if (isExcluded(wx, wz)) continue;
            if (isInPlazaPark(wx, wz) || isInForestPark(wx, wz)) continue;

            const zone = getZoneAt(wx, wz);
            if (!zone) continue;

            let prob;
            if (zone.config === 'FOREST_SUBURBAN') prob = 0.72;
            else if (zone.config === 'POND') prob = 0.75;
            else if (zone.config === 'PLAZA') prob = 0.08;
            else prob = 0.5;

            if (Math.random() > prob) continue;
            const treeX = wx + (Math.random() - 0.5) * 2;
            const treeZ = wz + (Math.random() - 0.5) * 2;
            if (isExcluded(treeX, treeZ)) continue;
            if (isInPlazaPark(treeX, treeZ) || isInForestPark(treeX, treeZ)) continue;

            const scale = 0.6 + Math.random() * 0.4;
            const species = selectTreeType();
            registry.push({ x: treeX, z: treeZ, scale, species, mesh: null });
        }
    }

    const cameraDir = new THREE.Vector3();

    const inSpawnRegion = (dx, dz, d, dot, lateral, useKeep) => {
        const core = useKeep ? CORE_KEEP : CORE_RADIUS;
        const fwd = useKeep ? FORWARD_KEEP : FORWARD_RADIUS;
        const lat = useKeep ? LATERAL_KEEP : LATERAL_SPAN;
        const rear = useKeep ? REAR_KEEP : REAR_RADIUS;
        return d < core ||
            (dot > 0 && dot < fwd && lateral < lat) ||
            (dot < 0 && d < rear);
    };

    const update = (camera) => {
        const cx = camera.position.x;
        const cz = camera.position.z;
        camera.getWorldDirection(cameraDir);
        const lenXZ = Math.sqrt(cameraDir.x * cameraDir.x + cameraDir.z * cameraDir.z) || 1e-6;
        const dirX = cameraDir.x / lenXZ;
        const dirZ = cameraDir.z / lenXZ;

        const toSpawn = [];

        for (const entry of registry) {
            const dx = entry.x - cx;
            const dz = entry.z - cz;
            const d = Math.sqrt(dx * dx + dz * dz);
            const dot = dx * dirX + dz * dirZ;
            const lateral = Math.sqrt(Math.max(0, d * d - dot * dot));

            const shouldSpawn = inSpawnRegion(dx, dz, d, dot, lateral, false);
            const shouldKeep = inSpawnRegion(dx, dz, d, dot, lateral, true);

            if (entry.mesh) {
                if (!shouldKeep) {
                    treeGroup.remove(entry.mesh);
                    disposeTree(entry.mesh);
                    entry.mesh = null;
                }
            } else if (shouldSpawn) {
                toSpawn.push({ entry, d });
            }
        }

        toSpawn.sort((a, b) => a.d - b.d);
        for (let i = 0; i < Math.min(SPAWN_BATCH, toSpawn.length); i++) {
            const { entry } = toSpawn[i];
            entry.mesh = createTree(entry.x, entry.z, entry.scale, entry.species);
            treeGroup.add(entry.mesh);
        }
    };

    console.log(`🌲 Tree registry: ${registry.length} positions (direction-aware spawn: core=${CORE_RADIUS}, forward=${FORWARD_RADIUS}, batch=${SPAWN_BATCH})`);
    scene.add(treeGroup);
    return { treeGroup, update };
};

// Forest elements for suburban scenes (with buildings, roads, etc.)
