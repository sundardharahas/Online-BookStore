import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserChatbotComponent } from './user-chatbot.component';

describe('UserChatbotComponent', () => {
  let component: UserChatbotComponent;
  let fixture: ComponentFixture<UserChatbotComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserChatbotComponent]
    });
    fixture = TestBed.createComponent(UserChatbotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
