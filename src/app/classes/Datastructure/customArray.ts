import { CustomElement } from "./InductiveGraph/Elements/element";

export abstract class CustomArray<T> extends Array<T> {
    abstract remove(item: CustomElement): any;
}