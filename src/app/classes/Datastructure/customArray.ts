import { CustomElement } from "./InductiveGraph/Elements/customElement";

export abstract class CustomArray<T> extends Array<T> {
    abstract remove(item: CustomElement): void;
    abstract updateElem(toRemove: CustomElement, toInsert: CustomElement): void;
}