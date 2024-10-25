import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ParserService} from './services/parser.service';
import {DisplayService} from './services/display.service';
import { XmlParserService } from './services/xml-parser.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {

    public textareaFc: FormControl;

    /* constructor(private _parserService: ParserService,
                private _displayService: DisplayService) {
        this.textareaFc = new FormControl();
        this.textareaFc.disable();
    } */
    constructor(private _parserService: XmlParserService,
        private _displayService: DisplayService) {
        this.textareaFc = new FormControl();
        this.textareaFc.disable();
    }

    public processSourceChange(newSource: string) {
        this.textareaFc.setValue(newSource);

        //const result = this._parserService.parse(newSource);
        const result = this._parserService.parseXml('src/assets/example.xes');
        if (result !== undefined) {
            this._displayService.display(result);
        }
    }
}
