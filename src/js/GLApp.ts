import { Hook } from "./utils";

const MAX_RESOLUTION = 1920;

export default class GLApp {
  private targetElement: HTMLElement;
  private _canvas: HTMLCanvasElement;
  private _gl: WebGLRenderingContext;
  public get gl() {
    return this._gl;
  }

  private isDirty: boolean = false;

  public requestedScale: "auto" | number = "auto";
  private _actualScale = 1;
  /**
   * The scale to actually use
   */
  public get actualScale() {
    return this._actualScale;
  }

  private _dimensions: Readonly<{ width: number; height: number }> = {
    width: 0,
    height: 0
  };
  /**
   * Dimensions in virtual/CSS pixels
   */
  public get dimensions() {
    return this._dimensions;
  }
  /**
   * Width in virtual/CSS pixels
   */
  public get width() {
    return this.dimensions.width;
  }
  /**
   * Height in virtual/CSS pixels
   */
  public get height() {
    return this.dimensions.height;
  }

  public onDimensionChange = new Hook<
    (width: number, height: number) => void
  >();
  public onScaleChange = new Hook<(scale: number) => void>();
  public onDraw = new Hook<() => void>();

  public getContext() {
    return this._gl;
  }

  constructor(targetElement: HTMLElement) {
    this.targetElement = targetElement;

    this._canvas = document.createElement("canvas");
    this.targetElement.appendChild(this._canvas);

    this._gl = this._canvas.getContext("webgl") as WebGLRenderingContext;
    this.updateSize(); // Have to establish size at least once before rendering can occur!

    window.addEventListener("resize", this.updateSize);
  }

  private guessScale() {
    if (this.requestedScale === "auto") {
      const dpr = window.devicePixelRatio;
      const resolution =
        Math.max(
          this.targetElement.offsetWidth,
          this.targetElement.offsetHeight
        ) * dpr;

      if (resolution / MAX_RESOLUTION > 1) {
        // Performance is too bad if we use such a high resolution, scale down to a reasonable level
        return dpr / (resolution / MAX_RESOLUTION);
      } else {
        return dpr;
      }
    } else {
      return this.requestedScale;
    }
  }

  public updateSize = () => {
    if (this._gl.canvas === null) {
      return;
    }

    const oldScale = this.actualScale;
    const oldDimensions = this.dimensions;

    const elemWidth = this.targetElement.offsetWidth;
    const elemHeight = this.targetElement.offsetHeight;

    this._actualScale = this.guessScale();
    const width = (this._gl.canvas.width = Math.round(
      elemWidth * this._actualScale
    ));
    const height = (this._gl.canvas.height = Math.round(
      elemHeight * this._actualScale
    ));

    if ("style" in this._gl.canvas) {
      this._gl.canvas.style.width = elemWidth + "px";
      this._gl.canvas.style.height = elemHeight + "px";
    }

    this._gl.viewport(0, 0, width, height);

    this._dimensions = { width: elemWidth, height: elemHeight };

    if (oldScale !== this.actualScale) {
      this.onScaleChange.call(this.actualScale);
    }
    if (oldDimensions.width !== width || oldDimensions.height !== height) {
      this.onDimensionChange.call(width, height);
    }
  };

  private clear() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  public requestFrame() {
    if (this.isDirty) {
      return;
    }

    this.isDirty = true;
    window.requestAnimationFrame(this.onFrame);
  }

  public onFrame = () => {
    this.isDirty = false;
    this.clear();
    this.onDraw.call();
  };

  public dispose() {
    this._gl.getExtension("WEBGL_lose_context")?.loseContext();
    window.removeEventListener("resize", this.updateSize);
    this.targetElement.removeChild(this._canvas);
  }
}
