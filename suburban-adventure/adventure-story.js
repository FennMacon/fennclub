import { getAdventureState, startCompilation, addContribution, noteConversation } from './adventure-state.js';
import { getConversation } from './content-loader.js';
import { createCityPlan, CITY_DISTRICTS } from './world/city-layout.js';

const line = (speaker, text) => ({ speaker, text });
let cityEncounters;
const conversationName = name => ['Alex', 'Sam'].includes(name) ? 'Alex & Sam' : ['Jordan', 'Riley'].includes(name) ? 'Jordan & Riley' : name;
const encounters = [
    ['CITY_NW', 'Ada', 'Porchlight Chorus', 'Every moving day, someone leaves a couch and someone starts a band. I recorded the porch next door singing through the floorboards.', 'Take the chorus. Put the address on the tape, so we remember where it came from.'],
    ['CITY_N', 'Luis', 'Moving Day', 'I repair amplifiers in the apartment above the pharmacy. The trolley rattles every loose screw in time.', 'Your plaza compilation could use a little city noise. I kept the trolley in the recording.'],
    ['CITY_NE', 'Bea', 'Feedback Loop', 'Our rehearsal lease is up too. Apparently a room full of people making a racket is an opportunity for luxury storage.', 'Here is our loudest take. Play it at your farewell show. Give that room one more audience.'],
    ['CITY_W', 'Milo', 'Side Street Stories', 'You can hear three different rehearsals from this corner. They almost agree on a key.', 'I made a song out of the bits between them. The walk home deserves a track too.'],
    ['CITY_PLAZA', 'Dee Dee', 'Last Receipt', 'The shop gets quiet after the last customer. The register still makes that little bell sound.', 'I sampled it for you. Some places deserve a goodbye that sounds like themselves.'],
    ['CITY_E', 'Jin', 'Kitchen Window', 'Last orders are never really the last orders. Somebody always just got off work.', 'Our kitchen radio broke, so we made our own song. Tell your plaza friends dinner is on us after the show.'],
    ['CITY_SW', 'Sol', 'Common Ground', 'We built these garden beds out of boards from the old venue. Nothing useful gets thrown away here.', 'I recorded everyone planting in the rain. Keep a little of this place in your compilation.'],
    ['CITY_S', 'Nico', 'Loading Dock Lights', 'Best show I ever saw was three people under a loading dock light. No tickets. One extension cord.', 'Your show can be that simple. Here is a track; bring the people, and the room will do the rest.'],
    ['CITY_SE', 'Inez', 'First Train Home', 'I open the bakery before the first train. The whole neighborhood sounds different before anyone is awake.', 'This recording starts with the shutters going up. A farewell tape should have a beginning on it too.']
];

// Put each encounter beside an actual entrance, outside its doorway and road lane.
export function getCityEncounters() {
    if (cityEncounters) return cityEncounters;
    const plan = createCityPlan();
    cityEncounters = encounters.map(([sceneKey, name, title, first, second]) => {
        const district = CITY_DISTRICTS.find(entry => entry.key === sceneKey);
        const lot = plan.lots.filter(entry => entry.district === sceneKey && entry.retail && entry.enterable)
            .sort((a, b) => Math.hypot(a.x - district.x, a.z - district.z) - Math.hypot(b.x - district.x, b.z - district.z))[0];
        return {
            id: 'neighbor-' + sceneKey, name, sceneKey, districtKey: sceneKey,
            position: { x: lot.x + 3.5, z: lot.z + lot.facing * (lot.depth / 2 + 5) },
            lines: [line(name, first), line('Player', 'We are making a compilation for the plaza. Would you add something?'), line(name, second)],
            contribution: { id: title, title, by: name, location: district.name }
        };
    });
    return cityEncounters;
}

const cityByName = () => new Map(getCityEncounters().map(entry => [entry.name, entry]));
const conversation = (dialogue, unlocks = null) => ({ dialogue, unlocks, story: true });

export function getStoryDialogue(name, sceneKey) {
    const state = getAdventureState(), city = cityByName().get(name);
    const seen = state.conversations.includes(sceneKey + ':' + conversationName(name)) || state.conversations.includes(sceneKey + ':' + name);
    if (city && city.sceneKey === sceneKey) {
        if (state.story.completed && seen) return conversation([line(name, state.story.setlist.includes(city.contribution.id)
            ? `You played ${city.contribution.title}? That little room reached all the way out here. Thanks for bringing us with you.`
            : `Word about your show reached this block. Keep ${city.contribution.title} on the tape. There is always a next set.`)]);
        if (seen) return conversation([line(name, `${city.contribution.title} is yours. When you have three contributions, take your setlist to the cassette deck on the plaza's karaoke stage.`)]);
        return conversation(city.lines, city.contribution.title);
    }
    if (name === 'Maya' && sceneKey === 'PLAZA') {
        if (state.story.completed) return conversation([
            line('Maya', 'I heard the whole room singing. We still do not know what happens to the plaza, but nobody gets to say it never mattered.'),
            ...(!seen ? [line('Maya', 'Here is my song, Consistency. There is always room for another voice on the tape.')] : [])
        ], seen ? null : 'Consistency');
        if (seen) return conversation([line('Maya', `We have ${state.story.contributions.length} contributions. Three is enough to make a show. The cassette deck is on the karaoke stage, through the doors behind us.`), line('Maya', 'The people in Allston have their own stories too. The subway is down by the southwest riverbank.')]);
        return conversation([
            line('Maya', 'My band is playing tonight. Maybe the last show here; the plaza is being sold to developers.'),
            line('Player', 'Then let us make something they cannot tear down.'),
            line('Maya', 'A compilation. Songs from the people who made this place home. Start with mine: Consistency.'),
            line('Player', 'Sounds like your other songs.'),
            line('Maya', 'That is the idea. Gather any three contributions, here or in Allston. Then choose a setlist at the cassette deck on the karaoke stage. We will play the room one more time.')
        ], 'Consistency');
    }
    if (name === 'Rex' && sceneKey === 'PLAZA') return conversation([
        line('Rex', state.story.completed ? 'You really did it. Someone taped the whole show. People are asking about another one.' : 'The flyer can go by the door. The compilation deck is on the stage, on your right.'),
        line('Rex', state.story.completed ? 'Leave the flyer up.' : 'Three contributions gets us a show. Talk to the neighbors, not just the bands. Everyone has a sound worth saving.')
    ]);
    if (name === 'Theo' && sceneKey === 'CUMBYS_INTERIOR') return conversation([
        line('Theo', state.story.completed ? 'The Slush Puppie solo brought the house down. I knew it had range.' : 'The Slush Puppie machine makes the perfect pad if you loop it right.'),
        line('Theo', state.story.completed ? 'Your finale is on the phone. Keep the tape running.' : 'Leah has a track for the compilation. Bring any three contributions to the karaoke stage and choose the running order. We will make the finale together.')
    ]);
    if (name === 'Morgan' && sceneKey === 'FOREST_SUBURBAN' && seen) return conversation([
        line('Morgan', state.mystery.solved ? 'So the house finally answered. Some rooms are larger on the inside of a recording.' : 'A timetable, an invitation, a stone plinth. Three notes left in the southeast clearings. The mansion piano remembers their order.'),
        line('Player', state.mystery.solved ? 'I am putting that on the tape.' : 'That is unusually specific of you.')
    ]);
    const original = getConversation(name, sceneKey);
    if (seen && original) return conversation([
        line(name, state.story.completed ? 'Someone sent me the recording of the show. For a minute, it felt like everyone was in the same room again.' : original.unlocks ? `${original.unlocks} is on your phone. Take it to the karaoke stage when you have three contributions.` : 'Good to see you again. Maya is putting the neighborhood compilation together by the plaza.')
    ]);
    return null;
}

export function onConversationComplete(name, sceneKey) {
    const city = cityByName().get(name);
    const reward = city?.sceneKey === sceneKey ? city.contribution.title : getConversation(name, sceneKey)?.unlocks;
    // Theo's "Plaza Finale" is earned by playing the show, never by this conversation.
    if (reward && reward !== 'Plaza Finale') addContribution(reward, reward, name);
    if (reward || (sceneKey === 'PLAZA' && ['Maya', 'Rex'].includes(name))) startCompilation();
    noteConversation(conversationName(name), sceneKey);
}

export const getCompilationGoal = () => {
    const story = getAdventureState().story;
    if (story.completed) return 'The show is on tape. Keep exploring, or play another set at the karaoke stage.';
    if (!story.started) return 'Find Maya on the plaza sidewalk. She is putting together one last show.';
    if (story.contributions.length < 3) return `Gather ${3 - story.contributions.length} more contributions. Neighbors in the plaza, woods and Allston have recordings to share.`;
    return 'Choose your setlist at the cassette deck on the plaza karaoke stage.';
};
