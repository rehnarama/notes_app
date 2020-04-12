import "regenerator-runtime";
import * as React from "react";
import { render } from "react-dom";

import App from "./Components/App";

import "../style/main.scss";

function start() {
  const appElement = document.getElementById("app");
  render(<App />, appElement);
}

if (document.readyState === "complete") {
  start();
} else {
  window.addEventListener("load", start);
}
