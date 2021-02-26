import { TestBed } from '@angular/core/testing';

import { LastDirectoryService } from './last-directory.service';

describe('LastDirectoryService', () => {
  let service: LastDirectoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LastDirectoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
