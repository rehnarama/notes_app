import * as React from "react";

type Props = React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>;

const AutoTextarea = React.forwardRef<HTMLTextAreaElement, Props>(
  (props, ref) => {
    const { value } = props;

    let rows = 0;
    if (typeof value === "string") {
      rows = value.split("\n").length;
    } else if (typeof value === "number") {
      rows = 1;
    } else {
      rows = value.reduce<number>(
        (accum, currValue) => accum + currValue.split("\n").length,
        0
      );
    }

    return <textarea rows={rows} ref={ref} {...props} />;
  }
);
// class AutoTextarea extends React.Component<Props> {
//   render() {
//   }
// }

export default AutoTextarea;
