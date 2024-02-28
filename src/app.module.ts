import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ElevatorModule } from './modules/elevator/elevator.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ElevatorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
