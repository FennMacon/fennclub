import { createCityDistricts } from './world/city-districts.js';
import * as THREE from 'three';
import { createCar, getRandomCarColor } from './utils.js';
import { createUnifiedMapGround, createCityMapGround, createConnectorRoads, createCityConnectorRoads, createConnectorVehicles, createCityConnectorVehicles, createUnifiedMapTrees, createGroundFog, createForestClearings, createCarnival, createMansionCompound, createRiver, createZoneScene, createSubwayStop } from './world/zone-scene.js';
import { createInteriorScene, createShopInterior, INTERIOR_REGISTRY, INTERIOR_TARGET_SIZE } from './buildings.js';
import { createNPCs, createInteriorNPCs } from './npcs.js';
import { SCENE_CONFIGS, UNIFIED_MAP, UNIFIED_MAP_ZONE_OFFSETS, getCurrentMap, SUBWAY_POSITIONS, CITY_MAP_ZONE_OFFSETS } from './scenes.js';
import { createNightSky } from './nightsky.js';
import { createSkybox } from './skybox.js';
import { getFogConfigForZone } from './fog.js';

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
export function buildWorld(scene, camera, CURRENT_SCENE, PLAZA_CONFIG) {
    let streetElements = {}, interiorElements = {};
    if (PLAZA_CONFIG.IS_INTERIOR) scene.fog = null;
    else {
        const config = getFogConfigForZone(getCurrentMap() === 'city' ? 'CITY_PLAZA' : CURRENT_SCENE, CURRENT_SCENE);
        scene.fog = new THREE.Fog(config.color, config.near, config.far);
    }
    scene.add(new THREE.AmbientLight(0xffffff, PLAZA_CONFIG.HAUNTED_ATMOSPHERE ? 0.3 : 0.5));
    const light = new THREE.DirectionalLight(0xffffff, PLAZA_CONFIG.HAUNTED_ATMOSPHERE ? 0.5 : 0.8);
    light.position.set(10, 10, 5);
    scene.add(light);
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
    } else if (getCurrentMap() === 'city') {
        // City map (Allston-style) - 9 zones, 3 main street zones
        console.log('🗺️ Creating city map with 9-zone ground, connector roads, and CITY_PLAZA, CITY_N, CITY_S zones');
        createCityMapGround(scene);
        createCityConnectorRoads(scene);
        const cityDistricts = createCityDistricts(scene);
        cityDistricts.update(camera);
        const cityPlazaZone = createZoneScene(scene, SCENE_CONFIGS.CITY_PLAZA, CITY_MAP_ZONE_OFFSETS.CITY_PLAZA, 'CITY_PLAZA');
        const cityNorthZone = createZoneScene(scene, SCENE_CONFIGS.CITY_N, CITY_MAP_ZONE_OFFSETS.CITY_N, 'CITY_N');
        const citySouthZone = createZoneScene(scene, SCENE_CONFIGS.CITY_S, CITY_MAP_ZONE_OFFSETS.CITY_S, 'CITY_S');
        const solidMaterials=new Map();
        for(const zone of [cityPlazaZone,cityNorthZone,citySouthZone]) {
            for(const group of [zone.frontShopsGroup,zone.farBuildingsGroup,zone.nearSidewalkElementsGroup,zone.farSidewalkElementsGroup,zone.streetElementsGroup].filter(Boolean)) group.traverse(object=>{
                if(!object.isMesh||!object.material||Array.isArray(object.material)||object.material.opacity===0)return;
                if(!solidMaterials.has(object.material)) {
                    const mat=object.material.isShaderMaterial
                        ? new THREE.MeshLambertMaterial({color:object.material.uniforms.baseColor?.value || 0xaaa38e,side:object.material.side})
                        : object.material.clone();
                    mat.wireframe=false;mat.fog=true;
                    if(mat.color&&!mat.map) {
                        const hsl={};mat.color.getHSL(hsl);
                        mat.color.setHSL(hsl.l>.8?.12:hsl.h,hsl.l>.8?.12:Math.min(hsl.s*.22,.16),Math.max(.12,Math.min(hsl.l,.66)));
                    }
                    mat.needsUpdate=true;solidMaterials.set(object.material,mat);
                }
                object.material=solidMaterials.get(object.material);
            });
        }

    
        cityDistricts.signExistingBusinesses([...cityPlazaZone.buildingPortals,...cityNorthZone.buildingPortals,...citySouthZone.buildingPortals]);
        scene.userData.retiredMaterials=[...solidMaterials.keys()];
        const connectorVehiclesGroup = createCityConnectorVehicles(scene, createCar, getRandomCarColor);
        const connectorCars = connectorVehiclesGroup.children.filter(c => c.userData.roadType === 'vertical');

        const subwayStop = createSubwayStop(SUBWAY_POSITIONS.city.x, SUBWAY_POSITIONS.city.z);
        subwayStop.traverse(object=>{
            if(!object.isMesh||!object.material?.wireframe)return;
            const original=object.material,mat=original.clone();mat.wireframe=false;mat.fog=true;mat.needsUpdate=true;
            scene.userData.retiredMaterials.push(original);object.material=mat;
        });
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


    if (PLAZA_CONFIG.IS_INTERIOR || getCurrentMap() !== 'city') createNightSky(scene);
    const type = PLAZA_CONFIG.IS_INTERIOR ? CURRENT_SCENE : (getCurrentMap() === 'city' ? 'CITY_MAP' : (UNIFIED_MAP ? 'UNIFIED_MAP' : CURRENT_SCENE));
    createSkybox(scene, type, PLAZA_CONFIG.IS_INTERIOR ? streetElements.interiorDimensions : null);
    scene.userData.camera = camera;
    scene.userData.steamGroups = [];
    scene.traverse(object => { if (object.userData.steamParticles) scene.userData.steamGroups.push(object); });
    return streetElements;
}
