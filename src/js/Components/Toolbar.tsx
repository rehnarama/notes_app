import * as React from "react";
import ColorPicker, { PickFunction } from "./ColorPicker";
import classes from "./Toolbar.module.css";
import LineRenderer, { Color } from "../Lines/LineRenderer";
import LineGenerator from "../Lines/LineGenerator";
import FeltPen from "../Pen/FeltPen";
import Drawer from "./Drawer";

import ImageCheckbox from "./ImageCheckbox";

import CursorModeImg from "../../images/cursormode.svg";
import EraserModeImg from "../../images/eraser.svg";

interface Props {
  onColorChange?: PickFunction;
  onThicknessChange?: (thickness: number) => void;
  onCursorModeChange?: (alwaysDraw: boolean) => void;
  onEraseModeChange?: (erase: boolean) => void;
  thickness: number;
  color: Color;
  cursorMode: boolean;
  eraseMode: boolean;
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
      previewRenderer.current.draw(data);
    }
  }, [props.color, props.thickness, previewRenderer.current]);

  const onCursorModeChange = (checked: boolean) => {
    props.onCursorModeChange?.(checked);
  };
  const onEraseModeChange = (checked: boolean) => {
    props.onEraseModeChange?.(checked);
  };

  return (
    <Drawer>
      <div className={classes.content}>
        <div
          className={classes.canvasPreview}
          ref={attachRenderer}
        />
        <ColorPicker onPick={props.onColorChange} />
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.2"
          value={props.thickness}
          onChange={onThicknessChange}
        ></input>
        <div>
          <ImageCheckbox
            src={CursorModeImg}
            id="mode-cursor-mobile"
            width={32}
            height={32}
            checked={props.cursorMode}
            onChange={onCursorModeChange}
            className={classes.cursorCheckbox}
          ></ImageCheckbox>
          <ImageCheckbox
            src={EraserModeImg}
            id="mode-eraser-mobile"
            width={32}
            height={32}
            checked={props.eraseMode}
            onChange={onEraseModeChange}
          ></ImageCheckbox>
        </div>
      </div>
    </Drawer>
  );
};

export default Toolbar;
