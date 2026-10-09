import { createMansionInterior } from './mansion-interior.js';
import { INTERIOR_TARGET_SIZE } from './shared.js';
import { createCumbysInterior } from './cumbys-interior.js';
import { createShopInterior } from './shop-interior.js';
import { createChurchInterior } from './church-interior.js';
import { createTownHallInterior } from './town-hall-interior.js';
import { createHouseInterior } from './house-interior.js';
import { createHospitalInterior } from './hospital-interior.js';
import { createModernInterior } from './modern-interior.js';
import { createBrickInterior } from './brick-interior.js';
import { createIndustrialInterior } from './industrial-interior.js';
import { createGraveyardInterior } from './graveyard-interior.js';
export { createCumbysInterior, createShopInterior, createChurchInterior, createTownHallInterior, createHouseInterior, createHospitalInterior, createModernInterior, createBrickInterior, createIndustrialInterior, createGraveyardInterior };
// Interior registry: map scene key → { create(scene), dimensions }
export const INTERIOR_REGISTRY = {
    MANSION_INTERIOR: { create: createMansionInterior, dimensions: { width: 48, depth: 48 } },
    CUMBYS_INTERIOR: {
        create: (scene) => createCumbysInterior(scene),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    GROHOS_INTERIOR: {
        create: (scene) => createShopInterior(scene, 'pizza', 'Grohos Pizza', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    CLOTHING_STORE_INTERIOR: {
        create: (scene) => createShopInterior(scene, 'clothing', 'Clothing Store', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    DRYCLEANER_INTERIOR: {
        create: (scene) => createShopInterior(scene, 'drycleaner', 'Dry Cleaners', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    DUNKIN_INTERIOR: {
        create: (scene) => createShopInterior(scene, 'coffee', 'Donut Galaxy', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    FLOWER_SHOP_INTERIOR: {
        create: (scene) => createShopInterior(scene, 'flowers', 'Flower Shop', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    CHURCH_INTERIOR: {
        create: (scene) => createChurchInterior(scene),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    TOWNHALL_INTERIOR: {
        create: (scene) => createTownHallInterior(scene),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    HOUSE_INTERIOR: {
        create: (scene) => createHouseInterior(scene),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    HOSPITAL_INTERIOR: {
        create: (scene) => createHospitalInterior(scene),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    MODERN_INTERIOR: {
        create: (scene) => createModernInterior(scene),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    BRICK_INTERIOR: {
        create: (scene) => createBrickInterior(scene),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    SHOP_INTERIOR: {
        create: (scene) => createShopInterior(scene, 'shop', 'Shop', INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    INDUSTRIAL_INTERIOR: {
        create: (scene) => createIndustrialInterior(scene),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    },
    GRAVEYARD_INTERIOR: {
        create: (scene) => createGraveyardInterior(scene),
        dimensions: { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE }
    }
};
