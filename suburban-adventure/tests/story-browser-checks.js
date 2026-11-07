export async function runStoryActivityChecks({ game, THREE, check, assert, frame, scenes, dialogue, npcs }) {
    const [adventure, activities, storyUI, controls, phone] = await Promise.all([
        import('../adventure-state.js'), import('../story-activities.js'), import('../story-ui.js'), import('../controls.js'), import('../phone-ui.js')
    ]);
    const tidy = () => { storyUI.closeStoryModal(); if (phone.getPhoneOpenState()) phone.togglePhone(); npcs.resetNPCInteraction(); controls.resetControls(); };
    const suburb = async () => {
        tidy();
        if (game.getRuntimeState().config.IS_INTERIOR) game.switchScene(scenes.getCurrentMap() === 'city' ? 'CITY_PLAZA' : 'PLAZA');
        if (scenes.getCurrentMap() !== 'suburban') game.performMapSwitch();
        await frame();
    };
    const press = label => {
        const button = [...document.querySelector('dialog[open]').querySelectorAll('button')].find(entry => entry.textContent === label);
        assert(button, 'Missing activity button: ' + label); button.click();
    };
    try {
        await check('the real ring toss has three playable throws, one persistent prize and clean animation disposal', async () => {
            await suburb(); adventure.resetAdventureProgress();
            const state = game.getRuntimeState(), counter = state.streetElements.interactiveItems.find(item => item.userData.name === 'Ring Toss');
            assert(counter && counter.children.some(child => child.isMesh) && counter.parent, 'Ring Toss needs a visible counter in the real carnival');
            const position = counter.getWorldPosition(new THREE.Vector3());
            state.camera.position.set(position.x + 1.8, 2, position.z);
            state.camera.lookAt(position.x, 2, position.z); controls.setYaw(state.camera.rotation.y); controls.setPitch(0);
            assert(npcs.checkBusStopProximity(state.camera, state.config, state.sceneKey, state.streetElements)?.object === counter, 'Facing the real counter did not offer INSPECT');
            const originalRequest = window.requestAnimationFrame, originalCancel = window.cancelAnimationFrame;
            const requests = [], canceled = [];
            window.requestAnimationFrame = callback => { const id = originalRequest.call(window, callback); requests.push(id); return id; };
            window.cancelAnimationFrame = id => { canceled.push(id); return originalCancel.call(window, id); };
            try {
                game.handleActionInput();
                assert(storyUI.getStoryModalOpen() && document.querySelector('dialog[open]'), 'Counter did not open the playable ring toss');
                for (let i = 0; i < 3; i++) press('Toss ring');
                assert(document.querySelector('dialog[open] [role="status"]').textContent.includes('3 of 3'), 'Three synchronous center throws were not scored');
                assert(adventure.getAdventureState().souvenirs.filter(item => item.id === 'midnight-bear').length === 1, 'Ring toss did not award exactly one prize');
                storyUI.closeStoryModal();
                assert(requests.length === 1 && canceled.includes(requests[0]), 'Ring animation was not canceled when its modal closed');
            } finally { window.requestAnimationFrame = originalRequest; window.cancelAnimationFrame = originalCancel; tidy(); }
            activities.handleStoryInteraction(counter);
            for (let i = 0; i < 3; i++) press('Toss ring');
            assert(adventure.getAdventureState().souvenirs.filter(item => item.id === 'midnight-bear').length === 1, 'Playing again duplicated the souvenir');
            press('Back to the neighborhood'); await frame();
            assert(!storyUI.getStoryModalOpen() && !document.querySelector('dialog[open]'), 'Ring toss left a modal movement lock');
        });
        await check('canceling a live compilation performance does not award the finale or retain playback', async () => {
            await suburb(); adventure.resetAdventureProgress(); dialogue.resetGameProgress();
            const contributions = [['Consistency', 'Maya'], ['Tony Sucks', 'Jake'], ['Forest (acoustic)', 'Maya in the woods']];
            for (const [id, source] of contributions) adventure.addContribution(id, id, source);
            const deck = game.getRuntimeState().streetElements.interactiveItems.find(item => item.userData.storyActivity === 'compilation');
            assert(deck && deck.getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(2, 1.1, -12.5)) < 1e-8, 'Compilation deck is not on the karaoke stage');
            assert(activities.handleStoryInteraction(deck), 'Deck failed to open a setlist');
            for (const [id, source] of contributions) press(id + ' — ' + source);
            press('Play this set');
            assert(document.querySelector('dialog[open] [role="status"]').textContent.startsWith('1 / 3'), 'The performance did not start');
            assert(!adventure.getAdventureState().story.completed && !dialogue.isSongUnlocked('Plaza Finale'), 'Starting a show awarded the finale prematurely');
            press('Back to the neighborhood'); await frame();
            assert(!storyUI.getStoryModalOpen() && !adventure.getAdventureState().story.completed && !dialogue.isSongUnlocked('Plaza Finale'), 'Canceled show completed or kept its modal alive');
            assert(adventure.getAdventureState().story.contributions.length === 3, 'Canceling discarded collected contributions');
        });
    } finally { tidy(); }
}
