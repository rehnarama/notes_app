import * as React from "react";
import { Color } from "../Lines/LineRenderer";
import classes from "./ColorPicker.module.css";

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

const ColorPicker: React.SFC<{ onPick?: PickFunction }> = ({ onPick }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center"
      }}
    >
      <ColorButton color={[0, 0, 0, 1]} onPick={onPick} />
      <ColorButton color={[1, 0, 0, 1]} onPick={onPick} />
      <ColorButton color={[0, 1, 0, 1]} onPick={onPick} />
      <ColorButton color={[0, 0, 1, 1]} onPick={onPick} />
      <ColorButton color={[1, 1, 0, 1]} onPick={onPick} />
      <ColorButton color={[1, 0, 1, 1]} onPick={onPick} />
      <ColorButton color={[0, 1, 1, 1]} onPick={onPick} />
      <ColorButton color="custom" onPick={onPick} />
    </div>
  );
};
export default ColorPicker;
