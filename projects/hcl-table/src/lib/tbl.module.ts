import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TblComponent } from './tbl.component';
import { PaginatorComponent } from './paginator/paginator.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LiveUpdateCellComponent } from './live-update-cell/live-update-cell.component';


@NgModule({
  declarations: [
    TblComponent,
    PaginatorComponent,
    LiveUpdateCellComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BrowserAnimationsModule
  ],
  exports: [
    TblComponent
  ]
})
export class HclTableModule { }
