import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolAvailabilityComponent } from './tool-availability.component';

describe('ToolAvailabilityComponent', () => {
  let component: ToolAvailabilityComponent;
  let fixture: ComponentFixture<ToolAvailabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolAvailabilityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
