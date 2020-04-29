"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var SignallingMessage_1 = __importStar(require("./SignallingMessage"));
var ReadyState;
(function (ReadyState) {
    ReadyState[ReadyState["WAITING"] = 0] = "WAITING";
    ReadyState[ReadyState["OPEN"] = 1] = "OPEN";
    ReadyState[ReadyState["ERROR"] = 2] = "ERROR";
})(ReadyState = exports.ReadyState || (exports.ReadyState = {}));
var SignallingServer = /** @class */ (function () {
    function SignallingServer(port) {
        var _this = this;
        if (port === void 0) { port = 8080; }
        this.peers = new Map();
        this.idClock = 0;
        this.onConnection = function (socket) {
            var id = _this.getId();
            _this.peers.set(id, socket);
            var assignedPeerId = new SignallingMessage_1.AssignedPeerId(id);
            _this.send(assignedPeerId, id);
            var newPeerMessage = new SignallingMessage_1.NewPeer(id);
            _this.broadcast(newPeerMessage, id);
            socket.onmessage = function (_a) {
                var stringData = _a.data;
                if (typeof stringData === "string") {
                    var message = SignallingMessage_1.default.fromJson(stringData);
                    if (message.isPing()) {
                        socket.send(new SignallingMessage_1.Pong().toJson());
                    }
                    if (message.isDescription()) {
                        _this.send(new SignallingMessage_1.Description(message.remoteDescription, id), message.peerId);
                    }
                    if (message.isIceCandidate()) {
                        _this.send(new SignallingMessage_1.IceCandidate(message.iceCandidate, id), message.peerId);
                    }
                }
                else {
                    throw new Error("Data was not string. Aborting");
                }
            };
            socket.onclose = function () {
                _this.peers.delete(id);
            };
        };
        this.state = ReadyState.WAITING;
        this.wss = new ws_1.Server({ port: port }, function () {
            _this.state = ReadyState.OPEN;
        });
        this.wss.on("connection", this.onConnection);
    }
    Object.defineProperty(SignallingServer.prototype, "numberOfPeers", {
        get: function () {
            return this.peers.size;
        },
        enumerable: true,
        configurable: true
    });
    SignallingServer.prototype.getId = function () {
        var id = this.idClock;
        this.idClock++;
        return id;
    };
    SignallingServer.prototype.broadcast = function (message, except) {
        var e_1, _a;
        try {
            for (var _b = __values(this.peers.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var id = _c.value;
                if (except === undefined || except !== id) {
                    this.send(message, id);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    SignallingServer.prototype.send = function (message, peerId) {
        var data = typeof message === "string" ? message : message.toJson();
        var ws = this.peers.get(peerId);
        if (ws) {
            ws.send(data);
        }
    };
    SignallingServer.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.wss.close(function (err) {
                            if (err) {
                                reject();
                            }
                            else {
                                resolve();
                            }
                        });
                    })];
            });
        });
    };
    return SignallingServer;
}());
exports.default = SignallingServer;
//# sourceMappingURL=SignallingServer.js.map