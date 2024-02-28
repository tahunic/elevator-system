import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getIndexToLetter } from '../utils/alphabet';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health-check (GET)', () => {
    return request(app.getHttpServer())
      .get('/health-check')
      .expect(200)
      .expect('Ok!');
  });

  it('getIndexToLetter should return correct result', () => {
    expect(getIndexToLetter(0)).toBe('A');
    expect(getIndexToLetter(1)).toBe('B');
    expect(getIndexToLetter(2)).toBe('C');
    expect(getIndexToLetter(25)).toBe('Z');
  });

  it('getIndexToLetter should throw exception if index is larger than 25', () => {
    // Check if the function throws an error
    expect(() => getIndexToLetter(26)).toThrow(Error);
  });
});
