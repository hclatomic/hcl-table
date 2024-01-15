import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  def: any = { cols: [] };
  data: any[] = [];
  olddata: any[] = [];
  ctx: any = {};
  rowsToDisplay: any[] = [];


  constructor() { }



}
