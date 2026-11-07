// These exercise the live game and DOM; the pure state/geometry tests run in Node.
export async function runAdventureChecks({ game, THREE, check, assert, frame, scenes, dialogue, npcs }) {
    const [adventure, controls, phone, storyUI, activities, traversal, storageModule, mobileControls] = await Promise.all([
        import('../adventure-state.js'), import('../controls.js'), import('../phone-ui.js'),
        import('../story-ui.js'), import('../story-activities.js'), import('../world/traversal.js'), import('../storage.js'), import('../mobile-controls.js')
    ]);
    const { storage } = storageModule;
    const face = (camera, position) => {
        camera.lookAt(position.x, camera.position.y, position.z);
        controls.setYaw(camera.rotation.y); controls.setPitch(0);
    };
    const closeMenus = () => {
        storyUI.closeStoryModal();
        document.querySelector('[data-transit-cancel]')?.click();
        if (phone.getPhoneOpenState()) phone.togglePhone();
        npcs.resetNPCInteraction(); controls.resetControls(); mobileControls.resetMobileControls();
    };
    const attemptMovement = state => {
        controls.keyboard.w = true;
        if (controls.isMobile) {
            const base = document.querySelector('.joystick.movement'), rect = base.getBoundingClientRect();
            base.setPointerCapture = () => {}; base.hasPointerCapture = () => false;
            base.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 900, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 - 40, bubbles: true }));
        }
        controls.updateCameraPosition(state.camera, state.config, state.streetElements, 1);
    };
    const exterior = async map => {
        closeMenus();
        if (game.getRuntimeState().config.IS_INTERIOR) game.switchScene(scenes.getCurrentMap() === 'city' ? 'CITY_PLAZA' : 'PLAZA');
        if (scenes.getCurrentMap() !== map) game.performMapSwitch();
        await frame();
    };

    const runCheck = (name, run) => check(name, async () => { try { await run(); } finally { closeMenus(); } });
    const previousDeveloperMode = adventure.getAdventureState().settings.developerMode;
    adventure.setAdventureSettings({ developerMode: true });

    await runCheck('the same facing portal works at the full advertised 5.5-unit range', async () => {
        await exterior('suburban');
        const state = game.getRuntimeState();
        const portal = state.streetElements.buildingPortals.find(entry => entry.style === 'flowers' && !entry.isFarBuilding);
        assert(portal, 'Missing front flower shop fixture');
        state.camera.position.set(portal.position.x, 2, portal.position.z + 5.5);
        face(state.camera, portal.position);
        const selected = npcs.checkBusStopProximity(state.camera, state.config, state.sceneKey, state.streetElements);
        assert(selected?.type === 'portal' && selected.object === portal, 'Prompt did not select the facing shop');
        assert(npcs.getMobileInteraction().text === 'ENTER', 'Mobile action disagrees with portal prompt');
        game.handleActionInput(); await frame();
        assert(game.getRuntimeState().config.IS_INTERIOR && game.getRuntimeState().config.name === portal.name, 'Advertised ENTER action did nothing');
        assert(adventure.getAdventureState().businesses.some(entry => entry.name === portal.name), 'Entered shop missing from journal');
        game.switchScene('PLAZA'); await frame();
    });

    await runCheck('all nine Allston districts have reachable neighbors with contribution dialogue', async () => {
        await exterior('city');
        const state = game.getRuntimeState(), neighbors = state.streetElements.npcs.filter(npc => npc.userData.encounterId);
        assert(neighbors.length === 9 && new Set(neighbors.map(npc => npc.userData.zoneKey)).size === 9, 'City needs one unique encounter in every district');
        for (const npc of neighbors) {
            const position = npc.getWorldPosition(new THREE.Vector3());
            assert(traversal.safeExteriorPosition(position, state.streetElements.exteriorCollisionRects), npc.userData.name + ' is inside a facade');
        }
        const neighbor = neighbors[0], position = neighbor.getWorldPosition(new THREE.Vector3());
        state.camera.position.set(position.x, 2, position.z + 1.8); face(state.camera, position);
        const selected = npcs.checkBusStopProximity(state.camera, state.config, state.sceneKey, state.streetElements);
        assert(selected?.type === 'npc' && selected.object === neighbor, 'Neighbor cannot be approached');
        game.handleActionInput();
        assert(dialogue.hasActiveConversation(), 'City encounter has no playable dialogue');
        for (let i = 0; i < 20 && dialogue.hasActiveConversation(); i++) game.handleActionInput();
        assert(adventure.getAdventureState().conversations.includes(neighbor.userData.zoneKey + ':' + neighbor.userData.name), 'City conversation was not recorded');
        assert(adventure.getAdventureState().story.contributions.some(entry => entry.source === neighbor.userData.name), 'City neighbor did not add a contribution');
        closeMenus();
    });

    await runCheck('fog-hidden city signs cull, doors have threshold cues and discoveries have visible props', () => {
        const state = game.getRuntimeState(), city = state.streetElements.cityDistricts;
        state.camera.position.set(0, 2, 11); city.update(state.camera);
        const signs = city.group.children.filter(object => object.name.startsWith('AbstractStoreSign:'));
        assert(signs.length > 200 && signs.some(sign => sign.visible) && signs.some(sign => !sign.visible), 'City signs ignore distance culling');
        for (const sign of signs) if (Math.hypot(sign.position.x, sign.position.z - 11) < 118) assert(sign.visible, 'A sign disappeared inside the fog range');
        const distant = signs.find(sign => !sign.visible);
        state.camera.position.set(distant.position.x, 2, distant.position.z + 4); city.update(state.camera);
        assert(distant.visible, 'Sign did not appear immediately after a teleport');
        assert(city.group.userData.entranceCues.length >= state.streetElements.buildingPortals.length, 'Some enterable city buildings lack entrance cues');
        assert(city.interactiveItems.length === 9 && city.interactiveItems.every(item => item.children.some(child => child.isMesh)), 'District discoveries are still invisible points');
    });

    await runCheck('city building footprints stop normal walking at the visible facade', () => {
        const previous = adventure.getAdventureState().settings.developerMode;
        adventure.setAdventureSettings({ developerMode: false });
        const state = game.getRuntimeState(), lot = state.streetElements.cityDistricts.plan.lots.find(entry => entry.facing === 1);
        state.camera.position.set(lot.x, 2, lot.z + lot.depth / 2 + 2);
        controls.setYaw(0); controls.keyboard.w = true;
        try {
            controls.updateCameraPositionDesktop(state.camera, state.config, state.streetElements, 1);
            assert(state.camera.position.z >= lot.z + lot.depth / 2 + .4, 'Walking passed through a city facade');
        } finally { controls.resetControls(); adventure.setAdventureSettings({ developerMode: previous }); }
    });

    await runCheck('visited districts appear in the phone and transit choices match discoveries', async () => {
        game.teleportToArea(9);
        await new Promise(resolve => setTimeout(resolve, 280)); await frame();
        assert(adventure.getAdventureState().visited.city.some(area => area.key === 'CITY_SE'), 'Standing in a district did not discover it');
        phone.togglePhone();
        try {
            document.querySelector('[data-tab="map"]').click();
            const map = document.querySelector('[aria-label="Allston discovery map"]');
            assert(map && map.children.length === 9 && map.querySelector('.current-area.visited'), 'Phone map does not show visited current district');
        } finally { if (phone.getPhoneOpenState()) phone.togglePhone(); }
        assert(phone.openTransitChooser('city'), 'Transit chooser failed to open');
        try {
            const keys = [...document.querySelectorAll('[data-travel-area]')].map(button => button.dataset.travelArea);
            assert(keys.includes('CITY_SE') && keys.length === adventure.getAdventureState().visited.city.length, 'Transit exposes undiscovered or missing destinations');
        } finally { document.querySelector('[data-transit-cancel]')?.click(); }
    });

    await runCheck('transit menu locks movement and closes without moving the player', () => {
        const state = game.getRuntimeState(), before = state.camera.position.clone();
        assert(phone.openTransitChooser(scenes.getCurrentMap()), 'Transit chooser missing');
        try {
            attemptMovement(state);
            assert(state.camera.position.equals(before), 'WASD moved the world behind the transit menu');
        } finally { controls.resetControls(); document.querySelector('[data-transit-cancel]')?.click(); }
        assert(!document.getElementById('transit-chooser') && state.camera.position.equals(before), 'Cancel changed position or retained the modal');
    });

    await runCheck('pagehide checkpoints and safe recovery preserve place, view, discoveries and exit state', async () => {
        await exterior('suburban');
        const priorDeveloperMode = adventure.getAdventureState().settings.developerMode;
        adventure.setAdventureSettings({ developerMode: false });
        const state = game.getRuntimeState(); state.camera.position.set(-290, 2, 20); controls.setYaw(.7); controls.setPitch(-.2);
        const discoveries = adventure.getAdventureState().discoveries.length;
        window.dispatchEvent(new Event('pagehide'));
        const checkpoint = adventure.getAdventureState().checkpoint;
        assert(checkpoint?.map === 'suburban' && checkpoint.sceneKey === 'PLAZA' && checkpoint.position.x === -290, 'Safe walking position was not checkpointed');
        storage.setItem('buildingPortalPosition', JSON.stringify({ x: 123, y: 2, z: 123 }));
        storage.setItem('previousExteriorScene', 'CITY_PLAZA'); storage.setItem('isFarBuilding', 'true');
        state.camera.position.set(450, 2, 200);
        document.dispatchEvent(new Event('game-return-safe')); await frame();
        const restored = game.getRuntimeState();
        assert(restored.sceneKey === 'PLAZA' && scenes.getCurrentMap() === 'suburban' && restored.camera.position.distanceTo(new THREE.Vector3(-290, 2, 20)) < 1e-8, 'Safe recovery lost the saved position');
        assert(Math.abs(controls.yaw - .7) < 1e-8 && Math.abs(controls.pitch + .2) < 1e-8, 'Safe recovery lost the viewing direction');
        assert(adventure.getAdventureState().discoveries.length === discoveries, 'Safe recovery discarded discoveries');
        assert(storage.getItem('buildingPortalPosition') === null && storage.getItem('previousExteriorScene') === null && storage.getItem('isFarBuilding') === null, 'Recovery retained stale interior exit state');
        adventure.setAdventureSettings({ developerMode: priorDeveloperMode });
    });

    await runCheck('the mansion piano stays gated until all three real woodland clues are copied', async () => {
        closeMenus(); adventure.resetAdventureProgress();
        game.switchScene('MANSION_INTERIOR'); await frame();
        const piano = game.getRuntimeState().streetElements.interactiveItems.find(item => item.userData.name === 'Music salon');
        assert(piano && activities.handleStoryInteraction(piano), 'Mansion piano activity is missing');
        try {
            assert(![...document.querySelector('dialog[open]').querySelectorAll('button')].some(button => button.textContent === 'D'), 'Piano keys bypass the clue gate');
            const state = game.getRuntimeState(), before = state.camera.position.clone();
            attemptMovement(state);
            assert(state.camera.position.equals(before) && !game.teleportToArea(5), 'Story modal allows movement or teleport shortcuts');
        } finally { closeMenus(); }
        game.switchScene('PLAZA'); await frame();
        for (const clue of activities.MYSTERY_CLUES) {
            const item = game.getRuntimeState().streetElements.interactiveItems.find(entry => entry.userData.name === clue.name);
            assert(item && activities.handleStoryInteraction(item), 'Missing authored woodland clue: ' + clue.name);
            assert(adventure.getAdventureState().discoveries.some(entry => entry.id === clue.id), 'Clue was not copied to the journal');
            storyUI.closeStoryModal();
        }
        assert(activities.hasMysteryClues(adventure.getAdventureState()) && !adventure.getAdventureState().mystery.solved, 'Finding clues completed the puzzle prematurely');
    });

    await runCheck('the woodland melody earns its recording once and closes the story modal cleanly', async () => {
        game.switchScene('MANSION_INTERIOR'); await frame();
        const piano = game.getRuntimeState().streetElements.interactiveItems.find(item => item.userData.name === 'Music salon');
        assert(activities.handleStoryInteraction(piano), 'Piano activity failed to open');
        try {
            const press = note => [...document.querySelector('dialog[open]').querySelectorAll('button')].find(button => button.textContent === note).click();
            for (const note of ['D', 'E', 'A']) press(note);
            assert(!adventure.getAdventureState().mystery.solved, 'Incorrect melody solved the puzzle');
            for (const note of ['D', 'A', 'E']) press(note);
            assert(adventure.getAdventureState().mystery.solved && dialogue.getUnlockedSongs().some(song => song.name === 'The Room Between'), 'Correct melody did not earn the recording');
            assert(adventure.getAdventureState().story.contributions.filter(entry => entry.id === 'The Room Between').length === 1, 'Mystery contribution duplicated');
        } finally { closeMenus(); }
        assert(!document.querySelector('dialog[open]') && !storyUI.getStoryModalOpen(), 'Story modal retained its movement lock');
        game.switchScene('PLAZA'); await frame();
    });

    await runCheck('the compilation requires three contributions and saves the chosen performance', () => {
        closeMenus(); adventure.resetAdventureProgress();
        const deck = game.getRuntimeState().streetElements.interactiveItems.find(item => item.userData.storyActivity === 'compilation');
        assert(deck && deck.children.length > 0 && activities.handleStoryInteraction(deck), 'Compilation deck is not present in the plaza');
        assert(![...document.querySelector('dialog[open]').querySelectorAll('button')].some(button => button.textContent === 'Play this set'), 'Empty compilation bypassed the contribution gate');
        storyUI.closeStoryModal();
        const choices = [['Consistency', 'Maya'], ['Tony Sucks', 'Jake'], ['Forest (acoustic)', 'Maya by the woods']];
        for (const [id, source] of choices) adventure.addContribution(id, id, source);
        activities.handleStoryInteraction(deck);
        try {
            const dialog = document.querySelector('dialog[open]');
            const begin = [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Play this set');
            assert(begin?.disabled, 'Performance should wait for an explicit setlist');
            for (const [id, source] of choices) [...dialog.querySelectorAll('button')].find(button => button.textContent === id + ' — ' + source).click();
            assert(!begin.disabled, 'Three selected contributions did not enable the show');
            for (let i = 0; i < 4; i++) begin.click();
            const state = adventure.getAdventureState();
            assert(state.story.completed && state.story.setlist.join('|') === choices.map(([id]) => id).join('|'), 'Chosen setlist was not preserved');
            assert(state.souvenirs.some(item => item.id === 'plaza-show-tape') && dialogue.getUnlockedSongs().some(song => song.name === 'Plaza Finale'), 'The show did not award its tape and finale');
        } finally { closeMenus(); }
    });
    closeMenus();
    adventure.setAdventureSettings({ developerMode: previousDeveloperMode });
}
