import { Hook } from "./utils";
import { lerp } from "./math";

const SCROLL_MULTIPLIER = 50;

interface Point {
  x: number;
  y: number;
}
interface PointerData extends Point {
  type: string;
  pressure: number;
  buttons: number;
  pagePosition: Point;
  time: number;
}

export interface ZoomEvent {
  delta: number;
  around: { x: number; y: number };
  method: "pinch" | "scroll";
}
export interface PanEvent {
  delta: { x: number; y: number };
  pageDelta: { x: number; y: number };
  position: { x: number; y: number };
  pressure: number;
  pointerType: string;
  buttons: number;
  isPinch: boolean;
  momentum: { x: number; y: number };
}
export type DownEvent = {
  position: { x: number; y: number };
  pagePosition: { x: number; y: number };
  pressure: number;
  pointerType: string;
  buttons: number;
};
export type UpEvent = DownEvent;
export interface HoverEvent {
  position: { x: number; y: number };
}
export interface MoveEvent {
  position: { x: number; y: number };
  pagePosition: { x: number; y: number };
}

export default class GestureRecognizer {
  private element: HTMLElement;

  private panMomentum = { x: 0, y: 0 };

  private prevPressedPointerMap = new Map<number, PointerData>();
  private pressedPointerMap = new Map<number, PointerData>();

  public onZoom = new Hook<(e: ZoomEvent) => void>();
  public onPan = new Hook<(e: PanEvent) => void>();
  public onDown = new Hook<(e: DownEvent) => void>();
  public onUp = new Hook<(e: UpEvent) => void>();
  public onHover = new Hook<(e: HoverEvent) => void>();
  public onMove = new Hook<(e: MoveEvent) => void>();

  private capture: boolean;

  constructor(element: HTMLElement, capture = false) {
    this.element = element;
    this.capture = capture;

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
      buttons: e.buttons,
      pagePosition: { x: e.pageX, y: e.pageY },
      time: performance.now()
    };
    this.prevPressedPointerMap.set(e.pointerId, data);
    this.pressedPointerMap.set(e.pointerId, data);

    this.onDown.call({
      position: { x: data.x, y: data.y },
      pagePosition: data.pagePosition,
      pointerType: data.type,
      pressure: data.pressure,
      buttons: data.buttons
    });

    // New pointer should reset pan momentum
    this.panMomentum.x = 0;
    this.panMomentum.y = 0;

    if (this.capture) {
      this.element.setPointerCapture(e.pointerId);
    }
  };
  handleOnPointerUp = (e: PointerEvent) => {
    const wasDown = this.pressedPointerMap.has(e.pointerId);

    this.prevPressedPointerMap.delete(e.pointerId);
    this.pressedPointerMap.delete(e.pointerId);

    if (wasDown) {
      this.onUp.call({
        position: { x: e.offsetX, y: e.offsetY },
        pagePosition: { x: e.pageX, y: e.pageY },
        pointerType: e.pointerType,
        pressure: e.pressure,
        buttons: e.buttons
      });
    }

    if (
      e.pointerType === "mouse" &&
      this.element.hasPointerCapture(e.pointerId)
    ) {
      this.element.releasePointerCapture(e.pointerId);
    }
  };

  handleOnPointerMove = (e: PointerEvent) => {
    const coalescedEvents =
      typeof e.getCoalescedEvents !== "undefined" ? e.getCoalescedEvents() : [];
    if (coalescedEvents.length > 0) {
      for (const e of coalescedEvents) {
        this.handleOnPointerMove(e);
      }
      return;
    }

    if (this.pressedPointerMap.has(e.pointerId)) {
      this.pressedPointerMap.set(e.pointerId, {
        x: e.offsetX,
        y: e.offsetY,
        type: e.pointerType,
        pressure: e.pressure,
        buttons: e.buttons,
        pagePosition: { x: e.pageX, y: e.pageY },
        time: performance.now()
      });
    }

    this.detectHoverMove(e);
    this.detectPinchMove();
    this.detectPanMove();

    for (const [pointerId, point] of this.pressedPointerMap) {
      this.prevPressedPointerMap.set(pointerId, point);
    }

    this.onMove.call({
      position: {
        x: e.offsetX,
        y: e.offsetY
      },
      pagePosition: { x: e.pageX, y: e.pageY }
    });
  };

  private isPinch() {
    if (this.pressedPointerMap.size === 2) {
      const values = this.pressedPointerMap.values();
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
      const prevValues = this.prevPressedPointerMap.values();
      const prevFirst = prevValues.next().value as PointerData;
      const prevSecond = prevValues.next().value as PointerData;

      const values = this.pressedPointerMap.values();
      const first = values.next().value as PointerData;
      const second = values.next().value as PointerData;

      const prevDistance = this.getDistance(prevFirst, prevSecond);
      const distance = this.getDistance(first, second);
      const deltaDistance = distance - prevDistance;

      const middle = this.getMiddle(first, second);

      this.onZoom.call({
        delta: deltaDistance,
        around: middle,
        method: "pinch"
      });

      const prevMiddle = this.getMiddle(prevFirst, prevSecond);
      const deltaMiddle = this.getDifference(middle, prevMiddle);

      const pageMiddle = this.getMiddle(
        first.pagePosition,
        second.pagePosition
      );
      const prevPageMiddle = this.getMiddle(
        prevFirst.pagePosition,
        prevSecond.pagePosition
      );
      const pageDelta = this.getDifference(pageMiddle, prevPageMiddle);

      this.updatePanMomentum(pageDelta, first.time - prevFirst.time);

      this.onPan.call({
        delta: deltaMiddle,
        position: middle,
        pointerType: first.type,
        pressure: (first.pressure + second.pressure) / 2,
        buttons: first.buttons | second.buttons,
        isPinch: true,
        pageDelta,
        momentum: this.panMomentum
      });
    }
  }

  private detectHoverMove(e: PointerEvent) {
    const noButton = e.buttons === 0;

    if (noButton) {
      this.onHover.call({
        position: { x: e.pageX, y: e.pageY }
      });
    }
  }

  private isPan() {
    return this.pressedPointerMap.size === 1;
  }

  private detectPanMove() {
    if (this.isPan()) {
      const prevPoint = this.prevPressedPointerMap.values().next()
        .value as PointerData;
      const point = this.pressedPointerMap.values().next().value as PointerData;

      const delta = this.getDifference(point, prevPoint);
      const pageDelta = this.getDifference(
        point.pagePosition,
        prevPoint.pagePosition
      );

      this.updatePanMomentum(pageDelta, point.time - prevPoint.time);

      this.onPan.call({
        delta,
        position: { x: point.x, y: point.y },
        pointerType: point.type,
        pressure: point.pressure,
        buttons: point.buttons,
        isPinch: false,
        pageDelta,
        momentum: this.panMomentum
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
        around: { x: e.offsetX, y: e.offsetY },
        method: "scroll"
      });
    } else if (e.shiftKey) {
      this.onPan.call({
        delta: { x: SCROLL_MULTIPLIER * delta.y, y: 0 },
        position: { x: e.offsetX, y: e.offsetY },
        pressure: NaN,
        buttons: e.buttons,
        pointerType: "scroll",
        isPinch: false,
        pageDelta: { x: SCROLL_MULTIPLIER * delta.y, y: 0 },
        momentum: { x: 0, y: 0 }
      });
    } else {
      this.onPan.call({
        delta: {
          x: SCROLL_MULTIPLIER * -delta.x,
          y: SCROLL_MULTIPLIER * -delta.y
        },
        position: { x: e.offsetX, y: e.offsetY },
        pressure: NaN,
        buttons: e.buttons,
        pointerType: "scroll",
        isPinch: false,
        pageDelta: {
          x: SCROLL_MULTIPLIER * -delta.x,
          y: SCROLL_MULTIPLIER * -delta.y
        },
        momentum: { x: 0, y: 0 }
      });
    }
    e.preventDefault();
  };

  private updatePanMomentum(
    delta: { x: number; y: number },
    timeDelta: number
  ) {
    this.panMomentum = {
      x: lerp(this.panMomentum.x, 0, timeDelta / 200),
      y: lerp(this.panMomentum.y, 0, timeDelta / 200)
    };
    this.panMomentum.x += delta.x;
    this.panMomentum.y += delta.y;
  }
}
