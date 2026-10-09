import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createWireframeMaterial } from '../utils.js';

export function createCarnivalKit() {
    const materials = new Map();
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const beamGeometry = new THREE.CylinderGeometry(1, 1, 1, 6);
    const bulbGeometry = new THREE.SphereGeometry(0.065, 5, 4);
    const material = color => {
        if (!materials.has(color)) materials.set(color, createWireframeMaterial(color));
        return materials.get(color);
    };
    const mesh = (parent, geometry, position, color) => {
        const object = new THREE.Mesh(geometry, typeof color === 'number' ? material(color) : color);
        object.position.set(...position); parent.add(object); return object;
    };
    const box = (parent, size, position, color) => {
        const object = mesh(parent, boxGeometry, position, color); object.scale.set(...size); return object;
    };
    const beam = (parent, a, b, radius, color) => {
        const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
        const object = mesh(parent, beamGeometry, from.add(to).multiplyScalar(0.5).toArray(), color);
        object.scale.set(radius, delta.length(), radius);
        object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
        return object;
    };
    const bulbMaterials = [0xffdc85, 0x91ffe8].map(color => new THREE.MeshBasicMaterial({ color }));
    const bulb = (parent, position, index) => mesh(parent, bulbGeometry, position, bulbMaterials[index % 2]);
    const sign = (parent, label, position, width = 4, subtitle = '') => {
        const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 160;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#15283a'; ctx.fillRect(0, 0, 768, 160);
        ctx.strokeStyle = '#ffdd85'; ctx.lineWidth = 6; ctx.strokeRect(4, 4, 760, 152);
        ctx.fillStyle = '#ffdd85'; ctx.textAlign = 'center';
        ctx.font = 'bold 48px sans-serif';
        ctx.fillText(label, 384, subtitle ? 70 : 100, 730);
        if (subtitle) { ctx.font = '26px sans-serif'; ctx.fillText(subtitle, 384, 125, 730); }
        return mesh(parent, new THREE.PlaneGeometry(width, width * 160 / 768), position,
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.DoubleSide }));
    };
    return { mesh, box, beam, bulb, sign, material };
}

// Only merge siblings: cup pivots, booth roots and sign interaction targets survive.
export function batchCarnivalGeometry(parent) {
    for (const child of [...parent.children]) if (child.isGroup) batchCarnivalGeometry(child);
    const buckets = new Map();
    for (const child of parent.children) if (child.isMesh && !Array.isArray(child.material)) {
        const bucket = buckets.get(child.material) || [];
        bucket.push(child); buckets.set(child.material, bucket);
    }
    for (const [material, meshes] of buckets) {
        if (meshes.length < 2) continue;
        const parts = meshes.map(mesh => { mesh.updateMatrix(); return mesh.geometry.clone().applyMatrix4(mesh.matrix); });
        const merged = mergeGeometries(parts); parts.forEach(part => part.dispose());
        if (merged) { meshes.forEach(mesh => parent.remove(mesh)); parent.add(new THREE.Mesh(merged, material)); }
    }
}
