"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var SignallingEvent;
(function (SignallingEvent) {
    SignallingEvent[SignallingEvent["PING"] = 0] = "PING";
    SignallingEvent[SignallingEvent["PONG"] = 1] = "PONG";
    SignallingEvent[SignallingEvent["NEW_PEER"] = 2] = "NEW_PEER";
    SignallingEvent[SignallingEvent["DESCRIPTION"] = 3] = "DESCRIPTION";
    SignallingEvent[SignallingEvent["ICE_CANDIDATE"] = 4] = "ICE_CANDIDATE";
    SignallingEvent[SignallingEvent["ASSIGNED_PEER_ID"] = 5] = "ASSIGNED_PEER_ID";
})(SignallingEvent = exports.SignallingEvent || (exports.SignallingEvent = {}));
var SignallingMessage = /** @class */ (function () {
    function SignallingMessage(event, args) {
        this.event = event;
        this.args = args;
    }
    SignallingMessage.prototype.toJson = function () {
        return JSON.stringify([this.event, this.args]);
    };
    SignallingMessage.prototype.isPing = function () {
        return this.event === SignallingEvent.PING;
    };
    SignallingMessage.prototype.isPong = function () {
        return this.event === SignallingEvent.PONG;
    };
    SignallingMessage.prototype.isNewPeer = function () {
        return this.event === SignallingEvent.NEW_PEER;
    };
    SignallingMessage.prototype.isDescription = function () {
        return this.event === SignallingEvent.DESCRIPTION;
    };
    SignallingMessage.prototype.isIceCandidate = function () {
        return this.event === SignallingEvent.ICE_CANDIDATE;
    };
    SignallingMessage.prototype.isAssignedPeerId = function () {
        return this.event === SignallingEvent.ASSIGNED_PEER_ID;
    };
    SignallingMessage.fromJson = function (json) {
        var data = JSON.parse(json);
        var event = data[0];
        var args = data[1];
        switch (event) {
            case SignallingEvent.PING:
                return new Ping();
            case SignallingEvent.PONG:
                return new Pong();
            case SignallingEvent.NEW_PEER:
                return new NewPeer(args[0]);
            case SignallingEvent.DESCRIPTION:
                return new Description(args[0], args[1]);
            case SignallingEvent.ICE_CANDIDATE:
                return new IceCandidate(args[0], args[1]);
            case SignallingEvent.ASSIGNED_PEER_ID:
                return new AssignedPeerId(args[0]);
            default:
                throw new Error("Unknown SignallingEvent");
        }
    };
    return SignallingMessage;
}());
exports.default = SignallingMessage;
var Ping = /** @class */ (function (_super) {
    __extends(Ping, _super);
    function Ping() {
        return _super.call(this, SignallingEvent.PING) || this;
    }
    return Ping;
}(SignallingMessage));
exports.Ping = Ping;
var Pong = /** @class */ (function (_super) {
    __extends(Pong, _super);
    function Pong() {
        return _super.call(this, SignallingEvent.PONG) || this;
    }
    return Pong;
}(SignallingMessage));
exports.Pong = Pong;
var NewPeer = /** @class */ (function (_super) {
    __extends(NewPeer, _super);
    function NewPeer(peerId) {
        var _this = _super.call(this, SignallingEvent.NEW_PEER, [peerId]) || this;
        _this.peerId = peerId;
        return _this;
    }
    return NewPeer;
}(SignallingMessage));
exports.NewPeer = NewPeer;
var Description = /** @class */ (function (_super) {
    __extends(Description, _super);
    function Description(remoteDescription, peerId) {
        var _this = _super.call(this, SignallingEvent.DESCRIPTION, [remoteDescription, peerId]) || this;
        _this.remoteDescription = remoteDescription;
        _this.peerId = peerId;
        return _this;
    }
    return Description;
}(SignallingMessage));
exports.Description = Description;
var IceCandidate = /** @class */ (function (_super) {
    __extends(IceCandidate, _super);
    function IceCandidate(iceCandidate, peerId) {
        var _this = _super.call(this, SignallingEvent.ICE_CANDIDATE, [iceCandidate, peerId]) || this;
        _this.iceCandidate = iceCandidate;
        _this.peerId = peerId;
        return _this;
    }
    return IceCandidate;
}(SignallingMessage));
exports.IceCandidate = IceCandidate;
var AssignedPeerId = /** @class */ (function (_super) {
    __extends(AssignedPeerId, _super);
    function AssignedPeerId(peerId) {
        var _this = _super.call(this, SignallingEvent.ASSIGNED_PEER_ID, [peerId]) || this;
        _this.peerId = peerId;
        return _this;
    }
    return AssignedPeerId;
}(SignallingMessage));
exports.AssignedPeerId = AssignedPeerId;
//# sourceMappingURL=SignallingMessage.js.map