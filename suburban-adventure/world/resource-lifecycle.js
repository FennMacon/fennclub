// Use for objects whose GPU resources are owned by that object (for example cars).
// Deduplicate resources shared by siblings, such as the four wheels on a car.
export const disposeObjectResources = root => {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    root.traverse(object => {
        if (object.isInstancedMesh) object.dispose();
        if (object.geometry) geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            if (!material) continue;
            materials.add(material);
            for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
            for (const uniform of Object.values(material.uniforms || {})) if (uniform.value?.isTexture) textures.add(uniform.value);
        }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
};
