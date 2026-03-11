import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserBrowseComponent } from './user-browse.component';

describe('UserBrowseComponent', () => {
  let component: UserBrowseComponent;
  let fixture: ComponentFixture<UserBrowseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserBrowseComponent]
    });
    fixture = TestBed.createComponent(UserBrowseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
