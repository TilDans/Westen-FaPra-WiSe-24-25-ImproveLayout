import { TestBed } from '@angular/core/testing';
import { LayoutDirection } from "../../enums";
import { InductivePetriNet } from "../inductivePetriNet";
import { CustomElement } from "./customElement";
import { RecursiveNode } from "./recursiveNode";

// Mock für SVGElement, da wir in Tests kein DOM haben
class MockSVGElement {
  private attributes: Map<string, string> = new Map();

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) || null;
  }
}

// Mock für CustomElement mit SVG-Unterstützung
class MockCustomElement extends CustomElement {
  constructor(width: number, height: number) {
    super();
    // Wir mocken das SVG-Element
    const mockSvg = new MockSVGElement() as unknown as SVGElement;
    mockSvg.setAttribute('width', width.toString());
    mockSvg.setAttribute('height', height.toString());
    this.registerSvg(mockSvg);
  }

  // Die setXYonSVG Methode wird bereits von der Basisklasse bereitgestellt

  public override getCenterXY(): { x: number; y: number; } {
    return { x: this.x + this.getWidth() / 2, y: this.y + this.getHeight() / 2 };
  }
}

describe('RecursiveNode', () => {
  // Speichern der ursprünglichen Werte
  let originalHorizontalOffset: number;
  let originalVerticalOffset: number;

  beforeEach(() => {
    // Speichern der ursprünglichen Werte, falls sie existieren
    originalHorizontalOffset = InductivePetriNet.horizontalOffset !== undefined ? 
      InductivePetriNet.horizontalOffset : 10;
    originalVerticalOffset = InductivePetriNet.verticalOffset !== undefined ? 
      InductivePetriNet.verticalOffset : 15;
    
    // Setzen der statischen Werte für die Tests
    InductivePetriNet.horizontalOffset = 10;
    InductivePetriNet.verticalOffset = 15;
  });

  afterEach(() => {
    // Wiederherstellen der ursprünglichen Werte
    InductivePetriNet.horizontalOffset = originalHorizontalOffset;
    InductivePetriNet.verticalOffset = originalVerticalOffset;
  });

  it('should throw an exception when no children are present', () => {
    const node = new RecursiveNode([], LayoutDirection.Horizontal);
    expect(() => node.layoutRecursive(0, 0)).toThrowError("No Children found in RecursiveNode");
  });

  it('should calculate correct size for horizontal layout', () => {
    const child1 = new MockCustomElement(100, 50);
    const child2 = new MockCustomElement(150, 70);
    const node = new RecursiveNode([child1, child2], LayoutDirection.Horizontal);
    
    // Wir müssen layoutRecursive aufrufen, um die interne calculateRecursiveSize zu triggern
    node.layoutRecursive(0, 0);
    
    // Breite sollte die Summe der Breiten plus horizontalOffset sein
    expect(node.getWidth()).toBe(100 + 150 + InductivePetriNet.horizontalOffset);
    // Höhe sollte die maximale Höhe der Kinder sein
    expect(node.getHeight()).toBe(70);
  });

  it('should calculate correct size for vertical layout', () => {
    const child1 = new MockCustomElement(100, 50);
    const child2 = new MockCustomElement(150, 70);
    const node = new RecursiveNode([child1, child2], LayoutDirection.Vertical);
    
    node.layoutRecursive(0, 0);
    
    // Breite sollte die maximale Breite der Kinder sein
    expect(node.getWidth()).toBe(150);
    // Höhe sollte die Summe der Höhen plus verticalOffset sein
    expect(node.getHeight()).toBe(50 + 70 + InductivePetriNet.verticalOffset);
  });

  it('should position children correctly in horizontal layout', () => {
    const child1 = new MockCustomElement(100, 50);
    const child2 = new MockCustomElement(150, 70);
    const node = new RecursiveNode([child1, child2], LayoutDirection.Horizontal);
    
    node.layoutRecursive(20, 30);
    
    // Überprüfen der Position des ersten Kindes
    expect(child1.x).toBe(20); 
    // Das Kind sollte vertikal zentriert sein: y + (node_höhe - kind_höhe) / 2
    expect(child1.y).toBe(30 + (70 - 50) / 2);
    
    // Überprüfen der Position des zweiten Kindes
    // X-Position: x_position_kind1 + breite_kind1 + horizontalOffset
    expect(child2.x).toBe(20 + 100 + InductivePetriNet.horizontalOffset);
    // Y-Position: y + (node_höhe - kind_höhe) / 2
    expect(child2.y).toBe(30 + (70 - 70) / 2);
  });

  it('should position children correctly in vertical layout', () => {
    const child1 = new MockCustomElement(100, 50);
    const child2 = new MockCustomElement(150, 70);
    const node = new RecursiveNode([child1, child2], LayoutDirection.Vertical);
    
    node.layoutRecursive(20, 30);
    
    // Überprüfen der Position des ersten Kindes
    // X-Position: x + (node_breite - kind_breite) / 2
    expect(child1.x).toBe(20 + (150 - 100) / 2);
    expect(child1.y).toBe(30);
    
    // Überprüfen der Position des zweiten Kindes
    // X-Position: x + (node_breite - kind_breite) / 2
    expect(child2.x).toBe(20 + (150 - 150) / 2);
    // Y-Position: y_position_kind1 + höhe_kind1 + verticalOffset
    expect(child2.y).toBe(30 + 50 + InductivePetriNet.verticalOffset);
  });

  it('should handle nested RecursiveNodes correctly', () => {
    const innerChild1 = new MockCustomElement(50, 30);
    const innerChild2 = new MockCustomElement(60, 40);
    const innerNode = new RecursiveNode([innerChild1, innerChild2], LayoutDirection.Horizontal);
    
    const outerChild = new MockCustomElement(70, 50);
    const outerNode = new RecursiveNode([innerNode, outerChild], LayoutDirection.Vertical);
    
    outerNode.layoutRecursive(10, 10);
    
    // Überprüfen der Größe des inneren Knotens
    expect(innerNode.getWidth()).toBe(50 + 60 + InductivePetriNet.horizontalOffset);
    expect(innerNode.getHeight()).toBe(40);
    
    // Überprüfen der Position der inneren Kinder
    expect(innerChild1.x).toBe(10);
    expect(innerChild1.y).toBe(10 + (40 - 30) / 2);
    
    expect(innerChild2.x).toBe(10 + 50 + InductivePetriNet.horizontalOffset);
    expect(innerChild2.y).toBe(10 + (40 - 40) / 2);
    
    // Überprüfen der Position des äußeren Kindes
    expect(outerChild.x).toBe(10 + ((50 + 60 + InductivePetriNet.horizontalOffset) - 70) / 2);
    expect(outerChild.y).toBe(10 + 40 + InductivePetriNet.verticalOffset);
  });

  it('should not implement getCenterXY method', () => {
    const node = new RecursiveNode([new MockCustomElement(100, 50)], LayoutDirection.Horizontal);
    expect(() => node.getCenterXY()).toThrowError('Method not implemented.');
  });
});