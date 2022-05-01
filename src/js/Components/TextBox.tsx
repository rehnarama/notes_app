import React from "react";
import Canvas from "../Rendering/Canvas";

interface Props {
  canvas: Canvas;
}

const TextBox: React.FC<Props> = ({ canvas }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let handle: number = -1;
    const onFrame = () => {
      handle = requestAnimationFrame(onFrame);
      if (!canvas) {
        return;
      }
      const container = containerRef.current;

      const matrix = `matrix3d(
        ${canvas.view4.join(",")}
      )`;
      if (container) {
        container.style.transform = `${matrix}`;
      }

    };
    handle = requestAnimationFrame(onFrame);

    return () => {
      cancelAnimationFrame(handle);
    };
  }, [containerRef.current, canvas]);

  return (
    <div ref={containerRef} style={{position: "fixed", transformOrigin: "0 0 0"}}>
      <p>Just some text</p>
    </div>
  );
};

export default TextBox;
