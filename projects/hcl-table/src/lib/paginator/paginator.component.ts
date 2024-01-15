import { Component, OnChanges, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';

@Component({
  selector: 'hcl-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss']
})
export class PaginatorComponent implements OnChanges {

  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Output() output = new EventEmitter<any>();


  arrayDisplay: any[] = [];
  inputPage: any = null;

  ngOnChanges(changes: SimpleChanges) {
    if (this.totalPages < this.currentPage) {
      this.currentPage = 1;
      this.inputPage = 1;

    }
    this.update();
  }

  changePage(page: any) {
    if (page === 'down' && this.currentPage > 1) {
      this.currentPage = this.currentPage - 1;
    }
    else if (page === 'up' && this.currentPage < this.totalPages) {
      this.currentPage = this.currentPage + 1;
    }
    else if (typeof page === 'number') {
      this.currentPage = page;
      this.inputPage = page;
    }
    else {
      return;
    }

    this.output.emit(this.currentPage);
    this.update();
  }


  update() {
    this.inputPage = this.currentPage;
    if (this.totalPages < 12) {
      this.arrayDisplay = ['down'];
      for (let i = 1; i <= this.totalPages; i++) {
        this.arrayDisplay.push(i);
      }
      this.arrayDisplay.push('up');
    }
    else {

      this.arrayDisplay = [
        'down',
        1, 2, 3,
        '...',
        '...',
        '...',
        '...',
        '...',
        this.totalPages - 2,
        this.totalPages - 1,
        this.totalPages,
        'up'
      ];

      switch (this.currentPage) {
        case 1:
          break;
        case 2:
          break;
        case 3:
          this.arrayDisplay[4] = 4;
          break;
        case 4:
          this.arrayDisplay[4] = 4;
          this.arrayDisplay[5] = 5;
          break;
        case 5:
          this.arrayDisplay[4] = 4;
          this.arrayDisplay[5] = 5;
          this.arrayDisplay[6] = 6;
          break;
        case this.totalPages - 4:
          this.arrayDisplay[8] = this.totalPages - 3;
          this.arrayDisplay[7] = this.totalPages - 4;
          this.arrayDisplay[6] = this.totalPages - 5;
          break;
        case this.totalPages - 3:
          this.arrayDisplay[8] = this.totalPages - 3;
          this.arrayDisplay[7] = this.totalPages - 4;
          break;
        case this.totalPages - 2:
          this.arrayDisplay[8] = this.totalPages - 3;
          break;
        case this.totalPages - 1:
          break;
        case this.totalPages:
          break;
        default:
          this.arrayDisplay[5] = this.currentPage - 1;
          this.arrayDisplay[6] = this.currentPage;
          this.arrayDisplay[7] = this.currentPage + 1;
          break;
      }

    }

  }


}
