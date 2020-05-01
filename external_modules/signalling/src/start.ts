import SignallingServer from "./SignallingServer";
import http from "http";

const server = new http.Server((_req, res) => {
  res.writeHead(200);
  res.end();
});
server.listen(process.env.PORT ?? 8080);

const ss = new SignallingServer(server);
