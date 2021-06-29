import * as React from "react";
import PointersData from "../Data/Pointers/PointersData";
import pointerImage from "url:../../images/cursormode.svg";
import GLApp from "../GLApp";
import PointersRenderer from "../Rendering/PointersRenderer";
import Canvas from "../Rendering/Canvas";
import Vector2 from "../Utils/Vector2";

interface Props {
  pointersData: PointersData;
  glApp: GLApp;
}
const Pointers: React.FC<Props> = ({ glApp: pointersData }) => {
  const glAppRef = React.useRef<GLApp>();

  const onRef = React.useCallback((ref: HTMLDivElement) => {
    glAppRef.current = new GLApp(ref);
    const linesRenderer = glAppRef.current.addProgram(
      new PointersRenderer(glAppRef.current, new Canvas(glAppRef.current))
    );

  }, []);

  React.useEffect(() => {
    function update() {}

    pointersData.onPointerMapUpdated.add(update);

    return () => {
      pointersData.onPointerMapUpdated.remove(update);
    };
  }, [pointersData, glApp]);

  return null
};

export default Pointers;
