import * as React from "react";
import ColorPicker, { PickFunction } from "./ColorPicker";
import classes from "./Toolbar.module.css";
import LineRenderer, { Color } from "../Lines/LineRenderer";
import LineGenerator from "../Lines/LineGenerator";
import FeltPen from "../Pen/FeltPen";

interface Props {
  onColorChange?: PickFunction;
  onThicknessChange?: (thickness: number) => void;
  thickness: number;
  color: Color;
}

const Toolbar: React.SFC<Props> = props => {
  const onThicknessChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    props.onThicknessChange?.(e.currentTarget.valueAsNumber);
  };
  let previewRenderer = React.useRef<LineRenderer | null>(null);
  const attachRenderer = React.useCallback(node => {
    console.log(node);
    previewRenderer.current = new LineRenderer(node);
  }, []);

  React.useEffect(() => {
    if (previewRenderer.current) {
      const generator = new LineGenerator(FeltPen);
      generator.addLine(0, {
        points: [
          { pressure: 0.8, x: 20, y: 20 },
          { pressure: 0.6, x: 70, y: 60 },
          { pressure: 0.5, x: 80, y: 20 },
          { pressure: 0.2, x: 150, y: 50 }
        ],
        color: props.color,
        thickness: props.thickness
      });

      const data = generator.generateData();
      previewRenderer.current.draw(data.vertices, data.color);
    }
  }, [props.color, props.thickness, previewRenderer.current]);

  return (
    <div className={classes.container}>
      <ColorPicker onPick={props.onColorChange} />
      <input
        type="range"
        min="0.1"
        max="3"
        step="0.2"
        value={props.thickness}
        onChange={onThicknessChange}
      ></input>
      <div
        style={{
          width: 200,
          height: "100%"
        }}
        ref={attachRenderer}
      />
    </div>
  );
};

export default Toolbar;
