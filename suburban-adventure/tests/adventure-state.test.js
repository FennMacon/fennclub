import test from 'node:test';
import assert from 'node:assert/strict';
import { storage } from '../storage.js';
import { getAdventureState, subscribeAdventure, markAreaVisited, visitBusiness, rememberDiscovery, noteConversation, startCompilation, addContribution, completeShow, solveMystery, earnSouvenir, setAdventureSettings, saveCheckpoint, resetAdventureProgress, validateCheckpoint, validateAdventureState, ADVENTURE_SAVE_KEY } from '../adventure-state.js';

const reset = () => {
    resetAdventureProgress();
    setAdventureSettings({ brightness: 1, textScale: 1, sensitivity: 1, developerMode: false, ambience: true });
};
test('adventure discoveries persist without duplicate visits and returned snapshots cannot mutate progress', () => {
    reset();
    assert.equal(markAreaVisited('suburban', 'PLAZA', 'Main plaza'), true);
    assert.equal(markAreaVisited('suburban', 'PLAZA', 'Main plaza'), false);
    visitBusiness('shop-1', 'Wild Violet Flowers', { map: 'suburban', area: 'Main plaza' });
    rememberDiscovery({ id: 'note-1', name: 'Folded invitation', text: 'Follow the winding path.', map: 'suburban', area: 'Woodland clearings' });
    assert.equal(noteConversation('Maya', 'PLAZA'), true);
    assert.equal(noteConversation('Maya', 'PLAZA'), false);
    const snapshot = getAdventureState(); snapshot.visited.suburban[0].label = 'tampered'; snapshot.discoveries.length = 0;
    assert.equal(getAdventureState().visited.suburban[0].label, 'Main plaza');
    assert.equal(getAdventureState().discoveries.length, 1);
    const saved = JSON.parse(storage.getItem(ADVENTURE_SAVE_KEY));
    assert.equal(saved.version, 1);
    assert.equal(saved.state.businesses[0].name, 'Wild Violet Flowers');
    assert.deepEqual(saved.state.conversations, ['PLAZA:Maya']);
    assert.equal(rememberDiscovery({ id: 'note-1', text: {} }), false);
    assert.equal(visitBusiness('shop-1', {}, 'bad'), false);
    assert.equal(markAreaVisited('suburban', 'PLAZA', {}), false);
    assert.equal(getAdventureState().discoveries.length, 1);
    assert.equal(getAdventureState().businesses.length, 1);
    assert.equal(getAdventureState().visited.suburban.length, 1);
});
test('story finale, mystery and souvenirs survive reload; reset preserves comfort settings', async () => {
    reset(); startCompilation();
    addContribution('song-a', 'Song A', 'Maya'); addContribution('song-a', 'Song A', 'Maya');
    completeShow(['Song A', 'Song B', 'Song C']); solveMystery(); earnSouvenir('prize', 'Tiny wireframe moon');
    setAdventureSettings({ brightness: 1.25, textScale: 1.2, sensitivity: .75, ambience: false });
    const reloaded = await import('../adventure-state.js?reload=story');
    assert.equal(reloaded.getAdventureState().story.contributions.length, 1);
    assert.deepEqual(reloaded.getAdventureState().story.setlist, ['Song A', 'Song B', 'Song C']);
    assert.equal(reloaded.getAdventureState().mystery.solved, true);
    assert.equal(reloaded.getAdventureState().souvenirs[0].name, 'Tiny wireframe moon');
    assert.equal(reloaded.getAdventureState().settings.ambience, false);
    resetAdventureProgress();
    assert.equal(getAdventureState().story.started, false);
    assert.equal(getAdventureState().settings.brightness, 1.25);
    assert.equal(getAdventureState().settings.ambience, false);
    assert.equal(getAdventureState().souvenirs.length, 0);
});
test('journal validation rejects malformed entries, caps collection sizes and clamps settings', () => {
    const value = validateAdventureState({
        visited: { suburban: [{ key: 'PLAZA', label: 'A' }, { key: 'PLAZA', label: 'Duplicate' }, { key: {}, label: 'Bad' }, { key: 'made-up', label: 'Fake area' }] },
        discoveries: [{ id: 'x', name: 'x', text: 'x', map: 'other', area: 'x' }, { id: 'x', name: 'x', text: 'x'.repeat(2001), map: 'city', area: 'x' }],
        businesses: Array.from({ length: 700 }, (_, i) => ({ id: String(i), name: 'Store', location: 'Allston' })),
        settings: { brightness: 999, textScale: -1, sensitivity: NaN, developerMode: 'true' },
        story: { started: 'yes', setlist: [null, {}, 'Valid', 'Valid'] }
    });
    assert.deepEqual(value.visited.suburban, [{ key: 'PLAZA', label: 'A' }]);
    assert.equal(value.discoveries.length, 0); assert.equal(value.businesses.length, 500);
    assert.deepEqual(value.settings, { brightness: 1.6, textScale: 1, sensitivity: 1, developerMode: false, ambience: true });
    assert.deepEqual(value.story.setlist, ['Valid']); assert.equal(value.story.started, false);
});
test('checkpoint validation rejects unknown scenes, wrong maps, nonfinite and out of bounds positions', () => {
    const checkpoint = { map: 'suburban', sceneKey: 'PLAZA', position: { x: 0, y: 2, z: 21 }, yaw: Math.PI * 8, pitch: 10 };
    const valid = validateCheckpoint(checkpoint);
    assert.ok(Math.abs(valid.yaw) < 1e-12); assert.equal(valid.pitch, Math.PI / 3);
    for (const bad of [
        { ...checkpoint, sceneKey: 'FAKE_INTERIOR' }, { ...checkpoint, sceneKey: 'toString' },
        { ...checkpoint, map: 'city' }, { ...checkpoint, yaw: Infinity },
        ...[{ x: 500, y: 2, z: 0 }, { x: 0, y: 0, z: 0 }, { x: NaN, y: 2, z: 0 }].map(position => ({ ...checkpoint, position }))
    ]) assert.equal(validateCheckpoint(bad), null);
    assert.equal(validateCheckpoint({ ...checkpoint, sceneKey: 'MANSION_INTERIOR', position: { x: 24, y: 2, z: 0 } }), null);
    assert.equal(saveCheckpoint(checkpoint), true);
    assert.equal(getAdventureState().checkpoint.position.z, 21);
    const interior = validateCheckpoint({ ...checkpoint, sceneKey: 'MANSION_INTERIOR', storeName: 'Woodland Mansion', position: { x: 0, y: 2, z: 20 }, returnState: { sceneKey: 'PLAZA', position: { x: 410, y: 2, z: 430 }, yaw: Math.PI * 4, isFarBuilding: true } });
    assert.equal(interior.returnState.position.x, 410);
    assert.ok(Math.abs(interior.returnState.yaw) < 1e-12);
    assert.equal(validateCheckpoint({ ...interior, returnState: { ...interior.returnState, sceneKey: 'CITY_PLAZA' } }).returnState, undefined);
    assert.equal(validateCheckpoint({ ...interior, returnState: { ...interior.returnState, position: { x: 900, y: 2, z: 0 } } }).returnState, undefined);
});
test('subscriptions fire only for real changes and unsubscribe cleanly', () => {
    reset(); let calls = 0;
    const unsubscribe = subscribeAdventure(snapshot => { calls++; snapshot.mystery.solved = false; });
    solveMystery(); solveMystery();
    assert.equal(calls, 1); assert.equal(getAdventureState().mystery.solved, true);
    unsubscribe(); earnSouvenir('later', 'Later prize'); assert.equal(calls, 1);
});
test('corrupt and future save versions recover to fresh state without blocking storage fallback', async () => {
    for (const [key, contents] of [['broken', '{broken'], ['future', JSON.stringify({ version: 99, state: { mystery: { solved: true } } })]]) {
        storage.setItem(ADVENTURE_SAVE_KEY, contents);
        const reloaded = await import('../adventure-state.js?reload=' + key);
        assert.equal(reloaded.getAdventureState().mystery.solved, false);
        assert.equal(reloaded.markAreaVisited('city', 'CITY_PLAZA', 'Harvard Avenue'), true);
        assert.equal(JSON.parse(storage.getItem(ADVENTURE_SAVE_KEY)).version, 1);
    }
    const original = globalThis.localStorage;
    globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
    try {
        earnSouvenir('offline', 'Offline keepsake');
        assert.equal(JSON.parse(storage.getItem(ADVENTURE_SAVE_KEY)).state.souvenirs.some(entry => entry.id === 'offline'), true);
    } finally { if (original === undefined) delete globalThis.localStorage; else globalThis.localStorage = original; }
});
