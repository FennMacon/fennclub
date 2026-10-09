import * as THREE from 'three';
import { createWireframeMaterial } from '../utils.js';
import { INTERIOR_BASE_SIZE, applyInteriorScale, createInteriorBounds, compressInteriorToBounds, markStructural } from './shared.js';
import { createGlowingWireframeMaterial } from '../buildings.js';
export const createHospitalInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Hospital Interior";
    
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
    const floorMaterial = warmGlow(0xE6E6FA);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    markStructural(floor);
    
    // Walls
    const wallMaterial = createWireframeMaterial(0xFFFFFF, 0.3); // Transparent walls
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
        color: 0xB0E0E6, // Powder blue - clean medical
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    
    const layoutScaleHospital = storeWidth / 100;
    
    // Hospital beds
    const bedGeometry = new THREE.BoxGeometry(2.5, 0.8, 1.5);
    const bedMaterial = warmGlow(0xFFFFFF);
    const equipmentGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
    const equipmentMaterial = warmGlow(0x4169E1);
    
    for (let i = 0; i < 4; i++) {
        const bed = new THREE.Mesh(bedGeometry, bedMaterial);
        bed.position.set(-6 + i * 4, 0.4, -storeDepth/2 + 3);
        interiorGroup.add(bed);
        
        // Medical equipment next to bed
        const equipment = new THREE.Mesh(equipmentGeometry, equipmentMaterial);
        equipment.position.set(-6 + i * 4 + 1.5, 1, -storeDepth/2 + 3);
        interiorGroup.add(equipment);
    }
    
    // Waiting area chairs
    const waitingChairGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
    const waitingChairMaterial = warmGlow(0x4682B4);
    for (let i = 0; i < 6; i++) {
        const chair = new THREE.Mesh(waitingChairGeometry, waitingChairMaterial);
        chair.position.set(-6 + i * 2.4, 0.5, 6);
        interiorGroup.add(chair);
    }
    
    // Reception desk
    const deskGeometry = new THREE.BoxGeometry(6, 1.2, 1.5);
    const deskMaterial = warmGlow(0x708090);
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(0, 0.6, storeDepth/2 - 2);
    interiorGroup.add(desk);
    
    // More hospital beds throughout
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
            const extraBed = new THREE.Mesh(bedGeometry, bedMaterial);
            const xPos = (-21 + i * 14) * layoutScaleHospital;
            const zPos = (-12 + j * 14) * layoutScaleHospital;
            extraBed.position.set(xPos, 0.4, zPos);
            interiorGroup.add(extraBed);
            
            const extraEquipment = new THREE.Mesh(equipmentGeometry, equipmentMaterial);
            extraEquipment.position.set(xPos + 1.2, 1, zPos);
            interiorGroup.add(extraEquipment);
        }
    }
    
    // Medical cabinets
    const medicalCabinetGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.8);
    const medicalCabinetMaterial = warmGlow(0x4169E1);
    for (let i = 0; i < 4; i++) {
        const medicalCabinet = new THREE.Mesh(medicalCabinetGeometry, medicalCabinetMaterial);
        medicalCabinet.position.set((-35 + i * 16) * layoutScaleHospital, 1.25, -storeDepth/2 + 2);
        interiorGroup.add(medicalCabinet);
    }
    
    // More waiting chairs
    for (let i = 0; i < 6; i++) {
        const extraWaitingChair = new THREE.Mesh(waitingChairGeometry, waitingChairMaterial);
        extraWaitingChair.position.set((-18 + i * 6) * layoutScaleHospital, 0.5, storeDepth/2 - 4);
        interiorGroup.add(extraWaitingChair);
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
    console.log("🏥 Created Hospital interior");
    return interiorGroup;
};

// Create Modern Building Interior (office space)
