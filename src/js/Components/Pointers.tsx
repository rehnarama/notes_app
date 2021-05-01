import * as React from "react";
import PointersData from "../Data/Pointers/PointersData";
import pointerImage from "../../images/cursormode.svg";

interface Props {
  pointersData: PointersData;
}
const Pointers: React.FC<Props> = ({ pointersData }) => {
  const [pointers, setPointers] = React.useState(
    new Map(pointersData.pointerMap)
  );

  React.useEffect(() => {
    function update() {
      setPointers(new Map(pointersData.pointerMap));
    }
    pointersData.onPointerMapUpdated.add(update);

    return () => {
      pointersData.onPointerMapUpdated.remove(update);
    };
  }, [pointersData]);

  return (
    <>
      {Array.from(pointers).map(([id, point]) => (
        <div
          key={id}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${point.x}px, ${point.y}px)`,
            transition: "transform 0.2s linear"
          }}
        >
          <img src={pointerImage} width={20} />
        </div>
      ))}
    </>
  );
};

export default Pointers;
