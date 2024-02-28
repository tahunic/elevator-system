import { Direction } from '../enums/direction.enum';
import { Status } from '../enums/status.enum';

export class Elevator {
  id: string;
  currentFloor: number;
  direction: Direction;
  status: Status;
  destinationFloors: number[];

  constructor(id: string, currentFloor: number = 0) {
    this.id = id;
    this.currentFloor = currentFloor;
    this.direction = Direction.Up;
    this.status = Status.Idle;
    this.destinationFloors = [];
  }

  move() {
    if (this.destinationFloors.length > 0) {
      const nextFloor = this.destinationFloors[0];
      if (this.currentFloor < nextFloor) {
        this.currentFloor++;
        this.direction = Direction.Up;
        this.status = Status.Moving;
      } else if (this.currentFloor > nextFloor) {
        this.currentFloor--;
        this.direction = Direction.Down;
        this.status = Status.Moving;
      }
      if (this.currentFloor === nextFloor) {
        this.destinationFloors.shift();
        if (this.destinationFloors.length === 0) {
          this.direction = Direction.Up;
          this.status = Status.Idle;
        }
      }
    } else if (this.destinationFloors.length === 0 && this.currentFloor !== 0) {
      this.addDestination(0);
    } else {
      this.direction = Direction.Up;
      this.status = Status.Idle;
    }
  }

  addDestination(floor: number, sort = false) {
    if (!this.destinationFloors.includes(floor)) {
      this.destinationFloors.push(floor);

      if (sort) {
        this.destinationFloors.sort((a, b) => (this.direction === Direction.Up ? a - b : b - a));
      }
    }
  }
}
