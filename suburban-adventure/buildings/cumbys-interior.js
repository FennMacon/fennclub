import * as THREE from 'three';
import { createWireframeMaterial } from '../utils.js';
import { assignFlavor, INTERIOR_BASE_SIZE, applyInteriorScale, createInteriorBounds, compressInteriorToBounds, markStructural } from './shared.js';
import { createGlowingWireframeMaterial } from '../buildings.js';
export const createCumbysInterior = (scene) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = "Grumby's Interior";
    
    // Store dimensions (scaled down from 100x100 to 75x75 in world space)
    const storeWidth = INTERIOR_BASE_SIZE;
    const storeDepth = INTERIOR_BASE_SIZE;
    const wallHeight = 10;
    const wallThickness = 0.3;
    
    // Store interior bounds for collision detection
    const margin = 0.5; // Small margin to prevent getting stuck on walls
    interiorGroup.userData.bounds = createInteriorBounds(storeWidth, storeDepth, margin, wallHeight);

    // Helper function for warm glowing materials in interiors
    const warmGlow = (color, opacity = 1.0) => createGlowingWireframeMaterial(color, opacity, 0.4);
    
    // Floor - match store dimensions
    const floorGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const floorMaterial = warmGlow(0x888888);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    interiorGroup.add(floor);
    markStructural(floor);
    
    // Walls
    
    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness);
    const backWallMaterial = createWireframeMaterial(0xCCCCCC, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    markStructural(backWall);
    
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(leftWallGeometry, backWallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    markStructural(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(leftWallGeometry, backWallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    markStructural(rightWall);
    
    // Front wall (with door opening)
    const frontWallGeometry = new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness);
    const frontWall = new THREE.Mesh(frontWallGeometry, backWallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    markStructural(frontWall);
    
    // Ceiling - match store dimensions
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFE4B5, // Moccasin - warm cream color
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    
    // Store counter at the back
    const counterGeometry = new THREE.BoxGeometry(8, 1.2, 2);
    const counterMaterial = warmGlow(0xFF4444); // Grumby's red with warm glow
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(0, 0.6, -6);
    interiorGroup.add(counter);
    
    // Cash register on counter
    const registerGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.5);
    const registerMaterial = warmGlow(0x000000);
    const register = new THREE.Mesh(registerGeometry, registerMaterial);
    register.position.set(2, 1.2, -6);
    interiorGroup.add(register);
    
    // Store shelves - create aisles
    const shelfGeometry = new THREE.BoxGeometry(1.5, 2, 0.3);
    const shelfMaterial = warmGlow(0x8B4513);
    
    // Create multiple aisles - 5 aisles total
    const aislePositions = [-10, -5, 0, 5, 10]; // Spread across the store width
    const shelfZPositions = []; // Will store all shelf positions for product placement
    
    // Define checkout counter positions to avoid overlap
    const checkoutCounterZ = -6;
    const checkoutCounterWidth = 8; // Counter width
    const checkoutCounterDepth = 2; // Counter depth
    const checkoutCounterXPositions = [-8, 0, 8]; // Three counters at these x positions
    
    // Helper function to check if a shelf overlaps with checkout counters
    const shelfOverlapsCheckout = (shelfX, shelfZ) => {
        const shelfWidth = 1.5;
        const shelfDepth = 0.3;
        const shelfXMin = shelfX - shelfWidth / 2;
        const shelfXMax = shelfX + shelfWidth / 2;
        const shelfZMin = shelfZ - shelfDepth / 2;
        const shelfZMax = shelfZ + shelfDepth / 2;
        
        // Check if shelf z overlaps with checkout counter z range
        const counterZMin = checkoutCounterZ - checkoutCounterDepth / 2;
        const counterZMax = checkoutCounterZ + checkoutCounterDepth / 2;
        const zOverlaps = shelfZMax >= counterZMin && shelfZMin <= counterZMax;
        
        if (!zOverlaps) return false;
        
        // Check if shelf x overlaps with any checkout counter
        for (const counterX of checkoutCounterXPositions) {
            const counterXMin = counterX - checkoutCounterWidth / 2;
            const counterXMax = counterX + checkoutCounterWidth / 2;
            if (shelfXMax >= counterXMin && shelfXMin <= counterXMax) {
                return true;
            }
        }
        return false;
    };
    
    // Create shelves for each aisle
    aislePositions.forEach((xPos) => {
        // Each aisle has shelves running along the depth
        for (let i = 0; i < 6; i++) {
            const zPos = -storeDepth/2 + 8 + i * 4; // Space shelves along depth
            // Skip shelf if it overlaps with checkout counters
            if (shelfOverlapsCheckout(xPos, zPos)) {
                continue;
            }
            const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
            shelf.position.set(xPos, 1, zPos);
            shelf.userData.isShelf = true;
            assignFlavor(shelf, 'GRUMBY_SHELF');
            interiorGroup.add(shelf);
            shelfZPositions.push({ x: xPos, z: zPos });
        }
    });
    
    // Add double-sided shelves (shelves on both sides of each aisle)
    aislePositions.forEach((xPos, aisleIndex) => {
        if (aisleIndex < aislePositions.length - 1) {
            const aisleCenter = (xPos + aislePositions[aisleIndex + 1]) / 2;
            // Left side of aisle
            for (let i = 0; i < 6; i++) {
                const zPos = -storeDepth/2 + 8 + i * 4;
                // Skip shelf if it overlaps with checkout counters
                if (shelfOverlapsCheckout(aisleCenter - 1.5, zPos)) {
                    continue;
                }
                const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
                shelf.position.set(aisleCenter - 1.5, 1, zPos);
                shelf.userData.isShelf = true;
                assignFlavor(shelf, 'GRUMBY_SHELF');
                interiorGroup.add(shelf);
                shelfZPositions.push({ x: aisleCenter - 1.5, z: zPos });
            }
            // Right side of aisle
            for (let i = 0; i < 6; i++) {
                const zPos = -storeDepth/2 + 8 + i * 4;
                // Skip shelf if it overlaps with checkout counters
                if (shelfOverlapsCheckout(aisleCenter + 1.5, zPos)) {
                    continue;
                }
                const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
                shelf.position.set(aisleCenter + 1.5, 1, zPos);
                shelf.userData.isShelf = true;
                assignFlavor(shelf, 'GRUMBY_SHELF');
                interiorGroup.add(shelf);
                shelfZPositions.push({ x: aisleCenter + 1.5, z: zPos });
            }
        }
    });
    
    // Product items on shelves (simple boxes) - more variety
    const productGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const productColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0xFF8800, 0x8800FF, 0x00FFFF];
    
    // Add products to all shelves
    shelfZPositions.forEach(({ x, z }) => {
        // Add more products per shelf (6-8 items)
        const productCount = 6 + Math.floor(Math.random() * 3);
        for (let i = 0; i < productCount; i++) {
            const product = new THREE.Mesh(
                productGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            product.position.set(
                x + (Math.random() - 0.5) * 1.2,
                1.3 + Math.random() * 0.4, // Vary height on shelf
                z + (Math.random() - 0.5) * 1.2
            );
            product.scale.set(
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4
            );
            interiorGroup.add(product);
        }
    });
    
    // Add some larger product displays (cereal boxes, etc.)
    const largeProductGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.2);
    const largeProductPositions = [
        { x: -10, z: -storeDepth/2 + 10 },
        { x: -5, z: -storeDepth/2 + 12 },
        { x: 0, z: -storeDepth/2 + 14 },
        { x: 5, z: -storeDepth/2 + 10 },
        { x: 10, z: -storeDepth/2 + 12 }
    ];
    largeProductPositions.forEach(({ x, z }) => {
        for (let i = 0; i < 3; i++) {
            const largeProduct = new THREE.Mesh(
                largeProductGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            largeProduct.position.set(x, 1.5, z + i * 0.3);
            interiorGroup.add(largeProduct);
        }
    });
    
    // Add snack displays
    const snackGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const snackPositions = [
        { x: -7.5, z: -storeDepth/2 + 6 },
        { x: -2.5, z: -storeDepth/2 + 8 },
        { x: 2.5, z: -storeDepth/2 + 6 },
        { x: 7.5, z: -storeDepth/2 + 8 }
    ];
    snackPositions.forEach(({ x, z }) => {
        for (let i = 0; i < 8; i++) {
            const snack = new THREE.Mesh(
                snackGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            snack.position.set(
                x + (Math.random() - 0.5) * 1.5,
                1.2 + Math.random() * 0.3,
                z + (Math.random() - 0.5) * 1.5
            );
            interiorGroup.add(snack);
        }
    });
    
    // Refrigerated sections along side walls - more fridges
    const fridgeGeometry = new THREE.BoxGeometry(3, 2.5, 1.5);
    const fridgeMaterial = warmGlow(0xFFFFFF);
    
    // Left wall fridges
    const leftFridgePositions = [-storeDepth/2 + 6, -storeDepth/2 + 10, -storeDepth/2 + 14, -storeDepth/2 + 18, -storeDepth/2 + 22, -storeDepth/2 + 26];
    leftFridgePositions.forEach((zPos) => {
        const fridge = new THREE.Mesh(fridgeGeometry, fridgeMaterial);
        fridge.position.set(-storeWidth/2 + 1.5, 1.25, zPos);
        assignFlavor(fridge, 'GRUMBY_FRIDGE');
        interiorGroup.add(fridge);
    });
    
    // Right wall fridges
    const rightFridgePositions = [-storeDepth/2 + 6, -storeDepth/2 + 10, -storeDepth/2 + 14, -storeDepth/2 + 18, -storeDepth/2 + 22, -storeDepth/2 + 26];
    rightFridgePositions.forEach((zPos) => {
        const fridge = new THREE.Mesh(fridgeGeometry, fridgeMaterial);
        fridge.position.set(storeWidth/2 - 1.5, 1.25, zPos);
        assignFlavor(fridge, 'GRUMBY_FRIDGE');
        interiorGroup.add(fridge);
    });
    
    // Beverage coolers near checkout
    const coolerGeometry = new THREE.BoxGeometry(4, 2, 1);
    const coolerMaterial = warmGlow(0xCCEEFF);
    
    // Left side cooler - rotated 90 degrees and moved down the wall
    const leftCooler = new THREE.Mesh(coolerGeometry, coolerMaterial);
    leftCooler.rotation.y = Math.PI / 2; // Rotate 90 degrees
    leftCooler.position.set(-storeWidth/2 + 0.5, 1, 10);
    assignFlavor(leftCooler, 'GRUMBY_ICE_CREAM');
    interiorGroup.add(leftCooler);
    
    // Right side cooler - rotated 90 degrees and moved down the wall
    const rightCooler = new THREE.Mesh(coolerGeometry, coolerMaterial);
    rightCooler.rotation.y = Math.PI / 2; // Rotate 90 degrees
    rightCooler.position.set(storeWidth/2 - 0.5, 1, 10);
    assignFlavor(rightCooler, 'GRUMBY_ICE_CREAM');
    interiorGroup.add(rightCooler);
    
    // Magazine rack near front - moved back, rotated 90 degrees
    const magazineRackGeometry = new THREE.BoxGeometry(3, 1.5, 0.5);
    const magazineRackMaterial = warmGlow(0x8B4513);
    const magazineRack = new THREE.Mesh(magazineRackGeometry, magazineRackMaterial);
    magazineRack.rotation.y = Math.PI / 2; // Rotate 90 degrees
    magazineRack.position.set(-storeWidth/2 + 0.5, 0.75, storeDepth/2 - 8);
    assignFlavor(magazineRack, 'GRUMBY_MAGAZINE');
    interiorGroup.add(magazineRack);
    
    // Add some magazines
    const magazineGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.3);
    for (let i = 0; i < 12; i++) {
        const magazine = new THREE.Mesh(
            magazineGeometry,
            warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
        );
        magazine.position.set(
            -storeWidth/2 + 0.5 + (Math.random() - 0.5) * 0.3, // Adjusted for rotated rack
            0.9 + Math.random() * 0.3,
            storeDepth/2 - 8 + (Math.random() - 0.5) * 2.5 // Adjusted for rotated rack
        );
        interiorGroup.add(magazine);
    }
    
    // Candy displays - multiple displays wrapping around the corner from right wall to front wall
    const candyDisplayWidth = 3; // Width of display
    const candyDisplayHeight = 1.5;
    const candyDisplayDepth = 1.5;
    const candyDisplayGeometry = new THREE.BoxGeometry(candyDisplayWidth, candyDisplayHeight, candyDisplayDepth);
    const candyDisplayMaterial = warmGlow(0xFFB6C1);
    const candyGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    
    // Helper function to create a candy display with items
    const createCandyDisplay = (x, z, rotation) => {
        const display = new THREE.Mesh(candyDisplayGeometry, candyDisplayMaterial);
        display.rotation.y = rotation;
        display.position.set(x, candyDisplayHeight / 2, z);
        assignFlavor(display, 'GRUMBY_CANDY');
        interiorGroup.add(display);
        
        // Add candy items on the display
        const candySize = 0.15; // Size of candy geometry
        const candyHalfSize = candySize / 2; // Half size to account for bounds
        for (let i = 0; i < 15; i++) {
            const candy = new THREE.Mesh(
                candyGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            // Adjust positions based on rotation, accounting for candy size to prevent spillover
            if (rotation === Math.PI / 2) {
                // Rotated 90 degrees (along right/left wall) - width becomes depth
                // x constrained by depth, z constrained by width
                const maxXOffset = (candyDisplayDepth / 2) - candyHalfSize;
                const maxZOffset = (candyDisplayWidth / 2) - candyHalfSize;
                candy.position.set(
                    x + (Math.random() - 0.5) * maxXOffset * 2,
                    candyDisplayHeight / 2 + 0.1 + Math.random() * 0.3,
                    z + (Math.random() - 0.5) * maxZOffset * 2
                );
            } else {
                // Not rotated (along front/back wall)
                // x constrained by width, z constrained by depth
                const maxXOffset = (candyDisplayWidth / 2) - candyHalfSize;
                const maxZOffset = (candyDisplayDepth / 2) - candyHalfSize;
                candy.position.set(
                    x + (Math.random() - 0.5) * maxXOffset * 2,
                    candyDisplayHeight / 2 + 0.1 + Math.random() * 0.3,
                    z + (Math.random() - 0.5) * maxZOffset * 2
                );
            }
            interiorGroup.add(candy);
        }
        
        // Add coffee cups on top of the display - randomly and sparingly (25% chance per display)
        if (Math.random() < 0.45) {
            const cupGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.3, 8);
            const cupMaterial = warmGlow(0xFFFFFF);
            // Display is positioned at candyDisplayHeight/2, so top is at candyDisplayHeight
            const displayTopY = candyDisplayHeight + 0.15; // Top of display + half cup height
            const cupTopY = displayTopY + 0.15; // Top of cup (displayTopY + half cup height)
            
            const cup = new THREE.Mesh(cupGeometry, cupMaterial);
            let cupX, cupZ;
            if (rotation === Math.PI / 2) {
                // Rotated display - random position along z-axis (width becomes depth)
                cupZ = z - candyDisplayWidth / 2 + Math.random() * candyDisplayWidth;
                cupX = x + (Math.random() - 0.5) * 0.1; // Slight random offset
                cup.position.set(cupX, displayTopY, cupZ);
            } else {
                // Not rotated - random position along x-axis
                cupX = x - candyDisplayWidth / 2 + Math.random() * candyDisplayWidth;
                cupZ = z + (Math.random() - 0.5) * 0.1; // Slight random offset
                cup.position.set(cupX, displayTopY, cupZ);
            }
            interiorGroup.add(cup);
            
            // Add smaller steam particles rising from the cup (like Donut Galaxy mugs)
            const cupSteamParticles = [];
            const numCupSteamParticles = 1 + Math.floor(Math.random() * 2); // 1 to 2 particles
            
            // Create a group for the cup steam
            const cupSteamGroup = new THREE.Group();
            cupSteamGroup.position.set(cupX, cupTopY, cupZ); // Position at top of cup
            
            for (let i = 0; i < numCupSteamParticles; i++) {
                // Create smaller steam particles for cups
                const steamMaterial = createGlowingWireframeMaterial(0xFFFFFF, 0.3, 0.2); // Same as other steam
                const steamGeometry = new THREE.SphereGeometry(0.04 + Math.random() * 0.02, 6, 4); // Size 0.04-0.06
                const steamParticle = new THREE.Mesh(steamGeometry, steamMaterial);
                const initialX = (Math.random() - 0.5) * 0.08; // Random x offset (relative to cup)
                const initialZ = (Math.random() - 0.5) * 0.08; // Random z offset (relative to cup)
                steamParticle.position.set(
                    initialX,
                    0, // Relative to cupSteamGroup position (starts at top of cup)
                    initialZ
                );
                steamParticle.userData.initialY = 0; // Start at group origin
                steamParticle.userData.initialX = initialX;
                steamParticle.userData.initialZ = initialZ;
                steamParticle.userData.speed = 0.04 + Math.random() * 0.02; // Speed 0.04-0.06
                steamParticle.userData.offset = Math.random() * Math.PI * 2; // Random phase offset
                steamParticle.userData.baseScale = 0.8 + Math.random() * 0.3; // Base scale for visibility
                cupSteamGroup.add(steamParticle);
                cupSteamParticles.push(steamParticle);
            }
            
            // Store steam particles in cupSteamGroup's userData for animation
            cupSteamGroup.userData.steamParticles = cupSteamParticles;
            cupSteamGroup.userData.isMugSteamGroup = true; // Mark as mug steam for animation
            interiorGroup.add(cupSteamGroup);
        }
        
        return { x, z, rotation }; // Return position info for tracking
    };
    
    // Coffee corner at the front-right corner (actually in the corner)
    const coffeeMachineWidth = 1.5;
    const coffeeMachineDepth = 1.5;
    // Position coffee corner flush with the corner walls
    const coffeeCornerX = storeWidth/2 - coffeeMachineWidth / 2; // Flush with right wall
    const coffeeCornerZ = storeDepth/2 - coffeeMachineDepth / 2; // Flush with front wall
    
    // Calculate coffee corner boundaries
    const coffeeCornerXStart = coffeeCornerX - coffeeMachineWidth / 2; // Left edge of coffee corner
    const coffeeCornerXEnd = coffeeCornerX + coffeeMachineWidth / 2; // Right edge (at wall)
    const coffeeCornerZStart = coffeeCornerZ - coffeeMachineDepth / 2; // Back edge of coffee corner
    const coffeeCornerZEnd = coffeeCornerZ + coffeeMachineDepth / 2; // Front edge (at wall)
    
    // Coffee machine
    const coffeeMachineGeometry = new THREE.BoxGeometry(coffeeMachineWidth, 1.5, coffeeMachineDepth);
    const coffeeMachineMaterial = warmGlow(0xFFB6C1);
    const coffeeMachine = new THREE.Mesh(coffeeMachineGeometry, coffeeMachineMaterial);
    coffeeMachine.position.set(coffeeCornerX, 0.75, coffeeCornerZ);
    assignFlavor(coffeeMachine, 'GRUMBY_COFFEE_MACHINE');
    interiorGroup.add(coffeeMachine);
    
    // Coffee pot on top of coffee machine
    const coffeeMachineTopY = 0.5 + 1.5 / 2; // Top of coffee machine (y position + half height)
    const coffeePotGroup = new THREE.Group();
    
    // Coffee pot body (main cylinder)
    const potBodyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8);
    const potMaterial = warmGlow(0x8B4513); // Brown coffee pot color
    const potBody = new THREE.Mesh(potBodyGeometry, potMaterial);
    potBody.position.y = 0.2; // Half height of pot body
    coffeePotGroup.add(potBody);
    
    // Coffee pot lid (smaller cylinder on top) - dark brown
    const potLidGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 8);
    const darkBrownMaterial = warmGlow(0x6A3A3A); // Dark brown (between black and brown) for lid and handle
    const potLid = new THREE.Mesh(potLidGeometry, darkBrownMaterial);
    potLid.position.y = 0.425; // On top of pot body
    coffeePotGroup.add(potLid);
    
    // Coffee pot handle (torus shape) - dark brown
    const handleGeometry = new THREE.TorusGeometry(0.12, 0.03, 6, 16, Math.PI);
    const handle = new THREE.Mesh(handleGeometry, darkBrownMaterial);
    handle.rotation.z = Math.PI / 2 + Math.PI + 0.2; // Rotate to be vertical, then 180 degrees
    handle.position.set(0.25, 0.2, 0); // To the right side of pot
    coffeePotGroup.add(handle);
    
    // Coffee pot spout (small box)
    const spoutGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.08);
    const spout = new THREE.Mesh(spoutGeometry, potMaterial);
    spout.position.set(-0.25, 0.25, 0); // To the left side of pot, moved in closer, slightly higher
    coffeePotGroup.add(spout);
    
    // Steam particles rising from the pot
    const steamParticles = [];
    const numSteamParticles = 3 + Math.floor(Math.random() * 3); // 3 to 5 particles
    
    for (let i = 0; i < numSteamParticles; i++) {
        // Create a unique material instance for each particle so they can fade independently
        const steamMaterial = createGlowingWireframeMaterial(0xFFFFFF, 0.3, 0.2); // White, semi-transparent
        const steamGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.03, 6, 4);
        const steamParticle = new THREE.Mesh(steamGeometry, steamMaterial);
        const initialX = (Math.random() - 0.5) * 0.15; // Random x offset
        const initialZ = (Math.random() - 0.5) * 0.15; // Random z offset
        steamParticle.position.set(
            initialX,
            0.5, // Start at top of pot
            initialZ
        );
        steamParticle.userData.initialY = 0.5;
        steamParticle.userData.initialX = initialX;
        steamParticle.userData.initialZ = initialZ;
        steamParticle.userData.speed = 0.05 + Math.random() * 0.03; // Much slower rise speed
        steamParticle.userData.offset = Math.random() * Math.PI * 2; // Random phase offset
        steamParticle.userData.baseScale = 0.8 + Math.random() * 0.4; // Varying size
        coffeePotGroup.add(steamParticle);
        steamParticles.push(steamParticle);
    }
    
    // Store steam particles in coffee pot group userData for animation
    coffeePotGroup.userData.steamParticles = steamParticles;
    
    // Position coffee pot on top of machine, centered
    coffeePotGroup.position.set(coffeeCornerX, coffeeMachineTopY + 0.2, coffeeCornerZ);
    coffeePotGroup.rotation.y = 325; // Rotate to face inward from the wall
    interiorGroup.add(coffeePotGroup);
    
    // Coffee corner sign/display - bigger, on the wall, higher up
    const coffeeSignGeometry = new THREE.BoxGeometry(4, 2.5, 2.5); // Bigger sign
    const coffeeSignMaterial = warmGlow(0xFFD700);
    const coffeeSign = new THREE.Mesh(coffeeSignGeometry, coffeeSignMaterial);
    coffeeSign.rotation.y = Math.PI / 2; // Rotate to face inward from the wall
    // When rotated, depth (0.4) becomes width along x-axis, so sign extends 0.2 units from center
    // Position flush against right wall: storeWidth/2 - 0.2 (half of depth)
    coffeeSign.position.set(storeWidth/2 - 0.2, 5, storeDepth/2 - 20); // Flush against right wall
    interiorGroup.add(coffeeSign);
    
    // Interactive marker under the coffee sign
    const coffeeSignAreaMarker = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1), // Very small, invisible
        warmGlow(0x000000, 0) // Completely transparent
    );
    coffeeSignAreaMarker.position.set(storeWidth/2 - 2, 1, storeDepth/2 - 20); // Under the sign
    assignFlavor(coffeeSignAreaMarker, 'GRUMBY_COFFEE_CORNER');
    interiorGroup.add(coffeeSignAreaMarker);
    
    // Candy displays along the right wall (rotated 90 degrees)
    // When rotated 90 degrees: width (3) becomes depth along z-axis, depth (1.5) becomes width along x-axis
    // Right cooler is at z=10, extends from z=8 to z=12 (4 units deep when rotated)
    const coolerZCenter = 10;
    const coolerDepth = 4; // When rotated, width becomes depth
    const coolerZStart = coolerZCenter - coolerDepth / 2; // z=8
    const coolerZEnd = coolerZCenter + coolerDepth / 2; // z=12
    
    // Position candy displays so their corners touch, wrapping around the coffee corner
    // The coffee corner is at the store corner, so candy displays should meet behind/left of it
    // Right wall display (rotated): front-right corner should be at the meeting point
    // Front wall display: front-right corner should be at the same meeting point
    // Meeting point should be: x = coffeeCornerXStart - candyDisplayWidth/2, z = coffeeCornerZStart - candyDisplayWidth/2
    // This ensures they wrap around the coffee corner and touch at their corners
    
    // Right wall displays - front corner touches front wall display's corner
    const meetingZ = coffeeCornerZStart - candyDisplayWidth / 2; // Where corners meet (behind coffee corner)
    const rightWallFirstZ = meetingZ; // First display center
    const rightWallEndZ = coolerZStart - candyDisplayWidth / 2; // Stop before cooler
    const numRightWallDisplays = Math.floor((rightWallFirstZ - rightWallEndZ) / candyDisplayWidth);
    
    for (let i = 0; i < numRightWallDisplays; i++) {
        const z = rightWallFirstZ - i * candyDisplayWidth;
        if (z - candyDisplayWidth / 2 > coolerZEnd) { // Make sure it doesn't overlap with cooler
            createCandyDisplay(storeWidth/2 - candyDisplayDepth / 2, z, Math.PI / 2);
        }
    }
    
    // Candy displays along the front wall (not rotated)
    // Right corner touches right wall display's corner
    const meetingX = coffeeCornerXStart - candyDisplayWidth / 2; // Where corners meet (left of coffee corner)
    const frontWallFirstX = meetingX; // First display center
    const numFrontWallDisplays = 4;
    for (let i = 0; i < numFrontWallDisplays; i++) {
        const x = frontWallFirstX - i * candyDisplayWidth; // Space by width (touching)
        createCandyDisplay(x, storeDepth/2 - candyDisplayDepth / 2, 0);
    }
    
    // Drink fridges along the back wall - attached together in a continuous row
    const drinkFridgeWidth = 2; // Width of each fridge unit
    const drinkFridgeHeight = 3;
    const drinkFridgeDepth = 1.5;
    const drinkFridgeGeometry = new THREE.BoxGeometry(drinkFridgeWidth, drinkFridgeHeight, drinkFridgeDepth);
    const drinkFridgeMaterial = warmGlow(0xCCEEFF); // Light blue for drink fridges
    
    // Calculate how many fridges fit across the back wall (leaving some margin)
    const totalFridgeWidth = storeWidth - 4; // Leave 2 units margin on each side
    const numFridges = Math.floor(totalFridgeWidth / drinkFridgeWidth);
    const startX = -totalFridgeWidth / 2 + drinkFridgeWidth / 2;
    const backWallZ = -storeDepth/2 + drinkFridgeDepth / 2; // Position against back wall
    
    // Create continuous row of attached fridges
    for (let i = 0; i < numFridges; i++) {
        const xPos = startX + i * drinkFridgeWidth;
        const drinkFridge = new THREE.Mesh(drinkFridgeGeometry, drinkFridgeMaterial);
        drinkFridge.position.set(xPos, drinkFridgeHeight / 2, backWallZ);
        assignFlavor(drinkFridge, 'SUPERMARKET_FRIDGE');
        interiorGroup.add(drinkFridge);
        
        // Each fridge gets 1, 2, or 3 base colors
        // Define color palettes - each fridge uses one palette with 1-3 colors
        const colorPalettes = [
            [0x0066CC, 0x004499], // Blue variants (Red Bull style) - 2 colors
            [0xCC0000], // Red (Coca-Cola style) - 1 color
            [0xCC0000, 0x0000FF], // Red + Blue - 2 colors
            [0x00CC00, 0x009900], // Green variants (Sprite style) - 2 colors
            [0xFF6600, 0xCC5500, 0xFF8800], // Orange variants (Fanta style) - 3 colors
            [0x9900CC, 0x7700AA], // Purple variants - 2 colors
            [0xFFFF00], // Yellow - 1 color
            [0x00CCCC, 0x009999, 0x00FFFF], // Cyan variants - 3 colors
            [0xFF0066, 0xCC0055], // Pink variants - 2 colors
            [0xFF0000, 0x00FF00, 0x0000FF], // Red + Green + Blue - 3 colors
            [0xFF8800, 0x00CCCC], // Orange + Cyan - 2 colors
            [0x9900CC, 0xFFFF00] // Purple + Yellow - 2 colors
        ];
        const palette = colorPalettes[i % colorPalettes.length];
        const numColors = palette.length; // 1, 2, or 3 colors
        
        // Add drink bottles inside each fridge (visible through glass)
        const drinkBottleGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
        
        // Create multiple rows of bottles on shelves
        for (let shelf = 0; shelf < 5; shelf++) {
            const shelfY = 0.4 + shelf * 0.5;
            const bottlesPerShelf = 4; // Chunks of 2
            
            // Each shelf uses one of the colors from the palette, cycling through them
            const colorIndex = shelf % numColors;
            const shelfColor = palette[colorIndex];
            const baseOpacity = 0.7 + (shelf * 0.05); // Slightly different opacity per shelf
            
            // Calculate proper x positioning within fridge width (centered)
            const fridgeMargin = 0.2; // Margin from fridge edges
            const availableWidth = drinkFridgeWidth - (fridgeMargin * 2);
            const bottleWidth = 0.2; // Width of each bottle
            const spacingBetweenBottles = 0.15; // Fixed spacing between bottles
            
            // Calculate total width needed for all bottles with spacing
            const totalBottlesWidth = (bottlesPerShelf * bottleWidth) + ((bottlesPerShelf - 1) * spacingBetweenBottles);
            
            // Calculate offset from fridge center to start of bottle group (left edge)
            const bottlesGroupLeftEdge = -totalBottlesWidth / 2;
            
            for (let j = 0; j < bottlesPerShelf; j++) {
                // Random chance for item to be out of stock (15% chance)
                if (Math.random() < 0.15) {
                    continue; // Skip this bottle - out of stock
                }
                
                // Position bottles evenly spaced and centered within the fridge
                // xPos is the center of the fridge, so position relative to that
                // Start from left edge of group, then add spacing and bottle width to get each bottle's center
                const bottleX = xPos + bottlesGroupLeftEdge + (j * (bottleWidth + spacingBetweenBottles)) + (bottleWidth / 2);
                
                // Vary opacity slightly for visual interest (like regular vs sugar-free)
                const bottleOpacity = baseOpacity + (Math.random() - 0.5) * 0.15;
                const clampedOpacity = Math.max(0.5, Math.min(0.95, bottleOpacity));
                
                const bottle = new THREE.Mesh(
                    drinkBottleGeometry,
                    warmGlow(shelfColor, clampedOpacity)
                );
                bottle.position.set(
                    bottleX + (Math.random() - 0.5) * 0.05, // Small random offset
                    shelfY + (Math.random() - 0.5) * 0.1,
                    backWallZ + 0.4 + Math.random() * 0.2
                );
                interiorGroup.add(bottle);
            }
        }
    }
    
    // Add a top frame/lighting panel above the fridges
    // Calculate actual width of the fridge bank based on number of fridges
    const actualFridgeBankWidth = numFridges * drinkFridgeWidth;
    const fridgeBankCenterX = startX + (numFridges - 1) * drinkFridgeWidth / 2;
    const topPanelGeometry = new THREE.BoxGeometry(actualFridgeBankWidth, 0.3, drinkFridgeDepth + 0.2);
    const topPanelMaterial = warmGlow(0xFFFFFF, 0.9);
    const topPanel = new THREE.Mesh(topPanelGeometry, topPanelMaterial);
    topPanel.position.set(fridgeBankCenterX, drinkFridgeHeight + 0.15, backWallZ);
    interiorGroup.add(topPanel);
    
    // More checkout counters
    for (let i = 0; i < 3; i++) {
        const checkoutCounter = new THREE.Mesh(counterGeometry, counterMaterial);
        checkoutCounter.position.set(-8 + i * 8, 0.6, -6);
        assignFlavor(checkoutCounter, 'SUPERMARKET_CHECKOUT');
        interiorGroup.add(checkoutCounter);
        
        // Cash register on each counter
        const reg = new THREE.Mesh(registerGeometry, registerMaterial);
        reg.position.set(-8 + i * 8 + 2, 1.2, -6);
        interiorGroup.add(reg);
    }
    
    
    // Endcap displays at aisle ends - front ones moved back and rotated
    const endcapGeometry = new THREE.BoxGeometry(4, 1.8, 1);
    const endcapMaterial = warmGlow(0xFFD700);
    const endcapPositions = [
        { x: -7.5, z: -storeDepth/2 + 6, rotation: 0 }, // Back endcaps stay the same
        { x: -2.5, z: -storeDepth/2 + 6, rotation: 0 },
        { x: 2.5, z: -storeDepth/2 + 6, rotation: 0 },
        { x: 7.5, z: -storeDepth/2 + 6, rotation: 0 },
        { x: -7.5, z: storeDepth/2 - 14, rotation: Math.PI / 2 }, // Front endcaps rotated 90 degrees
        { x: -2.5, z: storeDepth/2 - 14, rotation: Math.PI / 2 },
        { x: 2.5, z: storeDepth/2 - 14, rotation: Math.PI / 2 },
        { x: 7.5, z: storeDepth/2 - 14, rotation: Math.PI / 2 }
    ];
    endcapPositions.forEach(({ x, z, rotation }) => {
        const endcap = new THREE.Mesh(endcapGeometry, endcapMaterial);
        endcap.rotation.y = rotation;
        endcap.position.set(x, 0.9, z);
        assignFlavor(endcap, 'SUPERMARKET_ENDCAP');
        interiorGroup.add(endcap);
        
        // Add products on endcap
        for (let i = 0; i < 6; i++) {
            const endcapProduct = new THREE.Mesh(
                productGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            endcapProduct.position.set(
                x + (Math.random() - 0.5) * 1.8,
                1.1 + Math.random() * 0.4,
                z + (Math.random() - 0.5) * 0.8
            );
            interiorGroup.add(endcapProduct);
        }
    });
    
    // Add some floor displays (promotional items) - front ones moved back
    const floorDisplayGeometry = new THREE.BoxGeometry(1.5, 0.3, 1.5);
    const floorDisplayMaterial = warmGlow(0x888888);
    const floorDisplayPositions = [
        { x: -9, z: -storeDepth/2 + 12 }, // Back displays stay the same
        { x: -4, z: -storeDepth/2 + 16 },
        { x: 4, z: -storeDepth/2 + 12 },
        { x: 9, z: -storeDepth/2 + 16 },
        { x: -9, z: storeDepth/2 - 16 }, // Front displays moved back from -10 to -16
        { x: 9, z: storeDepth/2 - 16 }
    ];
    floorDisplayPositions.forEach(({ x, z }) => {
        const floorDisplay = new THREE.Mesh(floorDisplayGeometry, floorDisplayMaterial);
        floorDisplay.position.set(x, 0.15, z);
        assignFlavor(floorDisplay, 'SUPERMARKET_FLOOR_DISPLAY');
        interiorGroup.add(floorDisplay);
        
        // Stack products on display
        for (let i = 0; i < 4; i++) {
            const displayProduct = new THREE.Mesh(
                productGeometry,
                warmGlow(productColors[Math.floor(Math.random() * productColors.length)])
            );
            displayProduct.position.set(
                x + (Math.random() - 0.5) * 1.2,
                0.3 + i * 0.35,
                z + (Math.random() - 0.5) * 1.2
            );
            interiorGroup.add(displayProduct);
        }
    });
    
    // Exit door at the front (where player enters)
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const exitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    exitDoor.position.set(0, 1.5, storeDepth/2);
    exitDoor.userData.isExitPortal = true;
    interiorGroup.add(exitDoor);
    markStructural(exitDoor);
    
    // Collect all interactive items for flavor text system
    const interactiveItems = [];
    interiorGroup.traverse((object) => {
        if (object.userData && object.userData.isInteractive) {
            interactiveItems.push(object);
        }
    });
    interiorGroup.userData.interactiveItems = interactiveItems;
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    
    console.log("🏪 Created Grumby's interior");
    return interiorGroup;
};

// Create a generic shop interior (template for other shops)
