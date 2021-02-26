import { TestBed } from '@angular/core/testing';

import { UpdateRecentService } from './update-recent.service';

describe('UpdateRecentService', () => {
  let service: UpdateRecentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdateRecentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
