import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, HostListener, ViewChild, ElementRef } from '@angular/core';

import { StoreService } from './store.service';
import { SelectionService } from './selection.service';
import { HttpClient } from '@angular/common/http';

interface LiveUpdateOptions {
  type: string;             // ['number', 'text']
  showOldValue?: boolean;   // show old value
  showDelta?: boolean;      // show delta between old and new value
  flashBackground?: {
    up?: string;            // default is '#fcc'
    down?: string;          // default is '#cfc'
    equal?: string;         // default is 'transparent'
    delay?: number;         // duration of the flash background, in ms
  };
  css?: {                   // css classes for the content of flashing cells
    newValue?: string;
    oldValue?: string;
    delta?: {
      up?: string;
      down?: string;
      equal?: string;
    };
  };
};

interface ServerOptions {
  sort?: {
    dataProp: string,
    dir: string;
  },
  search?: [
    {
      dataProp: string,
      searchString: string;
    },
  ],
  paging?: {
    pageLength: number,
    requestPage: number;
  };
}

interface ApiReturn {
  data: any[];
  paging: {
    totalAvailableRows: number;
    pageLength: number;
    currentPage: number;
  };
}

interface FilterReturn {
  value: any;
  css?: string;
}

interface UpdateServerReturn {
  succes: boolean;
  message?: string;
}


@Component({
  selector: 'hcl-table',
  templateUrl: './tbl.component.html',
  styleUrls: ['./tbl.component.scss'],
  providers: [StoreService, SelectionService],
})
export class TblComponent implements OnInit, OnChanges {

  @Input() def: any = { cols: [] };
  @Input() data: any[] = [];
  @Input() subrowData: any[] = [];
  @Output() output = new EventEmitter<any>();

  @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    this.selection.onKeydownHandler(event);
  }
  @HostListener('document:keyup', ['$event']) onKeyUpHandler(event: KeyboardEvent) {
    this.selection.onKeyUpHandler(event);
  }

  @ViewChild('table') table!: ElementRef;
  @ViewChild('tbody') tbody!: ElementRef;

  newDef: any = { cols: [] };
  currentPage = 1;
  totalPages = 1;
  paginatorPosition = ['bottom', 'center'];
  allSubrowsOpen = false;
  serverOptions: any = {};

  lastRowOpen: any = {};

  serverPending = false;
  serverMessage = '';
  tDisplayserverMessage = 1500;
  transactionSuccess = true;

  currentScroll = 0;

  constructor(
    public store: StoreService,
    public selection: SelectionService,
    private http: HttpClient
  ) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['def'] && changes['def'].currentValue && changes['def'].currentValue.cols) {

      this.def.cols.map((item: any) => { item.ctx = {}; });
      this.store.def = this.def;

      if (this.store.def.paging && this.store.def.paging.position) {
        this.paginatorPosition = this.store.def.paging.position.split('-');
      }
      if (this.store.def.serverData) {
        this.currentPage = this.store.def.serverData.options && this.store.def.serverData.options.paging ?
          this.store.def.serverData.options.paging.requestPage :
          this.currentPage;
      }

      this.callForData();

    }


    if (changes['data'] && changes['data'].currentValue) {

      if (changes['data'].currentValue.data) {
        this.data = changes['data'].currentValue.data;
      }
      else {
        this.data = changes['data'].currentValue;
      }

      //indexing _______________________________________________________
      let n = 0;
      for (const row of this.data) {
        row.ctx = {
          row: n,
          editing: [],
          toConfirm: [],
          filtered: {},
        };
        n++;
      }

      if (changes['data'].currentValue.data) {
        //paging  _______________________________________________________
        if (this.store.def.paging) {
          const l = this.data.length;
          const m = this.store.def.paging.pageLength;
          this.totalPages = this.def.serverData ? Math.ceil(this.def.paging.totalAvailableRows / m) : Math.ceil(l / m);
          this.currentPage = this.def.serverData ? this.def.paging.currentPage : this.currentPage;
        }
      }
      else {

        //paging  _______________________________________________________
        if (this.store.def.paging) {
          const l = this.data.length;
          const m = this.store.def.paging.pageLength;
          this.totalPages = Math.ceil(l / m);
          this.currentPage = this.store.def.paging.currentPage || 1;
        }
      }
      const ref = this.store.def.liveUpdateReference;
      if (!ref && this.data.length || (ref && !this.store.data.length)) {
        this.store.data = JSON.parse(JSON.stringify(this.data));
      }
      else if (ref && this.store.data.length) {
        //console.log(this.store.data);
        for (const row of this.data) {
          const r = this.store.data.filter((item: any) => item[ref] === row[ref])[0];
          for (const prop in row) {
            if (prop === ref || prop === 'ctx') {
              continue;
            }
            r[prop] = row[prop];
          }
        }
      }
      this.selectRowsToDisplay();
    }
  }

  selectRowsToDisplay() {

    //liveUpdate _____________________________________________________
    if (this.store.def.liveUpdateReference && this.store.rowsToDisplay.length) {
      for (const row of this.data) {
        const ref = this.store.def.liveUpdateReference;
        const rd = this.store.rowsToDisplay.filter((r: any) => r[ref] == row[ref])[0];
        for (const prop in row) {
          if (prop === ref || prop === 'ctx') {
            continue;
          }
          rd[prop] = row[prop];
        }
      }
    }
    else {

      let ini = JSON.parse(JSON.stringify(this.store.data));



      if (!this.store.def.serverData) {
        //searching ______________________________________________________
        for (const col of this.store.def.cols) {
          if (col.ctx.searchString) {
            const reg = new RegExp(col.ctx.searchString, 'gi');
            ini = ini.filter((row: any) => {
              if (row[col.dataProp].match(reg)) {
                return row;
              }
            });
          }
        }
        //sorting ______________________________________________________
        for (const col of this.store.def.cols) {
          switch (col.ctx.sortOrder) {
            case 'up':

              ini.sort((a: any, b: any) => {
                if (typeof a[col.dataProp] === 'string') {
                  return a[col.dataProp].toLowerCase().replace(/[ ]/g, '') > b[col.dataProp].toLowerCase().replace(/[ ]/g, '') ? -1 : 1;
                }
                else {
                  return a[col.dataProp] > b[col.dataProp] ? -1 : 1;
                }
              });
              break;
            case 'down':
              ini.sort((a: any, b: any) => {
                if (typeof a[col.dataProp] === 'string') {
                  return a[col.dataProp].toLowerCase().replace(/[ ]/g, '') < b[col.dataProp].toLowerCase().replace(/[ ]/g, '') ? -1 : 1;
                }
                else {
                  return a[col.dataProp] < b[col.dataProp] ? -1 : 1;
                }
              });
              break;
            default: break;
          }
        }

        //paging _______________________________________________________
        if (this.store.def.paging) {
          const l = ini.length;
          const m = this.store.def.paging.pageLength;
          this.totalPages = Math.ceil(l / m);
          const min = (this.currentPage - 1) * this.store.def.paging.pageLength;
          const max = min + this.store.def.paging.pageLength;
          ini = ini.slice(min, max);
        }

      }


      //filtering ____________________________________________________
      for (const col of this.store.def.cols) {
        if (col.filter) {
          for (const row of ini) {
            row.ctx.filtered[col.dataProp] = row[col.dataProp];
            const res = col.filter(row[col.dataProp]);
            if (!res.value) {
              console.error('hcl-table error: a filter function must return an object of type {value: any, css?: string}');
            }
            row[col.dataProp] = {
              value: res.value || res,
              css: res.css || ''
            };
          }
        }
        if (col.editable && col.editable.type === 'date') {
          for (const row of ini) {
            row.ctx.jsDate = this.filterDate(row[col.dataProp], col.editable.format);
            row.ctx.dateIni = row[col.dataProp];
          }
        }
      }

      //subrows _____________________________________________________
      for (const col of this.store.def.cols) {
        if (col.type === 'subrow') {
          for (const row of ini) {
            row.ctx.open = row.ctx.open ? row.ctx.open : false;
          }
        }
      }
      //console.log(ini);

      this.store.rowsToDisplay = ini;
    }



  }

  getSeparator(format: string) {
    const str = format.replace(/mm/, '').replace(/dd/, '').replace(/yyyy/, '');
    let arr = str.split('');
    return arr[0];

  }
  filterDate(date: string, format: string) {

    const separator = this.getSeparator(format);
    const reg = new RegExp('[0-9]{2}' + separator + '[0-9]{2}' + separator + '[0-9]{4}');
    const arr = date.split(separator);
    if (date.match(reg)) {
      if (format === 'mm' + separator + 'dd' + separator + 'yyyy') {
        const y = arr[2];
        const m = arr[0];
        const d = arr[1];
        return y + '-' + m + '-' + d;

      }
      else if (format === 'dd' + separator + 'mm' + separator + 'yyyy') {
        const y = arr[2];
        const m = arr[1];
        const d = arr[0];
        return y + '-' + m + '-' + d;
      }
    }
    return '';
  }

  unFilterDate(date: string, format: string) {
    const separator = this.getSeparator(format);
    const arr = date.split('-');
    const y = arr[0];
    const m = arr[1];
    const d = arr[2];
    if (format === 'mm' + separator + 'dd' + separator + 'yyyy') {
      return m + separator + m + separator + y;

    }
    else if (format === 'dd' + separator + 'mm' + separator + 'yyyy') {
      return d + separator + m + separator + y;
    }
    return '';
  }

  makeServerOptions() {
    const options: any = { search: [] };
    for (const col of this.store.def.cols) {
      if (col.ctx.sortOrder && col.ctx.sortOrder !== 'none') {
        options.sort = {
          dataProp: col.dataProp,
          sortOrder: col.ctx.sortOrder
        };
        if (this.store.def.serverData.virtualScroll) {
          this.data = [];
        }
      }
      if (col.ctx.searchString) {
        options.search.push(
          {
            dataProp: col.dataProp,
            searchString: col.ctx.searchString
          }
        );
        if (this.store.def.serverData.virtualScroll) {
          this.data = [];
        }
      }
    }
    if (this.store.def.serverData) {
      let pl = this.store.def.serverData.options.paging.pageLength ? this.store.def.serverData.options.paging.pageLength : 1;
      if (this.store.def.serverData.virtualScroll && !this.data.length) {
        pl = pl * 3;
      }
      options.paging = {
        pageLength: pl,
        requestPage: this.currentPage
      };

    }
    else if (this.store.def.paging) {
      options.paging = {
        pageLength: this.store.def.paging.pageLength,
        requestPage: this.currentPage
      };
    }
    return options;
  }

  callForData() {
    if (this.store.def.serverData) {
      if (this.def.serverData.method === 'get') {

        const options = this.makeServerOptions();
        let str = '';
        if (options.paging) {
          str += '&pagingPageLength=' + options.paging.pageLength || '';
          str += '&pagingRequestPage=' + options.paging.requestPage || '';
        }
        if (options.sort) {
          str += '&sortOrder=' + options.sort.sortOrder || '';
          str += '&sortDataProp=' + options.sort.dataProp || '';
        }
        if (options.search && options.search.length) {
          for (let i = 0; i < options.search.length; i++) {
            str += '&searchDataProp_' + i + '=' + options.search[i].dataProp;
            str += '&searchSearchString_' + i + '=' + options.search[i].searchString;
          }
        }
        str = str.replace(/^&/, '?');

        this.http.get(this.def.serverData.url + str).subscribe((res: any) => {
          this.setupData(res, options);
        });

      }
      else if (this.def.serverData.method === 'post') {
        const options = this.makeServerOptions();
        this.http.post(this.def.serverData.url, options || {}).subscribe((res: any) => {
          this.setupData(res, options);
        });

      }

    }
    else {
      const obj = {
        request: 'data', //data | subdata
        tableId: this.store.def.id, //subtableId if subdata
        options: this.makeServerOptions()
      };
      this.output.emit(obj);
    }

  }

  setupData(res: any, options: any) {

    if (!res.data || !res.paging) {
      console.error('hcl-table error: when using the serverData mode, the return of the API must be an object of the following type \n' +
        '{\n   data: any[];\n   paging: {\n     totalAvailableRows: number;\n     pageLength: number;\n     currentPage: number;\n   }\n}');

      return;
    }

    this.data = res.data;
    //indexing _______________________________________________________
    let start = 0;
    if (res.paging) {
      this.store.def.paging = res.paging;
      start = this.store.def.paging.pageLength * (this.store.def.paging.currentPage - 1);
    }
    let n = 0;
    for (const row of this.data) {
      row.ctx = {
        row: n + start,
        editing: [],
        toConfirm: [],
        filtered: {}
      };
      n++;
    }
    //paging  _______________________________________________________
    if (res.paging) {
      const l = res.paging.totalAvailableRows;
      const m = res.paging.pageLength;
      this.totalPages = Math.ceil(l / m);
      this.currentPage = res.paging.currentPage;
    }
    this.store.data = this.data;

    this.selectRowsToDisplay();

  }

  toggleSort(col: number, dir: string) {
    for (let c = 0; c < this.store.def.cols.length; c++) {
      if (c === col) {
        this.store.def.cols[col].ctx.sortOrder = this.store.def.cols[col].ctx.sortOrder === dir ? 'none' : dir;
      }
      else {
        this.store.def.cols[c].ctx.sortOrder = 'none';
      }
    }
    if (this.store.def.serverData) {
      this.currentPage = 1;
      this.callForData();
    }
    else {
      this.selectRowsToDisplay();
    }
  }

  goSearch(col: any) {
    //console.log(col);
    if (this.store.def.serverData) {
      this.callForData();
    }
    else {
      this.selectRowsToDisplay();
    }
  }

  changePage(curpage: any) {
    this.currentPage = curpage;
    if (this.store.def.serverData) {
      this.callForData();
    }
    else {
      this.selectRowsToDisplay();
    }
  }

  cellClicked(row: number, col: number) {
    if (this.store.def.cols[col].type === 'subrow') {
      const r = this.store.rowsToDisplay[row];
      r.ctx.open = !r.ctx.open;
    }
    else if (this.store.def.cols[col].clickable) {
      const id = this.store.rowsToDisplay[row].ctx.row;
      const r = JSON.parse(JSON.stringify(this.store.data[id]));
      delete r.ctx;
      this.output.emit({
        request: 'cell-clicked',
        tableId: this.store.def.id,
        row: r,
        col: this.store.def.cols[col].dataProp
      });
    }
  }

  toggleOpenCloseAll() {
    this.allSubrowsOpen = !this.allSubrowsOpen;
    this.store.rowsToDisplay.map((row: any) => {
      row.ctx.open = this.allSubrowsOpen;
    });
    this.store.data.map((row: any) => {
      row.ctx.open = this.allSubrowsOpen;
    });
  }

  outputFromTable(e: any) {
    this.output.emit(e);
  }

  onScroll(e: any) {
    if (
      this.serverPending ||
      !this.store.def.serverData ||
      (this.store.def.serverData && !this.store.def.serverData.virtualScroll) ||
      !this.store.rowsToDisplay.length
    ) {
      return;
    }
    const tbh = this.tbody.nativeElement.offsetHeight;
    const a = Math.round(tbh / e.target.scrollTop);
    const pl = this.def.serverData ? this.def.serverData.options.paging.pageLength : this.store.def.paging ? this.store.def.paging : 0;

    if (a === 1) {
      this.currentPage++;
      const options = this.makeServerOptions();
      this.serverPending = true;
      this.http.post(this.def.serverData.url, options || {}).subscribe((res: any) => {
        this.data = this.data.concat(res.data);
        if (this.data.length > pl * 3) {
          this.data.splice(0, pl);
        }
        let n = 0;
        for (const row of this.data) {
          row.ctx = {
            row: n,
            editing: [],
            toConfirm: [],
            filtered: {}
          };
          n++;
        }
        this.store.data = this.data;
        this.selectRowsToDisplay();
        e.target.scrollTop = tbh / 3;
        this.serverPending = false;
      });
    }
    else if (this.currentPage > 1 && a > 5) {
      this.currentPage--;

      const options = this.makeServerOptions();
      this.http.post(this.def.serverData.url, options || {}).subscribe((res: any) => {
        this.data = res.data.concat(this.data);
        if (this.data.length > pl * 3) {
          this.data.splice(this.data.length - 1 - pl, pl);
        }
        let n = 0;
        for (const row of this.data) {
          row.ctx = {
            row: n,
            editing: [],
            toConfirm: [],
            filtered: {}
          };
          n++;
        }
        this.store.data = this.data;
        this.selectRowsToDisplay();
        e.target.scrollTop = 2 * tbh / 3;
        this.serverPending = false;
      });

    }
  }

  editCell(r: number, c: number) {
    const row = this.store.rowsToDisplay[r];
    if (!row.ctx.editing.includes(c)) {
      row.ctx.editing.push(c);
    }
  }

  updateCtx(row: any, c: number, idx: number) {
    if (row.ctx.editing.includes(c)) {
      row.ctx.editing.splice(idx, 1);
    }
    if (row.ctx.toConfirm.includes(c)) {
      row.ctx.toConfirm.splice(idx, 1);
    }
  }

  cancelEdit(r: number, c: number) {
    const row = this.store.rowsToDisplay[r];
    const col = this.store.def.cols[c];
    const idx = row.ctx.editing.findIndex((item: any) => item === c);
    setTimeout(() => {
      if (!col.filter) {
        const i = this.store.data.findIndex((item: any) => item.ctx.row === row.ctx.row);
        row[col.dataProp] = this.store.data[i][col.dataProp];
      }
      else {
        const i = this.store.data.findIndex((item: any) => item.ctx.row === row.ctx.row);
        row.ctx.filtered[col.dataProp] = this.store.data[i][col.dataProp];
      }

    }, 10);

    this.updateCtx(row, c, idx);
  }

  validateEdit(r: number, c: number) {
    const row = this.store.rowsToDisplay[r];
    const col = this.store.def.cols[c];
    const idx = row.ctx.editing.findIndex((item: any) => item === c);

    if (col.editable.confirm && !row.ctx.toConfirm.includes(c)) {
      row.ctx.toConfirm.push(c);
      return;
    }

    const final = JSON.parse(JSON.stringify(row));

    if (col.filter) {
      final[col.dataProp] = row.ctx.filtered[col.dataProp];
    }

    let val = '';
    if (col.editable.type === 'date') {
      val = this.unFilterDate(row.ctx.jsDate, col.editable.format);
      final[col.dataProp] = val;
    }

    const obj = {
      request: 'data-change',
      tableId: this.store.def.id,
      row: final,
      col: col.dataProp
    };

    if (col.editable.serverValidation) {
      delete final.ctx;
      this.http.post(col.editable.serverValidation, obj).subscribe((res: any) => {
        if (res.succes) {
          if (col.filter) {
            row[col.dataProp] = col.filter(row.ctx.filtered[col.dataProp]);
            this.store.data[row.ctx.row][col.dataProp] = row.ctx.filtered[col.dataProp];
          }
          else {
            this.store.data[row.ctx.row][col.dataProp] = row[col.dataProp];
          }
          this.updateCtx(row, c, idx);
          this.transactionSuccess = true;
          this.serverMessage = res.message ? res.message : 'Update registered by server';
          setTimeout(() => {
            this.serverMessage = '';
          }, this.tDisplayserverMessage);
        }
        else {
          this.serverMessage = res.message ? res.message : 'The server refused the update';
          this.transactionSuccess = false;
          console.error('hcl-table error: update server failed registering object:', obj);
          this.cancelEdit(r, c);
        }
      });
    }
    else {
      this.output.emit(obj);
      if (col.filter) {
        row[col.dataProp] = col.filter(row.ctx.filtered[col.dataProp]);
      }
      if (col.editable.type === 'date') {
        row[col.dataProp] = val;
        this.store.data[row.ctx.row][col.dataProp] = val;
        row.ctx.dateIni = val;
      }
      this.updateCtx(row, c, idx);
    }

  }

}