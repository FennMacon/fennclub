import * as THREE from 'three';
import { createWireframeMaterial } from '../utils.js';
import { INTERIOR_BASE_SIZE, applyInteriorScale, createInteriorBounds, compressInteriorToBounds, markStructural } from './shared.js';
import { createGlowingWireframeMaterial } from '../buildings.js';
export const createBrickInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Brick Building Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 10;
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0xB8860B);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    
    // Walls - brick colored
    const wallMaterial = createWireframeMaterial(0xCD853F, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFDAB9, // Peach puff - warm retail
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    
    // Retail shelves
    const shelfGeometry = new THREE.BoxGeometry(8, 3, 0.5);
    const shelfMaterial = warmGlow(0x8B4513);
    for (let i = 0; i < 5; i++) {
        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.set(-30 + i * 15, 1.5, -storeDepth/2 + 8);
        interiorGroup.add(shelf);
    }
    
    // Counter at front
    const counterGeometry = new THREE.BoxGeometry(12, 1.2, 2);
    const counterMaterial = warmGlow(0x654321);
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(0, 0.6, storeDepth/2 - 4);
    interiorGroup.add(counter);
    
    // Tables for displays
    const tableGeometry = new THREE.BoxGeometry(4, 0.8, 2);
    const tableMaterial = warmGlow(0xF5DEB3);
    for (let i = 0; i < 4; i++) {
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(-15 + i * 10, 0.4, 10);
        interiorGroup.add(table);
    }
    
    // More shelves throughout
    for (let i = 5; i < 12; i++) {
        for (let j = 0; j < 3; j++) {
            const extraShelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
            extraShelf.position.set(-40 + i * 7, 1.5, -30 + j * 15);
            interiorGroup.add(extraShelf);
        }
    }
    
    // More display tables
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
            const extraTable = new THREE.Mesh(tableGeometry, tableMaterial);
            extraTable.position.set(-40 + i * 11, 0.4, -30 + j * 15);
            interiorGroup.add(extraTable);
        }
    }
    
    // Storage room area
    const storageShelfGeometry = new THREE.BoxGeometry(2, 3, 0.5);
    const storageShelfMaterial = warmGlow(0x8B4513);
    for (let i = 0; i < 6; i++) {
        const storageShelf = new THREE.Mesh(storageShelfGeometry, storageShelfMaterial);
        storageShelf.position.set(storeWidth/2 - 1.5, 1.5, -40 + i * 15);
        interiorGroup.add(storageShelf);
    }
    
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
    console.log("🧱 Created Brick Building interior");
    return interiorGroup;
};

// Create Industrial Building Interior
