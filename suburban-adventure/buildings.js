import { createWoodlandTrail } from './world/trails.js';
import { POND_TRAILS } from './world/trail-layout.js';
// buildings.js - Building creation and management
import * as THREE from 'three';
import { createWireframeMaterial } from './utils.js';

import { INTERIOR_TARGET_SIZE } from './buildings/shared.js';
export { INTERIOR_TARGET_SIZE } from './buildings/shared.js';
// Create a building facade with different styles
export const createBuildingFacade = (width, height, depth, style, signText, signColor = 0xFFFFFF) => {
    const buildingGroup = new THREE.Group();
    
    // Building dimensions
    const wallThickness = 0.3;
    
    // Base colors for different building types
    const buildingColors = {
        convenience: 0x888888,
        pizza: 0xFF6600,
        clothing: 0x9966CC,
        drycleaner: 0x4169E1,
        coffee: 0xD2691E,
        flowers: 0x228B22,
        groton_church: 0xF5F5DC,
        groton_townhall: 0x8B4513,
        groton_colonial: 0xDEB887,
        groton_house: 0xA0522D,
        hospital: 0xE6E6FA,
        graveyard: 0x2F4F4F,
        mansion: 0xC4B8A8,
        triple_decker: 0xB87333,
        brick: 0x8B4513,
        storefront_urban: 0x4A4A4A
    };
    
    const roofColors = {
        groton_church: 0x708090,
        groton_townhall: 0x2F4F4F,
        groton_colonial: 0x8B4513,
        groton_house: 0x696969,
        mansion: 0x2a2a2a,
        triple_decker: 0x2a2a2a,
        brick: 0x4a2020,
        storefront_urban: 0x333333,
        default: 0x654321
    };
    
    const baseColor = buildingColors[style] || 0x888888;
    const roofColor = roofColors[style] || roofColors.default;

    // Special exterior treatment for the graveyard: no traditional facade, just grounds.
    if (style === 'graveyard') {
        buildingGroup.name = "GraveyardExterior";

        const halfWidth = width / 2;
        const halfDepth = depth / 2;

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(width, depth);
        const groundMaterial = createWireframeMaterial(0x2E5D30);
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, 0.01, -halfDepth);
        buildingGroup.add(ground);

        // Central path
        const pathGeometry = new THREE.PlaneGeometry(width * 0.35, depth * 0.85);
        const pathMaterial = createWireframeMaterial(0x3E3A32);
        const path = new THREE.Mesh(pathGeometry, pathMaterial);
        path.rotation.x = -Math.PI / 2;
        path.position.set(0, 0.02, -halfDepth * 0.85);
        buildingGroup.add(path);

        // Perimeter fence (low)
        const fenceMaterial = createWireframeMaterial(0x4A4A4A);
        const fenceHeight = 1.4;

        const createFenceSection = (w, h, x, z, orientation) => {
            const fenceGeometry = new THREE.BoxGeometry(w, 0.6, 0.12);
            const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
            fence.position.set(x, fenceHeight * 0.35, z);
            fence.rotation.y = orientation;
            return fence;
        };

        // Front fence pieces with gate gap
        const frontOffset = 0.4;
        const gateWidth = width * 0.35;
        const sideLength = (width - gateWidth) / 2 - 0.4;
        if (sideLength > 0) {
            const frontLeftFence = createFenceSection(sideLength, 0.6, -gateWidth / 2 - sideLength / 2 - frontOffset, 0.15, 0);
            buildingGroup.add(frontLeftFence);
            const frontRightFence = createFenceSection(sideLength, 0.6, gateWidth / 2 + sideLength / 2 + frontOffset, 0.15, 0);
            buildingGroup.add(frontRightFence);
        }

        // Back fence
        const backFence = createFenceSection(width - 0.6, 0.6, 0, -depth + 0.3, 0);
        buildingGroup.add(backFence);

        // Side fences
        const sideFenceGeometry = new THREE.BoxGeometry(depth - 0.6, 0.6, 0.12);
        const leftFence = new THREE.Mesh(sideFenceGeometry, fenceMaterial);
        leftFence.rotation.y = Math.PI / 2;
        leftFence.position.set(-halfWidth + 0.3, fenceHeight * 0.35, -halfDepth);
        buildingGroup.add(leftFence);
        const rightFence = leftFence.clone();
        rightFence.position.x = halfWidth - 0.3;
        buildingGroup.add(rightFence);

        // Gate posts & arch
        const gateGroup = new THREE.Group();
        const gatePostGeometry = new THREE.BoxGeometry(0.4, 2.2, 0.4);
        const gatePostMaterial = createWireframeMaterial(0x5A5A5A);
        const leftGatePost = new THREE.Mesh(gatePostGeometry, gatePostMaterial);
        leftGatePost.position.set(-gateWidth / 2 + 0.4, 1.1, 0.15);
        gateGroup.add(leftGatePost);
        const rightGatePost = new THREE.Mesh(gatePostGeometry, gatePostMaterial);
        rightGatePost.position.set(gateWidth / 2 - 0.4, 1.1, 0.15);
        gateGroup.add(rightGatePost);
        const gateArchGeometry = new THREE.TorusGeometry(gateWidth / 2 - 0.4, 0.12, 8, 16, Math.PI);
        const gateArchMaterial = createWireframeMaterial(0x5A5A5A);
        const gateArch = new THREE.Mesh(gateArchGeometry, gateArchMaterial);
        gateArch.rotation.x = Math.PI / 2;
        gateArch.position.set(0, 2.35, 0.15);
        gateGroup.add(gateArch);
        buildingGroup.add(gateGroup);

        // Gravestones (artfully arranged clusters)
        const stoneMaterial = createWireframeMaterial(0x9C9C9C);
        const stoneGeometry = new THREE.BoxGeometry(0.6, 1.1, 0.2);
        const gravePositions = [
            { x: -width * 0.32, z: -halfDepth * 0.45 },
            { x: -width * 0.18, z: -halfDepth * 0.52 },
            { x: width * 0.22, z: -halfDepth * 0.48 },
            { x: width * 0.34, z: -halfDepth * 0.62 },
            { x: -width * 0.28, z: -halfDepth * 0.7 },
            { x: width * 0.12, z: -halfDepth * 0.68 },
            { x: -width * 0.05, z: -halfDepth * 0.36 },
            { x: width * 0.3, z: -halfDepth * 0.32 }
        ];

        gravePositions.forEach(({ x: gx, z: gz }, index) => {
            const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
            stone.scale.y = 0.8 + (index % 3) * 0.2;
            stone.position.set(gx, stone.scale.y * 0.55, gz);
            stone.rotation.y = (Math.random() - 0.5) * 0.25;
            buildingGroup.add(stone);
        });

        // Central memorial
        const memorialBase = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 0.4, 2.4),
            createWireframeMaterial(0x7E6F5A)
        );
        memorialBase.position.set(0, 0.2, -halfDepth * 0.55);
        buildingGroup.add(memorialBase);

        const memorialColumn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 1.8, 8),
            createWireframeMaterial(0x8F7F6A)
        );
        memorialColumn.position.set(0, 1.1, -halfDepth * 0.55);
        buildingGroup.add(memorialColumn);

        const memorialGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            createGlowingWireframeMaterial(0xBBAAFF, 0.8, 0.6)
        );
        memorialGlow.position.set(0, 2.2, -halfDepth * 0.55);
        buildingGroup.add(memorialGlow);

        // Small trees for silhouette
        const trunkGeometry = new THREE.CylinderGeometry(0.25, 0.25, 2.2, 6);
        const foliageGeometry = new THREE.ConeGeometry(1.4, 3, 8);
        const trunkMaterial = createWireframeMaterial(0x5B3A29);
        const foliageMaterial = createWireframeMaterial(0x2F6B3A);

        const treePositions = [
            { x: -width * 0.42, z: -halfDepth * 0.82 },
            { x: width * 0.35, z: -halfDepth * 0.78 }
        ];
        treePositions.forEach(({ x: tx, z: tz }) => {
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(tx, 1.1, tz);
            buildingGroup.add(trunk);
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(tx, 2.8, tz);
            buildingGroup.add(foliage);
        });

        return buildingGroup;
    }
    
    // Main building structure
    // Create front wall group
    const frontWallGroup = new THREE.Group();
    const wallGeometry = new THREE.BoxGeometry(width, height, wallThickness);
    const wallMaterial = createWireframeMaterial(baseColor);
    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.set(0, height/2, 0);
    frontWallGroup.add(frontWall);
    
    // Create side walls
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, height, depth);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-width/2, height/2, -depth/2);
    buildingGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(width/2, height/2, -depth/2);
    buildingGroup.add(rightWall);
    
    // Create back wall
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, height/2, -depth);
    buildingGroup.add(backWall);
    
    // Create windows (2 rows of 5 windows)
    const windowRows = 2;
    const windowCols = 5;
    const windowWidth = 1.2;
    const windowHeight = 1.4;
    const windowSpacing = width / (windowCols + 1);
    const rowSpacing = height / (windowRows + 1);
    
    for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
            // Skip center window on bottom row for door
            if (row === (windowRows - 1) && col === 2) continue;
            
            const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, 0.1);
            const windowMaterial = createWireframeMaterial(0x87CEEB);
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            
            const x = -width/2 + (col + 1) * windowSpacing;
            const y = height - (row + 1) * rowSpacing;
            window.position.set(x, y, wallThickness/2 + 0.05);
            frontWallGroup.add(window);
        }
    }
    
    // Add door in center bottom position
    let doorWidth = width * 0.12;
    let doorHeight = height * 0.25;
    
    // Scale door for far buildings - all far building styles get larger doors
    if (style === 'groton_church' || style === 'groton_townhall' || 
        style === 'groton_colonial' || style === 'groton_house' || 
        style === 'hospital' || style === 'graveyard' ||
        style === 'mansion' ||
        style === 'modern' || style === 'brick' || 
        style === 'shop' || style === 'industrial') {
        doorWidth = width * 0.15;
        doorHeight = height * 0.4;
    }
    
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.15);
    const doorMaterial = createGlowingWireframeMaterial(0x8B4513, 1.0, 0.4);
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, doorHeight/2, wallThickness/2 + 0.08);
    frontWallGroup.add(door);
    
    // Door handle
    const handleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05);
    const handleMaterial = createWireframeMaterial(0xFFD700);
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(doorWidth/3, doorHeight/2, wallThickness/2 + 0.12);
    frontWallGroup.add(handle);
    
    // Building-specific features
    if (style === 'groton_church') {
        // Church steeple
        const steepleBase = new THREE.BoxGeometry(width * 0.3, height * 0.6, depth * 0.3);
        const steepleBaseMaterial = createWireframeMaterial(baseColor);
        const steepleBaseMesh = new THREE.Mesh(steepleBase, steepleBaseMaterial);
        steepleBaseMesh.position.set(0, height + height * 0.3, -depth * 0.2);
        frontWallGroup.add(steepleBaseMesh);
        
        // Bell tower section
        const bellTower = new THREE.BoxGeometry(width * 0.25, height * 0.4, depth * 0.25);
        const bellTowerMaterial = createWireframeMaterial(baseColor);
        const bellTowerMesh = new THREE.Mesh(bellTower, bellTowerMaterial);
        bellTowerMesh.position.set(0, height + height * 0.6 + height * 0.2, -depth * 0.2);
        frontWallGroup.add(bellTowerMesh);
        
        // Tall spire
        const spire = new THREE.ConeGeometry(width * 0.1, height * 0.8, 8);
        const spireMaterial = createWireframeMaterial(roofColor);
        const spireMesh = new THREE.Mesh(spire, spireMaterial);
        spireMesh.position.set(0, height + height * 0.6 + height * 0.4 + height * 0.4, -depth * 0.2);
        frontWallGroup.add(spireMesh);
        
        // Cross on top
        const crossVertical = new THREE.BoxGeometry(0.1, 0.6, 0.1);
        const crossHorizontal = new THREE.BoxGeometry(0.4, 0.1, 0.1);
        const crossMaterial = createWireframeMaterial(0xFFD700);
        
        const crossV = new THREE.Mesh(crossVertical, crossMaterial);
        const crossH = new THREE.Mesh(crossHorizontal, crossMaterial);
        
        const crossHeight = height + height * 0.6 + height * 0.4 + height * 0.8 + 0.3;
        crossV.position.set(0, crossHeight, -depth * 0.2);
        crossH.position.set(0, crossHeight, -depth * 0.2);
        
        frontWallGroup.add(crossV);
        frontWallGroup.add(crossH);
    } else if (style === 'groton_townhall') {
        // Simple town hall with columns
        const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, height * 0.8, 8);
        const columnMaterial = createWireframeMaterial(0xF5F5F5);
        
        const leftColumn = new THREE.Mesh(columnGeometry, columnMaterial);
        leftColumn.position.set(-width * 0.25, height * 0.4, wallThickness/2 + 0.2);
        frontWallGroup.add(leftColumn);
        
        const rightColumn = new THREE.Mesh(columnGeometry, columnMaterial);
        rightColumn.position.set(width * 0.25, height * 0.4, wallThickness/2 + 0.2);
        frontWallGroup.add(rightColumn);
        
        // Town hall sign
        const signGeometry = new THREE.BoxGeometry(width * 0.6, 0.8, 0.1);
        const signMaterial = createWireframeMaterial(0xFFFFFF);
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, height * 0.9, wallThickness/2 + 0.05);
        frontWallGroup.add(sign);
    } else if (style === 'groton_colonial') {
        // Colonial house with gabled roof
        const roofHeight = height * 0.4;
        
        // Create gabled roof using custom geometry
        const roofGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            // Back sloped face (triangle)  
             width/2, 0, depth/2,   
            -width/2, 0, depth/2,   
             0, roofHeight, 0,       
            
            // Left sloped face
            -width/2, 0, -depth/2,  
            -width/2, 0, depth/2,   
             0, roofHeight, 0,       
            
            // Right sloped face
             width/2, 0, -depth/2,  
             0, roofHeight, 0,       
             width/2, 0, depth/2    
        ]);
        
        const indices = [
            0, 1, 2,    // back triangle  
            3, 4, 5,    // left sloped face
            6, 7, 8     // right sloped face
        ];
        
        roofGeometry.setIndex(indices);
        roofGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        roofGeometry.computeVertexNormals();
        
        const roofMaterial = createWireframeMaterial(roofColor);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, height, -depth/2);
        frontWallGroup.add(roof);
        
        // Chimney
        const chimneyGeometry = new THREE.BoxGeometry(0.6, height * 0.6, 0.6);
        const chimneyMaterial = createWireframeMaterial(0x8B4513);
        const chimneyMesh = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimneyMesh.position.set(width/4, height + (height * 0.6)/2, -depth/2);
        frontWallGroup.add(chimneyMesh);
    } else if (style === 'mansion') {
        const roofGeometry = new THREE.BufferGeometry();
        const halfW = width / 2 + .8, halfD = depth / 2 + .8;
        roofGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
            -halfW, 0, -halfD, halfW, 0, -halfD, 0, 4, -halfD,
            -halfW, 0, halfD, halfW, 0, halfD, 0, 4, halfD
        ], 3));
        roofGeometry.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);
        roofGeometry.computeVertexNormals();
        const roof = new THREE.Mesh(roofGeometry, createWireframeMaterial(roofColor));
        roof.name = 'MansionRoof'; roof.position.set(0,height,-depth/2); buildingGroup.add(roof);
        for (const side of [-1, 1]) {
            const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.4,3,1.4), createWireframeMaterial(baseColor));
            chimney.position.set(side * width * .32,height+2,-depth*.6);buildingGroup.add(chimney);
        }
        // Grand columns and portico
        const columnGeometry = new THREE.CylinderGeometry(0.4, 0.5, height * 0.9, 8);
        const columnMaterial = createWireframeMaterial(0xE8E0D5);
        const columnSpacing = width * 0.22;
        for (const i of [-1, 1]) {
            const col = new THREE.Mesh(columnGeometry, columnMaterial);
            col.position.set(i * columnSpacing, height * 0.45, wallThickness / 2 + 0.35);
            frontWallGroup.add(col);
        }
        // Portico roof (flat canopy over entrance)
        const porticoGeometry = new THREE.BoxGeometry(width * 0.65, height * 0.15, depth * 0.4);
        const porticoMaterial = createWireframeMaterial(roofColor);
        const portico = new THREE.Mesh(porticoGeometry, porticoMaterial);
        portico.position.set(0, height * 0.9, depth * 0.12);
        frontWallGroup.add(portico);
    }
    
    // Add building sign
    if (signText) {
        const signGeometry = new THREE.BoxGeometry(Math.min(width * 0.8, 8), 1.2, 0.1);
        const signMaterial = createWireframeMaterial(signColor);
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, height - 0.5, 0.1);
        frontWallGroup.add(sign);
    }
    
    // Add front wall group to building group
    buildingGroup.add(frontWallGroup);
    
    return buildingGroup;
};

// ============================================================
// TRIPLE DECKER MODELS - 5 variants (Boston Allston-style)
// Based on: full porches, bay windows, column styles, jut-outs
// ============================================================

const TRIPLE_DECKER_WIDTH = 11;
const TRIPLE_DECKER_HEIGHT = 9;
const TRIPLE_DECKER_DEPTH = 7;
const FLOOR_HEIGHT = 3;

/** Model 1: Classic full porch - 3-level open porch, square columns, warm wood siding */
const createTripleDeckerClassicPorch = () => {
    const g = new THREE.Group();
    const w = TRIPLE_DECKER_WIDTH;
    const h = TRIPLE_DECKER_HEIGHT;
    const d = TRIPLE_DECKER_DEPTH;
    const wallMat = createWireframeMaterial(0xB87333);  // Warm wood
    const porchMat = createWireframeMaterial(0x8B6914);  // Darker porch
    const roofMat = createWireframeMaterial(0x2a2a2a);
    const windowMat = createWireframeMaterial(0x87CEEB);

    const porchDepth = 1.8;
    const colW = 0.2;
    const colH = FLOOR_HEIGHT - 0.3;

    // Main body - 3 floors
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.set(0, h / 2, -d / 2);
    g.add(body);

    // Windows - stacked 2 per floor
    for (let floor = 0; floor < 3; floor++) {
        const baseY = floor * FLOOR_HEIGHT + 1.2;
        [-2.5, 2.5].forEach((ox) => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.08), windowMat);
            win.position.set(ox, baseY, 0.05);
            g.add(win);
        });
    }

    // Door ground floor
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.12), createWireframeMaterial(0x5D4037));
    door.position.set(0, 1.1, 0.05);
    g.add(door);

    // Porch platform (all 3 levels)
    for (let floor = 0; floor < 3; floor++) {
        const py = floor * FLOOR_HEIGHT + 0.08;
        const deck = new THREE.Mesh(
            new THREE.BoxGeometry(w + 0.4, 0.15, porchDepth),
            porchMat
        );
        deck.position.set(0, py, porchDepth / 2);
        g.add(deck);

        // Square columns - 4 corners
        [[-w/2 - 0.1, -0.1], [w/2 + 0.1, -0.1], [-w/2 - 0.1, porchDepth + 0.1], [w/2 + 0.1, porchDepth + 0.1]].forEach(([px, pz]) => {
            const col = new THREE.Mesh(new THREE.BoxGeometry(colW, colH, colW), porchMat);
            col.position.set(px, py + colH/2, pz);
            g.add(col);
        });
    }

    // Flat roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.2, d + 0.4), roofMat);
    roof.position.set(0, h + 0.1, -d/2);
    g.add(roof);

    return g;
};

/** Model 2: Bay window - projecting bays instead of porch, gray clapboard */
const createTripleDeckerBayWindow = () => {
    const g = new THREE.Group();
    const w = TRIPLE_DECKER_WIDTH;
    const h = TRIPLE_DECKER_HEIGHT;
    const d = TRIPLE_DECKER_DEPTH;
    const wallMat = createWireframeMaterial(0x6B6B6B);  // Gray
    const bayMat = createWireframeMaterial(0x5a5a5a);
    const roofMat = createWireframeMaterial(0x333333);
    const windowMat = createWireframeMaterial(0x87CEEB);

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.set(0, h / 2, -d / 2);
    g.add(body);

    const bayProj = 1.2;
    const bayW = 4;
    const bayD = 1.2;

    for (let floor = 0; floor < 3; floor++) {
        const baseY = floor * FLOOR_HEIGHT + 1.5;
        // Center bay (3-sided jut-out)
        const bay = new THREE.Mesh(new THREE.BoxGeometry(bayW, 2, bayD), bayMat);
        bay.position.set(0, baseY, bayProj / 2);
        g.add(bay);

        const win = new THREE.Mesh(new THREE.BoxGeometry(bayW - 0.4, 1.3, 0.08), windowMat);
        win.position.set(0, baseY, bayProj + 0.04);
        g.add(win);

        if (floor === 0) {
            const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), createWireframeMaterial(0x4a3728));
            door.position.set(4, 1.1, 0.06);
            g.add(door);
        } else {
            const sideWin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.08), windowMat);
            sideWin.position.set(4, baseY, 0.06);
            g.add(sideWin);
        }
    }

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.2, d + 0.2), roofMat);
    roof.position.set(0, h + 0.1, -d/2);
    g.add(roof);

    return g;
};

/** Model 3: Ornate porch - round columns, baluster railings, cornice, cream/yellow */
const createTripleDeckerOrnatePorch = () => {
    const g = new THREE.Group();
    const w = TRIPLE_DECKER_WIDTH;
    const h = TRIPLE_DECKER_HEIGHT;
    const d = TRIPLE_DECKER_DEPTH;
    const wallMat = createWireframeMaterial(0xE8DCC8);  // Cream
    const porchMat = createWireframeMaterial(0xD4C4A8);
    const columnMat = createWireframeMaterial(0xC9B896);
    const roofMat = createWireframeMaterial(0x3a3530);

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.set(0, h / 2, -d / 2);
    g.add(body);

    for (let floor = 0; floor < 3; floor++) {
        const py = floor * FLOOR_HEIGHT;
        const deck = new THREE.Mesh(
            new THREE.BoxGeometry(w + 0.6, 0.12, 1.6),
            porchMat
        );
        deck.position.set(0, py + 0.06, 0.8);
        g.add(deck);

        // Round columns
        [-w/2 - 0.15, w/2 + 0.15].forEach((px) => {
            const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, FLOOR_HEIGHT - 0.2, 8), columnMat);
            col.position.set(px, py + (FLOOR_HEIGHT - 0.2) / 2, 0.8);
            g.add(col);
        });

        // Baluster railing
        const rail = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.5, 0.08), porchMat);
        rail.position.set(0, py + 0.6, 1.6);
        g.add(rail);
    }

    for (let floor = 0; floor < 3; floor++) {
        const baseY = floor * FLOOR_HEIGHT + 1.2;
        [-3, 3].forEach((ox) => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.08), createWireframeMaterial(0x87CEEB));
            win.position.set(ox, baseY, 0.05);
            g.add(win);
        });
        if (floor === 0) {
            const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 0.1), createWireframeMaterial(0x6B5344));
            door.position.set(0, 1.05, 0.05);
            g.add(door);
        }
    }

    // Cornice at roofline
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.4, d + 0.6), columnMat);
    cornice.position.set(0, h, -d/2);
    g.add(cornice);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.18, d + 0.4), roofMat);
    roof.position.set(0, h + 0.28, -d/2);
    g.add(roof);

    return g;
};

/** Model 4: Double bay + ground porch - two projecting bays, brick, small first-floor porch */
const createTripleDeckerDoubleBay = () => {
    const g = new THREE.Group();
    const w = TRIPLE_DECKER_WIDTH;
    const h = TRIPLE_DECKER_HEIGHT;
    const d = TRIPLE_DECKER_DEPTH;
    const wallMat = createWireframeMaterial(0x8B4513);   // Brick
    const bayMat = createWireframeMaterial(0xA0522D);   // Darker brick
    const roofMat = createWireframeMaterial(0x4a2020);
    const windowMat = createWireframeMaterial(0x87CEEB);

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.set(0, h / 2, -d / 2);
    g.add(body);

    const bayW = 3.2;
    const bayProj = 1;

    for (let floor = 0; floor < 3; floor++) {
        const baseY = floor * FLOOR_HEIGHT + 1.4;
        [-2.5, 2.5].forEach((ox) => {
            const bay = new THREE.Mesh(new THREE.BoxGeometry(bayW, 2, bayProj), bayMat);
            bay.position.set(ox, baseY, bayProj / 2);
            g.add(bay);
            const win = new THREE.Mesh(new THREE.BoxGeometry(bayW - 0.5, 1.2, 0.1), windowMat);
            win.position.set(ox, baseY, bayProj + 0.05);
            g.add(win);
        });
        if (floor === 0) {
            const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.12), createWireframeMaterial(0x4a3728));
            door.position.set(0, 1.1, 0.06);
            g.add(door);
        }
    }

    // Ground-floor only porch
    const porch = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.15, 1.2), createWireframeMaterial(0x696969));
    porch.position.set(0, 0.08, 0.6);
    g.add(porch);
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2, 0.18), createWireframeMaterial(0x5a5a5a));
    col.position.set(-w/2 - 0.05, 1.04, 0.6);
    g.add(col);
    const col2 = col.clone();
    col2.position.set(w/2 + 0.05, 1.04, 0.6);
    g.add(col2);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.2, d + 0.3), roofMat);
    roof.position.set(0, h + 0.1, -d/2);
    g.add(roof);

    return g;
};

/** Model 5: Flat front with portico - minimal, small portico over door, white/gray */
const createTripleDeckerFlatPortico = () => {
    const g = new THREE.Group();
    const w = TRIPLE_DECKER_WIDTH;
    const h = TRIPLE_DECKER_HEIGHT;
    const d = TRIPLE_DECKER_DEPTH;
    const wallMat = createWireframeMaterial(0xE8E8E8);  // Light gray/white
    const trimMat = createWireframeMaterial(0x9a9a9a);
    const roofMat = createWireframeMaterial(0x4a4a4a);
    const windowMat = createWireframeMaterial(0xB0C4DE);

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.set(0, h / 2, -d / 2);
    g.add(body);

    for (let floor = 0; floor < 3; floor++) {
        const baseY = floor * FLOOR_HEIGHT + 1.25;
        [-3.5, -1.2, 1.2, 3.5].forEach((ox) => {
            const win = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.08), windowMat);
            win.position.set(ox, baseY, 0.05);
            g.add(win);
        });
    }

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.12), createWireframeMaterial(0x7A6B5C));
    door.position.set(0, 1.1, 0.06);
    g.add(door);

    // Portico - small roof over door
    const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 1.5), trimMat);
    porticoRoof.position.set(0, 2.5, 0.75);
    g.add(porticoRoof);
    const porticoCol1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), trimMat);
    porticoCol1.position.set(-1.4, 1.1, 0.75);
    g.add(porticoCol1);
    const porticoCol2 = porticoCol1.clone();
    porticoCol2.position.set(1.4, 1.1, 0.75);
    g.add(porticoCol2);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.2, d + 0.2), roofMat);
    roof.position.set(0, h + 0.1, -d/2);
    g.add(roof);

    return g;
};

const TRIPLE_DECKER_MODELS = [
    createTripleDeckerClassicPorch,
    createTripleDeckerBayWindow,
    createTripleDeckerOrnatePorch,
    createTripleDeckerDoubleBay,
    createTripleDeckerFlatPortico
];

/** Simple tall tower for city skyline - gray/blue-gray box. */
export const createSimpleTower = (width, height, depth, color = 0x4a5568) => {
    const group = new THREE.Group();
    const mat = createWireframeMaterial(color);
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    body.position.y = height / 2;
    group.add(body);
    return group;
};

/** Returns a random triple decker variant. */
export const createTripleDeckerBuilding = (variant) => {
    const idx = variant !== undefined ? variant % TRIPLE_DECKER_MODELS.length : Math.floor(Math.random() * TRIPLE_DECKER_MODELS.length);
    return TRIPLE_DECKER_MODELS[idx]();
};

// Create karaoke bar interior elements
export const createKaraokeInterior = (frontShopsGroup) => {
    const interiorElements = {};
    
    // Bar counter
    const barGeometry = new THREE.BoxGeometry(8, 1.2, 2);
    const barMaterial = createWireframeMaterial(0x8B4513);
    const barCounter = new THREE.Mesh(barGeometry, barMaterial);
    barCounter.position.set(-8, 0.6, -8);
    frontShopsGroup.add(barCounter);
    interiorElements.barCounter = barCounter;
    
    // Bar stools
    const createBarStool = (x, z) => {
        const stoolGroup = new THREE.Group();
        
        const seatGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8);
        const seatMaterial = createWireframeMaterial(0x654321);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 1;
        stoolGroup.add(seat);
        
        const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
        const legMaterial = createWireframeMaterial(0x654321);
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.y = 0.5;
        stoolGroup.add(leg);
        
        stoolGroup.position.set(x, 0, z);
        return stoolGroup;
    };
    
    const barStools = [];
    for (let i = 0; i < 4; i++) {
        const stool = createBarStool(-10 + i * 2, -6);
        frontShopsGroup.add(stool);
        barStools.push(stool);
    }
    interiorElements.barStools = barStools;
    
    // Stage
    const stageGeometry = new THREE.BoxGeometry(6, 0.5, 4);
    const stageMaterial = createWireframeMaterial(0x8B008B);
    const stage = new THREE.Mesh(stageGeometry, stageMaterial);
    stage.position.set(8, 0.25, -8);
    frontShopsGroup.add(stage);
    interiorElements.stage = stage;
    
    // Microphone stand
    const micStandGroup = new THREE.Group();
    const standGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 6);
    const standMaterial = createWireframeMaterial(0x696969);
    const stand = new THREE.Mesh(standGeometry, standMaterial);
    stand.position.y = 1;
    micStandGroup.add(stand);
    
    const micGeometry = new THREE.SphereGeometry(0.15, 8, 6);
    const micMaterial = createWireframeMaterial(0x000000);
    const mic = new THREE.Mesh(micGeometry, micMaterial);
    mic.position.y = 2.2;
    micStandGroup.add(mic);
    
    micStandGroup.position.set(8, 0.25, -8);
    frontShopsGroup.add(micStandGroup);
    interiorElements.micStandGroup = micStandGroup;
    
    // Tables and chairs
    const createTable = (x, z) => {
        const tableGroup = new THREE.Group();
        
        const topGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 8);
        const topMaterial = createWireframeMaterial(0x8B4513);
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 1.5;
        tableGroup.add(top);
        
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6);
        const legMaterial = createWireframeMaterial(0x654321);
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.y = 0.75;
        tableGroup.add(leg);
        
        tableGroup.position.set(x, 0, z);
        return tableGroup;
    };
    
    const createChair = (x, z) => {
        const chairGroup = new THREE.Group();
        
        const seatGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.8);
        const seatMaterial = createWireframeMaterial(0x654321);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 0.8;
        chairGroup.add(seat);
        
        const backGeometry = new THREE.BoxGeometry(0.8, 1, 0.1);
        const back = new THREE.Mesh(backGeometry, seatMaterial);
        back.position.set(0, 1.3, -0.35);
        chairGroup.add(back);
        
        chairGroup.position.set(x, 0, z);
        return chairGroup;
    };
    
    // Add tables and chairs
    const tables = [];
    const chairs = [];
    
    const tablePositions = [
        [-4, -3], [4, -3], [-4, 3], [4, 3]
    ];
    
    tablePositions.forEach(([x, z]) => {
        const table = createTable(x, z);
        frontShopsGroup.add(table);
        tables.push(table);
        
        // Add chairs around each table
        const chairOffsets = [
            [0, 1.5], [1.5, 0], [0, -1.5], [-1.5, 0]
        ];
        
        chairOffsets.forEach(([dx, dz]) => {
            const chair = createChair(x + dx, z + dz);
            frontShopsGroup.add(chair);
            chairs.push(chair);
        });
    });
    
    interiorElements.tables = tables;
    interiorElements.chairs = chairs;
    
    return interiorElements;
};

// Create park elements for the forest suburban scene
export const createParkElements = (frontGroup) => {
    const parkElements = {};
    
    // Create a central gazebo/pavilion
    const createGazebo = (x, z) => {
        const gazeboGroup = new THREE.Group();
        
        // Gazebo platform
        const platformGeometry = new THREE.CylinderGeometry(4, 4, 0.2, 8);
        const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x7A7A7A });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = 0.1;
        gazeboGroup.add(platform);
        
        // Gazebo pillars - brighter white
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const pillarX = Math.cos(angle) * 3.5;
            const pillarZ = Math.sin(angle) * 3.5;
            
            const pillarGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
            const pillarMaterial = createWireframeMaterial(0xBFBFBF); // Bright white
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(pillarX, 1.7, pillarZ);
            gazeboGroup.add(pillar);
        }
        
        // Gazebo roof - dark grey/brown like real shingles
        const roofGeometry = new THREE.ConeGeometry(5, 2, 8);
        const roofMaterial = createWireframeMaterial(0x7A7A7A); // Dark grey
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 4.2;
        gazeboGroup.add(roof);
        
        // Add a white cupola at the top (like the reference image)
        const cupolaGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 8);
        const cupolaMaterial = createWireframeMaterial(0xDFDFDF); // White cupola
        const cupola = new THREE.Mesh(cupolaGeometry, cupolaMaterial);
        cupola.position.y = 5.3;
        gazeboGroup.add(cupola);
        
        // Small dark roof on top of cupola
        const cupolaRoofGeometry = new THREE.ConeGeometry(0.6, 0.4, 8);
        const cupolaRoofMaterial = createWireframeMaterial(0x7A7A7A); // Dark grey
        const cupolaRoof = new THREE.Mesh(cupolaRoofGeometry, cupolaRoofMaterial);
        cupolaRoof.position.y = 5.8;
        gazeboGroup.add(cupolaRoof);
        
        gazeboGroup.position.set(x, 0, z);
        return gazeboGroup;
    };
    
    // Create park benches
    const createParkBench = (x, z, rotation = 0) => {
        const benchGroup = new THREE.Group();
        
        // Bench seat
        const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.6);
        const seatMaterial = createWireframeMaterial(0x8B4513);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 0.8;
        benchGroup.add(seat);
        
        // Bench back
        const backGeometry = new THREE.BoxGeometry(2, 1, 0.1);
        const back = new THREE.Mesh(backGeometry, seatMaterial);
        back.position.set(0, 1.3, -0.25);
        benchGroup.add(back);
        
        // Bench legs
        const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.6);
        const leftLeg = new THREE.Mesh(legGeometry, seatMaterial);
        const rightLeg = new THREE.Mesh(legGeometry, seatMaterial);
        leftLeg.position.set(-0.8, 0.4, 0);
        rightLeg.position.set(0.8, 0.4, 0);
        benchGroup.add(leftLeg);
        benchGroup.add(rightLeg);
        
        benchGroup.position.set(x, 0, z);
        benchGroup.rotation.y = rotation;
        return benchGroup;
    };
    
    // Create scattered trees for the park
    const createParkTree = (x, z, scale = 1) => {
        const treeGroup = new THREE.Group();
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 3 * scale, 8);
        const trunkMaterial = createWireframeMaterial(0x8B4513);
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5 * scale;
        treeGroup.add(trunk);
        
        // Tree foliage (multiple layers)
        for (let i = 0; i < 3; i++) {
            const foliageGeometry = new THREE.SphereGeometry(1.5 * scale - i * 0.3, 8, 6);
            const foliageMaterial = createWireframeMaterial(0x228B22);
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = 2.5 * scale + i * 0.8;
            treeGroup.add(foliage);
        }
        
        treeGroup.position.set(x, 0, z);
        return treeGroup;
    };
    
    // Add central gazebo - moved back 20 units more, then forward 10 units
    const gazebo = createGazebo(0, -22);
    frontGroup.add(gazebo);
    parkElements.gazebo = gazebo;
    
    // Add park benches positioned individually around the gazebo
    const benches = [];
    
    // Position each bench explicitly with correct rotation to face gazebo (adjusted for new gazebo position at z=-22)
    const benchPositions = [
        { x: 0, z: -30, rotation: 0 },           // Front bench (facing north toward gazebo)
        { x: 5.5, z: -28, rotation: -Math.PI/6 },   // Front-right bench
        { x: 10, z: -24, rotation: -Math.PI/3 },     // Right-front bench
        { x: 10, z: -20, rotation: -2*Math.PI/3 },   // Right-back bench
        { x: 5.5, z: -16, rotation: -5*Math.PI/6 },   // Back-right bench
        { x: 0, z: -14, rotation: Math.PI },          // Back bench (facing south toward gazebo)
        { x: -5.5, z: -16, rotation: 5*Math.PI/6 },   // Back-left bench
        { x: -10, z: -20, rotation: 2*Math.PI/3 },   // Left-back bench
        { x: -10, z: -24, rotation: Math.PI/3 },     // Left-front bench
        { x: -5.5, z: -28, rotation: Math.PI/6 }    // Front-left bench
    ];
    
    benchPositions.forEach(({ x, z, rotation }) => {
        const bench = createParkBench(x, z, rotation);
        frontGroup.add(bench);
        benches.push(bench);
    });
    parkElements.benches = benches;
    
    // Add trees evenly distributed across park area, outside gazebo and benches
    const trees = [];
    const treePositions = [
        // Front area (z: 5 to -10) - outside bench perimeter
        [-30, 2], [-25, 0], [-20, -2], [-15, -4], [-10, -6], [-5, -8],
        [5, -8], [10, -6], [15, -4], [20, -2], [25, 0], [30, 2],
        
        // Middle area (z: -12 to -20) - around gazebo but outside benches
        [-32, -12], [-28, -14], [-24, -16], [-20, -18], [-16, -20],
        [16, -20], [20, -18], [24, -16], [28, -14], [32, -12],
        
        // Back area (z: -22 to -30) - behind gazebo and benches
        [-30, -22], [-26, -24], [-22, -26], [-18, -28], [-14, -30],
        [14, -30], [18, -28], [22, -26], [26, -24], [30, -22],
        
        // Far back area (z: -32 to -42) - extending towards stone wall
        [-28, -32], [-24, -34], [-20, -36], [-16, -38], [0, -40],
        [12, -40], [2, -38], [20, -36], [24, -34], [-2, -32],
        [-26, -42], [-22, -40], [-18, -38], [-4, -36], [-10, -34],
        [10, -34], [6, -36], [18, -38], [22, -40], [26, -42]
    ];
    
    treePositions.forEach(([x, z]) => {
        const tree = createParkTree(x, z, 0.8 + Math.random() * 0.4);
        frontGroup.add(tree);
        trees.push(tree);
    });
    parkElements.trees = trees;
    
    // Add grass scattered around the park (tiny dots, not under gazebo)
    // Grass only on the near side of the street, extending back to where the floor ends
    const grass = [];
    const grassCount = 800; // Adjusted for the smaller area
    for (let i = 0; i < grassCount; i++) {
        // Random position only on the near side of the street (negative Z values)
        // Extend back to where the floor ends (floor is 300x300, so Z goes to -150)
        let x = (Math.random() - 0.5) * 300; // -150 to 150 (full street width)
        let z = -150 + Math.random() * 140; // -150 to -10 (from floor edge to front shops)
        
        // Skip if too close to gazebo (gazebo is at 0, -22 with radius ~5)
        const distanceFromGazebo = Math.sqrt(x * x + (z + 22) * (z + 22));
        if (distanceFromGazebo < 6) continue; // Skip this grass blade
        
        // Skip if in the road area (street is at Z=11, 12 units deep)
        if (z >= 5 && z <= 17) continue; // Skip road area
        
        // Skip if in the near sidewalk area (near sidewalk is at Z=2, 6 units deep)
        if (z >= -1 && z <= 5) continue; // Skip near sidewalk area
        
        // Tiny grass dot
        const grassGeometry = new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 4, 3);
        const grassMaterial = createWireframeMaterial(0x228B22); // Forest green
        const grassBlade = new THREE.Mesh(grassGeometry, grassMaterial);
        grassBlade.position.set(x, 0.01, z);
        frontGroup.add(grassBlade);
        grass.push(grassBlade);
    }
    parkElements.grass = grass;
    
    // Add New England stone wall around the sides and back of the park
    const createParkStoneWall = (startX, startZ, endX, endZ, wallHeight = 1.2) => {
        const wallGroup = new THREE.Group();
        const stoneSize = 0.8;
        
        // Calculate wall direction and length
        const deltaX = endX - startX;
        const deltaZ = endZ - startZ;
        const wallLength = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
        const wallAngle = Math.atan2(deltaZ, deltaX);
        
        // Create stones along the wall length
        for (let i = 0; i < wallLength; i += stoneSize + Math.random() * 0.3) {
            const progress = i / wallLength;
            const stoneX = startX + deltaX * progress;
            const stoneZ = startZ + deltaZ * progress;
            
            // Create wall segment with stacked stones
            for (let y = 0; y < wallHeight; y += stoneSize * 0.7) {
                const stoneGeometry = new THREE.BoxGeometry(
                    stoneSize + Math.random() * 0.4,
                    stoneSize * 0.6 + Math.random() * 0.2,
                    stoneSize * 0.8 + Math.random() * 0.3
                );
                const stoneMaterial = createWireframeMaterial(0x696969); // Stone/brown color
                const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
                stone.position.set(
                    stoneX + (Math.random() - 0.5) * 0.2,
                    y + stoneSize * 0.3,
                    stoneZ + (Math.random() - 0.5) * 0.2
                );
                
                // Slight rotation for natural look
                stone.rotation.y = wallAngle + (Math.random() - 0.5) * 0.3;
                wallGroup.add(stone);
            }
        }
        
        return wallGroup;
    };
    
    // Left side wall (facing east)
    const leftWall = createParkStoneWall(-38, 0, -38, -46);
    frontGroup.add(leftWall);
    
    // Right side wall (facing west) 
    const rightWall = createParkStoneWall(38, 0, 38, -46);
    frontGroup.add(rightWall);
    
    // Back wall (facing north)
    const backWall = createParkStoneWall(-38, -46, 38, -46);
    frontGroup.add(backWall);
    
    // Store wall elements
    parkElements.walls = [leftWall, rightWall, backWall];
    
    console.log("🌳 Created park elements for forest suburban scene");
    return parkElements;
};

// Create glowing wireframe material
export const createGlowingWireframeMaterial = (color, opacity = 1.0, glowIntensity = 0.5) => {
    return new THREE.ShaderMaterial({
        uniforms: {
            baseColor: { value: new THREE.Color(color) },
            opacity: { value: opacity },
            glowIntensity: { value: glowIntensity }
        },
        vertexShader: `
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                vPosition = position;
                vNormal = normal;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 baseColor;
            uniform float opacity;
            uniform float glowIntensity;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                float thickness = 0.05;
                vec3 fdx = vec3(dFdx(vPosition.x), dFdx(vPosition.y), dFdx(vPosition.z));
                vec3 fdy = vec3(dFdy(vPosition.x), dFdy(vPosition.y), dFdy(vPosition.z));
                vec3 normal = normalize(cross(fdx, fdy));
                
                float edgeFactor = abs(dot(normal, normalize(vNormal)));
                edgeFactor = step(1.0 - thickness, edgeFactor);
                
                vec3 finalColor = baseColor * (1.0 + glowIntensity);
                gl_FragColor = vec4(finalColor, opacity * (1.0 - edgeFactor));
            }
        `,
        wireframe: true,
        transparent: true,
        side: THREE.DoubleSide
    });
};

// Create full interior scene (updated version)
export const createInteriorScene = (frontShopsGroup) => {
    const interiorElements = {};
    
    // Bar counter - rotated to be along the left wall
    const barGeometry = new THREE.BoxGeometry(10, 1, 1.5, 2, 1, 1);
    const barMaterial = createWireframeMaterial(0xDA8A67);
    const barCounter = new THREE.Mesh(barGeometry, barMaterial);
    barCounter.rotation.y = Math.PI / 2;
    barCounter.position.set(-8, 1, -7.5);
    barCounter.scale.set(1.02, 1.02, 1.02);
    frontShopsGroup.add(barCounter);
    interiorElements.barCounter = barCounter;
    
    // Bar stools
    const createBarStool = (z) => {
        const stoolGroup = new THREE.Group();
        const seatGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8, 1);
        const seatMaterial = createGlowingWireframeMaterial(0x88CCFF, 1.0, 0.3);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 1;
        stoolGroup.add(seat);
        
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 4, 1);
        const legMaterial = createWireframeMaterial(0x555555);
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.y = 0.5;
        stoolGroup.add(leg);
        
        stoolGroup.position.set(-6.6, 0, z);
        frontShopsGroup.add(stoolGroup);
        return stoolGroup;
    };
    
    interiorElements.barStools = [
        createBarStool(-4), createBarStool(-6), createBarStool(-8), 
        createBarStool(-10), createBarStool(-12)
    ];
    
    // Diner booth creation functions
    const createDinerBooth = (x, z) => {
        const boothGroup = new THREE.Group();
        
        const seatGeometry = new THREE.BoxGeometry(2.2, 0.6, 0.8, 3, 2, 2);
        const seatMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 0.3, 0);
        boothGroup.add(seat);
        
        const backrestGeometry = new THREE.BoxGeometry(2.2, 0.8, 0.2, 3, 2, 1);
        const backrestMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4);
        const backrest = new THREE.Mesh(backrestGeometry, backrestMaterial);
        backrest.position.set(0, 0.9, -0.4);
        boothGroup.add(backrest);
        
        const tableGeometry = new THREE.BoxGeometry(2, 0.1, 0.8, 3, 1, 2);
        const tableMaterial = createGlowingWireframeMaterial(0xFFAA44, 1.0, 0.3);
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(0, 0.65, 0.8);
        boothGroup.add(table);
        
        const legGeometry = new THREE.BoxGeometry(0.08, 0.8, 0.08, 1, 1, 1);
        const legMaterial = createWireframeMaterial(0x8B4513);
        
        ['frontLeft', 'frontRight', 'backLeft', 'backRight'].forEach((pos, i) => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            const xPos = i % 2 === 0 ? 0.85 : -0.85;
            const zPos = i < 2 ? 1.1 : 0.5;
            leg.position.set(xPos, 0.3, zPos);
            boothGroup.add(leg);
        });
        
        const condimentTrayGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.3, 1, 1, 1);
        const condimentTrayMaterial = createWireframeMaterial(0x666666);
        const condimentTray = new THREE.Mesh(condimentTrayGeometry, condimentTrayMaterial);
        condimentTray.position.set(0.7, 0.8, 0.8);
        boothGroup.add(condimentTray);
        
        const shakerGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 6, 1);
        const saltShaker = new THREE.Mesh(shakerGeometry, createWireframeMaterial(0xFFFFFF));
        saltShaker.position.set(0.65, 0.87, 0.75);
        boothGroup.add(saltShaker);
        
        const pepperShaker = new THREE.Mesh(shakerGeometry, createWireframeMaterial(0x222222));
        pepperShaker.position.set(0.75, 0.87, 0.85);
        boothGroup.add(pepperShaker);
        
        boothGroup.position.set(x, 0, z);
        frontShopsGroup.add(boothGroup);
        return boothGroup;
    };
    
    const createOppositeBench = (x, z) => {
        const boothGroup = new THREE.Group();
        
        const seatGeometry = new THREE.BoxGeometry(2.2, 0.6, 0.8, 3, 2, 2);
        const seatMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 0.3, -0.7);
        boothGroup.add(seat);
        
        const backrestGeometry = new THREE.BoxGeometry(2.2, 0.8, 0.2, 3, 2, 1);
        const backrestMaterial = createGlowingWireframeMaterial(0xFF6666, 1.0, 0.4);
        const backrest = new THREE.Mesh(backrestGeometry, backrestMaterial);
        backrest.position.set(0, 0.9, -1.0);
        boothGroup.add(backrest);
        
        boothGroup.position.set(x, 0, z);
        frontShopsGroup.add(boothGroup);
        return boothGroup;
    };
    
    interiorElements.dinerBooths = [];
    const boothSpacing = 2.9;
    const rightWallX = 9.2;
    const startZ = -2;
    
    for (let i = 0; i < 5; i++) {
        const z = startZ - (i * boothSpacing);
        const firstBooth = createDinerBooth(rightWallX - 0.8, z - 0.5);
        firstBooth.rotation.y = 0;
        const secondBooth = createOppositeBench(rightWallX - 0.8, z + 0.5);
        secondBooth.rotation.y = Math.PI;
        interiorElements.dinerBooths.push(firstBooth, secondBooth);
    }
    
    // Tables and chairs
    const createTable = (x, z) => {
        const tableGroup = new THREE.Group();
        const tableGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.5, 2, 1, 2);
        const tableMaterial = createGlowingWireframeMaterial(0xFFAA44, 1.0, 0.3);
        const tableTop = new THREE.Mesh(tableGeometry, tableMaterial);
        tableTop.position.y = 0.75;
        tableGroup.add(tableTop);
        
        const legGeometry = new THREE.BoxGeometry(0.1, 0.75, 0.1, 1, 1, 1);
        const legMaterial = createWireframeMaterial(0x8B4513);
        
        [[0.6, 0.6], [0.6, -0.6], [-0.6, 0.6], [-0.6, -0.6]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x, 0.375, z);
            tableGroup.add(leg);
        });
        
        tableGroup.position.set(x, 0, z);
        frontShopsGroup.add(tableGroup);
        return tableGroup;
    };
    
    const createChair = (x, z, rotation) => {
        const chairGroup = new THREE.Group();
        const seatGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.6, 2, 1, 2);
        const seatMaterial = createGlowingWireframeMaterial(0xAA88FF, 1.0, 0.3);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.y = 0.5;
        chairGroup.add(seat);
        
        const backGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1, 2, 2, 1);
        const backMaterial = createGlowingWireframeMaterial(0xAA88FF, 1.0, 0.3);
        const back = new THREE.Mesh(backGeometry, backMaterial);
        back.position.set(0, 0.8, -0.25);
        chairGroup.add(back);
        
        const legGeometry = new THREE.BoxGeometry(0.05, 0.5, 0.05, 1, 1, 1);
        const legMaterial = createWireframeMaterial(0x666666);
        
        [[0.25, 0.25], [0.25, -0.25], [-0.25, 0.25], [-0.25, -0.25]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x, 0.25, z);
            chairGroup.add(leg);
        });
        
        chairGroup.position.set(x, 0, z);
        chairGroup.rotation.y = rotation;
        frontShopsGroup.add(chairGroup);
        return chairGroup;
    };
    
    const centerTable = createTable(3, -5);
    interiorElements.tables = [centerTable];
    
    interiorElements.chairs = [
        createChair(3, -6, 0), createChair(3, -4, Math.PI),
        createChair(4, -5, -Math.PI / 2), createChair(2, -5, Math.PI / 2)
    ];
    
    const sideTable = createTable(-3, -3);
    interiorElements.tables.push(sideTable);
    interiorElements.chairs.push(
        createChair(-3, -4, 0), createChair(-3, -2, Math.PI),
        createChair(-2, -3, -Math.PI / 2), createChair(-4, -3, Math.PI / 2)
    );
    
    // Karaoke Stage
    const stageGeometry = new THREE.BoxGeometry(8, 0.3, 4, 2, 1, 2);
    const stageMaterial = createWireframeMaterial(0xBF8F00);
    const stage = new THREE.Mesh(stageGeometry, stageMaterial);
    stage.position.set(0, 0.15, -12.5);
    stage.scale.set(1.02, 1.02, 1.02);
    frontShopsGroup.add(stage);
    interiorElements.stage = stage;
    
    // Signup sheet
    const createSignupSheet = () => {
        const sheetGroup = new THREE.Group();
        const paperGeometry = new THREE.BoxGeometry(0.3, 0.01, 0.4, 2, 1, 2);
        const paperMaterial = createWireframeMaterial(0xFFFFFF);
        const paper = new THREE.Mesh(paperGeometry, paperMaterial);
        sheetGroup.add(paper);
        
        for (let i = 0; i < 4; i++) {
            const lineGeometry = new THREE.BoxGeometry(0.25, 0.005, 0.01, 4, 1, 1);
            const lineMaterial = createWireframeMaterial(0x000000);
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.z = -0.15 + i * 0.1;
            sheetGroup.add(line);
        }
        
        const penGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.15, 1, 1, 2);
        const penMaterial = createWireframeMaterial(0x0000FF);
        const pen = new THREE.Mesh(penGeometry, penMaterial);
        pen.position.set(0.15, 0.01, -0.1);
        pen.rotation.y = Math.PI / 4;
        sheetGroup.add(pen);
        
        return sheetGroup;
    };
    
    const signupSheet = createSignupSheet();
    signupSheet.position.set(-7.5, 1.52, -9.5);
    frontShopsGroup.add(signupSheet);
    interiorElements.signupSheet = signupSheet;
    
    // Beer cans
    const createBeerCan = (x, z, customY = null) => {
        const canGroup = new THREE.Group();
        const canGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 6, 1);
        const canMaterial = createWireframeMaterial(0xCCCCCC);
        const can = new THREE.Mesh(canGeometry, canMaterial);
        canGroup.add(can);
        
        const labelGeometry = new THREE.CylinderGeometry(0.101, 0.101, 0.2, 6, 1);
        const labelMaterial = createWireframeMaterial(0xFF0000);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        canGroup.add(label);
        
        canGroup.position.set(x, customY !== null ? customY : 1.0, z);
        frontShopsGroup.add(canGroup);
        return canGroup;
    };
    
    interiorElements.beerCans = [
        createBeerCan(3.2, -5.2), createBeerCan(2.8, -4.8)
    ];
    
    interiorElements.boothBeers = [
        createBeerCan(8.6, -13.3, 1), createBeerCan(8.3, -13.1, 1)
    ];
    
    interiorElements.barBeers = [
        createBeerCan(-8.3, -6, 1.75), createBeerCan(-8.2, -8, 1.75), createBeerCan(-7.9, -12, 1.75)
    ];
    
    // TV/Screen
    const screenGeometry = new THREE.BoxGeometry(7, 2, 0.3, 6, 4, 1);
    const screenMaterial = createWireframeMaterial(0x00FFFF);
    const tvScreen = new THREE.Mesh(screenGeometry, screenMaterial);
    tvScreen.position.set(0, 3.5, -14.9);
    tvScreen.rotation.y = Math.PI;
    frontShopsGroup.add(tvScreen);
    interiorElements.tvScreen = tvScreen;
    
    // Counter on stage
    const counterGeometry = new THREE.BoxGeometry(6, 1.2, 1.5, 4, 3, 2);
    const counterMaterial = createWireframeMaterial(0x8B4513);
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(0, 0.6, -11.25);
    frontShopsGroup.add(counter);
    interiorElements.counter = counter;
    
    const counterTopGeometry = new THREE.BoxGeometry(6.2, 0.1, 1.7, 4, 1, 2);
    const counterTopMaterial = createWireframeMaterial(0xDEB887);
    const counterTop = new THREE.Mesh(counterTopGeometry, counterTopMaterial);
    counterTop.position.set(0, 1.25, -11.25);
    frontShopsGroup.add(counterTop);
    interiorElements.counterTop = counterTop;
    
    return interiorElements;
};

// Create pond scene elements - post-party campfire vibes
export const createPondElements = (frontGroup, PLAZA_CONFIG, scene) => {
    const pondElements = {};
    
    // The Pond - large oval water feature
    const pondGroup = new THREE.Group();
    pondGroup.name = "PondWater";
    const waterMaterial = new THREE.MeshBasicMaterial({ color: 0x1a3a52, side: THREE.DoubleSide });
    
    // Create organic pond shape with multiple segments
    const pondSegments = [];
    
    // Main pond body (irregular oval)
    const mainPondGeometry = new THREE.CircleGeometry(18, 32);
    mainPondGeometry.scale(1.2, 0.7, 1); // More elongated
    const mainPondMaterial = waterMaterial;
    const mainPond = new THREE.Mesh(mainPondGeometry, mainPondMaterial);
    mainPond.rotation.x = -Math.PI / 2;
    mainPond.position.y = -0.15;
    mainPond.position.x = 2; // Offset slightly
    pondGroup.add(mainPond);
    pondSegments.push({x: 2, z: 0, radius: 18, scaleX: 1.2, scaleZ: 0.7});
    
    // Jutting out sections
    const jut1Geometry = new THREE.CircleGeometry(8, 16);
    jut1Geometry.scale(0.8, 1.2, 1);
    const jut1Material = waterMaterial;
    const jut1 = new THREE.Mesh(jut1Geometry, jut1Material);
    jut1.rotation.x = -Math.PI / 2;
    jut1.position.y = -0.15;
    jut1.position.set(-12, -0.15, 8); // Jut out to the left
    pondGroup.add(jut1);
    pondSegments.push({x: -12, z: 8, radius: 8, scaleX: 0.8, scaleZ: 1.2});
    
    const jut2Geometry = new THREE.CircleGeometry(6, 16);
    jut2Geometry.scale(1.3, 0.6, 1);
    const jut2Material = waterMaterial;
    const jut2 = new THREE.Mesh(jut2Geometry, jut2Material);
    jut2.rotation.x = -Math.PI / 2;
    jut2.position.y = -0.15;
    jut2.position.set(15, -0.15, -5); // Jut out to the right
    pondGroup.add(jut2);
    pondSegments.push({x: 15, z: -5, radius: 6, scaleX: 1.3, scaleZ: 0.6});
    
    const jut3Geometry = new THREE.CircleGeometry(5, 16);
    jut3Geometry.scale(0.9, 1.1, 1);
    const jut3Material = waterMaterial;
    const jut3 = new THREE.Mesh(jut3Geometry, jut3Material);
    jut3.rotation.x = -Math.PI / 2;
    jut3.position.y = -0.15;
    jut3.position.set(-8, -0.15, -12); // Jut out to the back-left
    pondGroup.add(jut3);
    pondSegments.push({x: -8, z: -12, radius: 5, scaleX: 0.9, scaleZ: 1.1});
    
    // Pond depth effect (follows main shape)
    const pondDepthGeometry = new THREE.CircleGeometry(16, 32);
    pondDepthGeometry.scale(1.2, 0.7, 1);
    const pondDepthMaterial = waterMaterial;
    const pondDepth = new THREE.Mesh(pondDepthGeometry, pondDepthMaterial);
    pondDepth.rotation.x = -Math.PI / 2;
    pondDepth.position.y = -0.2;
    pondDepth.position.x = 2;
    pondGroup.add(pondDepth);
    
    // Mist particles above pond
    for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const distance = 10 + Math.random() * 8;
        const mistGeometry = new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 4, 4);
        const mistMaterial = createWireframeMaterial(0xCCCCCC, 0.3 + Math.random() * 0.2);
        const mist = new THREE.Mesh(mistGeometry, mistMaterial);
        mist.position.set(
            Math.cos(angle) * distance,
            0.3 + Math.random() * 1.5,
            Math.sin(angle) * distance
        );
        mist.userData.isMist = true;
        pondGroup.add(mist);
    }
    
    pondGroup.position.set(0, 0, 150);
    frontGroup.add(pondGroup);
    pondElements.pond = pondGroup;
    
    const shorePath = createWoodlandTrail(POND_TRAILS.shore,{width:3,name:'PondShoreTrail'});
    frontGroup.add(shorePath);
    pondElements.shorePath=shorePath;

    // Dying Campfire
    const campfireGroup = new THREE.Group();
    
    // Stone fire pit circle
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const stoneGeometry = new THREE.BoxGeometry(
            0.6 + Math.random() * 0.3, 0.4, 0.5 + Math.random() * 0.2
        );
        const stoneMaterial = createWireframeMaterial(0x696969);
        const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
        stone.position.set(Math.cos(angle) * 2, 0.2, Math.sin(angle) * 2);
        stone.rotation.y = angle;
        campfireGroup.add(stone);
    }
    
    // Dying embers
    for (let i = 0; i < 8; i++) {
        const emberGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
        const emberMaterial = createWireframeMaterial(0xFF4500, 1.0);
        const ember = new THREE.Mesh(emberGeometry, emberMaterial);
        ember.position.set((Math.random() - 0.5) * 2, 0.1, (Math.random() - 0.5) * 2);
        ember.userData.isEmber = true;
        campfireGroup.add(ember);
    }
    
    // Smoke/mist rising - create more particles for continuous smoke
    for (let i = 0; i < 8; i++) {
        const smokeGeometry = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 4, 4);
        const smokeMaterial = createWireframeMaterial(0x888888, 0.2 + Math.random() * 0.2);
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.set((Math.random() - 0.5) * 1.5, 1 + i * 0.6, (Math.random() - 0.5) * 1.5);
        smoke.userData.isSmoke = true;
        campfireGroup.add(smoke);
    }
    
    campfireGroup.position.set(50, 0, -20);
    frontGroup.add(campfireGroup);
    pondElements.campfire = campfireGroup;
    
    // Log benches around fire
    const logBenches = [];
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const logGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        const logMaterial = createWireframeMaterial(0x8B4513);
        const log = new THREE.Mesh(logGeometry, logMaterial);
        log.rotation.z = Math.PI / 2;
        log.position.set(50 - Math.cos(angle) * 6, 0.3, -20 + Math.sin(angle) * 6); // Flipped horizontally by negating X offset
        
        // Flip all benches by 90 degrees to be perpendicular to radial lines
        log.rotation.y = angle + Math.PI / 2;
        
        frontGroup.add(log);
        logBenches.push(log);
    }
    pondElements.logBenches = logBenches;
    
    // Tent 1
    const tent1Group = new THREE.Group();
    const tent1Geometry = new THREE.ConeGeometry(2, 2.5, 4);
    const tent1Material = createWireframeMaterial(0x4cbf3a);
    const tent1 = new THREE.Mesh(tent1Geometry, tent1Material);
    tent1.position.y = 1.25;
    tent1.rotation.y = Math.PI / 4;
    tent1.scale.set(1.5, 1.5, 1.5);
    tent1Group.add(tent1);
    tent1Group.position.set(54, .5, -39);
    frontGroup.add(tent1Group);
    pondElements.tent1 = tent1Group;
    
    // Tent 2
    const tent2Group = new THREE.Group();
    const tent2Geometry = new THREE.ConeGeometry(2.2, 2.8, 4);
    const tent2Material = createWireframeMaterial(0xfb8463);
    const tent2 = new THREE.Mesh(tent2Geometry, tent2Material);
    tent2.position.y = 1.4;
    tent2.rotation.y = -Math.PI / 6;
    tent1.scale.set(1.6, 1.6, 1.6);
    tent2Group.add(tent2);
    tent2Group.position.set(70, 0, -32);
    frontGroup.add(tent2Group);
    pondElements.tent2 = tent2Group;
    
    // Picnic table
    const tableGroup = new THREE.Group();
    const tableTopGeometry = new THREE.BoxGeometry(4, 0.15, 2);
    const tableMaterial = createWireframeMaterial(0x8B7355);
    const tableTop = new THREE.Mesh(tableTopGeometry, tableMaterial);
    tableTop.position.y = 1;
    tableGroup.add(tableTop);
    
    // Table legs
    const legGeometry = new THREE.BoxGeometry(0.15, 1, 0.15);
    [[1.8, 0.8], [1.8, -0.8], [-1.8, 0.8], [-1.8, -0.8]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(legGeometry, tableMaterial);
        leg.position.set(x, 0.5, z);
        tableGroup.add(leg);
    });
    
    // Benches
    [-1.5, 1.5].forEach(zOffset => {
        const benchGeometry = new THREE.BoxGeometry(3.5, 0.12, 0.6);
        const bench = new THREE.Mesh(benchGeometry, tableMaterial);
        bench.position.set(0, 0.5, zOffset);
        tableGroup.add(bench);
    });
    
    tableGroup.position.set(40, 0, -10);
    frontGroup.add(tableGroup);
    pondElements.picnicTable = tableGroup;
    
    // Second picnic table
    const tableGroup2 = new THREE.Group();
    const tableTopGeometry2 = new THREE.BoxGeometry(4, 0.15, 2);
    const tableMaterial2 = createWireframeMaterial(0x8B7355);
    const tableTop2 = new THREE.Mesh(tableTopGeometry2, tableMaterial2);
    tableTop2.position.y = 1;
    tableGroup2.add(tableTop2);
    
    // Table legs
    const legGeometry2 = new THREE.BoxGeometry(0.15, 1, 0.15);
    [[1.8, 0.8], [1.8, -0.8], [-1.8, 0.8], [-1.8, -0.8]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(legGeometry2, tableMaterial2);
        leg.position.set(x, 0.5, z);
        tableGroup2.add(leg);
    });
    
    // Benches
    [-1.5, 1.5].forEach(zOffset => {
        const benchGeometry = new THREE.BoxGeometry(3.5, 0.12, 0.6);
        const bench = new THREE.Mesh(benchGeometry, tableMaterial2);
        bench.position.set(0, 0.5, zOffset);
        tableGroup2.add(bench);
    });
    
    tableGroup2.position.set(65, 0, -20);
    tableGroup2.rotation.y = Math.PI / 2;
    frontGroup.add(tableGroup2);
    pondElements.picnicTable2 = tableGroup2;
    
    // Blankets
    const blankets = [];
    const blanketPositions = [
        {x: 41.5, z: -23, color: 0x8B0000, rotation: 0.3},   // Campsite area
        {x: 47, z: -12, color: 0x4169E1, rotation: -0.5},  // Campsite area
        {x: 58, z: -18, color: 0x9932CC, rotation: 0.8},   // Campsite area
        {x: 38, z: -25, color: 0xFF6347, rotation: -0.2}   // Campsite area
    ];
    
    blanketPositions.forEach(({x, z, color, rotation}) => {
        const blanketGeometry = new THREE.PlaneGeometry(2.5, 2);
        const blanketMaterial = createWireframeMaterial(color);
        const blanket = new THREE.Mesh(blanketGeometry, blanketMaterial);
        blanket.rotation.x = -Math.PI / 2;
        blanket.rotation.z = rotation;
        blanket.position.set(x, 0.02, z);
        frontGroup.add(blanket);
        blankets.push(blanket);
    });
    pondElements.blankets = blankets;
    
    // Tree stumps
    const stumps = [];
    const stumpPositions = [
        {x: 53, z: -12}, {x: 44, z: -28}, {x: 55, z: -22},  // Campsite area
        {x: 41, z: -15}, {x: 50, z: -26}, {x: 46, z: -32}   // Campsite area
    ];
    
    stumpPositions.forEach(({x, z}) => {
        const stumpGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.6, 8);
        const stumpMaterial = createWireframeMaterial(0x654321);
        const stump = new THREE.Mesh(stumpGeometry, stumpMaterial);
        stump.position.set(x, 0.3, z);
        frontGroup.add(stump);
        stumps.push(stump);
    });
    pondElements.stumps = stumps;
    
    // Cooler
    const coolerGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.7);
    const coolerMaterial = createWireframeMaterial(0xFF0000);
    const cooler = new THREE.Mesh(coolerGeometry, coolerMaterial);
    cooler.position.set(43, 0.4, -22);
    frontGroup.add(cooler);
    
    const lidGeometry = new THREE.BoxGeometry(1.25, 0.1, 0.75);
    const lidMaterial = createWireframeMaterial(0xFFFFFF);
    const lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.set(43, 0.9, -22);
    lid.rotation.z = 0.03;
    lid.rotation.y = 0.23;
    frontGroup.add(lid);
    
    // Red solo cups
    const cups = [];
    const cupPositions = [
        // All cups around campsite area
        {x: 48, z: -15, tipped: false}, {x: 46, z: -20, tipped: true},
        {x: 51, z: -25, tipped: false}, {x: 49, y: 0.1, z: -25, tipped: true},
        {x: 54, z: -23, tipped: false}, {x: 42, z: -26, tipped: true},
        {x: 52, z: -27, tipped: false}, {x: 44, z: -30, tipped: true},
        {x: 43, z: -15, tipped: false}, {x: 55, z: -17, tipped: true},
        {x: 41, z: -22, tipped: false}, {x: 57, z: -28, tipped: true}
    ];
    
    cupPositions.forEach(({x, z, tipped}) => {
        const cupGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.4, 8);
        const cupMaterial = createWireframeMaterial(0xFF0000);
        const cup = new THREE.Mesh(cupGeometry, cupMaterial);
        
        if (tipped) {
            cup.rotation.z = Math.PI / 2;
            cup.position.set(x, 0.1, z);
        } else {
            cup.position.set(x, 0.2, z);
        }
        
        frontGroup.add(cup);
        cups.push(cup);
    });
    pondElements.cups = cups;
    
    const leftPathGroup=createWoodlandTrail(POND_TRAILS.pond,{name:'PondApproachTrail'});
    const rightPathGroup=createWoodlandTrail(POND_TRAILS.campsite,{width:3,name:'CampsiteTrail'});
    frontGroup.add(leftPathGroup,rightPathGroup);
    pondElements.leftPath=leftPathGroup;pondElements.rightPath=rightPathGroup;

    // Collect all campsite objects for animation, ordered by proximity to campfire
    // Objects closer to campfire (index 0) will glow more intensely, further objects glow more gently
    const campsiteObjects = [
        campfireGroup, // Include the entire campfire group (rocks, base, etc.) - closest
        ...logBenches, // Log benches around the fire - very close
        ...stumps, // Tree stumps near the fire - close
        ...cups, // Cups scattered around fire area - close
        cooler, // Cooler near the fire - close
        lid, // Cooler lid - close
        ...blankets, // Blankets around fire area - medium distance
        tent2Group, // Tent 2 - medium distance
        tent1Group, // Tent 1 - medium distance
        tableGroup2, // Picnic table 2 - furthest away
        tableGroup, // Picnic table 1 - further away
        leftPathGroup, // Left path to pond - medium distance
        rightPathGroup, // Right path to campsite - medium distance
        pondGroup // Pond area - furthest away, gentle glow
    ];
    pondElements.campsiteObjects = campsiteObjects;
    
    // Create clouds for the pond scene
    const clouds = createClouds(scene);
    pondElements.clouds = clouds;
    
    console.log("🏕️ Created pond scene with post-party campfire vibes");
    return pondElements;
};

// Create clouds for pond scene - scaled for 1000x1000 unified map
const createClouds = (scene) => {
    const clouds = [];
    
    // Create several clouds at different positions
    const cloudCount = 400;
    for (let i = 0; i < cloudCount; i++) {
        const cloud = new THREE.Group();
        
        // Create multiple boxes for each cloud
        const particleCount = Math.floor(Math.random() * 3) + 2; // 2-5 particles
        for (let j = 0; j < particleCount; j++) {
            const width = Math.random() * 20 + 15;  // 15-35
            const height = Math.random() * 20 + 45;;    // 3-8
            const depth = Math.random() * 10 + 8;    // 8-18
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshBasicMaterial({
                color: 0xBFBFBF,
                transparent: true,
                opacity: 0.0 // Start at 0, will fade in
            });
            const particle = new THREE.Mesh(geometry, material);
            
            // Position each box slightly offset from center
            particle.position.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 15
            );
            
            // Slight random rotation for variety
            particle.rotation.z = (Math.random() - 0.5) * 0.2;
            
            cloud.add(particle);
        }
        
        // Position cloud in sky - scaled for 1000x1000 unified map
        cloud.position.set(
            (Math.random() - 0.5) * 1000,  // Spread clouds (x: -500 to 500)
            60 + Math.random() * 80,        // Height (y: 60-140)
            (Math.random() - 0.5) * 1000   // Spread along z-axis (z: -500 to 500)
        );
        
        // Store movement properties and fade timing
        cloud.userData = {
            speed: 0.1 + Math.random() * 0.2,
            originalX: cloud.position.x,
            fadePhase: -Math.PI / 2 + (Math.random() - 0.5) * 0.5, // Start at 0 opacity with slight random offset for staggered fade
            fadeSpeed: 0.0001 + Math.random() * 0.0005, // Slower fade speeds (0.0001 to 0.0002) for longer fade cycles
            maxOpacity: 0.6 + Math.random() * 0.2 // Maximum opacity (0.6 to 0.8) - fades from 0.0 to this and back
        };
        
        scene.add(cloud);
        clouds.push(cloud);
    }
    
    return clouds;
};

// =====================================================
// INTERIOR SCENE CREATION FUNCTIONS
// =====================================================

// Create Grumby's convenience store interior
export * from './buildings/interiors.js';
