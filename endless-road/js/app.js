// Main scene variables
let scene, camera, renderer;
let roadGroup, skybox, sun, moon;
let ambientLight, directionalLight;
let isNight = false;
let speed = 1.0;
let groundPlane; // Reference to the ground plane for opacity changes
let sunObject; // Reference to the sun object
let clouds = []; // Reference to cloud objects
let mountains = [];
let dayNightCycle = 0; // 0 to 2π for full day/night cycle
let dayNightSpeed = 0.001; // Speed of day/night cycle
let specks = []; // Added specks array
const celestialPathOffset = 160; // Right of the road, toward the mountain range.
let lunarPhase = 0; // Full moon initially; one lunar cycle per eight day/night cycles.
const sunPathRadius = 400; // Increased radius for sun/moon path
const sunPathHeight = 300; // Maximum height of sun/moon

// Scene transition variables
const scenes = ['desert', 'forest', 'snowy', 'city'];
let currentSceneIndex = 0;
let nextSceneIndex = 0;
let isSceneTransitioning = false;
let sceneTransitionProgress = 0;
const sceneTransitionDuration = 10000; // 10 seconds for transition
let lastSceneChangeTime = 0;
const sceneChangeDuration = 30000; // 30 seconds between scene changes

// Scene-specific color palettes
const palettes = {
    desert: [
        new THREE.Color(0xC2B280),
        new THREE.Color(0xD2B48C),
        new THREE.Color(0xF4A460),
        new THREE.Color(0xDEB887),
        new THREE.Color(0x8B4513)
    ],
    forest: [
        new THREE.Color(0x228B22),
        new THREE.Color(0x2E8B57),
        new THREE.Color(0x6B8E23),
        new THREE.Color(0x8FBC8F),
        new THREE.Color(0x006400)
    ],
    snowy: [
        new THREE.Color(0xFFFFFF),
        new THREE.Color(0xF0F8FF),
        new THREE.Color(0xE0FFFF),
        new THREE.Color(0xF5F5F5),
        new THREE.Color(0xD3D3D3)
    ],
    city: [
        new THREE.Color(0x808080),
        new THREE.Color(0x696969),
        new THREE.Color(0xA9A9A9),
        new THREE.Color(0xDCDCDC),
        new THREE.Color(0xC0C0C0)
    ]
};

// Scene-specific color palettes and lighting states
const sceneStates = {
    desert: {
        dayColors: {
            ground: new THREE.Color(0xC2B280),
            sky: new THREE.Color(0x87CEEB),
            ambient: 1.0
        },
        nightColors: {
            ground: new THREE.Color(0x3B3530),
            sky: new THREE.Color(0x000033),
            ambient: 0.3
        }
    },
    forest: {
        dayColors: {
            ground: new THREE.Color(0x228B22),
            sky: new THREE.Color(0x87CEEB),
            ambient: 1.0
        },
        nightColors: {
            ground: new THREE.Color(0x0B2F0B),
            sky: new THREE.Color(0x000033),
            ambient: 0.3
        }
    },
    snowy: {
        dayColors: {
            ground: new THREE.Color(0xFFFFFF),
            sky: new THREE.Color(0xB0E0E6),
            ambient: 1.0
        },
        nightColors: {
            ground: new THREE.Color(0xCCCCCC),
            sky: new THREE.Color(0x000033),
            ambient: 0.3
        }
    },
    city: {
        dayColors: {
            ground: new THREE.Color(0x808080),
            sky: new THREE.Color(0x87CEEB),
            ambient: 1.0
        },
        nightColors: {
            ground: new THREE.Color(0x202020),
            sky: new THREE.Color(0x000033),
            ambient: 0.3
        }
    }
};

// Object definitions for each scene
const sceneObjects = {
    desert: {
        createObject: (scale = 1) => {
            const group = new THREE.Group();
            const type = Math.random();
            
            if (type < 0.33) {
                // Cactus
                const height = (Math.random() * 3 + 1) * scale;
                const geo = new THREE.CylinderGeometry(0.2 * scale, 0.2 * scale, height, 8);
                const mat = new THREE.MeshBasicMaterial({ color: 0x228B22 });
                const cactus = new THREE.Mesh(geo, mat);
                group.add(cactus);
                
                if (Math.random() > 0.5) {
                    const armGeo = new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, Math.random() * 2 * scale, 8);
                    const arm = new THREE.Mesh(armGeo, mat);
                    arm.position.y = Math.random() * 2 * scale;
                    arm.position.x = (Math.random() > 0.5 ? 0.3 : -0.3) * scale;
                    arm.rotation.z = Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4;
                    group.add(arm);
                }
            } else if (type < 0.66) {
                // Rock
                const geo = new THREE.DodecahedronGeometry((Math.random() * 0.5 + 0.2) * scale);
                const mat = new THREE.MeshBasicMaterial({ color: 0x808080 });
                const rock = new THREE.Mesh(geo, mat);
                group.add(rock);
            } else {
                // Desert shrub
                const geo = new THREE.SphereGeometry((Math.random() * 0.5 + 0.2) * scale, 8, 8);
                const mat = new THREE.MeshBasicMaterial({ color: 0x556B2F });
                const shrub = new THREE.Mesh(geo, mat);
                group.add(shrub);
            }
            return group;
        }
    },
    forest: {
        createObject: (scale = 1) => {
            const group = new THREE.Group();
            const type = Math.random();
            
            if (type < 0.5) {
                // Tree
                const height = (Math.random() * 10 + 5) * scale;
                
                // Forest color palette
                const trunkColors = [0x4A3728, 0x5D4037, 0x6D4C41, 0x3E2723]; // Brown shades
                const foliageColors = [0x228B22, 0x006400, 0x2E8B57, 0x3CB371, 0x556B2F]; // Green shades
                
                // Calculate trunk and foliage proportions
                const trunkHeight = height * 0.4;  // Trunk takes 40% of total height
                const foliageHeight = height * 0.7; // Foliage takes 70% of total height
                
                // Create trunk (brown cylinder)
                const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, trunkHeight, 8);
                const trunkMat = new THREE.MeshBasicMaterial({ 
                    color: trunkColors[Math.floor(Math.random() * trunkColors.length)] 
                });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                
                // Position trunk with bottom at y=0 (ground level)
                trunk.position.y = trunkHeight / 2;
                
                // Create foliage (green cone)
                const leavesGeo = new THREE.ConeGeometry(2 * scale, foliageHeight, 8);
                const leavesMat = new THREE.MeshBasicMaterial({ 
                    color: foliageColors[Math.floor(Math.random() * foliageColors.length)] 
                });
                const leaves = new THREE.Mesh(leavesGeo, leavesMat);
                
                // Position leaves to extend further down, but not to the ground
                // Bottom of cone positioned at trunkHeight * 0.3 to extend lower but not to ground
                leaves.position.y = trunkHeight * 0.3 + foliageHeight / 2;
                
                group.add(trunk);
                group.add(leaves);
            } else if (type < 0.75) {
                // Forest rock
                const geo = new THREE.DodecahedronGeometry((Math.random() * 0.5 + 0.2) * scale);
                const mat = new THREE.MeshBasicMaterial({ color: 0x696969 });
                const rock = new THREE.Mesh(geo, mat);
                group.add(rock);
            } else {
                // Bush
                const geo = new THREE.SphereGeometry((Math.random() * 1 + 0.5) * scale, 8, 8);
                const bushColors = [0x228B22, 0x006400, 0x2E8B57, 0x3CB371, 0x556B2F]; // Green shades
                const mat = new THREE.MeshBasicMaterial({ 
                    color: bushColors[Math.floor(Math.random() * bushColors.length)] 
                });
                const bush = new THREE.Mesh(geo, mat);
                group.add(bush);
            }
            return group;
        }
    },
    snowy: {
        createObject: (scale = 1) => {
            const group = new THREE.Group();
            const type = Math.random();
            
            if (type < 0.4) {
                // Snow-covered pine
                const height = (Math.random() * 8 + 4) * scale;
                const layers = 5;
                const layerHeight = height / layers;
                
                for (let i = 0; i < layers; i++) {
                    const coneGeo = new THREE.ConeGeometry((1 - i/layers) * 2 * scale, layerHeight, 8);
                    const coneMat = new THREE.MeshBasicMaterial({ color: 0xF0FFF0 });
                    const cone = new THREE.Mesh(coneGeo, coneMat);
                    cone.position.y = i * layerHeight;
                    group.add(cone);
                }
            } else if (type < 0.7) {
                // Snow mound
                const geo = new THREE.SphereGeometry((Math.random() * 1 + 0.5) * scale, 8, 8);
                const mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
                const mound = new THREE.Mesh(geo, mat);
                group.add(mound);
            } else {
                // Ice crystal
                const geo = new THREE.OctahedronGeometry((Math.random() * 0.5 + 0.2) * scale);
                const mat = new THREE.MeshBasicMaterial({ color: 0xE0FFFF, transparent: true, opacity: 0.7 });
                const crystal = new THREE.Mesh(geo, mat);
                group.add(crystal);
            }
            return group;
        }
    },
    city: {
        createObject: (scale = 1) => {
            const group = new THREE.Group();
            const type = Math.random();
            
            if (type < 0.4) {
                // Street light
                const height = (Math.random() * 4 + 3) * scale;
                const poleGeo = new THREE.CylinderGeometry(0.1 * scale, 0.15 * scale, height, 8);
                const poleMat = new THREE.MeshBasicMaterial({ color: 0x696969 });
                const pole = new THREE.Mesh(poleGeo, poleMat);
                
                const lampGeo = new THREE.SphereGeometry(0.3 * scale, 8, 8);
                const lampMat = new THREE.MeshBasicMaterial({ color: 0xFFFF99, transparent: true, opacity: 0.5 });
                const lamp = new THREE.Mesh(lampGeo, lampMat);
                lamp.position.y = height * 0.5;
                
                group.add(pole);
                group.add(lamp);
            } else if (type < 0.7) {
                // Traffic sign
                const poleGeo = new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 2 * scale, 8);
                const poleMat = new THREE.MeshBasicMaterial({ color: 0x808080 });
                const pole = new THREE.Mesh(poleGeo, poleMat);
                
                const signGeo = new THREE.BoxGeometry(0.8 * scale, 0.8 * scale, 0.1 * scale);
                const signMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
                const sign = new THREE.Mesh(signGeo, signMat);
                sign.position.y = 1 * scale;
                
                group.add(pole);
                group.add(sign);
            } else {
                // Fire hydrant
                const baseGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 0.8 * scale, 8);
                const baseMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
                const base = new THREE.Mesh(baseGeo, baseMat);
                
                const topGeo = new THREE.SphereGeometry(0.2 * scale, 8, 8);
                const top = new THREE.Mesh(topGeo, baseMat);
                top.position.y = 0.5 * scale;
                
                group.add(base);
                group.add(top);
            }
            return group;
        }
    }
};

// Object arrays
let roadSegments = [], streetLamps = [], buildings = [], stars = [], desertObjects = [];
let leftEdgeLine, rightEdgeLine, leftYellowLine, rightYellowLine; // Continuous road lines
let laneLines = [], centerDashes = [];

// Constants
const roadWidth = 10, roadLength = 100, segmentCount = 100; // Increased length and segments
const totalRoadLength = roadLength * segmentCount * 4; // Quadrupled for extra visibility
const lampHeight = 10, lampSpacing = 30;
const speckCount = 2000;
const dashLength = 1, dashSpacing = 10;
const fadeDelay = 5000; // 5 seconds before UI fades

// Mountain positioning constants
const mountainZoneStart = roadWidth/2 + 150; // Distance from road center to start of mountain zone
const mountainZoneWidth = 400; // Width of the mountain zone

// Camera controls
const moveSpeed = 0.5;
const keysPressed = {};
let cameraTarget = new THREE.Vector3(2, 0, -40);
const rearSceneryDistance = 400;
// Wide mountain silhouettes remain in side views long after nearby scenery passes.
const rearMountainFadeStart = 900;
const rearMountainDistance = 1200;
const viewNames = ['Front', 'Right', 'Back', 'Left'];
let cameraViewIndex = 0;

function setCameraView(index) {
    cameraViewIndex = index % viewNames.length;
    const yaw = cameraViewIndex * Math.PI / 2;
    cameraTarget.set(camera.position.x + Math.sin(yaw) * 40,
        camera.position.y - 2.5, camera.position.z - Math.cos(yaw) * 40);
    camera.lookAt(cameraTarget);
    const button = document.getElementById('view-cycle');
    if (button) button.textContent = `View: ${viewNames[cameraViewIndex]} (R)`;
}

function cycleCameraView() {
    setCameraView(cameraViewIndex + 1);
}

// Add at the top with other variables
let statusDisplay;

// Add at the top with other variables
const DEBUG = {
    enabled: true,
    menu: null,
    logs: [],
    maxLogs: 100,
    variables: {
        speed: { value: 1.0, min: 0, max: 2, step: 0.1, label: 'Road Travel Speed' },
        moveSpeed: { value: 0.5, min: 0.1, max: 2, step: 0.1, label: 'Camera Move Speed' },
        dayNightSpeed: { value: 0.001, min: 0, max: 0.01, step: 0.0001, label: 'Day/Night Cycle Speed' },
        sceneTransitionDuration: { value: 10000, min: 1000, max: 20000, step: 1000, label: 'Scene Transition Duration (ms)' },
        speckCount: { value: 5000, min: 0, max: 10000, step: 100, label: 'Ground Speck Count' },
        speckSize: { value: 0.5, min: 0.1, max: 2.0, step: 0.1, label: 'Ground Speck Size' },
        starCount: { value: 8000, min: 0, max: 20000, step: 100, label: 'Star Count' },
        starSize: { value: 2.0, min: 0.1, max: 5.0, step: 0.1, label: 'Star Size' },
        starSpread: { value: 0.8, min: 0.1, max: 1.0, step: 0.1, label: 'Star Spread (Height)' },
        starDistance: { value: 600, min: 400, max: 1200, step: 50, label: 'Star Distance' },
        starTwinkleSpeed: { value: 0.05, min: 0, max: 0.1, step: 0.001, label: 'Star Twinkle Speed' },
        buildingDensity: { value: 10, min: 0, max: 30, step: 1, label: 'Building Count' },
        objectDensity: { value: 15, min: 0, max: 30, step: 1, label: 'Scene Object Count' }
    },
    toggles: {
        showFPS: { value: false, label: 'Show FPS Counter' },
        showRoad: { value: true, label: 'Show Road' },
        showTraffic: { value: true, label: 'Show Oncoming Traffic' },
        showBuildings: { value: true, label: 'Show Buildings' },
        showMountains: { value: true, label: 'Show Mountains' },
        showStreetLamps: { value: true, label: 'Show Street Lamps' },
        showSceneObjects: { value: true, label: 'Show Scene Objects' },
        showStars: { value: true, label: 'Show Stars' },
        showSpecks: { value: true, label: 'Show Ground Specks' },
        autoRotateScenes: { value: true, label: 'Auto Rotate Scenes' },
        showLogs: { value: true, label: 'Show Debug Logs' }
    },
    sceneObjectsState: {
        desert: true,
        forest: true,
        snowy: true,
        city: true
    },
    presets: {
        default: null,
        saved: {}
    },
    savePreset: function(name) {
        const preset = {
            variables: {},
            toggles: {},
            sceneObjectsState: { ...this.sceneObjectsState }
        };
        
        // Save all variable values
        Object.entries(this.variables).forEach(([key, config]) => {
            preset.variables[key] = config.value;
        });
        
        // Save all toggle states
        Object.entries(this.toggles).forEach(([key, config]) => {
            preset.toggles[key] = config.value;
        });
        
        this.presets.saved[name] = preset;
        this.savePresetsToLocalStorage();
        log(`Saved preset: ${name}`, 'info');
    },
    
    loadPreset: function(name) {
        const preset = name === 'default' ? this.presets.default : this.presets.saved[name];
        if (!preset) {
            log(`Preset not found: ${name}`, 'error');
            return;
        }
        
        // Load variable values
        Object.entries(preset.variables).forEach(([key, value]) => {
            if (this.variables[key]) {
                this.variables[key].value = value;
            }
        });
        
        // Load toggle states
        Object.entries(preset.toggles).forEach(([key, value]) => {
            if (this.toggles[key]) {
                this.toggles[key].value = value;
            }
        });
        
        // Load scene object states
        if (preset.sceneObjectsState) {
            this.sceneObjectsState = { ...preset.sceneObjectsState };
        }
        
        log(`Loaded preset: ${name}`, 'info');
        
        // Update any necessary components
        updateStars();
        createBuildings();
    },
    
    savePresetsToLocalStorage: function() {
        try {
            localStorage.setItem('endlessRoadPresets', JSON.stringify(this.presets.saved));
            log('Presets saved to local storage', 'info');
        } catch (error) {
            log('Failed to save presets to local storage', 'error');
        }
    },
    
    loadPresetsFromLocalStorage: function() {
        try {
            const saved = localStorage.getItem('endlessRoadPresets');
            if (saved) {
                this.presets.saved = JSON.parse(saved);
                log('Loaded presets from local storage', 'info');
            }
        } catch (error) {
            log('Failed to load presets from local storage', 'error');
        }
    }
};

// Add logging utility functions
function log(message, type = 'info') {
    if (!DEBUG.enabled) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { message, type, timestamp };
    
    DEBUG.logs.unshift(logEntry);
    if (DEBUG.logs.length > DEBUG.maxLogs) {
        DEBUG.logs.pop();
    }
    
    // Also log to console with appropriate styling
    const styles = {
        info: 'color: #4CAF50',
        warn: 'color: #FFC107',
        error: 'color: #F44336'
    };
    console.log(`%c[${timestamp}] ${message}`, styles[type]);
    
    updateDebugLogs();
}

function createDebugMenu() {
    const debugContainer = document.createElement('div');
    debugContainer.id = 'debug-container';
    debugContainer.setAttribute('aria-label', 'Scene controls');
    debugContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: none;
        justify-content: center;
        align-items: center;
        padding: 20px;
        font-family: Arial, sans-serif;
        color: white;
        z-index: 1000;
        overflow: auto;
    `;

    const flexContainer = document.createElement('div');
    flexContainer.style.cssText = `
        background: rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(5px);
        border-radius: 10px;
        padding: 20px;
        max-width: 1200px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
    `;

    // Create content grid
    const content = document.createElement('div');
    content.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
        gap: 20px;
    `;

    // Create sections object to organize controls
    const sections = {
        status: {
            title: 'Status',
            content: createStatusSection(),
            fullWidth: true
        },
        scene: {
            title: 'Scene Controls',
            content: createSceneSection()
        },
        visibility: {
            title: 'Object Visibility',
            content: createVisibilitySection()
        },
        environment: {
            title: 'Environment',
            content: createEnvironmentSection()
        },
        camera: {
            title: 'Movement',
            content: createCameraSection()
        },
        objects: {
            title: 'Object Controls',
            content: createObjectsSection()
        },
        debug: {
            title: 'Debug Options',
            content: createDebugSection()
        }
    };

    // Add sections to grid
    Object.entries(sections).forEach(([key, section]) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.style.cssText = `
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 15px;
            ${section.fullWidth ? 'grid-column: 1 / -1;' : ''}
        `;

        // Add collapsible header
        const sectionHeader = document.createElement('div');
        sectionHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            cursor: pointer;
            user-select: none;
        `;
        sectionHeader.innerHTML = `<h4 style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">${section.title}</h4>`;
        
        const toggleButton = document.createElement('button');
        toggleButton.textContent = '−';
        toggleButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            padding: 0 5px;
            opacity: 0.7;
            transition: opacity 0.2s;
        `;
        toggleButton.onmouseover = () => toggleButton.style.opacity = '1';
        toggleButton.onmouseout = () => toggleButton.style.opacity = '0.7';
        
        sectionHeader.appendChild(toggleButton);
        
        const sectionContent = section.content;
        sectionContent.style.display = 'block';
        
        const toggleSection = () => {
            const isCollapsed = sectionContent.style.display === 'none';
            sectionContent.style.display = isCollapsed ? 'block' : 'none';
            toggleButton.textContent = isCollapsed ? '−' : '+';
        };
        
        // Make entire header clickable
        sectionHeader.addEventListener('click', toggleSection);
        
        sectionDiv.appendChild(sectionHeader);
        sectionDiv.appendChild(sectionContent);
        content.appendChild(sectionDiv);
    });

    flexContainer.appendChild(content);
    debugContainer.appendChild(flexContainer);
    document.body.appendChild(debugContainer);
    document.getElementById('controls-toggle').addEventListener('click', toggleControls);
    document.getElementById('ambient-toggle').addEventListener('click', () => {
        document.body.classList.add('ambient-mode');
        document.activeElement?.blur();
    });
    // Capture the first click so waking the overlay cannot activate a control
    // that was hidden underneath the tap. Touch taps also generate clicks.
    document.addEventListener('click', event => {
        if (!document.body.classList.contains('ambient-mode')) return;
        document.body.classList.remove('ambient-mode');
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);
}

function toggleControls() {
    document.body.classList.remove('ambient-mode');
    const menu = document.getElementById('debug-container');
    const button = document.getElementById('controls-toggle');
    const open = menu.style.display === 'none';
    menu.style.display = open ? 'flex' : 'none';
    button.setAttribute('aria-label', open ? 'Close controls' : 'Open controls');
    button.title = open ? 'Close controls' : 'Open controls';
    button.setAttribute('aria-expanded', String(open));
}

// Helper functions to create each section
function createStatusSection() {
    const section = document.createElement('div');
    section.id = 'status-display';
    return section;
}

function createSceneSection() {
    const section = document.createElement('div');
    
    // Scene buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 15px;
    `;
    
    scenes.forEach(scene => {
        const button = document.createElement('button');
        button.textContent = scene.charAt(0).toUpperCase() + scene.slice(1);
        button.dataset.sceneIndex = scenes.indexOf(scene);
        button.style.cssText = `
            padding: 5px 10px;
            background: ${scene === scenes[currentSceneIndex] ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 3px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        
        button.onmouseover = () => {
            if (scene !== scenes[currentSceneIndex]) {
                button.style.background = 'rgba(255, 255, 255, 0.2)';
            }
        };
        
        button.onmouseout = () => {
            button.style.background = scene === scenes[currentSceneIndex] ? 
                'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        };
        
        button.addEventListener('click', () => {
            const newIndex = scenes.indexOf(scene);
            if (newIndex !== currentSceneIndex && !isSceneTransitioning) {
                startSceneTransition(newIndex);
                log(`Manually transitioning to ${scene} scene`, 'info');
                
                // Update button styles
                buttonContainer.querySelectorAll('button').forEach(btn => {
                    btn.style.background = 'rgba(255, 255, 255, 0.1)';
                });
                button.style.background = 'rgba(255, 255, 255, 0.3)';
            }
        });
        
        buttonContainer.appendChild(button);
    });
    
    section.appendChild(buttonContainer);
    
    // Add scene-related variables
    const sceneVars = ['sceneTransitionDuration', 'dayNightSpeed'];
    addVariableSliders(section, sceneVars);
    
    // Add scene-related toggles
    const sceneToggles = ['autoRotateScenes'];
    addToggles(section, sceneToggles);
    
    return section;
}

function createEnvironmentSection() {
    const section = document.createElement('div');
    
    // Speck controls
    const speckControls = ['speckCount', 'speckSize'];
    addVariableSliders(section, speckControls);
    
    // Star controls
    const starControls = ['starCount', 'starSize', 'starSpread', 'starDistance', 'starTwinkleSpeed'];
    addVariableSliders(section, starControls);
    
    return section;
}

function createCameraSection() {
    const section = document.createElement('div');
    
    // Camera-related variables
    const viewButton = createButton('View: Front (R)', cycleCameraView);
    viewButton.id = 'view-cycle';
    section.appendChild(viewButton);
    const cameraVars = ['moveSpeed', 'speed'];
    addVariableSliders(section, cameraVars);
    
    return section;
}

function createObjectsSection() {
    const section = document.createElement('div');
    
    // Building controls
    const buildingVars = ['buildingDensity'];
    addVariableSliders(section, buildingVars);
    
    // Add refresh buildings button
    const refreshButton = createButton('Regenerate Buildings', () => {
        createBuildings();
        log('Buildings refreshed with new density settings', 'info');
    });
    section.appendChild(refreshButton);

    // Add another divider
    const divider2 = document.createElement('div');
    divider2.style.cssText = `
        height: 1px;
        background: rgba(255, 255, 255, 0.2);
        margin: 15px 0;
    `;
    section.appendChild(divider2);

    // Scene object controls
    const objectVars = ['objectDensity'];
    addVariableSliders(section, objectVars);

    // Add refresh objects button
    const refreshObjectsButton = createButton('Regenerate Scene Objects', () => {
        createDesertObjects();
        log('Scene objects refreshed with new density settings', 'info');
    });
    section.appendChild(refreshObjectsButton);
    
    return section;
}

function createDebugSection() {
    const section = document.createElement('div');
    
    // Debug toggles
    const debugToggles = ['showFPS', 'showLogs'];
    addToggles(section, debugToggles);
    
    // Add debug logs
    const logsDiv = document.createElement('div');
    logsDiv.id = 'debug-logs';
    logsDiv.style.cssText = `
        margin-top: 15px;
        font-family: monospace;
        font-size: 12px;
        max-height: 200px;
        overflow-y: auto;
    `;
    section.appendChild(logsDiv);
    
    return section;
}

// Helper function to create variable sliders
function addVariableSliders(container, variables) {
    const sliderContainer = document.createElement('div');
    sliderContainer.style.cssText = `
        display: grid;
        gap: 10px;
    `;

    Object.entries(DEBUG.variables).forEach(([key, config]) => {
        if (!variables.includes(key)) return;

        const row = document.createElement('div');
        row.style.cssText = `
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 10px;
            align-items: center;
        `;

        const label = document.createElement('label');
        label.textContent = config.label || key;
        label.style.cssText = `
            font-size: 12px;
            opacity: 0.9;
        `;

        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = `setting-${key}`;
        label.htmlFor = slider.id;
        slider.min = config.min;
        slider.max = config.max;
        slider.step = config.step;
        slider.value = config.value;
        slider.style.cssText = `
            width: 100px;
            margin: 0;
        `;

        const value = document.createElement('span');
        value.textContent = config.value;
        value.style.cssText = `
            font-size: 12px;
            min-width: 40px;
            text-align: right;
        `;

        slider.addEventListener('input', () => {
            config.value = parseFloat(slider.value);
            value.textContent = slider.value;
            applyControlChange(key);
        });

        controlsDiv.appendChild(slider);
        controlsDiv.appendChild(value);
        row.appendChild(label);
        row.appendChild(controlsDiv);
        sliderContainer.appendChild(row);
    });

    container.appendChild(sliderContainer);
}

// Helper function to create toggles
function addToggles(container, toggles) {
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
        display: grid;
        gap: 8px;
    `;

    toggles.forEach(key => {
        const config = DEBUG.toggles[key];
        if (!config) return;

        const row = document.createElement('label');
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            padding: 5px;
            border-radius: 3px;
            transition: background-color 0.2s;
            user-select: none;
        `;

        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = config.value;
        toggle.style.cssText = `
            margin: 0;
            cursor: pointer;
        `;

        const label = document.createElement('span');
        label.textContent = config.label || key;
        label.style.cssText = `
            font-size: 12px;
            cursor: pointer;
            user-select: none;
            opacity: 0.9;
            flex-grow: 1;
        `;

        const updateToggle = () => {
            config.value = toggle.checked;
            row.style.backgroundColor = toggle.checked ? 'rgba(255, 255, 255, 0.2)' : 'transparent';
            
            applyControlChange(key);

            log(`${config.label} ${toggle.checked ? 'enabled' : 'disabled'}`, 'info');
        };

        // The wrapping label activates the checkbox exactly once for clicks
        // anywhere in the row; change also covers keyboard activation.
        toggle.addEventListener('change', updateToggle);

        row.appendChild(toggle);
        row.appendChild(label);
        toggleContainer.appendChild(row);

        // Set initial background
        row.style.backgroundColor = toggle.checked ? 'rgba(255, 255, 255, 0.2)' : 'transparent';

        // Add hover effect
        row.onmouseover = () => {
            if (!toggle.checked) {
                row.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
        };
        row.onmouseout = () => {
            if (!toggle.checked) {
                row.style.backgroundColor = 'transparent';
            }
        };
    });

    container.appendChild(toggleContainer);
}

function applyControlChange(key) {
    switch (key) {
        case 'showRoad':
            if (DEBUG.toggles.showRoad.value) {
                roadSegments.forEach(removeScenery);
                [leftEdgeLine, rightEdgeLine, leftYellowLine, rightYellowLine].forEach(removeScenery);
                roadSegments = [];
                createRoad();
            } else {
                // Keep the visible stretch, then let its far end pass the camera.
                roadSegments.forEach(road => {
                    road.scale.y = 800 / totalRoadLength;
                    road.position.z = camera.position.z;
                });
                [leftEdgeLine, rightEdgeLine, leftYellowLine, rightYellowLine].forEach(line => {
                    if (line) { line.scale.z = 800 / totalRoadLength; line.position.z = camera.position.z; }
                });
            }
            break;
        case 'showBuildings': case 'showStreetLamps': case 'showMountains':
        case 'showSceneObjects': case 'showSpecks': case 'showStars': case 'showTraffic':
            // Animation keeps moving existing objects; only replenishment stops.
            break;
        case 'buildingDensity': createBuildings(); break;
        case 'objectDensity': createDesertObjects(); break;
        case 'speckCount': createSpecks(); break;
        case 'starCount': case 'starSize': case 'starSpread':
        case 'starDistance': case 'starTwinkleSpeed': createStars(); break;
        case 'showFPS':
            if (DEBUG.toggles.showFPS.value && !stats) initStats();
            if (stats) stats.dom.style.display = DEBUG.toggles.showFPS.value ? 'block' : 'none';
            break;
        case 'showLogs': updateDebugLogs(); break;
        case 'autoRotateScenes': lastSceneChangeTime = Date.now(); break;
    }
}

// Helper function to create buttons
function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
        width: 100%;
        padding: 8px;
        background: rgba(76, 175, 80, 0.8);
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        margin-bottom: 15px;
        transition: background 0.3s;
        font-size: 12px;
    `;
    
    button.addEventListener('mouseover', () => {
        button.style.background = 'rgba(76, 175, 80, 1)';
    });
    button.addEventListener('mouseout', () => {
        button.style.background = 'rgba(76, 175, 80, 0.8)';
    });
    button.addEventListener('click', onClick);
    
    return button;
}

function updateDebugLogs() {
    if (!DEBUG.enabled || !DEBUG.menu) return;
    
    const logsSection = document.getElementById('debug-logs');
    if (!logsSection) return;
    
    logsSection.style.display = DEBUG.toggles.showLogs.value ? 'block' : 'none';
    logsSection.innerHTML = '<h4>Debug Logs</h4>';
    DEBUG.logs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.style.color = {
            info: '#4CAF50',
            warn: '#FFC107',
            error: '#F44336'
        }[log.type];
        logEntry.textContent = `[${log.timestamp}] ${log.message}`;
        logsSection.appendChild(logEntry);
    });
}

// Initialize the scene
function init() {
    try {
        console.log('Starting initialization...');
        
        // Initialize scene
        scene = new THREE.Scene();
        const currentState = sceneStates[scenes[currentSceneIndex]];
        scene.background = currentState.dayColors.sky.clone();
        scene.fog = new THREE.FogExp2(currentState.dayColors.sky, 0.002);
        
        // Initialize camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(2, 2.5, 0);
        setCameraView(0);
        camera.lookAt(cameraTarget);
        console.log('Camera initialized successfully');
        
        // Initialize renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(renderer.domElement);
        console.log('Renderer initialized successfully');
        
        // Create debug menu and status display
        createDebugMenu();
        createStatusDisplay();
        DEBUG.menu = document.getElementById('debug-container');
        
        // Try to initialize Stats if enabled
        if (DEBUG.toggles.showFPS.value) {
            try {
                const statsResult = initStats();
                if (!statsResult) {
                    DEBUG.toggles.showFPS.value = false;
                }
            } catch (error) {
                console.warn('Failed to initialize FPS counter:', error);
                DEBUG.toggles.showFPS.value = false;
            }
        }
        
        // Save initial state as default preset
        DEBUG.presets.default = {
            variables: {},
            toggles: {},
            sceneObjectsState: { ...DEBUG.sceneObjectsState }
        };
        
        Object.entries(DEBUG.variables).forEach(([key, config]) => {
            DEBUG.presets.default.variables[key] = config.value;
        });
        
        Object.entries(DEBUG.toggles).forEach(([key, config]) => {
            DEBUG.presets.default.toggles[key] = config.value;
        });
        
        // Load any saved presets from local storage
        DEBUG.loadPresetsFromLocalStorage();
        
        // Initialize all scene objects
        createLighting();
        createSun();
        createDesertGround();
        createRoad();
        createStreetLamps();
        createBuildings();
        createDesertObjects();
        createMountains();
        createStars();
        createClouds();
        
        // Initialize at night
        dayNightCycle = Math.PI;
        isNight = true;
        
        // Set up event listeners
        setupEventListeners();
        
        // Give the initial scene its full interval before auto rotation.
        lastSceneChangeTime = Date.now();

        // Start animation loop
        animate();
        console.log('Animation loop started');
        console.log('Initialization complete');
        console.log('Scene contains', scene.children.length, 'objects');
        console.log('Road segments:', roadSegments.length);
        console.log('Camera position:', camera.position);
        console.log('Current scene:', scenes[currentSceneIndex]);
        
    } catch (error) {
        console.error('Critical initialization error:', error);
    }
}

function createLighting() {
    // Ambient light
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Directional light
    directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 1, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);
}

function createSun() {
    // Create a sun sphere
    const sunGeometry = new THREE.SphereGeometry(10, 16, 16);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFF1BD, 
        transparent: true,
        opacity: 0.9,
        fog: false,
        depthWrite: false
    });
    sunObject = new THREE.Mesh(sunGeometry, sunMaterial);
    
    // Positions are updated from the shared day/night phase each frame.
    sunObject.position.set(0, sunPathHeight, sunPathRadius);
    scene.add(sunObject);
    
    // Create a subtle glow around the sun
    const sunLightGeometry = new THREE.SphereGeometry(12, 16, 16);
    const sunLightMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF99,
        transparent: true,
        opacity: 0.4,
        fog: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const sunGlow = new THREE.Mesh(sunLightGeometry, sunLightMaterial);
    sunObject.add(sunGlow);

    // Create moon
    const moonGeometry = new THREE.PlaneGeometry(16, 16);
    const moonMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
            phase: {value: lunarPhase},
            opacity: {value: 0.9},
            tint: {value: new THREE.Color(0xEEEEFF)}
        },
        vertexShader: `
            varying vec2 diskUv;
            void main() {
                diskUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 diskUv;
            uniform float phase;
            uniform float opacity;
            uniform vec3 tint;
            void main() {
                vec2 p = diskUv * 2.0 - 1.0;
                float radius = length(p);
                if (radius >= 1.0) discard;
                vec3 normal = vec3(p, sqrt(max(0.0, 1.0 - dot(p, p))));
                vec3 lightDirection = vec3(sin(phase), 0.0, cos(phase));
                float light = smoothstep(-0.025, 0.025, dot(normal, lightDirection));
                float rim = 1.0 - smoothstep(0.96, 1.0, radius);
                gl_FragColor = vec4(tint, opacity * rim * light);
            }
        `
    });
    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    
    // Moon follows the same arc half a cycle after the sun.
    moon.position.set(0, -sunPathHeight, -sunPathRadius);
    scene.add(moon);
    
    // Create moon glow
    const moonLightGeometry = new THREE.SphereGeometry(10, 16, 16);
    const moonLightMaterial = new THREE.MeshBasicMaterial({
        color: 0xCCCCFF,
        transparent: true,
        opacity: 0.3,
        fog: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const moonGlow = new THREE.Mesh(moonLightGeometry, moonLightMaterial);
    moon.add(moonGlow);
}

function updateCelestialCycle() {
    // Looking down the road is -Z: phase 0 rises ahead, PI/2 is overhead,
    // and PI sets behind. The moon traces the same path during the night.
    const positionBody = (body, phase, glowOpacity) => {
        const altitude = Math.sin(phase) * sunPathHeight;
        body.position.set(camera.position.x + celestialPathOffset, camera.position.y + altitude,
            camera.position.z - Math.cos(phase) * sunPathRadius);
        const horizonFade = THREE.MathUtils.smoothstep(altitude, -12, 18);
        body.visible = altitude > -12;
        body.material.opacity = 0.9 * horizonFade;
        body.children[0].material.opacity = glowOpacity * horizonFade;
        return altitude;
    };
    const altitude = positionBody(sunObject, dayNightCycle, 0.35);
    positionBody(moon, dayNightCycle + Math.PI, 0.22);
    moon.lookAt(camera.position);
    moon.material.uniforms.phase.value = lunarPhase;
    moon.material.uniforms.opacity.value = moon.material.opacity;
    const moonIllumination = (1 + Math.cos(lunarPhase)) / 2;
    moon.children[0].material.opacity *= moonIllumination;
    const daylight = Math.max(0, Math.sin(dayNightCycle));
    sunObject.material.color.setHex(0xFFA15A).lerp(new THREE.Color(0xFFF1BD), THREE.MathUtils.smoothstep(altitude, 0, 100));
    sunObject.children[0].material.color.copy(sunObject.material.color);
    directionalLight.position.copy(daylight > 0 ? sunObject.position : moon.position);
    directionalLight.target.position.set(camera.position.x, 0, camera.position.z);
    directionalLight.color.setHex(0xBBCFFF).lerp(new THREE.Color(0xFFF1DC), THREE.MathUtils.smoothstep(daylight, 0, 0.35));
}

function createDesertGround() {
    // Create a gradient ground to hide blue sky underneath
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const currentState = sceneStates[scenes[currentSceneIndex]];
    const groundMaterial = new THREE.MeshBasicMaterial({ 
        color: currentState.dayColors.ground,
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1.0
    });
    groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.2;
    scene.add(groundPlane);
    
    // Create specks for desert simulation
    createSpecks();
}

// One draw call for all ground specks, with recycled instance transforms.
let speckMesh;
const speckTransform = new THREE.Object3D();

// Reserve the road corridor only while the road is visible.
function groundObjectX(spread, side = Math.random() < 0.5 ? -1 : 1) {
    const clearance = roadWidth / 2 + 5;
    return DEBUG.toggles.showRoad.value
        ? side * (clearance + Math.random() * spread)
        : (Math.random() * 2 - 1) * (clearance + spread);
}

const speckFieldLength = 800;
const speckRearOffset = rearSceneryDistance;
let activeSpecks = [];

function resetSpeck(index, z) {
    activeSpecks[index] = true;
    const side = Math.random() < 0.5 ? -1 : 1;
    specks[index] = new THREE.Vector3(
        groundObjectX(200, side), 0, z
    );
    const palette = isSceneTransitioning && Math.random() < sceneTransitionProgress * 1.5
        ? palettes[scenes[nextSceneIndex]] : palettes[scenes[currentSceneIndex]];
    speckMesh.setColorAt(index, palette[Math.floor(Math.random() * palette.length)]);
}

function updateSpeckTransform(index) {
    speckTransform.position.copy(specks[index]);
    speckTransform.scale.setScalar(activeSpecks[index] ? DEBUG.variables.speckSize.value / 0.5 * rearSceneryFade(specks[index].z - camera.position.z) : 0);
    speckTransform.updateMatrix();
    speckMesh.setMatrixAt(index, speckTransform.matrix);
}

function createSpecks() {
    removeScenery(speckMesh);
    speckMesh = null;
    specks = [];
    activeSpecks = [];
    if (!DEBUG.toggles.showSpecks.value) return;
    const count = Math.max(0, Math.floor(DEBUG.variables.speckCount.value));
    if (!count) return;
    speckMesh = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.1, 4, 4),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8, depthWrite: false }),
        count
    );
    speckMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Instances are recycled around the camera; static bounds would be stale.
    speckMesh.frustumCulled = false;
    for (let i = 0; i < count; i++) {
        resetSpeck(i, camera.position.z + speckRearOffset - speckFieldLength + (i + Math.random()) / count * speckFieldLength);
        updateSpeckTransform(i);
    }
    scene.add(speckMesh);
}

function createRoad() {
    // Clear any existing road segments
    roadSegments.forEach(segment => scene.remove(segment));
    if (leftEdgeLine) scene.remove(leftEdgeLine);
    if (rightEdgeLine) scene.remove(rightEdgeLine);
    if (leftYellowLine) scene.remove(leftYellowLine);
    if (rightYellowLine) scene.remove(rightYellowLine);
    
    roadSegments = [];
    
    // Create one large road plane with extended length
    const roadGeometry = new THREE.PlaneGeometry(
        roadWidth,
        totalRoadLength,
        1,  // width segments
        segmentCount * 8 // length segments - octupled for extra smoothness
    );
    
    // Road material - pure black with 100% opacity
    const roadMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000,
        side: THREE.DoubleSide,
        transparent: false // No transparency for better performance
    });
    
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0;
    
    // Position the road starting exactly at z=0 extending forward and backward
    // This places the start of the road directly under the camera (which is now at z=0)
    road.position.z = camera.position.z + rearSceneryDistance - totalRoadLength / 2;
    
    scene.add(road);
    roadSegments.push(road);
    
    // Create lines using BufferGeometry for better performance
    const lineWidth = 0.2;
    const lineHeight = 0.3; // Increased from 0.2 to 0.3 for better visibility
    
    // Create a single geometry for all lines
    const lineGeometry = new THREE.BoxBufferGeometry(lineWidth, lineHeight, totalRoadLength);
    
    // White material for edge lines
    const whiteMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: false
    });
    
    // Yellow material for center lines
    const yellowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        transparent: false
    });
    
    // Create edge lines
    leftEdgeLine = new THREE.Mesh(lineGeometry, whiteMaterial);
    rightEdgeLine = new THREE.Mesh(lineGeometry, whiteMaterial);
    
    // Position edge lines - increased height from 0.1 to 0.15
    leftEdgeLine.position.set(-roadWidth / 2, 0.15, camera.position.z + rearSceneryDistance - totalRoadLength / 2);
    rightEdgeLine.position.set(roadWidth / 2, 0.15, camera.position.z + rearSceneryDistance - totalRoadLength / 2);
    
    // Create center lines
    const centerLineGeometry = new THREE.BoxBufferGeometry(0.15, lineHeight, totalRoadLength);
    leftYellowLine = new THREE.Mesh(centerLineGeometry, yellowMaterial);
    rightYellowLine = new THREE.Mesh(centerLineGeometry, yellowMaterial);
    
    // Position center lines - increased height from 0.1 to 0.15
    leftYellowLine.position.set(-0.3, 0.15, camera.position.z + rearSceneryDistance - totalRoadLength / 2);
    rightYellowLine.position.set(0.3, 0.15, camera.position.z + rearSceneryDistance - totalRoadLength / 2);
    
    // Add all lines to scene
    scene.add(leftEdgeLine);
    scene.add(rightEdgeLine);
    scene.add(leftYellowLine);
    scene.add(rightYellowLine);
}

const lampStyles = {
    desert: { height: 5, pole: 0x705A43, glow: 0xFFAD55, shape: 'box' },
    forest: { height: 4.5, pole: 0x3E5144, glow: 0xFFE6A0, shape: 'lantern' },
    snowy: { height: 5.5, pole: 0x869BA6, glow: 0xBEEAFF, shape: 'globe' },
    city: { height: 6, pole: 0x495565, glow: 0xE3EFFF, shape: 'box' }
};

function createStreetLamp(sceneName = scenes[currentSceneIndex]) {
    const style = lampStyles[sceneName];
    const lamp = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({color: style.pole});
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, style.height, 8), material);
    pole.position.y = style.height / 2;
    lamp.add(pole);
    const geometry = style.shape === 'globe' ? new THREE.SphereGeometry(0.45, 12, 8)
        : style.shape === 'lantern' ? new THREE.CylinderGeometry(0.25, 0.4, 0.8, 6)
        : new THREE.BoxGeometry(sceneName === 'city' ? 1.5 : 1, 0.3, 0.6);
    const head = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: style.glow}));
    head.position.y = style.height;
    lamp.add(head);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 8),
        new THREE.MeshBasicMaterial({color: style.glow, transparent: true, opacity: 0.25, depthWrite: false}));
    glow.position.y = style.height;
    lamp.add(glow);
    const light = new THREE.PointLight(style.glow, 0, 15);
    light.position.y = style.height;
    lamp.add(light);
    lamp.userData = {scene: sceneName, glow, light};
    startSceneryFade(lamp);
    return lamp;
}

function createStreetLamps() {
    streetLamps.forEach(removeScenery);
    streetLamps = [];
    if (!DEBUG.toggles.showStreetLamps.value) return;
    for (let i = 0; i < 10; i++) {
        const lamp = createStreetLamp();
        lamp.position.set((i % 2 === 0 ? -1 : 1) * (roadWidth / 2 + 2), 0, camera.position.z + 320 - i * 80);
        scene.add(lamp);
        streetLamps.push(lamp);
    }
}

// Dispose resources owned by scenery when it is permanently removed.
// Sets prevent disposing materials shared by children more than once.
function removeScenery(object) {
    if (!object) return;
    if (object.parent) object.parent.remove(object);
    if (object.isInstancedMesh) object.dispose();
    const geometries = new Set();
    const materials = new Set();
    object.traverse(child => {
        if (child.geometry) geometries.add(child.geometry);
        if (child.material) {
            const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
            childMaterials.forEach(material => materials.add(material));
        }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
}

function createBuildings() {
    // Clear any existing buildings
    buildings.forEach(removeScenery);
    buildings = [];
    if (!DEBUG.toggles.showBuildings.value) return;
    
    // Use building density from debug settings
    const buildingCount = DEBUG.variables.buildingDensity.value;
    
    for (let i = 0; i < buildingCount; i++) {
        const building = createRandomBuilding();
        building.position.set(
            (Math.random() < 0.5 ? -1 : 1) * (roadWidth / 2 + 15 + Math.random() * 20),
            0,
            camera.position.z + 320 - i * (800 / buildingCount) - Math.random() * 40
        );
        startSceneryFade(building);
        scene.add(building);
        buildings.push(building);
    }
    
    log(`Created ${buildingCount} buildings`, 'info');
}

function createRandomBuilding() {
    const building = new THREE.Group();
    const width = 5 + Math.random() * 6;
    const floors = 2 + Math.floor(Math.random() * 4);
    const depth = 5 + Math.random() * 6;
    const height = floors * 3;
    const colors = [0xB8D4DC, 0xDCC5AB, 0xB5CDB5, 0xC8BCDB, 0xD9B6B0, 0xCFD5C7];
    const tint = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
    const wallMaterial = new THREE.MeshBasicMaterial({
        color: tint,
        transparent: true,
        opacity: 0.12,
        depthWrite: false
    });
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: tint.clone().lerp(new THREE.Color(0xFFFFFF), 0.3),
        transparent: true,
        opacity: 0.65,
        depthWrite: false
    });
    const frameMaterial = new THREE.LineBasicMaterial({
        color: tint,
        transparent: true,
        opacity: 0.3,
        depthWrite: false
    });

    function addVolume(w, h, d, y) {
        const geometry = new THREE.BoxGeometry(w, h, d);
        const walls = new THREE.Mesh(geometry, wallMaterial);
        walls.position.y = y;
        const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
        outline.position.y = y;
        building.add(walls, outline);
    }

    // A faint shell gives the silhouette depth while the frame defines its shape.
    addVolume(width, height, depth, height / 2);
    const frame = [];
    const line = (x1, y1, z1, x2, y2, z2) => frame.push(x1, y1, z1, x2, y2, z2);
    const x = width / 2;
    const z = depth / 2;
    for (let floor = 1; floor < floors; floor++) {
        const y = floor * 3;
        line(-x, y, -z, x, y, -z);
        line(-x, y, z, x, y, z);
        line(-x, y, -z, -x, y, z);
        line(x, y, -z, x, y, z);
    }
    // Sparse facade columns avoid the busy triangular look of a mesh wireframe.
    for (const side of [-1, 1]) {
        line(0, 0, side * z, 0, height, side * z);
        line(side * x, 0, 0, side * x, height, 0);
    }
    const frameGeometry = new THREE.BufferGeometry();
    frameGeometry.setAttribute('position', new THREE.Float32BufferAttribute(frame, 3));
    building.add(new THREE.LineSegments(frameGeometry, frameMaterial));

    // A small setback roof adds variety without competing with the skyscrapers.
    if (Math.random() < 0.45) {
        const roofHeight = 1.5 + Math.random();
        addVolume(width * 0.55, roofHeight, depth * 0.6, height + roofHeight / 2);
    }
    return building;
}

function createDesertObjects(preserveExisting = false) {
    if (!preserveExisting) {
        // Remove existing objects
        desertObjects.forEach(object => {
            if (object) removeScenery(object);
        });
        desertObjects = [];
    }

    if (!DEBUG.toggles.showSceneObjects.value || !DEBUG.sceneObjectsState[scenes[currentSceneIndex]]) return;
    const objectCount = DEBUG.variables.objectDensity.value;
    
    // Create new objects
    for (let i = 0; i < objectCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const x = groundObjectX(100, side);
        const z = camera.position.z - 400 + Math.random() * 800;
        
        const object = sceneObjects[scenes[currentSceneIndex]].createObject();
        object.position.set(x, 0, z);
        object.userData = {
            scene: scenes[currentSceneIndex]
        };
        
        startSceneryFade(object);
        scene.add(object);
        desertObjects.push(object);
    }
}

function createMountains() {
    console.log("Creating mountains for scene:", scenes[currentSceneIndex]);
    console.log("Mountains toggle:", DEBUG.toggles.showMountains.value);
    
    // Clear any existing mountains
    mountains.forEach(mountain => {
        if (mountain) removeScenery(mountain);
    });
    mountains = [];
    
    // Create mountains or skyscrapers on both sides of the road - more for better horizon coverage
    const mountainCount = scenes[currentSceneIndex] === 'city' ? 10 : 12; // More mountains/skyscrapers for horizon
    
    // Define zones (from road outward):
    // Road: 0 to roadWidth/2
    // Street Lamps: roadWidth/2 to roadWidth/2 + 5
    // Buildings: roadWidth/2 + 5 to roadWidth/2 + 30
    // Objects: roadWidth/2 + 30 to roadWidth/2 + 100
    // Mountains: roadWidth/2 + 150 onwards (pushed further for horizon effect)
    
    // Mountain zone constants are now defined globally
    
    const isCity = scenes[currentSceneIndex] === 'city';
    
    if (isCity) {
        console.log("Creating skyscrapers for city scene");
    } else {
        console.log("Creating mountains for", scenes[currentSceneIndex], "scene");
    }
    
    // If mountains toggle is off, return early
    if (!DEBUG.toggles.showMountains.value) {
        console.log("Mountains toggle is OFF, skipping creation");
        return;
    }
    
    for (let side = -1; side <= 1; side += 2) { // -1 for left, 1 for right
        // Create a seamless mountain range with overlapping peaks
        for (let i = 0; i < mountainCount; i++) {
            try {
                const mountain = new THREE.Group();
                
                // Create overlapping zones for seamless horizon
                const baseDistance = mountainZoneStart + (mountainZoneWidth * 0.3); // Start closer for background
                const distanceVariation = mountainZoneWidth * 0.7;
                const distanceFromRoad = baseDistance + Math.random() * distanceVariation;
                
                // Position mountains with some overlap for continuity
                mountain.position.x = side * distanceFromRoad;
                mountain.position.z = camera.position.z + 300 - i * 150; // Closer spacing for better coverage
                
                // Create mountain or skyscraper based on current scene
                if (isCity) {
                    createSkyscraper(mountain, distanceFromRoad);
                } else {
                    // Create connected mountain chains for better height variation
                    createMountainChain(mountain, distanceFromRoad, i, mountainCount);
                }
                
                // Store the scene info with the mountain/skyscraper
                mountain.userData = {
                    scene: scenes[currentSceneIndex],
                    type: isCity ? 'skyscraper' : 'mountain'
                };
                
                startSceneryFade(mountain);
                scene.add(mountain);
                mountains.push(mountain);
            } catch (error) {
                console.error("Error creating mountain/skyscraper:", error);
            }
        }
    }
    
    // Create background horizon planes for seamless horizon coverage
    createHorizonPlanes(isCity);
    
    console.log("Created", mountains.length, "mountains/skyscrapers for", scenes[currentSceneIndex], "scene");
    
    // Add a visible indicator for debugging
    if (DEBUG.toggles.showDebug && DEBUG.toggles.showDebug.value) {
        const sceneIdentifier = isCity ? "🏙️" : scenes[currentSceneIndex] === "forest" ? "🌲" : 
                               scenes[currentSceneIndex] === "snowy" ? "❄️" : "🏜️";
        log(`Created ${mountains.length} ${sceneIdentifier} for ${scenes[currentSceneIndex]} scene`, 'info');
    }
}

function createStars() {
    stars.forEach(removeScenery);
    stars = [];
    if (DEBUG.toggles.showStars.value && DEBUG.variables.starCount.value > 0) {
        addStars(DEBUG.variables.starCount.value);
    }
}

function addStars(count) {
    if (!DEBUG.toggles.showStars.value) return;

    const starCount = Math.max(0, Math.floor(count ?? DEBUG.variables.starCount.value));
    if (!starCount) return;
    const starGeometry = new THREE.BufferGeometry();
    
    // Calculate the correct opacity based on day/night cycle for target opacity
    const dayFactor = Math.max(0, Math.sin(-dayNightCycle + Math.PI));
    let targetOpacity = 0;
    
    if (dayFactor <= 0.3) {
        targetOpacity = 0.7; // Full brightness during deep night
    } else if (dayFactor < 0.7) {
        // Extended transition from 30% to 70% light
        const transitionProgress = (dayFactor - 0.3) / 0.4; 
        targetOpacity = 0.7 * (1 - (transitionProgress * transitionProgress));
    } else {
        targetOpacity = 0;
    }
    
    // Start with a small initial opacity so stars are at least slightly visible
    const initialOpacity = Math.min(0.1, targetOpacity);
    
    const starMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: DEBUG.variables.starSize.value,
        transparent: true,
        opacity: initialOpacity, // Start with a small opacity
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        vertexColors: true // Enable vertex colors
    });
    
    // Store the target opacity to fade towards
    starMaterial.userData = {
        isNew: true,
        targetOpacity: targetOpacity,
        creationTime: Date.now()
    };

    // Create arrays for star positions and custom attributes
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const twinkleSpeeds = new Float32Array(starCount);
    const twinklePhases = new Float32Array(starCount);
    const movementSpeeds = new Float32Array(starCount);

    // Get safe values for calculations
    const starDistance = Math.max(200, DEBUG.variables.starDistance.value || 800);
    
    // Set minimum and maximum height for stars
    const minStarHeight = 10; // Reduced to 10 as requested
    const maxStarHeight = 10 + 300 * DEBUG.variables.starSpread.value; // Changed maximum height from 500 to 250 as requested
    
    // Initialize star positions in a dome shape that doesn't go below minStarHeight
    for (let i = 0; i < starCount; i++) {
        const radius = starDistance + Math.random() * 200;
        const phi = Math.random() * Math.PI * 2;
        
        // Use original theta calculation but ensure height is evenly distributed
        // This combines our even distribution with the original movement behavior
        const randomValue = Math.random();
        // Adjust theta calculation to ensure even height distribution between min and max
        const normalizedHeight = minStarHeight + randomValue * (maxStarHeight - minStarHeight);
        // Calculate theta that would give us this height
        const theta = Math.acos(Math.min(0.99, Math.max(-0.99, normalizedHeight / radius)));
        
        // Apply original positioning formula but restrict height to our min-max range
        positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
        const heightComponent = radius * Math.cos(theta);
        positions[i * 3 + 1] = Math.min(maxStarHeight, Math.max(minStarHeight, heightComponent));
        positions[i * 3 + 2] = radius * Math.sin(theta) * Math.sin(phi);

        // Set initial color (white)
        colors[i * 3] = 1.0;     // R
        colors[i * 3 + 1] = 1.0; // G
        colors[i * 3 + 2] = 1.0; // B

        // Get safe value for twinkle speed
        const twinkleSpeed = DEBUG.variables.starTwinkleSpeed.value;
        twinkleSpeeds[i] = twinkleSpeed * (0.5 + Math.random());
        twinklePhases[i] = Math.random() * Math.PI * 2;
        movementSpeeds[i] = 0.05 + Math.random() * 0.05;
    }

    // Add attributes to geometry
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
    starGeometry.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1));
    starGeometry.setAttribute('movementSpeed', new THREE.BufferAttribute(movementSpeeds, 1));

    // Create stars and add to scene
    const particleSystem = new THREE.Points(starGeometry, starMaterial);
    particleSystem.name = 'stars';
    scene.add(particleSystem);
    stars.push(particleSystem);
    
    // Log for debugging
    console.log(`Added ${starCount} stars, target opacity: ${targetOpacity}`);
}

function animateStars() {
    try {
        if (!stars.length) return;

        // Calculate time-based values
        const time = Date.now() * 0.001;
        const currentTime = Date.now();
        
        // Use the same dayFactor calculation as in animate function
        const dayFactor = Math.max(0, Math.sin(-dayNightCycle + Math.PI));
        
        // Calculate target opacity based on time of day
        let targetOpacity = 0;
        {
            if (dayFactor <= 0.3) {
                targetOpacity = 0.7; // Full brightness during deep night
            } else if (dayFactor < 0.7) {
                // Extended transition from 30% to 70% light
                const transitionProgress = (dayFactor - 0.3) / 0.4; 
                targetOpacity = 0.7 * (1 - (transitionProgress * transitionProgress));
            } else {
                // Low visibility during bright daylight
                targetOpacity = 0;
            }
        }

        // Day fade rate - extremely slow fade out during day
        const fadeDaySpeed = 0.001;
        // Night fade rate - faster fade in during night
        const fadeNightSpeed = 0.03;
        // Even faster fade-in for newly created stars
        const newStarFadeSpeed = 0.05;
        
        // Process each star particle system in the array
        for (let s = 0; s < stars.length; s++) {
            const particleSystem = stars[s];
            if (!particleSystem) continue;
            
            // Check if this is a newly created star system
            const isNew = particleSystem.material.userData && particleSystem.material.userData.isNew;
            
            // Get the target opacity - either from userData or current calculation
            let thisTargetOpacity = targetOpacity;
            if (isNew && particleSystem.material.userData && 
                typeof particleSystem.material.userData.targetOpacity === 'number') {
                thisTargetOpacity = Math.max(targetOpacity, particleSystem.material.userData.targetOpacity);
            }
            
            // Choose appropriate fade speed
            let fadeSpeed;
            if (isNew && particleSystem.material.opacity < thisTargetOpacity) {
                // New stars fade in faster
                fadeSpeed = newStarFadeSpeed;
                
                // If we've reached the target, mark as no longer new
                if (Math.abs(thisTargetOpacity - particleSystem.material.opacity) < newStarFadeSpeed) {
                    particleSystem.material.userData.isNew = false;
                }
            } else if (thisTargetOpacity > particleSystem.material.opacity) {
                // Normal fade in
                fadeSpeed = fadeNightSpeed;
            } else {
                // Fade out
                fadeSpeed = fadeDaySpeed;
            }
            
            fadeSpeed *= frameScale;

            // Adjust opacity towards target
            if (Math.abs(thisTargetOpacity - particleSystem.material.opacity) < fadeSpeed) {
                particleSystem.material.opacity = thisTargetOpacity;
            } else if (thisTargetOpacity > particleSystem.material.opacity) {
                particleSystem.material.opacity += fadeSpeed;
            } else {
                particleSystem.material.opacity -= fadeSpeed;
            }
            
            // Get star attributes
            const positions = particleSystem.geometry.attributes.position.array;
            const colors = particleSystem.geometry.attributes.color.array;
            const twinkleSpeeds = particleSystem.geometry.attributes.twinkleSpeed.array;
            const twinklePhases = particleSystem.geometry.attributes.twinklePhase.array;
            const movementSpeeds = particleSystem.geometry.attributes.movementSpeed.array;
            
            // Variables for calculating average star distance from camera
            let totalDistanceFromCamera = 0;
            let starsInFront = 0;
            
            // Minimum and maximum height for stars - same as used in addStars
            const minStarHeight = 10; // Updated to match the new minimum height
            const maxStarHeight = 10 + 300 * DEBUG.variables.starSpread.value; // Added to match the maximum height in addStars
            
            // Update each star in this particle system
            for (let i = 0; i < positions.length; i += 3) {
                // Update position based on camera movement - reversed direction
                const movementSpeed = movementSpeeds[i / 3];
                
                // Adjust for camera position change (added 20 to Z to emulate original camera position)
                // This compensates for changing camera.position.z from 20 to 0
                const adjustedCameraX = camera.position.x;
                const adjustedCameraZ = camera.position.z + 20; // Add 20 to emulate original camera z-position
                
                positions[i] += adjustedCameraX * movementSpeed * 0.1 * frameScale;
                positions[i + 2] += (adjustedCameraZ * 0.1 + speed) * movementSpeed * frameScale;
                
                // Ensure stars maintain minimum height
                if (positions[i + 1] < minStarHeight) {
                    positions[i + 1] = minStarHeight;
                }
                
                // Calculate distance from camera for size scaling
                const starX = positions[i];
                const starY = positions[i + 1];
                const starZ = positions[i + 2];
                
                // Only count stars in front of the camera for average distance calculation
                if (starZ < camera.position.z) {
                    // Calculate distance from camera using adjusted camera position
                    const distanceFromCamera = Math.sqrt(
                        Math.pow(starX - adjustedCameraX, 2) +
                        Math.pow(starY - camera.position.y, 2) +
                        Math.pow(starZ - adjustedCameraZ, 2)
                    );
                    totalDistanceFromCamera += distanceFromCamera;
                    starsInFront++;
                }
    
                // Reset position if too far from original and generate new star position
                if (DEBUG.toggles.showStars.value && (Math.abs(positions[i]) > 2000 || Math.abs(positions[i + 2]) > 2000)) {
                    const radius = 800 + Math.random() * 200;
                    const phi = Math.random() * Math.PI * 2;
                    
                    // Use the same approach as in addStars for height distribution
                    const randomValue = Math.random();
                    const normalizedHeight = minStarHeight + randomValue * (maxStarHeight - minStarHeight);
                    const theta = Math.acos(Math.min(0.99, Math.max(-0.99, normalizedHeight / radius)));
    
                    // Position new star behind the camera
                    positions[i] = radius * Math.sin(theta) * Math.cos(phi);
                    const heightComponent = radius * Math.cos(theta);
                    positions[i + 1] = Math.min(maxStarHeight, Math.max(minStarHeight, heightComponent));
                    
                    // Use adjusted camera position (add 20 to Z) to maintain original behavior
                    positions[i + 2] = (camera.position.z + 20) - 1000 - Math.random() * 500;
                }
    
                // Update twinkle effect using luminosity
                const twinkle = Math.sin(time * twinkleSpeeds[i / 3] + twinklePhases[i / 3]);
                const luminosity = 0.5 + 0.5 * twinkle;
                
                // Apply luminosity to RGB values
                colors[i] = !DEBUG.toggles.showStars.value && starZ > camera.position.z + rearSceneryDistance ? 0 : luminosity;     // R
                colors[i + 1] = colors[i]; // G
                colors[i + 2] = colors[i]; // B
            }
            
            // Adjust star size based on average distance from camera
            if (starsInFront > 0) {
                const avgDistance = totalDistanceFromCamera / starsInFront;
                
                // Calculate size based on distance - stars get smaller as they get closer
                // Base size from debug settings
                const baseSize = DEBUG.variables.starSize.value;
                
                // Distance factor: closer stars are smaller, distant stars are larger
                // These values can be adjusted for the desired effect
                const minDistance = 300;  // Distance at which stars are smallest
                const maxDistance = 2000; // Distance at which stars are at max size
                
                let sizeFactor;
                if (avgDistance < minDistance) {
                    // Stars very close to camera are very small
                    sizeFactor = 0.5;
                } else if (avgDistance > maxDistance) {
                    // Distant stars are at full size
                    sizeFactor = 1.0;
                } else {
                    // Linear interpolation between min and max
                    sizeFactor = 0.5 + (0.5 * (avgDistance - minDistance) / (maxDistance - minDistance));
                }
                
                // Apply the size adjustment to individual stars based on their distance to z=0
                const positions = particleSystem.geometry.attributes.position.array;
                const colors = particleSystem.geometry.attributes.color.array;
                
                // Now let's make nearby stars (those close to z=0) even smaller
                // We'll apply this sizing effect to each individual vertex
                for (let i = 0; i < positions.length; i += 3) {
                    const starZ = positions[i + 2];
                    
                    // Calculate z-distance from camera (how close the star is to z=0)
                    const zDistanceToCamera = Math.abs(starZ - camera.position.z);
                    
                    // Apply size reduction for stars approaching z=0
                    const zDistanceThreshold = 100; // Distance from z=0 at which stars start shrinking
                    const minZSizeFactor = 0.1; // Smallest size factor for stars very close to z=0
                    
                    // Calculate the z-based size factor
                    let zSizeFactor = 1.0;
                    if (zDistanceToCamera < zDistanceThreshold) {
                        // Linear interpolation: stars get smaller as they approach z=0
                        zSizeFactor = minZSizeFactor + (1.0 - minZSizeFactor) * (zDistanceToCamera / zDistanceThreshold);
                        
                        // Shrink stars that are getting close to z=0 by reducing their brightness
                        if (starZ < camera.position.z) { // Only affect stars in front of camera
                            const currentLuminosity = colors[i]; // Get current star brightness
                            const reducedLuminosity = currentLuminosity * zSizeFactor;
                            
                            // Apply reduced brightness to make star appear smaller
                            colors[i] = reducedLuminosity;     // R
                            colors[i + 1] = reducedLuminosity; // G
                            colors[i + 2] = reducedLuminosity; // B
                        }
                    }
                }
                
                // Apply the overall size adjustment
                particleSystem.material.size = baseSize * sizeFactor;
            }
    
            // Mark attributes as needing update
            particleSystem.geometry.attributes.position.needsUpdate = true;
            particleSystem.geometry.attributes.color.needsUpdate = true;
        }
    } catch (error) {
        console.error("Error in stars animation:", error);
    }
}

function animateStreetLamps() {
    if (!streetLamps.length && DEBUG.toggles.showStreetLamps.value) createStreetLamps();
    streetLamps = streetLamps.map(lamp => {
        lamp.position.z += speed * frameScale;
        if (lamp.position.z > camera.position.z + rearSceneryDistance) {
            if (!DEBUG.toggles.showStreetLamps.value) { removeScenery(lamp); return null; }
            const x = lamp.position.x;
            removeScenery(lamp);
            const sceneName = scenes[isSceneTransitioning && Math.random() < sceneTransitionProgress ? nextSceneIndex : currentSceneIndex];
            lamp = createStreetLamp(sceneName);
            lamp.position.set(x, 0, camera.position.z - 400 + Math.random() * 50);
            scene.add(lamp);
        }
        updateSceneryFade(lamp);
        const day = Math.max(0, Math.sin(dayNightCycle));
        lamp.userData.light.intensity = Math.max(0, 0.8 - day) * THREE.MathUtils.smoothstep(lamp.userData.fadeAge, 0, sceneryFadeDuration) * rearSceneryFade(lamp.position.z - camera.position.z);
        return lamp;
    }).filter(Boolean);
}

const sceneryFadeDuration = 2500;

function startSceneryFade(object) {
    object.userData.fadeAge = 0;
    object.traverse(child => {
        const materials = child.material ? (Array.isArray(child.material) ? child.material : [child.material]) : [];
        materials.forEach(material => {
            material.userData.originalOpacity ??= material.opacity;
            material.userData.originalDepthWrite ??= material.depthWrite;
            material.transparent = true;
            material.depthWrite = false;
            material.opacity = 0;
        });
    });
}

function rearSceneryFade(distanceBehind) {
    return 1 - THREE.MathUtils.smoothstep(distanceBehind, 250, rearSceneryDistance);
}

function updateSceneryFade(object, retiring = false) {
    object.userData.fadeAge = Math.min(sceneryFadeDuration, (object.userData.fadeAge ?? sceneryFadeDuration) + deltaMilliseconds);
    const enter = THREE.MathUtils.smoothstep(object.userData.fadeAge, 0, sceneryFadeDuration);
    const exit = retiring ? 1 - THREE.MathUtils.smoothstep(object.userData.retireAge, 0, sceneryFadeDuration) : 1;
    const dayFactor = Math.max(0, Math.sin(dayNightCycle));
    const lighting = object.userData.type ? 0.7 + dayFactor * 0.3 : 1;
    const rearFade = object.userData.type === 'horizon'
        ? rearSceneryFade(object.userData.horizonTravel ?? 0)
        : ['mountain', 'skyscraper'].includes(object.userData.type)
            ? 1 - THREE.MathUtils.smoothstep(object.position.z - camera.position.z, rearMountainFadeStart, rearMountainDistance)
            : rearSceneryFade(object.position.z - camera.position.z);
    object.traverse(child => {
        const materials = child.material ? (Array.isArray(child.material) ? child.material : [child.material]) : [];
        let layerWeight = 1;
        for (let parent = child.parent; parent && parent !== object; parent = parent.parent) {
            layerWeight *= parent.userData.fadeWeight ?? 1;
        }
        materials.forEach(material => {
            material.userData.originalOpacity ??= material.opacity;
            material.opacity = material.userData.originalOpacity * enter * exit * lighting * layerWeight * rearFade;
            // Distant translucent scenery keeps the same depth behavior through
            // the fade endpoint; switching it there makes faces and edges snap.
            material.depthWrite = !object.userData.type && enter * exit * rearFade >= 1
                ? (material.userData.originalDepthWrite ?? material.depthWrite)
                : false;
        });
    });
}

function spawnSceneObject(sceneName, z) {
    const object = sceneObjects[sceneName].createObject();
    object.position.set(groundObjectX(100), 0, z);
    object.userData.scene = sceneName;
    startSceneryFade(object);
    scene.add(object);
    return object;
}

function animateBuildings() {
    // If buildings array is empty and toggle is on, create initial buildings
    if (buildings.length === 0 && DEBUG.toggles.showBuildings.value) {
        createBuildings();
        return;
    }

    buildings.forEach((building, index) => {
        if (!building) return;
        
        building.position.z += speed * frameScale;
        
        if (building.position.z > camera.position.z + rearSceneryDistance) {
            if (!DEBUG.toggles.showBuildings.value) {
                // Remove building when it passes behind camera if toggle is off
                removeScenery(building);
                buildings[index] = null;
                return;
            }
            
            // Keep on same side of road but randomize z
            const keepOnSameSide = building.position.x < 0 ? -1 : 1;
            building.position.z = camera.position.z - 400 + Math.random() * 50;
            building.position.x = keepOnSameSide * (roadWidth / 2 + 5 + Math.random() * 10);
            
            // Replace old building with new one to have variety
            removeScenery(building);
            buildings[index] = createRandomBuilding();
            buildings[index].position.x = building.position.x;
            buildings[index].position.z = building.position.z;
            startSceneryFade(buildings[index]);
            scene.add(buildings[index]);
        }
        updateSceneryFade(buildings[index]);
    });
    buildings = buildings.filter(Boolean);
}

function animateDesertObjects() {
    const additions = [];
    const keep = [];
    const targetScene = scenes[isSceneTransitioning ? nextSceneIndex : currentSceneIndex];
    const targetEnabled = DEBUG.toggles.showSceneObjects.value && DEBUG.sceneObjectsState[targetScene];
    const targetCount = DEBUG.variables.objectDensity.value;
    let activeCount = desertObjects.filter(object => object.userData.retireAge === undefined).length;
    for (const object of desertObjects) {
        object.position.z += speed * frameScale;
        const oldScene = object.userData.scene !== targetScene;
        const shouldRetire = oldScene && (!isSceneTransitioning || sceneTransitionProgress >= (object.userData.retireAt ?? 1));
        if (targetEnabled && object.userData.retireAge === undefined && shouldRetire) {
            object.userData.retireAge = 0;
            activeCount--;
        }
        if (object.userData.retireAge !== undefined) object.userData.retireAge += deltaMilliseconds;
        if (object.position.z > camera.position.z + rearSceneryDistance || object.userData.retireAge >= sceneryFadeDuration) {
            if (object.userData.retireAge === undefined) activeCount--;
            removeScenery(object);
        } else {
            updateSceneryFade(object, object.userData.retireAge !== undefined);
            keep.push(object);
        }
    }
    // Retiring objects may overlap their replacements briefly, but the live
    // population stays at the configured count and drains after each transition.
    const spawnScene = isSceneTransitioning ? targetScene : scenes[currentSceneIndex];
    if (targetEnabled) {
        for (let i = activeCount; i < targetCount; i++) {
            additions.push(spawnSceneObject(spawnScene, camera.position.z - 400 + Math.random() * 100));
        }
    }
    desertObjects = keep.concat(additions);
}

function animateMountains() {
    // Only log mountains count every 100 frames to reduce console spam
    if (frameCount % 100 === 0) {
        const activeMountains = mountains.filter(m => m !== null).length;
        console.log("Active mountains:", activeMountains, "Scene:", scenes[currentSceneIndex]);
    }

    // If mountains array is empty and toggle is on, create initial mountains
    if (mountains.length === 0 && DEBUG.toggles.showMountains.value) {
        console.log("No mountains found, creating new ones. Current scene:", scenes[currentSceneIndex]);
        createMountains();
        return;
    }
    
    mountains.forEach((mountain, index) => {
        if (!mountain) return;

        // Keep the distant horizon behind the camera instead of recycling it
        // into foreground scenery. Refresh it when the environment changes.
        if (mountain.userData.type === 'horizon' && DEBUG.toggles.showMountains.value) {
            mountain.position.z = camera.position.z + (mountain.userData.direction ?? -1) * 800;
            mountain.userData.horizonTravel = 0;
            const targetScene = scenes[isSceneTransitioning ? nextSceneIndex : currentSceneIndex];
            if (mountain.userData.scene !== targetScene && !mountain.userData.horizonBlend) {
                const outgoing = new THREE.Group();
                [...mountain.children].forEach(child => outgoing.add(child));
                const incoming = new THREE.Group();
                if (targetScene === 'city') createDistantSkylineSilhouette(incoming);
                else createDistantMountainRange(incoming, targetScene);
                incoming.traverse(child => {
                    if (child.material) {
                        child.material.userData.originalOpacity = child.material.opacity;
                        child.material.transparent = true;
                        child.material.depthWrite = false;
                    }
                });
                incoming.userData.fadeWeight = 0;
                outgoing.userData.fadeWeight = 1;
                mountain.add(outgoing, incoming);
                mountain.userData.horizonBlend = {outgoing, incoming, targetScene, elapsed: 0, duringTransition: isSceneTransitioning};
            }
            const blend = mountain.userData.horizonBlend;
            if (blend) {
                blend.elapsed += deltaMilliseconds;
                const progress = isSceneTransitioning
                    ? easeInOutCubic(sceneTransitionProgress)
                    : blend.duringTransition ? 1 : THREE.MathUtils.smoothstep(blend.elapsed, 0, sceneryFadeDuration);
                blend.incoming.userData.fadeWeight = progress;
                blend.outgoing.userData.fadeWeight = 1 - progress;
                if (progress >= 1) {
                    removeScenery(blend.outgoing);
                    [...blend.incoming.children].forEach(child => mountain.add(child));
                    mountain.remove(blend.incoming);
                    mountain.userData.scene = blend.targetScene;
                    delete mountain.userData.horizonBlend;
                }
            }
            updateSceneryFade(mountain);
            return;
        }

        if (mountain.userData.type === 'horizon') {
            mountain.userData.horizonTravel = (mountain.userData.horizonTravel ?? 0) + speed * frameScale;
            mountain.position.z += speed * frameScale;
            if (mountain.userData.horizonTravel >= rearSceneryDistance) {
                removeScenery(mountain);
                mountains[index] = null;
            } else updateSceneryFade(mountain);
            return;
        }
        mountain.position.z += speed * frameScale;

        if (mountain.position.z > camera.position.z + rearMountainDistance) {
            if (!DEBUG.toggles.showMountains.value) {
                // Remove mountain when it passes behind camera if toggle is off
                removeScenery(mountain);
                mountains[index] = null;
                return;
            }
            
            // When a mountain passes behind the camera, remove it and create a new one
            // with the current scene's style
            removeScenery(mountain);
            
            try {
                // Create a new mountain for the current scene
                const newMountain = new THREE.Group();
                
                // Use the same side of the road as the old mountain
                const side = mountain.position.x < 0 ? -1 : 1;
                const distanceFromRoad = mountainZoneStart + Math.random() * mountainZoneWidth;
                
                // Position the new mountain far behind the camera
                newMountain.position.x = side * distanceFromRoad;
                newMountain.position.z = camera.position.z - 500 - Math.random() * 100;
                
                // Create new mountain with current scene's style
                const isCity = scenes[currentSceneIndex] === 'city';
                
                if (isCity) {
                    // Call a function to create a skyscraper
                    createSkyscraper(newMountain, distanceFromRoad);
                } else {
                    // Call a function to create a mountain
                    createMountainChain(newMountain, distanceFromRoad, 0, 1);
                }
                
                // Store the scene info with the mountain/skyscraper
                newMountain.userData = {
                    scene: scenes[currentSceneIndex],
                    type: isCity ? 'skyscraper' : 'mountain'
                };
                
                startSceneryFade(newMountain);
                scene.add(newMountain);
                mountains[index] = newMountain;
                
                // Only log occasionally to reduce console spam
                if (frameCount % 10 === 0) {
                    console.log(`Replaced mountain with ${isCity ? 'skyscraper' : 'mountain'} for ${scenes[currentSceneIndex]}`);
                }
            } catch (error) {
                console.error("Error replacing mountain:", error);
                mountains[index] = null;
            }
        }
        if (mountains[index]) updateSceneryFade(mountains[index]);
    });
    mountains = mountains.filter(Boolean);
}

let lastFrameTime;
let deltaMilliseconds = 0;
let frameScale = 0;
let animationFrameId;

function animate(timestamp = performance.now()) {
    try {
        // Cap long gaps so returning to a background tab does not jump scenery.
        deltaMilliseconds = lastFrameTime === undefined ? 0 : Math.min(100, Math.max(0, timestamp - lastFrameTime));
        lastFrameTime = timestamp;
        frameScale = deltaMilliseconds * 60 / 1000;
        speed = DEBUG.variables.speed.value;
        dayNightSpeed = DEBUG.variables.dayNightSpeed.value;
        animationFrameId = requestAnimationFrame(animate);
        
        // Increment frame counter
        frameCount++;
        
        // Update FPS if enabled
        if (DEBUG.toggles.showFPS.value && typeof stats !== 'undefined') {
            stats.begin();
        }
        
        // Auto rotate scenes if enabled
        if (DEBUG.toggles.autoRotateScenes.value) {
            const currentTime = Date.now();
            if (currentTime - lastSceneChangeTime > sceneChangeDuration && !isSceneTransitioning) {
                startSceneTransition();
            }
        }
        
        // Update day/night cycle
        lunarPhase = (lunarPhase + dayNightSpeed * frameScale / 8) % (Math.PI * 2);
        dayNightCycle += dayNightSpeed * frameScale;
        dayNightCycle %= Math.PI * 2;
        
        // Calculate day/night factor (0 = night, 1 = day)
        const dayFactor = Math.max(0, Math.sin(-dayNightCycle + Math.PI));
        const wasNight = isNight;
        isNight = dayFactor < 0.3; // Consider it night when the light level is below 30%
        
        // Manage stars during night and transition
        if (dayFactor < 0.7 && DEBUG.toggles.showStars.value) {
            // Create initial stars if they don't exist at all
            if (stars.length === 0) {
                try {
                    console.log("Creating initial stars");
                    createStars();
                    if (isNight) {
                        log('Stars created for nighttime', 'info');
                    }
                } catch (error) {
                    console.error('Error creating stars:', error);
                }
            }
            
            // Existing star particles recycle their positions in animateStars;
            // adding systems every frame interval would grow the sky indefinitely.

            // Clean up only star systems that have passed behind the camera
            if (stars.length > 1) { // Keep at least one star system
                const starsToKeep = [];
                
                for (let i = 0; i < stars.length; i++) {
                    const starSystem = stars[i];
                    if (!starSystem) continue;
                    
                    // Check if all stars in this system are behind the camera
                    const positions = starSystem.geometry.attributes.position.array;
                    let allStarsBehindCamera = true;
                    
                    // Sample some stars to determine if the system is behind the camera
                    const sampleSize = Math.min(50, positions.length / 3); // Check up to 50 stars
                    const step = Math.max(1, Math.floor((positions.length / 3) / sampleSize));
                    
                    for (let j = 0; j < positions.length; j += 3 * step) {
                        const starZ = positions[j + 2];
                        if (starZ < camera.position.z + rearSceneryDistance) {
                            // At least one star is in front of camera, keep this system
                            allStarsBehindCamera = false;
                            break;
                        }
                    }
                    
                    if (allStarsBehindCamera) {
                        // All sampled stars are behind camera, remove this system
                        scene.remove(starSystem);
                        if (starSystem.geometry) starSystem.geometry.dispose();
                        if (starSystem.material) starSystem.material.dispose();
                        
                        // Add new stars when old ones are behind the camera
                        // Use a threshold of 100 ft (convert to scene units)
                        const threshold = 100 * 0.3048; // Convert feet to meters (scene units)
                        
                        // Calculate average z position of the first few stars to determine distance
                        let avgStarZ = 0;
                        const sampleCount = Math.min(10, positions.length / 3);
                        for (let k = 0; k < sampleCount; k++) {
                            avgStarZ += positions[k * 3 + 2];
                        }
                        avgStarZ /= sampleCount;
                        
                        if (camera.position.z - avgStarZ > threshold) {
                            try {
                                // Add a new star system to replace the one that was removed
                                addStars(Math.floor(DEBUG.variables.starCount.value / 2));
                                console.log("Added new stars after old ones went behind camera");
                            } catch (error) {
                                console.error('Error adding replacement stars:', error);
                            }
                        }
                    } else {
                        // Some stars are still visible, keep this system
                        starsToKeep.push(starSystem);
                    }
                }
                
                stars = starsToKeep;
            }
        }
        
        // Get current scene colors
        const currentState = sceneStates[scenes[currentSceneIndex]];
        const dayColors = currentState.dayColors;
        const nightColors = currentState.nightColors;
        
        // Calculate base colors for current time of day
        let targetSkyColor = dayColors.sky.clone().lerp(nightColors.sky, 1 - dayFactor);
        let targetGroundColor = dayColors.ground.clone().lerp(nightColors.ground, 1 - dayFactor);
        let targetAmbientIntensity = dayColors.ambient * dayFactor + nightColors.ambient * (1 - dayFactor);
        
        // Handle scene transitions
        if (isSceneTransitioning) {
            try {
                const nextState = sceneStates[scenes[nextSceneIndex]];
                const nextDayColors = nextState.dayColors;
                const nextNightColors = nextState.nightColors;
                
                // Calculate target colors for next scene
                const nextSkyColor = nextDayColors.sky.clone().lerp(nextNightColors.sky, 1 - dayFactor);
                const nextGroundColor = nextDayColors.ground.clone().lerp(nextNightColors.ground, 1 - dayFactor);
                const nextAmbientIntensity = nextDayColors.ambient * dayFactor + nextNightColors.ambient * (1 - dayFactor);
                
                // Interpolate between current and next scene
                const t = easeInOutCubic(sceneTransitionProgress);
                targetSkyColor.lerp(nextSkyColor, t);
                targetGroundColor.lerp(nextGroundColor, t);
                targetAmbientIntensity = targetAmbientIntensity * (1 - t) + nextAmbientIntensity * t;
                
                updateSceneTransition();
            } catch (error) {
                console.error('Error in scene transition:', error);
                isSceneTransitioning = false;
            }
        }
        
        // Update scene colors
        scene.background = targetSkyColor;
        scene.fog.color.copy(targetSkyColor);
        
        if (groundPlane) {
            groundPlane.material.color.copy(targetGroundColor);
        }
        
        updateRoadAppearance(dayFactor);

        // Update lights
        if (ambientLight) {
            ambientLight.intensity = targetAmbientIntensity;
        }
        if (directionalLight) {
            directionalLight.intensity = Math.max(0.2, dayFactor);
        }
        
        // Keep scene selection in sync with manual and automatic transitions.
        document.querySelectorAll('[data-scene-index]').forEach(button => {
            const selected = Number(button.dataset.sceneIndex) === (isSceneTransitioning ? nextSceneIndex : currentSceneIndex);
            button.style.background = selected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
            button.setAttribute('aria-pressed', String(selected));
            button.disabled = isSceneTransitioning;
        });
        updateStatusDisplay(dayFactor);

        // Update mountain lighting based on day/night cycle
        updateMountainLighting(dayFactor);

        // Animate components
        const animations = [
            { name: 'road', func: animateRoad },
            { name: 'traffic', func: animateTraffic },
            { name: 'desert objects', func: animateDesertObjects },
            { name: 'buildings', func: animateBuildings },
            { name: 'mountains', func: animateMountains },
            { name: 'specks', func: animateSpecks },
            { name: 'clouds', func: animateClouds },
            { name: 'stars', func: animateStars },
            { name: 'street lamps', func: animateStreetLamps }
        ];

        for (const animation of animations) {
            try {
                animation.func();
            } catch (error) {
                console.error(`Error in ${animation.name} animation:`, error);
            }
        }

        // Update camera and render
        try {
            updateCamera();
            updateCelestialCycle();
            renderer.render(scene, camera);
        } catch (error) {
            console.error('Error in render cycle:', error);
            throw error;
        }

        // End FPS measurement
        if (DEBUG.toggles.showFPS.value && typeof stats !== 'undefined') {
            stats.end();
        }

    } catch (error) {
        log('Critical animation error: ' + error.message, 'error');
        cancelAnimationFrame(animationFrameId);
        throw error;
    }
}

function startSceneTransition(targetIndex = (currentSceneIndex + 1) % scenes.length) {
    isSceneTransitioning = true;
    sceneTransitionProgress = 0;
    nextSceneIndex = targetIndex;
    desertObjects.forEach(object => {
        // Spread retirement through the whole transition, including at zero speed.
        object.userData.retireAt = Math.random();
    });
    console.log(`Starting transition from ${scenes[currentSceneIndex]} to ${scenes[nextSceneIndex]}`);
    

}

function updateSceneTransition() {
    sceneTransitionProgress += deltaMilliseconds / DEBUG.variables.sceneTransitionDuration.value;
    
    if (sceneTransitionProgress >= 1) {
        isSceneTransitioning = false;
        currentSceneIndex = nextSceneIndex;
        lastSceneChangeTime = Date.now();
        sceneTransitionProgress = 0;
        
        return;
    }
    
    const eased = easeInOutCubic(sceneTransitionProgress);
    
    const currentState = sceneStates[scenes[currentSceneIndex]];
    const nextState = sceneStates[scenes[nextSceneIndex]];
    
    // Interpolate between current and next state colors
    if (groundPlane && groundPlane.material) {
        groundPlane.material.color.copy(currentState.dayColors.ground)
            .lerp(nextState.dayColors.ground, eased);
        groundPlane.material.opacity = 1.0;
    }
    
    // Update fog and sky colors
    const currentSkyColor = currentState.dayColors.sky.clone();
    const nextSkyColor = nextState.dayColors.sky.clone();
    scene.fog.color.copy(currentSkyColor).lerp(nextSkyColor, eased);
    scene.background.copy(currentSkyColor).lerp(nextSkyColor, eased);
    

}

// Add easing function for smoother transitions
function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// Small palette shifts keep lane markings legible throughout a transition.
const roadPalettes = {
    desert: { surface: 0x211B18, edge: 0xE9D6B1, center: 0xEFC66D },
    forest: { surface: 0x141F1B, edge: 0xBDD4C7, center: 0xCFCC83 },
    snowy: { surface: 0x25313C, edge: 0xDEEAF0, center: 0xC3D4A0 },
    city: { surface: 0x171C2A, edge: 0xC6D3E5, center: 0xE1C588 }
};

function updateRoadAppearance(dayFactor) {
    const current = roadPalettes[scenes[currentSceneIndex]];
    const next = roadPalettes[scenes[nextSceneIndex]];
    const blend = isSceneTransitioning ? easeInOutCubic(sceneTransitionProgress) : 0;
    const color = key => new THREE.Color(current[key]).lerp(new THREE.Color(next[key]), blend);
    const surface = color('surface').multiplyScalar(0.5 + dayFactor * 0.5);
    const edge = color('edge').multiplyScalar(0.7 + dayFactor * 0.3);
    const center = color('center').multiplyScalar(0.75 + dayFactor * 0.25);
    roadSegments.forEach(road => road.material.color.copy(surface));
    [leftEdgeLine, rightEdgeLine].forEach(line => { if (line) line.material.color.copy(edge); });
    [leftYellowLine, rightYellowLine].forEach(line => { if (line) line.material.color.copy(center); });
}

let traffic = [];
let trafficWait = 6000;

function createTrafficCar() {
    const car = new THREE.Group();
    const colors = [0xBCDDE8, 0xE7BFA2, 0xCFBEE3, 0xC2D7B4];
    const tint = colors[Math.floor(Math.random() * colors.length)];
    const shell = new THREE.MeshBasicMaterial({color: tint, transparent: true, opacity: 0.08, depthWrite: false});
    const edges = new THREE.LineBasicMaterial({color: tint, transparent: true, opacity: 0.8, depthWrite: false});
    const box = (width, height, length, y, z) => {
        const geometry = new THREE.BoxGeometry(width, height, length);
        const body = new THREE.Mesh(geometry, shell);
        body.position.set(0, y, z);
        const frame = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edges);
        frame.position.copy(body.position);
        car.add(body, frame);
    };
    box(1.8, 0.65, 3.8, 0.65, 0);
    box(1.45, 0.65, 1.8, 1.3, -0.25);
    for (const x of [-0.95, 0.95]) {
        for (const z of [-1.1, 1.1]) {
            const points = Array.from({length: 16}, (_, i) => {
                const angle = i * Math.PI * 2 / 16;
                return new THREE.Vector3(x, 0.38 + Math.cos(angle) * 0.32, z + Math.sin(angle) * 0.32);
            });
            car.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), edges));
        }
    }
    const headlightMaterial = new THREE.MeshBasicMaterial({color: 0xFFF0CA, transparent: true, opacity: 0.9, depthWrite: false});
    const headlightGeometry = new THREE.BoxGeometry(0.3, 0.18, 0.06);
    for (const x of [-0.6, 0.6]) {
        const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlight.position.set(x, 0.75, 1.93);
        car.add(headlight);
    }
    car.position.set(-roadWidth / 4, 0, camera.position.z - 500);
    car.userData.approachSpeed = 1.4 + Math.random() * 0.6;
    startSceneryFade(car);
    return car;
}

function animateTraffic() {
    const enabled = DEBUG.toggles.showTraffic.value && DEBUG.toggles.showRoad.value;
    if (enabled) {
        trafficWait -= deltaMilliseconds;
        if (trafficWait <= 0 && traffic.length < 3) {
            const car = createTrafficCar();
            scene.add(car);
            traffic.push(car);
            trafficWait = 12000 + Math.random() * 13000;
        }
    }
    traffic = traffic.filter(car => {
        car.position.z += (speed + car.userData.approachSpeed) * frameScale;
        updateSceneryFade(car);
        if (car.position.z > camera.position.z + rearSceneryDistance) {
            removeScenery(car);
            return false;
        }
        return true;
    });
}

function animateRoad() {
    if (!DEBUG.toggles.showRoad.value) {
        roadSegments.forEach(road => road.position.z += speed * frameScale);
        [leftEdgeLine, rightEdgeLine, leftYellowLine, rightYellowLine].forEach(line => {
            if (line) line.position.z += speed * frameScale;
        });
        if (roadSegments.length && roadSegments[0].position.z - 400 > camera.position.z + rearSceneryDistance) {
            roadSegments.forEach(removeScenery);
            [leftEdgeLine, rightEdgeLine, leftYellowLine, rightYellowLine].forEach(removeScenery);
            roadSegments = [];
            leftEdgeLine = rightEdgeLine = leftYellowLine = rightYellowLine = null;
        }
        return;
    }

    // If toggle is on and road elements don't exist, recreate them
    if (roadSegments.length === 0) {
        createRoad();
        return;
    }

    // Move the main road
    roadSegments.forEach(segment => {
        if (!segment) return;
        segment.position.z += speed * frameScale;
        
        // Reset road when it's far behind the camera
        const roadEndPosition = segment.position.z + roadLength * segmentCount * 4;
        if (roadEndPosition < camera.position.z + 200) { // Keep 200 units of road ahead at all times
            // Position the road at z=0 relative to the camera
            segment.position.z = 0;
        }
    });
    
    // Move and reset the lines with the same logic
    [leftEdgeLine, rightEdgeLine, leftYellowLine, rightYellowLine].forEach(line => {
        if (line) {
            line.position.z += speed * frameScale;
            const lineEndPosition = line.position.z + roadLength * segmentCount * 4;
            if (lineEndPosition < camera.position.z + 200) {
                // Position the lines at z=0 relative to the camera
                line.position.z = 0;
            }
        }
    });
}

function animateSpecks() {
    const enabled = DEBUG.toggles.showSpecks.value;
    const count = Math.max(0, Math.floor(DEBUG.variables.speckCount.value));
    if (enabled && specks.length !== count) createSpecks();
    if (!speckMesh) return;
    let colorsChanged = false;
    for (let i = 0; i < specks.length; i++) {
        if (!activeSpecks[i]) {
            if (!enabled) continue;
            resetSpeck(i, camera.position.z - 400 + Math.random() * speckFieldLength);
            colorsChanged = true;
        }
        specks[i].z += speed * frameScale;
        const front = camera.position.z + speckRearOffset - speckFieldLength;
        const relativeZ = specks[i].z - front;
        if (relativeZ < 0 || relativeZ >= speckFieldLength) {
            // Wrap in either direction, preserving overshoot and particle spacing.
            if (enabled) resetSpeck(i, front + ((relativeZ % speckFieldLength) + speckFieldLength) % speckFieldLength);
            else activeSpecks[i] = false;
            colorsChanged = true;
        }
        updateSpeckTransform(i);
    }
    speckMesh.instanceMatrix.needsUpdate = true;
    if (colorsChanged) speckMesh.instanceColor.needsUpdate = true;
}

function createClouds() {
    // Clear existing clouds
    clouds.forEach(cloud => scene.remove(cloud));
    clouds = [];

    // Create several clouds at different positions
    const cloudCount = 10;
    for (let i = 0; i < cloudCount; i++) {
        const cloud = new THREE.Group();
        
        // Create multiple boxes for each cloud
        const particleCount = Math.floor(Math.random() * 3) + 2;
        for (let j = 0; j < particleCount; j++) {
            const width = Math.random() * 20 + 15;
            const height = Math.random() * 5 + 3;
            const depth = Math.random() * 10 + 8;
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.6,
                depthWrite: false
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
        
        // Position cloud in sky
        cloud.position.set(
            (Math.random() - 0.5) * 400,  // Spread clouds wider
            100 + Math.random() * 50,     // Height variation
            -i * 200 - Math.random() * 200 // Spread along z-axis
        );
        
        // Store movement properties
        cloud.userData = {
            speed: 0.1 + Math.random() * 0.2,
            originalX: cloud.position.x
        };
        
        startSceneryFade(cloud);
        scene.add(cloud);
        clouds.push(cloud);
    }
}

function animateClouds() {
    clouds.forEach(cloud => {
        // Move cloud forward with scene
        cloud.position.z += speed * frameScale * 0.5; // Clouds move slower than ground
        
        // Gentle sideways drift
        cloud.position.x = cloud.userData.originalX + Math.sin(Date.now() * 0.0001) * 10;
        
        // If cloud is behind camera, move it far ahead
        if (cloud.position.z > camera.position.z + rearSceneryDistance) {
            cloud.position.z = camera.position.z - 600 - Math.random() * 200;
            cloud.userData.originalX = (Math.random() - 0.5) * 400;
            cloud.position.x = cloud.userData.originalX;
            startSceneryFade(cloud);
        }
        
        updateSceneryFade(cloud);
        // Adjust opacity based on day/night cycle
        cloud.children.forEach(particle => {
            const dayFactor = (Math.sin(dayNightCycle) + 1) / 2;
            particle.material.opacity *= (0.3 + dayFactor * 0.3) / 0.6;
        });
    });
}

// Performance monitoring
let stats; // Global stats variable

function initStats() {
    if (typeof Stats === 'undefined') {
        console.warn('Stats.js not loaded, FPS counter disabled');
        return null;
    }
    
    stats = new Stats();
    stats.dom.classList.add('fps-overlay');
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
    return stats;
}

function setupEventListeners() {
    try {
        window.addEventListener('keydown', (e) => {
            if (e.target instanceof HTMLElement &&
                (e.target.matches('input, textarea, select') || e.target.isContentEditable)) return;
            if (e.key.startsWith('Arrow')) e.preventDefault();
            keysPressed[e.key.toLowerCase()] = true;
            if (e.repeat) return;
            
            // Toggle debug menu with backtick
            if (e.key === '`' || e.key === '~') {
                e.preventDefault();
                toggleControls();
            }
            
            // Toggle day/night with 'n' key
            if (e.key === 'n' || e.key === 'N') {
                dayNightCycle = isNight ? Math.PI / 2 : Math.PI * 1.5;
                log(`Changed to ${isNight ? 'day' : 'night'}`, 'info');
            }
            
            // Force scene change with 'm' key
            if (e.key === 'm' || e.key === 'M') {
                if (!isSceneTransitioning) {
                    startSceneTransition();
                }
            }
            
            // Reset camera with ESC key
            if (e.key === 'Escape') {
                camera.position.set(2, 2.5, 0);
                setCameraView(0);
                camera.lookAt(cameraTarget);
                log('Camera position reset', 'info');
            }

            // Cycle cardinal views clockwise without moving the camera.
            if (e.key === 'r' || e.key === 'R') cycleCameraView();

        });
        
        window.addEventListener('keyup', (e) => {
            keysPressed[e.key.toLowerCase()] = false;
        });
        
        window.addEventListener('blur', () => {
            Object.keys(keysPressed).forEach(key => delete keysPressed[key]);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

function updateCamera() {
    const moveSpeed = DEBUG.variables.moveSpeed.value * frameScale;
    // Forward/Backward movement
    if (keysPressed['w'] || keysPressed['W'] || keysPressed['arrowUp']) {
        camera.position.z -= moveSpeed;
        cameraTarget.z -= moveSpeed;
    }
    if (keysPressed['s'] || keysPressed['S'] || keysPressed['arrowDown']) {
        camera.position.z += moveSpeed;
        cameraTarget.z += moveSpeed;
    }
    
    // Left/Right movement
    if (keysPressed['a'] || keysPressed['A'] || keysPressed['arrowLeft']) {
        camera.position.x -= moveSpeed;
        cameraTarget.x -= moveSpeed;
    }
    if (keysPressed['d'] || keysPressed['D'] || keysPressed['arrowRight']) {
        camera.position.x += moveSpeed;
        cameraTarget.x += moveSpeed;
    }
    
    // Up/Down movement
    if (keysPressed['q'] || keysPressed['Q']) {
        camera.position.y += moveSpeed;
        cameraTarget.y += moveSpeed;
    }
    if (keysPressed['e'] || keysPressed['E']) {
        camera.position.y = Math.max(1, camera.position.y - moveSpeed);
        cameraTarget.y = Math.max(0, cameraTarget.y - moveSpeed);
    }
    
    // Update camera look target
    camera.lookAt(cameraTarget);
}

function createStatusDisplay() {
    const statusDisplay = document.getElementById('status-display');
    if (!statusDisplay) return;
    
    statusDisplay.style.cssText = `
        padding: 10px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 5px;
        margin-bottom: 15px;
    `;
}

function updateStatusDisplay(dayFactor) {
    const statusDisplay = document.getElementById('status-display');
    if (!statusDisplay) return;
    
    const timeOfDay = dayFactor > 0.5 ? 'Day' : 'Night';
    const currentScene = scenes[currentSceneIndex].charAt(0).toUpperCase() + scenes[currentSceneIndex].slice(1);
    const lightLevel = Math.round(dayFactor * 100);
    
    // Format camera position with 2 decimal places
    const posX = camera ? camera.position.x.toFixed(2) : "N/A";
    const posY = camera ? camera.position.y.toFixed(2) : "N/A";
    const posZ = camera ? camera.position.z.toFixed(2) : "N/A";
    
    statusDisplay.innerHTML = `
        <div style="font-size: 14px; margin-bottom: 5px;">
            <strong>Status</strong>
        </div>
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px; font-size: 12px;">
            <div>Time:</div><div>${timeOfDay}</div>
            <div>Scene:</div><div>${currentScene}</div>
            <div>Light Level:</div><div>${lightLevel}%</div>
            <div>Position:</div><div>X: ${posX}, Y: ${posY}, Z: ${posZ}</div>
        </div>
    `;
}

// Initialize the application when the page loads
window.addEventListener('DOMContentLoaded', init);

// Export functions for external access if needed
if (typeof module !== 'undefined') {
    module.exports = {
        init,
        animate
    };
}

// Add new function to create visibility section
function createVisibilitySection() {
    const section = document.createElement('div');
    const hint = document.createElement('p');
    hint.textContent = 'Turn a switch off to stop new spawns. Existing scenery stays until you pass it.';
    hint.style.cssText = 'font-size: 12px; line-height: 1.5; opacity: 0.75; margin: 0 0 12px;';
    section.appendChild(hint);
    
    // Add main object toggles
    const mainToggles = ['showRoad', 'showTraffic', 'showBuildings', 'showStreetLamps', 'showMountains', 'showSceneObjects', 'showStars', 'showSpecks'];
    addToggles(section, mainToggles);
    
    // Add scene-specific object toggles
    const sceneTogglesDiv = document.createElement('div');
    sceneTogglesDiv.style.cssText = `
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
    `;
    sceneTogglesDiv.innerHTML = '<div style="font-size: 12px; margin-bottom: 10px;">Scene-Specific Objects</div>';
    
    scenes.forEach(scene => {
        const toggleContainer = document.createElement('label');
        toggleContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        `;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = DEBUG.sceneObjectsState[scene];
        checkbox.id = `toggle-${scene}-objects`;
        
        const label = document.createElement('span');
        label.textContent = scene.charAt(0).toUpperCase() + scene.slice(1);
        label.style.fontSize = '12px';
        
        checkbox.addEventListener('change', (e) => {
            DEBUG.sceneObjectsState[scene] = e.target.checked;
            log(`Toggled ${scene} objects to ${e.target.checked}`, 'info');
        });
        
        toggleContainer.appendChild(checkbox);
        toggleContainer.appendChild(label);
        sceneTogglesDiv.appendChild(toggleContainer);
    });
    
    section.appendChild(sceneTogglesDiv);
    return section;
}

// Add new function to create presets section
function createPresetsSection() {
    const section = document.createElement('div');
    section.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
    section.style.paddingBottom = '15px';
    section.style.marginBottom = '15px';
    
    // Create preset selector
    const presetSelect = document.createElement('select');
    presetSelect.style.cssText = `
        width: 200px;
        padding: 5px;
        margin-right: 10px;
        background: rgba(0, 0, 0, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
    `;
    
    function updatePresetOptions() {
        presetSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = 'Default';
        presetSelect.appendChild(defaultOption);
        
        // Add saved presets
        Object.keys(DEBUG.presets.saved).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            presetSelect.appendChild(option);
        });
    }
    
    // Create load button
    const loadButton = createButton('Load', () => {
        DEBUG.loadPreset(presetSelect.value);
        updateDebugMenu();
    });
    
    // Create save input and button
    const saveContainer = document.createElement('div');
    saveContainer.style.marginTop = '10px';
    
    const saveInput = document.createElement('input');
    saveInput.type = 'text';
    saveInput.placeholder = 'Preset name';
    saveInput.style.cssText = `
        width: 150px;
        padding: 5px;
        margin-right: 10px;
        background: rgba(0, 0, 0, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
    `;
    
    const saveButton = createButton('Save', () => {
        const name = saveInput.value.trim();
        if (name) {
            DEBUG.savePreset(name);
            saveInput.value = '';
            updatePresetOptions();
        }
    });
    
    // Create delete button
    const deleteButton = createButton('Delete', () => {
        const name = presetSelect.value;
        if (name !== 'default') {
            delete DEBUG.presets.saved[name];
            DEBUG.savePresetsToLocalStorage();
            updatePresetOptions();
            log(`Deleted preset: ${name}`, 'info');
        }
    });
    deleteButton.style.marginLeft = '10px';
    
    // Add elements to section
    section.appendChild(presetSelect);
    section.appendChild(loadButton);
    section.appendChild(saveContainer);
    saveContainer.appendChild(saveInput);
    saveContainer.appendChild(saveButton);
    saveContainer.appendChild(deleteButton);
    
    // Initialize preset options
    updatePresetOptions();
    
    return section;
}

function updateStars() {
    createStars();
    log('Star settings applied', 'info');
}

// Helper function to create a skyscraper for the city scene
function createSkyscraper(mountain, distanceFromRoad) {
    // Scene-specific color palettes for buildings
    const cityPalette = [
        new THREE.Color(0x696969), // Dim gray
        new THREE.Color(0x808080), // Gray
        new THREE.Color(0xA9A9A9), // Dark gray
        new THREE.Color(0xDCDCDC)  // Gainsboro
    ];

    // Calculate distance from camera - buildings far away will have fewer details
    const distanceFromCamera = Math.abs(mountain.position.z - camera.position.z);
    
    // Skip very distant buildings
    if (distanceFromCamera > 1200) {
        // For very distant buildings, create taller horizon buildings
        const height = Math.random() * 120 + 80; // Taller for better horizon effect
        const width = Math.random() * 20 + 15;   // Wider for more presence
        const depth = Math.random() * 20 + 15;
        
        const buildingGeo = new THREE.BoxGeometry(width, height, depth);
        const buildingColor = cityPalette[Math.floor(Math.random() * cityPalette.length)];
        const buildingMat = new THREE.MeshBasicMaterial({ color: buildingColor });
        
        const buildingMesh = new THREE.Mesh(buildingGeo, buildingMat);
        buildingMesh.position.y = height / 2;
        mountain.add(buildingMesh);
        return;
    }
    
    // For closer buildings, create a more detailed structure - taller for skyline effect
    const height = Math.random() * 120 + 60; // Taller buildings for impressive skyline
    const width = Math.random() * 20 + 15;   // Wider for better proportions
    const depth = Math.random() * 20 + 15;
    
    // Choose a random building style
    const buildingStyle = Math.floor(Math.random() * 3);
    
    if (buildingStyle === 0) {
        // Style 1: Basic tower with emissive strips for windows
        createBasicTower(mountain, width, depth, height, cityPalette);
    } else if (buildingStyle === 1) {
        // Style 2: Tiered building (gets narrower toward the top)
        createTieredBuilding(mountain, width, depth, height, cityPalette);
    } else {
        // Style 3: Office building with grid pattern of windows
        createOfficeBuilding(mountain, width, depth, height, cityPalette);
    }
}

// Create a basic tower building with horizontal light strips
function createBasicTower(mountain, width, depth, height, cityPalette) {
    // Main building
    const buildingGeo = new THREE.BoxGeometry(width, height, depth);
    const buildingColor = cityPalette[Math.floor(Math.random() * cityPalette.length)];
    const buildingMat = new THREE.MeshBasicMaterial({ color: buildingColor });
    
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.y = height / 2;
    mountain.add(building);
    
    // Add horizontal light strips for windows
    const stripCount = Math.floor(height / 8); // One strip every 8 units
    const stripWidth = width * 0.8;
    const stripDepth = 0.1;
    const stripHeight = 0.5;
    
    // Window light color - slight variation in color
    const windowColor = new THREE.Color(0xFFFF99).lerp(
        new THREE.Color(Math.random() > 0.5 ? 0xFFDDAA : 0xCCFFFF), 
        Math.random() * 0.3
    );
    
    const stripGeo = new THREE.BoxGeometry(stripWidth, stripHeight, stripDepth);
    const stripMat = new THREE.MeshBasicMaterial({
        color: windowColor,
        transparent: true,
        opacity: 0.6 + Math.random() * 0.2
    });
    
    // Create front strips
    for (let i = 0; i < stripCount; i++) {
        if (Math.random() < 0.2) continue; // 20% chance to skip a floor
        
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.z = depth / 2 + 0.1;
        strip.position.y = i * 8 - height / 2 + 4; // Position along height
        mountain.add(strip);
        
        // Add a strip to the opposite side
        if (Math.random() > 0.3) { // 70% chance to have windows on back
            const backStrip = new THREE.Mesh(stripGeo, stripMat);
            backStrip.position.z = -depth / 2 - 0.1;
            backStrip.position.y = strip.position.y;
            mountain.add(backStrip);
        }
    }
    
    // Side strips - only for buildings close to the road
    if (Math.abs(mountain.position.x) < 300) {
        const sideStripWidth = depth * 0.8;
        const sideStripGeo = new THREE.BoxGeometry(stripDepth, stripHeight, sideStripWidth);
        
        // Create side strips only on the side facing the road
        const sideSign = mountain.position.x > 0 ? -1 : 1; // Negative for right side, positive for left
        
        for (let i = 0; i < stripCount; i++) {
            if (Math.random() < 0.3) continue; // 30% chance to skip a floor
            
            const sideStrip = new THREE.Mesh(sideStripGeo, stripMat);
            sideStrip.position.x = sideSign * (width / 2 + 0.1);
            sideStrip.position.y = i * 8 - height / 2 + 4; // Position along height
            mountain.add(sideStrip);
        }
    }
}

// Create a tiered building that gets narrower toward the top
function createTieredBuilding(mountain, width, depth, height, cityPalette) {
    const tiers = Math.floor(Math.random() * 2) + 2; // 2-3 tiers
    const tierHeight = height / tiers;
    
    // Window light color
    const windowColor = new THREE.Color(0xFFFF99);
    
    for (let i = 0; i < tiers; i++) {
        const tierWidth = width * (1 - i * 0.2);
        const tierDepth = depth * (1 - i * 0.2);
        
        const tierGeo = new THREE.BoxGeometry(tierWidth, tierHeight, tierDepth);
        const tierColor = cityPalette[Math.floor(Math.random() * cityPalette.length)];
        const tierMat = new THREE.MeshBasicMaterial({ color: tierColor });
        
        const tier = new THREE.Mesh(tierGeo, tierMat);
        tier.position.y = i * tierHeight + tierHeight / 2;
        mountain.add(tier);
        
        // Add a subtle glow around the edges for windows
        if (i < tiers - 1) { // Skip the top tier
            const glowWidth = tierWidth + 0.5;
            const glowDepth = tierDepth + 0.5;
            const glowHeight = 0.5;
            
            const glowGeo = new THREE.BoxGeometry(glowWidth, glowHeight, glowDepth);
            const glowMat = new THREE.MeshBasicMaterial({
                color: windowColor,
                transparent: true,
                opacity: 0.4
            });
            
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.y = (i + 1) * tierHeight - 0.2;
            mountain.add(glow);
        }
    }
}

// Create an office building with a grid of windows
function createOfficeBuilding(mountain, width, depth, height, cityPalette) {
    // Main building
    const buildingGeo = new THREE.BoxGeometry(width, height, depth);
    const buildingColor = cityPalette[Math.floor(Math.random() * cityPalette.length)];
    const buildingMat = new THREE.MeshBasicMaterial({ color: buildingColor });
    
    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.y = height / 2;
    mountain.add(building);
    
    // Distance from camera affects detail level
    const distanceFromCamera = Math.abs(mountain.position.z - camera.position.z);
    
    // Instead of using a shader for the windows which can cause flickering,
    // use a simpler approach with fewer, larger window panels
    if (distanceFromCamera < 800) {
        // Add window panels on sides
        const windowColor = new THREE.Color(0xFFFF99);
        
        // Offset from the building surface to prevent z-fighting
        const offset = 0.15;
        
        // Number of floors and windows per floor - use fewer divisions to reduce flickering
        const floors = Math.min(10, Math.floor(height / 6));
        const windowsPerFloor = Math.min(8, Math.floor(width / 4));
        
        // Window dimensions
        const windowWidth = (width * 0.9) / windowsPerFloor;
        const windowHeight = (height * 0.8) / floors;
        const windowGeo = new THREE.PlaneGeometry(windowWidth * 0.7, windowHeight * 0.7);
        
        // Create windows on front face
        for (let floor = 0; floor < floors; floor++) {
            for (let w = 0; w < windowsPerFloor; w++) {
                // Only create some windows (random pattern)
                if (Math.random() > 0.4) { // 60% chance for a window
                    const windowMat = new THREE.MeshBasicMaterial({
                        color: windowColor,
                        transparent: true,
                        opacity: 0.5 + Math.random() * 0.3
                    });
                    
                    const window = new THREE.Mesh(windowGeo, windowMat);
                    
                    // Position windows evenly across the face
                    window.position.x = (w - windowsPerFloor/2 + 0.5) * (width / windowsPerFloor);
                    window.position.y = (floor - floors/2 + 0.5) * (height / floors);
                    window.position.z = depth/2 + offset;
                    
                    mountain.add(window);
                }
            }
        }
        
        // Create windows on the side facing the road
        const sideSign = mountain.position.x > 0 ? -1 : 1; // Negative for right side, positive for left
        const sideWindowsPerFloor = Math.min(6, Math.floor(depth / 4));
        
        for (let floor = 0; floor < floors; floor++) {
            for (let w = 0; w < sideWindowsPerFloor; w++) {
                // Only create some windows (random pattern)
                if (Math.random() > 0.4) { // 60% chance for a window
                    const windowMat = new THREE.MeshBasicMaterial({
                        color: windowColor,
                        transparent: true,
                        opacity: 0.5 + Math.random() * 0.3
                    });
                    
                    const window = new THREE.Mesh(windowGeo, windowMat);
                    
                    // Position windows evenly across the side
                    window.position.x = sideSign * (width/2 + offset);
                    window.position.y = (floor - floors/2 + 0.5) * (height / floors);
                    window.position.z = (w - sideWindowsPerFloor/2 + 0.5) * (depth / sideWindowsPerFloor);
                    
                    window.rotation.y = Math.PI / 2;
                    mountain.add(window);
                }
            }
        }
    }
}

// Create mountain chains with connected peaks and height variation
function createMountainChain(mountain, distanceFromRoad, chainIndex, totalChains) {
    const currentScene = scenes[currentSceneIndex];
    
    // Create multiple connected peaks with varying heights
    const peaksInChain = 2 + Math.floor(Math.random() * 3); // 2-4 peaks per chain
    const baseHeight = 60 + (chainIndex / totalChains) * 40; // Height varies across the range
    
    for (let peakIndex = 0; peakIndex < peaksInChain; peakIndex++) {
        const peakGroup = new THREE.Group();
        
        // Position peaks with some offset for natural look
        peakGroup.position.x = (peakIndex - peaksInChain/2) * 25;
        peakGroup.position.z = peakIndex * 20;
        
        // Vary height within the chain
        const heightVariation = Math.sin(peakIndex * 1.5) * 20 + Math.random() * 30;
        const peakHeight = baseHeight + heightVariation;
        
        // Create the individual mountain peak with scene-specific features
        createSceneMountainWithFeatures(peakGroup, distanceFromRoad, peakHeight, currentScene);
        
        mountain.add(peakGroup);
    }
}

// Helper function to create a mountain for non-city scenes with scene-specific features
function createSceneMountainWithFeatures(mountain, distanceFromRoad, customHeight, currentScene) {
    // Scene-specific color palettes for mountains
    const mountainPalettes = {
        desert: [
            new THREE.Color(0x8B4513), // Saddle brown
            new THREE.Color(0x8B5E3C), // Light brown
            new THREE.Color(0x6B4423), // Dark brown
            new THREE.Color(0x7B3F00)  // Deep brown
        ],
        forest: [
            new THREE.Color(0x228B22), // Forest green
            new THREE.Color(0x006400), // Dark green
            new THREE.Color(0x2E8B57), // Sea green
            new THREE.Color(0x556B2F)  // Olive green
        ],
        snowy: [
            new THREE.Color(0x808080), // Gray for mountain base
            new THREE.Color(0xA9A9A9), // Dark gray
            new THREE.Color(0xD3D3D3), // Light gray
            new THREE.Color(0xC0C0C0)  // Silver
        ]
    };

    const currentPalette = mountainPalettes[currentScene];
    
    // Use custom height if provided, otherwise generate random height - validate inputs
    let height = customHeight || (Math.random() * 80 + 60);
    let baseWidth = Math.random() * 40 + 30;
    let baseDepth = Math.random() * 40 + 30;
    
    // Validate and fix any invalid values
    if (!isFinite(height) || height <= 0) {
        console.warn('Invalid mountain height, using fallback');
        height = 60;
    }
    if (!isFinite(baseWidth) || baseWidth <= 0) {
        console.warn('Invalid mountain base width, using fallback');
        baseWidth = 30;
    }
    if (!isFinite(baseDepth) || baseDepth <= 0) {
        console.warn('Invalid mountain base depth, using fallback');
        baseDepth = 30;
    }
    
    // More segments for better detail
    const segments = 12;
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    // Create base vertices in a circle with minimal noise
    for (let j = 0; j < segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const radius = baseWidth * (0.9 + Math.random() * 0.2); // Less random variation
        const noiseX = (Math.random() - 0.5) * 2; // Reduced noise
        const noiseZ = (Math.random() - 0.5) * 2;
        
        // Validate values to prevent NaN
        const x = Math.cos(angle) * radius + noiseX;
        const y = 0;
        const z = Math.sin(angle) * radius + noiseZ;
        
        if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
            console.warn('Invalid vertex values detected, using fallback');
        vertices.push(
                Math.cos(angle) * baseWidth,
            0,
                Math.sin(angle) * baseWidth
        );
        } else {
            vertices.push(x, y, z);
        }
        uvs.push(j / segments, 0);
    }
    
    // Create intermediate rings for better mountain shape
    const ringCount = 4;
    for (let ring = 1; ring < ringCount; ring++) {
        const ringHeight = (height * ring) / ringCount;
        const ringRadius = baseWidth * (1 - ring / ringCount) * 0.8;
        
        for (let j = 0; j < segments; j++) {
            const angle = (j / segments) * Math.PI * 2;
            const noiseX = (Math.random() - 0.5) * (2 * (1 - ring / ringCount));
            const noiseZ = (Math.random() - 0.5) * (2 * (1 - ring / ringCount));
            
            // Validate values to prevent NaN
            const x = Math.cos(angle) * ringRadius + noiseX;
            const y = ringHeight;
            const z = Math.sin(angle) * ringRadius + noiseZ;
            
            if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
                console.warn('Invalid ring vertex values detected, using fallback');
            vertices.push(
                    Math.cos(angle) * ringRadius,
                ringHeight,
                    Math.sin(angle) * ringRadius
            );
            } else {
                vertices.push(x, y, z);
            }
            uvs.push(j / segments, ring / ringCount);
        }
    }
    
    // Add peak vertex with validation
    if (!isFinite(height)) {
        console.warn('Invalid height detected, using fallback');
        vertices.push(0, baseWidth, 0);
    } else {
    vertices.push(0, height, 0);
    }
    uvs.push(0.5, 1);
    
    // Create faces between rings
    for (let ring = 0; ring < ringCount - 1; ring++) {
        const currentRing = ring * segments;
        const nextRing = (ring + 1) * segments;
        
        for (let j = 0; j < segments; j++) {
            const next = (j + 1) % segments;
            indices.push(
                currentRing + j,
                nextRing + j,
                currentRing + next,
                currentRing + next,
                nextRing + j,
                nextRing + next
            );
        }
    }
    
    // Create faces for final peak
    const peakIndex = segments * ringCount;
    for (let j = 0; j < segments; j++) {
        const next = (j + 1) % segments;
        indices.push(
            peakIndex - segments + j,
            peakIndex,
            peakIndex - segments + next
        );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    let mountainColor, mountainMaterial;
    
    if (currentScene === 'snowy') {
        // For snowy mountains, create a gradient from gray at bottom to white at top
        // Use vertex colors to create this effect
        const colors = [];
        const positions = geometry.attributes.position.array;
        
        // Create a height-based gradient
        for (let i = 0; i < positions.length; i += 3) {
            const vertexHeight = positions[i + 1]; // y-coordinate is height
            
            // Calculate color based on height
            let color;
            if (vertexHeight < height * 0.4) {
                // Bottom part - gray
                color = new THREE.Color(0x808080);
            } else if (vertexHeight < height * 0.7) {
                // Middle part - blend between gray and white
                const t = (vertexHeight - height * 0.4) / (height * 0.3);
                color = new THREE.Color(0x808080).lerp(new THREE.Color(0xFFFFFF), t);
            } else {
                // Top part - white (snow)
                color = new THREE.Color(0xFFFFFF);
            }
            
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        mountainMaterial = new THREE.MeshBasicMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
    } else {
        // For other scenes, use a single color from the palette with atmospheric perspective
        mountainColor = currentPalette[Math.floor(Math.random() * currentPalette.length)];
        
        // Calculate atmospheric perspective based on distance
        const mountainDistance = Math.abs(mountain.position.x);
        const maxDistance = mountainZoneStart + mountainZoneWidth;
        const distanceFactor = Math.min(1, mountainDistance / maxDistance);
        
        // Mix mountain color with sky color for atmospheric haze
        const currentState = sceneStates[scenes[currentSceneIndex]];
        const skyColor = currentState.dayColors.sky;
        const atmosphericColor = mountainColor.clone().lerp(skyColor, distanceFactor * 0.4);
        
        mountainMaterial = new THREE.MeshBasicMaterial({
            color: atmosphericColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75 - (distanceFactor * 0.3) // More distant = more transparent
        });
    }
    
    const mountainMesh = new THREE.Mesh(geometry, mountainMaterial);
    mountain.add(mountainMesh);
    
    // Create edges with comprehensive validation to prevent NaN issues
    try {
        // Validate geometry thoroughly before creating edges
        if (geometry.attributes.position && geometry.attributes.position.array) {
            const positions = geometry.attributes.position.array;
            let hasValidPositions = true;
            let validVertexCount = 0;
            
            // Check for NaN, infinity, or extremely large values
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];  
                const z = positions[i + 2];
                
                if (!isFinite(x) || !isFinite(y) || !isFinite(z) || 
                    Math.abs(x) > 10000 || Math.abs(y) > 10000 || Math.abs(z) > 10000) {
                    hasValidPositions = false;
                    console.warn(`Invalid vertex at index ${i/3}: (${x}, ${y}, ${z})`);
                    break;
                }
                validVertexCount++;
            }
            
            // Ensure we have enough valid vertices for a mountain
            if (hasValidPositions && validVertexCount >= 4 && geometry.index && geometry.index.count > 0) {
                // Force geometry to recompute its bounds before edge creation
                geometry.computeBoundingBox();
                geometry.computeBoundingSphere();
                
                // Check if bounding sphere is valid
                if (geometry.boundingSphere && isFinite(geometry.boundingSphere.radius) && geometry.boundingSphere.radius > 0) {
                    const edgesGeometry = new THREE.EdgesGeometry(geometry, 15);
                    
                    // Validate edges geometry as well
                    if (edgesGeometry.attributes.position && edgesGeometry.attributes.position.array.length > 0) {
                        let edgesColor;
                        
                        if (currentScene === 'snowy') {
                            edgesColor = new THREE.Color(0xFFFFFF);
                        } else {
                            edgesColor = mountainColor ? mountainColor.clone().multiplyScalar(1.2) : new THREE.Color(0xFFFFFF);
                        }
                        
                        const edgesMaterial = new THREE.LineBasicMaterial({
                            color: edgesColor,
                            transparent: true,
                            opacity: 0.5
                        });
                        
                        const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
                        mountain.add(edges);
                    } else {
                        console.warn('EdgeGeometry creation failed - no position data');
                    }
                } else {
                    console.warn('Invalid bounding sphere, skipping edges');
                }
            } else {
                console.warn(`Invalid mountain geometry: valid=${hasValidPositions}, vertices=${validVertexCount}, hasIndex=${!!geometry.index}`);
            }
        } else {
            console.warn('No position attribute in geometry');
        }
    } catch (error) {
        console.warn('Failed to create mountain edges:', error);
        // Continue without edges if there's an error
    }
    
         // Skip scene-specific features to maintain clean wireframe aesthetic
     console.log(`Created ${currentScene} mountain`);
}

// Add scene-specific features to mountains
function addSceneSpecificMountainFeatures(mountain, height, baseWidth, currentScene) {
    switch(currentScene) {
        case 'snowy':
            addSnowCaps(mountain, height, baseWidth);
            addIcyDetails(mountain, height);
            break;
        case 'forest':
            addForestCoverage(mountain, height, baseWidth);
            addTreesOnSlopes(mountain, height);
            break;
        case 'desert':
            addDesertVegetation(mountain, baseWidth);
            addRockFormations(mountain, height);
            break;
        default:
            addGenericMountainDetails(mountain, height);
    }
}

// Add snow caps to snowy mountains
function addSnowCaps(mountain, height, baseWidth) {
    const snowCapHeight = height * 0.3; // Snow covers top 30% of mountain
    const snowCapRadius = baseWidth * 0.6;
    
    const snowGeo = new THREE.SphereGeometry(snowCapRadius, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const snowMat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.9
    });
    
    const snowCap = new THREE.Mesh(snowGeo, snowMat);
    snowCap.position.y = height - snowCapHeight * 0.5;
    mountain.add(snowCap);
}

// Add icy details to snowy mountains
function addIcyDetails(mountain, height) {
    const icicleCount = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < icicleCount; i++) {
        const icicleGeo = new THREE.ConeGeometry(0.5 + Math.random(), 3 + Math.random() * 2, 6);
        const icicleMat = new THREE.MeshBasicMaterial({
            color: 0xE0FFFF,
            transparent: true,
            opacity: 0.8
        });
        
        const icicle = new THREE.Mesh(icicleGeo, icicleMat);
        icicle.position.x = (Math.random() - 0.5) * 20;
        icicle.position.y = height * 0.6 + Math.random() * height * 0.3;
        icicle.position.z = (Math.random() - 0.5) * 20;
        icicle.rotation.z = (Math.random() - 0.5) * 0.4;
        
        mountain.add(icicle);
    }
}

// Add forest coverage to forest mountains
function addForestCoverage(mountain, height, baseWidth) {
    const treeCount = 8 + Math.floor(Math.random() * 12);
    
    for (let i = 0; i < treeCount; i++) {
        const treeHeight = 3 + Math.random() * 4;
        
        // Tree trunk
        const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, treeHeight * 0.4, 6);
        const trunkMat = new THREE.MeshBasicMaterial({ color: 0x4A3728 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        
        // Tree foliage
        const foliageGeo = new THREE.ConeGeometry(1.5, treeHeight * 0.7, 8);
        const foliageColors = [0x228B22, 0x006400, 0x2E8B57, 0x556B2F];
        const foliageMat = new THREE.MeshBasicMaterial({ 
            color: foliageColors[Math.floor(Math.random() * foliageColors.length)]
        });
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        
        // Position tree on mountain slope
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * baseWidth * 0.8;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.random() * height * 0.4; // Trees on lower slopes
        
        trunk.position.set(x, y + treeHeight * 0.2, z);
        foliage.position.set(x, y + treeHeight * 0.6, z);
        
        mountain.add(trunk);
        mountain.add(foliage);
    }
}

// Add trees scattered on mountain slopes
function addTreesOnSlopes(mountain, height) {
    const slopeTreeCount = 4 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < slopeTreeCount; i++) {
        const treeGeo = new THREE.ConeGeometry(0.8, 2.5, 6);
        const treeMat = new THREE.MeshBasicMaterial({ color: 0x228B22 });
        const tree = new THREE.Mesh(treeGeo, treeMat);
        
        tree.position.x = (Math.random() - 0.5) * 30;
        tree.position.y = Math.random() * height * 0.6;
        tree.position.z = (Math.random() - 0.5) * 30;
        
        mountain.add(tree);
    }
}

// Add desert vegetation to desert mountains
function addDesertVegetation(mountain, baseWidth) {
    const vegetationCount = 3 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < vegetationCount; i++) {
        if (Math.random() < 0.7) {
            // Small cactus
            const cactusGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
            const cactusMat = new THREE.MeshBasicMaterial({ color: 0x228B22 });
            const cactus = new THREE.Mesh(cactusGeo, cactusMat);
            
            cactus.position.x = (Math.random() - 0.5) * baseWidth;
            cactus.position.y = 1;
            cactus.position.z = (Math.random() - 0.5) * baseWidth;
            
            mountain.add(cactus);
        } else {
            // Desert shrub
            const shrubGeo = new THREE.SphereGeometry(0.5, 8, 8);
            const shrubMat = new THREE.MeshBasicMaterial({ color: 0x556B2F });
            const shrub = new THREE.Mesh(shrubGeo, shrubMat);
            
            shrub.position.x = (Math.random() - 0.5) * baseWidth;
            shrub.position.y = 0.5;
            shrub.position.z = (Math.random() - 0.5) * baseWidth;
            
            mountain.add(shrub);
        }
    }
}

// Add rock formations to desert mountains
function addRockFormations(mountain, height) {
    const rockCount = 2 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < rockCount; i++) {
        const rockGeo = new THREE.DodecahedronGeometry(1 + Math.random() * 2);
        const rockMat = new THREE.MeshBasicMaterial({ 
            color: new THREE.Color(0x8B4513).lerp(new THREE.Color(0x696969), Math.random())
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        
        rock.position.x = (Math.random() - 0.5) * 25;
        rock.position.y = Math.random() * height * 0.7;
        rock.position.z = (Math.random() - 0.5) * 25;
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        
        mountain.add(rock);
    }
}

// Add generic mountain details
function addGenericMountainDetails(mountain, height) {
    // Add some basic rock outcroppings
    const rockCount = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < rockCount; i++) {
        const rockGeo = new THREE.BoxGeometry(2 + Math.random(), 1 + Math.random(), 2 + Math.random());
        const rockMat = new THREE.MeshBasicMaterial({ color: 0x696969 });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        
        rock.position.x = (Math.random() - 0.5) * 20;
        rock.position.y = Math.random() * height * 0.8;
        rock.position.z = (Math.random() - 0.5) * 20;
        
        mountain.add(rock);
    }
}

// Create background horizon planes for seamless coverage
function createHorizonPlanes(isCity) {
    const currentScene = scenes[currentSceneIndex];
    
    // Create distant horizon plane on both sides
    for (const direction of [-1, 1]) {
    for (let side = -1; side <= 1; side += 2) {
        const horizonGroup = new THREE.Group();
        
        // Position far in the distance
        const horizonDistance = mountainZoneStart + mountainZoneWidth * 1.2;
        horizonGroup.position.x = side * horizonDistance;
        horizonGroup.position.z = camera.position.z + direction * 800;
        
        if (isCity) {
            // Create distant city skyline silhouette
            createDistantSkylineSilhouette(horizonGroup);
        } else {
            // Create distant mountain range silhouette
            createDistantMountainRange(horizonGroup, currentScene);
        }
        
        // Store reference and add to scene
        horizonGroup.userData = {
            scene: currentScene,
            type: 'horizon',
            side: side,
            direction
        };
        
        startSceneryFade(horizonGroup);
        scene.add(horizonGroup);
        mountains.push(horizonGroup);
    }
    }
}

// Create a distant city skyline silhouette
function createDistantSkylineSilhouette(group) {
    const buildingCount = 15;
    const totalWidth = 200;
    const buildingWidth = totalWidth / buildingCount;
    
    for (let i = 0; i < buildingCount; i++) {
        const height = Math.random() * 60 + 40;
        const geo = new THREE.BoxGeometry(buildingWidth * 1.2, height, 20);
        
        // Use darker colors for silhouette effect with atmospheric perspective
        const color = new THREE.Color(0x333333).lerp(new THREE.Color(0x666666), Math.random());
        const mat = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.4 // Atmospheric haze effect
        });
        
        const building = new THREE.Mesh(geo, mat);
        building.position.x = (i - buildingCount/2) * buildingWidth;
        building.position.y = height / 2;
        
        group.add(building);
    }
}

// Create a distant mountain range silhouette
function createDistantMountainRange(group, currentScene) {
    const peakCount = 8;
    const rangeWidth = 300;
    
    // Create a continuous mountain silhouette
    const points = [];
    for (let i = 0; i <= peakCount; i++) {
        const x = (i / peakCount - 0.5) * rangeWidth;
        const baseHeight = 30 + Math.sin(i * 0.5) * 20; // Smooth variation
        const height = baseHeight + Math.random() * 40;
        points.push(new THREE.Vector2(x, height));
    }
    
    // Add base points to close the shape
    points.unshift(new THREE.Vector2(-rangeWidth/2, 0));
    points.push(new THREE.Vector2(rangeWidth/2, 0));
    
    const shape = new THREE.Shape(points);
    const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 50,
        bevelEnabled: false
    });
    
    // Scene-specific colors with atmospheric perspective
    let color;
    switch(currentScene) {
        case 'desert':
            color = new THREE.Color(0x8B4513).lerp(new THREE.Color(0x87CEEB), 0.3); // Brown tinted with sky blue
            break;
        case 'forest':
            color = new THREE.Color(0x228B22).lerp(new THREE.Color(0x87CEEB), 0.3); // Green tinted with sky blue
            break;
        case 'snowy':
            color = new THREE.Color(0xCCCCCC).lerp(new THREE.Color(0x87CEEB), 0.2); // Light gray tinted with sky blue
            break;
        default:
            color = new THREE.Color(0x666666).lerp(new THREE.Color(0x87CEEB), 0.3);
    }
    
    const mat = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.5, // Strong atmospheric haze effect
        side: THREE.DoubleSide
    });
    
    const mountainRange = new THREE.Mesh(geo, mat);
    mountainRange.position.y = 0;
    
    group.add(mountainRange);
}

// Update mountain lighting based on day/night cycle
function updateMountainLighting(dayFactor) {
    const skyFor = index => {
        const state = sceneStates[scenes[index]];
        return state.dayColors.sky.clone().lerp(state.nightColors.sky, 1 - dayFactor);
    };
    const skyColor = skyFor(currentSceneIndex);
    if (isSceneTransitioning) {
        skyColor.lerp(skyFor(nextSceneIndex), easeInOutCubic(sceneTransitionProgress));
    }
    mountains.forEach(mountain => {
        mountain.traverse(child => {
            const materials = child.material ? (Array.isArray(child.material) ? child.material : [child.material]) : [];
            materials.forEach(material => {
                if (!material.color) return;
                material.userData.originalColor ??= material.color.clone();
                const original = material.userData.originalColor;
                const snow = original.getHex() === 0xFFFFFF || original.getHex() === 0xE0FFFF;
                const color = original.clone().multiplyScalar(snow ? 0.7 + dayFactor * 0.3 : 0.3 + dayFactor * 0.7);
                if (snow && mountain.userData.scene === 'snowy') {
                    color.lerp(new THREE.Color(0xCCCCFF), Math.max(0, 0.5 - dayFactor) * 0.3);
                }
                const haze = mountain.userData.type === 'horizon' ? 0.6
                    : Math.min(1, Math.abs(mountain.position.x) / (mountainZoneStart + mountainZoneWidth)) * 0.4;
                material.color.copy(color.lerp(skyColor, haze));
                // Opacity is applied once by updateSceneryFade, including layer weights.
            });
        });
    });
}

// Animation variables
let frameCount = 0; // Add frame counter for performance optimizations