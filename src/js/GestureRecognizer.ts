import { Hook } from "./utils";

const SCROLL_MULTIPLIER = 50;

interface Point {
  x: number;
  y: number;
}
interface PointerData extends Point {
  type: string;
  pressure: number;
  buttons: number;
}

export interface ZoomEvent {
  delta: number;
  around: { x: number; y: number };
}
export interface PanEvent {
  delta: { x: number; y: number };
  position: { x: number; y: number };
  pressure: number;
  pointerType: string;
  buttons: number;
}
export type DownEvent = {
  position: { x: number; y: number };
  pressure: number;
  pointerType: string;
  buttons: number;
};
export type UpEvent = DownEvent;

export default class GestureRecognizer {
  private element: HTMLElement;

  private prevPointerMap = new Map<number, PointerData>();
  private pointerMap = new Map<number, PointerData>();

  public onZoom = new Hook<(e: ZoomEvent) => void>();
  public onPan = new Hook<(e: PanEvent) => void>();
  public onDown = new Hook<(e: DownEvent) => void>();
  public onUp = new Hook<(e: UpEvent) => void>();

  constructor(element: HTMLElement) {
    this.element = element;

    element.addEventListener("pointermove", this.handleOnPointerMove, {
      passive: true
    });
    element.addEventListener("pointerdown", this.handleOnPointerDown, {
      passive: true
    });
    element.addEventListener("pointerup", this.handleOnPointerUp, {
      passive: true
    });
    element.addEventListener("pointercancel", this.handleOnPointerUp, {
      passive: true
    });
    element.addEventListener("pointerout", this.handleOnPointerUp, {
      passive: true
    });
    element.addEventListener("pointerleave", this.handleOnPointerUp, {
      passive: true
    });
    element.addEventListener("wheel", this.handleOnWheel, {
      passive: false
    });
  }
  dispose() {
    this.element.removeEventListener("pointermove", this.handleOnPointerMove);
    this.element.removeEventListener("pointerdown", this.handleOnPointerDown);
    this.element.removeEventListener("pointerup", this.handleOnPointerUp);
    this.element.removeEventListener("pointercancel", this.handleOnPointerUp);
    this.element.removeEventListener("pointerout", this.handleOnPointerUp);
    this.element.removeEventListener("pointerleave", this.handleOnPointerUp);
    this.element.removeEventListener("wheel", this.handleOnWheel);
  }

  handleOnPointerDown = (e: PointerEvent) => {
    const data = {
      x: e.offsetX,
      y: e.offsetY,
      type: e.pointerType,
      pressure: e.pressure,
      buttons: e.buttons
    };
    this.prevPointerMap.set(e.pointerId, data);
    this.pointerMap.set(e.pointerId, data);

    this.onDown.call({
      position: { x: data.x, y: data.y },
      pointerType: data.type,
      pressure: data.pressure,
      buttons: data.buttons
    });
  };
  handleOnPointerUp = (e: PointerEvent) => {
    this.prevPointerMap.delete(e.pointerId);
    this.pointerMap.delete(e.pointerId);

    this.onUp.call({
      position: { x: e.offsetX, y: e.offsetY },
      pointerType: e.pointerType,
      pressure: e.pressure,
      buttons: e.buttons
    });
  };

  handleOnPointerMove = (e: PointerEvent) => {
    if (this.pointerMap.has(e.pointerId)) {
      this.pointerMap.set(e.pointerId, {
        x: e.offsetX,
        y: e.offsetY,
        type: e.pointerType,
        pressure: e.pressure,
        buttons: e.buttons
      });
    }

    this.detectPinchMove();
    this.detectPanMove();

    for (const [pointerId, point] of this.pointerMap) {
      this.prevPointerMap.set(pointerId, point);
    }
  };

  private isPinch() {
    if (this.pointerMap.size === 2) {
      const values = this.pointerMap.values();
      const first = values.next().value as PointerData;
      const second = values.next().value as PointerData;

      return first.type === "touch" && second.type === "touch";
    } else {
      return false;
    }
  }

  private getMiddle(point1: Point, point2: Point) {
    const middleX = (point1.x + point2.x) / 2;
    const middleY = (point1.y + point2.y) / 2;

    return { x: middleX, y: middleY };
  }
  private getDistance(point1: Point, point2: Point) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance;
  }
  private getDifference(point1: Point, point2: Point) {
    return {
      x: point1.x - point2.x,
      y: point1.y - point2.y
    };
  }

  private detectPinchMove() {
    if (this.isPinch()) {
      const prevValues = this.prevPointerMap.values();
      const prevFirst = prevValues.next().value as PointerData;
      const prevSecond = prevValues.next().value as PointerData;

      const values = this.pointerMap.values();
      const first = values.next().value as PointerData;
      const second = values.next().value as PointerData;

      const prevDistance = this.getDistance(prevFirst, prevSecond);
      const distance = this.getDistance(first, second);
      const deltaDistance = distance - prevDistance;

      const middle = this.getMiddle(first, second);

      this.onZoom.call({ delta: deltaDistance, around: middle });

      const prevMiddle = this.getMiddle(prevFirst, prevSecond);
      const deltaMiddle = this.getDifference(middle, prevMiddle);
      this.onPan.call({
        delta: deltaMiddle,
        position: middle,
        pointerType: first.type,
        pressure: (first.pressure + second.pressure) / 2,
        buttons: first.buttons | second.buttons
      });
    }
  }

  private isPan() {
    return this.pointerMap.size === 1;
  }

  private detectPanMove() {
    if (this.isPan()) {
      const prevPoint = this.prevPointerMap.values().next()
        .value as PointerData;
      const point = this.pointerMap.values().next().value as PointerData;

      const delta = this.getDifference(point, prevPoint);

      this.onPan.call({
        delta,
        position: { x: point.x, y: point.y },
        pointerType: point.type,
        pressure: point.pressure,
        buttons: point.buttons
      });
    }
  }

  private wheelEventToDeltaPixels = (e: WheelEvent) => {
    if (e.deltaMode === 0) {
      return { x: e.deltaX / 200, y: e.deltaY / 200 };
    } else if (e.deltaMode === 1) {
      return { x: e.deltaX / 3, y: e.deltaY / 3 };
    } else {
      return { x: e.deltaX / 800, y: e.deltaY / 800 };
    }
  };

  private handleOnWheel = (e: WheelEvent) => {
    const delta = this.wheelEventToDeltaPixels(e);
    if (e.ctrlKey) {
      let zoomDelta = -delta.y * SCROLL_MULTIPLIER;

      this.onZoom.call({
        delta: zoomDelta,
        around: { x: e.offsetX, y: e.offsetY }
      });
    } else if (e.shiftKey) {
      this.onPan.call({
        delta: { x: SCROLL_MULTIPLIER * delta.y, y: 0 },
        position: { x: e.offsetX, y: e.offsetY },
        pressure: NaN,
        buttons: e.buttons,
        pointerType: "scroll"
      });
    } else {
      this.onPan.call({
        delta: {
          x: SCROLL_MULTIPLIER * delta.x,
          y: SCROLL_MULTIPLIER * delta.y
        },
        position: { x: e.offsetX, y: e.offsetY },
        pressure: NaN,
        buttons: e.buttons,
        pointerType: "scroll"
      });
    }
    e.preventDefault();
  };
}
