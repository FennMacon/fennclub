import * as THREE from 'three';
import { createWireframeMaterial } from '../utils.js';
import { INTERIOR_BASE_SIZE, applyInteriorScale, createInteriorBounds, compressInteriorToBounds, markStructural } from './shared.js';
import { createGlowingWireframeMaterial } from '../buildings.js';
export const createHouseInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Colonial House Interior";
    
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
    const floorMaterial = warmGlow(0xD2691E);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    interiorGroup.add(floor);
    markStructural(floor);
    
    // Walls
    const wallMaterial = createWireframeMaterial(0xF5DEB3, 0.3); // Transparent walls
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
        color: 0xFFB6C1, // Light pink - cozy
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    
    // Fireplace
    const fireplaceGeometry = new THREE.BoxGeometry(3, 3, 2);
    const fireplaceMaterial = warmGlow(0x696969);
    const fireplace = new THREE.Mesh(fireplaceGeometry, fireplaceMaterial);
    fireplace.position.set(0, 1.5, -storeDepth/2 + 1);
    interiorGroup.add(fireplace);
    
    // Sofa
    const sofaGeometry = new THREE.BoxGeometry(4, 1.2, 2);
    const sofaMaterial = warmGlow(0x8B4513);
    const sofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
    sofa.position.set(0, 0.6, 2);
    interiorGroup.add(sofa);
    
    // Coffee table
    const coffeeTableGeometry = new THREE.BoxGeometry(2, 0.6, 1.5);
    const coffeeTableMaterial = warmGlow(0x654321);
    const coffeeTable = new THREE.Mesh(coffeeTableGeometry, coffeeTableMaterial);
    coffeeTable.position.set(0, 0.3, 4);
    interiorGroup.add(coffeeTable);
    
    // Dining table
    const diningTableGeometry = new THREE.BoxGeometry(4, 0.8, 2.5);
    const diningTableMaterial = warmGlow(0x8B4513);
    const diningTable = new THREE.Mesh(diningTableGeometry, diningTableMaterial);
    diningTable.position.set(-storeWidth/2 + 3, 0.4, -storeDepth/2 + 4);
    interiorGroup.add(diningTable);
    
    // Chairs around dining table
    const chairGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
    const chairMaterial = warmGlow(0x654321);
    for (let i = 0; i < 4; i++) {
        const chair = new THREE.Mesh(chairGeometry, chairMaterial);
        const angle = (i / 4) * Math.PI * 2;
        chair.position.set(-storeWidth/2 + 3 + Math.cos(angle) * 1.5, 0.5, -storeDepth/2 + 4 + Math.sin(angle) * 1.5);
        interiorGroup.add(chair);
    }
    
    // Kitchen area
    const kitchenCounterGeometry = new THREE.BoxGeometry(6, 1.2, 2);
    const kitchenCounterMaterial = warmGlow(0xFFFFFF);
    const kitchenCounter = new THREE.Mesh(kitchenCounterGeometry, kitchenCounterMaterial);
    kitchenCounter.position.set(storeWidth/2 - 3, 0.6, -storeDepth/2 + 3);
    interiorGroup.add(kitchenCounter);
    
    // Stove
    const stoveGeometry = new THREE.BoxGeometry(2, 1.2, 1.5);
    const stoveMaterial = warmGlow(0x000000);
    const stove = new THREE.Mesh(stoveGeometry, stoveMaterial);
    stove.position.set(storeWidth/2 - 3, 0.6, -storeDepth/2 + 5);
    interiorGroup.add(stove);
    
    const layoutScaleHouse = storeWidth / 100;
    
    // More furniture throughout
    for (let i = 0; i < 4; i++) {
        const extraSofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
        extraSofa.position.set((-30 + i * 20) * layoutScaleHouse, 0.6, (10 + Math.floor(i/2) * 15) * layoutScaleHouse);
        interiorGroup.add(extraSofa);
        
        const extraCoffeeTable = new THREE.Mesh(coffeeTableGeometry, coffeeTableMaterial);
        extraCoffeeTable.position.set((-30 + i * 20) * layoutScaleHouse, 0.3, (12 + Math.floor(i/2) * 15) * layoutScaleHouse);
        interiorGroup.add(extraCoffeeTable);
    }
    
    // Bookshelves
    const bookshelfGeometry = new THREE.BoxGeometry(2, 3, 0.5);
    const bookshelfMaterial = warmGlow(0x8B4513);
    for (let i = 0; i < 6; i++) {
        const bookshelf = new THREE.Mesh(bookshelfGeometry, bookshelfMaterial);
        bookshelf.position.set((-40 + i * 16) * layoutScaleHouse, 1.5, -storeDepth/2 + 2);
        interiorGroup.add(bookshelf);
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
    console.log("🏠 Created Colonial House interior");
    return interiorGroup;
};

// Create Hospital Interior
