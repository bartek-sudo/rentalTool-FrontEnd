import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyToolReservationsComponent } from './my-tool-reservations.component';

describe('MyToolReservationsComponent', () => {
  let component: MyToolReservationsComponent;
  let fixture: ComponentFixture<MyToolReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyToolReservationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyToolReservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
