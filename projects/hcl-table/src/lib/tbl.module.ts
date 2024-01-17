import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TblComponent } from './tbl.component';
import { PaginatorComponent } from './paginator/paginator.component';
import { LiveUpdateCellComponent } from './live-update-cell/live-update-cell.component';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  declarations: [
    TblComponent,
    PaginatorComponent,
    LiveUpdateCellComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  exports: [
    TblComponent
  ]
})
export class HclTableModule { }
