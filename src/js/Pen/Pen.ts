import { Line } from "../Lines/LineGenerator";


export interface AttributeData {
  vertices: number[];
}

export default interface Pen {
  generateAttributeData(line: Line): AttributeData;
}