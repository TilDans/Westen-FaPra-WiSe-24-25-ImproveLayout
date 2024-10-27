import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {DisplayService} from './services/display.service';
import {XmlParserService} from './services/xml-parser.service';
import {TextParserService} from "./services/text-parser.service";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {

    public textareaFc: FormControl;

    constructor(private _xmlParserService: XmlParserService,
                private _displayService: DisplayService,
                private _textParserService: TextParserService) {
        this.textareaFc = new FormControl();
        this.textareaFc.disable();
    }

    public processSourceChange(newSource: string) {
        this.textareaFc.setValue(newSource);

        const result = this._xmlParserService.parseXml(newSource)
        if (result !== undefined) {
            this._displayService.display(result);
        }
    }

    parseEventLog(newEventLog: string) {
        const result = this._textParserService.parse(newEventLog);
        if(result) {
            this._displayService.display(result);
        }
    }
}
