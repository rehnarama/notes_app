import GLApp from "./GLApp";
import * as twgl from "twgl.js";

export default abstract class GLProgram {
  public glApp: GLApp;
  constructor(glApp: GLApp) {
    this.glApp = glApp;
  }

  protected createProgramInfo(vsSource: string, fsSource: string) {
    return twgl.createProgramInfo(this.glApp.gl, [vsSource, fsSource]);
  }

  protected useProgram(program: twgl.ProgramInfo) {
    this.glApp.gl.useProgram(program.program);
  }

  public abstract draw(app: GLApp): void;
}
