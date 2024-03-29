import GLApp from "../GLApp";
import { vec2, mat3 } from "gl-matrix";

export default class Canvas {
  private glApp: GLApp;

  public get width() {
    return this.glApp.width;
  }

  public get height() {
    return this.glApp.height;
  }

  public _position = { x: 0, y: 0 };
  public set position(value: { x: number; y: number }) {
    this._position = value;
    this.glApp.requestFrame();
  }
  public get position() {
    return this._position;
  }
  public _zoom: number = 1;
  public set zoom(value: number) {
    this._zoom = value;
    this.glApp.requestFrame();
  }
  public get zoom() {
    return this._zoom;
  }

  public get projection(): mat3 {
    const projection = mat3.projection(
      mat3.create(),
      this.glApp.width,
      this.glApp.height
    );

    return projection;
  }
  public get view(): mat3 {
    const scale = mat3.fromScaling(mat3.create(), [this.zoom, this.zoom]);
    const translation = mat3.fromTranslation(mat3.create(), [
      this.position.x,
      this.position.y
    ]);
    return mat3.mul(mat3.create(), translation, scale);
  }

  public get vp_matrix(): mat3 {
    return mat3.mul(mat3.create(), this.projection, this.view);
  }

  public get screen(): vec2 {
    return vec2.fromValues(this.width, this.height);
  }

  constructor(glApp: GLApp) {
    this.glApp = glApp;
  }

  public setZoom = (zoom: number, around: { x: number; y: number }) => {
    let zoomDelta = zoom - this.zoom;
    const oldZoom = this.zoom;

    if (oldZoom + zoomDelta < 0.1) {
      zoomDelta = 0.1 - oldZoom;
    }

    const deltaX = around.x - this.position.x / this.zoom;
    this.position.x -= deltaX * zoomDelta;

    const deltaY = around.y - this.position.y / this.zoom;
    this.position.y -= deltaY * zoomDelta;

    this.zoom += zoomDelta;
  };
}
