import { CITY_ATMOSPHERE } from './world/city-layout.js';
import { getBlendedZoneFog } from './world/fog-blending.js';
// fog.js - PS2-style zone-based area fog
import * as THREE from 'three';
import { SCENE_CONFIGS, FOG_PRESETS, UNIFIED_MAP_ZONES, UNIFIED_MAP, getCurrentMap } from './scenes.js';

const BLEND_RADIUS = 90; // Distance within which to blend between zones

/** Urban fog preset for city zones without SCENE_CONFIGS */
const CITY_FOG_PRESETS = {
    TRIPLE_DECKERS: { color: 0x1a1a28, near: 32, far: 200 },
    RECORD_STRIP: { color: 0x1a1a28, near: 30, far: 210 },
    RESIDENTIAL: { color: 0x1a1a28, near: 32, far: 200 },
    FOOD_ROW: { color: 0x1a1a28, near: 30, far: 210 },
    URBAN_PARK: { color: 0x1a1a2a, near: 35, far: 220 },
    SUBWAY_ENTRANCE: { color: 0x1a1a28, near: 30, far: 200 }
};

/** Get fog config for a zone. Uses SCENE_CONFIGS.FOG for populated zones, FOG_PRESETS for others. */
export const getFogConfigForZone = (zoneKey, configKey) => {
    if (zoneKey?.startsWith('CITY_')) return CITY_ATMOSPHERE;
    const sceneConfig = SCENE_CONFIGS[zoneKey];
    if (sceneConfig?.FOG) return sceneConfig.FOG;
    const preset = FOG_PRESETS[configKey] ?? CITY_FOG_PRESETS?.[configKey];
    if (preset) return preset;
    return SCENE_CONFIGS.PLAZA.FOG;
};

/** Update scene fog based on camera position (unified map only). Blends between nearest zones. */
export const updateZoneFog = (scene, camera, streetElements, isInterior) => {
    if (isInterior || !streetElements?.zoneRootGroups) return;
    const isCity = getCurrentMap() === 'city';
    if (!UNIFIED_MAP && !isCity) return;
    if (isCity) {
        if (!scene.fog) scene.fog=new THREE.Fog(CITY_ATMOSPHERE.color,CITY_ATMOSPHERE.near,CITY_ATMOSPHERE.far);
        scene.fog.color.setHex(CITY_ATMOSPHERE.color);scene.fog.near=CITY_ATMOSPHERE.near;scene.fog.far=CITY_ATMOSPHERE.far;
        if(!scene.background?.isColor)scene.background=new THREE.Color(CITY_ATMOSPHERE.color);
        else scene.background.copy(scene.fog.color);
        return;
    }

    if (!scene.fog) scene.fog = new THREE.Fog(0x1a1a2e, 40, 280);

    const targetConfig = getBlendedZoneFog(UNIFIED_MAP_ZONES, camera.position.x, camera.position.z, getFogConfigForZone, BLEND_RADIUS);

    scene.fog.color.setHex(targetConfig.color);
    scene.fog.near = targetConfig.near;
    scene.fog.far = targetConfig.far;
};

/** Sync ground fog plane color to current scene fog. */
export const updateGroundFog = (scene) => {
    const fogPlane = scene.getObjectByName('GroundFog');
    if (!fogPlane?.material || !scene.fog) return;
    const fogColor = scene.fog.color.getHex();
    fogPlane.material.color.setHex(fogColor);
};
