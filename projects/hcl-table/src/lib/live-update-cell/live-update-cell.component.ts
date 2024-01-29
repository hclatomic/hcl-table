import { Component, OnInit, OnChanges, Input, Output, SimpleChanges, EventEmitter } from '@angular/core';
import { StoreService } from '../store.service';
import { trigger, state, style, animate, transition, query, group } from '@angular/animations';


@Component({
  selector: 'live-update-cell',
  templateUrl: './live-update-cell.component.html',
  styleUrls: ['./live-update-cell.component.scss'],
  animations: [
    trigger('openClose', [
      state(
        'positive',
        style({ backgroundColor: '{{colorUp}}' }),
        { params: { colorUp: '#cfc' } }
      ),
      state(
        'negative',
        style({ backgroundColor: '{{colorDown}}' }),
        { params: { colorDown: '#fcc' } }
      ),
      state(
        'equal',
        style({ backgroundColor: '{{colorEqual}}' }),
        { params: { colorEqual: 'transparent' } }
      ),
      transition('* => *', [animate('300ms')]),
    ])
  ]
})
export class LiveUpdateCellComponent implements OnInit, OnChanges {

  @Input() val!: any;
  @Input() ref!: any;
  @Input() liveProp!: string;
  @Input() refProp!: string;
  @Input() options!: any;

  diff = 0;
  lastMove = 0;
  delta = 0;
  oldData: any = 0;

  constructor(
    public store: StoreService
  ) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.val) {
      return;
    }
    const row = this.store.olddata.filter((r: any) =>
      r[this.refProp] === this.ref && (r[this.liveProp] || r[this.liveProp] === 0))[0];

    if (!row) {
      const obj: any = {};
      obj[this.refProp] = this.ref;
      obj[this.liveProp] = this.val;
      this.oldData = this.val;
      this.store.olddata.push(obj);
      if (this.options.type === 'number') {
        this.diff = 0;
        this.delta = 0.000;
        this.lastMove = 0;
      }
      else if (this.options.type === 'text') {
        this.diff = 0;
      }
    }
    else {
      this.oldData = row[this.liveProp] ? row[this.liveProp] : null;
      if (this.options.type === 'number') {
        this.delta = this.val - (row[this.liveProp] ? row[this.liveProp] : this.val);
        this.delta = Math.round(this.delta * 100000) / 100000;
        this.diff = row[this.liveProp] > this.val ? -1 : row[this.liveProp] < this.val ? 1 : 0;
        this.lastMove = this.diff;
      }
      else if (this.options.type === 'text') {
        this.diff = row[this.liveProp] ? (row[this.liveProp] === this.val ? 0 : 1) : 0;
      }
      row[this.liveProp] = this.val;
      setTimeout(() => {
        this.diff = 0;
      }, this.options.flashBackground && this.options.flashBackground.delay || 1000);
    }

  }

}
