import { BehaviorSubject } from "rxjs";
import { CustomElement } from "../Elements/element";
import { CustomArray } from "../../customArray";

export class PetriLayer extends CustomArray<CustomElement>{
    private _minX = 0;

    private _maxX = 0;

    override remove(item: CustomElement) {
        const index = this.findIndex(element => element === item);
        // Warum zweimal index?
        this.slice(index, index);
    }

    override updateElem(toRemove: CustomElement, toInsert: CustomElement): void {
        const index = this.findIndex(element => element === toRemove);
        this[index] = toInsert;
    }


    public get minX() {
        return this._minX;
    }
    public set minX(value) {
        this._minX = value;
    }
    public get maxX() {
        return this._maxX;
    }
    public set maxX(value) {
        this._maxX = value;
    }
}
