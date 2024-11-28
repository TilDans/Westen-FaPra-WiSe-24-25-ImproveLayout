import { Injectable } from '@angular/core';
import { EventLog } from '../../classes/datastructure/event-log/event-log';
import { InductiveMinerHelper } from './inductive-miner-helper';
import { ExclusiveCutChecker } from './cuts/exclusive-cut';
import { SequenceCutChecker } from './cuts/sequence-cut';
import { DFGEdge } from 'src/app/classes/datastructure/inductiveGraph/edgeElement';

@Injectable({
    providedIn: 'root',
})

export class InductiveMinerService {
    constructor(
        private helper: InductiveMinerHelper,
        private exclusiveCutChecker: ExclusiveCutChecker,
        private sequenceCutChecker: SequenceCutChecker
    ) {}

    public applyInductiveMiner(eventlog: EventLog, edges: DFGEdge[]): EventLog[] {
    const splitEventlogs: EventLog[] = this.sequenceCutChecker.checkSequenceCut(eventlog, edges);
    const checkExclusiveCut: EventLog[] = this.exclusiveCutChecker.checkExclusiveCut(eventlog, edges);
    
    return splitEventlogs;
    
    //...
    }
    
}