import { TokenRender } from "markdown-it";
import { MarkdownItPlugin } from "./markdown-it";
import mermaidAPI from "mermaid";

const noop = () => {};

const createMermaidRule = (fenceRenderer: TokenRender) => {
  return ((tokens, idx, ...rest) => {
    const token = tokens[idx];

    if (token.info === "mermaid") {
      const mermaidMarkup = token.content;
      let id = "mermaid" + Math.round(Math.random() * 10000000);
      try {
        return mermaidAPI.render(id, mermaidMarkup, noop);
      } catch (err) {
        // If error, we have to clean up the fake element mermaid creates
        const fakeElement = document.getElementById(id);
        if (fakeElement) {
          const fakeParent = fakeElement.parentElement;
          if (fakeParent) {
            fakeParent.outerHTML = "";
          }
        }
        return `<pre>${JSON.stringify(err)}</pre>`;
      }
    } else {
      return fenceRenderer(tokens, idx, ...rest);
    }
  }) as TokenRender;
};

const mermaidMarkdownIt: MarkdownItPlugin = (md, ...params) => {
  mermaidAPI.initialize({});
  const oldFenceRule = md.renderer.rules.fence as TokenRender;
  md.renderer.rules.fence = createMermaidRule(oldFenceRule);
};

export default mermaidMarkdownIt;
