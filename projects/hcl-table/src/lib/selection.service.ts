import { Injectable } from '@angular/core';
import { StoreService } from './store.service';

@Injectable()
export class SelectionService {

  zone: any = {
    rowA: -1,
    colA: -1,
    rowB: -1,
    colB: -1
  };
  zoneStarted = false;

  rowMouseOver = -1;
  colMouseOver = -1;

  keys: any = {};
  reservedKeycodes = [
    'ControlLeft', 'ControlRight', 'Space', 'ShiftLeft', 'ShiftRight',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'KeyQ', 'KeyC'
  ];

  currCursor: any = { row: -1, col: -1 };
  baseCursor: any = { row: -1, col: -1 };

  constructor(
    public store: StoreService
  ) { }


  pointCell(r: number, c: number) {
    if (this.store.def.cols[c].type !== 'subrow') {
      if (this.store.def.mouseHighlight) {
        if (this.store.def.mouseHighlight.row) {
          this.rowMouseOver = r;
        }
        if (this.store.def.mouseHighlight.col) {
          this.colMouseOver = c;
        }
        this.store.ctx.pointedCell = { row: r, col: c };
      }
    }
  }

  start(r: number, c: number) {
    this.baseCursor = { row: r, col: c };
    this.currCursor = { row: r, col: c };
    this.zone = {
      rowA: r,
      colA: c,
      rowB: r,
      colB: c
    };
    this.zoneStarted = true;
  }

  end(r: number, c: number) {
    this.move(r, c);
    this.zoneStarted = false;
  }

  move(r: number, c: number) {
    if (this.zoneStarted) {
      this.currCursor = { row: r, col: c };

      if (this.baseCursor.row < this.currCursor.row) {
        this.zone.rowA = this.baseCursor.row;
        this.zone.rowB = this.currCursor.row;
      }
      else {
        this.zone.rowA = this.currCursor.row;
        this.zone.rowB = this.baseCursor.row;
      }
      if (this.baseCursor.col < this.currCursor.col) {
        this.zone.colA = this.baseCursor.col;
        this.zone.colB = this.currCursor.col;
      }
      else {
        this.zone.colA = this.currCursor.col;
        this.zone.colB = this.baseCursor.col;
      }

    }
  }

  onKeydownHandler(event: KeyboardEvent) {
    const str = String(event.target);
    if (
      !this.store.def.selectable ||
      (str.match(/HTMLInputElement/) || str.match(/HTMLTextAreaElement/)) ||
      (!this.reservedKeycodes.includes(event.code) || (!this.keys.control && event.code === 'KeyQ'))
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    switch (event.code) {
      case 'ControlLeft': this.keys.control = true; break;
      case 'ControlRight': this.keys.control = true; break;
      case 'Space': this.keys.space = true; break;
      case 'ShiftLeft': this.keys.shift = true; break;
      case 'ShiftRight': this.keys.shift = true; break;
      case 'ArrowUp': this.keys.arrowUp = true; break;
      case 'ArrowDown': this.keys.arrowDown = true; break;
      case 'ArrowLeft': this.keys.arrowLeft = true; break;
      case 'ArrowRight': this.keys.arrowRight = true; break;
      case 'KeyQ': this.keys.keyA = true; break;
      case 'KeyC': this.keys.keyC = true; break;
      case 'Escape': this.keys.escape = true; break;
    }
    const n = this.store.def.cols.length - 1;
    if (this.keys.control && this.keys.shift && this.keys.arrowRight) {
      this.currCursor.col++;
      this.currCursor.col = this.currCursor.col > n ? n : this.currCursor.col;
      this.move(this.currCursor.row, this.currCursor.col);
    }
    else if (this.keys.control && this.keys.shift && this.keys.arrowLeft) {
      this.currCursor.col--;
      this.currCursor.col = this.currCursor.col < 0 ? 0 : this.currCursor.col;
      this.move(this.currCursor.row, this.currCursor.col);
    }
    else if (this.keys.control && this.keys.shift && this.keys.arrowUp) {
      this.currCursor.row--;
      this.currCursor.row = this.currCursor.row < 0 ? 0 : this.currCursor.row;
      this.move(this.currCursor.row, this.currCursor.col);
    }
    else if (this.keys.control && this.keys.shift && this.keys.arrowDown) {
      const n = this.store.def.cols.length - 1;
      this.currCursor.row++;
      this.currCursor.row = this.currCursor.row > n ? n : this.currCursor.row;
      this.move(this.currCursor.row, this.currCursor.col);
    }
    else if (this.keys.control && this.keys.shift) {
      if (!this.store.ctx.pointedCell) {
        return;
      }
      this.zoneStarted = true;
      this.baseCursor = { row: this.store.ctx.pointedCell.row, col: this.store.ctx.pointedCell.col };
      this.currCursor = { row: this.store.ctx.pointedCell.row, col: this.store.ctx.pointedCell.col };
      this.move(this.store.ctx.pointedCell.row, this.store.ctx.pointedCell.col);
    }
    else if (this.keys.control && this.keys.space) {
      if (!this.store.ctx.pointedCell) {
        return;
      }
      this.selectCol(this.store.ctx.pointedCell.col);
    }
    else if (this.keys.shift && this.keys.space) {
      if (!this.store.ctx.pointedCell) {
        return;
      }
      this.selectRow(this.store.ctx.pointedCell.row);
    }
    else if (this.keys.control && this.keys.keyA) {
      this.selectTable();
    }
    else if (this.keys.control && this.keys.keyC) {
      this.copyZone();
    }
    else if (this.keys.escape) {
      this.clear();
    }

  }

  onKeyUpHandler(event: KeyboardEvent) {
    const str = String(event.target);
    if (
      !this.store.def.selectable ||
      (str.match(/HTMLInputElement/) || str.match(/HTMLTextAreaElement/)) ||
      !this.reservedKeycodes.includes(event.code)
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    switch (event.code) {
      case 'ControlLeft': this.keys.control = false; this.zoneStarted = false; break;
      case 'ControlRight': this.keys.control = false; this.zoneStarted = false; break;
      case 'Space': this.keys.space = false; break;
      case 'ShiftLeft': this.keys.shift = false; break;
      case 'ShiftRight': this.keys.shift = false; break;
      case 'ArrowUp': this.keys.arrowUp = false; break;
      case 'ArrowDown': this.keys.arrowDown = false; break;
      case 'ArrowLeft': this.keys.arrowLeft = false; break;
      case 'ArrowRight': this.keys.arrowRight = false; break;
      case 'KeyQ': this.keys.keyA = false; break;
      case 'KeyC': this.keys.keyC = false; break;
      case 'Escape': this.keys.escape = false; break;
    }
  }

  selectCol(col: any) {
    this.zone = {
      rowA: 0,
      rowB: this.store.rowsToDisplay.length - 1,
      colA: col,
      colB: col
    };
  }
  selectRow(row: any) {
    this.zone = {
      rowA: row,
      rowB: row,
      colA: 0,
      colB: this.store.def.cols.length - 1
    };
  }
  selectTable() {
    this.zone = {
      rowA: 0,
      rowB: this.store.rowsToDisplay.length - 1,
      colA: 0,
      colB: this.store.def.cols.length - 1
    };
  }

  copyZone() {
    if (this.zone.rowA < 0 || this.zone.rowB < 0 || this.zone.colA < 0 || this.zone.colB < 0) {
      return;
    }
    let str = '';
    for (let r = this.zone.rowA; r <= this.zone.rowB; r++) {
      for (let c = this.zone.colA; c <= this.zone.colB; c++) {
        const prop = this.store.def.cols[c].dataProp;
        if (this.store.def.cols[c].type !== 'subrow') {
          const myrow = this.store.data.filter((item: any) => item.ctx.row === r)[0];
          str += this.store.data[r][prop].value ? this.store.data[r][prop].value + ';' : this.store.data[r][prop] + ';';
        }
      }
      str = str.replace(/;$/, '');
      str += '\n';
    }
    navigator.clipboard.writeText(str);
  }

  clear() {
    this.zoneStarted = false;
    this.zone = {
      rowA: -1,
      colA: -1,
      rowB: -1,
      colB: -1
    };
  }

}
