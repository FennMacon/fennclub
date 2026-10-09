import * as THREE from 'three';
import { createWireframeMaterial } from '../utils.js';
import { INTERIOR_BASE_SIZE, applyInteriorScale, createInteriorBounds, compressInteriorToBounds, markStructural } from './shared.js';
import { createGlowingWireframeMaterial } from '../buildings.js';
export const createIndustrialInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Industrial Building Interior";
    
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 12; // Higher for industrial
    const wallThickness = 0.3;
    
    const margin = 0.5;
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor - concrete
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0x808080);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    
    // Walls - industrial gray
    const wallMaterial = createWireframeMaterial(0x696969, 0.3); // Transparent walls
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
        color: 0xD3D3D3, // Light gray - industrial but lighter
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    
    // Industrial machinery/equipment
    const machineGeometry = new THREE.BoxGeometry(6, 4, 4);
    const machineMaterial = warmGlow(0x708090);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const machine = new THREE.Mesh(machineGeometry, machineMaterial);
            machine.position.set(-30 + i * 30, 2, -30 + j * 30);
            interiorGroup.add(machine);
        }
    }
    
    // Storage racks
    const rackGeometry = new THREE.BoxGeometry(0.2, 6, 0.2);
    const rackMaterial = warmGlow(0x2F4F4F);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
            const rack = new THREE.Mesh(rackGeometry, rackMaterial);
            rack.position.set(-40 + i * 26, 3, -40 + j * 80);
            interiorGroup.add(rack);
        }
    }
    
    // Workbenches
    const workbenchGeometry = new THREE.BoxGeometry(8, 1.5, 2);
    const workbenchMaterial = warmGlow(0x8B4513);
    for (let i = 0; i < 3; i++) {
        const workbench = new THREE.Mesh(workbenchGeometry, workbenchMaterial);
        workbench.position.set(-20 + i * 20, 0.75, 30);
        interiorGroup.add(workbench);
    }
    
    // More machinery throughout
    for (let i = 3; i < 8; i++) {
        for (let j = 3; j < 8; j++) {
            const extraMachine = new THREE.Mesh(machineGeometry, machineMaterial);
            extraMachine.position.set(-40 + i * 11, 2, -40 + j * 11);
            interiorGroup.add(extraMachine);
        }
    }
    
    // More workbenches
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 2; j++) {
            const extraWorkbench = new THREE.Mesh(workbenchGeometry, workbenchMaterial);
            extraWorkbench.position.set(-40 + i * 16, 0.75, -30 + j * 40);
            interiorGroup.add(extraWorkbench);
        }
    }
    
    // More storage racks
    for (let i = 4; i < 10; i++) {
        for (let j = 0; j < 4; j++) {
            const extraRack = new THREE.Mesh(rackGeometry, rackMaterial);
            extraRack.position.set(-40 + i * 11, 3, -40 + j * 20);
            interiorGroup.add(extraRack);
        }
    }
    
    // Tool storage
    const toolBoxGeometry = new THREE.BoxGeometry(1.5, 1, 1);
    const toolBoxMaterial = warmGlow(0xFF4500);
    for (let i = 0; i < 8; i++) {
        const toolBox = new THREE.Mesh(toolBoxGeometry, toolBoxMaterial);
        toolBox.position.set(-40 + i * 11, 0.5, -storeDepth/2 + 2);
        interiorGroup.add(toolBox);
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
    console.log("🏭 Created Industrial Building interior");
    return interiorGroup;
};

// Create Graveyard Interior (open-air memorial)
