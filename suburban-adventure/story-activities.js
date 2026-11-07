import { getAdventureState, startCompilation, addContribution, completeShow, solveMystery, earnSouvenir, rememberDiscovery } from './adventure-state.js';
import { unlockSong } from './dialogue.js';
import { getRecording, getRecordingURL, loadMusicCatalog } from './music-library.js';
import { openStoryModal, storyText, storyButton } from './story-ui.js';

export const MYSTERY_CLUES = [
    { id: 'forest-timetable', name: 'Timetable Without a Route', note: 'D', order: 'first', text: 'Under the identical departure times, someone has penciled: FIRST — D. A small drawing shows a piano in a house behind a winding path.' },
    { id: 'forest-invitation', name: 'Sealed Invitation', note: 'A', order: 'second', text: 'The wax seal has loosened. Inside: SECOND — A. Below it, in smaller writing: Bring no guest. The house already has enough.' },
    { id: 'forest-plinth', name: 'Weathered Plinth', note: 'E', order: 'third', text: 'Beneath the pale square is a shallow inscription: THIRD — E. LET THE EMPTY ROOM ANSWER. The stone is warm.' }
];
export const ringAimAt = elapsed => .5 + .43 * Math.sin(elapsed * Math.PI * 2 / 2600);
export const scoreRingThrow = position => Number.isFinite(position) && Math.abs(position - .5) <= .13 ? 1 : 0;
export const hasMysteryClues = state => MYSTERY_CLUES.every(clue => state.discoveries.some(entry => entry.id === clue.id));
export const isMysteryMelody = notes => Array.isArray(notes) && notes.join(',') === 'D,A,E';
export const validSetlist = (ids, contributions) => Array.isArray(ids) && ids.length === 3 && new Set(ids).size === 3 && ids.every(id => contributions.some(entry => entry.id === id));

function openRingToss() {
    openStoryModal('Three rings, one lucky peg', body => {
        storyText(body, 'Time your throw when the ring crosses the gold peg. Land one of your three rings to win a tiny midnight bear.');
        const board = document.createElement('div');
        board.setAttribute('role', 'img'); board.setAttribute('aria-label', 'Moving ring above a gold target in the center.');
        board.style.cssText = 'position:relative;height:140px;margin:20px 0;border:1px solid #77998e;border-radius:12px;background:linear-gradient(#263e45,#15262a);overflow:hidden;';
        const zone = document.createElement('div'); zone.style.cssText = 'position:absolute;left:37%;width:26%;top:0;bottom:0;background:#f6cb5b1a;border-left:1px dashed #c4ad6d;border-right:1px dashed #c4ad6d;'; board.append(zone);
        for (const x of [18, 34, 50, 66, 82]) {
            const peg = document.createElement('span'); peg.style.cssText = `position:absolute;left:${x}%;bottom:22px;width:10px;height:${x === 50 ? 50 : 32}px;transform:translateX(-50%);border-radius:6px;background:${x === 50 ? '#ffdc7c' : '#708f8b'};`; board.append(peg);
        }
        const ring = document.createElement('div'); ring.style.cssText = 'position:absolute;top:24px;width:30px;height:14px;border:4px solid #fff0c4;border-radius:50%;transform:translateX(-50%);'; board.append(ring); body.append(board);
        const status = storyText(body, 'Three rings left. Aim for the center.'); status.setAttribute('role', 'status');
        let thrown = 0, hits = 0, currentAim = .5, frame, start = performance.now();
        const toss = storyButton('Toss ring', () => {
            if (thrown === 3) { thrown = hits = 0; start = performance.now(); toss.textContent = 'Toss ring'; status.textContent = 'Three fresh rings. Find your rhythm.'; return; }
            const hit = scoreRingThrow(currentAim); hits += hit; thrown++;
            status.textContent = `${hit ? 'Clink! Right around the peg.' : 'The ring bounces off the board.'} ${3 - thrown} rings left. ${hits} landed.`;
            if (thrown === 3) {
                toss.textContent = 'Play again';
                if (hits) {
                    earnSouvenir('midnight-bear', 'Tiny Midnight Bear');
                    rememberDiscovery({ id: 'ring-toss-prize', name: 'Tiny Midnight Bear', text: 'Won at the carnival ring toss. One crooked stitched eye, one very good night.', map: 'suburban', area: 'Carnival' });
                    status.textContent = `${hits} of 3! The attendant hands you a tiny midnight bear. It is saved with your souvenirs. You can play again whenever you like.`;
                } else status.textContent = 'No luck this round. The gold peg is inside the pale band; try releasing a little earlier. Another three rings are free.';
            }
        }); body.append(toss);
        const animate = now => { if (thrown < 3) { currentAim = ringAimAt(now - start); ring.style.left = currentAim * 100 + '%'; } frame = requestAnimationFrame(animate); }; frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    });
}

function openClue(clue) {
    rememberDiscovery({ id: clue.id, name: clue.name, text: clue.text, map: 'suburban', area: 'Forest clearings' });
    openStoryModal(clue.name, body => {
        storyText(body, clue.text);
        const found = MYSTERY_CLUES.filter(entry => getAdventureState().discoveries.some(discovery => discovery.id === entry.id));
        storyText(body, `${found.length} of 3 piano clues copied to your phone.`, 'color:#ffdc9d');
        storyText(body, found.length === 3 ? 'The three notes point to the music salon in the northeast mansion. Follow the winding path from the north road.' : 'The other clues are in the stranded bus shelter, the garden-party invitation, and the stone circle in these woods.');
    });
}

function openPiano() {
    openStoryModal('The music salon', body => {
        const state = getAdventureState();
        if (state.mystery.solved) { storyText(body, 'The room is quiet again. The Room Between is saved on your phone, a recording of a place that should have been empty.'); return; }
        if (!hasMysteryClues(state)) {
            storyText(body, 'Three ivory keys have faint marks. The piano seems to be waiting for a particular order.');
            storyText(body, 'Morgan mentioned three clues in the southeast forest clearings: a timetable, a sealed invitation, and a weathered plinth. Copy all three to your phone first.'); return;
        }
        storyText(body, 'Your notes read: FIRST — D. SECOND — A. THIRD — E. Play them, and let the empty room answer.');
        let notes = [], context;
        const status = storyText(body, 'The candles lean toward the piano.'); status.setAttribute('role', 'status');
        const keys = document.createElement('div'); keys.style.cssText = 'display:flex;gap:12px;margin:18px 0;'; body.append(keys);
        const playNote = note => {
            if (getAdventureState().mystery.solved) return;
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                context ||= new AudioContext(); void context.resume();
                const oscillator = context.createOscillator(), gain = context.createGain();
                oscillator.type = 'sine'; oscillator.frequency.value = { D: 293.66, A: 440, E: 329.63 }[note];
                gain.gain.setValueAtTime(.16, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .9);
                oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .9);
            } catch { /* The visible sequence remains playable without audio support. */ }
            notes.push(note); status.textContent = notes.join(' · ');
            if (notes.length !== 3) return;
            if (!isMysteryMelody(notes)) { notes = []; status.textContent = 'An ordinary chord. The room keeps waiting. Try the order written in your notes.'; return; }
            solveMystery(); unlockSong('The Room Between', 'The mansion piano'); addContribution('The Room Between', 'The Room Between', 'The mansion piano');
            rememberDiscovery({ id: 'mansion-answer', name: 'The Room Between', text: 'D, A, E. A fourth note answered from beyond the wall, and the phone recorded a whole room full of people who were not there.', map: 'suburban', area: 'Mansion music salon' });
            status.textContent = 'A fourth note answers from beyond the wall. For a moment, the empty room is full of voices. New recording: The Room Between. It is on your phone and can join the compilation.';
            keys.querySelectorAll('button').forEach(button => { button.disabled = true; });
        };
        for (const note of ['D', 'A', 'E']) { const key = storyButton(note, () => playNote(note)); key.style.cssText += 'flex:1;min-height:92px;color:#202c2a;background:#f0e5c6;font-size:24px;'; keys.append(key); }
        body.addEventListener('keydown', event => { const note = event.key.toUpperCase(); if (['D', 'A', 'E'].includes(note) && !event.repeat) { event.preventDefault(); playNote(note); } });
        return () => { if (context) void context.close(); };
    });
}

function openCompilation() {
    startCompilation();
    openStoryModal('One more night at the plaza', (body, close) => {
        const state = getAdventureState(), contributions = state.story.contributions;
        storyText(body, state.story.completed ? 'The first show is on tape. You can make another mix with any three contributions.' : 'No grand plan, no perfect ending. Just the people who made this place home, in the same room one more time. Choose three contributions in the order you want to hear them.');
        if (contributions.length < 3) { storyText(body, `You have ${contributions.length} of the 3 contributions needed. Maya and the shopkeepers have tracks. Allston neighbors and the people by the pond have their own sounds to share.`); return; }
        let selected = [], audio, interval, step = 0, alive = true, playback = 0;
        const choices = document.createElement('div'); choices.style.cssText = 'display:grid;gap:8px;'; body.append(choices);
        const status = storyText(body, 'Choose three voices for tonight.'); status.setAttribute('role', 'status');
        const rows = contributions.map(entry => {
            const button = storyButton(entry.label + ' — ' + entry.source, () => {
                selected = selected.includes(entry.id) ? selected.filter(id => id !== entry.id) : selected.length < 3 ? [...selected, entry.id] : selected;
                rows.forEach(row => { const index = selected.indexOf(row.entry.id); row.button.setAttribute('aria-pressed', String(index >= 0)); row.button.style.background = index >= 0 ? '#42645c' : '#223b3e'; row.button.textContent = `${index >= 0 ? index + 1 + '. ' : ''}${row.entry.label} — ${row.entry.source}`; });
                begin.disabled = selected.length !== 3; status.textContent = `${selected.length} of 3 selected. Tap a selection again to remove it.`;
            }); button.setAttribute('aria-pressed', 'false'); choices.append(button); return { entry, button };
        });
        const finish = () => {
            if (!alive) return;
            playback++;
            clearInterval(interval); audio?.pause();
            completeShow(selected); unlockSong('Plaza Finale', 'The neighborhood'); earnSouvenir('plaza-show-tape', 'The Plaza Show Tape');
            choices.replaceChildren(); begin.remove(); close.textContent = 'Back into the night';
            status.textContent = 'The last note hangs above the room. Someone starts clapping, then everyone. The plaza is still here tonight. Nobody knows what happens next, but its people made something that can travel with them.';
            storyText(body, 'Plaza Finale and your chosen setlist are saved on your phone. Your neighbors have something new to say.', 'color:#ffdc9d');
        };
        const next = async () => {
            const token = ++playback;
            clearInterval(interval); audio?.pause();
            if (step >= selected.length) { finish(); return; }
            const entry = contributions.find(item => item.id === selected[step]); step++;
            status.textContent = `${step} / 3 — ${entry.label}. ${['The room grows quiet. A voice from the neighborhood fills the speakers.', 'Someone near the back starts singing along. Friends pull their chairs closer.', 'Every borrowed sound belongs in the room now. Nobody reaches for the door.'][step - 1]}`;
            begin.textContent = step === 3 ? 'Keep this take · finish the show' : 'Bring in the next voice';
            try {
                await loadMusicCatalog(); if (!alive || token !== playback) return;
                const recording = getRecording(entry.id);
                if (recording) {
                    const excerpt = new Audio(getRecordingURL(recording)); audio = excerpt; excerpt.volume = .65;
                    await excerpt.play();
                    if (!alive || token !== playback) { excerpt.pause(); return; }
                }
            } catch { /* Text and manual progression keep the show available if sound cannot play. */ }
            if (!alive || token !== playback) return;
            let remaining = 9; interval = setInterval(() => { remaining--; if (remaining <= 0) void next(); }, 1000);
        };
        const begin = storyButton('Play this set', () => {
            if (step) { void next(); return; }
            if (!validSetlist(selected, contributions)) return;
            choices.hidden = true; document.dispatchEvent(new Event('story-performance-start')); void next();
        }); begin.disabled = true; begin.style.marginTop = '16px'; body.append(begin);
        return () => { alive = false; playback++; clearInterval(interval); if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); } };
    });
}

export function handleStoryInteraction(item) {
    const name = item?.userData?.name;
    if (item?.userData?.storyActivity === 'compilation') { openCompilation(); return true; }
    if (name === 'Ring Toss') { openRingToss(); return true; }
    const clue = MYSTERY_CLUES.find(entry => entry.name === name);
    if (clue) { openClue(clue); return true; }
    if (name === 'Music salon') { openPiano(); return true; }
    return false;
}

export function createStoryWorldItems(THREE, scene, context) {
    const items = [];
    if (context.map !== 'suburban' || context.sceneKey.endsWith('_INTERIOR')) return items;
    const group = new THREE.Group(); group.name = 'CompilationStageDeck'; group.position.set(2, 1.1, -12.5);
    const mat = color => new THREE.MeshBasicMaterial({ color, wireframe: true });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.8, .55, .9), mat(0x9ce5c9)); group.add(deck);
    for (const x of [-.45, .45]) { const reel = new THREE.Mesh(new THREE.TorusGeometry(.22, .035, 5, 14), mat(0xffd78b)); reel.position.set(x, .04, .47); group.add(reel); }
    for (const x of [-1.35, 1.35]) { const speaker = new THREE.Mesh(new THREE.BoxGeometry(.65, 1.4, .6), mat(0x96b7d4)); speaker.position.set(x, .15, 0); group.add(speaker); }
    group.userData = { isInteractive: true, name: 'Neighborhood Compilation Deck', storyActivity: 'compilation', flavorText: 'Choose three neighborhood contributions and play one more show at the plaza.' };
    scene.add(group); items.push(group); return items;
}
