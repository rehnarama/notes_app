import { Hook } from "./utils";
import { easeOutInterpolation } from "./math";

export default class Animator {
  private value: number;
  private fromValue: number;
  private targetValue: number;

  private duration: number = 200;
  private startTime: number = 0;

  private frameRequested = false;

  public onAnimate = new Hook<(value: number) => void>();
  public onDone = new Hook<() => void>();

  constructor(initialValue: number = 0) {
    this.value = initialValue;
    this.fromValue = initialValue;
    this.targetValue = initialValue;
  }

  public animateTo(
    toValue: number,
    duration = 200,
    from: number | null = null
  ) {
    this.duration = duration;

    if (from !== null) {
      this.fromValue = from;
    } else {
      this.fromValue = this.value;
    }
    this.targetValue = toValue;

    this.startTime = performance.now();
    this.requestFrame();
  }

  private requestFrame() {
    if (!this.frameRequested) {
      window.requestAnimationFrame(this.animationLoop);
      this.frameRequested = true;
    }
  }

  private animationLoop = () => {
    this.frameRequested = false;

    const t = (performance.now() - this.startTime) / this.duration;

    this.value = easeOutInterpolation(this.fromValue, this.targetValue, t);

    this.onAnimate.call(this.value);

    if (this.value !== this.targetValue) {
      this.requestFrame();
    } else {
      this.onDone.call();
    }
  };
}
