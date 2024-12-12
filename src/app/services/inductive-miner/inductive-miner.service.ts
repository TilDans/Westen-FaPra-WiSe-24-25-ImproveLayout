import { Injectable } from '@angular/core';
import { InductiveMinerHelper } from './inductive-miner-helper';
import { ExclusiveCutChecker } from './cuts/exclusive-cut';
import { SequenceCutChecker } from './cuts/sequence-cut';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';


@Injectable({
    providedIn: 'root',
})

export class InductiveMinerService {
    constructor(
        private helper: InductiveMinerHelper,
        private exclusiveCutChecker: ExclusiveCutChecker,
        private sequenceCutChecker: SequenceCutChecker
    ) {}

    public applyInductiveMiner(eventlog: EventLog, edges: Edge[]): EventLog[] {
        let splitEventlogs: EventLog[];
        
        splitEventlogs = this.sequenceCutChecker.checkSequenceCut(eventlog, edges);
        if (splitEventlogs.length == 0) {
            splitEventlogs = this.exclusiveCutChecker.checkExclusiveCut(eventlog, edges);
        }
    
        return splitEventlogs;
    
    //...
    }
    
}