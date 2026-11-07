import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdventureState, resetAdventureProgress, rememberDiscovery, completeShow } from '../adventure-state.js';
import { getStoryDialogue, onConversationComplete, getCityEncounters, getCompilationGoal } from '../adventure-story.js';
import { hasMysteryClues, isMysteryMelody, MYSTERY_CLUES, validSetlist, ringAimAt, scoreRingThrow } from '../story-activities.js';

test('compilation introduction and repeat dialogue follow actual completion', () => {
    resetAdventureProgress();
    assert.match(getCompilationGoal(), /Find Maya/);
    const first = getStoryDialogue('Maya', 'PLAZA');
    assert.equal(first.unlocks, 'Consistency');
    assert.match(first.dialogue.at(-1).text, /any three/);
    assert.equal(getAdventureState().story.contributions.length, 0);
    onConversationComplete('Maya', 'PLAZA');
    onConversationComplete('Maya', 'PLAZA');
    assert.equal(getAdventureState().story.contributions.length, 1);
    assert.equal(getStoryDialogue('Maya', 'PLAZA').unlocks, null);
    assert.match(getCompilationGoal(), /2 more/);
    onConversationComplete('Jake', 'PLAZA');
    onConversationComplete('Alex', 'PLAZA');
    assert.equal(getAdventureState().story.contributions.length, 3);
    assert.equal(getStoryDialogue('Sam', 'PLAZA').unlocks, null);
    assert.match(getCompilationGoal(), /cassette deck/);
});

test('Theo never prematurely contributes the finale and each city district has a unique encounter', () => {
    resetAdventureProgress();
    assert.equal(getStoryDialogue('Theo', 'CUMBYS_INTERIOR').unlocks, null);
    onConversationComplete('Theo', 'CUMBYS_INTERIOR');
    assert.equal(getAdventureState().story.contributions.length, 0);
    const encounters = getCityEncounters();
    assert.equal(encounters.length, 9);
    assert.equal(new Set(encounters.map(entry => entry.sceneKey)).size, 9);
    assert.equal(new Set(encounters.map(entry => entry.name)).size, 9);
    for (const entry of encounters) {
        assert.ok(Math.abs(entry.position.x) < 500 && Math.abs(entry.position.z) < 500);
        assert.equal(getStoryDialogue(entry.name, entry.sceneKey).unlocks, entry.contribution.title);
        onConversationComplete(entry.name, entry.sceneKey);
        assert.equal(getStoryDialogue(entry.name, entry.sceneKey).unlocks, null);
    }
    assert.equal(getAdventureState().story.contributions.length, 9);
    assert.ok(!getAdventureState().story.contributions.some(entry => entry.id === 'Plaza Finale'));
});

test('finishing a show keeps unvisited neighbors and their recordings available', () => {
    resetAdventureProgress();
    completeShow(['one', 'two', 'three']);
    assert.equal(getStoryDialogue('Maya', 'PLAZA').unlocks, 'Consistency');
    const neighbor = getCityEncounters()[0];
    assert.equal(getStoryDialogue(neighbor.name, neighbor.sceneKey).unlocks, neighbor.contribution.title);
    onConversationComplete(neighbor.name, neighbor.sceneKey);
    assert.equal(getStoryDialogue(neighbor.name, neighbor.sceneKey).unlocks, null);
});

test('show requires three different collected contributions and mystery requires all clues in order', () => {
    const contributions = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];
    assert.equal(validSetlist(['one', 'two', 'three'], contributions), true);
    assert.equal(validSetlist(['one', 'one', 'three'], contributions), false);
    assert.equal(validSetlist(['one', 'two', 'missing'], contributions), false);
    assert.equal(validSetlist(['one', 'two'], contributions), false);
    resetAdventureProgress();
    assert.equal(hasMysteryClues(getAdventureState()), false);
    for (const clue of MYSTERY_CLUES) rememberDiscovery({ id: clue.id, name: clue.name, text: clue.text, map: 'suburban', area: 'Forest clearings' });
    assert.equal(hasMysteryClues(getAdventureState()), true);
    assert.equal(isMysteryMelody(['D', 'A', 'E']), true);
    assert.equal(isMysteryMelody(['A', 'D', 'E']), false);
    assert.equal(isMysteryMelody(['D', 'A']), false);
});

test('ring timing offers repeating hit windows and rejects invalid throws', () => {
    assert.equal(scoreRingThrow(ringAimAt(0)), 1);
    assert.equal(scoreRingThrow(ringAimAt(650)), 0);
    assert.equal(scoreRingThrow(ringAimAt(1300)), 1);
    assert.equal(scoreRingThrow(ringAimAt(1950)), 0);
    assert.equal(scoreRingThrow(NaN), 0);
    assert.equal(scoreRingThrow(Infinity), 0);
});
