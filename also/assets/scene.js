function renderScene(ctx, width, height, sceneType) {
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up color palettes for different scenes
    const palettes = {
        snowy: {
            sky: '#e8f4f8',
            mountains: [
                { color: '#d3d3d3', height: 0.7 },  // Gray mountains (bottom)
                { color: '#e8e8e8', height: 0.6 },  // Light gray mountains (middle)
                { color: '#ffffff', height: 0.5 }   // White mountains (top/snow)
            ],
            ground: '#f0f0f0'
        },
        forest: {
            sky: '#e0f0e8',
            mountains: [
                { color: '#2d4d25', height: 0.7 },  // Dark green (bottom)
                { color: '#3a6a30', height: 0.6 },  // Medium green (middle)
                { color: '#4d8642', height: 0.5 }   // Light green (top)
            ],
            ground: '#5a9c4f'
        },
        hills: {
            sky: '#e8f0e0',
            mountains: [
                { color: '#70a058', height: 0.7 },  // Dark green-yellow (bottom)
                { color: '#8cb878', height: 0.6 },  // Medium green-yellow (middle)
                { color: '#a8d090', height: 0.5 }   // Light green-yellow (top)
            ],
            ground: '#b8e0a0'
        },
        autumn: {
            sky: '#f0e8d8',
            mountains: [
                { color: '#8b5a2b', height: 0.7 },  // Brown (bottom)
                { color: '#b0742f', height: 0.6 },  // Medium brown (middle)
                { color: '#d98c41', height: 0.5 }   // Orange (top)
            ],
            ground: '#e2a76f'
        },
        desert: {
            sky: '#f8e8d8',
            mountains: [
                { color: '#a0784a', height: 0.7 },  // Dark sand (bottom)
                { color: '#c8965a', height: 0.6 },  // Medium sand (middle)
                { color: '#e0b06a', height: 0.5 }   // Light sand (top)
            ],
            ground: '#e8c088'
        },
        mourning: {
            sky: '#2a2a30',
            buildings: [
                { color: '#1a1a20', height: 0.8 },  // Dark buildings (back)
                { color: '#252530', height: 0.7 },  // Medium buildings (middle) 
                { color: '#303040', height: 0.6 }   // Light buildings (front)
            ],
            ground: '#1a1a1a'
        }
    };
    
    const palette = palettes[sceneType];
    
    // Draw sky
    ctx.fillStyle = sceneType === 'mourning' ? palette.sky : palette.sky;
    ctx.fillRect(0, 0, width, height);
    
    if (sceneType === 'mourning') {
        // Draw cityscape/skyline for mourning scene
        drawCityscape(ctx, width, height, palette);
    } else {
        // Draw mountains for nature scenes
        drawMountains(ctx, width, height, palette);
    }
}

/**
 * Draw a mountain range
 */
function drawMountains(ctx, width, height, palette) {
    // Draw each mountain layer
    palette.mountains.forEach(mountain => {
        drawMountainRange(ctx, width, height, mountain.color, mountain.height);
    });
    
    // Draw ground
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, height * 0.8, width, height * 0.2);
}

/**
 * Draw a cityscape skyline
 */
function drawCityscape(ctx, width, height, palette) {
    // Draw each building layer
    palette.buildings.forEach(layer => {
        drawBuildings(ctx, width, height, layer.color, layer.height);
    });
    
    // Draw ground
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, height * 0.8, width, height * 0.2);
    
    // Add some stars in the sky for the nighttime cityscape
    drawStars(ctx, width, height);
    
    // Add some building lights
    drawBuildingLights(ctx, width, height);
}

/**
 * Draw a mountain range with a specified color and relative height
 */
function drawMountainRange(ctx, width, height, color, relativeHeight) {
    const peakCount = 5 + Math.floor(Math.random() * 3);
    const segmentWidth = width / peakCount;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.8); // Start at bottom left
    
    // Create peaks with random heights
    for (let i = 0; i <= peakCount; i++) {
        const x = i * segmentWidth;
        const randomHeight = height * relativeHeight * (0.7 + Math.random() * 0.3);
        const y = height - randomHeight;
        
        if (i === 0) {
            ctx.lineTo(x, y);
        } else {
            // Create more natural looking mountains with bezier curves
            const prevX = (i - 1) * segmentWidth;
            const controlX = prevX + (x - prevX) / 2;
            const controlY = height - (Math.random() * height * relativeHeight * 0.8);
            
            ctx.quadraticCurveTo(controlX, controlY, x, y);
        }
    }
    
    // Complete the shape
    ctx.lineTo(width, height * 0.8);
    ctx.lineTo(0, height * 0.8);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw buildings for cityscape
 */
function drawBuildings(ctx, width, height, color, relativeHeight) {
    const buildingCount = 12 + Math.floor(Math.random() * 8);
    const buildingWidth = width / buildingCount;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.8); // Start at bottom left
    
    // Create buildings with varying heights
    for (let i = 0; i < buildingCount; i++) {
        const x = i * buildingWidth;
        const buildingHeight = height * relativeHeight * (0.6 + Math.random() * 0.4);
        const y = height - buildingHeight;
        
        // Building left edge
        ctx.lineTo(x, y);
        
        // Building top (may include small variations for interest)
        if (Math.random() > 0.7) {
            // Building with antenna or structure on top
            const antennaHeight = buildingHeight * 0.15;
            ctx.lineTo(x + buildingWidth * 0.4, y);
            ctx.lineTo(x + buildingWidth * 0.5, y - antennaHeight);
            ctx.lineTo(x + buildingWidth * 0.6, y);
        }
        
        // Building right edge
        ctx.lineTo(x + buildingWidth, y);
    }
    
    // Complete the shape
    ctx.lineTo(width, height * 0.8);
    ctx.lineTo(0, height * 0.8);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw stars in the night sky
 */
function drawStars(ctx, width, height) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.6; // Only in top 60% (sky area)
        const size = Math.random() * 2;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Draw lights in the buildings
 */
function drawBuildingLights(ctx, width, height) {
    ctx.fillStyle = 'rgba(255, 255, 100, 0.8)';
    
    // Draw random lights in the buildings area
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * width;
        const y = height * 0.4 + Math.random() * height * 0.4; // Building area
        const size = 1 + Math.random() * 2;
        
        // Only show some lights (buildings are not fully lit)
        if (Math.random() > 0.7) {
            ctx.beginPath();
            ctx.rect(x, y, size, size);
            ctx.fill();
        }
    }
} 