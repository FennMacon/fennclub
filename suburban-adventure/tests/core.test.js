import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { parseDialogueFile, parseFlavorFile, loadAllContent, getConversation } from '../content-loader.js';
import { storage, readPosition } from '../storage.js';
import { startConversation, advanceConversation, unlockCurrentSong, endConversation, getUnlockedSongs, resetGameProgress } from '../dialogue.js';
import { getCurrentScene, getCurrentMap } from '../scenes.js';

test('dialogue parsing preserves speakers, colons, locations and reward', () => {
    const parsed = parseDialogueFile('=== PLAZA ===\r\nUNLOCKS: First Song\r\nMaya: Time: midnight\r\nPlayer: Yes\r\n=== POND ===\r\nMaya: Hello');
    assert.equal(parsed.PLAZA.unlocks, 'First Song');
    assert.deepEqual(parsed.PLAZA.dialogue[0], { speaker: 'Maya', text: 'Time: midnight' });
    assert.equal(parsed.POND.dialogue.length, 1);
});
test('flavor paragraphs and optional item metadata', () => {
    const parsed = parseFlavorFile('=== SHELF ===\nNAME: Shelf\nITEM: Snack\nFirst line\nsecond line\n\nAnother description');
    assert.deepEqual(parsed.SHELF.flavorText, ['First line second line', 'Another description']);
    assert.equal(parsed.SHELF.itemName, 'Snack');
});
test('invalid camera and scene saves recover', () => {
    for (const value of ['broken', 'null', '{"x":0,"y":2}', '{"x":"0","y":2,"z":0}', '{"x":10001,"y":2,"z":0}']) {
        storage.setItem('testPosition', value);
        assert.equal(readPosition('testPosition'), null);
    }
    storage.setItem('testPosition', '{"x":0,"y":2,"z":-3}');
    assert.deepEqual(readPosition('testPosition'), { x: 0, y: 2, z: -3 });
    for(const scene of ['deleted-scene','constructor','__proto__','toString']) {
        storage.setItem('suburbanAdventureScene',scene);
        assert.equal(getCurrentScene(),'PLAZA');
    }
    storage.setItem('suburbanAdventureScene', 'deleted-scene');
    storage.setItem('suburbanAdventureMap', 'deleted-map');
    assert.equal(getCurrentScene(), 'PLAZA');
    assert.equal(getCurrentMap(), 'suburban');
});
test('blocked storage and failed writes preserve in-memory state', () => {
    const original = globalThis.localStorage;
    globalThis.localStorage = {
        getItem: () => 'stale disk value',
        setItem: () => { throw new Error('quota'); },
        removeItem: () => { throw new Error('blocked'); }
    };
    try {
        storage.setItem('failedWrite', 'new value');
        assert.equal(storage.getItem('failedWrite'), 'new value');
        storage.removeItem('failedWrite');
        assert.equal(storage.getItem('failedWrite'), null);
        globalThis.localStorage.getItem = () => { throw new Error('blocked'); };
        assert.equal(storage.getItem('missingBlockedKey'), null);
    } finally {
        if (original === undefined) delete globalThis.localStorage;
        else globalThis.localStorage = original;
    }
});

let rewardSaveFixture = 0;
const withSavedRewards = async (songs, items, run) => {
    const songKey = 'suburbanAdventureUnlockedSongs', itemKey = 'suburbanAdventureEncounteredItems';
    const previousSongs = storage.getItem(songKey), previousItems = storage.getItem(itemKey);
    const previousLog = console.log, previousWarn = console.warn;
    try {
        storage.setItem(songKey, songs); storage.setItem(itemKey, items);
        console.log = console.warn = () => {};
        // Each fixture executes the real persisted-state loader in a fresh module.
        const module = await import(new URL('../dialogue.js?reward-save-' + rewardSaveFixture++, import.meta.url).href);
        await run(module);
    } finally {
        console.log = previousLog; console.warn = previousWarn;
        if (previousSongs === null) storage.removeItem(songKey); else storage.setItem(songKey, previousSongs);
        if (previousItems === null) storage.removeItem(itemKey); else storage.setItem(itemKey, previousItems);
    }
};

test('damaged reward metadata is discarded without losing healthy saved discoveries', async () => {
    const songs = [
        ['Consistency', { unlockedBy: 'Maya', ignored: ['old metadata'] }],
        ['The Room Between', { unlockedBy: 'The mansion piano' }],
        ['Null artist', null], ['Array artist', ['Maya']], ['Number artist', { unlockedBy: 42 }],
        ['Missing artist', {}], [42, { unlockedBy: 'Maya' }], ['Wrong tuple size', { unlockedBy: 'Maya' }, true],
        [' ', { unlockedBy: 'Maya' }], ['Bad\u0000title', { unlockedBy: 'Maya' }], null, 'mixed-in text'
    ];
    const items = ['Cassette', null, { name: 'Bad object' }, ['Bad array'], 42, '', '  ', 'Bad\u0000item', 'Tiny Midnight Bear', 'Cassette'];
    await withSavedRewards(JSON.stringify(songs), JSON.stringify(items), async module => {
        assert.deepEqual(module.getUnlockedSongs(), [
            { name: 'Consistency', unlockedBy: 'Maya' }, { name: 'The Room Between', unlockedBy: 'The mansion piano' }
        ]);
        assert.deepEqual(module.getEncounteredItems(), ['Cassette', 'Tiny Midnight Bear']);
        assert.equal(module.unlockSong('A Future Recording', 'A New Neighbor').newlyUnlocked, true);
        assert.equal(module.unlockSong('Invalid Artist', {}), null);
    });
});

test('non-array, malformed and oversized reward saves recover as empty collections', async () => {
    for (const raw of ['broken JSON', 'null', '{}', '42', '"Consistency"', ' '.repeat(512001)]) {
        await withSavedRewards(raw, raw, module => {
            assert.deepEqual(module.getUnlockedSongs(), []);
            assert.deepEqual(module.getEncounteredItems(), []);
        });
    }
});

test('legacy song-title sets migrate and valid story recordings survive save reloads', async () => {
    await withSavedRewards(JSON.stringify(['Consistency', 'Plaza Finale', 'The Room Between']), JSON.stringify(['Tiny Midnight Bear']), async module => {
        assert.deepEqual(module.getUnlockedSongs(), ['Consistency', 'Plaza Finale', 'The Room Between'].map(name => ({ name, unlockedBy: 'Unknown' })));
        module.unlockSong('First Train Home', 'Inez'); module.markItemEncountered('The Plaza Show Tape');
        const reloaded = await import(new URL('../dialogue.js?reward-save-' + rewardSaveFixture++, import.meta.url).href);
        assert.deepEqual(reloaded.getUnlockedSongs(), [
            ...['Consistency', 'Plaza Finale', 'The Room Between'].map(name => ({ name, unlockedBy: 'Unknown' })),
            { name: 'First Train Home', unlockedBy: 'Inez' }
        ]);
        assert.deepEqual(reloaded.getEncounteredItems(), ['Tiny Midnight Bear', 'The Plaza Show Tape']);
    });
});

test('reward saves bound collection sizes and text before the phone reads them', async () => {
    const songs = [
        ['x'.repeat(161), { unlockedBy: 'Maya' }], ['Oversized artist', { unlockedBy: 'x'.repeat(161) }],
        ...Array.from({ length: 300 }, (_, i) => ['Recording ' + i, { unlockedBy: 'Neighbor ' + i }])
    ];
    const items = ['x'.repeat(161), ...Array.from({ length: 1200 }, (_, i) => 'Object ' + i)];
    await withSavedRewards(JSON.stringify(songs), JSON.stringify(items), module => {
        assert.equal(module.getUnlockedSongs().length, 256);
        assert.equal(module.getUnlockedSongs()[0].name, 'Recording 0');
        assert.equal(module.getEncounteredItems().length, 1000);
        assert.equal(module.getEncounteredItems()[0], 'Object 0');
        assert.equal(module.unlockSong('Overflow recording', 'Neighbor'), null);
        assert.equal(module.markItemEncountered('Overflow item'), null);
        assert.equal(module.unlockSong('Recording 0', 'Returning Neighbor').newlyUnlocked, false);
        assert.equal(module.markItemEncountered('Object 0').newlyEncountered, false);
    });
});

test('content loads concurrently, diagnoses missing files, and awards persistent rewards', async () => {
    let active = 0, peak = 0;
    const warnings = [];
    const previousFetch = globalThis.fetch, previousWarn = console.warn;
    console.warn = (...args) => warnings.push(args);
    globalThis.fetch = async path => {
        active++; peak = Math.max(peak, active);
        await new Promise(resolve => setTimeout(resolve, 5));
        active--;
        if (path.endsWith('Jake.txt')) return { ok: false, status: 404 };
        return { ok: true, text: () => readFile(new URL(path), 'utf8') };
    };
    try {
        await loadAllContent();
        assert.equal(peak, 33);
        assert.equal(warnings.length, 1);
        assert.ok(getConversation('Jake', 'PLAZA').dialogue.length); // embedded fallback
        resetGameProgress();
        assert.equal(startConversation('Maya', 'PLAZA'), true);
        while (advanceConversation()) {}
        assert.equal(unlockCurrentSong('Maya').song, 'Consistency');
        assert.equal(getUnlockedSongs().length, 1);
        assert.match(storage.getItem('suburbanAdventureUnlockedSongs'), /Consistency/);
        assert.equal(unlockCurrentSong('Maya').newlyUnlocked, false);
        endConversation();
        resetGameProgress();
        assert.equal(getUnlockedSongs().length, 0);
    } finally { globalThis.fetch = previousFetch; console.warn = previousWarn; }
});
test('every authored dialogue location exists and every block has lines', async () => {
    const { SCENE_CONFIGS } = await import('../scenes.js');
    for (const name of await readdir(new URL('../content/dialogue/', import.meta.url))) {
        const data = parseDialogueFile(await readFile(new URL('../content/dialogue/' + name, import.meta.url), 'utf8'));
        for (const [scene, block] of Object.entries(data)) {
            assert.ok(SCENE_CONFIGS[scene], `${name}: unknown scene ${scene}`);
            assert.ok(block.dialogue.length, `${name}: empty ${scene}`);
        }
    }
});

test('music catalog maps every dialogue and story title while retaining the original recording pairs', async () => {
    const { validateMusicCatalog } = await import('../music-library.js');
    const data = JSON.parse(await readFile(new URL('../music/catalog.json', import.meta.url), 'utf8'));
    const catalog = validateMusicCatalog(data);
    assert.equal(data.recordings.length, 14);
    assert.equal(catalog.size, 38);
    const audio = (await readdir(new URL('../music/', import.meta.url))).filter(name => name.endsWith('.mp3'));
    assert.deepEqual(data.recordings.map(track => track.file).sort(), audio.sort());
    for (const track of data.recordings) {
        assert.ok(track.rewards.length >= 2);
        await access(new URL('../music/' + encodeURIComponent(track.file), import.meta.url));
    }
    for (const name of await readdir(new URL('../content/dialogue/', import.meta.url))) {
        const blocks = parseDialogueFile(await readFile(new URL('../content/dialogue/' + name, import.meta.url), 'utf8'));
        for (const block of Object.values(blocks)) if (block.unlocks) assert.ok(catalog.has(block.unlocks), block.unlocks);
    }
    assert.throws(() => validateMusicCatalog({ recordings: [{ id: 'bad', file: '../outside.mp3', rewards: ['Bad'] }] }));
    assert.throws(() => validateMusicCatalog({ recordings: [{ id: 'one', file: 'one.mp3', rewards: ['Duplicate', 'Duplicate'] }] }));
});
