import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserBookCardComponent } from './user-book-card.component';

describe('UserBookCardComponent', () => {
  let component: UserBookCardComponent;
  let fixture: ComponentFixture<UserBookCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserBookCardComponent]
    });
    fixture = TestBed.createComponent(UserBookCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
