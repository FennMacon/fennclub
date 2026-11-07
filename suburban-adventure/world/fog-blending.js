// Blend every neighboring zone at boundaries, including four-way grid corners.
// Distance differences keep zone centers intact and avoid a jump when the
// identity of the second-nearest zone changes.
export const getBlendedZoneFog = (zones, x, z, getConfig, blendRadius = 90) => {
    const distances = zones.map(zone => ({ zone, distance: Math.hypot(x - zone.x, z - zone.z) }));
    const nearest = Math.min(...distances.map(entry => entry.distance));
    let weightSum = 0, red = 0, green = 0, blue = 0, near = 0, far = 0;
    for (const { zone, distance } of distances) {
        const t = Math.max(0, Math.min(1, (distance - nearest) / (blendRadius * 2)));
        const weight = 1 - t * t * (3 - 2 * t);
        if (!weight) continue;
        const config = getConfig(zone.key, zone.config);
        weightSum += weight;
        red += ((config.color >> 16) & 255) * weight;
        green += ((config.color >> 8) & 255) * weight;
        blue += (config.color & 255) * weight;
        near += config.near * weight;
        far += config.far * weight;
    }
    if (!weightSum) return null;
    return {
        color: (Math.round(red / weightSum) << 16) | (Math.round(green / weightSum) << 8) | Math.round(blue / weightSum),
        near: near / weightSum,
        far: far / weightSum
    };
};
