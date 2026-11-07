// Fog changes color but does not skip rendering. Cull detached detail groups
// with the same distance envelope as buildings, with hysteresis for turns.
export const updateDetailVisibility = (objects, camera, distances) => {
    for (const object of objects) {
        const limit = (object.visible ? distances.keep : distances.load) + (object.userData.visibilityRadius || 4);
        const dx = object.position.x - camera.position.x;
        const dz = object.position.z - camera.position.z;
        object.visible = dx * dx + dz * dz < limit * limit;
    }
};
