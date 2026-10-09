import * as THREE from 'three';
import { createWireframeMaterial } from '../utils.js';
import { assignFlavor, INTERIOR_BASE_SIZE, applyInteriorScale, createInteriorBounds, compressInteriorToBounds, markStructural } from './shared.js';
import { createGlowingWireframeMaterial } from '../buildings.js';
export const createShopInterior = (scene, interiorType, shopName, storeWidth = 15, storeDepth = 12) => {
    const interiorGroup = new THREE.Group();
    interiorGroup.name = `${shopName} Interior`;
    
    // All interiors render at 100x100 base size and are scaled to 75x75 in world space
    storeWidth = INTERIOR_BASE_SIZE;
    storeDepth = INTERIOR_BASE_SIZE;
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
    interiorGroup.add(floor);
    markStructural(floor);
    markStructural(floor);
    markStructural(floor);
    markStructural(floor);
    markStructural(floor);
    
    // Basic walls
    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(storeWidth, wallHeight, wallThickness);
    const backWallMaterial = createWireframeMaterial(0xCCCCCC, 0.3); // Transparent walls
    const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
    backWall.position.set(0, wallHeight/2, -storeDepth/2);
    interiorGroup.add(backWall);
    markStructural(backWall);
    
    // Left and right walls
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, storeDepth);
    const leftWall = new THREE.Mesh(sideWallGeometry, backWallMaterial);
    leftWall.position.set(-storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(leftWall);
    markStructural(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, backWallMaterial);
    rightWall.position.set(storeWidth/2, wallHeight/2, 0);
    interiorGroup.add(rightWall);
    markStructural(rightWall);
    
    // Front wall (with door opening)
    const frontWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
    frontWall.position.set(0, wallHeight/2, storeDepth/2);
    interiorGroup.add(frontWall);
    markStructural(frontWall);
    
    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(storeWidth, storeDepth);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xDDA0DD, // Plum - soft purple
        transparent: true,
        opacity: 0.2
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight + 3; // Raise ceiling
    interiorGroup.add(ceiling);
    markStructural(ceiling);
    
    // Add furniture and details based on shop type
    switch(interiorType) {
        case 'pizza': // Grohos Pizza
            // Pizza oven at the back
            const ovenGeometry = new THREE.BoxGeometry(4, 3, 2);
            const ovenMaterial = warmGlow(0x333333);
            const oven = new THREE.Mesh(ovenGeometry, ovenMaterial);
            oven.position.set(0, 1.5, -storeDepth/2 + 1);
            interiorGroup.add(oven);
            
            // Counter/order area
            const pizzaCounterGeometry = new THREE.BoxGeometry(6, 1.2, 2);
            const pizzaCounterMaterial = warmGlow(0xCC0000);
            const pizzaCounter = new THREE.Mesh(pizzaCounterGeometry, pizzaCounterMaterial);
            pizzaCounter.position.set(0, 0.6, 2);
            interiorGroup.add(pizzaCounter);
            
            // Table and chair geometries (defined once for reuse)
            const tableGeometry = new THREE.BoxGeometry(2, 0.8, 1.5);
            const tableMaterial = warmGlow(0x8B4513);
            const chairGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
            const chairMaterial = warmGlow(0x654321);
            
            // Tables and chairs
            for (let i = 0; i < 3; i++) {
                const table = new THREE.Mesh(tableGeometry, tableMaterial);
                table.position.set(-8 + i * 8, 0.4, -4);
                interiorGroup.add(table);
                
                // Chairs around table
                for (let j = 0; j < 2; j++) {
                    const chair = new THREE.Mesh(chairGeometry, chairMaterial);
                    chair.position.set(-8 + i * 8 + (j === 0 ? -1.2 : 1.2), 0.5, -4);
                    interiorGroup.add(chair);
                }
            }
            
            // Display case with pizza slices
            const displayCaseGeometry = new THREE.BoxGeometry(4, 2, 1);
            const displayCaseMaterial = warmGlow(0xCCCCCC);
            const displayCase = new THREE.Mesh(displayCaseGeometry, displayCaseMaterial);
            displayCase.position.set(0, 1, 4);
            interiorGroup.add(displayCase);
            
            // Prep station
            const prepStationGeometry = new THREE.BoxGeometry(4, 1.5, 2);
            const prepStationMaterial = warmGlow(0xFFFFFF);
            const prepStation = new THREE.Mesh(prepStationGeometry, prepStationMaterial);
            prepStation.position.set(-storeWidth/2 + 2, 0.75, -storeDepth/2 + 3);
            interiorGroup.add(prepStation);
            
            // Storage shelves
            const pizzaStorageShelfGeometry = new THREE.BoxGeometry(2, 3, 0.5);
            const pizzaStorageShelfMaterial = warmGlow(0x8B4513);
            for (let i = 0; i < 4; i++) {
                const storageShelf = new THREE.Mesh(pizzaStorageShelfGeometry, pizzaStorageShelfMaterial);
                storageShelf.position.set(storeWidth/2 - 1.5, 1.5, -storeDepth/2 + 3 + i * 4);
                interiorGroup.add(storageShelf);
            }
            break;
            
        case 'clothing': // Clothing Store
            // Circular clothing racks (round racks - more realistic)
            const createCircularRack = (x, z) => {
                const rackGroup = new THREE.Group();
                
                // Central pole
                const poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
                const poleMaterial = warmGlow(0x696969);
                const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                pole.position.y = 0.9;
                rackGroup.add(pole);
                
                // Circular bar at top
                const barRadius = 0.8;
                const barGeometry = new THREE.TorusGeometry(barRadius, 0.03, 8, 16);
                const barMaterial = warmGlow(0x8B4513);
                const bar = new THREE.Mesh(barGeometry, barMaterial);
                bar.position.y = 1.7;
                bar.rotation.x = Math.PI / 2;
                rackGroup.add(bar);
                
                // Base plate
                const baseGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
                const baseMaterial = warmGlow(0x555555);
                const base = new THREE.Mesh(baseGeometry, baseMaterial);
                base.position.y = 0.05;
                rackGroup.add(base);
                
                rackGroup.position.set(x, 0, z);
                return rackGroup;
            };
            
            // Wall-mounted clothing racks
            const createWallRack = (x, z, rotation) => {
                const rackGroup = new THREE.Group();
                
                // Wall bracket
                const bracketGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
                const bracketMaterial = warmGlow(0x696969);
                const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
                bracket.position.set(0, 1.6, 0);
                rackGroup.add(bracket);
                
                // Horizontal bar
                const barGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2.5, 8);
                const barMaterial = warmGlow(0x8B4513);
                const bar = new THREE.Mesh(barGeometry, barMaterial);
                bar.position.set(0, 1.6, 0);
                bar.rotation.z = Math.PI / 2;
                rackGroup.add(bar);
                
                rackGroup.position.set(x, 0, z);
                rackGroup.rotation.y = rotation;
                return rackGroup;
            };
            
            // Mannequins for display
            const createMannequin = (x, z) => {
                const mannequinGroup = new THREE.Group();
                
                // Head
                const headGeometry = new THREE.SphereGeometry(0.15, 8, 8);
                const headMaterial = warmGlow(0xF5DEB3);
                const head = new THREE.Mesh(headGeometry, headMaterial);
                head.position.y = 1.5;
                mannequinGroup.add(head);
                
                // Torso
                const torsoGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8);
                const torsoMaterial = warmGlow(0xF5DEB3);
                const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
                torso.position.y = 1.1;
                mannequinGroup.add(torso);
                
                // Stand/base
                const standGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 8);
                const standMaterial = warmGlow(0x444444);
                const stand = new THREE.Mesh(standGeometry, standMaterial);
                stand.position.y = 0.15;
                mannequinGroup.add(stand);
                
                mannequinGroup.position.set(x, 0, z);
                return mannequinGroup;
            };
            
            // Shelving units for folded clothes
            const createShelvingUnit = (x, z, width = 2) => {
                const shelfGroup = new THREE.Group();
                
                // Vertical supports
                const supportGeometry = new THREE.BoxGeometry(0.08, 1.5, 0.08);
                const supportMaterial = warmGlow(0x8B4513);
                for (let i = 0; i < 2; i++) {
                    const support = new THREE.Mesh(supportGeometry, supportMaterial);
                    support.position.set(-width/2 + i * width, 0.75, 0);
                    shelfGroup.add(support);
                }
                
                // Shelves (3 levels)
                const shelfGeometry = new THREE.BoxGeometry(width, 0.05, 0.4);
                const shelfMaterial = warmGlow(0xF5DEB3);
                for (let i = 0; i < 3; i++) {
                    const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
                    shelf.position.set(0, 0.3 + i * 0.5, 0);
                    shelfGroup.add(shelf);
                }
                
                shelfGroup.position.set(x, 0, z);
                return shelfGroup;
            };
            
            // Display tables with better styling
            const createDisplayTable = (x, z, width = 2.5) => {
                const tableGroup = new THREE.Group();
                
                // Table top
                const topGeometry = new THREE.BoxGeometry(width, 0.1, 1.2);
                const topMaterial = warmGlow(0xF5F5DC);
                const top = new THREE.Mesh(topGeometry, topMaterial);
                top.position.y = 0.8;
                tableGroup.add(top);
                
                // Table legs
                const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8);
                const legMaterial = warmGlow(0x8B4513);
                const legPositions = [
                    [-width/2 + 0.2, 0.4, -0.5],
                    [width/2 - 0.2, 0.4, -0.5],
                    [-width/2 + 0.2, 0.4, 0.5],
                    [width/2 - 0.2, 0.4, 0.5]
                ];
                legPositions.forEach(([px, py, pz]) => {
                    const leg = new THREE.Mesh(legGeometry, legMaterial);
                    leg.position.set(px, py, pz);
                    tableGroup.add(leg);
                });
                
                tableGroup.position.set(x, 0, z);
                return tableGroup;
            };
            
            // Circular racks throughout the store (main display area)
            const circularRackPositions = [
                { x: -storeWidth/2 + 3, z: -storeDepth/2 + 3 },
                { x: -storeWidth/2 + 3, z: -storeDepth/2 + 7 },
                { x: 0, z: -storeDepth/2 + 3 },
                { x: 0, z: -storeDepth/2 + 7 },
                { x: storeWidth/2 - 3, z: -storeDepth/2 + 3 },
                { x: storeWidth/2 - 3, z: -storeDepth/2 + 7 },
                { x: -storeWidth/2 + 3, z: 0 },
                { x: storeWidth/2 - 3, z: 0 },
                { x: -storeWidth/2 + 3, z: -2 },
                { x: 0, z: -2 },
                { x: storeWidth/2 - 3, z: -2 }
            ];
            circularRackPositions.forEach(({ x, z }) => {
                const rack = createCircularRack(x, z);
                interiorGroup.add(rack);
            });
            
            // Wall-mounted racks along side walls
            for (let i = 0; i < 5; i++) {
                const leftRack = createWallRack(-storeWidth/2 + 0.2, -storeDepth/2 + 2 + i * 2.5, 0);
                interiorGroup.add(leftRack);
                
                const rightRack = createWallRack(storeWidth/2 - 0.2, -storeDepth/2 + 2 + i * 2.5, Math.PI);
                interiorGroup.add(rightRack);
            }
            
            // Mannequins near entrance and display areas
            const mannequinPositions = [
                { x: -storeWidth/2 + 2, z: storeDepth/2 - 2 },
                { x: storeWidth/2 - 2, z: storeDepth/2 - 2 },
                { x: -storeWidth/2 + 2, z: 0 },
                { x: storeWidth/2 - 2, z: 0 }
            ];
            mannequinPositions.forEach(({ x, z }) => {
                const mannequin = createMannequin(x, z);
                interiorGroup.add(mannequin);
            });
            
            // Shelving units for folded clothes
            const shelvingPositions = [
                { x: -storeWidth/2 + 1.5, z: -storeDepth/2 + 1, width: 2 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 1, width: 2 },
                { x: -storeWidth/2 + 1.5, z: storeDepth/2 - 1, width: 2 },
                { x: storeWidth/2 - 1.5, z: storeDepth/2 - 1, width: 2 }
            ];
            shelvingPositions.forEach(({ x, z, width }) => {
                const shelf = createShelvingUnit(x, z, width);
                interiorGroup.add(shelf);
            });
            
            // Display tables in center and near checkout
            const displayTablePositions = [
                { x: -3, z: 2, width: 2.5 },
                { x: 3, z: 2, width: 2.5 },
                { x: -3, z: -2, width: 2.5 },
                { x: 3, z: -2, width: 2.5 }
            ];
            displayTablePositions.forEach(({ x, z, width }) => {
                const table = createDisplayTable(x, z, width);
                interiorGroup.add(table);
            });
            
            // Large mirror area near fitting rooms
            const mirrorGeometry = new THREE.PlaneGeometry(4, 2.5);
            const mirrorMaterial = warmGlow(0xCCCCCC);
            const mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
            mirror.position.set(storeWidth/2 - 1, 1.5, -storeDepth/2 + 2);
            mirror.rotation.y = Math.PI;
            interiorGroup.add(mirror);
            
            // Fitting rooms (improved design)
            const fittingRoomGeometry = new THREE.BoxGeometry(2, 2.5, 2);
            const fittingRoomMaterial = warmGlow(0xE0E0E0);
            for (let i = 0; i < 2; i++) {
                const fittingRoom = new THREE.Mesh(fittingRoomGeometry, fittingRoomMaterial);
                fittingRoom.position.set(storeWidth/2 - 1.5, 1.25, -storeDepth/2 + 5 + i * 3);
                interiorGroup.add(fittingRoom);
            }
            
            // Cash register counter (moved away from door, positioned more centrally)
            const cashRegisterCounterGeometry = new THREE.BoxGeometry(5, 1.2, 2);
            const cashRegisterCounterMaterial = warmGlow(0xF5F5DC);
            const cashRegisterCounter = new THREE.Mesh(cashRegisterCounterGeometry, cashRegisterCounterMaterial);
            cashRegisterCounter.position.set(0, 0.6, -storeDepth/2 + 4);
            interiorGroup.add(cashRegisterCounter);
            
            // Cash register on counter
            const cashRegisterGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.6);
            const cashRegisterMaterial = warmGlow(0x333333);
            const cashRegister = new THREE.Mesh(cashRegisterGeometry, cashRegisterMaterial);
            cashRegister.position.set(1.5, 1.4, -storeDepth/2 + 4);
            interiorGroup.add(cashRegister);
            break;
            
        case 'drycleaner': // Dry Cleaners - Fun, sublime, off-kilter
            // Front counter
            const dryCleanerCounterGeometry = new THREE.BoxGeometry(8, 1.2, 1.5);
            const dryCleanerCounterMaterial = warmGlow(0x4682B4);
            const dryCleanerCounter = new THREE.Mesh(dryCleanerCounterGeometry, dryCleanerCounterMaterial);
            dryCleanerCounter.position.set(0, 0.6, storeDepth/2 - 8);
            assignFlavor(dryCleanerCounter, 'DRYCLEANER_COUNTER');
            interiorGroup.add(dryCleanerCounter);
            
            const laundryColors = [0xFFFFFF, 0xE6E6FA, 0xF0F8FF, 0xFFF8DC, 0xF5F5DC, 0xFFE4E1, 0xF0E68C, 0xFFB6C1, 0xE0E0E0, 0xD3D3D3];
            const offKilterColors = [0xFF1493, 0x00CED1, 0xFFD700, 0x9370DB, 0xFF4500, 0x32CD32]; // Hawaiian, formal, weird
            
            // Create single clothing item - expanded variety including oddball items
            const createClothingItem = (pileTheme = 'mixed') => {
                const palette = pileTheme === 'weird' ? offKilterColors : laundryColors;
                const color = palette[Math.floor(Math.random() * palette.length)];
                const material = warmGlow(color, 0.2 + Math.random() * 0.25);
                const itemType = Math.random();
                let item, itemHeight;
                
                if (pileTheme === 'sockMystery') {
                    // The eternal mystery: 1 red sock, many white
                    const isTheRedOne = Math.random() < 0.02;
                    const sockMat = warmGlow(isTheRedOne ? 0xDC143C : 0xF5F5F5, 0.3);
                    const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.2 + Math.random() * 0.1, 8), sockMat);
                    sock.rotation.x = Math.PI / 2;
                    item = new THREE.Group(); item.add(sock);
                    itemHeight = 0.15;
                } else if (pileTheme === 'formalChaos' && itemType < 0.5) {
                    // Bow tie or ascot
                    const formalItem = new THREE.Mesh(new THREE.BoxGeometry(0.15 + Math.random() * 0.1, 0.08, 0.2, 1, 1, 1), material);
                    item = new THREE.Group(); item.add(formalItem);
                    itemHeight = 0.08;
                } else if (pileTheme === 'formalChaos' && itemType < 0.8) {
                    // Top hat perched
                    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 16), warmGlow(0x1a1a1a));
                    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.25, 16), warmGlow(0x1a1a1a));
                    crown.position.y = 0.15;
                    item = new THREE.Group(); item.add(brim); item.add(crown);
                    itemHeight = 0.3;
                } else if (pileTheme === 'weddingSpill' && itemType < 0.6) {
                    // Wedding train / flowing fabric
                    const train = new THREE.Mesh(new THREE.BoxGeometry(0.8 + Math.random() * 0.4, 0.04, 0.5, 2, 1, 3), warmGlow(0xFFFAFA));
                    item = new THREE.Group(); item.add(train);
                    itemHeight = 0.08;
                } else if (itemType < 0.35) {
                    const shirtGroup = new THREE.Group();
                    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6 + Math.random() * 0.2, 0.1, 0.4 + Math.random() * 0.2), material);
                    shirtGroup.add(body);
                    const sleeve1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.15), material);
                    sleeve1.position.set(0.3, 0, 0); shirtGroup.add(sleeve1);
                    const sleeve2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.15), material);
                    sleeve2.position.set(-0.3, 0, 0); shirtGroup.add(sleeve2);
                    item = shirtGroup; itemHeight = 0.1;
                } else if (itemType < 0.6) {
                    const pantsGroup = new THREE.Group();
                    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4 + Math.random() * 0.2, 8), material);
                    leg1.position.set(0.15, 0.2, 0); leg1.rotation.z = Math.PI / 2; pantsGroup.add(leg1);
                    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4 + Math.random() * 0.2, 8), material);
                    leg2.position.set(-0.15, 0.2, 0); leg2.rotation.z = Math.PI / 2; pantsGroup.add(leg2);
                    const waist = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.1), material);
                    waist.position.y = 0.4; pantsGroup.add(waist);
                    item = pantsGroup; itemHeight = 0.5;
                } else if (itemType < 0.82) {
                    const sockGroup = new THREE.Group();
                    const sockCount = Math.random() > 0.6 ? 2 : 1;
                    for (let s = 0; s < sockCount; s++) {
                        const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.2 + Math.random() * 0.1, 8), material);
                        sock.position.set((s - 0.5) * 0.15, 0.1, 0); sock.rotation.x = Math.PI / 2; sockGroup.add(sock);
                    }
                    item = sockGroup; itemHeight = 0.2;
                } else if (itemType < 0.92) {
                    const towelGroup = new THREE.Group();
                    const towelBody = new THREE.Mesh(new THREE.BoxGeometry(0.5 + Math.random() * 0.3, 0.08, 0.4 + Math.random() * 0.2), material);
                    towelGroup.add(towelBody);
                    for (let f = 0; f < 2; f++) {
                        const fold = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.3), material);
                        fold.position.set((Math.random() - 0.5) * 0.4, 0.05, (Math.random() - 0.5) * 0.2);
                        fold.rotation.z = (Math.random() - 0.5) * 0.3; towelGroup.add(fold);
                    }
                    item = towelGroup; itemHeight = 0.1;
                } else {
                    // Oddball: single glove, scarf loop, or mystery garment
                    const oddType = Math.random();
                    if (oddType < 0.33) {
                        const glove = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.12), material);
                        item = new THREE.Group(); item.add(glove); itemHeight = 0.1;
                    } else if (oddType < 0.66) {
                        const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 16), material);
                        item = new THREE.Group(); item.add(scarf); itemHeight = 0.2;
                    } else {
                        const mystery = new THREE.Mesh(new THREE.BoxGeometry(0.25 + Math.random() * 0.2, 0.06, 0.35), warmGlow(0x2F2F2F));
                        item = new THREE.Group(); item.add(mystery); itemHeight = 0.08;
                    }
                }
                return { item, itemHeight };
            };
            
            const createLaundryPile = (x, z, size = 'medium', theme = 'mixed', tilt = 0) => {
                const pileGroup = new THREE.Group();
                const itemCount = size === 'small' ? 12 : size === 'large' ? 28 : 20;
                const pileRadius = size === 'small' ? 0.55 : size === 'large' ? 1.0 : 0.75;
                let currentHeight = 0;
                
                for (let i = 0; i < itemCount; i++) {
                    const { item, itemHeight } = createClothingItem(theme);
                    const heightRatio = currentHeight / (itemCount * 0.12);
                    const maxR = pileRadius; const minR = pileRadius * 0.35;
                    const currentRadius = maxR - (maxR - minR) * Math.min(heightRatio, 1);
                    const radius = currentRadius * Math.sqrt(Math.random());
                    const angle = Math.random() * Math.PI * 2;
                    const itemX = Math.cos(angle) * radius;
                    const itemZ = Math.sin(angle) * radius;
                    
                    item.rotation.x = (Math.random() - 0.5) * 0.9 + tilt * 0.3;
                    item.rotation.y = Math.random() * Math.PI * 2;
                    item.rotation.z = (Math.random() - 0.5) * 0.9;
                    
                    item.position.set(itemX, currentHeight + itemHeight / 2, itemZ);
                    pileGroup.add(item);
                    currentHeight += itemHeight * (0.05 + Math.random() * 0.18);
                }
                
                pileGroup.position.set(x, 0.1, z);
                pileGroup.rotation.y = Math.random() * Math.PI * 2;
                pileGroup.rotation.x = tilt * 0.15; // Slight sublime tilt for some piles
                return pileGroup;
            };
            
            // Scatter laundry piles - mix of themes and one impossibly tall pile
            const laundryPilePositions = [
                { x: -6, z: 10, size: 'medium', theme: 'mixed' },
                { x: -3, z: 12, size: 'large', theme: 'sockMystery' },
                { x: 3, z: 10, size: 'small', theme: 'formalChaos' },
                { x: 6, z: 12, size: 'medium', theme: 'weddingSpill' },
                { x: -8, z: 0, size: 'large', theme: 'weird' },
                { x: -4, z: -2, size: 'small', theme: 'mixed', tilt: 1 },
                { x: 0, z: 2, size: 'medium', theme: 'formalChaos' },
                { x: 4, z: -1, size: 'medium', theme: 'mixed' },
                { x: 8, z: 1, size: 'small', theme: 'mixed', tilt: 0.5 },
                { x: -10, z: -15, size: 'medium', theme: 'weddingSpill' },
                { x: -5, z: -18, size: 'large', theme: 'sockMystery' },
                { x: 0, z: -16, size: 'medium', theme: 'weird' },
                { x: 5, z: -19, size: 'small', theme: 'formalChaos', tilt: 1 },
                { x: 10, z: -17, size: 'medium', theme: 'mixed' },
                { x: -18, z: 5, size: 'medium', theme: 'mixed' },
                { x: -20, z: -5, size: 'small', theme: 'sockMystery' },
                { x: 18, z: 3, size: 'large', theme: 'weird' },
                { x: 20, z: -8, size: 'medium', theme: 'weddingSpill' }
            ];
            
            laundryPilePositions.forEach(({ x, z, size, theme = 'mixed', tilt = 0 }) => {
                interiorGroup.add(createLaundryPile(x, z, size, theme, tilt));
            });
            
            // Impossibly tall "sublime" pile - narrow and precarious
            const sublimePile = new THREE.Group();
            const sublimeColors = [0xF0E68C, 0xFFE4E1, 0xE6E6FA];
            for (let i = 0; i < 22; i++) {
                const { item, itemHeight } = createClothingItem('mixed');
                const shrink = 1 - i * 0.03;
                item.scale.set(shrink, shrink, shrink);
                item.position.set((Math.random() - 0.5) * 0.25, i * 0.08, (Math.random() - 0.5) * 0.25);
                item.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.5);
                sublimePile.add(item);
            }
            sublimePile.position.set(-12, 0.1, -8);
            sublimePile.rotation.y = 0.7;
            interiorGroup.add(sublimePile);
            
            // =====================================================
            // CONVEYOR BELTS - Industrial flow of garments
            // =====================================================
            const createConveyorBelt = (startX, startZ, length, orientation = 'z', speed = 0.4) => {
                const beltGroup = new THREE.Group();
                beltGroup.userData.isConveyorBelt = true;
                beltGroup.userData.speed = speed;
                beltGroup.userData.orientation = orientation;
                beltGroup.userData.length = length;
                beltGroup.userData.keepPosition = true;
                
                const beltWidth = orientation === 'z' ? 2.5 : 2.5;
                const beltDepth = orientation === 'z' ? length : 2.5;
                const frameDepth = orientation === 'z' ? length : 2.5;
                
                const beltMat = warmGlow(0x404040, 0.9);
                const belt = new THREE.Mesh(
                    new THREE.BoxGeometry(orientation === 'z' ? beltWidth : length, 0.15, orientation === 'z' ? length : beltDepth),
                    beltMat
                );
                belt.position.y = 0.5;
                beltGroup.add(belt);
                
                // Rollers at ends
                const rollerMat = warmGlow(0x606060, 0.95);
                const rollerRadius = 0.12;
                const rollerLength = orientation === 'z' ? beltWidth + 0.2 : length + 0.2;
                const rollerGeo = new THREE.CylinderGeometry(rollerRadius, rollerRadius, rollerLength, 12);
                const roller1 = new THREE.Mesh(rollerGeo, rollerMat);
                const roller2 = new THREE.Mesh(rollerGeo, rollerMat);
                roller1.position.set(0, 0.6, orientation === 'z' ? -length/2 : 0);
                roller2.position.set(0, 0.6, orientation === 'z' ? length/2 : 0);
                roller1.rotation.z = Math.PI / 2;
                roller2.rotation.z = Math.PI / 2;
                if (orientation === 'x') {
                    roller1.position.x = -length/2; roller2.position.x = length/2;
                    roller1.rotation.y = Math.PI / 2; roller2.rotation.y = Math.PI / 2;
                }
                beltGroup.add(roller1); beltGroup.add(roller2);
                
                // Items on belt - garment bags, folded shirts, etc.
                const itemCount = 4 + Math.floor(Math.random() * 3);
                for (let i = 0; i < itemCount; i++) {
                    const t = (i / itemCount) * 0.7 + Math.random() * 0.15;
                    const itemType = Math.random();
                    let item;
                    if (itemType < 0.5) {
                        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.15), warmGlow(0xE8E8E8, 0.8));
                        item = bag;
                    } else if (itemType < 0.8) {
                        const { item: shirt } = createClothingItem('mixed');
                        item = shirt; item.scale.set(0.5, 0.5, 0.5);
                    } else {
                        const suit = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.2), warmGlow(laundryColors[Math.floor(Math.random() * laundryColors.length)], 0.7));
                        item = suit;
                    }
                    const offset = (t - 0.5) * (length - 1);
                    item.position.set(orientation === 'z' ? (Math.random() - 0.5) * 1.5 : offset, 0.75, orientation === 'z' ? offset : (Math.random() - 0.5) * 1.5);
                    item.rotation.y = Math.random() * Math.PI * 2;
                    item.userData.beltOffset = t;
                    beltGroup.add(item);
                }
                
                beltGroup.position.set(startX, 0, startZ);
                if (orientation === 'x') beltGroup.rotation.y = Math.PI / 2;
                return beltGroup;
            };
            
            const conveyor1 = createConveyorBelt(-storeWidth/2 + 4, -storeDepth/2 + 6, 8, 'z', 0.5);
            assignFlavor(conveyor1, 'GARMENT_CONVEYOR');
            interiorGroup.add(conveyor1);
            
            const conveyor2 = createConveyorBelt(storeWidth/2 - 5, -storeDepth/2 + 12, 6, 'z', 0.35);
            interiorGroup.add(conveyor2);
            
            const conveyor3 = createConveyorBelt(-5, -storeDepth/2 + 18, 6, 'x', 0.45);
            interiorGroup.add(conveyor3);
            
            if (!scene.userData.conveyorBelts) scene.userData.conveyorBelts = [];
            scene.userData.conveyorBelts.push(conveyor1, conveyor2, conveyor3);
            
            // Garment bags on rolling rack
            const garmentRack = new THREE.Group();
            garmentRack.position.set(-storeWidth/2 + 3, 0, storeDepth/2 - 15);
            const garmentRackFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 2.5), warmGlow(0x696969));
            garmentRackFrame.position.y = 0.9;
            garmentRack.add(garmentRackFrame);
            for (let g = 0; g < 6; g++) {
                const bag = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.08), warmGlow(0xE8E8E8, 0.85));
                bag.position.set((g % 3 - 1) * 0.7, 0.3 + Math.floor(g / 3) * 0.9, (g % 3 - 1) * 0.1);
                bag.rotation.y = (Math.random() - 0.5) * 0.3;
                garmentRack.add(bag);
            }
            interiorGroup.add(garmentRack);
            
            // Lost & Found bin - off-kilter oddities
            const lostAndFoundBin = new THREE.Group();
            lostAndFoundBin.position.set(storeWidth/2 - 4, 0, 5);
            const binBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.8), warmGlow(0x8B4513, 0.8));
            binBox.position.y = 0.3;
            lostAndFoundBin.add(binBox);
            const singleShoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.25), warmGlow(0x2F2F2F));
            singleShoe.position.set(0.2, 0.45, 0); singleShoe.rotation.x = 0.2;
            lostAndFoundBin.add(singleShoe);
            const monocle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 16), warmGlow(0xC0C0C0));
            monocle.position.set(-0.15, 0.5, 0.1);
            lostAndFoundBin.add(monocle);
            const mysteryTag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.08), warmGlow(0xFFF8DC));
            mysteryTag.position.set(0, 0.55, -0.15);
            lostAndFoundBin.add(mysteryTag);
            assignFlavor(lostAndFoundBin, 'LOST_AND_FOUND');
            interiorGroup.add(lostAndFoundBin);
            
            // =====================================================
            // ROTATING HANGER SYSTEM - Back of shop
            // =====================================================
            const rotatingHangerSystem = new THREE.Group();
            rotatingHangerSystem.position.set(0, 0, -storeDepth/2 + 14);
            rotatingHangerSystem.userData.isRotatingHangerSystem = true;
            rotatingHangerSystem.userData.rotationSpeed = 0.9; // Slow rotation
            rotatingHangerSystem.userData.keepPosition = true;
            
            // Central pole
            const centralPoleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 12);
            const centralPoleMaterial = warmGlow(0x696969, 0.9);
            const centralPole = new THREE.Mesh(centralPoleGeometry, centralPoleMaterial);
            centralPole.position.y = 4;
            rotatingHangerSystem.add(centralPole);
            
            // Rotating arms (4 arms extending from center)
            const armCount = 4;
            const armLength = 12;
            const armGeometry = new THREE.BoxGeometry(0.1, 0.1, armLength);
            const armMaterial = warmGlow(0x808080, 0.8);
            
            for (let i = 0; i < armCount; i++) {
                const angle = (i / armCount) * Math.PI * 2;
                const arm = new THREE.Mesh(armGeometry, armMaterial);
                arm.position.set(
                    Math.cos(angle) * armLength / 2,
                    4,
                    Math.sin(angle) * armLength / 2
                );
                arm.rotation.y = angle + Math.PI / 2;
                rotatingHangerSystem.add(arm);
                
                // Hangers along each arm
                const hangersPerArm = 8;
                for (let j = 0; j < hangersPerArm; j++) {
                    const hangerOffset = -armLength / 2 + 1 + (j * (armLength - 2) / (hangersPerArm - 1));
                    
                    // Hanger hook
                    const hookGeometry = new THREE.TorusGeometry(0.15, 0.05, 8, 16);
                    const hookMaterial = warmGlow(0xC0C0C0, 0.9);
                    const hook = new THREE.Mesh(hookGeometry, hookMaterial);
                    hook.position.set(
                        Math.cos(angle) * hangerOffset,
                        4.2,
                        Math.sin(angle) * hangerOffset
                    );
                    hook.rotation.x = Math.PI / 2;
                    rotatingHangerSystem.add(hook);
                    
                    // Hanger body (triangle shape)
                    const hangerBodyGeometry = new THREE.ConeGeometry(0.2, 0.4, 3);
                    const hangerBodyMaterial = warmGlow(0xD3D3D3, 0.8);
                    const hangerBody = new THREE.Mesh(hangerBodyGeometry, hangerBodyMaterial);
                    hangerBody.position.set(
                        Math.cos(angle) * hangerOffset,
                        3.8,
                        Math.sin(angle) * hangerOffset
                    );
                    hangerBody.rotation.z = Math.PI;
                    rotatingHangerSystem.add(hangerBody);
                    
                    // Garment on hanger - mix of normal and off-kilter (wedding dress, neon tracksuit)
                    const isOdd = j === 2 || j === 5;
                    const garmentColor = isOdd
                        ? (j === 2 ? 0xFFFAFA : 0x00FF88)
                        : laundryColors[Math.floor(Math.random() * laundryColors.length)];
                    const garmentMaterial = warmGlow(garmentColor, 0.7);
                    const garmentScale = isOdd ? (j === 2 ? 1.3 : 0.9) : 1;
                    const garmentGeometry = new THREE.BoxGeometry(0.6 * garmentScale, 1.2 * garmentScale, 0.1);
                    const garment = new THREE.Mesh(garmentGeometry, garmentMaterial);
                    garment.position.set(
                        Math.cos(angle) * hangerOffset,
                        3.2,
                        Math.sin(angle) * hangerOffset
                    );
                    garment.rotation.y = angle + Math.PI / 2;
                    rotatingHangerSystem.add(garment);
                }
            }
            
            // Base platform
            const platformGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16);
            const platformMaterial = warmGlow(0x555555, 0.9);
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.y = 0.1;
            rotatingHangerSystem.add(platform);
            
            interiorGroup.add(rotatingHangerSystem);
            
            // Store reference for animation
            if (!scene.userData) {
                scene.userData = {};
            }
            if (!scene.userData.rotatingHangerSystems) {
                scene.userData.rotatingHangerSystems = [];
            }
            scene.userData.rotatingHangerSystems.push(rotatingHangerSystem);
            
            // Cleaning machines along side wall
            const machineGeometry = new THREE.BoxGeometry(2, 2, 2);
            const machineMaterial = warmGlow(0x708090);
            for (let i = 0; i < 4; i++) {
                const machine = new THREE.Mesh(machineGeometry, machineMaterial);
                machine.position.set(storeWidth/2 - 1.5, 1, -storeDepth/2 + 5 + i * 10);
                interiorGroup.add(machine);
            }
            
            // Pressing table
            const pressingTableGeometry = new THREE.BoxGeometry(3, 1.2, 2);
            const pressingTableMaterial = warmGlow(0xFFFFFF);
            const pressingTable = new THREE.Mesh(pressingTableGeometry, pressingTableMaterial);
            pressingTable.position.set(-storeWidth/2 + 2, 0.6, -storeDepth/2 + 8);
            pressingTable.userData.isInteractive = true;
            
            // Plastic wrap dispenser - slightly absurd
            const wrapDispenser = new THREE.Group();
            wrapDispenser.position.set(-storeWidth/2 + 3.5, 0.8, -storeDepth/2 + 7);
            const dispenserBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.3), warmGlow(0x708090));
            dispenserBase.position.y = 0.25;
            wrapDispenser.add(dispenserBase);
            const wrapRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12), warmGlow(0xE8E8E8, 0.9));
            wrapRoll.rotation.z = Math.PI / 2;
            wrapRoll.position.set(0.15, 0.6, 0);
            wrapDispenser.add(wrapRoll);
            const danglingWrap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.8, 0.3), warmGlow(0xF5F5F5, 0.6));
            danglingWrap.position.set(0.35, 0.2, 0);
            wrapDispenser.add(danglingWrap);
            interiorGroup.add(wrapDispenser);
            assignFlavor(pressingTable, 'PRESSING_TABLE');
            interiorGroup.add(pressingTable);
            break;
            
        case 'coffee': // Donut Galaxy
            // Coffee counter/barista area - moved forward from back wall
            const coffeeCounterGeometry = new THREE.BoxGeometry(10, 1.2, 2);
            const coffeeCounterMaterial = warmGlow(0xFF4500); // Donut Galaxy signature orange
            const coffeeCounter = new THREE.Mesh(coffeeCounterGeometry, coffeeCounterMaterial);
            coffeeCounter.position.set(0, 0.6, -storeDepth/2 + 10);
            assignFlavor(coffeeCounter, 'DONUT_COUNTER');
            interiorGroup.add(coffeeCounter);
            
            // Coffee machines on counter
            const coffeeMachineGeometry = new THREE.BoxGeometry(1.5, 1.5, 1);
            const coffeeMachineMaterial = warmGlow(0x000000);
            for (let i = 0; i < 2; i++) {
                const coffeeMachine = new THREE.Mesh(coffeeMachineGeometry, coffeeMachineMaterial);
                coffeeMachine.position.set(-3 + i * 6, 1.35, -storeDepth/2 + 10);
                assignFlavor(coffeeMachine, 'DONUT_ESPRESSO');
                interiorGroup.add(coffeeMachine);
            }
            
            // Display case for donuts - moved forward with counter
            const donutCaseGeometry = new THREE.BoxGeometry(6, 1.5, 1);
            const donutCaseMaterial = warmGlow(0xFFFFFF);
            const donutCase = new THREE.Mesh(donutCaseGeometry, donutCaseMaterial);
            donutCase.position.set(0, 0.75, -storeDepth/2 + 10);
            assignFlavor(donutCase, 'DONUT_CASE');
            interiorGroup.add(donutCase);

            // Countertop details - moved forward with counter
            const registerGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.8);
            const registerMaterial = warmGlow(0x2F2F2F, 0.9);
            const register = new THREE.Mesh(registerGeometry, registerMaterial);
            register.position.set(-1.6, 1.0, -storeDepth/2 + 9.7);
            assignFlavor(register, 'DONUT_REGISTER');
            interiorGroup.add(register);

            const registerScreenGeometry = new THREE.PlaneGeometry(0.7, 0.45);
            const registerScreen = new THREE.Mesh(registerScreenGeometry, warmGlow(0x66FFCC, 0.7));
            registerScreen.position.set(-1.6, 1.15, -storeDepth/2 + 9.31);
            registerScreen.rotation.x = -Math.PI / 8;
            interiorGroup.add(registerScreen);

            const tipJarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.55, 10);
            const tipJarMaterial = warmGlow(0x7FFFD4, 0.3);
            const tipJar = new THREE.Mesh(tipJarGeometry, tipJarMaterial);
            tipJar.position.set(-0.5, 0.95, -storeDepth/2 + 9.7);
            assignFlavor(tipJar, 'DONUT_TIP_JAR');
            interiorGroup.add(tipJar);

            const strawDispenserGeometry = new THREE.BoxGeometry(0.35, 0.45, 0.35);
            const strawDispenser = new THREE.Mesh(strawDispenserGeometry, warmGlow(0xFFA07A, 0.8));
            strawDispenser.position.set(1.8, 0.95, -storeDepth/2 + 9.7);
            assignFlavor(strawDispenser, 'DONUT_STRAW');
            interiorGroup.add(strawDispenser);

            const strawBundleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
            for (let s = 0; s < 5; s++) {
                const straw = new THREE.Mesh(strawBundleGeometry, warmGlow(0xFFFFFF, 0.9));
                straw.position.set(1.8 + (Math.random() - 0.5) * 0.25, 1.1 + Math.random() * 0.05, -storeDepth/2 + 9.7 + (Math.random() - 0.5) * 0.2);
                straw.rotation.x = (Math.random() - 0.5) * 0.4;
                interiorGroup.add(straw);
            }

            const cupStackGeometry = new THREE.CylinderGeometry(0.22, 0.2, 0.9, 12);
            const cupStackColors = [0xFFFFFF, 0xFFA500, 0xFF69B4];
            for (let c = 0; c < 3; c++) {
                const cupStackMaterial = warmGlow(cupStackColors[c], 0.8);
                const cupStack = new THREE.Mesh(cupStackGeometry, cupStackMaterial);
                cupStack.position.set(-2.6 + c * 0.9, 1.05, -storeDepth/2 + 9.7);
                cupStack.userData.isInteractive = true;
                cupStack.userData.name = "Cup Stack";
                cupStack.userData.flavorText = [
                    `A neat stack of ${cupStackColors[c] === 0xFFFFFF ? 'white' : cupStackColors[c] === 0xFFA500 ? 'orange' : 'pink'} coffee cups, ready to be filled with hot beverages. The cups are nested perfectly, showing the baristas' attention to organization.`,
                    "These cup stacks are positioned for easy access during the morning rush. Each stack represents a different size or style, allowing baristas to quickly grab the right cup for each order.",
                    "The cups glow softly with their respective colors, making them easy to identify even in a hurry. They're stacked high enough to be convenient but not so high that they'll topple over."
                ];
                interiorGroup.add(cupStack);
            }

            const syrupBottleGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12);
            const syrupColors = [0xFFB347, 0xD2691E, 0xFFD700];
            const syrupNames = ["Vanilla", "Caramel", "Hazelnut"];
            for (let b = 0; b < 3; b++) {
                const bottle = new THREE.Mesh(syrupBottleGeometry, warmGlow(syrupColors[b], 0.6));
                bottle.position.set(2.8 - b * 0.5, 1.0, -storeDepth/2 + 9.6);
                bottle.userData.isInteractive = true;
                bottle.userData.name = `${syrupNames[b]} Syrup`;
                bottle.userData.flavorText = [
                    `A bottle of ${syrupNames[b].toLowerCase()} flavored syrup sits on the counter. The ${syrupColors[b] === 0xFFB347 ? 'warm orange' : syrupColors[b] === 0xD2691E ? 'rich brown' : 'golden'} liquid inside catches the light, promising sweet flavor.`,
                    `Baristas use this ${syrupNames[b].toLowerCase()} syrup to customize drinks. A pump on top makes it easy to add just the right amount to each cup. The bottle is positioned within easy reach.`,
                    `The ${syrupNames[b].toLowerCase()} syrup is a popular choice for adding sweetness and flavor to coffee drinks. The bottle's label shows it's a professional-grade product, designed for coffee shops.`
                ];
                interiorGroup.add(bottle);
            }

            // Donut and baked goods rack at the back wall (behind cashier)
            const rackWidth = 12;
            const rackDepth = 1.5;
            const rackHeight = 4;
            
            // Rack frame
            const rackFrameGeometry = new THREE.BoxGeometry(rackWidth, rackHeight, rackDepth);
            const rackFrameMaterial = warmGlow(0x8B4513, 0.8); // Brown wood
            const rackFrame = new THREE.Mesh(rackFrameGeometry, rackFrameMaterial);
            rackFrame.position.set(0, rackHeight / 2, -storeDepth/2 + 1);
            assignFlavor(rackFrame, 'DONUT_RACK');
            interiorGroup.add(rackFrame);
            
            // Shelves inside rack
            const shelfGeometry = new THREE.BoxGeometry(rackWidth - 0.2, 0.1, rackDepth - 0.2);
            const shelfMaterial = warmGlow(0xD2691E, 0.9);
            for (let shelf = 0; shelf < 3; shelf++) {
                const shelfMesh = new THREE.Mesh(shelfGeometry, shelfMaterial);
                shelfMesh.position.set(0, 1 + shelf * 1.2, -storeDepth/2 + 1);
                interiorGroup.add(shelfMesh);
            }
            
            // Donuts on the rack
            const rackDonutGeometry = new THREE.TorusGeometry(0.4, 0.12, 12, 16);
            const rackDonutBaseColors = [0xF4A460, 0xEEC085, 0xD29062];
            const rackFrostingColors = [0xFFC0CB, 0xFFF8DC, 0xFF8C69, 0xE6E6FA, 0xFFB347];
            
            for (let shelf = 0; shelf < 3; shelf++) {
                const donutsPerShelf = 8;
                const shelfY = 1 + shelf * 1.2;
                for (let d = 0; d < donutsPerShelf; d++) {
                    const donutX = -rackWidth/2 + 0.8 + (d * (rackWidth - 1.6) / (donutsPerShelf - 1));
                    const donutZ = -storeDepth/2 + 0.5 + Math.random() * 0.5;
                    
                    // Base donut
                    const donutMaterial = warmGlow(rackDonutBaseColors[Math.floor(Math.random() * rackDonutBaseColors.length)]);
                    const donut = new THREE.Mesh(rackDonutGeometry, donutMaterial);
                    donut.rotation.x = Math.PI / 2;
                    donut.position.set(donutX, shelfY, donutZ);
                    interiorGroup.add(donut);
                    
                    // Frosting
                    const rackFrostingGeometry = new THREE.TorusGeometry(0.2, 0.12, 12, 16);
                    const frostingMaterial = warmGlow(rackFrostingColors[Math.floor(Math.random() * rackFrostingColors.length)], 0.9);
                    const frosting = new THREE.Mesh(rackFrostingGeometry, frostingMaterial);
                    frosting.rotation.x = Math.PI / 2;
                    frosting.position.set(donutX, shelfY + 0.05, donutZ);
                    interiorGroup.add(frosting);
                }
            }
            
            // Baked goods (muffins, croissants) on top shelf
            const muffinGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.4, 12);
            const croissantGeometry = new THREE.TorusKnotGeometry(0.3, 0.1, 32, 8);
            
            for (let b = 0; b < 6; b++) {
                const bakedX = -rackWidth/2 + 1 + (b * (rackWidth - 2) / 5);
                const bakedZ = -storeDepth/2 + 0.5 + Math.random() * 0.5;
                const topShelfY = 1 + 2 * 1.2;
                
                if (Math.random() > 0.5) {
                    // Muffin
                    const muffinMaterial = warmGlow(0xD2691E, 0.9);
                    const muffin = new THREE.Mesh(muffinGeometry, muffinMaterial);
                    muffin.position.set(bakedX, topShelfY + 0.2, bakedZ);
                    interiorGroup.add(muffin);
                } else {
                    // Croissant
                    const croissantMaterial = warmGlow(0xFFD700, 0.9);
                    const croissant = new THREE.Mesh(croissantGeometry, croissantMaterial);
                    croissant.rotation.x = Math.PI / 2;
                    croissant.position.set(bakedX, topShelfY + 0.15, bakedZ);
                    interiorGroup.add(croissant);
                }
            }

            // Menu board and signage
            const menuBoardGeometry = new THREE.BoxGeometry(10, 5.2, 0.2, 3, 4, 3);
            const menuBoard = new THREE.Mesh(menuBoardGeometry, warmGlow(0x1E1E1E, 0.8));
            menuBoard.position.set(0, 6.9, -storeDepth/2 + 0.2);
            assignFlavor(menuBoard, 'DONUT_MENU');
            interiorGroup.add(menuBoard);

            const menuLineGeometry = new THREE.BoxGeometry(9.6, 0.05, 0.04);
            for (let line = 0; line < 14; line++) {
                const menuLine = new THREE.Mesh(menuLineGeometry, warmGlow(0xDF9327, 0.4));
                menuLine.position.set(0, 8.45 + 0.7 - line * 0.35, -storeDepth/2 + 0.25);
                interiorGroup.add(menuLine);
            }

            // Menu text - coffee shop items in white
            const textMaterial = warmGlow(0xFFFFFF, 0.95);
            
            // Helper function to create text-like rectangular shapes (multiple boxes per item to simulate letters)
            const createMenuItem = (x, y, letterCount = 8) => {
                const letterWidth = 0.12;
                const letterSpacing = 0.15;
                const startX = x - (letterCount * letterSpacing) / 2;
                
                for (let i = 0; i < letterCount; i++) {
                    const letter = new THREE.Mesh(
                        new THREE.BoxGeometry(letterWidth, 0.15, 0.02, 1, 1, 1),
                        textMaterial
                    );
                    letter.position.set(startX + i * letterSpacing, y, -storeDepth/2 + 0.22);
                    interiorGroup.add(letter);
                }
            };
            
            // Coffee drinks - left column (letterCount approximates word length)
            createMenuItem(-3.5, 9.0, 10); // CAPPUCCINO
            createMenuItem(-3.5, 8.5, 5); // LATTE
            createMenuItem(-3.5, 8.0, 5); // MOCHA
            createMenuItem(-3.5, 7.5, 9); // AMERICANO
            createMenuItem(-3.5, 7.0, 9); // MACCHIATO
            createMenuItem(-3.5, 6.5, 11); // FRAPPUCCINO
            createMenuItem(-3.5, 6.0, 10); // ICED COFFEE
            createMenuItem(-3.5, 5.5, 8); // COLD BREW
            createMenuItem(-3.5, 5.0, 11); // MATCHA LATTE
            
            // Baked goods - right column
            createMenuItem(1.5, 9.0, 7); // MUFFINS
            createMenuItem(1.5, 8.5, 9); // CROISSANTS
            createMenuItem(1.5, 8.0, 6); // BAGELS
            createMenuItem(1.5, 7.5, 7); // COOKIES
            createMenuItem(1.5, 6.0, 6); // SCONES
            createMenuItem(1.5, 5.5, 8); // PASTRIES
            createMenuItem(1.5, 5.0, 10); // DONUTS
            
            // Prices - right side (multiple boxes to simulate price text)
            const createPrice = (x, y) => {
                // Create 4-5 boxes to simulate a price like "$3.50"
                const priceBoxWidth = 0.1;
                const priceSpacing = 0.12;
                const priceStartX = x - 0.2;
                
                for (let i = 0; i < 5; i++) {
                    const priceBox = new THREE.Mesh(
                        new THREE.BoxGeometry(priceBoxWidth, 0.12, 0.02, 1, 1, 1),
                        textMaterial
                    );
                    priceBox.position.set(priceStartX + i * priceSpacing, y, -storeDepth/2 + 0.22);
                    interiorGroup.add(priceBox);
                }
            };
            
            // Prices for coffee drinks
            createPrice(-1.2, 9.0);
            createPrice(-1.2, 8.5);
            createPrice(-1.2, 8.0);
            createPrice(-1.2, 7.5);
            createPrice(-1.2, 7.0);
            createPrice(-1.2, 6.5);
            createPrice(-1.2, 6.0);
            createPrice(-1.2, 5.5);
            createPrice(-1.2, 5.0);
            
            // Prices for baked goods
            createPrice(4.0, 9.0);
            createPrice(4.0, 8.5);
            createPrice(4.0, 8.0);
            createPrice(4.0, 7.5);
            createPrice(4.0, 6.0);
            createPrice(4.0, 5.5);
            createPrice(4.0, 5.0);

            // Floating donut circle feature
            const donutCircleGroup = new THREE.Group();
            donutCircleGroup.name = "Floating Donut Circle";
            donutCircleGroup.position.set(0, 0, 0);

            const donutGeometry = new THREE.TorusGeometry(0.7, 0.22, 10, 20);
            const frostingGeometry = new THREE.TorusGeometry(0.34, 0.22, 10, 20);
            const sprinkleGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.28);

            const donutBaseColors = [0xF4A460, 0xEEC085, 0xD29062];
            const frostingColors = [0xFFC0CB, 0xFFF8DC, 0xFF8C69, 0xE6E6FA];
            const sprinkleColors = [0xFF69B4, 0x87CEEB, 0x98FB98, 0xFFD700, 0xFFA500];

            const donutCount = 24;
            const baseRadius = 50; // Inner radius for galaxy-like distribution
            const maxRadius = 110; // Outer radius within 50x50 room
            const baseHeight = 8;
            const spiralTurns = 1.75; // Number of spiral turns
            const ringCount = 3;
            const ringSpinDirections = Array.from({ length: ringCount }, () => (Math.random() > 0.5 ? 1 : -1));
            const ringSpinAxes = ['y', 'x', 'z'];
            donutCircleGroup.userData.ringSpinDirections = ringSpinDirections;
            donutCircleGroup.userData.ringSpinAxes = ringSpinAxes;
            donutCircleGroup.userData.keepPosition = true;

            for (let i = 0; i < donutCount; i++) {
                const baseAngle = (i / donutCount) * Math.PI * 2;
                const radiusOffset = (Math.random() - 0.5) * 0.8;
                const heightOffset = (Math.random() - 0.5) * 0.4;
                const spiralProgress = i / donutCount;
                const spiralAngle = baseAngle + spiralTurns * Math.PI * 2 * spiralProgress;
                const radialRange = baseRadius + (maxRadius - baseRadius) * spiralProgress;
                const ringIndex = i % ringCount;
                const ringRadius = radialRange + radiusOffset;
                const ringHeight = baseHeight + ringIndex * 0.8 + heightOffset;

                const donutMaterial = warmGlow(donutBaseColors[Math.floor(Math.random() * donutBaseColors.length)]);
                const donut = new THREE.Mesh(donutGeometry, donutMaterial);
                donut.rotation.x = Math.PI / 2;

                const frostingMaterial = warmGlow(
                    frostingColors[Math.floor(Math.random() * frostingColors.length)],
                    0.85
                );
                const frosting = new THREE.Mesh(frostingGeometry, frostingMaterial);
                frosting.rotation.x = Math.PI / 2;
                frosting.position.y = 0.08;
                frosting.userData = {
                    frostingSpin: {
                        speed: (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.4),
                        axis: ['x', 'y'][Math.floor(Math.random() * 3)]
                    }
                };
                donut.add(frosting);

                const sprinkleCount = 6 + Math.floor(Math.random() * 4);
                for (let s = 0; s < sprinkleCount; s++) {
                    const sprinkleMaterial = warmGlow(
                        sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)],
                        0.9
                    );
                    const sprinkle = new THREE.Mesh(sprinkleGeometry, sprinkleMaterial);
                    sprinkle.position.set(
                        (Math.random() - 0.5) * 1.2,
                        0.1 + (Math.random() - 0.5) * 0.12,
                        (Math.random() - 0.5) * 1.2
                    );
                    sprinkle.rotation.set(
                        Math.random() * Math.PI,
                        Math.random() * Math.PI,
                        Math.random() * Math.PI
                    );
                    sprinkle.userData = {
                        sprinkleSpin: {
                            speed: (Math.random() > 0.5 ? 1 : -1) * (0.9 + Math.random() * 0.6),
                            axis: ['x', 'y', 'z'][Math.floor(Math.random() * 3)]
                        }
                    };
                    donut.add(sprinkle);
                }

                donut.userData.floatingDonut = {
                    orbitAngle: baseAngle,
                    radius: ringRadius,
                    height: ringHeight,
                    orbitSpeed: (Math.random() > 0.2 ? 1 : -1) * (0.01 + Math.random() * 0.1),
                    floatAmplitude: 0.1 + Math.random() * 0.08,
                    floatFrequency: 0.2 + Math.random() * 0.05,
                    floatPhase: Math.random() * Math.PI * 2,
                    spinSpeed: ringSpinDirections[ringIndex] * (0.55 + Math.random() * 0.55),
                    spinAxis: ringSpinAxes[ringIndex % ringSpinAxes.length],
                    ringIndex
                };

                donut.position.set(
                    Math.cos(spiralAngle) * ringRadius,
                    ringHeight,
                    Math.sin(spiralAngle) * ringRadius
                );

                donutCircleGroup.add(donut);
            }

            donutCircleGroup.userData.isFloatingDonutCircle = true;
            assignFlavor(donutCircleGroup, 'DONUT_FLOATING');
            interiorGroup.add(donutCircleGroup);

            if (!scene.userData) {
                scene.userData = {};
            }
            if (!scene.userData.floatingDonutGroups) {
                scene.userData.floatingDonutGroups = [];
            }
            scene.userData.floatingDonutGroups.push(donutCircleGroup);

            // =====================================================
            // SEATING AREA - Front of shop
            // =====================================================
            
            // Coffee shop tables and chairs
            const donutGalaxyTableGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 12);
            const donutGalaxyTableMaterial = warmGlow(0x8B4513, 0.9); // Brown wood
            const donutGalaxyChairGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.6);
            const donutGalaxyChairMaterial = warmGlow(0xFF8C00, 0.8); // Orange chairs
            const donutGalaxyChairBackGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.1);
            
            // Create table with chairs helper
            const createTableWithChairs = (x, z, rotation = 0) => {
                const tableGroup = new THREE.Group();
                
                // Table
                const table = new THREE.Mesh(donutGalaxyTableGeometry, donutGalaxyTableMaterial);
                table.position.y = 0.75;
                tableGroup.add(table);
                
                // Chairs around table (4 chairs)
                const chairPositions = [
                    { x: 0, z: 1.2, rot: 0 },      // North
                    { x: 0, z: -1.2, rot: Math.PI }, // South
                    { x: 1.2, z: 0, rot: -Math.PI / 2 }, // East
                    { x: -1.2, z: 0, rot: Math.PI / 2 }  // West
                ];
                
                chairPositions.forEach(({ x: cx, z: cz, rot }) => {
                    const chair = new THREE.Mesh(donutGalaxyChairGeometry, donutGalaxyChairMaterial);
                    chair.position.set(cx, 0.6, cz);
                    chair.rotation.y = rot;
                    tableGroup.add(chair);
                    
                    const back = new THREE.Mesh(donutGalaxyChairBackGeometry, donutGalaxyChairMaterial);
                    back.position.set(cx, 1.0, cz + (cz > 0 ? 0.3 : -0.3));
                    back.rotation.y = rot;
                    tableGroup.add(back);
                });
                
                tableGroup.position.set(x, 0, z);
                tableGroup.rotation.y = rotation;
                return tableGroup;
            };
            
            // Add tables in the front area (customer seating)
            const tablePositions = [
                { x: -8, z: 8, rot: 0 },
                { x: 0, z: 10, rot: 0 },
                { x: 8, z: 8, rot: 0 },
                { x: -8, z: 18, rot: 0 },
                { x: 0, z: 18, rot: 0 },
                { x: 8, z: 18, rot: 0 }
            ];
            
            tablePositions.forEach(({ x, z, rot }) => {
                const tableGroup = createTableWithChairs(x, z, rot);
                interiorGroup.add(tableGroup);
            });
            
            // Window seating along side walls
            const windowSeatGeometry = new THREE.BoxGeometry(8, 0.8, 1.5);
            const windowSeatMaterial = warmGlow(0xFF8C00, 0.7); // Orange bench
            const windowSeatCushionGeometry = new THREE.BoxGeometry(7.5, 0.2, 1.3);
            const windowSeatCushionMaterial = warmGlow(0xFF4500, 0.6); // Bright orange cushion
            
            // Left wall window seating
            for (let i = 0; i < 3; i++) {
                const seatZ = -storeDepth/2 + 5 + i * 8;
                const windowSeat = new THREE.Mesh(windowSeatGeometry, windowSeatMaterial);
                windowSeat.position.set(-storeWidth/2 + 0.75, 0.4, seatZ);
                interiorGroup.add(windowSeat);
                
                const cushion = new THREE.Mesh(windowSeatCushionGeometry, windowSeatCushionMaterial);
                cushion.position.set(-storeWidth/2 + 0.75, 0.8, seatZ);
                interiorGroup.add(cushion);
                
                // Small tables in front of window seats
                const windowTable = new THREE.Mesh(donutGalaxyTableGeometry, donutGalaxyTableMaterial);
                windowTable.scale.set(0.7, 1, 0.7);
                windowTable.position.set(-storeWidth/2 + 2.5, 0.75, seatZ);
                interiorGroup.add(windowTable);
            }
            
            // Right wall window seating
            for (let i = 0; i < 3; i++) {
                const seatZ = -storeDepth/2 + 5 + i * 8;
                const windowSeat = new THREE.Mesh(windowSeatGeometry, windowSeatMaterial);
                windowSeat.position.set(storeWidth/2 - 0.75, 0.4, seatZ);
                interiorGroup.add(windowSeat);
                
                const cushion = new THREE.Mesh(windowSeatCushionGeometry, windowSeatCushionMaterial);
                cushion.position.set(storeWidth/2 - 0.75, 0.8, seatZ);
                interiorGroup.add(cushion);
                
                // Small tables in front of window seats
                const windowTable = new THREE.Mesh(donutGalaxyTableGeometry, donutGalaxyTableMaterial);
                windowTable.scale.set(0.7, 1, 0.7);
                windowTable.position.set(storeWidth/2 - 2.5, 0.75, seatZ);
                interiorGroup.add(windowTable);
            }
            
            // =====================================================
            // CONDIMENT STATION - Between counter and seating
            // =====================================================
            const coffeeCondimentStationGeometry = new THREE.BoxGeometry(4, 1, 1.5);
            const coffeeCondimentStationMaterial = warmGlow(0xFFFFFF, 0.9);
            const coffeeCondimentStation = new THREE.Mesh(coffeeCondimentStationGeometry, coffeeCondimentStationMaterial);
            coffeeCondimentStation.position.set(0, 0.5, -storeDepth/2 + 15);
            assignFlavor(coffeeCondimentStation, 'DONUT_CONDIMENT');
            interiorGroup.add(coffeeCondimentStation);
            
            // Condiment containers
            const condimentContainerGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 12);
            const condimentPositions = [
                { x: -1.5, z: 0, color: 0xFFFFFF }, // Sugar
                { x: -0.5, z: 0, color: 0xFFF8DC }, // Creamer
                { x: 0.5, z: 0, color: 0xFFE4B5 }, // Half & half
                { x: 1.5, z: 0, color: 0xFFFFFF }  // More sugar
            ];
            
            condimentPositions.forEach(({ x, z, color }) => {
                const container = new THREE.Mesh(condimentContainerGeometry, warmGlow(color, 0.8));
                container.position.set(x, 1.0, -storeDepth/2 + 15 + z);
                interiorGroup.add(container);
            });
            
            // Napkin dispenser
            const napkinDispenserGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.3);
            const napkinDispenser = new THREE.Mesh(napkinDispenserGeometry, warmGlow(0xFFFFFF, 0.9));
            napkinDispenser.position.set(-2, 0.8, -storeDepth/2 + 15);
            interiorGroup.add(napkinDispenser);
            
            // =====================================================
            // TRASH AND RECYCLING BINS
            // =====================================================
            const trashBinGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
            const trashBinMaterial = warmGlow(0x2F2F2F, 0.8);
            const recyclingBinGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
            const recyclingBinMaterial = warmGlow(0x228B22, 0.8);
            
            const trashBin = new THREE.Mesh(trashBinGeometry, trashBinMaterial);
            trashBin.position.set(-storeWidth/2 + 3, 0.6, -storeDepth/2 + 15);
            assignFlavor(trashBin, 'DONUT_TRASH');
            interiorGroup.add(trashBin);
            
            const recyclingBin = new THREE.Mesh(recyclingBinGeometry, recyclingBinMaterial);
            recyclingBin.position.set(-storeWidth/2 + 4.5, 0.6, -storeDepth/2 + 15);
            assignFlavor(recyclingBin, 'DONUT_RECYCLING');
            interiorGroup.add(recyclingBin);
            
            // =====================================================
            // PLANTS AND DECORATIONS
            // =====================================================
            const coffeePlantPotGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.4, 12);
            const coffeePlantPotMaterial = warmGlow(0x8B4513, 0.8);
            const coffeePlantLeafGeometry = new THREE.ConeGeometry(0.25, 0.8, 8);
            const coffeePlantLeafMaterial = warmGlow(0x228B22, 0.7);
            
            // Plants on tables
            const plantPositions = [
                { x: -8, z: 8 },
                { x: 0, z: 10 },
                { x: 8, z: 8 }
            ];
            
            plantPositions.forEach(({ x, z }) => {
                const plantGroup = new THREE.Group();
                
                const pot = new THREE.Mesh(coffeePlantPotGeometry, coffeePlantPotMaterial);
                pot.position.y = 0.2;
                plantGroup.add(pot);
                
                // Leaves
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    const leaf = new THREE.Mesh(coffeePlantLeafGeometry, coffeePlantLeafMaterial);
                    leaf.position.set(Math.cos(angle) * 0.15, 0.5, Math.sin(angle) * 0.15);
                    leaf.rotation.z = (Math.random() - 0.5) * 0.3;
                    plantGroup.add(leaf);
                }
                
                plantGroup.position.set(x, 0.75, z);
                interiorGroup.add(plantGroup);
            });
            
            // Large decorative plant near entrance
            const largePlantPot = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.6, 0.6, 12),
                coffeePlantPotMaterial
            );
            largePlantPot.position.set(storeWidth/2 - 2, 0.3, storeDepth/2 - 3);
            interiorGroup.add(largePlantPot);
            
            const largePlantLeaves = new THREE.Mesh(
                new THREE.ConeGeometry(0.6, 1.5, 10),
                coffeePlantLeafMaterial
            );
            largePlantLeaves.position.set(storeWidth/2 - 2, 1.2, storeDepth/2 - 3);
            interiorGroup.add(largePlantLeaves);
            
            // =====================================================
            // WALL DECORATIONS
            // =====================================================
            // Artwork frames on walls
            const frameGeometry = new THREE.BoxGeometry(3, 2, 0.1);
            const frameMaterial = warmGlow(0x8B4513, 0.8);
            const artworkGeometry = new THREE.PlaneGeometry(2.7, 1.7);
            const artworkMaterial = warmGlow(0xFFD700, 0.6); // Golden artwork
            
            // Artwork on side walls
            const artworkPositions = [
                { x: -storeWidth/2 + 0.2, z: 5, rot: Math.PI / 2 },
                { x: -storeWidth/2 + 0.2, z: 15, rot: Math.PI / 2 },
                { x: storeWidth/2 - 0.2, z: 5, rot: -Math.PI / 2 },
                { x: storeWidth/2 - 0.2, z: 15, rot: -Math.PI / 2 }
            ];
            
            artworkPositions.forEach(({ x, z, rot }) => {
                const frame = new THREE.Mesh(frameGeometry, frameMaterial);
                frame.position.set(x, 3, z);
                frame.rotation.y = rot;
                interiorGroup.add(frame);
                
                const artwork = new THREE.Mesh(artworkGeometry, artworkMaterial);
                artwork.position.set(x, 3, z + (rot > 0 ? 0.06 : -0.06));
                artwork.rotation.y = rot;
                interiorGroup.add(artwork);
            });
            
            // Shelving units for pastries, beans, and merch
            const shelfUnitGeometry = new THREE.BoxGeometry(4, 3.2, 0.6);
            const shelfUnitMaterial = warmGlow(0x8B4513);
            const shelfDividerGeometry = new THREE.BoxGeometry(3.6, 0.12, 0.5);
            const pastryTrayGeometry = new THREE.BoxGeometry(3.5, 0.2, 0.45);
            const pastryColors = [0xF5DEB3, 0xFFE4B5, 0xFFDEAD, 0xFFF2CC];
            const coffeeBagGeometry = new THREE.BoxGeometry(0.6, 1, 0.4);
            const coffeeBagColors = [0x6B4226, 0x8B5A2B, 0xA0522D];
            const jarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12);
            const jarLidGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 12);
            const mugDisplayGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.35, 12);
            const mugHandleGeometry = new THREE.TorusGeometry(0.28, 0.05, 8, 16, Math.PI);
            const tumblerGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.6, 12);
            const merchBoxGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.5);
            const coffeeCanisterGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.5, 16);
            const shelfSignGeometry = new THREE.PlaneGeometry(2.8, 0.6);
            const shelfSignColors = [0xFF7F50, 0xFFD700, 0x87CEFA, 0x98FB98];
            
            const createShelfContents = (shelf, baseY, variantIndex = 0) => {
                const variant = variantIndex % 4;
                const levelSpacing = 1.05;
                
                for (let level = 0; level < 3; level++) {
                    const levelY = baseY + level * levelSpacing;
                    const divider = new THREE.Mesh(shelfDividerGeometry, warmGlow(0xB8860B, 0.6));
                    divider.position.set(0, levelY, 0);
                    shelf.add(divider);
                    
                    switch (variant) {
                        case 0: { // classic pastry trays
                            const tray = new THREE.Mesh(
                                pastryTrayGeometry,
                                warmGlow(pastryColors[Math.floor(Math.random() * pastryColors.length)], 0.7)
                            );
                            tray.position.set(0, levelY + 0.1, 0.1);
                            shelf.add(tray);
                            
                            for (let p = 0; p < 5; p++) {
                                const pastry = new THREE.Mesh(
                                    new THREE.BoxGeometry(0.5, 0.3, 0.4),
                                    warmGlow(pastryColors[(p + level) % pastryColors.length])
                                );
                                pastry.position.set(-1.5 + p * 0.75, levelY + 0.25, (Math.random() - 0.5) * 0.15);
                                shelf.add(pastry);
                            }
                            break;
                        }
                        case 1: { // coffee bean jars
                            for (let j = 0; j < 3; j++) {
                                const jar = new THREE.Mesh(jarGeometry, warmGlow(0x654321, 0.4));
                                jar.position.set(-1.2 + j * 1.2, levelY + 0.3, 0.05);
                                shelf.add(jar);
                                
                                const lid = new THREE.Mesh(jarLidGeometry, warmGlow(0xD2B48C, 0.8));
                                lid.position.set(-1.2 + j * 1.2, levelY + 0.63, 0.05);
                                shelf.add(lid);
                                
                                const scoop = new THREE.Mesh(
                                    new THREE.BoxGeometry(0.2, 0.05, 0.4),
                                    warmGlow(0xC0C0C0, 0.7)
                                );
                                scoop.position.set(-1.2 + j * 1.2, levelY + 0.7, 0.25);
                                scoop.rotation.x = Math.PI / 6;
                                shelf.add(scoop);
                            }
                            break;
                        }
                        case 2: { // branded mugs and tumblers
                            for (let m = 0; m < 4; m++) {
                                if (m % 2 === 0) {
                                    const mug = new THREE.Mesh(mugDisplayGeometry, warmGlow(0xFFFFFF, 0.8));
                                    mug.position.set(-1.4 + m * 0.9, levelY + 0.2, 0.05);
                                    shelf.add(mug);
                                    
                                    const handle = new THREE.Mesh(mugHandleGeometry, warmGlow(0xFFA500, 0.9));
                                    handle.position.set(-1.1 + m * 0.9, levelY + 0.2, 0.05);
                                    handle.rotation.y = Math.PI / 2;
                                    mug.add(handle);
                                } else {
                                    const tumbler = new THREE.Mesh(tumblerGeometry, warmGlow(0x87CEEB, 0.6));
                                    tumbler.position.set(-1.4 + m * 0.9, levelY + 0.3, 0.05);
                                    shelf.add(tumbler);
                                }
                            }
                            break;
                        }
                        default: { // boxed coffee and canisters
                            for (let b = 0; b < 4; b++) {
                                const box = new THREE.Mesh(
                                    merchBoxGeometry,
                                    warmGlow(0xCD853F + b * 0x111111, 0.6)
                                );
                                box.position.set(-1.5 + b * 1.0, levelY + 0.25, 0.05);
                                shelf.add(box);
                            }
                            
                            const canister = new THREE.Mesh(coffeeCanisterGeometry, warmGlow(0x708090, 0.5));
                            canister.position.set(0, levelY + 0.45, 0.2);
                            shelf.add(canister);
                            break;
                        }
                    }
                }
                
                const sign = new THREE.Mesh(
                    shelfSignGeometry,
                    warmGlow(shelfSignColors[variant], 0.4)
                );
                sign.position.set(0, baseY + 3.9, 0.25);
                shelf.add(sign);
                
                for (let b = 0; b < 4; b++) {
                    const bag = new THREE.Mesh(
                        coffeeBagGeometry,
                        warmGlow(coffeeBagColors[(b + variant) % coffeeBagColors.length])
                    );
                    bag.position.set(-1.2 + b * 0.8, baseY + 3.6, -0.05 - (variant * 0.02));
                    shelf.add(bag);
                }
            };

            const shelfPositions = [
                { x: -storeWidth / 2 + 5, z: storeDepth / 2 - 10, rotationY: 0 },
                { x: -storeWidth / 2 + 6, z: 0, rotationY: 0 },
                { x: storeWidth / 2 - 6, z: -storeDepth / 2 + 12, rotationY: Math.PI },
                { x: storeWidth / 2 - 5, z: storeDepth / 2 - 14, rotationY: Math.PI }
            ];

            shelfPositions.forEach(({ x, z, rotationY }, index) => {
                const shelfUnit = new THREE.Mesh(shelfUnitGeometry, shelfUnitMaterial);
                shelfUnit.position.set(x, 1.6, z);
                shelfUnit.rotation.y = rotationY;
                createShelfContents(shelfUnit, -1.4, index);
                interiorGroup.add(shelfUnit);
            });
            
            // Coffee table and chair geometries (defined once for reuse)
            const coffeeTableGeometry = new THREE.BoxGeometry(1.6, 0.8, 1.6);
            const coffeeTableMaterial = warmGlow(0x8B4513);
            const coffeeChairGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
            const coffeeChairMaterial = warmGlow(0x654321);
            const plushChairBackGeometry = new THREE.BoxGeometry(0.55, 0.6, 0.1);
            const mugGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.35, 12);
            const mugHandleSmallGeometry = new THREE.TorusGeometry(0.18, 0.05, 8, 16, Math.PI);
            const plateGeometry = new THREE.CylinderGeometry(0.55, 0.55, 0.05, 14);
            const miniDonutGeometry = new THREE.TorusGeometry(0.28, 0.09, 12, 16);
            const pastryBoxGeometry = new THREE.BoxGeometry(0.9, 0.35, 0.7);
            const napkinGeometry = new THREE.PlaneGeometry(0.6, 0.6);
            const laptopBaseGeometry = new THREE.BoxGeometry(1.1, 0.05, 0.8);
            const laptopScreenGeometry = new THREE.BoxGeometry(1.1, 0.7, 0.05);
            const plantPotGeometry = new THREE.CylinderGeometry(0.2, 0.28, 0.3, 8);
            const plantLeafGeometry = new THREE.ConeGeometry(0.16, 0.6, 6);
            
            const seatingLayouts = [
                {
                    position: { x: -20, z: 16 },
                    rotation: Math.PI / 12,
                    chairs: [
                        { x: -1.1, z: 0.2, rotation: Math.PI / 2 },
                        { x: 1.1, z: -0.1, rotation: -Math.PI / 2 }
                    ],
                    decor: 'soloDonut'
                },
                {
                    position: { x: 18, z: 14 },
                    rotation: -Math.PI / 5,
                    chairs: [
                        { x: -1.3, z: 0.7, rotation: Math.PI / 3 },
                        { x: 1.3, z: 0.7, rotation: -Math.PI / 3 },
                        { x: 0, z: -1.2, rotation: Math.PI }
                    ],
                    decor: 'trioCatchUp'
                },
                {
                    position: { x: -24, z: -12 },
                    rotation: -Math.PI / 9,
                    chairs: [
                        { x: -1.2, z: 0.8, rotation: Math.PI / 1.4 },
                        { x: 1.2, z: 0.8, rotation: -Math.PI / 1.4 },
                        { x: 0, z: -1.1, rotation: Math.PI }
                    ],
                    decor: 'coffeeAndLaptop'
                },
                {
                    position: { x: 0, z: -18 },
                    rotation: Math.PI / 2,
                    chairs: [
                        { x: -1.1, z: 1, rotation: Math.PI / 2 },
                        { x: 1.1, z: 1, rotation: -Math.PI / 2 },
                        { x: -1.1, z: -1, rotation: Math.PI / 2 },
                        { x: 1.1, z: -1, rotation: -Math.PI / 2 }
                    ],
                    decor: 'familyTreat'
                },
                {
                    position: { x: 22, z: 0 },
                    rotation: -Math.PI / 4,
                    chairs: [
                        { x: -1.2, z: 0.1, rotation: Math.PI / 2 },
                        { x: 1.2, z: -0.1, rotation: -Math.PI / 2 }
                    ],
                    decor: 'studySession'
                }
            ];
            
            const addMug = (group, offsetX, offsetZ, color = 0xFFFFFF) => {
                const mug = new THREE.Mesh(mugGeometry, warmGlow(color, 0.85));
                mug.position.set(offsetX, 0.58, offsetZ);
                group.add(mug);
                
                const handle = new THREE.Mesh(mugHandleSmallGeometry, warmGlow(0xFFA500, 0.9));
                handle.position.set(offsetX + 0.18, 0.58, offsetZ);
                handle.rotation.y = Math.PI / 2;
                group.add(handle);
                
                // Add smaller steam particles rising from the mug (smaller version of coffee pot steam)
                const mugSteamParticles = [];
                const numMugSteamParticles = 1 + Math.floor(Math.random() * 2); // 1 to 2 particles (smaller than pot)
                
                // Create a group for the mug steam (similar to coffee pot group structure)
                const mugSteamGroup = new THREE.Group();
                const mugTopY = 0.58 + 0.35 / 2; // Top of mug
                mugSteamGroup.position.set(offsetX, mugTopY, offsetZ); // Position at top of mug
                
                for (let i = 0; i < numMugSteamParticles; i++) {
                    // Create smaller steam particles for mugs - use same material as coffee pot but smaller
                    const steamMaterial = createGlowingWireframeMaterial(0xFFFFFF, 0.3, 0.2); // Same opacity as pot for visibility
                    const steamGeometry = new THREE.SphereGeometry(0.04 + Math.random() * 0.02, 6, 4); // Size 0.04-0.06 (smaller than pot's 0.05-0.08)
                    const steamParticle = new THREE.Mesh(steamGeometry, steamMaterial);
                    const initialX = (Math.random() - 0.5) * 0.08; // Smaller random x offset (relative to mug)
                    const initialZ = (Math.random() - 0.5) * 0.08; // Smaller random z offset (relative to mug)
                    steamParticle.position.set(
                        initialX,
                        0, // Relative to mugSteamGroup position (starts at top of mug)
                        initialZ
                    );
                    steamParticle.userData.initialY = 0; // Start at group origin
                    steamParticle.userData.initialX = initialX;
                    steamParticle.userData.initialZ = initialZ;
                    steamParticle.userData.speed = 0.04 + Math.random() * 0.02; // Slightly faster than before (0.04-0.06)
                    steamParticle.userData.offset = Math.random() * Math.PI * 2; // Random phase offset
                    steamParticle.userData.baseScale = 0.8 + Math.random() * 0.3; // Larger base scale for visibility
                    mugSteamGroup.add(steamParticle);
                    mugSteamParticles.push(steamParticle);
                }
                
                // Store steam particles in mugSteamGroup's userData for animation (like coffee pot)
                mugSteamGroup.userData.steamParticles = mugSteamParticles;
                mugSteamGroup.userData.isMugSteamGroup = true; // Mark as mug steam for animation
                group.add(mugSteamGroup);
            };
            
            const addDonutOnPlate = (group, offsetX, offsetZ, frostingColor) => {
                const plate = new THREE.Mesh(plateGeometry, warmGlow(0xF8F8FF, 0.7));
                plate.position.set(offsetX, 0.52, offsetZ);
                plate.rotation.x = -Math.PI / 2;
                group.add(plate);
                
                const donut = new THREE.Mesh(miniDonutGeometry, warmGlow(0xC68642, 0.9));
                donut.position.set(offsetX, 0.55, offsetZ);
                donut.rotation.x = Math.PI / 2;
                group.add(donut);
                
                const frosting = new THREE.Mesh(miniDonutGeometry, warmGlow(frostingColor, 0.8));
                frosting.scale.set(0.9, 0.4, 0.9);
                frosting.position.set(offsetX, 0.57, offsetZ);
                frosting.rotation.x = Math.PI / 2;
                group.add(frosting);
            };
            
            const addNapkin = (group, offsetX, offsetZ) => {
                const napkin = new THREE.Mesh(napkinGeometry, warmGlow(0xFFF5EE, 0.5));
                napkin.position.set(offsetX, 0.51, offsetZ);
                napkin.rotation.x = -Math.PI / 2;
                napkin.rotation.z = Math.PI / 4;
                group.add(napkin);
            };
            
            const addPlant = (group, offsetX, offsetZ) => {
                const pot = new THREE.Mesh(plantPotGeometry, warmGlow(0x8B4513, 0.8));
                pot.position.set(offsetX, 0.5, offsetZ);
                group.add(pot);
                
                const leaf = new THREE.Mesh(plantLeafGeometry, warmGlow(0x3CB371, 0.7));
                leaf.position.set(offsetX, 0.9, offsetZ);
                group.add(leaf);
            };
            
            const decorateTableSetting = (group, variant) => {
                switch (variant) {
                    case 'soloDonut':
                        addMug(group, -0.2, -0.2, 0xFFFFFF);
                        addDonutOnPlate(group, 0.3, 0.15, 0xFFC0CB);
                        addNapkin(group, 0.35, -0.25);
                        break;
                    case 'trioCatchUp':
                        addMug(group, -0.4, 0.2, 0xFFD700);
                        addMug(group, 0.4, 0.2, 0xFF69B4);
                        addDonutOnPlate(group, 0, -0.35, 0x87CEEB);
                        break;
                    case 'coffeeAndLaptop': {
                        addMug(group, -0.5, 0.25, 0xFFFFFF);
                        const laptopBase = new THREE.Mesh(laptopBaseGeometry, warmGlow(0xC0C0C0, 0.7));
                        laptopBase.position.set(0.3, 0.52, -0.1);
                        laptopBase.rotation.y = Math.PI / 6;
                        group.add(laptopBase);
                        
                        const laptopScreen = new THREE.Mesh(laptopScreenGeometry, warmGlow(0x1E1E1E, 0.8));
                        laptopScreen.position.set(0.3, 0.85, -0.45);
                        laptopScreen.rotation.y = Math.PI / 6;
                        laptopScreen.rotation.x = Math.PI / 9;
                        group.add(laptopScreen);
                        
                        addNapkin(group, 0.6, 0.2);
                        break;
                    }
                    case 'familyTreat':
                        addDonutOnPlate(group, -0.45, 0.25, 0xFF8C69);
                        addDonutOnPlate(group, 0.45, 0.25, 0xFFF8DC);
                        const pastryBox = new THREE.Mesh(pastryBoxGeometry, warmGlow(0xFFF5EE, 0.6));
                        pastryBox.position.set(0, 0.62, -0.35);
                        group.add(pastryBox);
                        addMug(group, -0.2, -0.4, 0x87CEEB);
                        addMug(group, 0.2, -0.4, 0xFFA500);
                        break;
                    default:
                        addMug(group, -0.4, 0.1, 0xFFFFFF);
                        addMug(group, 0.35, 0.1, 0xFFFFFF);
                        addPlant(group, 0, -0.3);
                        addNapkin(group, -0.05, 0.35);
                        break;
                }
            };
            
            seatingLayouts.forEach((layout) => {
                const cluster = new THREE.Group();
                
                const table = new THREE.Mesh(coffeeTableGeometry, coffeeTableMaterial);
                table.position.y = 0.4;
                cluster.add(table);
                
                layout.chairs.forEach(({ x, z, rotation }) => {
                    const chair = new THREE.Mesh(coffeeChairGeometry, coffeeChairMaterial);
                    chair.position.set(x, 0.5, z);
                    chair.rotation.y = rotation || 0;
                    
                    const backrest = new THREE.Mesh(plushChairBackGeometry, warmGlow(0x8B4513, 0.7));
                    backrest.position.set(0, 0.75, -0.25);
                    chair.add(backrest);
                    
                    cluster.add(chair);
                });
                
                decorateTableSetting(cluster, layout.decor);
                
                cluster.position.set(layout.position.x, 0, layout.position.z);
                cluster.rotation.y = layout.rotation || 0;
                interiorGroup.add(cluster);
            });
            
            // Brew station behind the counter
            const brewingStation = new THREE.Group();
            brewingStation.position.set(12, 0, -storeDepth/2 + 1.5);
            
            const brewerCounterGeometry = new THREE.BoxGeometry(9, 0.4, 1.6);
            const brewerCounter = new THREE.Mesh(brewerCounterGeometry, warmGlow(0x2F4F4F, 0.7));
            brewerCounter.position.y = 0.55;
            brewingStation.add(brewerCounter);
            
            const urnGeometry = new THREE.CylinderGeometry(0.9, 0.8, 2.4, 16);
            const urnLidGeometry = new THREE.CylinderGeometry(0.95, 0.95, 0.15, 16);
            const urnSpoutGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.7);
            const urnPositions = [-3, 0, 3];
            urnPositions.forEach((xOffset, index) => {
                const urn = new THREE.Mesh(urnGeometry, warmGlow(0x4B4B4B + index * 0x050505, 0.8));
                urn.position.set(xOffset, 1.8, 0);
                brewingStation.add(urn);
                
                const lid = new THREE.Mesh(urnLidGeometry, warmGlow(0xA9A9A9, 0.9));
                lid.position.set(xOffset, 3, 0);
                brewingStation.add(lid);
                
                const spout = new THREE.Mesh(urnSpoutGeometry, warmGlow(0x2F4F4F, 0.9));
                spout.position.set(xOffset, 1.1, 0.85);
                spout.rotation.y = Math.PI / 2;
                brewingStation.add(spout);
            });
            
            const milkPitcherGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.6, 12);
            const milkPitcher = new THREE.Mesh(milkPitcherGeometry, warmGlow(0xD3D3D3, 0.8));
            milkPitcher.position.set(-4, 1, 0.3);
            brewingStation.add(milkPitcher);
            
            const flavorPumpGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1.0, 10);
            const pumpColors = [0xFF7F50, 0xB0E0E6, 0xFFEBCD];
            pumpColors.forEach((color, idx) => {
                const pump = new THREE.Mesh(flavorPumpGeometry, warmGlow(color, 0.6));
                pump.position.set(4 - idx * 0.6, 1.3, 0.25);
                brewingStation.add(pump);
            });
            
            interiorGroup.add(brewingStation);
            
            // High-top counter with stools along the window
            const highTopGroup = new THREE.Group();
            highTopGroup.position.set(-24, 0, 10);
            highTopGroup.rotation.y = Math.PI / 6;
            
            const highTopSurfaceGeometry = new THREE.BoxGeometry(6.5, 0.2, 1.4);
            const highTopSurface = new THREE.Mesh(highTopSurfaceGeometry, warmGlow(0xA0522D, 0.8));
            highTopSurface.position.y = 1.1;
            highTopGroup.add(highTopSurface);
            
            const highTopBaseGeometry = new THREE.BoxGeometry(6.5, 0.15, 1.2);
            const highTopBase = new THREE.Mesh(highTopBaseGeometry, warmGlow(0x2F4F4F, 0.7));
            highTopBase.position.y = 0.6;
            highTopGroup.add(highTopBase);
            
            const stoolSeatGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.18, 12);
            const stoolLegGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1.1, 8);
            const stoolPositions = [-2.2, 0, 2.2];
            stoolPositions.forEach((offset, idx) => {
                const stoolGroup = new THREE.Group();
                const leg = new THREE.Mesh(stoolLegGeometry, warmGlow(0x2F4F4F, 0.7));
                leg.position.y = 0.55;
                stoolGroup.add(leg);
                
                const seat = new THREE.Mesh(stoolSeatGeometry, warmGlow(idx % 2 === 0 ? 0xFF7F50 : 0xFFD700, 0.85));
                seat.position.y = 1.1;
                stoolGroup.add(seat);
                
                stoolGroup.position.set(offset, 0, 0.4);
                highTopGroup.add(stoolGroup);
            });
            
            const highTopMug = new THREE.Mesh(mugGeometry, warmGlow(0xFFFFFF, 0.8));
            highTopMug.position.set(-1.2, 1.25, 0.25);
            highTopGroup.add(highTopMug);
            
            const highTopNapkin = new THREE.Mesh(napkinGeometry, warmGlow(0xFDF5E6, 0.5));
            highTopNapkin.position.set(1.4, 1.2, 0.2);
            highTopNapkin.rotation.x = -Math.PI / 2;
            highTopGroup.add(highTopNapkin);
            
            interiorGroup.add(highTopGroup);
            
            // Self-serve condiment station
            const condimentStation = new THREE.Group();
            condimentStation.position.set(24, 0, -10);
            const condimentCounterGeometry = new THREE.BoxGeometry(4, 0.6, 1.2);
            const condimentCounter = new THREE.Mesh(condimentCounterGeometry, warmGlow(0x8B4513, 0.8));
            condimentCounter.position.y = 0.3;
            condimentStation.add(condimentCounter);
            
            const sugarJar = new THREE.Mesh(jarGeometry, warmGlow(0xFFF8DC, 0.6));
            sugarJar.position.set(-1.1, 0.75, 0.2);
            condimentStation.add(sugarJar);
            
            const stirStickHolder = new THREE.Mesh(strawBundleGeometry, warmGlow(0x8B4513, 0.7));
            stirStickHolder.scale.set(3, 1, 3);
            stirStickHolder.position.set(0, 0.9, 0.15);
            condimentStation.add(stirStickHolder);
            
            const lidStack = new THREE.Mesh(plateGeometry, warmGlow(0xE0E0E0, 0.6));
            lidStack.scale.set(1.2, 1.2, 1.2);
            lidStack.position.set(1.1, 0.75, 0.2);
            condimentStation.add(lidStack);
            
            interiorGroup.add(condimentStation);
            
            // Storage shelves with curated supplies
            const coffeeStorageShelfGeometry = new THREE.BoxGeometry(2.2, 3.2, 0.6);
            const coffeeStorageShelfMaterial = warmGlow(0x7F4F24, 0.8);
            const burlapSackGeometry = new THREE.CylinderGeometry(0.45, 0.5, 1.0, 8);
            const trayStackGeometry = new THREE.BoxGeometry(0.7, 0.2, 0.9);
            const cleaningBottleGeometry = new THREE.CylinderGeometry(0.12, 0.18, 0.7, 8);
            const filterBoxGeometry = new THREE.BoxGeometry(0.9, 0.3, 0.7);
            const storagePositions = [
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 4 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 8 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 12 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 16 }
            ];
            
            const decorateStorageShelf = (shelf, variantIndex) => {
                const variant = variantIndex % 4;
                switch (variant) {
                    case 0: { // burlap bean sacks
                        for (let s = 0; s < 3; s++) {
                            const sack = new THREE.Mesh(burlapSackGeometry, warmGlow(0xCD853F, 0.6));
                            sack.position.set(-0.5 + s * 0.5, 0.7, 0);
                            shelf.add(sack);
                        }
                        break;
                    }
                    case 1: { // tray stacks and liners
                        for (let t = 0; t < 2; t++) {
                            const trayStack = new THREE.Mesh(trayStackGeometry, warmGlow(0xD2B48C, 0.7));
                            trayStack.position.set(-0.4 + t * 0.8, 0.8, 0);
                            shelf.add(trayStack);
                        }
                        const linerRoll = new THREE.Mesh(flavorPumpGeometry, warmGlow(0xFFFFFF, 0.5));
                        linerRoll.scale.set(0.4, 0.4, 0.4);
                        linerRoll.position.set(0, 1.5, 0.1);
                        shelf.add(linerRoll);
                        break;
                    }
                    case 2: { // cleaning supplies
                        for (let b = 0; b < 3; b++) {
                            const bottle = new THREE.Mesh(cleaningBottleGeometry, warmGlow(0x87CEEB + b * 0x111100, 0.7));
                            bottle.position.set(-0.6 + b * 0.6, 0.9, 0.05);
                            shelf.add(bottle);
                        }
                        const towelStack = new THREE.Mesh(pastryTrayGeometry, warmGlow(0xF5F5F5, 0.6));
                        towelStack.scale.set(0.3, 0.2, 0.6);
                        towelStack.position.set(0, 0.6, 0.05);
                        shelf.add(towelStack);
                        break;
                    }
                    default: { // cup and lid refills
                        for (let c = 0; c < 3; c++) {
                            const stack = new THREE.Mesh(cupStackGeometry, warmGlow(cupStackColors[c] || 0xFFFFFF, 0.8));
                            stack.scale.set(0.6, 0.8, 0.6);
                            stack.position.set(-0.6 + c * 0.6, 0.9, 0);
                            shelf.add(stack);
                        }
                        const filters = new THREE.Mesh(filterBoxGeometry, warmGlow(0xEEE8AA, 0.6));
                        filters.position.set(0, 1.5, 0.05);
                        shelf.add(filters);
                        break;
                    }
                }
            };
            
            storagePositions.forEach((pos, index) => {
                const storageShelf = new THREE.Mesh(coffeeStorageShelfGeometry, coffeeStorageShelfMaterial);
                storageShelf.position.set(pos.x, 1.6, pos.z);
                decorateStorageShelf(storageShelf, index);
                interiorGroup.add(storageShelf);
            });
            break;
            
        case 'flowers': // Flower Shop
            // Flower table and vase geometries (defined once for reuse)
            const flowerTableGeometry = new THREE.BoxGeometry(3, 1, 1.5);
            const flowerTableMaterial = warmGlow(0xF5F5DC);
            const vaseGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
            const vaseMaterial = warmGlow(0x87CEEB);
            
            // Multiple flower geometries for variety
            const flowerSphereGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const flowerConeGeometry = new THREE.ConeGeometry(0.25, 0.4, 8);
            const flowerTorusGeometry = new THREE.TorusGeometry(0.2, 0.1, 8, 16);
            const flowerOctahedronGeometry = new THREE.OctahedronGeometry(0.25);
            
            // Expanded flower color palette
            const flowerColors = [
                0xFF1493, 0xFF69B4, 0xFFB6C1, 0x98FB98, 0x90EE90, 0x32CD32,
                0xFFD700, 0xFFA500, 0xFF6347, 0xFF4500, 0xDA70D6, 0xBA55D3,
                0x9370DB, 0x8A2BE2, 0xFF00FF, 0xFF1493, 0x00CED1, 0x00BFFF,
                0x1E90FF, 0x4169E1, 0xFF69B4, 0xFF1493, 0xFFC0CB, 0xFFB6C1
            ];
            
            // Helper function to create a flower with random shape and color
            const createFlower = (x, y, z) => {
                const flowerGroup = new THREE.Group();
                const flowerType = Math.floor(Math.random() * 4);
                const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
                
                let flowerMesh;
                switch(flowerType) {
                    case 0: // Sphere flower
                        flowerMesh = new THREE.Mesh(flowerSphereGeometry, warmGlow(color));
                        break;
                    case 1: // Cone flower (tulip-like)
                        flowerMesh = new THREE.Mesh(flowerConeGeometry, warmGlow(color));
                        break;
                    case 2: // Torus flower (ring-shaped)
                        flowerMesh = new THREE.Mesh(flowerTorusGeometry, warmGlow(color));
                        flowerMesh.rotation.x = Math.PI / 2;
                        break;
                    case 3: // Octahedron flower (star-shaped)
                        flowerMesh = new THREE.Mesh(flowerOctahedronGeometry, warmGlow(color));
                        break;
                }
                
                flowerGroup.add(flowerMesh);
                flowerGroup.position.set(x, y, z);
                return flowerGroup;
            };
            
            // Helper function to create potted plant
            const createPottedPlant = (x, z, size = 1.0) => {
                const plantGroup = new THREE.Group();
                const potSize = 0.3 * size;
                const potGeometry = new THREE.CylinderGeometry(potSize * 0.8, potSize, 0.4 * size, 8);
                const potMaterial = warmGlow(0x8B4513);
                const pot = new THREE.Mesh(potGeometry, potMaterial);
                pot.position.y = 0.2 * size;
                plantGroup.add(pot);
                
                // Multiple leaves/stems
                const leafCount = 3 + Math.floor(Math.random() * 4);
                for (let i = 0; i < leafCount; i++) {
                    const leafGeometry = new THREE.ConeGeometry(0.15 * size, 0.6 * size, 6);
                    const leafColor = [0x228B22, 0x32CD32, 0x90EE90, 0x98FB98][Math.floor(Math.random() * 4)];
                    const leaf = new THREE.Mesh(leafGeometry, warmGlow(leafColor));
                    const angle = (i / leafCount) * Math.PI * 2;
                    leaf.position.set(
                        Math.cos(angle) * 0.2 * size,
                        0.5 * size,
                        Math.sin(angle) * 0.2 * size
                    );
                    leaf.rotation.z = Math.random() * 0.5 - 0.25;
                    plantGroup.add(leaf);
                }
                
                plantGroup.position.set(x, 0, z);
                return plantGroup;
            };
            
            // Helper function to create hanging plant
            const createHangingPlant = (x, z, height) => {
                const hangingGroup = new THREE.Group();
                
                // Chain/rope
                const chainGeometry = new THREE.CylinderGeometry(0.02, 0.02, height - 1.5, 4);
                const chainMaterial = warmGlow(0x696969);
                const chain = new THREE.Mesh(chainGeometry, chainMaterial);
                chain.position.y = -(height - 1.5) / 2;
                hangingGroup.add(chain);
                
                // Hanging pot
                const hangingPotGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.3, 8);
                const hangingPotMaterial = warmGlow(0x8B4513);
                const hangingPot = new THREE.Mesh(hangingPotGeometry, hangingPotMaterial);
                hangingPot.position.y = -(height - 1.2);
                hangingGroup.add(hangingPot);
                
                // Trailing leaves
                const trailingLeafCount = 4 + Math.floor(Math.random() * 3);
                for (let i = 0; i < trailingLeafCount; i++) {
                    const leafGeometry = new THREE.ConeGeometry(0.1, 0.4, 6);
                    const leafColor = [0x228B22, 0x32CD32, 0x90EE90][Math.floor(Math.random() * 3)];
                    const leaf = new THREE.Mesh(leafGeometry, warmGlow(leafColor));
                    const angle = (i / trailingLeafCount) * Math.PI * 2;
                    leaf.position.set(
                        Math.cos(angle) * 0.15,
                        -(height - 1.5) - 0.1 * i,
                        Math.sin(angle) * 0.15
                    );
                    leaf.rotation.z = Math.random() * 0.3;
                    hangingGroup.add(leaf);
                }
                
                hangingGroup.position.set(x, height, z);
                return hangingGroup;
            };
            
            // AISLE SYSTEM LAYOUT
            // Define aisle structure: 4 aisles running front to back (along Z axis)
            // Aisle 1: Left side (x = -18 to -12)
            // Aisle 2: Left-center (x = -8 to -2) - HANGING PLANTS AISLE
            // Aisle 3: Right-center (x = 2 to 8) - HANGING PLANTS AISLE
            // Aisle 4: Right side (x = 12 to 18)
            // Walkways between aisles at x = -10, 0, 10
            
            const aisleWidth = 6; // Width of each aisle
            const walkwayWidth = 4; // Width of walkways between aisles
            const aisle1CenterX = -15; // Left aisle
            const aisle2CenterX = -5;  // Left-center aisle (hanging plants)
            const aisle3CenterX = 5;   // Right-center aisle (hanging plants)
            const aisle4CenterX = 15;   // Right aisle
            
            // Counter at front with flowers on top
            const flowerCounterGeometry = new THREE.BoxGeometry(5.3, 1.2, 1.5);
            const flowerCounterMaterial = warmGlow(0x90EE90, 0.8);
            const flowerCounter = new THREE.Mesh(flowerCounterGeometry, flowerCounterMaterial);
            flowerCounter.position.set(0, 0.5, storeDepth/2 - 60);
            interiorGroup.add(flowerCounter);
            
            // Flowers on counter (store for animation)
            if (!scene.userData) {
                scene.userData = {};
            }
            if (!scene.userData.counterFlowers) {
                scene.userData.counterFlowers = [];
            }
            for (let i = 0; i < 5; i++) {
                const counterFlower = createFlower(-2.5 + i * 1.275, 2.3, storeDepth/2 - 60);
                interiorGroup.add(counterFlower);
                // Store reference for animation
                scene.userData.counterFlowers.push(counterFlower);
            }
            
            // Refrigerated display cases along side walls
            const fridgeGeometry = new THREE.BoxGeometry(4, 2, 1);
            const fridgeMaterial = warmGlow(0xFFFFFF);
            const fridgePositions = [
                { x: -storeWidth/2 + 2, z: storeDepth/2 - 8 },
                { x: -storeWidth/2 + 2, z: storeDepth/2 - 14 },
                { x: storeWidth/2 - 2, z: storeDepth/2 - 8 },
                { x: storeWidth/2 - 2, z: storeDepth/2 - 14 }
            ];
            fridgePositions.forEach(({ x, z }) => {
                const fridge = new THREE.Mesh(fridgeGeometry, fridgeMaterial);
                fridge.position.set(x, 1, z);
                interiorGroup.add(fridge);
            });
            
            // Window display areas with flowers (front of shop)
            const windowDisplayPositions = [
                { x: -storeWidth/2 + 1, z: storeDepth/2 + 2.5 },
                { x: storeWidth/2 - 1, z: storeDepth/2 + 2.5 }
            ];
            windowDisplayPositions.forEach(({ x, z }) => {
                const windowTable = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
                windowTable.scale.set(1.5, 1, 1);
                windowTable.position.set(x, 0.5, z);
                interiorGroup.add(windowTable);
                
                for (let w = 0; w < 5; w++) {
                    const windowVase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                    windowVase.position.set(x - 1.5 + w * 0.75, 0.75, z);
                    interiorGroup.add(windowVase);
                    
                    const windowFlower = createFlower(x - 1.5 + w * 0.75, 1.1, z);
                    interiorGroup.add(windowFlower);
                }
            });
            
            // Helper function to create aisle displays (tables with flowers)
            const createAisleDisplay = (centerX, startZ, endZ, tableSpacing = 4) => {
                const displays = [];
                for (let z = startZ; z <= endZ; z += tableSpacing) {
                    displays.push({ x: centerX, z: z });
                }
                return displays;
            };
            
            // AISLE 1: Left side aisle - Flower displays
            const aisle1Displays = createAisleDisplay(aisle1CenterX, -storeDepth/2 + 4, storeDepth/2 - 6, 4);
            aisle1Displays.forEach(({ x, z }) => {
                const table = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
                table.position.set(x, 0.5, z);
                interiorGroup.add(table);
                
                // 3-4 vases per table
                const vaseCount = 3 + Math.floor(Math.random() * 2);
                for (let k = 0; k < vaseCount; k++) {
                    const offsetX = x - (vaseCount - 1) * 0.4 + k * 0.8;
                    const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                    vase.position.set(offsetX, 0.75, z);
                    interiorGroup.add(vase);
                    
                    const flowersPerVase = 1 + Math.floor(Math.random() * 3);
                    for (let f = 0; f < flowersPerVase; f++) {
                        const flower = createFlower(offsetX, 1.1 + f * 0.15, z);
                        interiorGroup.add(flower);
                    }
                }
            });
            
            // AISLE 2: Left-center aisle - HANGING PLANTS AISLE
            const aisle2Displays = createAisleDisplay(aisle2CenterX, -storeDepth/2 + 4, storeDepth/2 - 6, 3);
            aisle2Displays.forEach(({ x, z }) => {
                // Tables with flowers
                const table = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
                table.position.set(x, 0.5, z);
                interiorGroup.add(table);
                
                const vaseCount = 2 + Math.floor(Math.random() * 2);
                for (let k = 0; k < vaseCount; k++) {
                    const offsetX = x - (vaseCount - 1) * 0.4 + k * 0.8;
                    const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                    vase.position.set(offsetX, 0.75, z);
                    interiorGroup.add(vase);
                    
                    const flowersPerVase = 1 + Math.floor(Math.random() * 2);
                    for (let f = 0; f < flowersPerVase; f++) {
                        const flower = createFlower(offsetX, 1.1 + f * 0.15, z);
                        interiorGroup.add(flower);
                    }
                }
                
                // Hanging plants above tables (every other display)
                if (Math.random() > 0.3) {
                    const hangingHeight = 3 + Math.random() * 0.5;
                    const hangingPlant = createHangingPlant(x, z, hangingHeight);
                    interiorGroup.add(hangingPlant);
                }
            });
            
            // AISLE 3: Right-center aisle - HANGING PLANTS AISLE
            const aisle3Displays = createAisleDisplay(aisle3CenterX, -storeDepth/2 + 4, storeDepth/2 - 6, 3);
            aisle3Displays.forEach(({ x, z }) => {
                // Tables with flowers
                const table = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
                table.position.set(x, 0.5, z);
                interiorGroup.add(table);
                
                const vaseCount = 2 + Math.floor(Math.random() * 2);
                for (let k = 0; k < vaseCount; k++) {
                    const offsetX = x - (vaseCount - 1) * 0.4 + k * 0.8;
                    const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                    vase.position.set(offsetX, 0.75, z);
                    interiorGroup.add(vase);
                    
                    const flowersPerVase = 1 + Math.floor(Math.random() * 2);
                    for (let f = 0; f < flowersPerVase; f++) {
                        const flower = createFlower(offsetX, 1.1 + f * 0.15, z);
                        interiorGroup.add(flower);
                    }
                }
                
                // Hanging plants above tables (every other display)
                if (Math.random() > 0.3) {
                    const hangingHeight = 3 + Math.random() * 0.5;
                    const hangingPlant = createHangingPlant(x, z, hangingHeight);
                    interiorGroup.add(hangingPlant);
                }
            });
            
            // AISLE 4: Right side aisle - Flower displays
            const aisle4Displays = createAisleDisplay(aisle4CenterX, -storeDepth/2 + 4, storeDepth/2 - 6, 4);
            aisle4Displays.forEach(({ x, z }) => {
                const table = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
                table.position.set(x, 0.5, z);
                interiorGroup.add(table);
                
                // 3-4 vases per table
                const vaseCount = 3 + Math.floor(Math.random() * 2);
                for (let k = 0; k < vaseCount; k++) {
                    const offsetX = x - (vaseCount - 1) * 0.4 + k * 0.8;
                    const vase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                    vase.position.set(offsetX, 0.75, z);
                    interiorGroup.add(vase);
                    
                    const flowersPerVase = 1 + Math.floor(Math.random() * 3);
                    for (let f = 0; f < flowersPerVase; f++) {
                        const flower = createFlower(offsetX, 1.1 + f * 0.15, z);
                        interiorGroup.add(flower);
                    }
                }
            });
            
            // Additional hanging plants in the two hanging plant aisles (more concentrated)
            const extraHangingPositions = [
                // Aisle 2 (left-center) - extra hanging plants
                { x: aisle2CenterX - 1.5, z: -storeDepth/2 + 7 },
                { x: aisle2CenterX + 1.5, z: -storeDepth/2 + 7 },
                { x: aisle2CenterX - 1.5, z: -storeDepth/2 + 13 },
                { x: aisle2CenterX + 1.5, z: -storeDepth/2 + 13 },
                { x: aisle2CenterX - 1.5, z: -storeDepth/2 + 19 },
                { x: aisle2CenterX + 1.5, z: -storeDepth/2 + 19 },
                { x: aisle2CenterX, z: -storeDepth/2 + 10 },
                { x: aisle2CenterX, z: -storeDepth/2 + 16 },
                // Aisle 3 (right-center) - extra hanging plants
                { x: aisle3CenterX - 1.5, z: -storeDepth/2 + 7 },
                { x: aisle3CenterX + 1.5, z: -storeDepth/2 + 7 },
                { x: aisle3CenterX - 1.5, z: -storeDepth/2 + 13 },
                { x: aisle3CenterX + 1.5, z: -storeDepth/2 + 13 },
                { x: aisle3CenterX - 1.5, z: -storeDepth/2 + 19 },
                { x: aisle3CenterX + 1.5, z: -storeDepth/2 + 19 },
                { x: aisle3CenterX, z: -storeDepth/2 + 10 },
                { x: aisle3CenterX, z: -storeDepth/2 + 16 }
            ];
            extraHangingPositions.forEach(({ x, z }) => {
                const hangingHeight = 3 + Math.random() * 0.5;
                const hangingPlant = createHangingPlant(x, z, hangingHeight);
                interiorGroup.add(hangingPlant);
            });
            
            // Potted plants at aisle ends and corners
            const pottedPlantPositions = [
                // Front corners
                { x: aisle1CenterX, z: storeDepth/2 - 4 },
                { x: aisle4CenterX, z: storeDepth/2 - 4 },
                // Back corners
                { x: aisle1CenterX, z: -storeDepth/2 + 2 },
                { x: aisle4CenterX, z: -storeDepth/2 + 2 },
                // Side walls near aisles
                { x: -storeWidth/2 + 1.5, z: -storeDepth/2 + 8 },
                { x: -storeWidth/2 + 1.5, z: -storeDepth/2 + 14 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 8 },
                { x: storeWidth/2 - 1.5, z: -storeDepth/2 + 14 },
                // Walkway intersections
                { x: -10, z: -storeDepth/2 + 6 },
                { x: 0, z: -storeDepth/2 + 6 },
                { x: 10, z: -storeDepth/2 + 6 },
                { x: -10, z: storeDepth/2 - 8 },
                { x: 10, z: storeDepth/2 - 8 }
            ];
            pottedPlantPositions.forEach(({ x, z }) => {
                const plant = createPottedPlant(x, z, 0.8 + Math.random() * 0.4);
                interiorGroup.add(plant);
            });
            
            // Large center display arrangement (against left wall)
            const centerTable = new THREE.Mesh(flowerTableGeometry, flowerTableMaterial);
            centerTable.scale.set(2, 1.2, 2);
            centerTable.position.set(-storeWidth/2 + 3, 0.6, -storeDepth/2 + 10);
            interiorGroup.add(centerTable);
            
            for (let c = 0; c < 8; c++) {
                const angle = (c / 8) * Math.PI * 2;
                const radius = 1.2;
                const centerVase = new THREE.Mesh(vaseGeometry, vaseMaterial);
                centerVase.scale.set(1.2, 1.2, 1.2);
                centerVase.position.set(
                    -storeWidth/2 + 3 + Math.cos(angle) * radius,
                    0.9,
                    -storeDepth/2 + 10 + Math.sin(angle) * radius
                );
                interiorGroup.add(centerVase);
                
                const centerFlower = createFlower(
                    -storeWidth/2 + 3 + Math.cos(angle) * radius,
                    1.3,
                    -storeDepth/2 + 10 + Math.sin(angle) * radius
                );
                centerFlower.scale.set(1.3, 1.3, 1.3);
                interiorGroup.add(centerFlower);
            }
            break;

        case 'bodega': // City bodega
            {
                const shelfGeometry = new THREE.BoxGeometry(3, 2, 0.5);
                const shelfMaterial = warmGlow(0x8B4513);
                for (let i = 0; i < 4; i++) {
                    const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
                    shelf.position.set(-6 + i * 4, 1, -storeDepth/2 + 2);
                    interiorGroup.add(shelf);
                }
                const counterGeometry = new THREE.BoxGeometry(6, 1.2, 2);
                const counter = new THREE.Mesh(counterGeometry, warmGlow(0x333333));
                counter.position.set(0, 0.6, storeDepth/2 - 4);
                interiorGroup.add(counter);
                const coolerGeometry = new THREE.BoxGeometry(2, 1.5, 1);
                const cooler = new THREE.Mesh(coolerGeometry, warmGlow(0x4682B4));
                cooler.position.set(-4, 0.75, storeDepth/2 - 2);
                interiorGroup.add(cooler);
                break;
            }

        case 'pho': // Pho House
            {
                const phoTableGeometry = new THREE.BoxGeometry(1.5, 0.8, 1);
                const phoTableMaterial = warmGlow(0x8B4513);
                for (let i = 0; i < 4; i++) {
                    const tbl = new THREE.Mesh(phoTableGeometry, phoTableMaterial);
                    tbl.position.set(-6 + i * 4, 0.4, -4);
                    interiorGroup.add(tbl);
                }
                const phoCounterGeometry = new THREE.BoxGeometry(8, 1.2, 2);
                const phoCounter = new THREE.Mesh(phoCounterGeometry, warmGlow(0xCC3300));
                phoCounter.position.set(0, 0.6, storeDepth/2 - 5);
                interiorGroup.add(phoCounter);
                const potGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.8, 8);
                const pot = new THREE.Mesh(potGeometry, warmGlow(0x333333));
                pot.position.set(0, 1.2, storeDepth/2 - 5);
                interiorGroup.add(pot);
                break;
            }

        case 'tattoo': // Tattoo Parlor
            {
                const chairGeometry = new THREE.BoxGeometry(0.8, 0.6, 1);
                const chairMaterial = warmGlow(0x2F2F2F);
                const tattooChair = new THREE.Mesh(chairGeometry, chairMaterial);
                tattooChair.position.set(0, 0.3, -storeDepth/2 + 4);
                interiorGroup.add(tattooChair);
                const lampGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 8);
                const lamp = new THREE.Mesh(lampGeometry, warmGlow(0xFFFFAA));
                lamp.position.set(-2, 1.5, -storeDepth/2 + 4);
                interiorGroup.add(lamp);
                const counterGeometry = new THREE.BoxGeometry(5, 1, 1.5);
                const counter = new THREE.Mesh(counterGeometry, warmGlow(0x1a1a1a));
                counter.position.set(0, 0.5, storeDepth/2 - 3);
                interiorGroup.add(counter);
                const displayGeometry = new THREE.BoxGeometry(2, 2, 0.2);
                const display = new THREE.Mesh(displayGeometry, warmGlow(0x444444));
                display.position.set(-4, 1, -storeDepth/2 + 2);
                interiorGroup.add(display);
                break;
            }

        case 'vinyl_coffee': // Vinyl & Coffee
            {
                const recordShelfGeometry = new THREE.BoxGeometry(3, 2.5, 0.4);
                const recordShelfMaterial = warmGlow(0x4a3728);
                for (let i = 0; i < 3; i++) {
                    const rack = new THREE.Mesh(recordShelfGeometry, recordShelfMaterial);
                    rack.position.set(-6 + i * 6, 1.25, -storeDepth/2 + 3);
                    interiorGroup.add(rack);
                }
                const coffeeBarGeometry = new THREE.BoxGeometry(6, 1.2, 2);
                const coffeeBar = new THREE.Mesh(coffeeBarGeometry, warmGlow(0x663300));
                coffeeBar.position.set(0, 0.6, storeDepth/2 - 4);
                interiorGroup.add(coffeeBar);
                const turntableGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
                const turntable = new THREE.Mesh(turntableGeometry, warmGlow(0x222222));
                turntable.position.set(4, 0.95, storeDepth/2 - 4);
                interiorGroup.add(turntable);
                break;
            }

        case 'dive_bar': // Dive Bar (CITY_N center)
            {
                const barCounterGeometry = new THREE.BoxGeometry(8, 1.2, 2);
                const barCounter = new THREE.Mesh(barCounterGeometry, warmGlow(0x4a3728));
                barCounter.position.set(0, 0.6, -storeDepth/2 + 3);
                interiorGroup.add(barCounter);
                const barStoolGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.6, 8);
                for (let i = 0; i < 5; i++) {
                    const stool = new THREE.Mesh(barStoolGeometry, warmGlow(0x8B4513));
                    stool.position.set(-6 + i * 3, 0.9, -storeDepth/2 + 3);
                    interiorGroup.add(stool);
                }
                const poolTableGeometry = new THREE.BoxGeometry(2.5, 0.1, 4);
                const poolTable = new THREE.Mesh(poolTableGeometry, warmGlow(0x228B22));
                poolTable.position.set(-4, 0.05, 2);
                interiorGroup.add(poolTable);
                const boothGeometry = new THREE.BoxGeometry(2, 0.8, 1);
                const booth = new THREE.Mesh(boothGeometry, warmGlow(0x654321));
                booth.position.set(6, 0.4, -2);
                interiorGroup.add(booth);
                break;
            }

        case 'arcade_bar': // Arcade Bar (CITY_S center)
            {
                const barCounterGeometry = new THREE.BoxGeometry(6, 1.2, 2);
                const barCounter = new THREE.Mesh(barCounterGeometry, warmGlow(0x333333));
                barCounter.position.set(0, 0.6, -storeDepth/2 + 3);
                interiorGroup.add(barCounter);
                const cabinetGeometry = new THREE.BoxGeometry(1.2, 2, 0.8);
                const cabinetMaterial = warmGlow(0x222222);
                for (let i = 0; i < 3; i++) {
                    const cab = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
                    cab.position.set(-4 + i * 4, 1, 2);
                    interiorGroup.add(cab);
                }
                const pinballGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.9);
                const pinball = new THREE.Mesh(pinballGeometry, warmGlow(0xFF0000));
                pinball.position.set(6, 0.4, -2);
                interiorGroup.add(pinball);
                break;
            }

        case 'record_store': // Record Store
            {
                const binGeometry = new THREE.BoxGeometry(2, 1.5, 0.5);
                const binMaterial = warmGlow(0x2F2F2F);
                for (let i = 0; i < 6; i++) {
                    const bin = new THREE.Mesh(binGeometry, binMaterial);
                    bin.position.set(-8 + i * 3, 0.75, -storeDepth/2 + 4);
                    interiorGroup.add(bin);
                }
                const listeningBoothGeometry = new THREE.BoxGeometry(1.5, 2, 1.5);
                const booth = new THREE.Mesh(listeningBoothGeometry, warmGlow(0x1a1a1a));
                booth.position.set(6, 1, 2);
                interiorGroup.add(booth);
                const registerGeometry = new THREE.BoxGeometry(1, 1.2, 0.6);
                const register = new THREE.Mesh(registerGeometry, warmGlow(0x444444));
                register.position.set(0, 0.6, storeDepth/2 - 3);
                interiorGroup.add(register);
                break;
            }

        case 'laundromat': // Laundromat
            {
                const washerGeometry = new THREE.CylinderGeometry(0.6, 0.65, 1, 12);
                const washerMaterial = warmGlow(0xFFFFFF);
                for (let i = 0; i < 4; i++) {
                    const washer = new THREE.Mesh(washerGeometry, washerMaterial);
                    washer.position.set(-6 + i * 4, 0.5, -storeDepth/2 + 3);
                    interiorGroup.add(washer);
                }
                const foldingTableGeometry = new THREE.BoxGeometry(3, 1, 1.5);
                const foldingTable = new THREE.Mesh(foldingTableGeometry, warmGlow(0x888888));
                foldingTable.position.set(0, 0.5, 2);
                interiorGroup.add(foldingTable);
                const chairGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
                const waitingChair = new THREE.Mesh(chairGeometry, warmGlow(0x666666));
                waitingChair.position.set(-8, 0.4, 2);
                interiorGroup.add(waitingChair);
                break;
            }

        case 'corner_cafe': // Corner Cafe
            {
                const cafeTableGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.8);
                const cafeTableMaterial = warmGlow(0x8B4513);
                for (let i = 0; i < 4; i++) {
                    const tbl = new THREE.Mesh(cafeTableGeometry, cafeTableMaterial);
                    tbl.position.set(-5 + i * 3, 0.4, -3);
                    interiorGroup.add(tbl);
                }
                const espressoGeometry = new THREE.BoxGeometry(1.5, 1.5, 1);
                const espresso = new THREE.Mesh(espressoGeometry, warmGlow(0x333333));
                espresso.position.set(0, 0.75, storeDepth/2 - 4);
                interiorGroup.add(espresso);
                const pastryCaseGeometry = new THREE.BoxGeometry(4, 1.5, 1);
                const pastryCase = new THREE.Mesh(pastryCaseGeometry, warmGlow(0xCCCCCC));
                pastryCase.position.set(-4, 0.75, storeDepth/2 - 2);
                interiorGroup.add(pastryCase);
                break;
            }

        case 'bookshop': // Bookshop
            {
                const shelfGeometry = new THREE.BoxGeometry(2, 2.5, 0.4);
                const shelfMaterial = warmGlow(0x4a3728);
                for (let i = 0; i < 6; i++) {
                    const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
                    shelf.position.set(-8 + i * 3, 1.25, -storeDepth/2 + 3);
                    interiorGroup.add(shelf);
                }
                const readingChairGeometry = new THREE.BoxGeometry(0.8, 0.9, 0.9);
                const readingChair = new THREE.Mesh(readingChairGeometry, warmGlow(0x654321));
                readingChair.position.set(6, 0.45, 2);
                interiorGroup.add(readingChair);
                const smallTableGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
                const smallTable = new THREE.Mesh(smallTableGeometry, warmGlow(0x8B4513));
                smallTable.position.set(6, 0.3, 3);
                interiorGroup.add(smallTable);
                break;
            }

        case 'sushi': // Sushi Spot
            {
                const sushiBarGeometry = new THREE.BoxGeometry(8, 1.2, 2);
                const sushiBar = new THREE.Mesh(sushiBarGeometry, warmGlow(0x2F4F4F));
                sushiBar.position.set(0, 0.6, -storeDepth/2 + 3);
                interiorGroup.add(sushiBar);
                const conveyorGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 16);
                const conveyor = new THREE.Mesh(conveyorGeometry, warmGlow(0x333333));
                conveyor.rotation.x = Math.PI / 2;
                conveyor.position.set(0, 1, -storeDepth/2 + 3);
                interiorGroup.add(conveyor);
                const tableGeometry = new THREE.BoxGeometry(1.2, 0.7, 1);
                const tableMaterial = warmGlow(0x8B4513);
                for (let i = 0; i < 3; i++) {
                    const tbl = new THREE.Mesh(tableGeometry, tableMaterial);
                    tbl.position.set(-4 + i * 4, 0.35, 2);
                    interiorGroup.add(tbl);
                }
                break;
            }

        case 'vintage': // Vintage Threads
            {
                const rackGeometry = new THREE.BoxGeometry(0.1, 2, 1.5);
                const rackMaterial = warmGlow(0x8B4513);
                for (let i = 0; i < 5; i++) {
                    const rack = new THREE.Mesh(rackGeometry, rackMaterial);
                    rack.position.set(-6 + i * 3, 1, -storeDepth/2 + 4);
                    interiorGroup.add(rack);
                }
                const mirrorGeometry = new THREE.PlaneGeometry(2, 2);
                const mirror = new THREE.Mesh(mirrorGeometry, warmGlow(0xAAAAAA));
                mirror.position.set(6, 1.5, -storeDepth/2 + 2);
                mirror.rotation.y = Math.PI;
                interiorGroup.add(mirror);
                const checkoutGeometry = new THREE.BoxGeometry(3, 1.2, 1);
                const checkout = new THREE.Mesh(checkoutGeometry, warmGlow(0x654321));
                checkout.position.set(0, 0.6, storeDepth/2 - 3);
                interiorGroup.add(checkout);
                break;
            }

        case 'bubble_tea': // Bubble Tea
            {
                const counterGeometry = new THREE.BoxGeometry(6, 1.2, 2);
                const counter = new THREE.Mesh(counterGeometry, warmGlow(0xFFB6C1));
                counter.position.set(0, 0.6, storeDepth/2 - 4);
                interiorGroup.add(counter);
                const machineGeometry = new THREE.BoxGeometry(1.5, 1.5, 1);
                const machine = new THREE.Mesh(machineGeometry, warmGlow(0x333333));
                machine.position.set(-2, 1.35, storeDepth/2 - 4);
                interiorGroup.add(machine);
                const boothGeometry = new THREE.BoxGeometry(1.5, 0.8, 1);
                const boothMaterial = warmGlow(0x996633);
                for (let i = 0; i < 3; i++) {
                    const b = new THREE.Mesh(boothGeometry, boothMaterial);
                    b.position.set(-5 + i * 4, 0.4, -3);
                    interiorGroup.add(b);
                }
                break;
            }

        case 'smoke_shop': // Smoke Shop
            {
                const displayCaseGeometry = new THREE.BoxGeometry(5, 1.5, 1);
                const displayCase = new THREE.Mesh(displayCaseGeometry, warmGlow(0x2F4F2F));
                displayCase.position.set(0, 0.75, storeDepth/2 - 4);
                interiorGroup.add(displayCase);
                const shelfGeometry = new THREE.BoxGeometry(2, 1.5, 0.4);
                const shelfMaterial = warmGlow(0x4a3728);
                for (let i = 0; i < 4; i++) {
                    const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
                    shelf.position.set(-6 + i * 4, 0.75, -storeDepth/2 + 3);
                    interiorGroup.add(shelf);
                }
                const stoolGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.5, 8);
                const stool = new THREE.Mesh(stoolGeometry, warmGlow(0x333333));
                stool.position.set(-8, 0.6, 2);
                interiorGroup.add(stool);
                break;
            }
            
        default:
            // Generic shop - add basic shelves
            const genericShelfGeometry = new THREE.BoxGeometry(1.5, 2, 0.3);
            const genericShelfMaterial = warmGlow(0x8B4513);
            for (let i = 0; i < 3; i++) {
                const shelf = new THREE.Mesh(genericShelfGeometry, genericShelfMaterial);
                shelf.position.set(-4 + i * 4, 1, -storeDepth/2 + 3);
                interiorGroup.add(shelf);
            }
            break;
    }
    
    // Exit door
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
    console.log(`📦 Collected ${interactiveItems.length} interactive items for ${shopName}`);
    
    compressInteriorToBounds(interiorGroup, storeWidth, storeDepth);
    applyInteriorScale(interiorGroup);
    scene.add(interiorGroup);
    
    console.log(`🏪 Created ${shopName} interior`);
    return interiorGroup;
};

// Create Church Interior
