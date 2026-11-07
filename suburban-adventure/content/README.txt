Editing Dialogue and Flavor Text
===============================

You can edit dialogue and flavor text here without changing any code.
Changes are loaded when the game runs (no rebuild needed).

DIALOGUE (content/dialogue/)
----------------------------
Each NPC has a .txt file (e.g. Maya.txt, Jake.txt).
Scenes are marked with: === SCENE_NAME ===
Use UNLOCKS: Song title to award a song when this conversation finishes.
Scene headers must match scene keys in scenes.js; these are locations, not conversation stages.
Format: Speaker: Their line of dialogue

Example:
  === PLAZA ===
  Maya: Hey, nice to see you!
  UNLOCKS: First Song
  Player: Thanks!

  === FOREST_SUBURBAN ===
  Maya: So, what brings you here?

FLAVOR TEXT (content/flavor/)
-----------------------------
Each file groups related descriptions (e.g. grumby.txt, donut.txt).
Each entry: === ID ===
Then: NAME: Display name
Optional: ITEM: Item the player gets from this object
Then write paragraphs. Each paragraph = one random flavor variant shown when the player inspects the object.

Example:
  === GRUMBY_SHELF ===
  NAME: Store Shelf
  ITEM: Snack

  A sturdy wooden shelf lined with products. Price tags hang from the front.

  This shelf holds convenience store essentials. Popular items are at eye level.

See content/IDS.md for a list of all IDs and where they appear.

STORY-SPECIFIC TEXT (outside this folder)
---------------------------------------
adventure-story.js: the Allston neighbors and story-aware conversations,
including Maya, Rex and Theo. These can override the ordinary .txt dialogue
depending on location and story progress. If editing a .txt line does not
change that conversation, check getStoryDialogue in this file.

story-activities.js: woodland clues, mansion piano, compilation performance,
ring-toss instructions and journal descriptions awarded by those activities.
These files are JavaScript: change quoted text carefully and preserve syntax.

EDITING TIPS
------------
Keep existing === IDs/scene names ===, filenames and metadata keys intact.
UNLOCKS titles are also keys in music/catalog.json; renaming one requires
updating that catalog so the recording can still play. Ordinary spoken lines
and flavor paragraphs can be edited freely. Existing .txt files need only a
page reload; use a hard refresh if the browser shows cached text.

Adding a new .txt file also requires registering it in content-loader.js.
After JavaScript edits, run npm run check to refresh runtime versions.
Run npm test to check content parsing and the dialogue location references.
