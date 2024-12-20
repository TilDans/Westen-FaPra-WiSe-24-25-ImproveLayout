import { BehaviorSubject } from "rxjs";
import { CustomElement } from "../Elements/element";
import { CustomArray } from "../../customArray";

export class PetriLayer extends CustomArray<CustomElement>{
    
    override remove(item: CustomElement) {
        const index = this.findIndex(element => element === item);
        this.slice(index, index);
    }

    override updateElem(toRemove: CustomElement, toInsert: CustomElement): void {
        const index = this.findIndex(element => element === toRemove);
        this[index] = toInsert;
    }

}