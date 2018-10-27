import * as React from "react";
import { MarkdownIt } from "markdown-it";
import AutoTextarea from "./AutoTextarea";

interface Props {
  md: MarkdownIt;
  content: string;
  onChange: (index: number, newContent: string) => void;
  requestEditingState: (index: number, editing: boolean) => void;
  requestMerge: (index: number, direction: number) => void;
  requestSplit: (index: number, atPosition: number) => void;
  requestMove: (index: number, direction: number) => void;
  focused: boolean;
  index: number;
  isEditing: boolean;
  mergedAt?: number;
}

interface State {
  minimumHeight?: number;
}

class MarkdownElement extends React.PureComponent<Props> {
  textAreaRef = React.createRef<HTMLTextAreaElement>();
  mdRef = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = {
      isEditing: false
    };
  }

  handleOnBlur = () => {
    this.props.requestEditingState(this.props.index, false);
  };
  handleOnClick = () => {
    this.props.requestEditingState(this.props.index, true);
  };

  focusTextArea() {
    if (
      this.props.isEditing &&
      this.textAreaRef.current !== null &&
      document.activeElement !== this.textAreaRef.current
    ) {
      this.textAreaRef.current.focus();
    }
  }

  setCursorPosition() {
    if (
      this.props.mergedAt !== undefined &&
      this.textAreaRef.current !== null
    ) {
      this.textAreaRef.current.selectionStart = this.props.mergedAt;
      this.textAreaRef.current.selectionEnd = this.props.mergedAt;
    }
  }

  getSnapshotBeforeUpdate() {
    if (this.mdRef.current !== null) {
      return this.mdRef.current.clientHeight;
    }
    return null;
  }

  componentDidUpdate(prevProps: Props, {}, snapshot: number) {
    this.focusTextArea();
    if (snapshot !== null && this.textAreaRef.current !== null) {
      this.textAreaRef.current.style.minHeight = snapshot + "px";
    }

    if (prevProps.isEditing && !this.props.isEditing && this.mdRef.current) {
      this.mdRef.current.focus();
    }

    if (this.props.focused && !prevProps.focused && this.mdRef.current) {
      console.log("focusing");
      this.mdRef.current.focus();
    }

    this.setCursorPosition();
  }

  componentDidMount() {
    this.focusTextArea();
    this.setCursorPosition();
  }

  handleOnKeyUp: React.KeyboardEventHandler<HTMLTextAreaElement> = event => {
    if (this.textAreaRef.current === null) {
      return;
    }

    if (event.key === "Escape") {
      this.props.requestEditingState(this.props.index, false);
    }

    const selectionStart = this.textAreaRef.current.selectionStart;
    const selectionEnd = this.textAreaRef.current.selectionEnd;
    const noSelection = selectionStart === selectionEnd;
    if (event.key === "Backspace" && noSelection && selectionStart === 0) {
      // No selection and cursor on first position
      this.props.requestMerge(this.props.index, -1);
    } else if (
      event.key === "Delete" &&
      noSelection &&
      selectionStart === this.props.content.length
    ) {
      this.props.requestMerge(this.props.index, 1);
    }

    if (event.ctrlKey && event.key === "Enter") {
      this.props.requestSplit(this.props.index, selectionStart);
    }
  };

  handleOnKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = event => {
    const selectionStart = this.textAreaRef.current.selectionStart;
    const selectionEnd = this.textAreaRef.current.selectionEnd;

    if (event.key === "ArrowUp" && selectionEnd === 0) {
      event.preventDefault();
      this.props.requestMove(this.props.index, -1);
    }
    if (
      event.key === "ArrowDown" &&
      selectionStart === this.props.content.length
    ) {
      event.preventDefault();
      this.props.requestMove(this.props.index, 1);
    }
  };

  handleOnChange: React.ChangeEventHandler<HTMLTextAreaElement> = event => {
    const value = event.currentTarget.value;
    this.props.onChange(this.props.index, value);
  };

  handleOnMdKeyPress: React.KeyboardEventHandler<HTMLDivElement> = event => {
    if (this.mdRef.current === null) {
      return;
    }

    if (document.activeElement === this.mdRef.current) {
      if (event.key === "i" || event.key === "Enter") {
        this.props.requestEditingState(this.props.index, true);
      }
    }
  };



  render() {
    const { md, content, isEditing, index } = this.props;

    const renderedContent = md.render(content);
    if (isEditing) {
      return (
        <AutoTextarea
          value={content}
          tabIndex={index + 1}
          onChange={this.handleOnChange}
          onBlur={this.handleOnBlur}
          onKeyUp={this.handleOnKeyUp}
          onKeyDown={this.handleOnKeyDown}
          ref={this.textAreaRef}
        />
      );
    } else {
      return (
        <div
          className="markdownElement"
          tabIndex={index + 1}
          dangerouslySetInnerHTML={{ __html: renderedContent }}
          onClick={this.handleOnClick}
          onKeyPress={this.handleOnMdKeyPress}
          ref={this.mdRef}
        />
      );
    }
  }
}

export default MarkdownElement;
