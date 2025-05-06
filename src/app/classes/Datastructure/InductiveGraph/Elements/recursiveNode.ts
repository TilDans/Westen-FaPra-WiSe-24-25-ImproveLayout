import { LayoutDirection } from "../../enums"; // Enum indicating layout orientation (horizontal or vertical)
import { InductivePetriNet } from "../inductivePetriNet"; // Contains layout offsets (horizontal/vertical)
import { CustomElement } from "./customElement"; // Base class for visual elements

/**
 * Represents a recursive layout node that can contain other CustomElements,
 * including other RecursiveNodes, allowing for nested hierarchical layouting.
 */
export class RecursiveNode extends CustomElement {
    private _children: CustomElement[]; // Child elements of this node
    private _type: LayoutDirection | undefined; // Layout orientation (horizontal or vertical)
    private _height: number = 0; // Cached computed height of the node
    private _width: number = 0; // Cached computed width of the node

    constructor(children: CustomElement[], type?: LayoutDirection) {
        super();
        this._children = children;
        this._type = type;
    }

    /**
     * Must be implemented: Returns the center (x, y) coordinates of this node.
     */
    public override getCenterXY(): { x: number; y: number; } {
        throw new Error("Method not implemented.");
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

        let currentX = x;
        let currentY = y;

        switch (this._type) {
            case LayoutDirection.Horizontal:
                this._children.forEach(child => {
                    const childHeight = child.getHeight();
                    // Vertically center-align child within this node
                    const yAligned = y + (this._height - childHeight) / 2;
                    child.setXYonSVG(currentX, yAligned);
                    console.log("setting xy", currentX, yAligned, child)

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

        switch (this._type) {
            case LayoutDirection.Horizontal:
                // Total width is sum of children's widths + spacing
                this._width = childrenSizes.reduce((sum, childSize) => sum + childSize.width, 0)
                              + (childrenSizes.length - 1) * InductivePetriNet.horizontalOffset;
                // Height is max of children's heights
                this._height = Math.max(...childrenSizes.map(s => s.height));
                break;

            case LayoutDirection.Vertical:
                // Width is max of children's widths
                this._width = Math.max(...childrenSizes.map(childSize => childSize.width));
                // Total height is sum of children's heights + spacing
                this._height = childrenSizes.reduce((sum, s) => sum + s.height, 0)
                               + (childrenSizes.length - 1) * InductivePetriNet.verticalOffset;
                break;

            default:
                // If no layout direction is defined, use the first child's size as fallback
                return { width: childrenSizes[0].width, height: childrenSizes[0].height };
        }

        return { width: this._width, height: this._height };
    }

    public override setXYonSVG(xNew: number, yNew: number): void {
        this._x = xNew;
        this._y = yNew;
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

    public replaceWithCustomElement(target: CustomElement, replacement: CustomElement): boolean {
        return this._findAndReplaceInTree(target, replacement);
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
}