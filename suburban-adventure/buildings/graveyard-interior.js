import * as THREE from 'three';
import { INTERIOR_BASE_SIZE, applyInteriorScale, createInteriorBounds, compressInteriorToBounds, markStructural } from './shared.js';
import { createGlowingWireframeMaterial } from '../buildings.js';
export const createGraveyardInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Graveyard Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, 6);

    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Soft grass floor
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0x2F4F2F, 0.6);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    markStructural(floor);

    // Stone path from entrance inward
    const pathGeometry = new THREE.PlaneGeometry(storeWidth * 0.35, storeDepth * 0.85);
    const path = new THREE.Mesh(pathGeometry, warmGlow(0x3B3B35, 0.65));
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.02, -storeDepth * 0.05);
    interiorGroup.add(path);

    // Low perimeter markers (stone edging)
    const edgingMaterial = warmGlow(0x5B4C43, 0.5);
    const edgingThickness = 0.2;
    const edgingHeight = 0.4;
    const createEdging = (width, x, z, orientation = 0) => {
        const edging = new THREE.Mesh(
            new THREE.BoxGeometry(width, edgingHeight, edgingThickness),
            edgingMaterial
        );
        edging.position.set(x, edgingHeight / 2, z);
        edging.rotation.y = orientation;
        interiorGroup.add(edging);
    };
    const halfW = storeWidth / 2;
    const halfD = storeDepth / 2;
    createEdging(storeWidth - 2, 0, -halfD + 1, 0);
    createEdging(storeWidth - 2, 0, halfD - 1.5, 0);
    createEdging(storeDepth - 2, -halfW + 1, -halfD + edgingThickness + 24.4, Math.PI / 2);
    createEdging(storeDepth - 2, halfW - 1, -halfD + edgingThickness + 24.4, Math.PI / 2);

    // Helper to create headstones
    const createHeadstone = (x, z, variant = 0) => {
        const stoneColor = variant % 2 === 0 ? 0xA8A8A8 : 0x8E8E8E;
        const stone = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 1 + variant * 0.2, 0.2),
            warmGlow(stoneColor, 0.8)
        );
        stone.position.set(x, stone.geometry.parameters.height / 2, z);
        stone.rotation.y = (Math.random() - 0.5) * 0.2;
        interiorGroup.add(stone);
    };

    const graveClusters = [
        { x: -storeWidth * 0.3, z: -storeDepth * 0.45 },
        { x: -storeWidth * 0.18, z: -storeDepth * 0.55 },
        { x: storeWidth * 0.18, z: -storeDepth * 0.48 },
        { x: storeWidth * 0.32, z: -storeDepth * 0.62 },
        { x: -storeWidth * 0.04, z: -storeDepth * 0.3 },
        { x: storeWidth * 0.34, z: -storeDepth * 0.28 },
        { x: -storeWidth * 0.28, z: -storeDepth * 0.68 },
        { x: storeWidth * 0.05, z: -storeDepth * 0.68 }
    ];
    graveClusters.forEach((pos, idx) => createHeadstone(pos.x, pos.z, idx % 3));

    // Central memorial statue
    const memorialBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 0.5, 10),
        warmGlow(0x7E6F5A, 0.7)
    );
    memorialBase.position.set(0, 0.25, -storeDepth * 0.45);
    interiorGroup.add(memorialBase);

    const memorialObelisk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.6, 2.4, 8),
        warmGlow(0x8F7F6A, 0.85)
    );
    memorialObelisk.position.set(0, 1.45, -storeDepth * 0.45);
    interiorGroup.add(memorialObelisk);

    const memorialGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 10, 10),
        createGlowingWireframeMaterial(0xBBAAFF, 0.7, 0.55)
    );
    memorialGlow.position.set(0, 2.5, -storeDepth * 0.45);
    interiorGroup.add(memorialGlow);

    // Benches
    const benchGeometry = new THREE.BoxGeometry(2, 0.3, 0.6);
    const benchMaterial = warmGlow(0x6B4F3A, 0.7);
    const benchLeft = new THREE.Mesh(benchGeometry, benchMaterial);
    benchLeft.position.set(-storeWidth * 0.28, 0.35, -storeDepth * 0.2);
    interiorGroup.add(benchLeft);
    const benchRight = benchLeft.clone();
    benchRight.position.x = storeWidth * 0.28;
    interiorGroup.add(benchRight);

    // Lantern posts
    const lanternTrunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 2.6, 6),
        warmGlow(0x454545, 0.9)
    );
    const lanternLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        createGlowingWireframeMaterial(0xFFD37A, 0.85, 0.5)
    );
    const lanternPositions = [
        { x: -storeWidth * 0.32, z: -storeDepth * 0.1 },
        { x: storeWidth * 0.32, z: -storeDepth * 0.1 }
    ];
    lanternPositions.forEach(({ x, z }) => {
        const post = lanternTrunk.clone();
        post.position.set(x, 1.3, z);
        interiorGroup.add(post);
        const glow = lanternLight.clone();
        glow.position.set(x, 2.6, z);
        interiorGroup.add(glow);
    });

    // Small trees for ambience
    const treeTrunkGeometry = new THREE.CylinderGeometry(0.25, 0.25, 2.4, 6);
    const treeFoliageGeometry = new THREE.ConeGeometry(1.6, 3.4, 8);
    const treeTrunkMaterial = warmGlow(0x5B3A29, 0.8);
    const treeFoliageMaterial = warmGlow(0x2F6B3A, 0.75);
    const treePoints = [
        { x: -storeWidth * 0.38, z: -storeDepth * 0.7 },
        { x: storeWidth * 0.35, z: -storeDepth * 0.75 }
    ];
    treePoints.forEach(({ x, z }) => {
        const trunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
        trunk.position.set(x, 1.2, z);
        interiorGroup.add(trunk);
        const foliage = new THREE.Mesh(treeFoliageGeometry, treeFoliageMaterial);
        foliage.position.set(x, 3, z);
        interiorGroup.add(foliage);
    });

    // Exit portal arch (replaces door)
    const portalGroup = new THREE.Group();
    const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.6, 8);
    const postMaterial = warmGlow(0x6B5B4D, 0.85);
    const portalLeftPost = new THREE.Mesh(postGeometry, postMaterial);
    portalLeftPost.position.set(-1.5, 1.3, storeDepth / 2 - 4);
    portalGroup.add(portalLeftPost);
    const portalRightPost = portalLeftPost.clone();
    portalRightPost.position.x = 1.5;
    portalGroup.add(portalRightPost);

    const lintelGeometry = new THREE.BoxGeometry(3.2, 0.3, 0.2);
    const lintel = new THREE.Mesh(lintelGeometry, postMaterial);
    lintel.position.set(0, 2.6, storeDepth / 2 - 4);
    portalGroup.add(lintel);

    const portalPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 2.4),
        createGlowingWireframeMaterial(0x88FFE6, 0.75, 0.6)
    );
    portalPlane.position.set(0, 1.3, storeDepth / 2 - 4.01);
    portalPlane.rotation.y = Math.PI;
    portalPlane.userData.isExitPortal = true;
    portalPlane.userData.keepPosition = true;
    portalGroup.add(portalPlane);

    interiorGroup.add(portalGroup);

    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    console.log("⚰️ Created Graveyard interior");
    return interiorGroup;
};

