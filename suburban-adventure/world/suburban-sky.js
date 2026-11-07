import * as THREE from 'three';
import { getSuburbanAtmosphere } from './suburban-atmosphere.js';

export const createSuburbanSky = scene => {
    const material = new THREE.ShaderMaterial({
        uniforms: { horizon: { value: new THREE.Color() }, zenith: { value: new THREE.Color() } },
        vertexShader: `varying vec3 skyDirection;
            void main() { skyDirection = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 horizon; uniform vec3 zenith; varying vec3 skyDirection;
            void main() {
                float height = max(0.0, normalize(skyDirection).y);
                gl_FragColor = vec4(mix(horizon, zenith, smoothstep(0.04, 0.8, height)), 1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }`,
        side: THREE.BackSide, depthWrite: false, fog: false
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), material);
    sky.name = 'SuburbanSky';
    sky.frustumCulled = false;
    sky.renderOrder = -1000;
    scene.add(sky);
    scene.userData.suburbanSky = sky;
    scene.userData.sceneType = 'UNIFIED_MAP';
    updateSuburbanSky(scene);
    return sky;
};

export const updateSuburbanSky = scene => {
    const sky = scene.userData.suburbanSky;
    if (!sky) return;
    const atmosphere = scene.userData.atmosphere ?? getSuburbanAtmosphere();
    sky.material.uniforms.horizon.value.setHex(atmosphere.fogColor);
    sky.material.uniforms.zenith.value.setHex(atmosphere.zenithColor);
    if (scene.userData.camera) sky.position.copy(scene.userData.camera.position);
    if (!scene.background?.isColor) scene.background = new THREE.Color();
    scene.background.setHex(atmosphere.fogColor);
};
