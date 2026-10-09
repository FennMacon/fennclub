import { getFlavorContent } from '../content-loader.js';
export const assignFlavor = (obj, contentId) => {
    const c = getFlavorContent(contentId);
    obj.userData.isInteractive = true;
    obj.userData.name = c.name;
    obj.userData.flavorText = c.flavorText;
    if (c.itemName) obj.userData.itemName = c.itemName;
};

export const INTERIOR_TARGET_SIZE = 50;
export const INTERIOR_BASE_SIZE = 50;
export const INTERIOR_SCALE = INTERIOR_TARGET_SIZE / INTERIOR_BASE_SIZE;

export const applyInteriorScale = (group) => {
    if (!group) return;
    group.scale.set(INTERIOR_SCALE, 1, INTERIOR_SCALE);
};

export const createInteriorBounds = (baseWidth, baseDepth, margin, wallHeight) => {
    const scaledWidth = baseWidth * INTERIOR_SCALE;
    const scaledDepth = baseDepth * INTERIOR_SCALE;
    return {
        minX: -scaledWidth / 2 + margin,
        maxX: scaledWidth / 2 - margin,
        minZ: -scaledDepth / 2 + margin,
        maxZ: scaledDepth / 2 - margin,
        minY: 0,
        maxY: wallHeight
    };
};

export const compressInteriorToBounds = (group, storeWidth, storeDepth) => {
    if (!group) return;
    const halfWidth = storeWidth / 2 - 1;
    const halfDepth = storeDepth / 2 - 1;
    
    group.traverse((child) => {
        if (!child || !child.position) return;
        if (child.userData && child.userData.isStructural) return;
        if (child.userData && child.userData.keepPosition) return;
        
        const px = child.position.x;
        const pz = child.position.z;
        
        const xRatio = Math.abs(px) > halfWidth && Math.abs(px) > 0 ? halfWidth / Math.abs(px) : 1;
        const zRatio = Math.abs(pz) > halfDepth && Math.abs(pz) > 0 ? halfDepth / Math.abs(pz) : 1;
        const ratio = Math.min(xRatio, zRatio);
        
        if (ratio < 1) {
            child.position.x *= ratio;
            child.position.z *= ratio;
        }
    });
};

export const markStructural = (object) => {
    if (!object) return;
    if (!object.userData) {
        object.userData = {};
    }
    object.userData.isStructural = true;
};

