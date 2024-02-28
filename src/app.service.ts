import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}

  getHealthCheck(): string {
    return 'Ok!';
  }
}
