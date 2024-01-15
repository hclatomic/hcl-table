import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveUpdateCellComponent } from './live-update-cell.component';

describe('LiveUpdateCellComponent', () => {
  let component: LiveUpdateCellComponent;
  let fixture: ComponentFixture<LiveUpdateCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LiveUpdateCellComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveUpdateCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
