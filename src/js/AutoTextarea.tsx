import * as React from "react";

type TextAreaProps = React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>;
type TextAreaPropsWithoutRef = Pick<
  TextAreaProps,
  Exclude<keyof TextAreaProps, "ref">
>;

type Props = TextAreaPropsWithoutRef;

class AutoTextarea extends React.PureComponent<
  Props & { forwardedRef: React.Ref<HTMLTextAreaElement> }
> {
  componentDidMount() {
    this.autofitTextArea();
  }

  componentDidUpdate() {
    this.autofitTextArea();
  }

  autofitTextArea = () => {
    const reactRef = this.props.forwardedRef as React.RefObject<
      HTMLTextAreaElement
    >;
    if (reactRef.current !== null) {
      reactRef.current.style["minHeight"] =
        // +1 pixel due to chrome bug still showing scroll bar
        reactRef.current.scrollHeight + 1 + "px";
    }
  };

  render() {
    const { forwardedRef: ref, ...props } = this.props;
    // const { value } = props;

    // const reactRef = ref as React.RefObject<HTMLTextAreaElement>;
    // let minHeight = 0;
    // if (reactRef.current !== null) {
    //   minHeight = reactRef.current.scrollHeight;
    // }

    // console.log(ref);
    // let rows = 0;
    // if (typeof value === "string") {
    //   rows = value.split("\n").length;
    // } else if (typeof value === "number") {
    //   rows = 1;
    // } else {
    //   rows = value.reduce<number>(
    //     (accum, currValue) => accum + currValue.split("\n").length,
    //     0
    //   );
    // }

    return <textarea ref={ref} {...props} />;
  }
}

export default React.forwardRef<HTMLTextAreaElement, Props>((props, ref) => (
  <AutoTextarea forwardedRef={ref} {...props} />
));
