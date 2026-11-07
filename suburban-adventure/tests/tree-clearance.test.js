import test from 'node:test';
import assert from 'node:assert/strict';
import { treeCanopyHalfWidth, treeClearsSuburbanSidewalks } from '../world/tree-clearance.js';

test('canopies clear both sidewalk edges on all three suburban streets, including the eastern pond road', () => {
    const reach = treeCanopyHalfWidth('Northern Red Oak', 1) + 0.75;
    for (const z of [-322, 11, 344]) for (const x of [-100, 250, 490]) {
        for (const side of [-1, 1]) {
            assert.equal(treeClearsSuburbanSidewalks(x, z + side * (12 + reach - 0.01), 5.2), false);
            assert.equal(treeClearsSuburbanSidewalks(x, z + side * (12 + reach + 0.01), 5.2), true);
        }
    }
});

test('connector sidewalks and finite road ends also reserve canopy room', () => {
    for (const x of [-170, 170]) for (const side of [-1, 1]) {
        assert.equal(treeClearsSuburbanSidewalks(x + side * 15, 200, 3), false);
        assert.equal(treeClearsSuburbanSidewalks(x + side * 16, 200, 3), true);
    }
    assert.equal(treeClearsSuburbanSidewalks(503, 11, 3), false);
    assert.equal(treeClearsSuburbanSidewalks(504, 11, 3), true);
    assert.equal(treeClearsSuburbanSidewalks(-200, 200, 3), true, 'Keep the woodland beyond the west T junction');
});
