import { VERTICAL_BOUNDS, CONNECTOR_X, CITY_CONNECTOR_X, getHorizontalBounds } from '../roads.js';
import { disposeObjectResources } from './resource-lifecycle.js';

export const updateTraffic = (streetElements, createCar, getRandomCarColor, frameScale = 1, time = 0) => {
    if (!streetElements.cars) return;
    
    const horizBounds = getHorizontalBounds(streetElements.mapType);
    const carPositions = {};
    const BOUNDS = { horizontal: horizBounds, vertical: VERTICAL_BOUNDS };
    const speed = 0.05 * frameScale;
    
    // Move existing cars
    for (let i = streetElements.cars.length - 1; i >= 0; i--) {
        const car = streetElements.cars[i];
        const roadType = car.userData.roadType || 'horizontal';
        const direction = car.userData.direction;
        const isVertical = roadType === 'vertical';
        const bounds = car.userData.bounds || (isVertical ? BOUNDS.vertical : BOUNDS.horizontal);
        
        const axis = isVertical ? 'z' : 'x';
        const boundsMax = isVertical ? bounds.zMax : bounds.xMax;
        const boundsMin = isVertical ? bounds.zMin : bounds.xMin;
        const moveAmount = isVertical
            ? (direction === 'left' ? -speed : speed)   // Vertical: left = -z, right = +z
            : (direction === 'left' ? speed : -speed);   // Horizontal: left = +x, right = -x
        const prevVal = car.position[axis];
        const newVal = prevVal + moveAmount;
        
        if (newVal < boundsMin || newVal > boundsMax) {
            const parentGroup = car.parent;
            if (parentGroup) parentGroup.remove(car);
            disposeObjectResources(car);
            streetElements.cars.splice(i, 1);
            continue;
        }
        
        // Collision check (same zone/road only)
        let canMove = true;
        const zoneKey = car.userData.zoneKey || '';
        const connectorX = car.userData.connectorX;
        
        const perpAxis = isVertical ? 'x' : 'z';
        Object.keys(carPositions).forEach(otherCarIndex => {
            if (parseInt(otherCarIndex) === i) return;
            const other = carPositions[otherCarIndex];
            const sameRoad = (zoneKey && other.zoneKey === zoneKey) || (connectorX !== undefined && other.connectorX === connectorX);
            if (!sameRoad) return;
            
            const otherAxisVal = other[axis];
            const myPerp = car.position[perpAxis];
            const otherPerp = other[perpAxis];
            if (Math.abs(myPerp - otherPerp) < 1) {
                if (direction === other.direction) {
                    if (Math.abs(newVal - otherAxisVal) < 3) canMove = false;
                }
            }
        });
        
        if (canMove) car.position[axis] = newVal;
        
        carPositions[i] = {
            x: car.position.x,
            z: car.position.z,
            direction,
            zoneKey,
            connectorX,
            [axis]: car.position[axis]
        };
    }
    
    // Spawn new cars - horizontal (plaza zone) and vertical (connector)
    const currentTime = time;
    const horizInterval = 6 + Math.sin(time * 0.1) * 3;
    const vertInterval = 10 + Math.sin(time * 0.15) * 4;
    const primaryZone = streetElements.streetElementsGroup?.parent?.userData?.zoneKey || (streetElements.mapType === 'city' ? 'CITY_PLAZA' : 'PLAZA');
    const horizCars = streetElements.cars.filter(c => c.userData.roadType === 'horizontal' && c.userData.zoneKey === primaryZone);
    const vertCars = streetElements.cars.filter(c => c.userData.roadType === 'vertical');
    
    if (streetElements.streetElementsGroup && (currentTime - (streetElements.lastCarSpawnTime || 0)) > horizInterval && horizCars.length < 6) {
        const spawnLeft = !streetElements.lastSpawnedLeft;
        streetElements.lastSpawnedLeft = spawnLeft;
        const spawnX = spawnLeft ? horizBounds.xMin : horizBounds.xMax;
        const spawnZ = spawnLeft ? 2 : -2;
        const canSpawn = !Object.values(carPositions).some(o => o.zoneKey === primaryZone && Math.abs(o.z - spawnZ) < 1 && Math.abs(o.x - spawnX) < 10);
        if (canSpawn) {
            const newCar = createCar(spawnX, getRandomCarColor(), spawnLeft ? 'left' : 'right');
            newCar.position.z = spawnZ;
            newCar.userData.roadType = 'horizontal';
            newCar.userData.zoneKey = primaryZone;
            newCar.userData.bounds = { ...horizBounds };
            streetElements.streetElementsGroup.add(newCar);
            streetElements.cars.push(newCar);
            streetElements.lastCarSpawnTime = currentTime;
        }
    }
    
    if (streetElements.connectorVehiclesGroup && (currentTime - (streetElements.connectorLastCarSpawnTime || 0)) > vertInterval && vertCars.length < 12) {
        const spawnZ = Math.random() > 0.5 ? VERTICAL_BOUNDS.zMin : VERTICAL_BOUNDS.zMax;
        const connectorPositions = streetElements.mapType === 'city' ? CITY_CONNECTOR_X : [CONNECTOR_X.LEFT, CONNECTOR_X.RIGHT];
        const spawnX = connectorPositions[Math.floor(Math.random() * connectorPositions.length)];
        const direction = spawnZ < 0 ? 'right' : 'left';
        const newCar = createCar(spawnX, getRandomCarColor(), direction, { vertical: true });
        newCar.position.set(spawnX, 0, spawnZ);
        newCar.userData.roadType = 'vertical';
        newCar.userData.bounds = { ...VERTICAL_BOUNDS };
        newCar.userData.connectorX = spawnX;
        streetElements.connectorVehiclesGroup.add(newCar);
        streetElements.cars.push(newCar);
        streetElements.connectorLastCarSpawnTime = currentTime;
    }
};
