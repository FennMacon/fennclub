/** ZONE_NW mansion compound - bounds for tree exclusions (left column, top) */
export const ZONE_NW_MANSION = {
    x: -333,
    z: 333,
    width: 90,
    depth: 70
};

/** ZONE_W carnival - center and radius (left column, middle) */
export const ZONE_W_CARNIVAL = { x: -333, z: 0, radius: 105 };
/** PLAZA street runs through carnival at z=11; avoid z 0–22 for stalls/rides */
export const CARNIVAL_ROAD_Z = 11;
export const CARNIVAL_ROAD_BUFFER = 22;
export const CARNIVAL_ROAD_EXCLUSION = { zMin: 0, zMax: 22 };

/** ZONE_SW forest clearings - positions, types, exclusions (left column, bottom) */
export const ZONE_SW_CLEARING_CONFIG = [
    { id: 'chair', x: -450, z: -466, type: 'chair', radius: 14, contentId: 'CLEARING_EMPTY_CHAIR' },
    { id: 'lamp', x: -420, z: -386, type: 'lamp', radius: 14, contentId: 'CLEARING_STREET_LAMP' },
    { id: 'stoneCircle', x: -380, z: -316, type: 'stoneCircle', radius: 14, contentId: 'CLEARING_STONE_CIRCLE' },
    { id: 'oddPatch', x: -350, z: -246, type: 'oddPatch', radius: 14, contentId: 'CLEARING_ODD_CHAIR' },
    { id: 'emptyTable', x: -280, z: -196, type: 'emptyTable', radius: 14, contentId: 'CLEARING_EMPTY_TABLE' },
    { id: 'trafficCone', x: -240, z: -366, type: 'trafficCone', radius: 10, contentId: 'CLEARING_TRAFFIC_CONE' },
    { id: 'shoppingCart', x: -220, z: -466, type: 'shoppingCart', radius: 12, contentId: 'CLEARING_SHOPPING_CART' }
];

export const ZONE_SW_PATH_WAYPOINTS = [
    { x: -230, z: -491 },
    { x: -220, z: -466 },
    { x: -450, z: -466 },
    { x: -420, z: -386 },
    { x: -380, z: -316 },
    { x: -350, z: -246 },
    { x: -280, z: -196 },
    { x: -240, z: -366 },
    { x: -230, z: -446 }
];

/** River on right side - runs through ZONE_NE, ZONE_E, ZONE_SE */
export const RIVER_CONFIG = {
    x: 333,
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

