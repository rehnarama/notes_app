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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var signalling_1 = require("signalling");
var Connection_1 = __importDefault(require("./Connection"));
var Hook_1 = __importDefault(require("./Hook"));
var FullMeshNetwork = /** @class */ (function () {
    /**
     * Constructs a new network
     * @param signallingUrl The url of the signalling server, e.g.
     *        ws://localhost:8080
     */
    function FullMeshNetwork(signallingUrl) {
        var _this = this;
        this.allPeers = new Map();
        this.connectedPeers = new Map();
        this.onConnection = new Hook_1.default();
        this.handleOnAssignedPeerId = function (assignedPeerId) {
            _this.localId = assignedPeerId.peerId;
        };
        this.handleOnNewPeer = function (newPeer) { return __awaiter(_this, void 0, void 0, function () {
            var connection, offer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        connection = this.createNewConnection(newPeer.peerId);
                        return [4 /*yield*/, connection.createOffer()];
                    case 1:
                        offer = _a.sent();
                        this.signalling.send(new signalling_1.Description(offer, newPeer.peerId));
                        return [2 /*return*/];
                }
            });
        }); };
        this.handleOnDescription = function (description) { return __awaiter(_this, void 0, void 0, function () {
            var connection, answer, connection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(description.remoteDescription.type === "offer")) return [3 /*break*/, 2];
                        connection = this.createNewConnection(description.peerId);
                        return [4 /*yield*/, connection.createAnswer(description.remoteDescription)];
                    case 1:
                        answer = _a.sent();
                        this.signalling.send(new signalling_1.Description(answer, description.peerId));
                        return [3 /*break*/, 3];
                    case 2:
                        connection = this.allPeers.get(description.peerId);
                        if (!connection) {
                            throw new Error("Couldn't find connection with peer id " + description.peerId);
                        }
                        connection.setRemoteDescription(description.remoteDescription);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.handleOnIceCandidate = function (iceCandidate) {
            var connection = _this.allPeers.get(iceCandidate.peerId);
            if (!connection) {
                throw new Error("Couldn't find connection with peer id " + iceCandidate.peerId);
            }
            connection.addRemoteIceCandidate(iceCandidate.iceCandidate);
        };
        this.signalling = new signalling_1.Signalling(this.handleOnAssignedPeerId, this.handleOnNewPeer, this.handleOnDescription, this.handleOnIceCandidate);
        this.signalling.connect(signallingUrl);
    }
    Object.defineProperty(FullMeshNetwork.prototype, "connections", {
        get: function () {
            return Array.from(this.connectedPeers.values());
        },
        enumerable: true,
        configurable: true
    });
    FullMeshNetwork.prototype.createNewConnection = function (peerId) {
        var _this = this;
        var connection = new Connection_1.default(peerId);
        this.allPeers.set(peerId, connection);
        connection.onLocalIceCandidate.add(function (iceCandidate) {
            _this.signalling.send(new signalling_1.IceCandidate(iceCandidate, peerId));
        });
        connection.onChannelOpen.add(function () {
            if (!_this.connectedPeers.has(peerId)) {
                _this.connectedPeers.set(peerId, connection);
            }
            _this.onConnection.call(connection);
        });
        return connection;
    };
    /**
     * Closes all peer connections and connection to signaling server
     */
    FullMeshNetwork.prototype.close = function () {
        var e_1, _a;
        this.signalling.close();
        try {
            for (var _b = __values(this.allPeers.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var connection = _c.value;
                connection.close();
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.allPeers.clear();
        this.connectedPeers.clear();
    };
    FullMeshNetwork.prototype.toJSON = function () {
        return {
            signalling: this.signalling,
            allPeers: Array.from(this.allPeers.entries()),
            connectedPeers: Array.from(this.connectedPeers.entries()),
            localId: this.localId
        };
    };
    return FullMeshNetwork;
}());
exports.default = FullMeshNetwork;
//# sourceMappingURL=FullMeshNetwork.js.map