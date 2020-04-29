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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Hook_1 = __importDefault(require("./Hook"));
var DEFAULT_CONFIG = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};
var Connection = /** @class */ (function () {
    function Connection(remoteId, config) {
        var _this = this;
        if (config === void 0) { config = DEFAULT_CONFIG; }
        this.onLocalIceCandidate = new Hook_1.default();
        this.onConnectionStateChange = new Hook_1.default();
        this.onChannelOpen = new Hook_1.default();
        this.onMessage = new Hook_1.default();
        this.handleOnConnectionStateChange = function () {
            if (_this.pc !== undefined) {
                _this.onConnectionStateChange.call(_this.pc.connectionState);
            }
        };
        this.handleOnIceCandidate = function (event) {
            if (event.candidate !== null) {
                _this.onLocalIceCandidate.call(event.candidate);
            }
        };
        this.handleOnDataChannel = function (event) {
            _this.channel = event.channel;
            _this.setupChannel();
        };
        this.handleOnChannelOpen = function () {
            _this.onChannelOpen.call();
        };
        this.handleOnChannelMessage = function (event) {
            _this.onMessage.call(event.data, _this);
        };
        this.setRemoteDescription = function (description) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.pc !== undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.pc.setRemoteDescription(new RTCSessionDescription(description))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2: throw new Error("Peer connection is uninitialised");
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.createAnswer = function (description) { return __awaiter(_this, void 0, void 0, function () {
            var description_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.initialise();
                        this.setRemoteDescription(description);
                        if (!(this.pc !== undefined)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.pc.createAnswer()];
                    case 1:
                        description_1 = _a.sent();
                        return [4 /*yield*/, this.pc.setLocalDescription(description_1)];
                    case 2:
                        _a.sent();
                        if (this.pc.localDescription !== null) {
                            return [2 /*return*/, this.pc.localDescription];
                        }
                        else {
                            throw new Error("Could not generate answer from offer");
                        }
                        return [3 /*break*/, 4];
                    case 3: throw new Error("Peer Connection in uninitialised");
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        this.createOffer = function () { return __awaiter(_this, void 0, void 0, function () {
            var offer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.initialise();
                        if (!(this.pc !== undefined)) return [3 /*break*/, 3];
                        // Create a data channel for communication
                        this.channel = this.pc.createDataChannel("channel");
                        this.setupChannel();
                        return [4 /*yield*/, this.pc.createOffer()];
                    case 1:
                        offer = _a.sent();
                        return [4 /*yield*/, this.pc.setLocalDescription(offer)];
                    case 2:
                        _a.sent();
                        if (this.pc.localDescription !== null) {
                            return [2 /*return*/, this.pc.localDescription];
                        }
                        else {
                            throw new Error("Could  not create offer");
                        }
                        return [3 /*break*/, 4];
                    case 3: throw new Error("Peer Connection in uninitialised");
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        this.addRemoteIceCandidate = function (candidate) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.pc !== undefined)) return [3 /*break*/, 5];
                        if (!(candidate instanceof RTCIceCandidate)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.pc.addIceCandidate(candidate)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.pc.addIceCandidate(new RTCIceCandidate(candidate))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5: throw new Error("Peer Connection in uninitialised");
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        this.remoteId = remoteId;
        this.config = config;
    }
    Object.defineProperty(Connection.prototype, "connectionState", {
        get: function () {
            if (this.pc) {
                return this.pc.connectionState;
            }
            else {
                return "new";
            }
        },
        enumerable: true,
        configurable: true
    });
    Connection.prototype.initialise = function () {
        this.pc = new RTCPeerConnection(this.config);
        this.pc.onicecandidate = this.handleOnIceCandidate;
        this.pc.ondatachannel = this.handleOnDataChannel;
        this.pc.onconnectionstatechange = this.handleOnConnectionStateChange;
    };
    Connection.prototype.setupChannel = function () {
        if (this.channel) {
            this.channel.onmessage = this.handleOnChannelMessage;
            this.channel.onopen = this.handleOnChannelOpen;
        }
    };
    Connection.prototype.send = function (message) {
        if (this.channel) {
            // The if-cases is needed due to typescript not accepting it else, even
            // though I think it should!
            if (typeof message === "string") {
                this.channel.send(message);
            }
            else if (message instanceof Blob) {
                this.channel.send(message);
            }
            else if (message instanceof ArrayBuffer) {
                this.channel.send(message);
            }
            else {
                this.channel.send(message);
            }
        }
        else {
            throw new Error("Channel hasn't been opened");
        }
    };
    Connection.prototype.close = function () {
        if (this.pc) {
            this.pc.close();
        }
    };
    return Connection;
}());
exports.default = Connection;
//# sourceMappingURL=Connection.js.map