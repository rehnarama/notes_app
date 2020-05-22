import * as React from "react";
import { Color } from "../Lines/LineRenderer";
import classes from "./ColorPicker.module.css";
import classNames from "classnames";

function colorToRgba(color: Color) {
  return `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, ${
    color[3]
  })`;
}

function hexToColor(hex: string): Color {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return [r / 255, g / 255, b / 255, 1];
}

export type PickFunction = (color: Color) => void;

const ColorButton: React.SFC<{
  color: Color | "custom";
  onPick?: PickFunction;
}> = ({ color, onPick }) => {
  const pickerRef = React.useRef<HTMLInputElement>(null);
  if (color === "custom") {
    const onInputChange: React.ChangeEventHandler<HTMLInputElement> = e => {
      const hex = e.currentTarget.value;
      const color = hexToColor(hex);
      onPick?.(color);
    };
    return (
      <React.Fragment>
        <input
          style={{ display: "none" }}
          type="color"
          ref={pickerRef}
          onChange={onInputChange}
        />
        <button
          className={`${classes.colorButton} ${classes.colorWheel}`}
          onClick={() => pickerRef.current?.click()}
        ></button>
      </React.Fragment>
    );
  } else {
    return (
      <button
        className={classes.colorButton}
        style={{
          background: colorToRgba(color)
        }}
        onClick={() => onPick?.(color)}
      />
    );
  }
};

export interface Props {
  onPick?: PickFunction;
  className?: string;
}

const ColorPicker: React.SFC<Props> = ({ onPick, className }) => {
  return (
    <div className={classNames(classes.container, className)}>
      <ColorButton color={[0, 0, 0, 1]} onPick={onPick} />
      <ColorButton
        color={[255 / 255, 255 / 255, 255 / 255, 1]}
        onPick={onPick}
      />
      <ColorButton
        color={[217 / 255, 227 / 255, 36 / 255, 1]}
        onPick={onPick}
      />
      <ColorButton
        color={[217 / 255, 227 / 255, 36 / 255, 1]}
        onPick={onPick}
      />
      <ColorButton
        color={[237 / 255, 148 / 255, 69 / 255, 1]}
        onPick={onPick}
      />
      <ColorButton
        color={[214 / 255, 73 / 255, 199 / 255, 1]}
        onPick={onPick}
      />
      <ColorButton
        color={[69 / 255, 121 / 255, 237 / 255, 1]}
        onPick={onPick}
      />
      <ColorButton
        color={[66 / 255, 227 / 255, 117 / 255, 1]}
        onPick={onPick}
      />
      <ColorButton color="custom" onPick={onPick} />
    </div>
  );
};
export default ColorPicker;
