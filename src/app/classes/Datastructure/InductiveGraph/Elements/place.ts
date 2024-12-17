import { CustomElement } from "./element";

export class Place extends CustomElement {
    constructor(name: string) {
        super();
        this.id = name;
    }
}