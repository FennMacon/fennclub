import { storage } from './storage.js';
import { SCENE_CONFIGS, UNIFIED_MAP_ZONES, CITY_MAP_ZONES } from './scenes.js';

// One small, versioned save for discoveries, story progress, preferences and recovery.
export const ADVENTURE_SAVE_KEY = 'suburbanAdventureJournal';
export const ADVENTURE_SAVE_VERSION = 1;
const maps = ['suburban', 'city'];
const areaKeys = { suburban: new Set(UNIFIED_MAP_ZONES.map(area => area.key)), city: new Set(CITY_MAP_ZONES.map(area => area.key)) };
const listeners = new Set();
let current;
const clone = value => JSON.parse(JSON.stringify(value));
const text = (value, limit = 160) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= limit ? value.trim() : null;
const fresh = () => ({
    visited: { suburban: [], city: [] }, discoveries: [], businesses: [], conversations: [],
    story: { started: false, contributions: [], completed: false, setlist: [] },
    mystery: { solved: false }, souvenirs: [],
    settings: { brightness: 1, textScale: 1, sensitivity: 1, developerMode: false, ambience: true }, checkpoint: null
});
const unique = (values, convert, key, limit) => {
    if (!Array.isArray(values)) return [];
    const seen = new Set(), result = [];
    for (const value of values.slice(0, limit * 2)) {
        const converted = convert(value);
        if (!converted || seen.has(key(converted))) continue;
        seen.add(key(converted)); result.push(converted);
        if (result.length >= limit) break;
    }
    return result;
};
const bounded = (value, min, max, fallback) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
const location = value => {
    if (typeof value === 'string') return text(value);
    if (!value || !maps.includes(value.map)) return null;
    const area = text(value.area, 80);
    return area ? { map: value.map, area } : null;
};
const discovery = value => {
    if (!value || !maps.includes(value.map)) return null;
    const id = text(value.id, 120), name = text(value.name, 120), description = text(value.text, 2000), area = text(value.area, 80);
    return id && name && description && area ? { id, name, text: description, map: value.map, area } : null;
};
const contribution = value => {
    const id = text(value?.id, 120), label = text(value?.label, 160), source = text(value?.source, 160);
    return id && label && source ? { id, label, source } : null;
};
export const validateCheckpoint = value => {
    if (!value || !maps.includes(value.map) || typeof value.sceneKey !== 'string' || !Object.hasOwn(SCENE_CONFIGS, value.sceneKey)) return null;
    const interior = SCENE_CONFIGS[value.sceneKey].IS_INTERIOR === true;
    if (!interior && value.sceneKey.startsWith('CITY_') !== (value.map === 'city')) return null;
    const position = value.position, extent = interior ? (value.sceneKey === 'MANSION_INTERIOR' ? 23.3 : 24.5) : 499;
    if (!position || !['x', 'y', 'z'].every(axis => Number.isFinite(position[axis])) || Math.abs(position.x) > extent || Math.abs(position.z) > extent || position.y < 2 || position.y > (interior ? 10 : 80)) return null;
    if (!Number.isFinite(value.yaw) || !Number.isFinite(value.pitch)) return null;
    const checkpoint = {
        map: value.map, sceneKey: value.sceneKey, position: { x: position.x, y: position.y, z: position.z },
        yaw: Math.atan2(Math.sin(value.yaw), Math.cos(value.yaw)), pitch: bounded(value.pitch, -Math.PI / 3, Math.PI / 3, 0)
    };
    const storeName = text(value.storeName, 120);
    if (interior && storeName) checkpoint.storeName = storeName;
    if (interior && value.returnState) {
        const back = value.returnState, config = typeof back.sceneKey === 'string' && Object.hasOwn(SCENE_CONFIGS, back.sceneKey) ? SCENE_CONFIGS[back.sceneKey] : null;
        const point = back.position;
        if (config && !config.IS_INTERIOR && back.sceneKey.startsWith('CITY_') === (value.map === 'city')
            && point && ['x', 'y', 'z'].every(axis => Number.isFinite(point[axis])) && Math.abs(point.x) <= 493 && Math.abs(point.z) <= 493 && point.y === 2
            && typeof back.isFarBuilding === 'boolean' && (back.yaw === undefined || Number.isFinite(back.yaw))) {
            checkpoint.returnState = { sceneKey: back.sceneKey, position: { x: point.x, y: 2, z: point.z }, isFarBuilding: back.isFarBuilding };
            if (back.yaw !== undefined) checkpoint.returnState.yaw = Math.atan2(Math.sin(back.yaw), Math.cos(back.yaw));
        }
    }
    return checkpoint;
};

export const validateAdventureState = value => {
    const result = fresh();
    if (!value || typeof value !== 'object') return result;
    for (const map of maps) result.visited[map] = unique(value.visited?.[map], entry => {
        const key = text(entry?.key, 64), label = text(entry?.label, 80);
        return key && label && areaKeys[map].has(key) ? { key, label } : null;
    }, entry => entry.key, 9);
    result.discoveries = unique(value.discoveries, discovery, entry => entry.id, 400);
    result.businesses = unique(value.businesses, entry => {
        const id = text(entry?.id, 120), name = text(entry?.name, 120), place = location(entry?.location);
        return id && name && place ? { id, name, location: place } : null;
    }, entry => entry.id, 500);
    result.conversations = unique(value.conversations, entry => text(entry, 160), entry => entry, 300);
    result.story.started = value.story?.started === true;
    result.story.contributions = unique(value.story?.contributions, contribution, entry => entry.id, 100);
    result.story.completed = value.story?.completed === true;
    result.story.setlist = unique(value.story?.setlist, entry => text(entry, 160), entry => entry, 28);
    result.mystery.solved = value.mystery?.solved === true;
    result.souvenirs = unique(value.souvenirs, entry => {
        const id = text(entry?.id, 120), name = text(entry?.name, 120);
        return id && name ? { id, name } : null;
    }, entry => entry.id, 100);
    result.settings.brightness = bounded(value.settings?.brightness, .7, 1.6, 1);
    result.settings.textScale = bounded(value.settings?.textScale, 1, 1.5, 1);
    result.settings.sensitivity = bounded(value.settings?.sensitivity, .5, 2, 1);
    result.settings.developerMode = value.settings?.developerMode === true;
    result.settings.ambience = typeof value.settings?.ambience === 'boolean' ? value.settings.ambience : true;
    result.checkpoint = validateCheckpoint(value.checkpoint);
    return result;
};
const state = () => {
    if (!current) {
        try {
            const saved = JSON.parse(storage.getItem(ADVENTURE_SAVE_KEY));
            current = saved?.version === ADVENTURE_SAVE_VERSION ? validateAdventureState(saved.state) : fresh();
        } catch { current = fresh(); }
    }
    return current;
};
const update = mutate => {
    const before = JSON.stringify(state());
    const next = clone(state()); mutate(next);
    const validated = validateAdventureState(next);
    if (JSON.stringify(validated) === before) return false;
    current = validated;
    storage.setItem(ADVENTURE_SAVE_KEY, JSON.stringify({ version: ADVENTURE_SAVE_VERSION, state: current }));
    for (const listener of listeners) {
        try { listener(getAdventureState()); } catch (error) { console.error('Adventure listener failed:', error); }
    }
    return true;
};
export const getAdventureState = () => clone(state());
export const subscribeAdventure = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export const markAreaVisited = (map, key, label) => maps.includes(map) && areaKeys[map].has(key) && !!text(label, 80) && update(next => {
    const existing = next.visited[map].find(area => area.key === key);
    if (existing) existing.label = label; else next.visited[map].push({ key, label });
});
export const visitBusiness = (id, name, place) => !!(text(id, 120) && text(name, 120) && location(place)) && update(next => {
    const entry = { id, name, location: place }, index = next.businesses.findIndex(business => business.id === id);
    if (index >= 0) next.businesses[index] = entry; else next.businesses.push(entry);
});
export const rememberDiscovery = entry => !!discovery(entry) && update(next => {
    const index = next.discoveries.findIndex(remembered => remembered.id === entry?.id);
    if (index >= 0) next.discoveries[index] = entry; else next.discoveries.push(entry);
});
export const noteConversation = (name, sceneKey) => {
    const person = text(name, 80), scene = text(sceneKey, 64);
    return !!(person && scene) && update(next => { next.conversations.push(scene + ':' + person); });
};
export const startCompilation = () => update(next => { next.story.started = true; });
export const addContribution = (id, label, source) => update(next => { next.story.contributions.push({ id, label, source }); });
export const completeShow = setlist => Array.isArray(setlist) && update(next => { next.story.started = true; next.story.completed = true; next.story.setlist = setlist; });
export const solveMystery = () => update(next => { next.mystery.solved = true; });
export const earnSouvenir = (id, name) => update(next => { next.souvenirs.push({ id, name }); });
export const setAdventureSettings = patch => update(next => {
    for (const key of ['brightness', 'textScale', 'sensitivity', 'developerMode', 'ambience']) if (patch && Object.hasOwn(patch, key)) next.settings[key] = patch[key];
});
export const saveCheckpoint = checkpoint => {
    const valid = validateCheckpoint(checkpoint);
    return !!valid && update(next => { next.checkpoint = valid; });
};
export const resetAdventureProgress = () => update(next => {
    const settings = next.settings;
    Object.assign(next, fresh(), { settings });
});
