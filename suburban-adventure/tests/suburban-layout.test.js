import test from 'node:test';
import assert from 'node:assert/strict';
import { UNIFIED_MAP_ZONES, UNIFIED_MAP_ZONE_OFFSETS, CITY_MAP_ZONES, SUBWAY_POSITIONS, getSubwayArrivalPosition } from '../scenes.js';
import { CARNIVAL_CONFIG, MANSION_CONFIG, FOREST_CLEARINGS, FOREST_PATH_WAYPOINTS, RIVER_CONFIG } from '../world/config.js';
import { getHorizontalBounds, SUBURBAN_RIGHT_CORNER_X, SUBURBAN_RIGHT_OUTER_CORNER_X } from '../roads.js';

test('suburb columns swap while center and city layouts retain their positions', () => {
    assert.equal(UNIFIED_MAP_ZONES.length, 9);
    assert.deepEqual(UNIFIED_MAP_ZONES.filter(zone => zone.x === -333).map(zone => zone.config), ['RIVER', 'RIVER', 'RIVER']);
    assert.deepEqual(UNIFIED_MAP_ZONES.filter(zone => zone.x === 333).map(zone => zone.config), ['MANSION', 'CARNIVAL', 'FOREST_CLEARINGS']);
    assert.deepEqual(UNIFIED_MAP_ZONE_OFFSETS, { PLAZA: { x: 0, z: 0 }, FOREST_SUBURBAN: { x: 0, z: 333 }, POND: { x: 0, z: -333 } });
    assert.equal(CITY_MAP_ZONES.find(zone => zone.key === 'CITY_NE').config, 'RECORD_STRIP');
    assert.deepEqual(SUBWAY_POSITIONS.city, { x: 333, z: -290 });
});
test('landmarks, clearings and subway occupy their new columns', () => {
    assert.deepEqual([CARNIVAL_CONFIG.x, CARNIVAL_CONFIG.z], [333, 0]);
    assert.deepEqual([MANSION_CONFIG.x, MANSION_CONFIG.z], [420, 430]);
    assert.equal(RIVER_CONFIG.x, -333);
    assert.ok(FOREST_CLEARINGS.every(prop => prop.x > 166 && prop.x < 500 && prop.z < -166));
    assert.ok(FOREST_PATH_WAYPOINTS.every(point => point.x > 166 && point.x < 500));
    const arrival = getSubwayArrivalPosition('suburban');
    assert.deepEqual(arrival, { x: -290, y: 2, z: -328 });
    assert.ok(arrival.x > RIVER_CONFIG.x + RIVER_CONFIG.halfWidth, 'Subway is on inner bank');
});
test('suburban streets extend east and stop before the west river', () => {
    const bounds = getHorizontalBounds('suburban');
    assert.deepEqual(bounds, { xMin: -165.05, xMax: 500 });
    assert.ok(bounds.xMin > RIVER_CONFIG.x + RIVER_CONFIG.halfWidth);
    assert.ok(bounds.xMin < 0 && bounds.xMax > CARNIVAL_CONFIG.x + CARNIVAL_CONFIG.radius);
    assert.deepEqual(getHorizontalBounds('city'), { xMin: -500, xMax: 500 });
    assert.equal(SUBURBAN_RIGHT_CORNER_X, 165.05);
    assert.equal(SUBURBAN_RIGHT_OUTER_CORNER_X, 174.95);
});
