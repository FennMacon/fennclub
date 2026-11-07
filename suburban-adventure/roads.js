// roads.js - Road network definitions for unified map
// Horizontal roads: move in X, z fixed per zone
// Vertical roads: move in Z, x = -170 or 170

// Zone street extent (PLAZA, FOREST, POND) - single source of truth for street length
// Edit these to change how far the streets extend in X
export const ZONE_STREET_X_MIN = -500;
export const ZONE_STREET_X_MAX = 500;
export const ZONE_STREET_WIDTH = ZONE_STREET_X_MAX - ZONE_STREET_X_MIN;

// Suburban map: white lines meet connector lines for clean 90° corners
export const SUBURBAN_ZONE_STREET_X_MIN = -165.05;
export const SUBURBAN_ZONE_STREET_X_MAX = 500;
export const SUBURBAN_RIGHT_CORNER_X = 165.05;  // East junction inner edge
export const SUBURBAN_RIGHT_OUTER_CORNER_X = 174.95;  // East junction outer edge
export const SUBURBAN_ZONE_STREET_WIDTH = SUBURBAN_ZONE_STREET_X_MAX - SUBURBAN_ZONE_STREET_X_MIN;
export const SUBURBAN_HORIZONTAL_BOUNDS = { xMin: SUBURBAN_ZONE_STREET_X_MIN, xMax: SUBURBAN_ZONE_STREET_X_MAX };

export const HORIZONTAL_BOUNDS = { xMin: ZONE_STREET_X_MIN, xMax: ZONE_STREET_X_MAX };

export const getHorizontalBounds = (mapType) =>
    mapType === 'city' ? HORIZONTAL_BOUNDS : SUBURBAN_HORIZONTAL_BOUNDS;
export const VERTICAL_BOUNDS = { zMin: -500, zMax: 500 };
export const CONNECTOR_X = { LEFT: -170, RIGHT: 170 };

// Roads are 12 units wide: each six-unit lane has its center three units from the divider.
// Legacy car directions: left = east/south; right = west/north, with world north at +z.
export const CAR_LANE_OFFSET = 3;
export const getCarLaneOffset = direction => direction === 'right' ? CAR_LANE_OFFSET : -CAR_LANE_OFFSET;

// City map: 2x road density - 4 vertical connectors
export const CITY_CONNECTOR_X = [-255, -85, 85, 255];
// City horizontal cross-streets (between main zone streets at 11, 344, -322)
export const CITY_HORIZONTAL_Z = [166, -166];

export const ROAD_SEGMENTS = {
    // Horizontal zone streets
    PLAZA_STREET: {
        id: 'PLAZA_STREET',
        type: 'horizontal',
        bounds: { xMin: ZONE_STREET_X_MIN, xMax: ZONE_STREET_X_MAX },
        z: 11,
        zoneOffset: { x: 0, z: 0 },
        laneOffset: CAR_LANE_OFFSET
    },
    FOREST_STREET: {
        id: 'FOREST_STREET',
        type: 'horizontal',
        bounds: { xMin: ZONE_STREET_X_MIN, xMax: ZONE_STREET_X_MAX },
        z: 11,
        zoneOffset: { x: 0, z: 333 },
        laneOffset: CAR_LANE_OFFSET
    },
    POND_STREET: {
        id: 'POND_STREET',
        type: 'horizontal',
        bounds: { xMin: ZONE_STREET_X_MIN, xMax: ZONE_STREET_X_MAX },
        z: 11,
        zoneOffset: { x: 0, z: -333 },
        laneOffset: CAR_LANE_OFFSET
    },
    // Vertical connector roads
    LEFT_CONNECTOR: {
        id: 'LEFT_CONNECTOR',
        type: 'vertical',
        x: -170,
        bounds: { zMin: -450, zMax: 450 },
        laneOffset: CAR_LANE_OFFSET
    },
    RIGHT_CONNECTOR: {
        id: 'RIGHT_CONNECTOR',
        type: 'vertical',
        x: 170,
        bounds: { zMin: -450, zMax: 450 },
        laneOffset: CAR_LANE_OFFSET
    }
};
