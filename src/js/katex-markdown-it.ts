import katex from "katex";
import "katex/dist/katex.min.css";
import { Rule, StateInline, TokenRender } from "markdown-it";
import { MarkdownItPlugin } from "./markdown-it";


const renderer: TokenRender = (tokens, idx) => {
  const latex = tokens[idx].content;
  try {
    const math = katex.renderToString(latex);
    return math;
  } catch (err) {
    return `<p>${err.toString()}</p>`;
  }
}

const ruler: Rule<StateInline> = (state, silent) => {
  if (state.src[state.pos] !== "$") {
    return false;
  }
  const start = state.pos;

  // Find position of next unescaped $
  let isEscaped = false,
    isDollar = false;
  do {
    state.pos++;
    isEscaped = state.src[state.pos - 1] === "\\";
    isDollar = state.src[state.pos] === "$";
  } while (!(!isEscaped && isDollar) && state.pos < state.src.length);

  const end = state.pos;

  // Couldn't find an unescaped dollar
  if (isEscaped || !isDollar) {
    state.pos = start;
    return false;
  }
  // Empty latex string, display it as feedback for user
  if (start + 1 == end) {
    state.pos = start;
    return false;
  }


  const token = state.push("math", "math_tag", 0);
  token.content = state.src.slice(start + 1, end);

  // Go to after the dollars
  state.pos++;

  return true;
};

const katexMarkdownIt: MarkdownItPlugin = (md, ...params) => {
  md.inline.ruler.after("escape", "math", ruler);
  md.renderer.rules.math = renderer;
};


export default katexMarkdownIt;
