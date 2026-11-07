import {beginLandmarkAudio,updateLandmarkAudio} from './landmark-audio.js';
import {getAdventureState,subscribeAdventure,markAreaVisited,visitBusiness,saveCheckpoint,addContribution,startCompilation} from './adventure-state.js';
import {getAreaInfo,getTravelPosition,findSafeArrival} from './world/navigation.js';
import {safeExteriorPosition,findSafeInteriorArrival} from './world/traversal.js';
import {getStoryModalOpen,closeStoryModal} from './story-ui.js';
import {getSelectedInteraction} from './npcs.js';
import {openTransitChooser} from './phone-ui.js';
import { loadMusicCatalog } from './music-library.js';
import { buildWorld, disposeWorld } from './world-runtime.js';
import { resetNPCInteraction, getMobileInteraction } from './npcs.js';
import { setYaw, setPitch, resetControls, yaw, pitch } from './controls.js';
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
import { getCurrentScene, getPlazaConfig, SCENE_CONFIGS, UNIFIED_MAP, getBuildingPortalDestination, getBusStopArrivalPosition, getCurrentMap, setCurrentMap, getSubwayArrivalPosition, getAreaTestPosition } from './scenes.js';
import { hasActiveConversation,getUnlockedSongs } from './dialogue.js';
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
let adventureSnapshot=getAdventureState();
subscribeAdventure(state=>{adventureSnapshot=state;});
let lastDebugUpdate = 0;
let lastCheckpointAt = 0;
let runtimePersistenceEnabled = true;
export const setRuntimePersistenceEnabled = enabled => { runtimePersistenceEnabled=Boolean(enabled); };
let currentArea = null;
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

    streetElements.navigationUpdate?.(camera);
    updateLandmarkAudio(camera,getCurrentMap(),adventureSnapshot.settings.ambience&&!PLAZA_CONFIG.IS_INTERIOR&&!hasActiveConversation()&&!document.getElementById('startup'));
    if(!PLAZA_CONFIG.IS_INTERIOR) {
        currentArea=getAreaInfo(getCurrentMap(),camera.position);
        if(runtimePersistenceEnabled&&!adventureSnapshot.visited[getCurrentMap()].some(area=>area.key===currentArea.key))
            markAreaVisited(getCurrentMap(),currentArea.key,currentArea.name);
    } else {
        currentArea=getAreaInfo(getCurrentMap(),readPosition('buildingPortalPosition')||getBusStopArrivalPosition(getCurrentMap()==='city'?'CITY_PLAZA':'PLAZA'));
    }
    if(now-lastCheckpointAt>5000&&!document.getElementById('startup')&&!getPhoneOpenState()&&!getStoryModalOpen()&&!hasActiveConversation()) {
        checkpointCurrentPosition();lastCheckpointAt=now;
    }
    // Update phone UI with debug info
    updatePhoneDebugInfo({
        map:getCurrentMap(),district:currentArea?.key,districtName:currentArea?.name,
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
const getActiveConfig = sceneKey => {
    const config = getPlazaConfig(sceneKey);
    const name = storage.getItem('activeStoreName');
    return config.IS_INTERIOR && storage.getItem('activeStoreScene') === sceneKey && name
        ? { ...config, name } : config;
};
let PLAZA_CONFIG = getActiveConfig(CURRENT_SCENE);

console.log('🎬 Loading scene:', CURRENT_SCENE, 'Config:', PLAZA_CONFIG.name, UNIFIED_MAP ? '(Unified Map)' : '');
console.log('Scene flags:', {
    FRONT_IS_PARK: PLAZA_CONFIG.FRONT_IS_PARK,
    FRONT_IS_POND: PLAZA_CONFIG.FRONT_IS_POND,
    HAUNTED_ATMOSPHERE: PLAZA_CONFIG.HAUNTED_ATMOSPHERE
});

// Scene switching function
export const switchScene = (sceneName, storeName = null) => {
    if (Object.hasOwn(SCENE_CONFIGS,sceneName)) {
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

        if (destinationConfig.IS_INTERIOR && storeName) {
            storage.setItem('activeStoreName', storeName);
            storage.setItem('activeStoreScene', sceneName);
        } else {
            storage.removeItem('activeStoreName');
            storage.removeItem('activeStoreScene');
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
        if(CURRENT_SCENE==='PLAZA')camera.position.set(-20,2,4.5);
        else camera.position.set(0,2,PLAZA_CONFIG.CAMERA_START_Z);
    }
}

if (isMobile) camera.position.y = 2;
const returnYaw = storage.getItem('buildingReturnYaw');
setYaw(!PLAZA_CONFIG.IS_INTERIOR && returnYaw !== null && Number.isFinite(Number(returnYaw)) ? Number(returnYaw) : (shouldRotate180 ? Math.PI : 0));
if (!PLAZA_CONFIG.IS_INTERIOR) storage.removeItem('buildingReturnYaw');
setPitch(0);
};
restoreCamera();
const resumeCheckpoint=adventureSnapshot.checkpoint;
if(resumeCheckpoint&&resumeCheckpoint.map===getCurrentMap()&&resumeCheckpoint.sceneKey===CURRENT_SCENE) {
    camera.position.set(resumeCheckpoint.position.x,resumeCheckpoint.position.y,resumeCheckpoint.position.z);
    restoreCheckpointExit(resumeCheckpoint);
    PLAZA_CONFIG=getActiveConfig(CURRENT_SCENE);
    setYaw(resumeCheckpoint.yaw);setPitch(resumeCheckpoint.pitch);shouldRotate180=false;
}

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
void loadMusicCatalog().catch(error => console.warn('Music catalog unavailable:',error.message));
await loadAllContent();
for(const song of getUnlockedSongs())if(song.name!=='Plaza Finale') {
    addContribution(song.name,song.name,song.unlockedBy||'A neighbor');startCompilation();
}
console.log('Content loaded.');

// =====================================================
// INITIALIZE SCENE
// =====================================================
let streetElements = {};

Object.assign(streetElements, buildWorld(scene, camera, CURRENT_SCENE, PLAZA_CONFIG));
if(resumeCheckpoint)sanitizeCameraArrival();

const rebuildWorld = () => {
    resetControls();
    resetMobileControls();
    resetNPCInteraction();
    disposeWorld(scene);
    CURRENT_SCENE = getCurrentScene();
    PLAZA_CONFIG = getActiveConfig(CURRENT_SCENE);
    restoreCamera();
    Object.keys(streetElements).forEach(key => delete streetElements[key]);
    Object.assign(streetElements, buildWorld(scene, camera, CURRENT_SCENE, PLAZA_CONFIG));
};
document.addEventListener('game-scene-change', rebuildWorld);

function sanitizeCameraArrival() {
    const safe=PLAZA_CONFIG.IS_INTERIOR?findSafeInteriorArrival(camera.position,streetElements.interiorBounds,streetElements.interiorCollisionRects):findSafeArrival(camera.position,streetElements.exteriorCollisionRects);
    if(safe)camera.position.set(safe.x,2,safe.z);
}
function checkpointCurrentPosition() {
    if(!runtimePersistenceEnabled)return false;
    if(adventureSnapshot.settings.developerMode)return false;
    if(!PLAZA_CONFIG.IS_INTERIOR&&!safeExteriorPosition(camera.position,streetElements.exteriorCollisionRects))return false;
    const bounds=streetElements.interiorBounds;
    if(bounds&&(camera.position.x<bounds.minX||camera.position.x>bounds.maxX||camera.position.z<bounds.minZ||camera.position.z>bounds.maxZ))return false;
    if((streetElements.interiorCollisionRects||[]).some(r=>Math.abs(camera.position.x-r.x)<r.width/2+.5&&Math.abs(camera.position.z-r.z)<r.depth/2+.5))return false;
    const returnPosition=readPosition('buildingPortalPosition');
    const returnState=PLAZA_CONFIG.IS_INTERIOR&&returnPosition?{sceneKey:storage.getItem('previousExteriorScene'),position:returnPosition,yaw:Number(storage.getItem('buildingReturnYaw')||0),isFarBuilding:storage.getItem('isFarBuilding')==='true'}:undefined;
    return saveCheckpoint({map:getCurrentMap(),sceneKey:CURRENT_SCENE,position:{x:camera.position.x,y:camera.position.y,z:camera.position.z},yaw,pitch,storeName:PLAZA_CONFIG.IS_INTERIOR?PLAZA_CONFIG.name:undefined,returnState});
}
function restoreCheckpointExit(checkpoint) {
    for(const key of ['interiorCameraPosition','busStopCameraPosition','buildingPortalPosition','buildingReturnYaw','previousExteriorScene','isFarBuilding','isFarBuildingExit','activeStoreName','activeStoreScene'])storage.removeItem(key);
    if(checkpoint.sceneKey.endsWith('_INTERIOR')) {
        const returnState=checkpoint.returnState;
        storage.setItem('previousExteriorScene',returnState?.sceneKey||(checkpoint.map==='city'?'CITY_PLAZA':'PLAZA'));
        if(returnState) {
            storage.setItem('buildingPortalPosition',JSON.stringify(returnState.position));
            storage.setItem('buildingReturnYaw',String(returnState.yaw||0));
            storage.setItem('isFarBuilding',returnState.isFarBuilding?'true':'false');
        }
        if(checkpoint.storeName) { storage.setItem('activeStoreName',checkpoint.storeName);storage.setItem('activeStoreScene',checkpoint.sceneKey); }
    }
}
function restoreCheckpoint() {
    const defaultScene=getCurrentMap()==='city'?'CITY_PLAZA':'PLAZA';
    const checkpoint=adventureSnapshot.checkpoint||{map:getCurrentMap(),sceneKey:defaultScene,position:getBusStopArrivalPosition(defaultScene),yaw:0,pitch:0};
    if(!Object.hasOwn(SCENE_CONFIGS,checkpoint.sceneKey))return;
    closeStoryModal();resetNPCInteraction();resetControls();resetMobileControls();
    setCurrentMap(checkpoint.map);storage.setItem('suburbanAdventureScene',checkpoint.sceneKey);
    restoreCheckpointExit(checkpoint);
    rebuildWorld();camera.position.set(checkpoint.position.x,checkpoint.position.y,checkpoint.position.z);
    sanitizeCameraArrival();
    setYaw(checkpoint.yaw);setPitch(checkpoint.pitch);
}
document.addEventListener('game-return-safe',restoreCheckpoint);
document.addEventListener('game-travel',event=>{
    const {map,key}=event.detail||{};
    if(map!==getCurrentMap()||!adventureSnapshot.visited[map]?.some(area=>area.key===key)||PLAZA_CONFIG.IS_INTERIOR)return;
    const destination=getTravelPosition(map,key);
    const safe=destination&&findSafeArrival(destination,streetElements.exteriorCollisionRects);
    if(!safe)return;
    resetNPCInteraction();resetControls();resetMobileControls();camera.position.set(safe.x,2,safe.z);setYaw(0);setPitch(0);checkpointCurrentPosition();
});
window.addEventListener('pagehide',()=>{if(!getStoryModalOpen()&&!hasActiveConversation())checkpointCurrentPosition();});


// Initialize NPC interaction system
initializeNPCInteraction();
initializeConversationHandlers();

// handleActionInput: unified handler for Space/mobile button - conversations, items, portals, bus
export const handleActionInput = () => {
    if(document.getElementById('startup')||getPhoneOpenState()||getStoryModalOpen())return;
    if(hasActiveConversation()) { handleInteractionInput(CURRENT_SCENE);return; }
    checkBusStopProximity(camera,PLAZA_CONFIG,CURRENT_SCENE,streetElements);
    if(handleInteractionInput(CURRENT_SCENE))return;
    const target=getSelectedInteraction();
    if(!target)return;
    if(target.type==='portal') {
        const portal=target.object,destination=getBuildingPortalDestination(portal.style);
        checkpointCurrentPosition();
        visitBusiness(portal.name,portal.name,{map:getCurrentMap(),area:getAreaInfo(getCurrentMap(),camera.position).name});
        storage.setItem('previousExteriorScene',portal.zoneKey||CURRENT_SCENE);
        const pos=portal.returnPosition||{x:portal.position.x,z:portal.position.z+(portal.isFarBuilding?-3:3)};
        storage.setItem('buildingPortalPosition',JSON.stringify({x:pos.x,y:2,z:pos.z}));
        if(Number.isFinite(portal.returnYaw))storage.setItem('buildingReturnYaw',String(portal.returnYaw));else storage.removeItem('buildingReturnYaw');
        storage.setItem('isFarBuilding',portal.isFarBuilding?'true':'false');
        switchScene(destination.key,portal.name);return;
    }
    if(target.type==='exit') { switchScene(storage.getItem('previousExteriorScene')||'PLAZA');return; }
    if(target.type==='subway') { performMapSwitch();return; }
    if(target.type==='bus')openTransitChooser(getCurrentMap());
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

// Quick area inspection, including returning directly from an interior.
export const teleportToArea = number => {
    if (getPhoneOpenState() || getStoryModalOpen() || hasActiveConversation()) return false;
    const destination = getAreaTestPosition(number);
    if (!destination) return false;
    resetNPCInteraction(); resetControls(); resetMobileControls();
    if (PLAZA_CONFIG.IS_INTERIOR) {
        for (const key of ['interiorCameraPosition', 'buildingPortalPosition', 'buildingReturnYaw', 'isFarBuilding', 'previousExteriorScene']) storage.removeItem(key);
        storage.setItem('suburbanAdventureScene', getCurrentMap() === 'city' ? 'CITY_PLAZA' : 'PLAZA');
        storage.setItem('busStopCameraPosition', JSON.stringify(destination));
        rebuildWorld();
    } else camera.position.set(destination.x, destination.y, destination.z);
    setYaw(0); setPitch(0); camera.rotation.set(0, 0, 0, 'YXZ');
    return true;
};

// =====================================================
// KEYBOARD EVENT HANDLERS
// =====================================================
document.addEventListener('pointerdown',()=>{
    if(!document.getElementById('startup')&&!getPhoneOpenState()&&!getStoryModalOpen()&&adventureSnapshot.settings.ambience)void beginLandmarkAudio();
},{passive:true});
document.addEventListener('keydown', (event) => {
    if (document.getElementById('startup')) return;
    if(!getPhoneOpenState()&&!getStoryModalOpen()&&adventureSnapshot.settings.ambience&&!event.ctrlKey&&!event.metaKey)void beginLandmarkAudio();
    if(getStoryModalOpen()) { if(event.code==='Escape')closeStoryModal();return; }
    if (event.code === 'Escape' && hasActiveConversation()) {
        resetNPCInteraction();
        resetControls();
        resetMobileControls();
        return;
    }
    const inInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
    if (!getPhoneOpenState() && !hasActiveConversation() && !event.repeat && event.code === 'KeyT' && adventureSnapshot.settings.developerMode && !event.ctrlKey && !event.metaKey && !event.altKey && !inInput) {
        if (performMapSwitch()) return;
    }
    if (inInput || event.target.closest?.('button, [contenteditable]') || getPhoneOpenState() || getStoryModalOpen() || event.repeat) return;
    if (!hasActiveConversation() && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey
        && !document.activeElement?.isContentEditable && document.activeElement?.tagName !== 'SELECT') {
        const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
        if (digit && teleportToArea(Number(digit[1]))) { event.preventDefault(); return; }
    }
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
    () => {},
    () => {},
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
begin.onclick = () => { startup.remove(); storage.setItem('suburbanAdventureIntroduced', 'true');checkpointCurrentPosition();if(adventureSnapshot.settings.ambience)void beginLandmarkAudio(); };
startup.append(begin);
if (storage.getItem('suburbanAdventureIntroduced')) startup.remove();

console.log("✅ Suburban Adventure initialized with modular architecture!");



export const getRuntimeState = () => ({ scene, camera, streetElements, sceneKey: CURRENT_SCENE, config: PLAZA_CONFIG });
