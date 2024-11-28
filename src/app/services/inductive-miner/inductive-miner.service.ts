import { Injectable } from '@angular/core';
import { EventLog } from '../../classes/event-log/event-log';
import { Trace } from '../../classes/event-log/trace';
import { InductiveMinerHelper } from './inductive-miner-helper';
import { ExclusiveCutChecker } from './cuts/exclusive-cut';
import { SequenceCutChecker } from './cuts/sequence-cut';

@Injectable({
    providedIn: 'root',
})

export class InductiveMinerService {
    constructor(
        private helper: InductiveMinerHelper,
        private exclusiveCutChecker: ExclusiveCutChecker,
        private sequenceCutChecker: SequenceCutChecker
    ) {}

    public applyInductiveMiner(eventlog: EventLog, edges: Trace[]): EventLog[] {
    const splitEventlogs: EventLog[] = this.checkSequenceCut(eventlog, edges); // WIP
    //const checkExclusiveCut: EventLog[] = this.checkExclusiveCut(eventlog, edges[0].events); // Hier erstmal aus mit UI-Kanten weitermachen
    
    return splitEventlogs;
    
    //...
    }
    
}