// Stadium-shaped cable track: straight sides and semicircular pulley ends.
export const ZIPPER = Object.freeze({ halfStraight: 5.8, radius: 1.3, pivotHeight: 9, cars: 12, boomRPM: 7.5, cableRPM: 4 });
export const trackLength = 4 * ZIPPER.halfStraight + 2 * Math.PI * ZIPPER.radius;
export function sampleCable(distance) {
    const { halfStraight: h, radius: r } = ZIPPER;
    let s = ((distance % trackLength) + trackLength) % trackLength;
    if (s < 2 * h) return { x: r, y: -h + s };
    s -= 2 * h;
    if (s < Math.PI * r) { const a = s / r; return { x: r * Math.cos(a), y: h + r * Math.sin(a) }; }
    s -= Math.PI * r;
    if (s < 2 * h) return { x: -r, y: h - s };
    const a = (s - 2 * h) / r;
    return { x: -r * Math.cos(a), y: -h - r * Math.sin(a) };
}
export function sampleAnchor(time, index) {
    const boomAngle = time * ZIPPER.boomRPM * 2 * Math.PI / 60;
    const point = sampleCable(index * trackLength / ZIPPER.cars + time * trackLength * ZIPPER.cableRPM / 60);
    const c = Math.cos(boomAngle), s = Math.sin(boomAngle);
    return { x: point.x * c - point.y * s, y: point.x * s + point.y * c, boomAngle, local: point };
}
// Single off-center hinge; gravity and moving-anchor acceleration drive the capsule.
// Fixed integration step makes motion independent of render refresh rate.
export function createZipperMotion() {
    const cars = Array.from({ length: ZIPPER.cars }, (_, index) => ({ angle: (index % 3 - 1) * 0.12, velocity: 0, length: 0.62 + (index % 4) * 0.025 }));
    let time = 0, accumulator = 0;
    const step = 1 / 240;
    return {
        cars,
        get time() { return time; },
        update(deltaTime) {
            accumulator += Math.min(0.1, Math.max(0, deltaTime));
            while (accumulator + 1e-10 >= step) {
                time += step; accumulator -= step;
                cars.forEach((car, index) => {
                    const prev = sampleAnchor(time - step, index), now = sampleAnchor(time, index), next = sampleAnchor(time + step, index);
                    const ax = (next.x - 2 * now.x + prev.x) / (step * step);
                    const ay = (next.y - 2 * now.y + prev.y) / (step * step);
                    const gx = -ax, gy = -9.81 - ay;
                    const acceleration = (gx * Math.cos(car.angle) + gy * Math.sin(car.angle)) / car.length - 0.32 * car.velocity;
                    car.velocity += acceleration * step;
                    car.angle += car.velocity * step;
                });
            }
        }
    };
}
