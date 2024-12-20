import { Injectable } from '@angular/core';
import { InductiveMinerHelper } from './inductive-miner-helper';
import { ExclusiveCutChecker } from './cuts/exclusive-cut';
import { SequenceCutChecker } from './cuts/sequence-cut';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Cuts } from 'src/app/classes/Datastructure/enums';


@Injectable({
    providedIn: 'root',
})

export class InductiveMinerService {
    constructor(
        private helper: InductiveMinerHelper,
        private exclusiveCutChecker: ExclusiveCutChecker,
        private sequenceCutChecker: SequenceCutChecker
    ) {}

    public applyInductiveMiner(eventlog: EventLog, edges: Edge[]): {el: EventLog[], cutMade: Cuts} {
        let splitEventlogs: EventLog[];
        let cutMade = '';

        //SEQUENCE
        splitEventlogs = this.sequenceCutChecker.checkSequenceCut(eventlog, edges);
        if (splitEventlogs.length != 0) {
            return {el: splitEventlogs, cutMade: Cuts.Sequence}
        }

        //EXCLUSIVE
        splitEventlogs = this.exclusiveCutChecker.checkExclusiveCut(eventlog, edges);
        if (splitEventlogs.length != 0) {
            return {el: splitEventlogs, cutMade: Cuts.Exclusive}
        }

        /* //PARALLEL
        splitEventlogs = this.parallelCutChecker.checkParallelCut(eventlog, edges);
        if (splitEventlogs.length != 0) {
            return {el: splitEventlogs, cutMade: Cuts.Sequence}
        } */

        /* //LOOP
        splitEventlogs = this.loopCutChecker.checkLoopCut(eventlog, edges);
        if (splitEventlogs.length != 0) {
            return {el: splitEventlogs, cutMade: Cuts.Sequence}
        } */
        
        throw new Error ('no cut possible');
    }
    
}