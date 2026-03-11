import { TestBed } from '@angular/core/testing';

import { UserChatbotService } from './user-chatbot.service';

describe('UserChatbotService', () => {
  let service: UserChatbotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserChatbotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
