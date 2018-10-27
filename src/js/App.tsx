import * as React from "react";
import { MarkdownIt } from "markdown-it";
import MarkdownElement from "./MarkdownElement";

const DEFAULT_CONTENT = `# Notes

**Math**: $ x = \\frac{\\sqrt{\\sigma}}{\\theta^2} $

______________________________

*Cursive text*

Code blocks with syntax highlighting:
\`\`\`c
int main(int argc, char *argv[]) {
  std::cout << \"Hello World!\\n\";
}
\`\`\`

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |`;
const CONTENT_KEY = "content";

interface Props {
  md: MarkdownIt;
}
interface State {
  content: string;
  fragments: string[];
  editing: number | null;
  mergedAt?: number;
  focused: number | null;
}

function clamp(num: number, lowerBound: number, upperBound: number) {
  return Math.max(lowerBound, Math.min(num, upperBound));
}

class App extends React.Component<Props, State> {
  lastKey: string = "";

  constructor(props: Props) {
    super(props);

    const content = window.localStorage.getItem(CONTENT_KEY) || DEFAULT_CONTENT;
    this.state = {
      content,
      fragments: this.parseFragments(content),
      editing: null,
      focused: null
    };
  }

  parseFragments = (content: string) => {
    const fragments = content
      .split(/\n{2,}/g)
      .map(str => str.trim())
      .filter(str => str.length > 0);
    fragments.push(""); // Always empty fragment at bottom
    return fragments;
  };

  handleOnChange = (index: number, newValue: string) => {
    this.setState(({ fragments, editing, content }) => {
      let newFragments = fragments.map(
        (val, i) => (i == index ? newValue : val)
      );

      if (
        newValue.length >= 2 &&
        newValue[newValue.length - 1] === "\n" &&
        newValue[newValue.length - 2] === "\n"
      ) {
        const newContent = this.state.fragments.join("\n\n");
        newFragments = this.parseFragments(newContent);
        return {
          fragments: newFragments,
          content: newContent,
          editing: Math.min(editing + 1, newFragments.length - 1),
          mergedAt: undefined
        };
      } else {
        return {
          fragments: newFragments,
          content,
          editing,
          mergedAt: undefined
        };
      }
    });
  };

  handleOnRequestMerge = (index: number, direction: number) => {
    if (direction === 0) {
      return;
    }

    let newIndex = -1;
    if (direction < 0) {
      // We can't do this, this is the first one!
      if (index === 0) {
        return;
      }

      newIndex = index - 1;
    }
    if (direction > 0) {
      if (index === this.state.fragments.length - 1) {
        return;
      }

      newIndex = index;
    }
    const toMerge = this.state.fragments.slice(newIndex, newIndex + 2); //+2 since end is exclusive
    const merged = toMerge[0] + toMerge[1];

    const newFragments = this.state.fragments
      .filter(({}, i) => i !== index)
      .map((fragment, i) => {
        if (i === newIndex) {
          return merged;
        } else {
          return fragment;
        }
      });

    const newContent = newFragments.join("\n\n");
    this.setState(() => ({
      fragments: newFragments,
      content: newContent,
      editing: newIndex,
      mergedAt: toMerge[0].length
    }));
  };

  handleOnRequestSplit = (index: number, position: number) => {
    const newFragments = Array.from(this.state.fragments);
    const fragmentToSplit = this.state.fragments[index];
    const splitFragment = [
      fragmentToSplit.substring(0, position),
      fragmentToSplit.substring(position, fragmentToSplit.length)
    ];

    newFragments.splice(index, 1, ...splitFragment);
    const newContent = newFragments.join("\n\n");
    this.setState(({ editing }) => ({
      fragments: newFragments,
      content: newContent,
      editing: editing + 1,
      mergedAt: undefined
    }));
  };

  handleOnRequestEditingState = (index: number, editing: boolean) => {
    if (editing) {
      this.setState(({ fragments }) => ({
        editing: index,
        mergedAt: fragments[index].length
      }));
    } else {
      const newContent = this.state.fragments.join("\n\n");

      window.localStorage.setItem(CONTENT_KEY, newContent);

      const newFragments = this.parseFragments(newContent);
      this.setState(() => ({
        editing: null,
        content: newContent,
        fragments: newFragments,
        mergedAt: undefined
      }));
    }
  };

  handleOnRequestMove = (index: number, direction: number) => {
    this.setState(({ editing, fragments }) => {
      const newEditing = clamp(
        editing + Math.sign(direction),
        0,
        fragments.length - 1
      );
      return {
        editing: newEditing,
        mergedAt: direction > 0 ? 0 : fragments[newEditing].length
      };
    });
  };

  componentDidMount() {
    document.addEventListener("keypress", this.handleOnKeyPress);
  }
  componentWillUnmount() {
    document.removeEventListener("keypress", this.handleOnKeyPress);
  }

  focusNext = (delta: number) => {
    const curTabIndex = document.activeElement.attributes["tabIndex"];
    const curFocus = curTabIndex ? Number.parseInt(curTabIndex.value) : null;

    this.setState(() => ({
      // -1 since tabIndex is 1-based instead of 0-based as index are
      focused: curFocus ? curFocus + delta - 1 : 0
    }));
  };

  handleOnKeyPress = (event: KeyboardEvent) => {
    if (this.state.editing === null) {
      console.log(event.key);
      switch (event.key) {
        case "j":
          this.focusNext(1);
          break;
        case "k":
          this.focusNext(-1);
          break;
        case "G":
          this.setState(({ fragments }) => ({
            focused: fragments.length - 1
          }));
          break;
        case "g":
          if (this.lastKey === "g") {
            this.setState(() => ({
              focused: 0
            }));
          }
          break;
        default:
          break;
      }

      this.lastKey = event.key;
    }
  };

  render() {
    const { md } = this.props;
    const { fragments, editing, mergedAt, focused } = this.state;

    return (
      <React.Fragment>
        {fragments.map((fragment, index) => (
          <MarkdownElement
            key={index}
            md={md}
            content={fragment}
            onChange={this.handleOnChange}
            requestEditingState={this.handleOnRequestEditingState}
            requestMerge={this.handleOnRequestMerge}
            requestSplit={this.handleOnRequestSplit}
            requestMove={this.handleOnRequestMove}
            isEditing={index === editing}
            index={index}
            focused={index === focused}
            mergedAt={mergedAt}
          />
        ))}
      </React.Fragment>
    );
  }
}

export default App;
