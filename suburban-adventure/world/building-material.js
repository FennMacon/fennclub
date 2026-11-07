import * as THREE from 'three';

// Custom door glows and wall cutouts need the same distance fog as standard materials.
export const createFoggedBuildingMaterial = parameters => {
    const beforeEnd = (source, code) => source.replace(/}\s*$/, `${code}\n}`);
    return new THREE.ShaderMaterial({
        ...parameters,
        fog: true,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...parameters.uniforms },
        vertexShader: '#include <fog_pars_vertex>\n' + beforeEnd(parameters.vertexShader, `
            #ifdef USE_FOG
                vFogDepth = -(modelViewMatrix * vec4(position, 1.0)).z;
            #endif`),
        fragmentShader: '#include <fog_pars_fragment>\n' + beforeEnd(parameters.fragmentShader, '\n#include <fog_fragment>')
    });
};
