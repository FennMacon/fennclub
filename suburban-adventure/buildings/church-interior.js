import * as THREE from 'three';
import { createWireframeMaterial } from '../utils.js';
import { INTERIOR_BASE_SIZE, applyInteriorScale, createInteriorBounds, compressInteriorToBounds, markStructural } from './shared.js';
import { createGlowingWireframeMaterial } from '../buildings.js';
export const createChurchInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Church Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 16; // Taller for church
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0x8B4513);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    markStructural(floor);
    
    // Walls
    const wallMaterial = createWireframeMaterial(0xCCCCCC, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    markStructural(backWall);
    markStructural(backWall);
    markStructural(backWall);
    markStructural(backWall);
    markStructural(backWall);
    
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    markStructural(leftWall);
    markStructural(leftWall);
    markStructural(leftWall);
    markStructural(leftWall);
    markStructural(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    markStructural(rightWall);
    markStructural(rightWall);
    markStructural(rightWall);
    markStructural(rightWall);
    markStructural(rightWall);
    
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    markStructural(frontWall);
    markStructural(frontWall);
    markStructural(frontWall);
    markStructural(frontWall);
    markStructural(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB, // Sky blue - heavenly
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    markStructural(ceiling);
    markStructural(ceiling);
    markStructural(ceiling);
    markStructural(ceiling);
    
    // Pews (rows of benches)
    const pewGeometry = new THREE.BoxGeometry(storeWidth - 4, 0.8, 1.5);
    const pewMaterial = warmGlow(0x654321);
    for (let i = 0; i < 6; i++) {
        const pew = new THREE.Mesh(pewGeometry, pewMaterial);
        pew.position.set(0, 0.4, -storeDepth/2 + 4 + i * 4);
        interiorGroup.add(pew);
    }
    
    // Altar at the front
    const altarGeometry = new THREE.BoxGeometry(6, 2, 2);
    const altarMaterial = warmGlow(0xF5DEB3);
    const altar = new THREE.Mesh(altarGeometry, altarMaterial);
    altar.position.set(0, 1, -storeDepth/2 + 2);
    interiorGroup.add(altar);
    
    // Stained glass windows (decorative)
    const windowGeometry = new THREE.PlaneGeometry(3, 4);
    const windowMaterial = warmGlow(0x4169E1);
    for (let i = 0; i < 4; i++) {
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(-storeWidth/2 + 2 + i * 4, wallHeight/2, -storeDepth/2 + 0.2);
        interiorGroup.add(window);
    }
    
    // More pews throughout
    for (let i = 6; i < 15; i++) {
        const extraPew = new THREE.Mesh(pewGeometry, pewMaterial);
        extraPew.position.set(0, 0.4, -storeDepth/2 + 4 + i * 3);
        interiorGroup.add(extraPew);
    }
    
    // Candles on altar
    const candleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    const candleMaterial = warmGlow(0xFFD700);
    for (let i = 0; i < 5; i++) {
        const candle = new THREE.Mesh(candleGeometry, candleMaterial);
        candle.position.set(-2 + i * 1, 2.4, -storeDepth/2 + 2);
        interiorGroup.add(candle);
    }
    
    // Organ/piano area
    const organGeometry = new THREE.BoxGeometry(4, 3, 1.5);
    const organMaterial = warmGlow(0x000000);
    const organ = new THREE.Mesh(organGeometry, organMaterial);
    organ.position.set(-storeWidth/2 + 2, 1.5, -storeDepth/2 + 8);
    interiorGroup.add(organ);
    
    // Decorative columns
    const columnGeometry = new THREE.CylinderGeometry(0.8, 0.8, wallHeight - 2, 8);
    const columnMaterial = warmGlow(0xF5DEB3);
    const columnPositions = [
        -storeWidth/2 + 4,
        -storeWidth/2 + 12,
        -4,
        4,
        storeWidth/2 - 12,
        storeWidth/2 - 4
    ];
    columnPositions.forEach((xPos) => {
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.set(xPos, (wallHeight - 2)/2, -storeDepth/2 + 12);
        interiorGroup.add(column);
    });
    
    // Exit door
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    exitDoor.position.set(0, 1.5, storeDepth/2);
    exitDoor.userData.isExitPortal = true;
    interiorGroup.add(exitDoor);
    markStructural(exitDoor);
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    console.log("⛪ Created Church interior");
    return interiorGroup;
};

// Create Town Hall Interior
