import { sampleTrail } from './trail-layout.js';
/** Northeast mansion compound - bounds for tree exclusions */
export const MANSION_CONFIG = {
    x: 420,
    z: 430,
    width: 82,
    depth: 56
};

/** An indirect approach from the north side of the road to the hidden courtyard. */
export const MANSION_PATH_WAYPOINTS = [
    { x: 250, z: 350 }, { x: 256, z: 376 }, { x: 294, z: 397 },
    { x: 326, z: 380 }, { x: 354, z: 405 }, { x: 372, z: 449 },
    { x: 395, z: 430 }, { x: 410, z: 430 }
];

// Shared smooth centerline keeps the visible trail and tree clearance aligned.
export const getMansionPathSamples = () => sampleTrail(MANSION_PATH_WAYPOINTS);

/** East carnival - center and radius */
export const CARNIVAL_CONFIG = { x: 333, z: 0, radius: 105 };
/** PLAZA street runs through carnival at z=11; avoid z 0–22 for stalls/rides */
export const CARNIVAL_ROAD_Z = 11;
export const CARNIVAL_ROAD_BUFFER = 22;
export const CARNIVAL_ROAD_EXCLUSION = { zMin: 0, zMax: 22 };

/** Southeast forest clearings - positions, types, exclusions */
export const FOREST_CLEARINGS = [
    { id:'chair',x:235,z:-446,type:'chair',radius:18,contentId:'CLEARING_EMPTY_CHAIR' },
    { id:'lamp',x:250,z:-380,type:'lamp',radius:18,contentId:'CLEARING_STREET_LAMP' },
    { id:'stoneCircle',x:320,z:-415,type:'stoneCircle',radius:24,contentId:'CLEARING_STONE_CIRCLE' },
    { id:'oddPatch',x:300,z:-245,type:'oddPatch',radius:18,contentId:'CLEARING_ODD_CHAIR' },
    { id:'emptyTable',x:395,z:-210,type:'emptyTable',radius:22,contentId:'CLEARING_EMPTY_TABLE' },
    { id:'trafficCone',x:425,z:-385,type:'trafficCone',radius:18,contentId:'CLEARING_TRAFFIC_CONE' },
    { id:'shoppingCart',x:440,z:-450,type:'shoppingCart',radius:20,contentId:'CLEARING_SHOPPING_CART' }
];

export const FOREST_PATH_WAYPOINTS = [
    {x:260,z:-329},{x:250,z:-352},{x:250,z:-380},{x:270,z:-400},
    {x:320,z:-429},{x:365,z:-428},{x:404,z:-410},{x:425,z:-385},
    {x:445,z:-407},{x:440,z:-450},{x:385,z:-462},{x:325,z:-456},
    {x:275,z:-464},{x:235,z:-446},{x:220,z:-419},{x:230,z:-392},{x:250,z:-380}
];
export const FOREST_TRAILS = [
    FOREST_PATH_WAYPOINTS,
    [{x:280,z:-316},{x:300,z:-291},{x:278,z:-270},{x:300,z:-245},
        {x:340,z:-238},{x:365,z:-212},{x:395,z:-210}]
];

/** River on west side - runs through ZONE_NW, ZONE_W, ZONE_SW */
export const RIVER_CONFIG = {
    x: -333,
    halfWidth: 20,
    zMin: -500,
    zMax: 500
};

/** Suburban PLAZA shops (Grumby's, Grohos, etc.) - used only for PLAZA zone */
export const PLAZA_SHOPS = [
    { name: 'Grumby\'s', width: 18, style: 'convenience', signColor: 0xFFFFFF },
    { name: 'Grohos', width: 16, style: 'pizza', signColor: 0xFFFFFF },
    { name: 'Clothing Store', width: 14, style: 'clothing', signColor: 0xFFFFFF },
    { name: 'Dry Cleaners', width: 12, style: 'drycleaner', signColor: 0x000000 },
    { name: 'Donut Galaxy', width: 15, style: 'coffee', signColor: 0xFFFFFF },
    { name: 'Flower Shop', width: 13, style: 'flowers', signColor: 0x000000 }
];

/** City zone shop configs - unique establishments per street */
export const CITY_ZONE_SHOPS = {
    CITY_PLAZA: {
        centerBar: 'karaoke',
        shops: [
            { name: 'Bodega', width: 14, style: 'bodega', signColor: 0xFF6600 },
            { name: 'Pho House', width: 16, style: 'pho', signColor: 0xFFFFFF },
            { name: 'Tattoo Parlor', width: 12, style: 'tattoo', signColor: 0x000000 },
            { name: 'Vinyl & Coffee', width: 15, style: 'vinyl_coffee', signColor: 0x333333 }
        ]
    },
    CITY_N: {
        centerBar: 'dive_bar',
        shops: [
            { name: 'Record Store', width: 14, style: 'record_store', signColor: 0xFF0000 },
            { name: 'Laundromat', width: 16, style: 'laundromat', signColor: 0x00AAFF },
            { name: 'Corner Cafe', width: 13, style: 'corner_cafe', signColor: 0xFFFFFF },
            { name: 'Bookshop', width: 12, style: 'bookshop', signColor: 0x8B4513 }
        ]
    },
    CITY_S: {
        centerBar: 'arcade_bar',
        shops: [
            { name: 'Sushi Spot', width: 14, style: 'sushi', signColor: 0xFF6666 },
            { name: 'Vintage Threads', width: 15, style: 'vintage', signColor: 0x996633 },
            { name: 'Bubble Tea', width: 12, style: 'bubble_tea', signColor: 0xFFB6C1 },
            { name: 'Smoke Shop', width: 13, style: 'smoke_shop', signColor: 0x228B22 }
        ]
    }
};

/** Get shops and center bar type for a zone. Suburban PLAZA uses original shops + karaoke. */
export const getShopsForZone = (zoneSceneKey) => {
    if (CITY_ZONE_SHOPS[zoneSceneKey]) {
        return CITY_ZONE_SHOPS[zoneSceneKey];
    }
    if (zoneSceneKey === 'PLAZA') {
        return { centerBar: 'karaoke', shops: PLAZA_SHOPS };
    }
    return null;
};

