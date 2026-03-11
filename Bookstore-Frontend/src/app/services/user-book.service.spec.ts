import { TestBed } from '@angular/core/testing';

import { UserBookService } from './user-book.service';

describe('UserBookService', () => {
  let service: UserBookService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserBookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
