export class TraceEvent {
    private readonly _conceptName: string

    constructor(conceptName: string) {
        this._conceptName = conceptName
    }

    get conceptName(): string {
        return this._conceptName
    }
}
