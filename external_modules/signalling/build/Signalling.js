"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
var SignallingMessage_1 = __importDefault(require("./SignallingMessage"));
var Signalling = /** @class */ (function () {
    function Signalling(onAssignedPeerId, onNewPeer, onDescription, onIceCandidate) {
        var _this = this;
        this.handleOnOpen = function () {
            var _a, _b;
            (_b = (_a = _this).onOpen) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        this.handleOnClose = function (_) {
            var _a, _b;
            (_b = (_a = _this).onClose) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        this.handleOnMessage = function (event) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            if (typeof event.data === "string") {
                var msg = SignallingMessage_1.default.fromJson(event.data);
                if (msg.isNewPeer()) {
                    (_b = (_a = _this).onNewPeer) === null || _b === void 0 ? void 0 : _b.call(_a, msg);
                }
                if (msg.isDescription()) {
                    (_d = (_c = _this).onDescription) === null || _d === void 0 ? void 0 : _d.call(_c, msg);
                }
                if (msg.isIceCandidate()) {
                    (_f = (_e = _this).onIceCandidate) === null || _f === void 0 ? void 0 : _f.call(_e, msg);
                }
                if (msg.isAssignedPeerId()) {
                    (_h = (_g = _this).onAssignedPeerId) === null || _h === void 0 ? void 0 : _h.call(_g, msg);
                }
            }
        };
        this.send = function (message) {
            var _a;
            (_a = _this.ws) === null || _a === void 0 ? void 0 : _a.send(message.toJson());
        };
        this.onAssignedPeerId = onAssignedPeerId;
        this.onNewPeer = onNewPeer;
        this.onDescription = onDescription;
        this.onIceCandidate = onIceCandidate;
    }
    Object.defineProperty(Signalling.prototype, "readyState", {
        get: function () {
            var _a;
            return (_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState;
        },
        enumerable: true,
        configurable: true
    });
    Signalling.prototype.connect = function (url) {
        this.ws = new isomorphic_ws_1.default(url);
        this.ws.onopen = this.handleOnOpen;
        this.ws.onclose = this.handleOnClose;
        this.ws.onmessage = this.handleOnMessage;
    };
    Signalling.prototype.close = function () {
        var _a;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
    };
    return Signalling;
}());
exports.default = Signalling;
//# sourceMappingURL=Signalling.js.map