import { Module } from '@nestjs/common';
import { ElevatorController } from './elevator.controller';
import { ElevatorService } from './elevator.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ElevatorController],
  providers: [ElevatorService],
})
export class ElevatorModule {}
