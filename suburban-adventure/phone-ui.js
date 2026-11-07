import { getRecording, getRecordingURL, loadMusicCatalog } from './music-library.js';
import { getAdventureState, subscribeAdventure, setAdventureSettings, resetAdventureProgress } from './adventure-state.js';
import { UNIFIED_MAP_ZONES, CITY_MAP_ZONES } from './scenes.js';
import { getStoryModalOpen } from './story-ui.js';
import { getCompilationGoal } from './adventure-story.js';
// phone-ui.js - Retro flip phone UI for songs and items

import { getUnlockedSongs, getEncounteredItems, hasActiveConversation, resetGameProgress } from './dialogue.js';

let phoneUI = null;
let phoneButton = null;
let isPhoneOpen = false;
let lastContentKey = '';
let closeTimer;
let previousFocus;
let journal;
let audioPlayer, nowPlaying;
let selectedSong = null;
let notesPanel, mapPanel, settingsPanel, soundtrackPanel, phoneTabs;
let adventureContentKey = '';
let activeTab = 'journal';
let transitUI = null, transitPreviousFocus;
let transitContentKey = '';
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Debug info state
let debugInfo = {
    scene: 'Loading...',
    time: '00:00',
    fps: 60,
    cameraPosition: { x: 0, y: 0, z: 0 },
    cameraSpeed: 0
};

const mapShortNames={ZONE_NW:'North river',FOREST_SUBURBAN:'Forest plaza',ZONE_NE:'Mansion',ZONE_W:'River walk',PLAZA:'Main plaza',ZONE_E:'Carnival',ZONE_SW:'River & subway',POND:'Pond',ZONE_SE:'Clearings',CITY_NW:'Rat City',CITY_N:'Comm Ave',CITY_NE:'Rehearsal',CITY_W:'Linden',CITY_PLAZA:'Harvard village',CITY_E:'Food blocks',CITY_SW:'Commons',CITY_S:'After dark',CITY_SE:'Green Line'};
const mapLabel = map => map === 'city' ? 'Allston' : 'Suburbs';
const placeLabel = place => typeof place === 'string' ? place : `${place.area} · ${mapLabel(place.map)}`;
const applySettings = () => {
    const { settings } = getAdventureState();
    document.documentElement.style.setProperty('--game-brightness', settings.brightness);
    document.documentElement.style.setProperty('--game-text-scale', settings.textScale);
    for (const input of settingsPanel?.querySelectorAll('[data-setting]') || []) {
        const key = input.dataset.setting;
        if (input.type === 'checkbox') input.checked = settings[key];
        else {
            input.value = settings[key];
            settingsPanel.querySelector(`[data-setting-output="${key}"]`).textContent = `${Math.round(settings[key] * 100)}%`;
        }
    }
};
const showPhoneTab = (name, focus = false) => {
    activeTab = name;
    for (const tab of phoneTabs?.querySelectorAll('[role="tab"]') || []) {
        const selected = tab.dataset.tab === name;
        tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
        if (selected && focus) tab.focus();
    }
    if (notesPanel) notesPanel.hidden = name !== 'journal';
    if (mapPanel) mapPanel.hidden = name !== 'map';
    if (journal) journal.hidden = name !== 'music';
    if (soundtrackPanel) soundtrackPanel.hidden = name !== 'music';
    if (settingsPanel) settingsPanel.hidden = name !== 'settings';
};
const renderAdventureContent = items => {
    if (!notesPanel || !mapPanel) return;
    const adventure = getAdventureState();
    const key = JSON.stringify([adventure.visited, adventure.discoveries, adventure.businesses, adventure.story, adventure.mystery, adventure.souvenirs, items, debugInfo.map, debugInfo.district, debugInfo.districtName, debugInfo.scene]);
    if (key === adventureContentKey) return;
    adventureContentKey = key;
    const { story } = adventure;
    const lead = getCompilationGoal();
    const title = ['Allston', 'Suburbs'].includes(debugInfo.scene) ? debugInfo.districtName || debugInfo.scene : debugInfo.scene;
    let html = `<h3>${escapeHTML(title)}</h3><section class="phone-lead"><h4>Tonight’s lead</h4><p>${escapeHTML(lead)}</p></section>`;
    if (story.contributions.length) html += `<h4>Compilation contributions</h4><ul>${story.contributions.map(entry => `<li>${escapeHTML(entry.label)}<small>${escapeHTML(entry.source)}</small></li>`).join('')}</ul>`;
    if (story.completed && story.setlist.length) html += `<h4>Your show</h4><ol>${story.setlist.map(name => `<li>${escapeHTML(name)}</li>`).join('')}</ol>`;
    html += '<h4>Field notes</h4>';
    html += adventure.discoveries.length ? adventure.discoveries.slice().reverse().map(entry => `<article class="journal-entry"><h5>${escapeHTML(entry.name)}</h5><small>${escapeHTML(entry.area)} · ${mapLabel(entry.map)}</small><p>${escapeHTML(entry.text)}</p></article>`).join('') : '<p>Inspect something unusual to save its description and location here.</p>';
    html += '<h4>Places you’ve visited</h4>';
    html += adventure.businesses.length ? `<ul>${adventure.businesses.slice().reverse().map(entry => `<li>${escapeHTML(entry.name)}<small>${escapeHTML(placeLabel(entry.location))}</small></li>`).join('')}</ul>` : '<p>Enter a shop to remember its name and neighborhood.</p>';
    if (adventure.souvenirs.length) html += `<h4>Souvenirs</h4><ul>${adventure.souvenirs.map(entry => `<li>${escapeHTML(entry.name)}</li>`).join('')}</ul>`;
    if (adventure.mystery.solved) html += '<p class="phone-lead">The woodland melody has found its answer.</p>';
    html += '<h4>Found objects</h4>' + (items.length ? `<ul>${items.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : '<p>Your keepsakes will appear here.</p>');
    notesPanel.innerHTML = html;
    const currentMap = debugInfo.map === 'city' ? 'city' : 'suburban';
    mapPanel.innerHTML = `<h3>Neighborhood notebook</h3><p>You are in ${escapeHTML(debugInfo.districtName || mapLabel(currentMap))}. North is at the top. Places fill in as you explore.</p>` + ['suburban', 'city'].map(map => {
        const visited = adventure.visited[map];
        const zones = map === 'city' ? CITY_MAP_ZONES : UNIFIED_MAP_ZONES;
        return `<h4>${mapLabel(map)} <small>${visited.length}/9 areas visited</small></h4><ol class="discovery-map" aria-label="${mapLabel(map)} discovery map">${zones.map(zone => {
            const entry = visited.find(area => area.key === zone.key), current = map === currentMap && debugInfo.district === zone.key;
            return `<li class="${entry ? 'visited' : ''} ${current ? 'current-area' : ''}" aria-label="${entry?escapeHTML(entry.label):'Unexplored area'}" ${current ? 'aria-current="location"' : ''}><span>${entry ? escapeHTML(mapShortNames[zone.key]||entry.label) : 'Unknown'}</span>${current ? '<small>You are here</small>' : ''}</li>`;
        }).join('')}</ol>`;
    }).join('') + '<p>Bus stops connect the center neighborhoods. The subway links Allston and the suburbs. Find a stop to choose among places you have discovered.</p><button type="button" data-safe-return>Return to last safe spot</button><p class="phone-help">Keeps your discoveries and restores your last safe position.</p>';
};

const visibleFocusTargets = root => [...root.querySelectorAll('button, input, select, audio, [tabindex]')]
    .filter(element => !element.disabled && element.tabIndex >= 0 && !element.closest('[hidden]') && element.getClientRects().length);
const trapFocus = (event, root) => {
    if (event.key !== 'Tab') return;
    const elements = visibleFocusTargets(root), first = elements[0], last = elements.at(-1);
    if (!first) { event.preventDefault(); root.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
};
const closeTransitChooser = () => {
    if (!transitUI) return;
    transitUI.remove(); transitUI = null; transitContentKey = '';
    document.dispatchEvent(new Event('game-modal-change'));
    if (transitPreviousFocus?.isConnected) transitPreviousFocus.focus();
};
const renderTransitChooser = map => {
    if (!transitUI) return;
    const visited = getAdventureState().visited[map];
    const key = JSON.stringify([map, visited]);
    if (key === transitContentKey) return;
    transitContentKey = key;
    const destinations = transitUI.querySelector('.transit-destinations');
    destinations.innerHTML = visited.length
        ? visited.map(area => `<button type="button" data-travel-area="${escapeHTML(area.key)}">${escapeHTML(area.label)}</button>`).join('')
        : '<p>Explore a neighborhood to add it to your route.</p>';
};
export const openTransitChooser = map => {
    if (!['suburban', 'city'].includes(map) || isPhoneOpen || hasActiveConversation() || getStoryModalOpen()) return false;
    if (transitUI) return true;
    transitPreviousFocus = document.activeElement;
    transitUI = document.createElement('div'); transitUI.id = 'transit-chooser'; transitUI.className = 'game-modal'; transitUI.dataset.map = map;
    transitUI.setAttribute('role', 'dialog'); transitUI.setAttribute('aria-modal', 'true'); transitUI.setAttribute('aria-labelledby', 'transit-title');
    transitUI.innerHTML = `<section class="game-modal-card"><h2 id="transit-title">${mapLabel(map)} bus routes</h2><p>Choose a neighborhood you have discovered.</p><div class="transit-destinations"></div><button type="button" data-transit-cancel>Keep exploring here</button></section>`;
    transitUI.addEventListener('click', event => {
        if (event.target.closest('[data-transit-cancel]')) { closeTransitChooser(); return; }
        const button = event.target.closest('[data-travel-area]');
        if (!button) return;
        const key = button.dataset.travelArea;
        if (!getAdventureState().visited[map].some(area => area.key === key)) return;
        closeTransitChooser();
        document.dispatchEvent(new CustomEvent('game-travel', { detail: { map, key } }));
    });
    transitUI.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeTransitChooser(); }
        else trapFocus(event, transitUI);
    });
    document.body.append(transitUI); renderTransitChooser(map);
    document.dispatchEvent(new Event('game-modal-change'));
    transitUI.querySelector('button').focus();
    return true;
};

// Create retro flip phone UI
// options.mobileLayout: if true, phone button is top-center (avoids overlap with joysticks)
export const initializePhoneUI = (options = {}) => {
    const isMobileLayout = options.mobileLayout === true;
    // Create phone container
    phoneUI = document.createElement('div');
    phoneUI.id = 'phone-ui';
    phoneUI.setAttribute('role', 'dialog');
    phoneUI.setAttribute('aria-modal', 'true');
    phoneUI.setAttribute('aria-label', 'Phone: discoveries and soundtrack');
    phoneUI.setAttribute('aria-hidden', 'true');
    phoneUI.inert = true;
    phoneUI.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        width: 400px;
        height: 600px;
        background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
        border-radius: 20px;
        border: 8px solid #0a0a0a;
        box-shadow: 
            0 0 0 4px #3a3a3a,
            0 20px 40px rgba(0, 0, 0, 0.8),
            inset 0 2px 4px rgba(255, 255, 255, 0.1);
        z-index: 2000;
        display: flex;
        flex-direction: column;
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        pointer-events: none;
        font-family: 'Courier New', monospace;
    `;
    
    // Create screen bezel
    const screenBezel = document.createElement('div');
    screenBezel.style.cssText = `
        flex: 1;
        margin: 20px;
        background: #000;
        border-radius: 8px;
        border: 4px solid #1a1a1a;
        box-shadow: 
            inset 0 0 20px rgba(0, 0, 0, 0.8),
            0 0 0 2px #3a3a3a;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    
    // Create screen header
    const screenHeader = document.createElement('div');
    screenHeader.style.cssText = `
        background: linear-gradient(to bottom, #1a1a1a, #0a0a0a);
        padding: 12px;
        border-bottom: 2px solid #3a3a3a;
        text-align: center;
        color: #88FFE6;
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    `;
    screenHeader.textContent = 'SUBURBAN ADVENTURE';
    screenBezel.appendChild(screenHeader);
    phoneTabs = document.createElement('div');
    phoneTabs.className = 'phone-tabs'; phoneTabs.setAttribute('role', 'tablist'); phoneTabs.setAttribute('aria-label', 'Phone applications');
    for (const [key, label] of [['journal', 'Journal'], ['map', 'Map'], ['music', 'Music'], ['settings', 'Settings']]) {
        const tab = document.createElement('button');
        tab.type = 'button'; tab.textContent = label; tab.dataset.tab = key;
        tab.id = `phone-tab-${key}`; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', `phone-panel-${key}`);
        tab.addEventListener('click', () => showPhoneTab(key)); phoneTabs.append(tab);
    }
    phoneTabs.addEventListener('keydown', event => {
        const tabs = [...phoneTabs.querySelectorAll('[role="tab"]')], index = tabs.indexOf(event.target);
        if (index < 0) return;
        const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
        if (next >= 0) { event.preventDefault(); showPhoneTab(tabs[next].dataset.tab, true); }
    });
    screenBezel.append(phoneTabs);
    
    // Create scrollable content area
    const contentArea = document.createElement('div');
    contentArea.id = 'phone-content';
    contentArea.tabIndex = 0;
    contentArea.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        color: #CCFFFF;
        font-size: 12px;
        line-height: 1.6;
    `;
    
    notesPanel = document.createElement('section'); notesPanel.id = 'phone-panel-journal';
    mapPanel = document.createElement('section'); mapPanel.id = 'phone-panel-map';
    settingsPanel = document.createElement('section'); settingsPanel.id = 'phone-panel-settings';
    for (const [panel, name] of [[notesPanel, 'journal'], [mapPanel, 'map'], [settingsPanel, 'settings']]) {
        panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', `phone-tab-${name}`);
    }
    mapPanel.addEventListener('click', event => {
        if (!event.target.closest('[data-safe-return]')) return;
        togglePhone(); document.dispatchEvent(new Event('game-return-safe'));
    });
    settingsPanel.innerHTML = `<h3>Make yourself comfortable</h3>
        ${[['brightness', 'Scene brightness', .7, 1.6], ['textScale', 'Text size', 1, 1.5], ['sensitivity', 'Look sensitivity', .5, 2]].map(([key, label, min, max]) => `<label class="phone-setting" for="setting-${key}"><span>${label}<output data-setting-output="${key}" for="setting-${key}"></output></span><input id="setting-${key}" data-setting="${key}" type="range" min="${min}" max="${max}" step=".05"></label>`).join('')}
        <label class="phone-check"><input type="checkbox" data-setting="ambience"> Landmark sounds</label>
        <p class="phone-help">Quiet, directional sounds help you find the carnival, pond, and subway.</p>
        <label class="phone-check"><input type="checkbox" data-setting="developerMode"> Free movement and map switching (testing)</label>
        <p class="phone-help">1–9 jumps between areas. Testing mode also enables T map changes and Q/E free movement.</p>
        <h4>Controls</h4><p>Keyboard: WASD or arrow keys to move, drag the scene to look, Shift to run, Space to interact, F for your phone. Escape closes a conversation or menu.</p>
        <p>Touch: left stick to move, right stick to look, RUN to toggle running. The center button changes to TALK, INSPECT, ENTER, or TRAVEL when something is nearby.</p>
        <p>Music keeps playing when you close your phone. Use the Music tab to pause it.</p>
        <button type="button" data-safe-return>Return to last safe spot</button><p class="phone-help">Keeps your discoveries and restores your last safe position.</p>`;
    settingsPanel.addEventListener('input', event => {
        const input = event.target.closest('[data-setting]');
        if (input) setAdventureSettings({ [input.dataset.setting]: input.type === 'checkbox' ? input.checked : Number(input.value) });
    });
    settingsPanel.addEventListener('click', event => {
        if (event.target.closest('[data-safe-return]')) { togglePhone(); document.dispatchEvent(new Event('game-return-safe')); }
    });
    contentArea.append(notesPanel, mapPanel);
    journal = document.createElement('div'); journal.id = 'phone-panel-music';
    journal.setAttribute('role', 'tabpanel'); journal.setAttribute('aria-labelledby', 'phone-tab-music');
    contentArea.append(journal);
    const soundtrack = document.createElement('section');
    soundtrackPanel = soundtrack;
    nowPlaying = document.createElement('p');
    nowPlaying.setAttribute('aria-live', 'polite');
    nowPlaying.textContent = 'Discover a song, then tap it to listen.';
    audioPlayer = document.createElement('audio');
    audioPlayer.controls = true;
    audioPlayer.preload = 'none';
    audioPlayer.style.width = '100%';
    audioPlayer.setAttribute('aria-label', 'Discovered song player');
    document.addEventListener('story-performance-start', () => { audioPlayer.pause(); syncPlaybackButtons(); });
    soundtrack.append(nowPlaying, audioPlayer);
    contentArea.append(soundtrack);
    contentArea.append(settingsPanel);
    showPhoneTab(activeTab);
    const syncPlayback = () => {
        if (selectedSong) nowPlaying.textContent = `${audioPlayer.paused ? 'Paused' : 'Playing'}: ${selectedSong}`;
        journal.querySelectorAll('[data-song]').forEach(button => {
            const active = button.dataset.song === selectedSong && !audioPlayer.paused;
            button.setAttribute('aria-pressed', String(active));
            button.setAttribute('aria-label',`${active?'Pause':'Play'} ${button.dataset.song}`);
            button.querySelector('.song-play-state').textContent = active ? 'PAUSE' : 'PLAY';
        });
    };
    for (const event of ['play', 'pause', 'ended']) audioPlayer.addEventListener(event, syncPlayback);
    audioPlayer.addEventListener('error', () => {
        nowPlaying.textContent = 'This recording could not play. Tap the song to retry.';
        syncPlaybackButtons();
    });
    journal.addEventListener('click', async event => {
        const button = event.target.closest('[data-song]');
        if (!button) return;
        const title = button.dataset.song;
        if (!getUnlockedSongs().some(song => song.name === title)) return;
        const recording = getRecording(title);
        if (!recording) return;
        const same = selectedSong === title;
        if (same && !audioPlayer.paused) { audioPlayer.pause(); return; }
        selectedSong = title;
        const url = getRecordingURL(recording);
        if (!same || audioPlayer.src !== url || audioPlayer.error) { audioPlayer.src = url; audioPlayer.load(); }
        try { await audioPlayer.play(); }
        catch {
            if (selectedSong !== title) return;
            nowPlaying.textContent = 'Tap the song again to start playback.';
            syncPlaybackButtons();
            return;
        }
        if (selectedSong === title) syncPlayback();
    });

    // Custom scrollbar styling
    contentArea.style.scrollbarWidth = 'thin';
    contentArea.style.scrollbarColor = '#3a3a3a #1a1a1a';
    
    // Webkit scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
        #phone-content::-webkit-scrollbar {
            width: 8px;
        }
        #phone-content::-webkit-scrollbar-track {
            background: #1a1a1a;
        }
        #phone-content::-webkit-scrollbar-thumb {
            background: #3a3a3a;
            border-radius: 4px;
        }
        #phone-content::-webkit-scrollbar-thumb:hover {
            background: #4a4a4a;
        }
    `;
    document.head.appendChild(style);
    
    screenBezel.appendChild(contentArea);
    phoneUI.appendChild(screenBezel);
    
    // Create button area (bottom of phone)
    const buttonArea = document.createElement('div');
    buttonArea.style.cssText = `
        padding: 16px;
        display: flex;
        justify-content: center;
        gap: 12px;
        border-top: 2px solid #3a3a3a;
        background: linear-gradient(to top, #1a1a1a, #0a0a0a);
    `;
    
    // Create reset button (styled as retro phone button)
    const resetButton = document.createElement('button');
    resetButton.textContent = 'RESET';
    resetButton.style.cssText = `
        padding: 12px 24px;
        background: linear-gradient(to bottom, #4a2a2a, #3a1a1a);
        border: 2px solid #2a1a1a;
        border-radius: 8px;
        color: #FF8888;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.5),
            inset 0 1px 2px rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
    `;
    
    resetButton.addEventListener('mouseenter', () => {
        resetButton.style.background = 'linear-gradient(to bottom, #5a3a3a, #4a2a2a)';
        resetButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.15)';
    });
    
    resetButton.addEventListener('mouseleave', () => {
        resetButton.style.background = 'linear-gradient(to bottom, #4a2a2a, #3a1a1a)';
        resetButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.1)';
    });
    
    resetButton.addEventListener('click', () => {
        // Confirm reset action
        if (confirm('Reset discoveries, songs, visits and story progress? This cannot be undone. Your comfort settings will stay.')) {
            resetGameProgress();
            resetAdventureProgress();
            updatePhoneContent();
            // Remove focus to prevent space bar from triggering the button
            resetButton.blur();
        }
    });
    
    // Create close button (styled as retro phone button)
    const closeButton = document.createElement('button');
    closeButton.textContent = 'CLOSE';
    closeButton.style.cssText = `
        padding: 12px 24px;
        background: linear-gradient(to bottom, #3a3a3a, #2a2a2a);
        border: 2px solid #1a1a1a;
        border-radius: 8px;
        color: #88FFE6;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.5),
            inset 0 1px 2px rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'linear-gradient(to bottom, #4a4a4a, #3a3a3a)';
        closeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.15)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'linear-gradient(to bottom, #3a3a3a, #2a2a2a)';
        closeButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.1)';
    });
    
    closeButton.addEventListener('click', () => {
        togglePhone();
        // Remove focus to prevent space bar from triggering the button
        closeButton.blur();
    });
    
    buttonArea.appendChild(resetButton);
    buttonArea.appendChild(closeButton);
    phoneUI.appendChild(buttonArea);
    
    document.body.appendChild(phoneUI);
    
    // Create on-screen toggle button (bottom-right corner)
    phoneButton = document.createElement('button');
    phoneButton.id = 'phone-toggle-button';
    phoneButton.setAttribute('aria-label', 'Open phone');
    phoneButton.setAttribute('aria-expanded', 'false');
    // Create phone outline SVG icon (48x48) - invisible by default, flashes color when song/item gained
    phoneButton.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 32 32" style="stroke: #88FFE6; fill: none; stroke-width: 2; transition: stroke 0.4s ease;">
            <rect x="8" y="4" width="16" height="24" rx="2" ry="2"/>
            <rect x="12" y="6" width="8" height="1" rx="0.5"/>
            <circle cx="16" cy="24" r="1.5"/>
        </svg>
    `;
    phoneButton.style.cssText = isMobileLayout
        ? `
        position: fixed;
        top: max(20px, env(safe-area-inset-top));
        left: 50%;
        transform: translateX(-50%);
        width: 48px;
        height: 48px;
        background: transparent;
        border: none;
        cursor: pointer;
        z-index: 1500;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        padding: 0;
    `
        : `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        background: transparent;
        border: none;
        cursor: pointer;
        z-index: 1500;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        padding: 0;
    `;
    
    phoneButton.addEventListener('mouseenter', () => {

        phoneButton.style.opacity = '0.8';
    });
    
    phoneButton.addEventListener('mouseleave', () => {

        phoneButton.style.opacity = '1';
    });
    
    phoneButton.addEventListener('click', () => {
        togglePhone();
        // Remove focus to prevent space bar from triggering the button
        phoneButton.blur();
    });
    
    document.body.appendChild(phoneButton);
    applySettings();
    subscribeAdventure(() => {
        applySettings();
        if (isPhoneOpen) updatePhoneContent();
        if (transitUI) renderTransitChooser(transitUI.dataset.map);
    });
    
    // Retry catalog loading if startup could not fetch it.
    loadMusicCatalog().then(updatePhoneContent).catch(() => { nowPlaying.textContent = 'Recordings unavailable. Reopen the phone to retry.'; });
    updatePhoneContent();
};

const syncPlaybackButtons = () => {
    journal?.querySelectorAll('[data-song]').forEach(button => {
        const active = button.dataset.song === selectedSong && !audioPlayer.paused && !audioPlayer.error;
        button.setAttribute('aria-pressed', String(active));
            button.setAttribute('aria-label',`${active?'Pause':'Play'} ${button.dataset.song}`);
        button.querySelector('.song-play-state').textContent = active ? 'PAUSE' : 'PLAY';
    });
};

// Update phone content with current songs and items
const updatePhoneContent = () => {
    if (!phoneUI) return;
    
    const contentArea = phoneUI.querySelector('#phone-content');
    if (!contentArea) return;
    
    const songs = getUnlockedSongs();
    const items = getEncounteredItems();
    renderAdventureContent(items);
    if (selectedSong && !songs.some(song => song.name === selectedSong)) {
        audioPlayer.pause();
        audioPlayer.removeAttribute('src');
        audioPlayer.load();
        selectedSong = null;
        nowPlaying.textContent = 'Discover a song, then tap it to listen.';
    }
    const key = JSON.stringify([songs.map(song => ({ ...song, recording: getRecording(song.name) })), items, debugInfo.scene]);
    if (key === lastContentKey) return;
    lastContentKey = key;
    
    let html = '';
    
    html += '<p>Tap a discovered song to play it. Music keeps playing while you explore.</p>';
    html += '<h3>Discovered songs</h3>';
    // Songs Section
    html += '<div style="margin-bottom: 24px;">';
    
    if (songs.length === 0) {
        html += '<p>No discoveries yet. Meet a neighbor or inspect an object to begin.</p>';
    } else {
        songs.forEach(song => {
            const recording = getRecording(song.name);
            if (recording) {
                html += `<button class="song-row" data-song="${escapeHTML(song.name)}" aria-pressed="false" aria-label="Play ${escapeHTML(song.name)}"><span>${escapeHTML(song.name)}<small>Discovered through ${escapeHTML(song.unlockedBy)}</small></span><span class="song-play-state">PLAY</span></button>`;
            } else {
                html += `<div class="song-row"><span>${escapeHTML(song.name)}<small>Recording unavailable</small></span></div>`;
            }
        });
    }
    
    html += '</div>';
    
    const scroll = contentArea.scrollTop;
    journal.innerHTML = html;
    contentArea.scrollTop = scroll;
    syncPlaybackButtons();
};

// Update debug info in phone UI
export const updatePhoneDebugInfo = (info) => {
    debugInfo = { ...debugInfo, ...info };
    // Only update content if phone is open (for performance)
    if (isPhoneOpen && phoneUI) {
        updatePhoneContent();
    }
};

// Get current debug info (for initial display)
export const getDebugInfo = () => {
    return { ...debugInfo };
};

// Toggle phone open/close
export const togglePhone = () => {
    // Don't open phone during active conversations
    if (!isPhoneOpen && (hasActiveConversation() || transitUI || getStoryModalOpen())) {
        return;
    }
    
    clearTimeout(closeTimer);
    isPhoneOpen = !isPhoneOpen;
    phoneUI.setAttribute('aria-hidden', String(!isPhoneOpen));
    phoneUI.inert = !isPhoneOpen;
    phoneButton.setAttribute('aria-expanded', String(isPhoneOpen));
    document.dispatchEvent(new Event('game-modal-change'));
    
    if (isPhoneOpen) {
        loadMusicCatalog().then(updatePhoneContent).catch(() => { nowPlaying.textContent = 'Recordings unavailable. Reopen the phone to retry.'; });
        previousFocus = document.activeElement;
        phoneTabs.querySelector('[aria-selected="true"]').focus();
        // Exit pointer lock to free the cursor
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Update content after opening (to ensure latest debug info is shown)
        updatePhoneContent();
        
        // Open phone
        phoneUI.style.pointerEvents = 'auto';
        phoneUI.style.transform = 'translate(-50%, -50%) scale(1)';
        phoneUI.style.opacity = '1';
        
        // Hide toggle button when phone is open
        if (phoneButton) {
            phoneButton.style.opacity = '0.5';
            phoneButton.style.pointerEvents = 'none';
        }
    } else {
        // Close phone
        phoneUI.style.transform = 'translate(-50%, -50%) scale(0)';
        phoneUI.style.opacity = '0';
        
        // Use setTimeout to disable pointer events after animation
        previousFocus?.focus();
        closeTimer = setTimeout(() => {
            if (!isPhoneOpen) phoneUI.style.pointerEvents = 'none';
        }, 300);
        
        // Show toggle button when phone is closed
        if (phoneButton) {
            phoneButton.style.opacity = '1';
            phoneButton.style.pointerEvents = 'auto';
        }
    }
};

// Initialize keyboard handler for 'f' key
export const initializePhoneKeyboard = () => {
    document.addEventListener('keydown', (event) => {
        // Only handle 'f' key
        if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key === 'Escape' && isPhoneOpen) { togglePhone(); return; }
        if (event.key === 'Tab' && isPhoneOpen) trapFocus(event, phoneUI);
        if (event.key === 'f' || event.key === 'F') {
            // Don't toggle if typing in an input field
            if (event.target.closest?.('input, textarea, select, [contenteditable]')) {
                return;
            }
            
            event.preventDefault();
            togglePhone();
        }
    });
};

// Export function to check if phone is open
export const getPhoneOpenState = () => {
    return isPhoneOpen || !!transitUI;
};

let glowTimeout = null;

// Hex to #RRGGBB string (hex is number e.g. 0xFF6B9D)
const hexToCSS = (hex) => {
    return '#' + (typeof hex === 'number' ? hex : 0xFF6B9D).toString(16).padStart(6, '0');
};

// Flash phone icon with color when song/item is gained (color = NPC/container hex)
// Icon is invisible by default; it appears in the given color, then fades back to invisible
export const triggerPhoneGlow = (colorHex) => {
    if (!phoneButton) return;

    const svg = phoneButton.querySelector('svg');
    if (!svg) return;

    if (glowTimeout) {
        clearTimeout(glowTimeout);
        glowTimeout = null;
    }

    const color = hexToCSS(typeof colorHex === 'number' ? colorHex : 0xFF6B9D);
    svg.style.stroke = color;

    glowTimeout = setTimeout(() => {
        svg.style.stroke = '#88FFE6';
        glowTimeout = null;
    }, 2500);
};

