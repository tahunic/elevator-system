import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ElevatorService } from './elevator.service';
import { Elevator } from '../../common/models/elevator.model';

@Controller('elevator')
export class ElevatorController {
  constructor(private elevatorService: ElevatorService) {}

  @Get('/call')
  @ApiQuery({ name: 'currentFloor', type: Number })
  @ApiQuery({ name: 'targetFloor', type: Number })
  @ApiOperation({ summary: 'Call the elevator for a target floor' })
  @ApiOkResponse({ type: Elevator })
  async call(
    @Query('currentFloor', ParseIntPipe) currentFloor: number,
    @Query('targetFloor', ParseIntPipe) targetFloor: number,
  ): Promise<Elevator> {
    return this.elevatorService.call(currentFloor, targetFloor);
  }
}
