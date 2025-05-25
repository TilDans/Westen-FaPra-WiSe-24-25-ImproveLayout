import { SvgService } from "src/app/services/svg.service";
import { LayoutDirection, RecursiveType } from "../../enums"; // Enum indicating layout orientation (horizontal or vertical)
import { InductivePetriNet } from "../inductivePetriNet"; // Contains layout offsets (horizontal/vertical)
import { CustomElement } from "./customElement"; // Base class for visual elements
import { Place } from "./place";

/**
 * Represents a recursive layout node that can contain other CustomElements,
 * including other RecursiveNodes, allowing for nested hierarchical layouting.
 */
export class RecursiveNode extends CustomElement {
    private _children: CustomElement[]; // Child elements of this node
    private _direction: LayoutDirection; // Layout orientation (horizontal or vertical)
    private _height: number = 0; // Cached computed height of the node
    private _width: number = 0; // Cached computed width of the node
    private _type: RecursiveType | undefined;
    private _connectedPlaces: Place[] = [];
    
    static counter = 0;
    static colouredBoxes = true;
    static padding = RecursiveNode.colouredBoxes ? 60 : 0;

    constructor(children: CustomElement[], svgService: SvgService, direction: LayoutDirection, type?: RecursiveType, createBox?: boolean) {
        super();
        this._children = children;
        this._direction = direction;
        if (type) {
            this._type = type;
            if (RecursiveNode.colouredBoxes && createBox) {
                this._svgElement = svgService.createSVGforRecursiveNode(RecursiveNode.counter, type);
            }
        }
    }

    /**
     * Must be implemented: Returns the center (x, y) coordinates of this node.
     */
    public override getCenterXY(): { x: number; y: number; } {
        throw new Error("Method not implemented.");
    }

    public getLayoutDirection(): LayoutDirection {
        return this._direction;
    }

    public registerPlace(placeToAdd: Place) {
        this._connectedPlaces.push(placeToAdd);
    }

    public deRegisterPlace(placeToRemove: Place) {
        this._connectedPlaces = this._connectedPlaces.filter(place => place !== placeToRemove);
    }

    public setXonPlaces() {
        this._children.forEach(child => {
            if (child instanceof RecursiveNode) {
                child.setXonPlaces();
                console.log(child)
            }
        });
        this._connectedPlaces.forEach(place => {
            const startX = this._x
            const endX = this._x + this._width

            const startXDiff = Math.abs(place.x - startX);
            const endXDiff = Math.abs(place.x - endX);
            
            startXDiff > endXDiff ? place.setXYonSVG(endX, place.getCenterXY().y) : place.setXYonSVG(startX, place.getCenterXY().y)
        });
    }

    /**
     * Positions this node and its children recursively, starting from (x, y).
     * Aligns children depending on layout direction and applies offsets.
     */
    public layoutRecursive(x: number, y: number): void {
        if (this._children.length === 0) {
            throw new Error("No Children found in RecursiveNode");
        }
        this.calculateRecursiveSize();
        
        this.setXYonSVG(x, y); // Set position for this node itself

        const nodeInSequenceAndNoBox = this._svgElement === undefined && this._type === RecursiveType.Sequence;
        let currentX = x + (nodeInSequenceAndNoBox ? 0 : (RecursiveNode.padding));
        let currentY = y + RecursiveNode.padding;

        switch (this._direction) {
            case LayoutDirection.Horizontal:
                this._children.forEach(child => {
                    const childHeight = child.getHeight();
                    // Vertically center-align child within this node
                    const yAligned = y + (this._height - childHeight) / 2;
                    child.setXYonSVG(currentX, yAligned);

                    // If the child is also a RecursiveNode, layout it recursively
                    if (child instanceof RecursiveNode) {
                        child.layoutRecursive(currentX, yAligned);
                    }

                    // Advance X position by width of child and offset
                    currentX += child.getWidth() + InductivePetriNet.horizontalOffset;
                });
                break;
            case LayoutDirection.Vertical:
                this._children.forEach(child => {
                    const childWidth = child.getWidth();
                    // Horizontally center-align child within this node
                    const xAligned = x + (this._width - childWidth) / 2;
                    child.setXYonSVG(xAligned, currentY);

                    // Recurse layout for RecursiveNode children
                    if (child instanceof RecursiveNode) {
                        child.layoutRecursive(xAligned, currentY);
                    }

                    // Advance Y position by height of child and offset
                    currentY += child.getHeight() + InductivePetriNet.verticalOffset;
                });
                break;
            default:
                this._children.forEach(child => {child.setXYonSVG(x,y)})
        }
    }

    /**
     * Recursively computes and caches the size (width, height) of this node
     * based on its children's dimensions and layout direction.
     */
    private calculateRecursiveSize(): { width: number; height: number } {

        // Get size for each child, recursively if needed
        const childrenSizes = this._children.map(child =>
            child instanceof RecursiveNode ? child.calculateRecursiveSize() : {
                width: child.getWidth(),
                height: child.getHeight()
            }
        );

        switch (this._direction) {
            case LayoutDirection.Horizontal:
                // Total width is sum of children's widths + spacing
                this._width = childrenSizes.reduce((sum, childSize) => sum + childSize.width, 0)
                                + (childrenSizes.length - 1) * InductivePetriNet.horizontalOffset;
                // Height is max of children's heights
                this._height = Math.max(...childrenSizes.map(s => s.height));
                break;

            case LayoutDirection.Vertical:
                // Width is max of children's widths
                const raw = this._svgElement?.getAttribute('minwidth');
                const minwidth = !isNaN(parseFloat(raw!)) ? parseFloat(raw!) : 0;

                this._width = Math.max(...childrenSizes.map(childSize => childSize.width), minwidth);
                // Total height is sum of children's heights + spacing
                this._height = childrenSizes.reduce((sum, s) => sum + s.height, 0)
                               + (childrenSizes.length - 1) * InductivePetriNet.verticalOffset;
                break;

            default:
                // If no layout direction is defined, use the first child's size as fallback
                return { width: childrenSizes[0].width, height: childrenSizes[0].height };
        }
        const nodeInSequenceAndNoBox = this._svgElement === undefined && this._type === RecursiveType.Sequence;
        this.setWidth(this._width + (nodeInSequenceAndNoBox ? 0 : (RecursiveNode.padding * 2)));
        this.setHeight(this._height + RecursiveNode.padding * 2);

        return { width: this._width, height: this._height };
    }

    public override setXYonSVG(xNew: number, yNew: number): void {
        this._x = xNew;
        this._y = yNew;

        if (this._svgElement) {
            this._svgElement!.setAttribute('transform', 'translate(' + xNew + ',' + yNew + ')');
            this._svgElement!.setAttribute('cx', xNew.toString());
            this._svgElement!.setAttribute('cy', yNew.toString());
        }
    }

    public override getWidth(): number {
        return this._width;
    }
    public override getHeight(): number {
        return this._height;
    }

    override set x(value: number) {
        this._x = value;
    }

    override set y(value: number) {
        this._x = value;
    }

    private setHeight(height: number) {
        this._height = height
        if (this._svgElement) {
            this._svgElement!.setAttribute('height', (height).toString());
            const svgRect = Array.from(this._svgElement!.getElementsByTagName!('rect'));
            svgRect.forEach(rect => {
                rect.setAttribute('height', (height).toString());
            });
        }
    }

    private setWidth(width: number) {
        this._width = width
        if (this._svgElement) {
            this._svgElement!.setAttribute('width', (width).toString());
            const svgRect = Array.from(this._svgElement!.getElementsByTagName!('rect'));
            svgRect.forEach(rect => {
                rect.setAttribute('width', (width).toString());
            });
        }
    }

    public replaceWithCustomElement(target: CustomElement, replacement: CustomElement): boolean {
        return this._findAndReplaceInTree(target, replacement);
    }

    getParentNode(target: CustomElement): RecursiveNode | null {
        for (const child of this._children) {
            if (child === target) {
                return this;
            } else if (child instanceof RecursiveNode) {
                const result = child.getParentNode(target);
                if (result) return result;
            }
        }
        return null;
    }

    private _findAndReplaceInTree(target: CustomElement, replacement: CustomElement): boolean {
        for (let i = 0; i < this._children.length; i++) {
            const child = this._children[i];

            // Match found
            if (child === target) {
                this._children[i] = replacement;
                return true;
            }

            // Recurse if child is a RecursiveNode
            if (child instanceof RecursiveNode) {
                const replaced = child._findAndReplaceInTree(target, replacement);
                if (replaced) return true;
            }
        }
        return false;
    }

    public getSvgReps() : SVGElement[] {
        const result: SVGElement[] = [];
        this._children.forEach(child => {
            if (child instanceof RecursiveNode) {
                result.push(...child.getSvgReps())
            }
        })
        result.push(this._svgElement!);
        return result;
    }

    getType(): RecursiveType {
        return this._type!;
    }
}