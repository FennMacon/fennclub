import { loadMusicCatalog } from './music-library.js';
import { buildWorld, disposeWorld } from './world-runtime.js';
import { resetNPCInteraction, getMobileInteraction } from './npcs.js';
import { setYaw, setPitch, resetControls } from './controls.js';
import { getPhoneOpenState } from './phone-ui.js';
import { resetMobileControls } from './mobile-controls.js';
import { storage, readPosition } from './storage.js';
// main.js - Refactored version using modular structure
// This is the streamlined orchestration file

import * as THREE from 'three';

// Import from our new modular files
import { createCar, getRandomCarColor } from './utils.js';
import { loadAllContent } from './content-loader.js';
import { INTERIOR_TARGET_SIZE } from './buildings.js';
import { initializeNPCInteraction, checkNearbyNPCs, checkNearbyItems, checkBusStopProximity, initializeConversationHandlers, getNextSceneInfo, handleInteractionInput } from './npcs.js';
import { getCurrentScene, getPlazaConfig, SCENE_CONFIGS, UNIFIED_MAP, getBuildingPortalDestination, getBusStopArrivalPosition, getCurrentMap, setCurrentMap, getSubwayArrivalPosition } from './scenes.js';
import { hasActiveConversation } from './dialogue.js';
import { initializeControls, updateCameraPosition, isMobile } from './controls.js';
import { initializeMobileControls, updateMobileActionButton } from './mobile-controls.js';
import { initializeRenderer, initializePostProcessing, handleResize } from './renderer.js';
import { createAnimationLoop } from './animation.js';
import { initializePhoneUI, initializePhoneKeyboard, updatePhoneDebugInfo } from './phone-ui.js';

// =====================================================
// SCENE SETUP
// =====================================================
const scene = new THREE.Scene();

const INTERIOR_CAMERA_OFFSET = 5;
const INTERIOR_HALF_SIZE = INTERIOR_TARGET_SIZE / 2;
const INTERIOR_CAMERA_Z = Math.max(0, INTERIOR_HALF_SIZE - INTERIOR_CAMERA_OFFSET);

// =====================================================
// RUNTIME STATISTICS
// =====================================================
let lastDebugUpdate = 0;
let debugInfo = {
    cameraPosition: { x: 0, y: 0, z: 0 },
    cameraSpeed: 0,
    lastPosition: { x: 0, y: 0, z: 0 },
    lastTime: Date.now(),
    fps: 0,
    frameCount: 0,
    lastFpsTime: Date.now()
};

// Update debug info
const updateDebugInfo = (camera, controls) => {
    const now = Date.now();
    // Update FPS
    debugInfo.frameCount++;
    if (now - debugInfo.lastFpsTime >= 1000) {
        debugInfo.fps = Math.round(debugInfo.frameCount * 1000 / (now - debugInfo.lastFpsTime));
        debugInfo.frameCount = 0;
        debugInfo.lastFpsTime = now;
    }

    if (now - lastDebugUpdate < 250) return;
    lastDebugUpdate = now;
    const deltaTime = (now - debugInfo.lastTime) / 1000;

    // Update camera position
    debugInfo.cameraPosition.x = camera.position.x.toFixed(2);
    debugInfo.cameraPosition.y = camera.position.y.toFixed(2);
    debugInfo.cameraPosition.z = camera.position.z.toFixed(2);

    // Calculate speed
    const distance = Math.sqrt(
        Math.pow(camera.position.x - debugInfo.lastPosition.x, 2) +
        Math.pow(camera.position.y - debugInfo.lastPosition.y, 2) +
        Math.pow(camera.position.z - debugInfo.lastPosition.z, 2)
    );
    debugInfo.cameraSpeed = deltaTime > 0 ? (distance / deltaTime).toFixed(2) : 0;

    // Update phone UI with debug info
    updatePhoneDebugInfo({
        scene: PLAZA_CONFIG.IS_INTERIOR ? PLAZA_CONFIG.name : (getCurrentMap() === 'city' ? 'Allston' : 'Suburbs'),
        time: new Date().toLocaleTimeString(),
        fps: debugInfo.fps,
        cameraPosition: {
            x: debugInfo.cameraPosition.x,
            y: debugInfo.cameraPosition.y,
            z: debugInfo.cameraPosition.z
        },
        cameraSpeed: debugInfo.cameraSpeed
    });

    // Store current position for next frame
    debugInfo.lastPosition.x = camera.position.x;
    debugInfo.lastPosition.y = camera.position.y;
    debugInfo.lastPosition.z = camera.position.z;
    debugInfo.lastTime = now;
};

// Current active scene configuration
let CURRENT_SCENE = getCurrentScene();
let PLAZA_CONFIG = getPlazaConfig(CURRENT_SCENE);

console.log('🎬 Loading scene:', CURRENT_SCENE, 'Config:', PLAZA_CONFIG.name, UNIFIED_MAP ? '(Unified Map)' : '');
console.log('Scene flags:', {
    FRONT_IS_PARK: PLAZA_CONFIG.FRONT_IS_PARK,
    FRONT_IS_POND: PLAZA_CONFIG.FRONT_IS_POND,
    HAUNTED_ATMOSPHERE: PLAZA_CONFIG.HAUNTED_ATMOSPHERE
});

// Scene switching function
export const switchScene = (sceneName) => {
    if (SCENE_CONFIGS[sceneName]) {
        const destinationConfig = SCENE_CONFIGS[sceneName];

        const cameraPos = camera.position;

        // Handle interior scenes differently
        if (destinationConfig.IS_INTERIOR) {
            // For interior scenes, start camera at the door looking in
            // All interiors are 75x75, door is at z ≈ 37.5 (storeDepth/2)
            // Position camera just inside the door (z ≈ 32.5) looking inward
            const interiorCameraPosition = {
                x: 0,
                y: cameraPos.y,
                z: INTERIOR_CAMERA_Z // Just inside the door (door depth - offset)
            };
            storage.setItem('interiorCameraPosition', JSON.stringify(interiorCameraPosition));
        } else {
            // For exterior scenes, check if we're returning from an interior
            const savedPortalPosition = storage.getItem('buildingPortalPosition');
            if (savedPortalPosition) {
                // Use the saved building portal position
                storage.setItem('busStopCameraPosition', savedPortalPosition);
                storage.removeItem('buildingPortalPosition');

                // Check if we're exiting from a far-side building
                // Far buildings face the street, so we should NOT rotate 180 (face forward/toward street)
                const isFarBuilding = storage.getItem('isFarBuilding') === 'true';
                storage.setItem('isFarBuildingExit', isFarBuilding ? 'true' : 'false');
                storage.removeItem('isFarBuilding');
                console.log(`Restoring building portal position: ${savedPortalPosition}, isFarBuilding: ${isFarBuilding}`);
            } else {
                // Default to bus stop position
                const busStopCameraPosition = {
                    x: -15,
                    y: cameraPos.y,
                    z: SCENE_CONFIGS[sceneName].NEAR_SIDEWALK_Z + 3
                };
                storage.setItem('busStopCameraPosition', JSON.stringify(busStopCameraPosition));
            }
        }

        storage.setItem('suburbanAdventureScene', sceneName);
        console.log(`Switching to ${destinationConfig.name}`);
        rebuildWorld();
    }
};

// =====================================================
// CAMERA SETUP
// =====================================================
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let shouldRotate180 = false;
const restoreCamera = () => {
const savedBusStopPosition = readPosition('busStopCameraPosition');
const savedInteriorPosition = readPosition('interiorCameraPosition');
shouldRotate180 = false;

if (savedInteriorPosition) {
    // Handle interior scene camera position
    const pos = savedInteriorPosition;
    camera.position.set(pos.x, pos.y, pos.z);
    storage.removeItem('interiorCameraPosition');
    shouldRotate180 = false;
} else if (savedBusStopPosition) {
    // Handle exterior scene camera position (from bus stop or building portal)
    const pos = savedBusStopPosition;
    camera.position.set(pos.x, pos.y, pos.z);
    storage.removeItem('busStopCameraPosition');

    // Check if we're exiting from a far-side building
    // Far buildings face the street, so we should NOT rotate 180 (face forward/toward street)
    const isFarBuildingExit = storage.getItem('isFarBuildingExit') === 'true';
    shouldRotate180 = !isFarBuildingExit; // Only rotate 180 if NOT a far building
    storage.removeItem('isFarBuildingExit');
    console.log(`Camera position restored, shouldRotate180: ${shouldRotate180} (isFarBuildingExit: ${isFarBuildingExit})`);
} else {
    // Default camera position
    if (PLAZA_CONFIG.IS_INTERIOR) {
        // All interiors are 75x75, door is at z ≈ 37.5
        // Position camera just inside the door looking inward
        camera.position.set(0, 2, INTERIOR_CAMERA_Z); // Just inside the door for interior scenes
    } else {
        camera.position.set(0, 2, PLAZA_CONFIG.CAMERA_START_Z);
    }
}

if (isMobile) camera.position.y = 2;
const returnYaw = storage.getItem('buildingReturnYaw');
setYaw(!PLAZA_CONFIG.IS_INTERIOR && returnYaw !== null && Number.isFinite(Number(returnYaw)) ? Number(returnYaw) : (shouldRotate180 ? Math.PI : 0));
if (!PLAZA_CONFIG.IS_INTERIOR) storage.removeItem('buildingReturnYaw');
setPitch(0);
};
restoreCamera();

// =====================================================
// RENDERER SETUP (Using new module)
// =====================================================
const renderer = initializeRenderer();
const { renderTarget, postCamera, postMaterial, postScene } = initializePostProcessing();

// =====================================================
// CONTROLS SETUP (Using new module)
// =====================================================
initializeControls(camera, renderer.domElement, shouldRotate180);

// =====================================================
// LOAD CONTENT (dialogue + flavor text from content/*.txt)
// =====================================================
await Promise.all([loadAllContent(), loadMusicCatalog().catch(error => console.warn('Music catalog unavailable:', error.message))]);
console.log('Content loaded.');

// =====================================================
// INITIALIZE SCENE
// =====================================================
let streetElements = {};

Object.assign(streetElements, buildWorld(scene, camera, CURRENT_SCENE, PLAZA_CONFIG));

const rebuildWorld = () => {
    resetControls();
    resetMobileControls();
    resetNPCInteraction();
    disposeWorld(scene);
    CURRENT_SCENE = getCurrentScene();
    PLAZA_CONFIG = getPlazaConfig(CURRENT_SCENE);
    restoreCamera();
    Object.keys(streetElements).forEach(key => delete streetElements[key]);
    Object.assign(streetElements, buildWorld(scene, camera, CURRENT_SCENE, PLAZA_CONFIG));
};
document.addEventListener('game-scene-change', rebuildWorld);

// Initialize NPC interaction system
initializeNPCInteraction();
initializeConversationHandlers();

// handleActionInput: unified handler for Space/mobile button - conversations, items, portals, bus
const handleActionInput = () => {
    if (document.getElementById('startup') || getPhoneOpenState()) return;
    // Skip portals/bus if in conversation (Space is for conversation only in that case)
    if (hasActiveConversation()) {
        handleInteractionInput(CURRENT_SCENE);
        return;
    }
    // Conversations, items, NPC talk - returns true if consumed
    if (handleInteractionInput(CURRENT_SCENE)) return;

    // Building door portals
    if (streetElements && streetElements.buildingPortals) {
        let nearestPortal = null;
        let nearestDistance = Infinity;
        streetElements.buildingPortals.forEach(portal => {
            const distance = camera.position.distanceTo(portal.position);
            if (distance < 5 && distance < nearestDistance) {
                nearestPortal = portal;
                nearestDistance = distance;
            }
        });
        if (nearestPortal) {
            const targetScene = getBuildingPortalDestination(nearestPortal.style);
            console.log(`Entering ${nearestPortal.name}, switching to ${targetScene.key} (${targetScene.name})`);
            storage.setItem('previousExteriorScene', nearestPortal.zoneKey || CURRENT_SCENE);
            const portalPosition = { x: (nearestPortal.returnPosition || nearestPortal.position).x, y: 2, z: (nearestPortal.returnPosition || nearestPortal.position).z };
            storage.setItem('buildingPortalPosition', JSON.stringify(portalPosition));
            if (Number.isFinite(nearestPortal.returnYaw)) storage.setItem('buildingReturnYaw', String(nearestPortal.returnYaw));
            else storage.removeItem('buildingReturnYaw');
            const isFarBuilding = nearestPortal.isFarBuilding === true;
            storage.setItem('isFarBuilding', isFarBuilding ? 'true' : 'false');
            switchScene(targetScene.key);
            return;
        }
    }

    // Exit portal if in interior scene
    if (PLAZA_CONFIG.IS_INTERIOR && streetElements && streetElements.exitPortal) {
        const exitPortalPos = new THREE.Vector3();
        streetElements.exitPortal.getWorldPosition(exitPortalPos);
        if (camera.position.distanceTo(exitPortalPos) < 3) {
            const previousScene = storage.getItem('previousExteriorScene') || 'PLAZA';
            console.log(`Exiting interior, returning to ${previousScene}`);
            switchScene(previousScene);
            return;
        }
    }

    // Subway travel - switch between suburban and city maps (same as "t" key)
    if (streetElements?.subwayStopPosition) {
        const subwayPos = streetElements.subwayStopPosition;
        const dist = camera.position.distanceTo(new THREE.Vector3(subwayPos.x, 0, subwayPos.z));
        if (dist < 6 && performMapSwitch()) return;
    }

    // Bus stop travel - UNIFIED_MAP
    if (!PLAZA_CONFIG.IS_INTERIOR && UNIFIED_MAP && streetElements?.zoneRootGroups) {
        let nearestZone = null;
        let distanceToBusStop = Infinity;
        streetElements.zoneRootGroups.forEach(zoneRoot => {
            const zoneKey = zoneRoot.userData?.zoneKey;
            const zoneConfig = SCENE_CONFIGS[zoneKey] || PLAZA_CONFIG;
            const offset = zoneRoot.userData?.zoneOffset || { x: 0, z: 0 };
            const busStopPos = new THREE.Vector3(
                offset.x + (zoneConfig.ROAD_POSITION_X ? zoneConfig.ROAD_POSITION_X + 3 : -15),
                0,
                offset.z + zoneConfig.NEAR_SIDEWALK_Z
            );
            const d = camera.position.distanceTo(busStopPos);
            if (d < distanceToBusStop) {
                distanceToBusStop = d;
                nearestZone = zoneKey;
            }
        });
        if (distanceToBusStop < 5 && nearestZone) {
            const next = getNextSceneInfo(nearestZone);
            const pos = getBusStopArrivalPosition(next.key);
            camera.position.set(pos.x, pos.y, pos.z);
            console.log(`🚌 Travelled to ${next.name}`);
            return;
        }
    }

    // Fall back to bus stop (non-unified exterior scenes)
    if (!PLAZA_CONFIG.IS_INTERIOR && !UNIFIED_MAP) {
        const busStopX = PLAZA_CONFIG.ROAD_POSITION_X ? PLAZA_CONFIG.ROAD_POSITION_X + 3 : -15;
        const busStopPosition = new THREE.Vector3(busStopX, 0, PLAZA_CONFIG.NEAR_SIDEWALK_Z);
        if (camera.position.distanceTo(busStopPosition) < 5) {
            const nextScene = getNextSceneInfo(CURRENT_SCENE);
            console.log(`Switching to ${nextScene.key} (${nextScene.name})`);
            switchScene(nextScene.key);
        }
    }
};

// Initialize mobile controls (joysticks, action button) when on mobile
if (isMobile) {
    initializeMobileControls({ onAction: handleActionInput });
}

// Initialize phone UI (mobileLayout: phone button top-center on mobile to avoid joystick overlap)
initializePhoneUI({ mobileLayout: isMobile });
initializePhoneKeyboard();

// =====================================================
// SKYBOX AND ENVIRONMENT
// =====================================================
// Switch between suburban and city maps (same as subway travel)
export const performMapSwitch = () => {
    if (PLAZA_CONFIG.IS_INTERIOR) return false;
    const currentMap = getCurrentMap();
    if (currentMap === 'suburban') {
        setCurrentMap('city');
        storage.setItem('suburbanAdventureScene', 'CITY_PLAZA');
        storage.setItem('busStopCameraPosition', JSON.stringify(getSubwayArrivalPosition('city')));
        console.log('🚇 Travelling to Allston');
        rebuildWorld();
        return true;
    } else if (currentMap === 'city') {
        setCurrentMap('suburban');
        storage.setItem('suburbanAdventureScene', 'PLAZA');
        storage.setItem('busStopCameraPosition', JSON.stringify(getSubwayArrivalPosition('suburban')));
        console.log('🚇 Travelling to the suburbs');
        rebuildWorld();
        return true;
    }
    return false;
};

// =====================================================
// KEYBOARD EVENT HANDLERS
// =====================================================
document.addEventListener('keydown', (event) => {
    if (document.getElementById('startup')) return;
    if (event.code === 'Escape' && hasActiveConversation()) {
        resetNPCInteraction();
        resetControls();
        resetMobileControls();
        return;
    }
    const inInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
    if (!getPhoneOpenState() && !hasActiveConversation() && !event.repeat && event.code === 'KeyT' && !event.ctrlKey && !event.metaKey && !event.altKey && !inInput) {
        if (performMapSwitch()) return;
    }
    if (inInput || event.target.closest?.('button, [contenteditable]') || getPhoneOpenState() || event.repeat) return;
    if (event.code === 'Space') {
        event.preventDefault();
        handleActionInput();
    }
});

// =====================================================
// WINDOW RESIZE
// =====================================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    handleResize();
});

// =====================================================
// ANIMATION LOOP (Using new module)
// =====================================================
const animate = createAnimationLoop(
    scene,
    camera,
    renderer,
    renderTarget,
    postMaterial,
    postScene,
    postCamera,
    streetElements,
    (deltaTime) => updateCameraPosition(camera, PLAZA_CONFIG, streetElements, deltaTime),
    () => checkNearbyNPCs(camera, streetElements.npcs),
    () => checkNearbyItems(camera, streetElements.interactiveItems),
    () => checkBusStopProximity(camera, PLAZA_CONFIG, CURRENT_SCENE, streetElements),
    () => {
        // Update mobile action button based on context
        if (!isMobile) return;

        const interaction = getMobileInteraction();
        updateMobileActionButton(interaction.type, interaction.text);
    },
    createCar,
    getRandomCarColor,
    updateDebugInfo,
    () => PLAZA_CONFIG.IS_INTERIOR
);

// Start the animation loop
requestAnimationFrame(animate);
const startup = document.getElementById('startup');
const message = document.getElementById('startup-message');
message.textContent = isMobile
    ? 'Move with the left stick, look with the right. Tap RUN to toggle running. Tap the center action button to talk or explore. Start by finding Maya near the plaza. Your phone keeps your discoveries.'
    : 'WASD to move, drag to look, Shift to run, Space to interact, F for your phone. Start by finding Maya near the plaza.';
const begin = document.createElement('button');
begin.textContent = 'Explore the neighborhood';
begin.onclick = () => { startup.remove(); storage.setItem('suburbanAdventureIntroduced', 'true'); };
startup.append(begin);
if (storage.getItem('suburbanAdventureIntroduced')) startup.remove();

console.log("✅ Suburban Adventure initialized with modular architecture!");



export const getRuntimeState = () => ({ scene, camera, streetElements, sceneKey: CURRENT_SCENE, config: PLAZA_CONFIG });
