import { createTeacups } from './teacups.js';
import { createCarnivalMidway } from './carnival-midway.js';
import { CARNIVAL_ADDITIONS, createCarnivalRide } from './carnival-rides.js';
import { createZipper } from './zipper.js';
// world/zone-scene.js - Zone and world creation
import * as THREE from 'three';
import { createWireframeMaterial, createTree } from '../utils.js';
import { getFlavorContent } from '../content-loader.js';
import { createBuildingFacade, createTripleDeckerBuilding } from '../buildings.js';
import { GROUND_LAYERS } from './constants.js';

import { ZONE_NW_MANSION, ZONE_W_CARNIVAL, ZONE_SW_CLEARING_CONFIG, ZONE_SW_PATH_WAYPOINTS, RIVER_CONFIG } from './config.js';
const createWoodsChair = (mat) => {
    const group = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 1), mat(0x333333));
    seat.position.y = 0.5;
    group.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.08), mat(0x333333));
    back.position.set(0, 0.9, -0.5);
    group.add(back);
    for (const [ax, az] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), mat(0x222222));
        leg.position.set(ax, 0.25, az);
        group.add(leg);
    }
    group.rotation.y = 0.4;
    group.rotation.x = 0.08;
    return group;
};

const createStreetLamp = (mat) => {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4, 8), mat(0x444444));
    pole.position.y = 2;
    group.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 1.2), mat(0x444444));
    arm.position.set(0, 4, 0.6);
    arm.rotation.x = Math.PI / 2;
    group.add(arm);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), mat(0x555555));
    head.position.set(0, 4, 1.2);
    group.add(head);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mat(0x444466, 0.25));
    glow.position.set(0, 4, 1.2);
    group.add(glow);
    group.rotation.y = -0.3;
    return group;
};

const createStoneCircle = (mat, count = 9, circleRadius = 4.5) => {
    const group = new THREE.Group();
    const seed = 0.1; // Fixed seed so circle is deterministic
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + seed;
        const r = circleRadius + ((i * 0.1) % 1 - 0.5) * 0.8;
        const sx = Math.cos(angle) * r;
        const sz = Math.sin(angle) * r;
        const stone = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.35 + (i % 3) * 0.06, 0),
            mat(0x3a3a3a)
        );
        stone.position.set(sx, 0.2, sz);
        stone.rotation.set((i % 5) * 0.1, (i * 0.7) % (Math.PI * 2), (i % 4) * 0.08);
        group.add(stone);
    }
    return group;
};

const createOddPatch = (mat) => {
    const group = new THREE.Group();
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), mat(0x1a1a1a));
    chair.position.y = 0.25;
    group.add(chair);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.06, 16), mat(0x222222));
    base.position.y = 0.03;
    group.add(base);
    group.rotation.y = Math.PI / 2 + 0.1;
    return group;
};

const createEmptyTable = (mat) => {
    const group = new THREE.Group();
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.9), mat(0x4a3728));
    tableTop.position.y = 0.76;
    group.add(tableTop);
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.75, 8), mat(0x3a2a1a));
    leg1.position.set(-0.55, 0.375, -0.35);
    group.add(leg1);
    const leg2 = leg1.clone();
    leg2.position.set(0.55, 0.375, -0.35);
    group.add(leg2);
    const leg3 = leg1.clone();
    leg3.position.set(-0.55, 0.375, 0.35);
    group.add(leg3);
    const leg4 = leg1.clone();
    leg4.position.set(0.55, 0.375, 0.35);
    group.add(leg4);
    const pulledChair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), mat(0x333333));
    pulledChair.position.set(0, 0.5, -0.7);
    pulledChair.rotation.x = -0.05;
    group.add(pulledChair);
    return group;
};

const createTrafficCone = (mat) => {
    const group = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.35, 0.9, 8), mat(0xFF6600));
    cone.position.y = 0.45;
    group.add(cone);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.15, 8), mat(0xFFFFFF));
    stripe.position.y = 0.3;
    group.add(stripe);
    return group;
};

const createAbandonedCart = (mat) => {
    const group = new THREE.Group();
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), mat(0x666666));
    basket.position.y = 0.5;
    group.add(basket);
    const wheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12), mat(0x333333));
    wheel1.rotation.x = Math.PI / 2;
    wheel1.position.set(-0.4, 0.12, 0.32);
    group.add(wheel1);
    const wheel2 = wheel1.clone();
    wheel2.position.set(0.4, 0.12, 0.32);
    group.add(wheel2);
    const wheel3 = wheel1.clone();
    wheel3.position.set(-0.4, 0.08, -0.32);
    wheel3.rotation.z = 0.15;
    group.add(wheel3);
    const wheel4 = wheel1.clone();
    wheel4.position.set(0.4, 0.12, -0.32);
    group.add(wheel4);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), mat(0x555555));
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(0, 0.6, 0.35);
    group.add(handle);
    group.rotation.y = 0.2;
    return group;
};

const createPropByType = (type, mat) => {
    switch (type) {
        case 'chair': return createWoodsChair(mat);
        case 'lamp': return createStreetLamp(mat);
        case 'stoneCircle': return createStoneCircle(mat);
        case 'oddPatch': return createOddPatch(mat);
        case 'emptyTable': return createEmptyTable(mat);
        case 'trafficCone': return createTrafficCone(mat);
        case 'shoppingCart': return createAbandonedCart(mat);
        default: return createWoodsChair(mat);
    }
};

const addPathSegments = (group, waypoints, pathMat, pathWidth = 3.5, pathY = -0.2) => {
    for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i];
        const p2 = waypoints[i + 1];
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        const seg = new THREE.Mesh(
            new THREE.PlaneGeometry(length, pathWidth),
            pathMat
        );
        seg.rotation.x = -Math.PI / 2;
        seg.rotation.z = angle;
        seg.position.set((p1.x + p2.x) / 2, pathY, (p1.z + p2.z) / 2);
        group.add(seg);
    }
};

/** Forest clearings in ZONE_SW (left column, bottom). Trees excluded via createUnifiedMapTrees. */
export const createForestClearings = (scene) => {
    const group = new THREE.Group();
    group.name = "ForestClearings";
    const mat = (c, o = 1) => createWireframeMaterial(c, o);
    const interactiveItems = [];

    const pathMat = createWireframeMaterial(0x3E3A32);
    addPathSegments(group, ZONE_SW_PATH_WAYPOINTS, pathMat);

    for (const c of ZONE_SW_CLEARING_CONFIG) {
        const prop = createPropByType(c.type, mat);
        prop.position.set(c.x, 0, c.z);
        const content = getFlavorContent(c.contentId);
        prop.userData.isInteractive = true;
        prop.userData.name = content.name;
        prop.userData.flavorText = content.flavorText;
        group.add(prop);
        interactiveItems.push(prop);
    }

    scene.add(group);
    return { group, interactiveItems };
};

/** Eight animated rides arranged around the open central road, with inspectable entrances. */
export const createCarnival = (scene) => {
    const group = new THREE.Group();
    group.name = "Carnival";
    const { x: cx, z: cz } = ZONE_W_CARNIVAL;
    const mat = (c, o = 1) => createWireframeMaterial(c, o);
    const interactiveItems = [];

    // --- FERRIS WHEEL (rebuilt: RingGeometry rim, Cylinder spokes, explicit YZ plane) ---
    const ferrisGroup = new THREE.Group();
    ferrisGroup.name = "FerrisWheel";
    ferrisGroup.position.set(cx - 25, 0, cz - 40);

    // Chassis/base (trailer platform towers sit on)
    const chassisW = 20;
    const chassisD = 14;
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(chassisW, 0.4, chassisD), mat(0x444444));
    chassis.position.y = 0.2;
    ferrisGroup.add(chassis);

    const fRadius = 12;
    const wheelBottomY = 0.5;  // lowest gondola at y=0.5
    const axleHeight = wheelBottomY + fRadius;
    const towerXOffset = 2.8;  // supports sit just outside wheel rims
    const axleLength = towerXOffset * 2; // light-red hub axle ends at leg connection points
    const SPOKE_COUNT = 16;
    const gondolaAngles = [];

    // Rotating wheel group at axle height
    const ferrisWheelRotating = new THREE.Group();
    ferrisWheelRotating.position.set(0, axleHeight, 0);

    // Hub/axle (axis along X) - red center
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, axleLength, 12), mat(0xCC0000));
    hub.rotation.z = Math.PI / 2;
    ferrisWheelRotating.add(hub);

    // Dual rims: red circles on either side of gondolas (like real ferris wheel structure)
    const rimOffset = 1.2;  // distance from center along X to each rim
    const gondolaWidth = rimOffset * 2; // make carts span between both red rims
    for (const xOff of [-rimOffset, rimOffset]) {
        const rim = new THREE.Mesh(new THREE.RingGeometry(fRadius - 0.3, fRadius + 0.3, 32), mat(0xAA0000));
        rim.rotation.y = Math.PI / 2;
        rim.position.x = xOff;
        ferrisWheelRotating.add(rim);
    }

    const createFerrisGondola = () => {
        const gondola = new THREE.Group();

        const bodyMat = mat(0x0066FF);
        const trimMat = mat(0x003C99);
        const lightTrimMat = mat(0x66B3FF);
        const roofMat = mat(0x1E90FF);
        const supportMat = mat(0xFFD54A);

        // Main bucket body
        const body = new THREE.Mesh(new THREE.BoxGeometry(gondolaWidth * 0.9, 0.55, 1.05), bodyMat);
        body.position.y = 0.02;
        gondola.add(body);

        // Lower lip for the classic open cart silhouette
        const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(gondolaWidth * 0.96, 0.14, 1.14), trimMat);
        lowerLip.position.y = -0.28;
        gondola.add(lowerLip);

        // Side rails around the open top
        const railHeight = 0.33;
        const sideRailLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 1.12), lightTrimMat);
        sideRailLeft.position.set(-gondolaWidth * 0.45, railHeight, 0);
        gondola.add(sideRailLeft);
        const sideRailRight = sideRailLeft.clone();
        sideRailRight.position.x = gondolaWidth * 0.45;
        gondola.add(sideRailRight);
        const frontRail = new THREE.Mesh(new THREE.BoxGeometry(gondolaWidth * 0.84, 0.3, 0.08), lightTrimMat);
        frontRail.position.set(0, railHeight, 0.52);
        gondola.add(frontRail);
        const backRail = frontRail.clone();
        backRail.position.z = -0.52;
        gondola.add(backRail);

        // Bench seat
        const seat = new THREE.Mesh(new THREE.BoxGeometry(gondolaWidth * 0.66, 0.12, 0.42), trimMat);
        seat.position.set(0, -0.03, -0.12);
        gondola.add(seat);
        const seatBack = new THREE.Mesh(new THREE.BoxGeometry(gondolaWidth * 0.66, 0.28, 0.1), trimMat);
        seatBack.position.set(0, 0.12, -0.3);
        gondola.add(seatBack);

        // Canopy and supports
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(gondolaWidth + 0.25, 0.12, 1.25), roofMat);
        canopy.position.y = 0.78;
        gondola.add(canopy);
        const supportLength = 0.5;
        const supportGeom = new THREE.CylinderGeometry(0.03, 0.03, supportLength, 8);
        const supportOffsets = [
            [-gondolaWidth * 0.34, 0.56, 0.42],
            [gondolaWidth * 0.34, 0.56, 0.42],
            [-gondolaWidth * 0.34, 0.56, -0.42],
            [gondolaWidth * 0.34, 0.56, -0.42]
        ];
        supportOffsets.forEach(([x, y, z]) => {
            const post = new THREE.Mesh(supportGeom, supportMat);
            post.position.set(x, y, z);
            gondola.add(post);
        });

        // Classic hanger arm and pivot cap
        const hangerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.62, 8), supportMat);
        hangerArm.position.y = 1.1;
        gondola.add(hangerArm);
        const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, gondolaWidth * 0.58, 8), supportMat);
        yoke.rotation.z = Math.PI / 2;
        yoke.position.y = 1.36;
        gondola.add(yoke);
        const pivotCap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(0xFFAA00));
        pivotCap.position.y = 1.36;
        gondola.add(pivotCap);

        return gondola;
    };

    // 16 gondolas
    const ferrisGondolas = [];
    for (let i = 0; i < SPOKE_COUNT; i++) {
        const a = (i / SPOKE_COUNT) * Math.PI * 2;
        const p = { y: Math.cos(a) * fRadius, z: Math.sin(a) * fRadius };
        gondolaAngles.push(a);

        const gondola = createFerrisGondola();
        gondola.position.set(0, p.y, p.z);
        gondola.rotation.x = 0;
        gondola.userData.kind = 'ferrisGondola';
        ferrisGondolas.push(gondola);
        ferrisWheelRotating.add(gondola);
    }

    let spokeSetCallIndex = 0;
    const outerEndpointAngleKeys = new Set();
    const outerSpokeXOffsets = [];
    let outerSpokeCountObserved = 0;
    const outerInnerPhaseDeltas = new Set();
    const outerAnchorSampleDeg = [];
    const addSpokeSet = (count, phase, xOffset, thickness, radius = fRadius) => {
        spokeSetCallIndex += 1;
        const gondolaStep = (Math.PI * 2) / SPOKE_COUNT;
        const normalizedPhase = ((phase % gondolaStep) + gondolaStep) % gondolaStep;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + phase;
            const p = { y: Math.cos(a) * radius, z: Math.sin(a) * radius };
            const angle = -Math.atan2(p.z, p.y);
            const spoke = new THREE.Mesh(new THREE.CylinderGeometry(thickness, thickness, radius, 6), mat(0xE6B800));
            spoke.position.set(xOffset, p.y / 2, p.z / 2);
            spoke.rotation.x = angle;
            spoke.userData.kind = 'ferrisSpoke';
            ferrisWheelRotating.add(spoke);
            if (radius === fRadius && xOffset !== 0) {
                outerSpokeCountObserved += 1;
                outerSpokeXOffsets.push(xOffset);
                const angleDeg = ((a * 180 / Math.PI) % 360 + 360) % 360;
                outerEndpointAngleKeys.add(angleDeg.toFixed(3));
            }
        }
    };
    const addSpokeBetweenPoints = (start, end, thickness) => {
        const delta = new THREE.Vector3().subVectors(end, start);
        const length = delta.length();
        if (length <= 0.0001) return;
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(thickness, thickness, length, 6), mat(0xE6B800));
        spoke.position.copy(start).add(end).multiplyScalar(0.5);
        spoke.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
        spoke.userData.kind = 'ferrisSpoke';
        ferrisWheelRotating.add(spoke);
    };
    const addBracedOuterSpokeSet = (count, phase, xOffset, thickness, innerAnchorRadius = fRadius * 0.18) => {
        spokeSetCallIndex += 1;
        const cartAttachRadius = fRadius - 0.6; // 0.6 = half gondola depth (1.2), so spokes meet cart edge
        for (let i = 0; i < count; i++) {
            const gondolaAngle = (i / count) * Math.PI * 2;
            const anchorAngle = gondolaAngle + phase;
            const outerPoint = new THREE.Vector3(xOffset, Math.cos(gondolaAngle) * cartAttachRadius, Math.sin(gondolaAngle) * cartAttachRadius);
            const innerPoint = new THREE.Vector3(0, Math.cos(anchorAngle) * innerAnchorRadius, Math.sin(anchorAngle) * innerAnchorRadius);
            addSpokeBetweenPoints(innerPoint, outerPoint, thickness);

            outerSpokeCountObserved += 1;
            outerSpokeXOffsets.push(xOffset);
            const endAngleDeg = ((gondolaAngle * 180 / Math.PI) % 360 + 360) % 360;
            outerEndpointAngleKeys.add(endAngleDeg.toFixed(3));
            const phaseDelta = (((anchorAngle - gondolaAngle) * 180 / Math.PI) % 360 + 360) % 360;
            outerInnerPhaseDeltas.add(phaseDelta.toFixed(3));
            if (i === 0) {
                outerAnchorSampleDeg.push({
                    phaseDeg: Number((phase * 180 / Math.PI).toFixed(3)),
                    gondola0Deg: Number((gondolaAngle * 180 / Math.PI).toFixed(3)),
                    anchor0Deg: Number((anchorAngle * 180 / Math.PI).toFixed(3))
                });
            }
        }
    };

    // Keep a compact inner center web near the hub
    addSpokeSet(SPOKE_COUNT * 4, 0, 0, 0.06, fRadius * 0.45);

    // Outer spoke copies: quadrupled phase sets (0/45/90/135), each still ending at every gondola
    const outerX = rimOffset;
    const outerPhases = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
    outerPhases.forEach((phase) => {
        addBracedOuterSpokeSet(SPOKE_COUNT, phase, -outerX, 0.06);
        addBracedOuterSpokeSet(SPOKE_COUNT, phase, outerX, 0.06);
    });

    // A-frame towers: two legs per side, bases on chassis, meeting at axle height
    const towerHeight = axleHeight;
    const towerBaseSpread = 3.6;  // tighter base for a cleaner ^ silhouette
    const towerPinLength = towerXOffset * 2; // pin ends meet the tower apex points
    const legAngle = Math.atan2(towerBaseSpread / 2, towerHeight);
    [-1, 1].forEach((side) => {
        const tower = new THREE.Group();
        tower.position.set(side * towerXOffset, 0, 0);
        tower.rotation.y = Math.PI / 2;
        for (const legSide of [-1, 1]) {
            const legGroup = new THREE.Group();
            legGroup.position.set(legSide * (towerBaseSpread / 2), 0, 0);
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.45, towerHeight, 0.45), mat(0xAA0000));
            leg.position.y = towerHeight / 2;
            legGroup.rotation.z = legSide * legAngle;
            legGroup.add(leg);
            tower.add(legGroup);
        }
        ferrisGroup.add(tower);
    });
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, towerPinLength), mat(0x990000));
    arm.rotation.y = Math.PI / 2;
    arm.position.set(0, towerHeight, 0);
    ferrisGroup.add(arm);
    ferrisGroup.add(ferrisWheelRotating);
    group.add(ferrisGroup);

    const zipper = createZipper(cx + 55, cz + 45);
    zipper.group.rotation.y = Math.PI;
    group.add(zipper.group);

    const addedRides = CARNIVAL_ADDITIONS.map(spec => {
        const ride = createCarnivalRide(spec, cx, cz);
        const content = getFlavorContent(spec.contentId);
        ride.sign.userData = { isInteractive: true, name: content.name, flavorText: content.flavorText };
        group.add(ride.group);
        interactiveItems.push(ride.sign);
        return ride;
    });

    const teacups = createTeacups(cx, cz);
    const teacupContent = getFlavorContent('CARNIVAL_TEACUPS');
    teacups.entrance.userData = { isInteractive: true, name: teacupContent.name, flavorText: teacupContent.flavorText };
    group.add(teacups.group);
    interactiveItems.push(teacups.entrance);

    const midway = createCarnivalMidway(cx, cz);
    group.add(midway.group);
    interactiveItems.push(...midway.interactiveItems);

    const FERRIS_SPEED = 0.008;

    const updateCarnival = (deltaTime = 1 / 60) => {
        const frameScale = deltaTime * 60;
        ferrisWheelRotating.rotation.x += FERRIS_SPEED * frameScale;
        ferrisGondolas.forEach((gondola) => {
            // Counter wheel spin so carts always stay upright.
            gondola.rotation.x = -ferrisWheelRotating.rotation.x;
        });

        addedRides.forEach(ride => ride.update(deltaTime));
        teacups.update(deltaTime);
        zipper.update(deltaTime);
    };

    scene.add(group);
    return { group, updateCarnival, interactiveItems };
};

/** Mansion compound in ZONE_NW (left column, top) - wealthy residential corner. */
export const createMansionCompound = (scene) => {
    const group = new THREE.Group();
    group.name = "MansionCompound";

    const { x: zoneX, z: zoneZ } = ZONE_NW_MANSION;
    const mat = (c, o = 1) => createWireframeMaterial(c, o);
    const interactiveItems = [];

    // Main mansion (~22 wide, 14 tall, 16 deep) - faces east toward connector
    const mansion = createBuildingFacade(22, 14, 16, 'mansion', '', 0xFFFFFF);
    mansion.position.set(zoneX - 20, 0, zoneZ);
    mansion.rotation.y = -Math.PI / 2;
    group.add(mansion);

    // Gate and wall segments (gate closer to road at x=-170)
    const wallMat = mat(0x8B8680);
    const gateMat = mat(0x6B6560);

    const gateWidth = 8;
    const gateHeight = 3;
    const gatePost = new THREE.Mesh(new THREE.BoxGeometry(0.6, gateHeight + 2, 0.6), gateMat);
    gatePost.position.set(zoneX + 35, gateHeight / 2 + 1, zoneZ - 18);
    group.add(gatePost);
    const gatePostR = gatePost.clone();
    gatePostR.position.set(zoneX + 35, gateHeight / 2 + 1, zoneZ + 18);
    group.add(gatePostR);
    const gateBar = new THREE.Mesh(new THREE.BoxGeometry(gateWidth + 1.2, 0.3, 0.2), gateMat);
    gateBar.position.set(zoneX + 35, gateHeight + 1, zoneZ);
    group.add(gateBar);

    const wallHeight = 2;
    const wallDepth = 0.4;
    const addWallSeg = (wx, wz, w, rotY) => {
        const seg = new THREE.Mesh(new THREE.BoxGeometry(w, wallHeight, wallDepth), wallMat);
        seg.position.set(wx, wallHeight / 2, wz);
        seg.rotation.y = rotY;
        group.add(seg);
    };
    addWallSeg(zoneX + 50, zoneZ - 25, 20, 0);
    addWallSeg(zoneX + 50, zoneZ + 25, 20, 0);
    addWallSeg(zoneX + 35, zoneZ - 35, 35, Math.PI / 2);
    addWallSeg(zoneX + 35, zoneZ + 35, 35, Math.PI / 2);

    const drivewayMat = mat(0x4a4a48);
    const driveway = new THREE.Mesh(
        new THREE.PlaneGeometry(12, 45),
        drivewayMat
    );
    driveway.rotation.x = -Math.PI / 2;
    driveway.position.set(zoneX + 35, GROUND_LAYERS.base + 0.02, zoneZ);
    group.add(driveway);

    const garage = new THREE.Mesh(
        new THREE.BoxGeometry(12, 5, 8),
        mat(0xA09888)
    );
    garage.position.set(zoneX + 55, 2.5, zoneZ - 25);
    garage.rotation.y = Math.PI / 2;
    group.add(garage);
    const garageRoof = new THREE.Mesh(
        new THREE.BoxGeometry(13, 1, 9),
        mat(0x2a2a2a)
    );
    garageRoof.position.set(zoneX + 55, 5.5, zoneZ - 25);
    garageRoof.rotation.y = Math.PI / 2;
    group.add(garageRoof);

    scene.add(group);
    return { group, interactiveItems };
};

/** River running through the right column (ZONE_NE, ZONE_E, ZONE_SE). Flow lines move right-to-left (+z toward -z). */
export const createRiver = (scene) => {
    const group = new THREE.Group();
    group.name = "River";

    const { x, halfWidth, zMin, zMax } = RIVER_CONFIG;
    const length = zMax - zMin;
    const width = halfWidth * 2;

    const riverGeometry = new THREE.PlaneGeometry(width, length);
    const riverMaterial = new THREE.MeshBasicMaterial({
        color: 0x3a7090,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
    });
    const river = new THREE.Mesh(riverGeometry, riverMaterial);
    river.rotation.x = -Math.PI / 2;
    river.position.set(x, GROUND_LAYERS.base + 0.01, (zMin + zMax) / 2);
    group.add(river);

    // Flow lines - white segments that move right-to-left (like cars on vertical road)
    const flowGroup = new THREE.Group();
    flowGroup.name = "RiverFlowLines";
    const flowLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const FLOW_LINE_LENGTH = 8;
    const FLOW_LINE_WIDTH = 0.4;
    const FLOW_SPEED = 0.08;
    const flowLines = [];
    const numLines = 12;
    for (let i = 0; i < numLines; i++) {
        const seg = new THREE.Mesh(
            new THREE.PlaneGeometry(FLOW_LINE_WIDTH, FLOW_LINE_LENGTH),
            flowLineMaterial.clone()
        );
        seg.rotation.x = -Math.PI / 2;
        seg.position.set(x + (Math.random() - 0.5) * (width - 4), GROUND_LAYERS.base + 0.02, zMin + (i / numLines) * length);
        flowGroup.add(seg);
        flowLines.push({ mesh: seg });
    }
    group.add(flowGroup);

    const updateFlow = (deltaTime = 1 / 60) => {
        flowLines.forEach(({ mesh }) => {
            mesh.position.z -= FLOW_SPEED * deltaTime * 60;
            if (mesh.position.z < zMin) mesh.position.z = zMax;
        });
    };

    scene.add(group);
    return { group, flowLines, updateFlow };
};

/** MBTA-style subway entrance - canopy, T sign (Green Line colors), stairs. Use at world (x, z). */
export const createSubwayStop = (x, z) => {
    const subwayGroup = new THREE.Group();
    subwayGroup.name = "SubwayStop";

    // Platform/base
    const platformGeometry = new THREE.BoxGeometry(5, 0.3, 3, 4, 1, 2);
    const platformMaterial = createWireframeMaterial(0x666666);
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.15;
    subwayGroup.add(platform);

    // Canopy roof (Green Line green)
    const roofGeometry = new THREE.BoxGeometry(4.5, 0.15, 2.5, 4, 1, 2);
    const roofMaterial = createWireframeMaterial(0x00843d, 0.95);  // MBTA Green Line
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 3.2;
    subwayGroup.add(roof);

    // Support pillars
    const pillarGeometry = new THREE.BoxGeometry(0.2, 3.2, 0.2, 2, 6, 2);
    const pillarMaterial = createWireframeMaterial(0x555555);
    for (const [px, pz] of [[-1.8, 0.8], [1.8, 0.8], [-1.8, -0.8], [1.8, -0.8]]) {
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(px, 1.6, pz);
        subwayGroup.add(pillar);
    }

    // T sign pole
    const signPoleGeometry = new THREE.BoxGeometry(0.15, 2.5, 0.15, 2, 5, 2);
    const signPoleMaterial = createWireframeMaterial(0x333333);
    const signPole = new THREE.Mesh(signPoleGeometry, signPoleMaterial);
    signPole.position.set(2.2, 1.25, 0);
    subwayGroup.add(signPole);

    // T logo circle (Green Line)
    const tLogoGeometry = new THREE.CircleGeometry(0.5, 12);
    const tLogoMaterial = createWireframeMaterial(0x00843d, 0.9);
    const tLogo = new THREE.Mesh(tLogoGeometry, tLogoMaterial);
    tLogo.position.set(2.2, 2.5, 0.08);
    subwayGroup.add(tLogo);

    // Station name sign - "Allston"
    const signGeometry = new THREE.BoxGeometry(1.2, 0.5, 0.08, 2, 2, 1);
    const signMaterial = createWireframeMaterial(0x000000, 0.9);
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(2.2, 3.2, 0.08);
    subwayGroup.add(sign);

    // Stairs going down
    const stepGeometry = new THREE.BoxGeometry(2.5, 0.25, 1.2, 2, 1, 2);
    const stepMaterial = createWireframeMaterial(0x888888);
    for (let i = 0; i < 4; i++) {
        const step = new THREE.Mesh(stepGeometry, stepMaterial);
        step.position.set(-0.5, 0.125 + i * 0.25, -1.2 - i * 0.4);
        subwayGroup.add(step);
    }

    subwayGroup.position.set(x, 0, z);
    return subwayGroup;
};

/** City zone content - triple-decker apartments (CITY_NW) lining the roads */
export const createTripleDeckers = (scene) => {
    const group = new THREE.Group();
    group.name = "TripleDeckers";
    const setback = 18;  // Distance from road center to building
    // Along left connector x=-255 (west side, facing road)
    const road255West = [
        { x: -255 - setback, z: 380 },
        { x: -255 - setback, z: 320 },
        { x: -255 - setback, z: 260 },
        { x: -255 - setback, z: 200 },
        { x: -255 - setback, z: 140 }
    ];
    // Along connector x=-85 (west side, in CITY_NW)
    const road85West = [
        { x: -85 - setback, z: 350 },
        { x: -85 - setback, z: 280 },
        { x: -85 - setback, z: 210 }
    ];
    [...road255West, ...road85West].forEach(({ x, z }) => {
        const building = createTripleDeckerBuilding();  // Random from 5 models
        building.position.set(x, 0, z);
        building.rotation.y = Math.PI / 2;  // Face the road (east)
        group.add(building);
    });
    scene.add(group);
    return { group };
};

/** City zone content - record stores, vintage (CITY_NE) */
export const createRecordStrip = (scene) => {
    const group = new THREE.Group();
    group.name = "RecordStrip";
    const zoneX = 333;
    const zoneZ = 333;
    const stores = [
        { x: zoneX - 80, z: zoneZ - 40 },
        { x: zoneX - 40, z: zoneZ + 30 },
        { x: zoneX, z: zoneZ - 70 },
        { x: zoneX + 50, z: zoneZ + 50 }
    ];
    stores.forEach(({ x, z }, i) => {
        const b = createBuildingFacade(8, 5, 6, 'storefront_urban', '', 0xFFFFFF);
        b.position.set(x, 0, z);
        b.rotation.y = i * 0.2;
        group.add(b);
    });
    scene.add(group);
    return { group };
};

/** City zone content - residential block (CITY_W) - triple deckers along roads */
export const createResidentialBlock = (scene) => {
    const group = new THREE.Group();
    group.name = "ResidentialBlock";
    const setback = 18;
    // Along connector x=-255 (west side)
    const road255 = [
        { x: -255 - setback, z: 100 },
        { x: -255 - setback, z: 50 },
        { x: -255 - setback, z: 0 },
        { x: -255 - setback, z: -50 },
        { x: -255 - setback, z: -100 }
    ];
    // Along connector x=-85 (both sides - west and east)
    const road85West = [
        { x: -85 - setback, z: 80 },
        { x: -85 - setback, z: 0 },
        { x: -85 - setback, z: -80 }
    ];
    const road85East = [
        { x: -85 + setback, z: 60 },
        { x: -85 + setback, z: -60 }
    ];
    [...road255, ...road85West, ...road85East].forEach(({ x, z }) => {
        const b = createTripleDeckerBuilding();  // Random from 5 models
        b.position.set(x, 0, z);
        b.rotation.y = (x < -85) ? Math.PI / 2 : -Math.PI / 2;  // Face the road
        group.add(b);
    });
    scene.add(group);
    return { group };
};

/** City zone content - international food row (CITY_E) */
export const createFoodRow = (scene) => {
    const group = new THREE.Group();
    group.name = "FoodRow";
    const zoneX = 333;
    const zoneZ = 0;
    const positions = [
        { x: zoneX - 100, z: zoneZ - 50 },
        { x: zoneX - 60, z: zoneZ + 40 },
        { x: zoneX - 20, z: zoneZ - 80 },
        { x: zoneX + 30, z: zoneZ + 60 },
        { x: zoneX + 70, z: zoneZ - 30 }
    ];
    positions.forEach(({ x, z }) => {
        const b = createBuildingFacade(7, 4, 5, 'storefront_urban', '', 0xFF6600);
        b.position.set(x, 0, z);
        b.rotation.y = 0.5;
        group.add(b);
    });
    scene.add(group);
    return { group };
};

/** City zone content - urban park (CITY_SW) */
export const createUrbanPark = (scene) => {
    const group = new THREE.Group();
    group.name = "UrbanPark";
    const zoneX = -333;
    const zoneZ = -333;
    const mat = (c, o = 1) => createWireframeMaterial(c, o);
    // Benches
    const benchPositions = [
        { x: zoneX - 80, z: zoneZ - 60 },
        { x: zoneX - 40, z: zoneZ + 40 },
        { x: zoneX + 20, z: zoneZ - 30 },
        { x: zoneX + 60, z: zoneZ + 70 }
    ];
    benchPositions.forEach(({ x, z }) => {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 0.8), mat(0x8B4513));
        bench.position.set(x, 0.2, z);
        bench.rotation.y = (Math.random() - 0.5) * 0.5;
        group.add(bench);
    });
    // Sparse trees
    const treePositions = [
        { x: zoneX - 60, z: zoneZ - 40 },
        { x: zoneX, z: zoneZ + 50 },
        { x: zoneX + 50, z: zoneZ - 60 }
    ];
    treePositions.forEach(({ x, z }) => {
        const tree = createTree(x, z, 0.5 + Math.random() * 0.3, 'Red Maple');
        group.add(tree);
    });
    scene.add(group);
    return { group };
};

// Perpendicular roads connecting the 3 rows of zones - full corridor (sidewalk | road | sidewalk) matching zone streets
