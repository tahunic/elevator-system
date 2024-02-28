import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health-check')
  @Header('Cache-Control', 'no-cache, no-store')
  public getHealthCheck(): string {
    return this.appService.getHealthCheck();
  }
}
