import * as React from "react";
import PointersData from "../Data/Pointers/PointersData";
import pointerImage from "../../images/cursormode.svg";
import { difference } from "ramda";

interface Props {
  pointersData: PointersData;
}
const Pointers: React.FC<Props> = ({ pointersData }) => {
  const targetElementRef = React.createRef<HTMLDivElement>();
  const pointerRefs = React.useRef(new Map<string, HTMLDivElement>());

  React.useEffect(() => {
    function update() {
      if (targetElementRef.current === null) {
        return;
      }

      const currentIds = Array.from(pointerRefs.current.keys());
      const allIds = Array.from(pointersData.pointerMap.keys());
      const toAdd = difference(allIds, currentIds);
      const toRemove = difference(currentIds, allIds);

      for (const id of toAdd) {
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.top = "0";
        container.style.left = "0";
        container.style.pointerEvents = "none";
        const image = document.createElement("img");
        image.src = pointerImage;
        image.width = 30;
        container.appendChild(image);
        targetElementRef.current.appendChild(container);

        pointerRefs.current.set(id, container);
      }

      for (const id of toRemove) {
        debugger;
        const container = pointerRefs.current.get(id);
        if (container === undefined) {
          throw "Should never happen";
        }
        targetElementRef.current.removeChild(container);
        pointerRefs.current.delete(id);
      }

      for (const [id, point] of pointersData.pointerMap) {
        const container = pointerRefs.current.get(id);
        if (container === undefined) {
          throw "Should never happen";
        }

        container.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
      }
    }
    pointersData.onPointerMapUpdated.add(update);

    return () => {
      pointersData.onPointerMapUpdated.remove(update);
    };
  }, [pointersData, pointerRefs]);

  return <div ref={targetElementRef} />;
};

export default Pointers;
