import { Injectable } from '@angular/core';
import { InductiveMinerHelper } from './inductive-miner-helper';
import { ExclusiveCutChecker } from './cuts/exclusive-cut';
import { SequenceCutChecker } from './cuts/sequence-cut';
import { ParallelCutChecker } from './cuts/parallel-cut';
import { LoopCutChecker } from './cuts/loop-cut';
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
        private sequenceCutChecker: SequenceCutChecker,
        private parallelCutChecker: ParallelCutChecker,
        private loopCutChecker: LoopCutChecker
    ) {}

    public applyInductiveMiner(eventlog: EventLog, edges: Edge[]): {el: EventLog[], cutMade: Cuts} {
        let splitEventlogs: EventLog[];
        let cutMade = '';

        const cutCheckers = [
            { checker: this.sequenceCutChecker.checkSequenceCut.bind(this.sequenceCutChecker), cutType: Cuts.Sequence },
            { checker: this.exclusiveCutChecker.checkExclusiveCut.bind(this.exclusiveCutChecker), cutType: Cuts.Exclusive },
            { checker: this.parallelCutChecker.checkParallelCut.bind(this.parallelCutChecker), cutType: Cuts.Parallel },
            { checker: this.loopCutChecker.checkLoopCut.bind(this.loopCutChecker), cutType: Cuts.Loop }
        ];
          
        for (const { checker, cutType } of cutCheckers) {
            const splitEventlogs = checker(eventlog, edges);
            if (splitEventlogs.length !== 0) {
                return { el: splitEventlogs, cutMade: cutType };
            }
        }
        throw new Error ('no cut possible');
    }
    
}