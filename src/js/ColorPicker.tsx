import * as React from "react";
import { Color } from "./LineRenderer";

function colorToRgba(color: Color) {
  return `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, ${
    color[3]
  })`;
}

export type PickFunction = (color: Color) => void;

const ColorButton: React.SFC<{ color: Color; onPick: PickFunction }> = ({
  color,
  onPick
}) => {
  return (
    <div
      style={{
        background: colorToRgba(color),
        width: 24,
        height: 24,
        borderRadius: "50%",
        marginRight: 4,
        border: "2px solid black"
      }}
      onClick={() => onPick(color)}
    />
  );
};

const ColorPicker: React.SFC<{ onPick: PickFunction }> = ({ onPick }) => {
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
      <ColorButton color={[1, 1, 1, 1]} onPick={onPick} />
      <ColorButton color={[0, 1, 1, 1]} onPick={onPick} />
    </div>
  );
};
export default ColorPicker;
