# Connect discoveries to playback

The phone should have one music library: finish an NPC conversation, receive a song, then tap that song in the phone to play it. Replace the unrestricted soundtrack dropdown with the discovered-song list so music becomes a reward for exploration.

## One catalog for rewards and playback

The catalog groups narrative reward titles under a stable recording ID and audio filename:

```json
{
  "recordings": [
    {
      "id": "crush-1",
      "file": "Crush Theme 1.mp3",
      "rewards": ["Consistency", "Promise"]
    }
  ]
}
```

Dialogue continues awarding its original title through `UNLOCKS`, so existing saves work directly. The phone resolves that title through the catalog and lists only discoveries. The NPC who introduced a song remains discovery metadata, not a claimed recording artist. Audio paths resolve relative to the library module, including filenames with spaces. Unknown discoveries stay visible with an unavailable recording state.

## Playback behavior

- Tapping a discovered song starts it in the phone's existing shared audio player.
- Tapping the current song toggles play/pause; choosing a different song changes the source and starts playback.
- Show a now-playing title and a clear active row. Keep the player and its playback position when the journal refreshes, the phone closes, or the player travels.
- Unlocking a song refreshes the library and flashes the phone, without starting playback automatically.
- Resetting discoveries pauses a now-locked song and clears its selection.
- A discovered entry without a recording remains a discovery with an unavailable state. A failed recording shows a retryable error. Neither silently substitutes another song.

## Current provisional mapping

`music/catalog.json` assigns all 28 existing dialogue reward titles to the 14 recordings, using each file twice. The assignments are provisional and grouped by narrative theme. Dialogue and existing save keys remain unchanged.

Edit a recording's `rewards` array to change its assignments. When adding a new MP3, create a new recording entry and move the appropriate reward title into it. No changes to NPC writing or saves are needed.

The shipped implementation uses reward titles as the existing stable save keys, and catalog recording IDs identify audio assets. A future rename can add title aliases or migrate keys without replacing the player.

## Validation

Cover unlock → tap → correct source/playback; locked tracks excluded; duplicate unlocks; old saves; unavailable recordings; reset during playback; and audio continuing through travel. Test the tap gesture on iOS Safari and Android Chrome, since audio playback must begin from a user gesture.
