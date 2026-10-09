// Offsets from the carnival center. Booth fronts face the open aisle.
export const MIDWAY_ALLEYS = [
    { kind: 'food', name: 'FOOD ALLEY', x: 78, z: 44, width: 7, length: 40, entranceZ: 24, direction: 1 },
    { kind: 'games', name: 'GAME ALLEY', x: -54, z: -17, width: 7, length: 30, entranceZ: -2, direction: -1 }
];
export const MIDWAY_STALLS = [
    { kind: 'cotton', alley: 'food', x: 72, z: 32, rotation: Math.PI / 2, contentId: 'CARNIVAL_COTTON_CANDY', label: 'COTTON CANDY' },
    { kind: 'dough', alley: 'food', x: 84, z: 32, rotation: -Math.PI / 2, contentId: 'CARNIVAL_FRIED_DOUGH', label: 'FRIED DOUGH' },
    { kind: 'hotdogs', alley: 'food', x: 72, z: 44, rotation: Math.PI / 2, contentId: 'CARNIVAL_HOT_DOGS', label: 'HOT DOGS' },
    { kind: 'lemonade', alley: 'food', x: 84, z: 44, rotation: -Math.PI / 2, contentId: 'CARNIVAL_LEMONADE', label: 'LEMONADE' },
    { kind: 'funnel', alley: 'food', x: 72, z: 56, rotation: Math.PI / 2, contentId: 'CARNIVAL_FUNNEL_CAKE', label: 'FUNNEL CAKES' },
    { kind: 'rings', alley: 'games', x: -60, z: -6, rotation: Math.PI / 2, contentId: 'CARNIVAL_RING_TOSS', label: 'RING TOSS' },
    { kind: 'balloons', alley: 'games', x: -48, z: -6, rotation: -Math.PI / 2, contentId: 'CARNIVAL_BALLOON_DARTS', label: 'BALLOON DARTS' },
    { kind: 'bottles', alley: 'games', x: -60, z: -16, rotation: Math.PI / 2, contentId: 'CARNIVAL_BOTTLE_KNOCKDOWN', label: 'BOTTLE KNOCKDOWN' },
    { kind: 'ducks', alley: 'games', x: -48, z: -16, rotation: -Math.PI / 2, contentId: 'CARNIVAL_DUCK_POND', label: 'DUCK POND' },
    { kind: 'hoops', alley: 'games', x: -60, z: -27, rotation: Math.PI / 2, contentId: 'CARNIVAL_BASKETBALL', label: 'HOOP SHOT' },
    { kind: 'skeeball', alley: 'games', x: -48, z: -27, rotation: -Math.PI / 2, contentId: 'CARNIVAL_SKEEBALL', label: 'SKEE BALL' }
];
export const TEACUPS = { x: -50, z: 35, radius: 7.5, count: 6, orbitRadius: 4.2 };
export function sampleTeacupMotion(time, index) {
    return { platform: time * Math.PI / 15, cup: (index % 2 ? -1 : 1) * time * (0.8 + index * 0.11) + index * Math.PI / 3 };
}
