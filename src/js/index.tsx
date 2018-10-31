import * as React from "react";
import { render } from "react-dom";

import "highlight.js/styles/default.css";
import md from "markdown-it";
import hljs from "highlight.js";
import katexMarkdownPlugin from "./katex-markdown-it";

import App from "./App";

import "../style/main.scss";
import mermaidMarkdownIt from "./mermaid-markdown-it";

function start() {
  const parser = md({
    highlight: function(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(lang, str).value;
        } catch (__) {}
      }

      return ""; // use external default escaping
    },
    html: true,
    linkify: true,
    typographer: true
  });
  parser.use(katexMarkdownPlugin);
  parser.use(mermaidMarkdownIt);

  const appElement = document.getElementById("app");
  render(<App md={parser} />, appElement);

  //const mdArea = document.getElementById("md-area");
  //const inputArea = document.getElementById("input-area") as HTMLTextAreaElement;

  //function renderMd(markdown: string) {
  //  return parser.render(markdown);
  //}

  //inputArea.addEventListener("input", event => {
  //  const target = event.target as HTMLTextAreaElement;
  //  mdArea.innerHTML = renderMd(target.value);
  //});
}

if (document.readyState === "complete") {
  start();
} else {
  window.addEventListener("load", start);
}
