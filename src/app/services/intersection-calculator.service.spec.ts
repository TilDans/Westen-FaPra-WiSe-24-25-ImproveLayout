import { TestBed } from '@angular/core/testing';

import { IntersectionCalculatorService } from './intersection-calculator.service';

describe('IntersectionCalculatorService', () => {
  let service: IntersectionCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IntersectionCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

    it('should return intersection point for intersecting lines', () => {
        const result = service.calculateLineIntersection(0, 0, 2, 2, 0, 2, 2, 0);
        expect(result).toEqual({ x: 1, y: 1 });
    });

    it('should return null for parallel lines', () => {
        const result = service.calculateLineIntersection(0, 0, 2, 2, 0, 1, 2, 3);
        expect(result).toBeNull();
    });

    it('should return null for coincident lines', () => {
        const result = service.calculateLineIntersection(0, 0, 2, 2, 0, 0, 2, 2);
        expect(result).toBeNull();
    });

    it('should return null for non-intersecting lines', () => {
        const result = service.calculateLineIntersection(0, 0, 1, 1, 2, 2, 3, 3);
        expect(result).toBeNull();
    });

    it('should handle floating point inaccuracies', () => {
        const result = service.calculateLineIntersection(0, 0, 1e-10, 1e-10, 1, 1, 2, 2);
        expect(result).toBeNull();
    });
});
