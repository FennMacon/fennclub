import { CARNIVAL_CONFIG } from './world/config.js';
import { SUBWAY_POSITIONS, UNIFIED_MAP_ZONE_OFFSETS } from './scenes.js';

// Horizontal distance and the camera's right vector keep cues useful while looking up.
export function landmarkMix(listener, target, yaw = 0, radius = 100) {
    if (!listener || !target || ![listener.x, listener.z, target.x, target.z, yaw, radius].every(Number.isFinite) || radius <= 0) return { gain: 0, pan: 0 };
    const dx = target.x - listener.x, dz = target.z - listener.z, distance = Math.hypot(dx, dz);
    const gain = Math.max(0, 1 - distance / radius) ** 2;
    const pan = distance > .01 ? Math.max(-1, Math.min(1, (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / distance)) : 0;
    return { gain, pan };
}

let context = null, master = null, voices = [], muted = true, lastUpdate = -Infinity, resumePending = null;
const resumeContext = () => {
    if (!context) return Promise.resolve(false);
    if (!resumePending) {
        const current = context;
        resumePending = current.resume().then(() => true, () => false).finally(() => { if (context === current) resumePending = null; });
    }
    return resumePending;
};
const setTarget = (parameter, value, smoothing = .15) => { if (parameter && context) parameter.setTargetAtTime(value, context.currentTime, smoothing); };
const uiBlocked = () => typeof document !== 'undefined' && (
    document.hidden || document.querySelector('dialog[open],#transit-chooser,#phone-ui[aria-hidden="false"]') ||
    [...document.querySelectorAll('audio,video')].some(media => !media.paused && !media.ended)
);

function makeVoice(kind) {
    const gain = context.createGain(); gain.gain.value = 0;
    const pan = context.createStereoPanner?.();
    gain.connect(pan || master); if (pan) pan.connect(master);
    let source;
    if (kind === 'pond') {
        source = context.createBufferSource();
        const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate), data = buffer.getChannelData(0);
        let seed = 431;
        for (let i = 0; i < data.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
        source.buffer = buffer; source.loop = true;
        const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600; filter.Q.value = .5;
        source.connect(filter); filter.connect(gain);
        source.start(); return { kind, source, gain, pan, filter };
    }
    source = context.createOscillator(); source.type = kind === 'carnival' ? 'triangle' : 'sine';
    source.frequency.value = kind === 'carnival' ? 261.63 : 392;
    source.connect(gain); source.start(); return { kind, source, gain, pan };
}

// Call only from the Start button, a scene gesture, or the explicit sound toggle.
// Importing this module and updating the world never construct an AudioContext.
export async function beginLandmarkAudio() {
    if (typeof window === 'undefined') return false;
    if (!context && navigator.userActivation && !navigator.userActivation.isActive) return false;
    try {
        if (!context || context.state === 'closed') {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return false;
            context = new AudioContext(); master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
            voices = ['carnival', 'subway', 'pond'].map(makeVoice); lastUpdate = -Infinity;
        }
        return await resumeContext();
    } catch { disposeLandmarkAudio(); return false; }
}

export function suspendLandmarkAudio() {
    if (!context) return;
    muted = true; if (master) master.gain.value = 0;
    if (context.state === 'running') void context.suspend().catch(() => {});
}

export function updateLandmarkAudio(camera, map, enabled = true) {
    if (!context || context.state === 'closed') return;
    if (!enabled || !camera?.position || !['suburban', 'city'].includes(map) || uiBlocked()) { suspendLandmarkAudio(); return; }
    if (context.state === 'suspended') void resumeContext();
    if (muted) { muted = false; setTarget(master.gain, 1, .3); lastUpdate = -Infinity; }
    const time = context.currentTime;
    if (time - lastUpdate < .05) return; lastUpdate = time;
    const positions = {
        carnival: { position: CARNIVAL_CONFIG, radius: 175, volume: .018 },
        subway: { position: SUBWAY_POSITIONS[map], radius: 100, volume: .024 },
        pond: { position: { x: UNIFIED_MAP_ZONE_OFFSETS.POND.x, z: UNIFIED_MAP_ZONE_OFFSETS.POND.z - 50 }, radius: 115, volume: .025 }
    };
    for (const voice of voices) {
        const spec = positions[voice.kind], mix = landmarkMix(camera.position, spec.position, camera.rotation?.y || 0, spec.radius);
        let envelope = 1;
        if (voice.kind === 'carnival') {
            const tune = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
            setTarget(voice.source.frequency, tune[Math.floor(time / .7) % tune.length], .02); envelope = .65 + .15 * Math.sin(time * 1.6);
        } else if (voice.kind === 'subway') {
            const phase = time % 9, beat = phase < .65 ? phase : phase < 1.3 ? phase - .65 : null;
            envelope = beat === null ? 0 : Math.exp(-beat * 5);
            setTarget(voice.source.frequency, phase < .65 ? 392 : 329.63, .015);
        } else envelope = .7 + .12 * Math.sin(time * .5);
        const present = map === 'suburban' || voice.kind === 'subway';
        setTarget(voice.gain.gain, present ? mix.gain * spec.volume * envelope : 0, voice.kind === 'subway' ? .04 : .2);
        if (voice.pan) setTarget(voice.pan.pan, mix.pan);
    }
}

export function disposeLandmarkAudio() {
    const previous = context;
    context = master = resumePending = null; muted = true; lastUpdate = -Infinity;
    for (const voice of voices) {
        try { voice.source.stop(); } catch { /* Already stopped by the browser. */ }
        voice.source.disconnect(); voice.gain.disconnect(); voice.pan?.disconnect(); voice.filter?.disconnect();
    }
    voices = [];
    if (previous && previous.state !== 'closed') void previous.close().catch(() => {});
}
export const getLandmarkAudioStatus = () => ({ started: !!context, sources: voices.length, muted });

if (typeof document !== 'undefined') {
    document.addEventListener('game-modal-change', suspendLandmarkAudio);
    document.addEventListener('story-performance-start', suspendLandmarkAudio);
    document.addEventListener('play', suspendLandmarkAudio, true);
    document.addEventListener('visibilitychange', () => { if (document.hidden) suspendLandmarkAudio(); });
    window.addEventListener('pagehide', disposeLandmarkAudio);
}
