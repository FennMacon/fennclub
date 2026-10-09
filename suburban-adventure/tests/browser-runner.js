const output = document.getElementById('results');
const mobile = new URLSearchParams(location.search).has('mobile');
if (mobile) {
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 });
    const original = window.matchMedia.bind(window);
    window.matchMedia = query => query === '(any-pointer: coarse)' ? { matches: true } : original(query);
}
const errors = [];
window.addEventListener('error', event => errors.push(event.message));
window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
const saved = Object.fromEntries(Object.entries(localStorage));
const lines = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const check = async (name, run) => {
    try { await run(); lines.push(`PASS ${name}`); }
    catch (error) { lines.push(`FAIL ${name}: ${error.message}`); }
    output.textContent = lines.join('\n');
};
try {
    // Test fixtures stay on the test page's origin and are restored afterward.
    localStorage.setItem('suburbanAdventureScene', 'PLAZA');
    localStorage.setItem('suburbanAdventureMap', 'suburban');
    for (const key of ['busStopCameraPosition', 'interiorCameraPosition', 'buildingPortalPosition']) localStorage.removeItem(key);
    const game = await import('../main.js');
    document.getElementById('startup')?.remove();
    const THREE = await import('three');
    const controls = await import('../controls.js');
    const phone = await import('../phone-ui.js');
    const mobileControls = await import('../mobile-controls.js');
    const dialogue = await import('../dialogue.js');
    const npcs = await import('../npcs.js');
    const scenes = await import('../scenes.js');
    const buildings = await import('../buildings.js');
    const renderer = await import('../renderer.js');
    const canvas = renderer.getRenderer().domElement;
    await check('suburban outer columns, roads and subway move together', async () => {
        const { scene, streetElements } = game.getRuntimeState();
        const { CARNIVAL_CONFIG, MANSION_CONFIG, FOREST_CLEARINGS, RIVER_CONFIG } = await import('../world/config.js');
        const { getHorizontalBounds } = await import('../roads.js');
        scene.updateMatrixWorld(true);
        const ferris = scene.getObjectByName('FerrisWheel').getWorldPosition(new THREE.Vector3());
        assert(Math.abs(ferris.x - (CARNIVAL_CONFIG.x - 25)) < 1e-9 && ferris.x > 0, 'Carnival east');
        const mansion = scene.getObjectByName('MansionCompound');
        assert(mansion.position.x === MANSION_CONFIG.x && Math.abs(mansion.rotation.y - Math.PI) < 1e-9, 'Mansion east, entrance inward');
        assert(mansion.getObjectByName('MansionTrail').geometry.attributes.position.count > 200, 'Continuous winding approach is built');
        const house = mansion.getObjectByName('MansionHouse');
        const normal = new THREE.Vector3(0, 0, 1).transformDirection(house.matrixWorld);
        assert(normal.x < -.99, 'Mansion facade faces courtyard to west');
        assert(house.getObjectByName('MansionRoof'), 'Roof closes the mansion');
        const footprint = new THREE.Box3().setFromObject(house);
        assert(footprint.min.x > MANSION_CONFIG.x - MANSION_CONFIG.width / 2 && footprint.max.x < MANSION_CONFIG.x + MANSION_CONFIG.width / 2, 'House inside tree clearing');
        const garage = mansion.getObjectByName('MansionGarage').getWorldPosition(new THREE.Vector3());
        assert(Math.abs(garage.x - MANSION_CONFIG.x) < MANSION_CONFIG.width / 2 && Math.abs(garage.z - MANSION_CONFIG.z) < MANSION_CONFIG.depth / 2, 'Garage inside grounds');
        const river = scene.getObjectByName('River').children.find(object => object.isMesh);
        assert(river.getWorldPosition(new THREE.Vector3()).x === RIVER_CONFIG.x && RIVER_CONFIG.x < 0, 'River west');
        const clearing = scene.getObjectByName('ForestClearings');
        for (const prop of clearing.children.filter(object => object.userData.isInteractive))
            assert(FOREST_CLEARINGS.some(config => Math.abs(config.x - prop.getWorldPosition(new THREE.Vector3()).x) < 1e-9), 'Clearing moved');
        const subway = scene.getObjectByName('SubwayStop').getWorldPosition(new THREE.Vector3());
        assert(subway.x === -290 && subway.z === -333, 'Subway southwest');
        const street = streetElements.street, bounds = getHorizontalBounds('suburban');
        assert(Math.abs(street.position.x - street.geometry.parameters.width / 2 - bounds.xMin) < 1e-9, 'West road end');
        assert(Math.abs(street.position.x + street.geometry.parameters.width / 2 - bounds.xMax) < 1e-9, 'East road end');
        assert(streetElements.cars.filter(car => car.userData.roadType === 'horizontal').every(car => car.userData.bounds.xMin === bounds.xMin && car.userData.bounds.xMax === bounds.xMax), 'Traffic bounds moved');
    });
    await check('woodland settings and smooth pond trails are connected and discoverable', () => {
        const { scene,streetElements }=game.getRuntimeState();
        const clearings=scene.getObjectByName('ForestClearings');
        assert(clearings.children.filter(o=>o.name.startsWith('ClearingSetting:')).length===7,'Seven developed woodland settings');
        const observations=streetElements.interactiveItems.filter(o=>o.parent?.name.startsWith('ClearingSetting:'));
        assert(observations.length===7 && observations.every(o=>o.userData.flavorText&&!o.userData.name.includes('Unknown')),'New observations have authored content');
        for(const name of ['PondApproachTrail','CampsiteTrail','PondShoreTrail','ClearingTrail0','ClearingTrail1']) {
            const trail=scene.getObjectByName(name);
            assert(trail&&trail.children[1].geometry.attributes.position.count>100,'Smooth trail '+name);
        }
    });
    await check('clearings use forest ground and pond water is solid with steam retained', () => {
        const {scene,streetElements}=game.getRuntimeState();
        const settings=scene.getObjectByName('ForestClearings').children.filter(o=>o.name.startsWith('ClearingSetting:'));
        assert(settings.every(setting=>!setting.children.some(o=>o.geometry?.type==='ShapeGeometry')),'Clearing ground patches remain');
        const pond=streetElements.pond;
        const surfaces=pond.children.filter(o=>o.isMesh&&!o.userData.isMist);
        assert(surfaces.length===5 && surfaces.every(o=>!o.material.wireframe&&o.material.color.getHex()===0x1a3a52),'Solid unified water surface');
        assert(pond.children.filter(o=>o.userData.isMist).length===30,'Pond steam changed');
    });
    await check('number keys teleport across areas, respect editing and modals, and leave interiors', async () => {
        const press=(number,extra={})=>document.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit'+number,key:String(number),bubbles:true,...extra}));
        for(let number=1;number<=9;number++) {
            press(number);const pos=scenes.getAreaTestPosition(number,'suburban');
            assert(game.getRuntimeState().camera.position.distanceTo(new THREE.Vector3(pos.x,2,pos.z))<1e-8,'Area '+number);
        }
        const before=game.getRuntimeState().camera.position.clone();
        press(1,{ctrlKey:true});press(1,{repeat:true});
        assert(game.getRuntimeState().camera.position.equals(before),'Modified/repeated shortcut moved camera');
        const input=document.createElement('input');document.body.append(input);input.focus();press(1);
        assert(game.getRuntimeState().camera.position.equals(before),'Typing caused teleport');input.remove();
        phone.togglePhone();press(1);
        assert(game.getRuntimeState().camera.position.equals(before),'Phone allowed teleport');phone.togglePhone();
        dialogue.startConversation('Maya','PLAZA');press(1);
        assert(game.getRuntimeState().camera.position.equals(before),'Conversation allowed teleport');dialogue.endConversation();
        game.switchScene('MANSION_INTERIOR');await frame();press(6);await frame();
        assert(game.getRuntimeState().sceneKey==='PLAZA'&&game.getRuntimeState().camera.position.distanceTo(new THREE.Vector3(333,2,0))<1e-8,'Interior shortcut exit');
        document.dispatchEvent(new KeyboardEvent('keydown',{code:'Numpad5',key:'5',bubbles:true}));
        assert(game.getRuntimeState().camera.position.distanceTo(new THREE.Vector3(0,2,0))<1e-8,'Numpad shortcut');
        assert(renderer.getRenderer().domElement===canvas,'Teleport replaced renderer');
    });
    await check('carnival builds eight rides and food/game alleys; animation stays finite', async () => {
        const { createCarnival } = await import('../world/landmarks.js');
        const { CARNIVAL_ADDITIONS } = await import('../world/carnival-motion.js');
        const carnival = createCarnival(new THREE.Scene());
        assert(carnival.interactiveItems.length === 17, 'Expected eleven booths and six entrances');
        for (const spec of CARNIVAL_ADDITIONS) {
            assert(carnival.group.getObjectByName(spec.name), spec.name);
            assert(carnival.interactiveItems.some(sign => sign.name === spec.name + ' entrance' && sign.userData.flavorText), 'Missing discovery');
        }
        const zipper = carnival.group.getObjectByName('Zipper');
        assert(Math.abs(zipper.rotation.y - Math.PI) < 1e-9, 'Zipper must face road');
        const teacups = carnival.group.getObjectByName('TeacupRide');
        const rotor = teacups.getObjectByName('TeacupTurntable');
        assert(rotor.children.filter(child => /^Teacup[1-6]$/.test(child.name)).length === 6, 'Six independent cups');
        assert(carnival.group.getObjectByName('FOOD ALLEY') && carnival.group.getObjectByName('GAME ALLEY'), 'Separate alleys');
        const { MIDWAY_STALLS } = await import('../world/carnival-midway-layout.js');
        carnival.group.updateMatrixWorld(true);
        for (const spec of MIDWAY_STALLS) {
            const counter = carnival.group.getObjectByName(spec.label + ' counter');
            const position = counter.getWorldPosition(new THREE.Vector3());
            const visitor = position.clone().add(new THREE.Vector3(Math.sin(spec.rotation), 0, 0));
            visitor.y = 2;
            assert(visitor.distanceTo(position) < 2.5, 'Counter approachable from aisle');
        }

        for (let i = 0; i < 600; i++) carnival.updateCarnival(1 / 60);
        assert(teacups.rotation.y === 0 && rotor.rotation.y !== 0, 'Only teacup turntable rotates');
        assert(carnival.interactiveItems.every(item => item.userData.flavorText), 'Discoveries have text');
        carnival.group.updateMatrixWorld(true);
        const q = new THREE.Quaternion(), world = new THREE.Vector3();
        const ferris = carnival.group.getObjectByName('FerrisWheel');
        const ferrisRotor = ferris.getObjectByName('FerrisRotor');
        const gondolas = ferrisRotor.children.filter(child => /^FerrisGondola[0-9]+$/.test(child.name));
        assert(gondolas.length === 16, 'Sixteen evenly spaced rim pivots');
        for (const pivot of gondolas) {
            assert(Math.abs(pivot.position.length() - 12) < 1e-9, 'Hinge sits on rim');
            assert(Math.abs(pivot.getWorldQuaternion(q).x) < 1e-8, 'Cart remains upright');
            const bucket = pivot.children.find(child => /^FerrisBucket/.test(child.name));
            const delta = bucket.getWorldPosition(world).sub(pivot.getWorldPosition(new THREE.Vector3()));
            assert(Math.abs(delta.y + 1.55) < 1e-8 && Math.abs(delta.z) < 1e-8, 'Bucket hangs beneath actual hinge');
        }
        for (const [rideName, prefix, facing, direction] of [['Carousel', 'CarouselHorse', -1, 1], ['Yo-Yo', 'YoYoSeat', 1, -1]]) {
            const ride = carnival.group.getObjectByName(rideName);
            const center = ride.getWorldPosition(new THREE.Vector3());
            ride.traverse(object => {
                if (!object.name.startsWith(prefix)) return;
                const radial = object.getWorldPosition(new THREE.Vector3()).sub(center);
                const tangent = new THREE.Vector3(radial.z * direction, 0, -radial.x * direction).normalize();
                const forward = new THREE.Vector3(0, 0, facing).applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion()));
                assert(forward.dot(tangent) > 0.99, rideName + ' riders face travel');
            });
        }
        const carousel = carnival.group.getObjectByName('Carousel');
        const chariot = carousel.getObjectByName('CarouselChariot');
        assert(chariot, 'Chariot has its own station');
        carousel.traverse(object => {
            if (object.name.startsWith('CarouselHorse'))
                assert(Math.hypot(object.position.x - chariot.position.x, object.position.z - chariot.position.z) > 1.4, 'Chariot clears horse stations');
        });
        for (let i = 1; i <= 6; i++) {
            const handle = teacups.getObjectByName('TeacupHandle' + i).children[0];
            const angle = handle.rotation.z;
            assert(Math.cos(angle) < 0 && Math.cos(angle + Math.PI * 1.6) < 0, 'Both handle tips face bowl');
        }
        for (const name of ['Pharaoh’s Fury', 'Carousel']) assert(Math.abs(carnival.group.getObjectByName(name).rotation.y - Math.PI) < 1e-9, 'Entrance faces road');
        carnival.group.traverse(object => {
            const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
            assert(materials.every(material => !material.map), 'No printed ride or booth signs');
        });

        carnival.group.traverse(object => assert([...object.position.toArray(), ...object.quaternion.toArray()].every(Number.isFinite), object.name));
        const geometries = new Set(), materials = new Set();
        carnival.group.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
        geometries.forEach(geometry => geometry.dispose());
        materials.forEach(material => { material.map?.dispose(); material.dispose(); });
    });
    await check('movement matches at 30, 60, 120 and 240 FPS', () => {
        const distances = [];
        controls.resetControls(); controls.setYaw(0); controls.keyboard.w = true;
        for (const fps of [30, 60, 120, 240]) {
            const camera = new THREE.PerspectiveCamera(); camera.position.set(0, 2, 0);
            for (let i = 0; i < fps; i++) controls.updateCameraPositionDesktop(camera, null, null, 1 / fps);
            distances.push(camera.position.length());
        }
        assert(Math.max(...distances) - Math.min(...distances) < 1e-8, distances.join(','));
        controls.resetControls();
    });
    await check('diagonal movement has the same speed', () => {
        const camera = new THREE.PerspectiveCamera(); camera.position.set(0, 2, 0);
        controls.keyboard.w = controls.keyboard.d = true;
        controls.updateCameraPositionDesktop(camera, null, null, 1);
        assert(Math.abs(Math.hypot(camera.position.x, camera.position.z) - 12) < 1e-8, 'diagonal speed');
        controls.resetControls();
    });
    await check('window blur clears held keys', () => {
        controls.keyboard.w = controls.keyboard.shift = true;
        window.dispatchEvent(new Event('blur'));
        assert(!controls.keyboard.w && !controls.keyboard.shift, 'keys stuck');
    });
    await check('F opens only the phone, and modal blocks movement', () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', bubbles: true }));
        assert(phone.getPhoneOpenState() && !dialogue.hasActiveConversation(), 'F conflict');
        const { camera } = game.getRuntimeState(); const before = camera.position.clone();
        controls.keyboard.w = true;
        controls.updateCameraPosition(camera, null, null, 1);
        assert(before.equals(camera.position), 'phone allows movement');
        controls.resetControls();
    });
    await check('phone fits viewport and refresh preserves audio and scroll', () => {
        const rect = document.getElementById('phone-ui').getBoundingClientRect();
        assert(rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight, 'phone exceeds viewport');
        const audio = document.querySelector('audio'); const journal = document.querySelector('#phone-content > div');
        const content = document.getElementById('phone-content'); content.scrollTop = 30;
        const scroll = content.scrollTop;
        phone.updatePhoneDebugInfo({ fps: 30, cameraSpeed: 5 });
        assert(document.querySelector('audio') === audio && document.querySelector('#phone-content > div') === journal, 'phone nodes replaced');
        assert(content.scrollTop === scroll, 'scroll reset');
        phone.togglePhone();
    });
    await check('discovered song rows control the shared player; locked tracks excluded', async () => {
        const library = await import('../music-library.js');
        dialogue.resetGameProgress();
        phone.togglePhone();
        phone.updatePhoneDebugInfo({ fps: 60 });
        assert(!document.querySelector('[data-song]'), 'locked song exposed');
        assert(!document.querySelector('select'), 'unrestricted dropdown still present');
        dialogue.startConversation('Maya', 'PLAZA');
        dialogue.unlockCurrentSong('Maya'); dialogue.endConversation();
        phone.updatePhoneDebugInfo({ fps: 60 });
        const button = document.querySelector('[data-song="Consistency"]');
        assert(button, 'unlocked song not playable');
        button.click(); await frame();
        const audio = document.querySelector('audio');
        assert(audio.src === library.getRecordingURL(library.getRecording('Consistency')), 'wrong recording');
        assert(new URL(audio.src).pathname.startsWith('/music/'), 'nested asset path incorrect');
        audio.pause();
        const player = audio;
        phone.updatePhoneDebugInfo({ fps: 45 });
        assert(document.querySelector('audio') === player, 'player replaced');
        dialogue.resetGameProgress(); phone.updatePhoneDebugInfo({ fps: 60 });
        assert(!document.querySelector('[data-song]') && !audio.getAttribute('src'), 'reset retained song');
        phone.togglePhone();
    });
    await check('rapid close/open keeps phone interactive', async () => {
        phone.togglePhone(); phone.togglePhone(); phone.togglePhone();
        await new Promise(resolve => setTimeout(resolve, 350));
        assert(document.getElementById('phone-ui').style.pointerEvents === 'auto', 'close timer hides open phone');
        phone.togglePhone();
    });
    if (mobile) {
        await check('mobile pointer cancellation and multitouch ownership', () => {
            const base = document.querySelector('.joystick.movement');
            // Synthetic pointers have no browser active-pointer entry. Stub capture only.
            base.setPointerCapture = () => {}; base.hasPointerCapture = () => false;
            const rect = base.getBoundingClientRect();
            const send = (type, id, x, y) => base.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, bubbles: true }));
            send('pointerdown', 1, rect.left + 80, rect.top + 40);
            assert(mobileControls.getMobileMovement().x > .9, 'stick does not move');
            send('pointerdown', 2, rect.left, rect.top + 40);
            assert(mobileControls.getMobileMovement().x > .9, 'second finger stole stick');
            send('pointercancel', 1, 0, 0);
            assert(mobileControls.getMobileMovement().x === 0, 'cancelled stick stuck');
            send('pointerdown', 3, rect.left, rect.top);
            assert(Math.hypot(...Object.values(mobileControls.getMobileMovement())) <= 1.001, 'stick exceeds unit circle');
            send('lostpointercapture', 3, 0, 0);
        });
        await check('running toggles independently of nearby actions', () => {
            const button = document.querySelector('.sprint-button');
            button.click();
            assert(mobileControls.getMobileSprint() && button.getAttribute('aria-pressed') === 'true', 'run toggle did not enable');
            mobileControls.updateMobileActionButton('talk', 'TALK');
            assert(mobileControls.getMobileSprint(), 'nearby action cleared run toggle');
            button.click();
            assert(!mobileControls.getMobileSprint(), 'run toggle did not disable');
            button.click();
        });
        await check('phone resets and hides mobile controls', () => {
            phone.togglePhone();
            assert(document.getElementById('mobile-controls').hidden, 'controls visible behind phone');
            assert(!mobileControls.getMobileSprint() && mobileControls.getMobileMovement().x === 0, 'modal retains touch state');
            phone.togglePhone();
            assert(!document.getElementById('mobile-controls').hidden, 'controls remain hidden');
        });
    }
    for (const key of Object.keys(buildings.INTERIOR_REGISTRY)) {
        await check(`${key}: enter/exit without reload and build interactables`, async () => {
            game.switchScene(key);
            await frame();
            const state = game.getRuntimeState();
            assert(state.sceneKey === key && state.streetElements.interiorBounds && state.streetElements.exitPortal, 'interior incomplete');
            assert(state.streetElements.npcs.every(npc => npc.parent), 'NPC detached');
            assert(renderer.getRenderer().domElement === canvas, 'renderer replaced');
            game.switchScene('PLAZA');
            await frame();
            assert(game.getRuntimeState().sceneKey === 'PLAZA', 'exit failed');
        });
    }
    await check('mansion front door enters a collision-aware maze and exits toward its courtyard', async () => {
        const state = game.getRuntimeState();
        const portal = state.streetElements.buildingPortals.find(p => p.style === 'mansion');
        assert(portal && scenes.getBuildingPortalDestination('mansion').key === 'MANSION_INTERIOR', 'Mansion portal registered');
        const returnPosition = portal.returnPosition.clone();
        state.camera.position.copy(portal.position);
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
        await frame();
        let inside = game.getRuntimeState();
        assert(inside.sceneKey === 'MANSION_INTERIOR', 'Actual front door did not enter mansion');
        assert(inside.streetElements.interactiveItems.length === 9 && inside.streetElements.interiorCollisionRects.length > 15, 'Maze rooms and walls built');
        const mansion=inside.streetElements.interiorGroup;
        assert(mansion.userData.floatingCandles.length===27&&mansion.userData.candleLights.length===9,'Floating candles light all chambers');
        const before=mansion.userData.floatingCandles[0].group.position.y;
        inside.streetElements.interiorUpdate(.1);
        assert(mansion.userData.floatingCandles[0].group.position.y!==before,'Candles float');
        assert(mansion.userData.candleLights.every(light=>light.intensity>17&&light.distance===24&&!light.castShadow),'Warm lights remain bounded for mobile');
        inside.camera.position.set(0,2,0); controls.setYaw(0); controls.keyboard.d=true;
        controls.updateCameraPositionDesktop(inside.camera,inside.config,inside.streetElements,1);
        controls.resetControls();
        assert(inside.camera.position.x < 8, 'Movement passed through mansion partition');
        inside.camera.position.set(0,2,22.2);
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
        await frame();
        const outside=game.getRuntimeState();
        assert(outside.sceneKey === 'PLAZA' && outside.camera.position.distanceTo(returnPosition)<1e-8, 'Exit does not return to courtyard');
        assert(Math.abs(controls.yaw-Math.PI/2)<1e-8, 'Exit must face west toward trail');
        assert(renderer.getRenderer().domElement === canvas, 'Mansion replaced renderer');
    });
    await check('subway switches maps without recreating renderer', async () => {
        assert(game.performMapSwitch(), 'map switch unavailable'); await frame();
        assert(scenes.getCurrentMap() === 'city' && game.getRuntimeState().sceneKey === 'CITY_PLAZA', 'city arrival failed');
        assert(game.teleportToArea(3) && game.getRuntimeState().camera.position.distanceTo(new THREE.Vector3(333,2,333))<1e-8,'City area shortcut');
        assert(game.getRuntimeState().streetElements.zoneRootGroups.length === 3, 'city missing zones');
        assert(game.performMapSwitch(), 'return unavailable'); await frame();
        assert(scenes.getCurrentMap() === 'suburban', 'suburban arrival failed');
        assert(game.getRuntimeState().camera.position.distanceTo(new THREE.Vector3(-290, 2, -328)) < 1e-9, 'Return to west subway');
        assert(renderer.getRenderer().domElement === canvas, 'canvas changed');
    });
    await check('reward dismissal works with mobile action button', () => {
        const { camera, streetElements } = game.getRuntimeState();
        const maya = streetElements.npcs.find(npc => npc.userData.name === 'Maya');
        const pos = new THREE.Vector3(); maya.getWorldPosition(pos); camera.position.copy(pos); camera.position.y = 2;
        npcs.checkNearbyNPCs(camera, streetElements.npcs);
        dialogue.resetGameProgress();
        npcs.handleInteractionInput('PLAZA');
        assert(dialogue.hasActiveConversation(), 'conversation did not start');
        for (let i = 0; i < 30 && !dialogue.getUnlockedSongs().length; i++) npcs.handleInteractionInput('PLAZA');
        assert(dialogue.getUnlockedSongs().length === 1, 'song not awarded');
        assert(npcs.getMobileInteraction().text === 'CONTINUE', 'wrong reward action');
        npcs.handleInteractionInput('PLAZA');
        assert(!dialogue.hasActiveConversation(), 'reward cannot dismiss');
    });
    await check('conversation can be cancelled without walking away', () => {
        const { camera, streetElements } = game.getRuntimeState();
        const maya = streetElements.npcs.find(npc => npc.userData.name === 'Maya');
        const position = new THREE.Vector3(); maya.getWorldPosition(position); camera.position.copy(position); camera.position.y = 2;
        npcs.checkNearbyNPCs(camera, streetElements.npcs);
        npcs.handleInteractionInput('PLAZA');
        assert(dialogue.hasActiveConversation(), 'conversation did not start');
        const close = document.querySelector('[data-close-conversation]');
        assert(close, 'missing mobile close button');
        close.click();
        assert(!dialogue.hasActiveConversation(), 'close did not end conversation');
    });
    await check('no asynchronous runtime errors', () => assert(errors.length === 0, errors.join('; ')));
} catch (error) { lines.push(`FAIL setup: ${error.stack}`); }
finally {
    localStorage.clear();
    for (const [key, value] of Object.entries(saved)) localStorage.setItem(key, value);
    output.textContent = `${mobile ? 'MOBILE' : 'DESKTOP'}: ${lines.filter(line => line.startsWith('PASS')).length} passed; ${lines.filter(line => line.startsWith('FAIL')).length} failed\n\n${lines.join('\n')}`;
    document.title = lines.some(line => line.startsWith('FAIL')) ? 'FAIL: Adventure checks' : 'PASS: Adventure checks';
}
