import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class IntersectionCalculatorService {

    constructor() {
    }

    public calculateLineIntersection(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) {
        // epsilon for floating point inaccuracies
        const epsilon = 1e-10;
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < epsilon) return null;

        const intersectX = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
        const intersectY = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;

        if (intersectX < Math.min(x1, x2) - epsilon || intersectX > Math.max(x1, x2) + epsilon ||
            intersectX < Math.min(x3, x4) - epsilon || intersectX > Math.max(x3, x4) + epsilon) return null;
        if (intersectY < Math.min(y1, y2) - epsilon || intersectY > Math.max(y1, y2) + epsilon ||
            intersectY < Math.min(y3, y4) - epsilon || intersectY > Math.max(y3, y4) + epsilon) return null;

        return {x: intersectX, y: intersectY};
    }
}
