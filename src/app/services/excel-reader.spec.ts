import { TestBed } from '@angular/core/testing';

import { ExcelReader } from './excel-reader';

describe('EscelReader', () => {
  let service: ExcelReader;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExcelReader);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
