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
    await check('soundtrack assets resolve from nested preview routes', async () => {
        const audio = document.querySelector('audio');
        const options = [...document.querySelector('select').options];
        assert(options.every(option => new URL(encodeURIComponent(option.value), audio.src).pathname.startsWith('/music/')), 'soundtrack resolved under test directory');
        assert(new URL(audio.src).pathname.startsWith('/music/'), 'audio resolved under tests directory');
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
        await check('sprint releases even when nearby action changes', () => {
            const button = document.querySelector('.sprint-button'); button.setPointerCapture = () => {};
            button.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 4 }));
            assert(mobileControls.getMobileSprint(), 'sprint does not start');
            button.dispatchEvent(new PointerEvent('pointerup', { pointerId: 99 }));
            assert(mobileControls.getMobileSprint(), 'unrelated finger stopped sprint');
            mobileControls.updateMobileActionButton('talk', 'TALK');
            button.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 4 }));
            assert(!mobileControls.getMobileSprint(), 'sprint stuck after action change');
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
    await check('subway switches maps without recreating renderer', async () => {
        assert(game.performMapSwitch(), 'map switch unavailable'); await frame();
        assert(scenes.getCurrentMap() === 'city' && game.getRuntimeState().sceneKey === 'CITY_PLAZA', 'city arrival failed');
        assert(game.getRuntimeState().streetElements.zoneRootGroups.length === 3, 'city missing zones');
        assert(game.performMapSwitch(), 'return unavailable'); await frame();
        assert(scenes.getCurrentMap() === 'suburban', 'suburban arrival failed');
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
