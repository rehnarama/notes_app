import { Line } from "../Lines/LineGenerator";


export interface AttributeData {
  vertices: number[];
  colors: number[];
}

export default interface Pen {
  generateAttributeData(line: Line): AttributeData;
}