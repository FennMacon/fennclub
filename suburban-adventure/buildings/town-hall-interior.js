import * as THREE from 'three';
import { createWireframeMaterial } from '../utils.js';
import { INTERIOR_BASE_SIZE, applyInteriorScale, createInteriorBounds, compressInteriorToBounds, markStructural } from './shared.js';
import { createGlowingWireframeMaterial } from '../buildings.js';
export const createTownHallInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Town Hall Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 12;
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0xD3D3D3);
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
    
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    markStructural(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    markStructural(rightWall);
    
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness), wallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    markStructural(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xF0E68C, // Khaki - warm yellow
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    
    const layoutScale = storeWidth / 100;
    
    // Office desks
    const deskGeometry = new THREE.BoxGeometry(3, 1.2, 1.5);
    const deskMaterial = warmGlow(0x8B4513);
    const chairGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
    const chairMaterial = warmGlow(0x654321);
    
    for (let i = 0; i < 3; i++) {
        const desk = new THREE.Mesh(deskGeometry, deskMaterial);
        desk.position.set(-6 + i * 6, 0.6, -storeDepth/2 + 3);
        interiorGroup.add(desk);
        
        // Chair behind desk
        const chair = new THREE.Mesh(chairGeometry, chairMaterial);
        chair.position.set(-6 + i * 6, 0.5, -storeDepth/2 + 4);
        interiorGroup.add(chair);
    }
    
    // Filing cabinets
    const cabinetGeometry = new THREE.BoxGeometry(1, 2, 1);
    const cabinetMaterial = warmGlow(0x696969);
    for (let i = 0; i < 4; i++) {
        const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
        cabinet.position.set(-storeWidth/2 + 1.5, 1, -storeDepth/2 + 2 + i * 2);
        interiorGroup.add(cabinet);
    }
    
    // Meeting table in center
    const tableGeometry = new THREE.BoxGeometry(8, 0.8, 3);
    const tableMaterial = warmGlow(0xF5DEB3);
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(0, 0.4, 4);
    interiorGroup.add(table);
    
    // More desks throughout
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
            const extraDesk = new THREE.Mesh(deskGeometry, deskMaterial);
            const xPos = (-40 + i * 16) * layoutScale;
            const zPos = (-20 + j * 12) * layoutScale;
            extraDesk.position.set(xPos, 0.6, zPos);
            interiorGroup.add(extraDesk);
            
            const extraChair = new THREE.Mesh(chairGeometry, chairMaterial);
            extraChair.position.set(xPos, 0.5, zPos + 1.2);
            interiorGroup.add(extraChair);
        }
    }
    
    // More filing cabinets
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
            const extraCabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
            extraCabinet.position.set((-35 + i * 18) * layoutScale, 1, (-15 + j * 18) * layoutScale);
            interiorGroup.add(extraCabinet);
        }
    }
    
    // Waiting area with chairs
    const waitingChairGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
    const waitingChairMaterial = warmGlow(0x4682B4);
    for (let i = 0; i < 6; i++) {
        const waitingChair = new THREE.Mesh(waitingChairGeometry, waitingChairMaterial);
        waitingChair.position.set((-25 + i * 10) * layoutScale, 0.5, storeDepth/2 - 3);
        interiorGroup.add(waitingChair);
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
    console.log("🏛️ Created Town Hall interior");
    return interiorGroup;
};

// Create Colonial House Interior
