import {createNavigationCues} from './world/navigation-cues.js';
import {createStoryWorldItems} from './story-activities.js';
import {createCityRoadNetwork} from './world/city-roads.js';
import { createCityDistricts } from './world/city-districts.js';
import * as THREE from 'three';
import { createCar, getRandomCarColor } from './utils.js';
import { createUnifiedMapGround, createCityMapGround, createConnectorRoads, createCityConnectorRoads, createConnectorVehicles, createCityConnectorVehicles, createUnifiedMapTrees, createGroundFog, createForestClearings, createCarnival, createMansionCompound, createRiver, createZoneScene, createSubwayStop } from './world/zone-scene.js';
import { createInteriorScene, createShopInterior, INTERIOR_REGISTRY, INTERIOR_TARGET_SIZE } from './buildings.js';
import { createNPCs, createInteriorNPCs, createCityNPCs } from './npcs.js';
import { SCENE_CONFIGS, UNIFIED_MAP, UNIFIED_MAP_ZONE_OFFSETS, getCurrentMap, SUBWAY_POSITIONS, CITY_MAP_ZONE_OFFSETS } from './scenes.js';
import { createNightSky, updateNightSky } from './nightsky.js';
import { INITIAL_DAY_PROGRESS } from './world/suburban-atmosphere.js';
import { createSkybox, updateSkybox } from './skybox.js';
import { getFogConfigForZone, updateZoneFog } from './fog.js';

export function disposeWorld(scene) {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    scene.traverse(object => {
        if (object.isInstancedMesh) object.dispose();
        if (object.geometry) geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            if (!material) continue;
            materials.add(material);
            Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
            Object.values(material.uniforms || {}).forEach(uniform => { if (uniform.value?.isTexture) textures.add(uniform.value); });
        }
    });
    if (scene.background?.isTexture) textures.add(scene.background);
    if (scene.environment?.isTexture) textures.add(scene.environment);
    for(const mat of scene.userData.retiredMaterials || [])materials.add(mat);
    geometries.forEach(value => value.dispose());
    materials.forEach(value => value.dispose());
    textures.forEach(value => value.dispose());
    scene.clear();
    scene.background = scene.environment = null;
    scene.userData = {};
}
export function buildWorld(scene, camera, CURRENT_SCENE, PLAZA_CONFIG, mapOverride = null) {
    const mapType = mapOverride || getCurrentMap();
    let streetElements = {}, interiorElements = {};
    if (PLAZA_CONFIG.IS_INTERIOR) scene.fog = null;
    else {
        const config = getFogConfigForZone(mapType === 'city' ? 'CITY_PLAZA' : CURRENT_SCENE, CURRENT_SCENE);
        scene.fog = new THREE.Fog(config.color, config.near, config.far);
    }
    const ambient = new THREE.AmbientLight(0xffffff, PLAZA_CONFIG.HAUNTED_ATMOSPHERE ? 0.3 : 0.5);
    scene.add(ambient);
    const light = new THREE.DirectionalLight(0xffffff, PLAZA_CONFIG.HAUNTED_ATMOSPHERE ? 0.5 : 0.8);
    light.position.set(10, 10, 5);
    scene.add(light);
    if (!PLAZA_CONFIG.IS_INTERIOR && mapType !== 'city') {
        scene.userData.daylight = { ambient, directional: light };
        scene.add(light.target);
    }
    // Check if we're in an interior scene
    if (PLAZA_CONFIG.IS_INTERIOR) {
        // Create interior scene based on interior type
        console.log(`🏪 Creating interior scene: ${PLAZA_CONFIG.name}`);
    
        let interiorGroup;
        let interiorDimensions = { width: 0, depth: 0 };

        const registryEntry = INTERIOR_REGISTRY[CURRENT_SCENE];
        if (registryEntry) {
            interiorGroup = registryEntry.create(scene);
            interiorDimensions = registryEntry.dimensions;
        } else {
            // Generic interior for unregistered scene types
            interiorGroup = createShopInterior(scene, PLAZA_CONFIG.INTERIOR_TYPE, PLAZA_CONFIG.name, INTERIOR_TARGET_SIZE, INTERIOR_TARGET_SIZE);
            interiorDimensions = { width: INTERIOR_TARGET_SIZE, depth: INTERIOR_TARGET_SIZE };
        }
    
        // Store interior dimensions for skybox floor adjustment
        streetElements.interiorDimensions = interiorDimensions;
    
        // Store reference for exit portal and interior bounds
        streetElements.interiorGroup = interiorGroup;
        streetElements.interiorUpdate = interiorGroup.userData.update;
        streetElements.interiorBounds = interiorGroup.userData.bounds;
        streetElements.interiorCollisionRects = interiorGroup.userData.collisionRects;
        streetElements.exitPortal = null; // Will be set by finding the exit door
    
        // Find exit door in the interior
        interiorGroup.traverse((child) => {
            if (child.userData && child.userData.isExitPortal) {
                streetElements.exitPortal = child;
            }
        });
    
        // Extract interactive items for flavor text system
        streetElements.interactiveItems = interiorGroup.userData.interactiveItems || [];
    
        streetElements.npcs = createInteriorNPCs(CURRENT_SCENE, interiorGroup);
    } else if (mapType === 'city') {
        // City map (Allston-style) - 9 zones, 3 main street zones
        console.log('🗺️ Creating city map with 9-zone ground, connector roads, and CITY_PLAZA, CITY_N, CITY_S zones');
        createCityMapGround(scene);
        createCityRoadNetwork(scene);
        const cityDistricts = createCityDistricts(scene);
        cityDistricts.update(camera);
        const cityPlazaZone = createZoneScene(scene, SCENE_CONFIGS.CITY_PLAZA, CITY_MAP_ZONE_OFFSETS.CITY_PLAZA, 'CITY_PLAZA');
        const cityNorthZone = createZoneScene(scene, SCENE_CONFIGS.CITY_N, CITY_MAP_ZONE_OFFSETS.CITY_N, 'CITY_N');
        const citySouthZone = createZoneScene(scene, SCENE_CONFIGS.CITY_S, CITY_MAP_ZONE_OFFSETS.CITY_S, 'CITY_S');
        const exteriorMaterials=new Map();
        for(const zone of [cityPlazaZone,cityNorthZone,citySouthZone]) {
            for(const group of [zone.frontShopsGroup,zone.farBuildingsGroup,zone.nearSidewalkElementsGroup,zone.farSidewalkElementsGroup,zone.streetElementsGroup].filter(Boolean))group.traverse(object=>{
                if(!object.isMesh||!object.material||Array.isArray(object.material))return;
                if(object.geometry?.type==='PlaneGeometry'&&object.position.y>3&&!object.material.map)object.visible=false;
                if(!object.material.isShaderMaterial)return;
                if(!exteriorMaterials.has(object.material))exteriorMaterials.set(object.material,new THREE.MeshBasicMaterial({color:object.material.uniforms.baseColor?.value||0xb8ac95,wireframe:true,fog:true,side:object.material.side}));
                object.material=exteriorMaterials.get(object.material);
            });
        }

        cityDistricts.signExistingBusinesses([...cityPlazaZone.buildingPortals,...cityNorthZone.buildingPortals,...citySouthZone.buildingPortals]);
        scene.userData.retiredMaterials=[...exteriorMaterials.keys()];
        const connectorVehiclesGroup = createCityConnectorVehicles(scene, createCar, getRandomCarColor);
        const connectorCars = connectorVehiclesGroup.children.filter(c => c.userData.roadType === 'vertical');

        const subwayStop = createSubwayStop(SUBWAY_POSITIONS.city.x, SUBWAY_POSITIONS.city.z);
        scene.add(subwayStop);
    
        streetElements = {
            ...cityPlazaZone,
            cityDistricts,
            buildingPortals: [...(cityPlazaZone.buildingPortals || []), ...(cityNorthZone.buildingPortals || []), ...(citySouthZone.buildingPortals || []), ...cityDistricts.buildingPortals],
            npcs: [...(cityPlazaZone.npcs || []), ...(cityNorthZone.npcs || []), ...(citySouthZone.npcs || [])],
            zoneRootGroups: [cityPlazaZone.zoneRootGroup, cityNorthZone.zoneRootGroup, citySouthZone.zoneRootGroup],
            cars: [...(cityPlazaZone.cars || []), ...(cityNorthZone.cars || []), ...(citySouthZone.cars || []), ...connectorCars],
            connectorVehiclesGroup,
            buses: [cityPlazaZone.bus, cityNorthZone.bus, citySouthZone.bus].filter(Boolean),
            subwayStopPosition: SUBWAY_POSITIONS.city,
            mapType: 'city'
        };
        streetElements.interactiveItems = cityDistricts.interactiveItems;
        interiorElements = createInteriorScene(streetElements.frontShopsGroup);
        console.log('🗺️ City map ready.');
    } else if (UNIFIED_MAP) {
        // Create unified map - 1000x1000 ground, connector roads, and three populated zones
        console.log('🗺️ Creating unified map with 9-zone ground, connector roads, and PLAZA, FOREST_SUBURBAN, POND zones');
        createUnifiedMapGround(scene);
        createGroundFog(scene);
        createConnectorRoads(scene);
        const clearingResult = createForestClearings(scene);
        const carnivalResult = createCarnival(scene);
        const mansionResult = createMansionCompound(scene);
        const riverResult = createRiver(scene);
        const unifiedMapTrees = createUnifiedMapTrees(scene);
        const plazaZone = createZoneScene(scene, SCENE_CONFIGS.PLAZA, UNIFIED_MAP_ZONE_OFFSETS.PLAZA, 'PLAZA');
        const forestZone = createZoneScene(scene, SCENE_CONFIGS.FOREST_SUBURBAN, UNIFIED_MAP_ZONE_OFFSETS.FOREST_SUBURBAN, 'FOREST_SUBURBAN');
        const pondZone = createZoneScene(scene, SCENE_CONFIGS.POND, UNIFIED_MAP_ZONE_OFFSETS.POND, 'POND');
    
        const subwayStop = createSubwayStop(SUBWAY_POSITIONS.suburban.x, SUBWAY_POSITIONS.suburban.z);
        scene.add(subwayStop);
    
        const connectorVehiclesGroup = createConnectorVehicles(scene, createCar, getRandomCarColor);
        const connectorCars = connectorVehiclesGroup.children.filter(c => c.userData.roadType === 'vertical');
    
        // Merge zone results - combine all cars and buses from all zones + connector vehicles
        streetElements = {
            ...plazaZone,
            mapType: 'suburban',
            riverUpdate: riverResult?.updateFlow,
            carnivalUpdate: carnivalResult?.updateCarnival,
            unifiedMapTrees,
            buildingPortals: [...(plazaZone.buildingPortals || []), ...(forestZone.buildingPortals || []), ...(pondZone.buildingPortals || []), ...(mansionResult.buildingPortals || [])],
            npcs: [...(plazaZone.npcs || []), ...(forestZone.npcs || []), ...(pondZone.npcs || [])],
            zoneRootGroups: [plazaZone.zoneRootGroup, forestZone.zoneRootGroup, pondZone.zoneRootGroup],
            pondElements: pondZone.pondElements,
            campfire: pondZone.campfire,
            pond: pondZone.pond,
            campsiteObjects: pondZone.campsiteObjects,
            cars: [...(plazaZone.cars || []), ...(forestZone.cars || []), ...(pondZone.cars || []), ...connectorCars],
            connectorVehiclesGroup,
            buses: [plazaZone.bus, forestZone.bus, pondZone.bus].filter(Boolean),
            subwayStopPosition: SUBWAY_POSITIONS.suburban
        };
        streetElements.interactiveItems = [
            ...(clearingResult?.interactiveItems || []),
            ...(carnivalResult?.interactiveItems || []),
            ...(mansionResult?.interactiveItems || [])
        ];
    
        // Create interior elements for karaoke bar (only in PLAZA zone)
        interiorElements = createInteriorScene(streetElements.frontShopsGroup);
    
        // Use PLAZA config for animation/compatibility refs (cars, bus, etc. from PLAZA zone)
        console.log('🗺️ Unified map ready. Building portals:', streetElements.buildingPortals?.length, 'NPCs:', streetElements.npcs?.length);
    } else {
        // Create single street scene (exterior) - legacy scene-switching mode
        streetElements = createZoneScene(scene, PLAZA_CONFIG, { x: 0, z: 0 }, CURRENT_SCENE);
    
        // Initialize interactive items as empty array for exterior scenes
        streetElements.interactiveItems = [];
    
        // Create interior elements for karaoke bar (only in PLAZA scene)
        if (CURRENT_SCENE === 'PLAZA') {
            interiorElements = createInteriorScene(streetElements.frontShopsGroup);
        }
    
        // Add NPCs (already created by createZoneScene)
        streetElements.npcs = streetElements.npcs || createNPCs(PLAZA_CONFIG, CURRENT_SCENE, scene);
    }


    if(PLAZA_CONFIG.IS_INTERIOR) {
        scene.updateMatrixWorld(true);
        const props=[];
        for(const item of streetElements.interactiveItems||[]) {
            const bounds=new THREE.Box3().setFromObject(item),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
            if(size.x>1&&size.z>1&&size.x<=8&&size.z<=8&&size.y>.4&&bounds.min.y<2)
                props.push({x:center.x,z:center.z,width:size.x,depth:size.z});
        }
        streetElements.interiorCollisionRects=[...(streetElements.interiorCollisionRects||[]),...props];
    }
    streetElements.interactiveItems=[...(streetElements.interactiveItems||[]),...createStoryWorldItems(THREE,scene,{map:mapType,sceneKey:CURRENT_SCENE})];
    if(!PLAZA_CONFIG.IS_INTERIOR) {
        if(mapType==='city')streetElements.npcs.push(...createCityNPCs(scene));
        scene.updateMatrixWorld(true);
        const rects=[];
        if(streetElements.cityDistricts)for(const lot of streetElements.cityDistricts.plan.lots)
            rects.push({minX:lot.x-lot.width/2,maxX:lot.x+lot.width/2,minZ:lot.z-lot.depth/2,maxZ:lot.z+lot.depth/2});
        for(const portal of streetElements.buildingPortals||[])if(portal.building) {
            const bounds=new THREE.Box3().setFromObject(portal.building);
            if(!bounds.isEmpty())rects.push({minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z});
        }
        // The karaoke room is continuous with the street; retain its open front doorway.
        const karaokeZ=SCENE_CONFIGS[mapType==='city'?'CITY_PLAZA':'PLAZA'].FRONT_SHOPS_Z;
        rects.push({minX:-10,maxX:-.9,minZ:karaokeZ-.12,maxZ:karaokeZ+.12},
            {minX:.9,maxX:10,minZ:karaokeZ-.12,maxZ:karaokeZ+.12},
            {minX:-10.12,maxX:-9.88,minZ:karaokeZ-15,maxZ:karaokeZ},
            {minX:9.88,maxX:10.12,minZ:karaokeZ-15,maxZ:karaokeZ},
            {minX:-10,maxX:10,minZ:karaokeZ-15.12,maxZ:karaokeZ-14.88});
        const mansion=scene.getObjectByName('MansionHouse');
        if(mansion) { const bounds=new THREE.Box3().setFromObject(mansion);rects.push({minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z}); }
        streetElements.exteriorCollisionRects=rects;
        if(mapType!=='city') {
            const cues=createNavigationCues(scene,streetElements.buildingPortals||[],camera);
            streetElements.navigationCues=cues.group;streetElements.navigationUpdate=cues.update;
        }
    }

    if (!PLAZA_CONFIG.IS_INTERIOR && mapType !== 'city') createNightSky(scene);
    const type = PLAZA_CONFIG.IS_INTERIOR ? CURRENT_SCENE : (mapType === 'city' ? 'CITY_MAP' : (UNIFIED_MAP ? 'UNIFIED_MAP' : CURRENT_SCENE));
    createSkybox(scene, type, PLAZA_CONFIG.IS_INTERIOR ? streetElements.interiorDimensions : null);
    scene.userData.camera = camera;
    if (type === 'UNIFIED_MAP') {
        updateZoneFog(scene, camera, streetElements, false, INITIAL_DAY_PROGRESS);
        updateSkybox(scene, 0, INITIAL_DAY_PROGRESS);
        updateNightSky(scene, 0, INITIAL_DAY_PROGRESS, camera);
    }
    scene.userData.steamGroups = [];
    scene.traverse(object => { if (object.userData.steamParticles) scene.userData.steamGroups.push(object); });
    return streetElements;
}
