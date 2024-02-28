import { Test, TestingModule } from '@nestjs/testing';
import { ElevatorService } from './elevator.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { Direction } from '../../common/enums/direction.enum';
import { Status } from '../../common/enums/status.enum';

describe('ElevatorService', () => {
  let service: ElevatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElevatorService],
      imports: [ScheduleModule.forRoot(), ConfigModule.forRoot({ isGlobal: true })],
    }).compile();

    service = module.get<ElevatorService>(ElevatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('all elevators should start from ground floor', async () => {
    service.elevators.forEach((elevator) => {
      expect(elevator.currentFloor).toBe(0);
    });
  });

  it('elevators should remain idle if there are no calls', async () => {
    for (let i = 0; i < 5; i++) {
      service.handleElevatorStep();
    }

    service.elevators.forEach((elevator) => {
      expect(elevator.status).toBe(Status.Idle);
      expect(elevator.currentFloor).toBe(0);
    });
  });

  it('elevators should handle simultaneous calls from multiple floors', async () => {
    const firstCall = service.call(5, 0);
    const secondCall = service.call(3, 0);
    const thirdCall = service.call(6, 2);

    service.handleElevatorStep();

    expect(firstCall).toBe(service.elevators.find((elevator) => elevator.id === 'A'));
    expect(firstCall.direction).toBe('up');
    expect(firstCall.destinationFloors).toEqual([5, 0]);

    expect(secondCall).toBe(service.elevators.find((elevator) => elevator.id === 'B'));
    expect(secondCall.direction).toBe('up');
    expect(secondCall.destinationFloors).toEqual([3, 0]);

    expect(thirdCall).toBe(service.elevators.find((elevator) => elevator.id === 'C'));
    expect(thirdCall.direction).toBe('up');
    expect(thirdCall.destinationFloors).toEqual([6, 2]);

    service.handleElevatorStep();
    service.handleElevatorStep();
    service.handleElevatorStep();
    service.handleElevatorStep();
    service.handleElevatorStep();

    expect(firstCall.direction).toBe(Direction.Down);
    expect(firstCall.destinationFloors).toEqual([0]);
  });

  it('elevator should prioritize closer calls in the same direction', async () => {
    service.call(2, 5);
    service.call(3, 6);

    service.handleElevatorStep();

    const firstCall = service.elevators.find((elevator) => elevator.destinationFloors.includes(5));
    const secondCall = service.elevators.find((elevator) => elevator.destinationFloors.includes(6));

    expect(firstCall.id).toBe('A');
    expect(secondCall.id).toBe('A');
    expect(firstCall.destinationFloors).toEqual([2, 3, 5, 6]);
    expect(secondCall.destinationFloors).toEqual([2, 3, 5, 6]);
  });

  it('moving elevator should pick up a passenger if on the way up', async () => {
    const elevators = service.elevators;
    const firstCall = service.call(0, 10);
    service.handleElevatorStep();
    service.handleElevatorStep();

    expect(firstCall).toBe(elevators.find((elevator) => elevator.id === 'A'));
    expect(firstCall.direction).toBe(Direction.Up);

    const secondCall = service.call(6, 7);
    service.handleElevatorStep();

    expect(secondCall).toBe(elevators.find((elevator) => elevator.id === 'A'));
    expect(secondCall.direction).toBe(Direction.Up);
    expect(secondCall.destinationFloors).toEqual([6, 7, 10]);
  });

  it('moving elevator should pick up passengers if on the way down', async () => {
    const elevators = service.elevators;
    const firstCall = service.call(10, 0);
    service.handleElevatorStep();

    expect(firstCall).toBe(elevators.find((elevator) => elevator.id === 'A'));
    expect(firstCall.direction).toBe(Direction.Up);

    for (let i = 0; i < 10; i++) {
      service.handleElevatorStep();
    }

    expect(firstCall.direction).toBe(Direction.Down);
    expect(firstCall.destinationFloors).toEqual([0]);

    const secondCall = service.call(7, 2);
    service.handleElevatorStep();

    expect(secondCall).toBe(elevators.find((elevator) => elevator.id === 'A'));
    expect(secondCall.direction).toBe(Direction.Down);
    expect(secondCall.status).toBe(Status.Moving);
    expect(secondCall.destinationFloors).toEqual([7, 2, 0]);
  });

  it('moving elevator should not pick up passengers if too busy', async () => {
    const elevators = service.elevators;
    const firstCall = service.call(0, 20);
    service.handleElevatorStep();

    expect(firstCall).toBe(elevators.find((elevator) => elevator.id === 'A'));
    expect(firstCall.direction).toBe('up');

    service.call(6, 7);
    const thirdCall = service.call(8, 9);
    expect(thirdCall).toBe(elevators.find((elevator) => elevator.id === 'A'));
    expect(thirdCall.direction).toBe('up');
    expect(thirdCall.destinationFloors).toEqual([6, 7, 8, 9, 20]);

    const fourthCall = service.call(10, 12);

    expect(fourthCall).toBe(elevators.find((elevator) => elevator.id === 'B'));
    service.handleElevatorStep();
    expect(fourthCall.direction).toBe('up');
    expect(fourthCall.destinationFloors).toEqual([10, 12]);
  });

  it('elevator should return to ground floor after all calls are handled', async () => {
    const elevators = service.elevators;
    const firstCall = service.call(0, 18);
    const secondCall = service.call(16, 10);

    service.handleElevatorStep();

    expect(firstCall).toBe(elevators.find((elevator) => elevator.id === 'A'));
    expect(firstCall.direction).toBe(Direction.Up);
    expect(firstCall.status).toBe(Status.Moving);
    expect(firstCall.destinationFloors).toEqual([18]);

    expect(secondCall).toBe(elevators.find((elevator) => elevator.id === 'B'));
    expect(secondCall.direction).toBe(Direction.Up);
    expect(secondCall.status).toBe(Status.Moving);
    expect(secondCall.destinationFloors).toEqual([16, 10]);

    for (let i = 0; i < 20; i++) {
      service.handleElevatorStep();
    }

    expect(firstCall.direction).toBe(Direction.Down);
    expect(firstCall.destinationFloors).toEqual([0]);
    expect(secondCall.direction).toBe(Direction.Down);
    expect(secondCall.destinationFloors).toEqual([10]);

    for (let i = 0; i < 20; i++) {
      service.handleElevatorStep();
    }

    expect(firstCall.status).toBe(Status.Idle);
    expect(firstCall.direction).toBe(Direction.Up);
    expect(firstCall.destinationFloors).toEqual([]);
    expect(firstCall.currentFloor).toBe(0);

    expect(secondCall.status).toBe(Status.Idle);
    expect(secondCall.direction).toBe(Direction.Up);
    expect(secondCall.destinationFloors).toEqual([]);
    expect(secondCall.currentFloor).toBe(0);
  });
});
