// Dialogue reward titles remain save keys; recordings are assigned separately.
let catalog = new Map();
let loading;
export function validateMusicCatalog(data) {
    if (!Array.isArray(data?.recordings)) throw new Error('Missing recordings array');
    const rewards = new Map(), ids = new Set();
    for (const track of data.recordings) {
        if (typeof track.id !== 'string' || ids.has(track.id) || typeof track.file !== 'string' || !track.file.endsWith('.mp3') || /[\/\\]/.test(track.file) || !Array.isArray(track.rewards)) throw new Error('Invalid recording');
        ids.add(track.id);
        for (const reward of track.rewards) {
            if (typeof reward !== 'string' || !reward || rewards.has(reward)) throw new Error(`Invalid or duplicate reward: ${reward}`);
            rewards.set(reward, Object.freeze({ id: track.id, file: track.file }));
        }
    }
    return rewards;
}
export async function loadMusicCatalog() {
    if (!loading) loading = fetch(new URL('./music/catalog.json', import.meta.url)).then(async response => {
        if (!response.ok) throw new Error(`Music catalog HTTP ${response.status}`);
        catalog = validateMusicCatalog(await response.json());
    }).catch(error => { loading = null; throw error; });
    return loading;
}
export const getRecording = reward => catalog.get(reward) || null;
export const getRecordingURL = recording => new URL(`music/${encodeURIComponent(recording.file)}`, import.meta.url).href;
