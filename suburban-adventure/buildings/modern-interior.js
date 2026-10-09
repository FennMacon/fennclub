import * as THREE from 'three';
import { createWireframeMaterial } from '../utils.js';
import { INTERIOR_BASE_SIZE, applyInteriorScale, createInteriorBounds, compressInteriorToBounds, markStructural } from './shared.js';
import { createGlowingWireframeMaterial } from '../buildings.js';
export const createModernInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Modern Building Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 10;
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor - modern polished
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0xE0E0E0);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    
    // Walls - modern white
    const wallMaterial = createWireframeMaterial(0xFFFFFF, 0.3); // Transparent walls
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
        color: 0xE6E6FA, // Lavender - modern
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    
    // Modern office desks
    const deskGeometry = new THREE.BoxGeometry(4, 1.2, 2);
    const deskMaterial = warmGlow(0xD3D3D3);
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            const desk = new THREE.Mesh(deskGeometry, deskMaterial);
            desk.position.set(-40 + i * 16, 0.6, -40 + j * 20);
            interiorGroup.add(desk);
            
            // Office chairs
            const chairGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
            const chairMaterial = warmGlow(0x4682B4);
            const chair = new THREE.Mesh(chairGeometry, chairMaterial);
            chair.position.set(-40 + i * 16, 0.5, -40 + j * 20 + 1.5);
            interiorGroup.add(chair);
        }
    }
    
    // Conference table in center
    const conferenceTableGeometry = new THREE.BoxGeometry(12, 0.8, 6);
    const conferenceTableMaterial = warmGlow(0x8B4513);
    const conferenceTable = new THREE.Mesh(conferenceTableGeometry, conferenceTableMaterial);
    conferenceTable.position.set(0, 0.4, 0);
    interiorGroup.add(conferenceTable);
    
    // Conference chairs
    const conferenceChairGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
    const conferenceChairMaterial = warmGlow(0x2F4F4F);
    for (let i = 0; i < 8; i++) {
        const chair = new THREE.Mesh(conferenceChairGeometry, conferenceChairMaterial);
        const angle = (i / 8) * Math.PI * 2;
        chair.position.set(Math.cos(angle) * 4, 0.5, Math.sin(angle) * 2);
        interiorGroup.add(chair);
    }
    
    // Office partitions
    const partitionGeometry = new THREE.BoxGeometry(0.1, 1.5, 2);
    const partitionMaterial = warmGlow(0xD3D3D3);
    for (let i = 0; i < 12; i++) {
        for (let j = 0; j < 6; j++) {
            const partition = new THREE.Mesh(partitionGeometry, partitionMaterial);
            partition.position.set(-45 + i * 8, 0.75, -40 + j * 16);
            interiorGroup.add(partition);
        }
    }
    
    // Computer monitors on desks
    const monitorGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1);
    const monitorMaterial = warmGlow(0x000000);
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
            monitor.position.set(-40 + i * 16, 1.5, -40 + j * 20);
            interiorGroup.add(monitor);
        }
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
    console.log("🏢 Created Modern Building interior");
    return interiorGroup;
};

// Create Brick Building Interior (generic retail/office)
