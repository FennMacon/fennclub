import {getCarLaneOffset} from '../roads.js';
import {createSuburbanRoadNetwork} from './suburban-roads.js';
// world/zone-scene.js - Zone and world creation
import * as THREE from 'three';
import { createWireframeMaterial, getRandomCarColor } from '../utils.js';
import { VERTICAL_BOUNDS, CONNECTOR_X, CITY_CONNECTOR_X } from '../roads.js';
import { GROUND_LAYERS, STREET_DEPTH, CONNECTOR_ROAD_WIDTH, CONNECTOR_ROAD_LENGTH, CONNECTOR_SIDEWALK_DEPTH } from './constants.js';

export const createConnectorRoads = (scene) => {
    const connectorGroup=createSuburbanRoadNetwork(scene);
    // Street lamps along connectors - density varies by region (fewer in countryside)
    const createConnectorStreetLamp = () => {
        const lampGroup = new THREE.Group();
        const concreteMaterial = createWireframeMaterial(0x999999);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8, 6, 1), concreteMaterial);
        base.position.y = 0.4;
        lampGroup.add(base);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 7, 6, 1), concreteMaterial);
        pole.position.y = 4;
        lampGroup.add(pole);
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 6, 1), concreteMaterial);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(0.8, 7.5, 0);
        lampGroup.add(arm);
        const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.6, 6, 1), createWireframeMaterial(0x777777));
        housing.rotation.x = Math.PI / 2;
        housing.position.set(2.0, 7.5, 0);
        lampGroup.add(housing);
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 4), createWireframeMaterial(0xFF8C00));
        light.position.set(2.0, 7.3, 0);
        lampGroup.add(light);
        const pointLight = new THREE.PointLight(0xFF8C00, 0.8, 10);
        pointLight.position.copy(light.position);
        lampGroup.add(pointLight);
        return lampGroup;
    };

    const leftCtrLeftSW = CONNECTOR_X.LEFT - (CONNECTOR_ROAD_WIDTH / 2 + CONNECTOR_SIDEWALK_DEPTH / 2);
    const leftCtrRightSW = CONNECTOR_X.LEFT + (CONNECTOR_ROAD_WIDTH / 2 + CONNECTOR_SIDEWALK_DEPTH / 2);
    const rightCtrLeftSW = CONNECTOR_X.RIGHT - (CONNECTOR_ROAD_WIDTH / 2 + CONNECTOR_SIDEWALK_DEPTH / 2);
    const rightCtrRightSW = CONNECTOR_X.RIGHT + (CONNECTOR_ROAD_WIDTH / 2 + CONNECTOR_SIDEWALK_DEPTH / 2);

    const lampPositions = [];
    const addLampZ = (z) => {
        if (Math.abs(z - 11) > 8 && Math.abs(z - 344) > 8 && Math.abs(z + 322) > 8) {
            lampPositions.push(z);
        }
    };
    for (let z = -100; z <= 100; z += 30) addLampZ(z);
    for (let z = 130; z <= 450; z += 45) addLampZ(z);
    for (let z = -450; z <= -130; z += 45) addLampZ(z);

    lampPositions.forEach((z) => {
        for (const x of [leftCtrLeftSW, leftCtrRightSW, rightCtrLeftSW, rightCtrRightSW]) {
            const lamp = createConnectorStreetLamp();
            lamp.position.set(x, 0, z);
            const roadCenterX = x < 0 ? CONNECTOR_X.LEFT : CONNECTOR_X.RIGHT;
            lamp.rotation.y = (x < roadCenterX ? Math.PI / 2 : -Math.PI / 2) + (3 * Math.PI / 2);
            connectorGroup.add(lamp);
        }
    });

    scene.add(connectorGroup);
    return connectorGroup;
};

/** City map: 2x road density - 4 vertical connectors + 2 horizontal cross-streets */
export const createCityConnectorRoads = (scene) => {
    const roadMaterial = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
    const sidewalkMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
    const connectorGroup = new THREE.Group();
    connectorGroup.name = "CityConnectorRoads";

    const halfLen = CONNECTOR_ROAD_LENGTH / 2;
    const mapHalfWidth = 500;

    // Add vertical corridor at given x
    const addVerticalCorridor = (roadCenterX) => {
        const offset = CONNECTOR_ROAD_WIDTH / 2 + CONNECTOR_SIDEWALK_DEPTH / 2;
        const leftX = roadCenterX - offset;
        const rightX = roadCenterX + offset;

        [leftX, rightX].forEach((sx) => {
            const sw = new THREE.Mesh(
                new THREE.PlaneGeometry(CONNECTOR_SIDEWALK_DEPTH, CONNECTOR_ROAD_LENGTH),
                sidewalkMaterial.clone()
            );
            sw.rotation.x = -Math.PI / 2;
            sw.position.set(sx, GROUND_LAYERS.concrete, 0);
            connectorGroup.add(sw);
        });

        const road = new THREE.Mesh(
            new THREE.PlaneGeometry(CONNECTOR_ROAD_WIDTH, CONNECTOR_ROAD_LENGTH),
            roadMaterial.clone()
        );
        road.rotation.x = -Math.PI / 2;
        road.position.set(roadCenterX, GROUND_LAYERS.asphalt, 0);
        connectorGroup.add(road);

        // Center lines
        const yellowMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        [-0.1, 0.1].forEach((dx) => {
            const line = new THREE.Mesh(
                new THREE.PlaneGeometry(0.1, CONNECTOR_ROAD_LENGTH),
                yellowMat.clone()
            );
            line.rotation.x = -Math.PI / 2;
            line.position.set(roadCenterX + dx, GROUND_LAYERS.markings, 0);
            connectorGroup.add(line);
        });
    };

    // Add horizontal corridor at given z. Zone street levels (11, 344, -322) get road only;
    // zones own sidewalks there. Cross-streets (166, -166) get full corridor.
    const addHorizontalCorridor = (roadCenterZ, roadsOnly = false) => {
        if (!roadsOnly) {
            const offset = CONNECTOR_ROAD_WIDTH / 2 + CONNECTOR_SIDEWALK_DEPTH / 2;
            const northZ = roadCenterZ + offset;
            const southZ = roadCenterZ - offset;

            [northZ, southZ].forEach((sz) => {
                const sw = new THREE.Mesh(
                    new THREE.PlaneGeometry(mapHalfWidth * 2, CONNECTOR_SIDEWALK_DEPTH),
                    sidewalkMaterial.clone()
                );
                sw.rotation.x = -Math.PI / 2;
                sw.position.set(0, GROUND_LAYERS.concrete, sz);
                connectorGroup.add(sw);
            });
        }

        const road = new THREE.Mesh(
            new THREE.PlaneGeometry(mapHalfWidth * 2, CONNECTOR_ROAD_WIDTH),
            roadMaterial.clone()
        );
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, GROUND_LAYERS.asphalt, roadCenterZ);
        connectorGroup.add(road);

        const yellowMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        [-0.1, 0.1].forEach((dz) => {
            const line = new THREE.Mesh(
                new THREE.PlaneGeometry(mapHalfWidth * 2, 0.1),
                yellowMat.clone()
            );
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, GROUND_LAYERS.markings, roadCenterZ + dz);
            connectorGroup.add(line);
        });
    };

    const ZONE_STREET_Z = [11, 344, -322];
    const CROSS_STREET_Z = [166, -166];

    CITY_CONNECTOR_X.forEach(addVerticalCorridor);
    ZONE_STREET_Z.forEach((z) => addHorizontalCorridor(z, true));
    CROSS_STREET_Z.forEach((z) => addHorizontalCorridor(z, false));

    // Junctions at intersections
    const junctionMat = roadMaterial.clone();
    const cornerMat = sidewalkMaterial.clone();
    const cornerSize = 6;
    const cornerOffset = 9;
    const allVerticalX = CITY_CONNECTOR_X;
    const allHorizontalZ = [11, 166, 344, -166, -322];  // zone streets + cross streets

    allVerticalX.forEach((connX) => {
        allHorizontalZ.forEach((zoneZ) => {
            const asphalt = new THREE.Mesh(
                new THREE.PlaneGeometry(CONNECTOR_ROAD_WIDTH, STREET_DEPTH),
                junctionMat.clone()
            );
            asphalt.rotation.x = -Math.PI / 2;
            asphalt.position.set(connX, GROUND_LAYERS.asphalt, zoneZ);
            connectorGroup.add(asphalt);

            [[connX - cornerOffset, zoneZ - cornerOffset], [connX + cornerOffset, zoneZ - cornerOffset],
             [connX - cornerOffset, zoneZ + cornerOffset], [connX + cornerOffset, zoneZ + cornerOffset]].forEach(([x, z]) => {
                const corner = new THREE.Mesh(
                    new THREE.PlaneGeometry(cornerSize, cornerSize),
                    cornerMat.clone()
                );
                corner.rotation.x = -Math.PI / 2;
                corner.position.set(x, GROUND_LAYERS.concrete, z);
                connectorGroup.add(corner);
            });
        });
    });

    scene.add(connectorGroup);
    return connectorGroup;
};

// Connector road vehicles - drive along Z on x = ±170
export const createConnectorVehicles = (scene, createCarFn, getRandomCarColor) => {
    const connectorVehiclesGroup = new THREE.Group();
    connectorVehiclesGroup.name = "ConnectorVehicles";
    connectorVehiclesGroup.position.set(0, 0, 0);
    
    const roads = [
        { x: CONNECTOR_X.LEFT, direction: 'left' },
        { x: CONNECTOR_X.LEFT, direction: 'right' },
        { x: CONNECTOR_X.RIGHT, direction: 'left' },
        { x: CONNECTOR_X.RIGHT, direction: 'right' }
    ];
    
    roads.forEach((road, i) => {
        const car = createCarFn(road.x + getCarLaneOffset(road.direction), getRandomCarColor(), road.direction, { vertical: true });
        car.position.set(road.x + getCarLaneOffset(road.direction), 0, -300 + i * 150); // Spread along Z
        car.userData.roadType = 'vertical';
        car.userData.bounds = { ...VERTICAL_BOUNDS };
        car.userData.connectorX = road.x;
        connectorVehiclesGroup.add(car);
    });
    
    scene.add(connectorVehiclesGroup);
    return connectorVehiclesGroup;
};

/** City connector vehicles - 4 vertical roads */
export const createCityConnectorVehicles = (scene, createCarFn, getRandomCarColor) => {
    const connectorVehiclesGroup = new THREE.Group();
    connectorVehiclesGroup.name = "CityConnectorVehicles";

    const roads = [];
    CITY_CONNECTOR_X.forEach((x) => {
        roads.push({ x, direction: 'left' });
        roads.push({ x, direction: 'right' });
    });

    roads.forEach((road, i) => {
        const car = createCarFn(road.x + getCarLaneOffset(road.direction), getRandomCarColor(), road.direction, { vertical: true });
        car.position.set(road.x + getCarLaneOffset(road.direction), 0, -350 + (i % 8) * 90);
        car.userData.roadType = 'vertical';
        car.userData.bounds = { ...VERTICAL_BOUNDS };
        car.userData.connectorX = road.x;
        connectorVehiclesGroup.add(car);
    });

    scene.add(connectorVehiclesGroup);
    return connectorVehiclesGroup;
};

/** City map: triple deckers spawn like trees - distance-based, avoid roads, less dense than trees */
