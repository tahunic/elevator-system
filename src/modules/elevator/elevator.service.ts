import { Injectable } from '@nestjs/common';
import { Elevator } from '../../common/models/elevator.model';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getIndexToLetter } from '../../../utils/alphabet';
import { Direction } from '../../common/enums/direction.enum';
import { Status } from '../../common/enums/status.enum';

@Injectable()
export class ElevatorService {
  elevators: Elevator[];
  maxFloor: number;

  private readonly ELEVATOR_CAPACITY: number = 5;

  constructor(private configService: ConfigService) {
    const elevatorCount = configService.get<number>('ELEVATOR_COUNT');
    this.maxFloor = configService.get<number>('FLOOR_COUNT');
    this.elevators = Array.from({ length: elevatorCount }, (_, i) => new Elevator(getIndexToLetter(i)));
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  handleElevatorStep() {
    this.step();
    if (process.env.NODE_ENV === 'development') {
      this.logElevatorStatuses();
    }
  }

  call(calledFrom: number, target: number): Elevator | null {
    if (target > this.maxFloor) {
      throw new Error('Target floor is larger than the maximum floor');
    }

    let bestChoice: Elevator | null = null;
    let shortestDistance: number | null = null;
    let minimumDestinations: number | null = null;
    let sortDestinations: boolean = false;

    this.elevators
      .filter((elevator) => ![Status.Maintenance, Status.Priority].includes(elevator.status))
      .forEach((elevator) => {
        const distance = Math.abs(elevator.currentFloor - calledFrom);
        const suitableForCurrentDirection =
          (elevator.direction === Direction.Up && elevator.currentFloor <= calledFrom && target > calledFrom) ||
          (elevator.direction === Direction.Down && elevator.currentFloor >= calledFrom && target < calledFrom) ||
          elevator.status === Status.Idle;

        if (suitableForCurrentDirection) {
          const destinationsCount = elevator.destinationFloors.length;
          const canPickUpPassenger = this.canPickUpPassenger(elevator, calledFrom, target);

          const isNewBestChoice =
            minimumDestinations === null ||
            destinationsCount < minimumDestinations ||
            (destinationsCount === minimumDestinations && distance < shortestDistance);

          if (isNewBestChoice) {
            bestChoice = elevator;
            shortestDistance = distance;
            minimumDestinations = destinationsCount;

            if (canPickUpPassenger) {
              minimumDestinations = 0;
              sortDestinations = true;
            }
          }
        }
      });

    if (bestChoice) {
      if (calledFrom !== bestChoice.currentFloor) {
        bestChoice.addDestination(calledFrom);
      }
      bestChoice.addDestination(target, sortDestinations);
    }

    return bestChoice;
  }

  private canPickUpPassenger(elevator: Elevator, calledFrom: number, target: number): boolean {
    const isElevatorFull = elevator.destinationFloors.length >= this.ELEVATOR_CAPACITY;
    if (isElevatorFull) {
      return false;
    }

    const isGoingUp = elevator.direction === Direction.Up;
    const isGoingDown = elevator.direction === Direction.Down;
    const isElevatorBelowCalledFrom = elevator.currentFloor <= calledFrom;
    const isElevatorAboveCalledFrom = elevator.currentFloor >= calledFrom;
    const isTargetAboveCalledFrom = target > calledFrom;
    const isTargetBelowCalledFrom = target < calledFrom;

    const canPickUpOnUpwardJourney = isGoingUp && isElevatorBelowCalledFrom && isTargetAboveCalledFrom;
    const canPickUpOnDownwardJourney = isGoingDown && isElevatorAboveCalledFrom && isTargetBelowCalledFrom;

    return canPickUpOnUpwardJourney || canPickUpOnDownwardJourney;
  }

  private step() {
    this.elevators.forEach((elevator) => elevator.move());
  }

  private logElevatorStatuses() {
    this.elevators.forEach((elevator) => {
      console.log(
        `Elevator ${elevator.id} is on floor ${elevator.currentFloor} with status ${elevator.status} going ${elevator.direction} ${elevator.destinationFloors.length > 0 ? 'to floors ' + elevator.destinationFloors.join(', ') : ''}`,
      );
    });
    console.log('----------------------------------------------------------');
  }
}
