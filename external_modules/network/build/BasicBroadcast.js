"use strict";
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
var Hook_1 = __importDefault(require("./Hook"));
var BasicBroadcast = /** @class */ (function () {
    function BasicBroadcast(network, header) {
        var e_1, _a;
        var _this = this;
        if (header === void 0) { header = "BB"; }
        this.isOffline = false;
        this.offlineSendBuffer = [];
        this.offlineReceiveBuffer = [];
        this.handleOnConnection = function (connection) {
            connection.onMessage.add(_this.receive);
        };
        this.receive = function (data) {
            if (_this.isOffline) {
                _this.offlineReceiveBuffer.push(data);
            }
            else {
                var payload = JSON.parse(data);
                if (Array.isArray(payload) && payload[0] === _this.header) {
                    var message = payload[1];
                    _this.bDeliver.call(message);
                }
            }
        };
        this.bDeliver = new Hook_1.default();
        this.network = network;
        this.header = header;
        try {
            for (var _b = __values(this.network.connections), _c = _b.next(); !_c.done; _c = _b.next()) {
                var connection = _c.value;
                this.handleOnConnection(connection);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.network.onConnection.add(this.handleOnConnection);
    }
    /**
     * If set to true, messages will be buffered to simulate an offline connection
     */
    BasicBroadcast.prototype.setOffline = function (isOffline) {
        this.isOffline = isOffline;
        if (!isOffline) {
            this.processOfflineBuffer();
        }
    };
    BasicBroadcast.prototype.processOfflineBuffer = function () {
        var e_2, _a, e_3, _b;
        // We store the buffer localy temporarily
        var sendBuffer = this.offlineSendBuffer;
        var receiveBuffer = this.offlineReceiveBuffer;
        // and create new buffer here, since broadcast/receive-function mutates
        // the offline buffer, we don't want to reset it AFTER calling broadcast
        this.offlineSendBuffer = [];
        this.offlineReceiveBuffer = [];
        try {
            for (var sendBuffer_1 = __values(sendBuffer), sendBuffer_1_1 = sendBuffer_1.next(); !sendBuffer_1_1.done; sendBuffer_1_1 = sendBuffer_1.next()) {
                var msg = sendBuffer_1_1.value;
                this.broadcast(msg);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (sendBuffer_1_1 && !sendBuffer_1_1.done && (_a = sendBuffer_1.return)) _a.call(sendBuffer_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        try {
            for (var receiveBuffer_1 = __values(receiveBuffer), receiveBuffer_1_1 = receiveBuffer_1.next(); !receiveBuffer_1_1.done; receiveBuffer_1_1 = receiveBuffer_1.next()) {
                var data = receiveBuffer_1_1.value;
                this.receive(data);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (receiveBuffer_1_1 && !receiveBuffer_1_1.done && (_b = receiveBuffer_1.return)) _b.call(receiveBuffer_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
    };
    BasicBroadcast.prototype.bBroadcast = function (message) {
        // We can always basic deliver to ourself directly on broadcast
        this.bDeliver.call(message);
        if (this.isOffline) {
            this.offlineSendBuffer.push(message);
        }
        else {
            this.broadcast(message);
        }
    };
    BasicBroadcast.prototype.broadcast = function (message) {
        var e_4, _a;
        var payload = [this.header, message];
        var data = JSON.stringify(payload);
        try {
            for (var _b = __values(this.network.connections), _c = _b.next(); !_c.done; _c = _b.next()) {
                var connection = _c.value;
                connection.send(data);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
    };
    BasicBroadcast.prototype.toJSON = function () {
        return {};
    };
    return BasicBroadcast;
}());
exports.default = BasicBroadcast;
//# sourceMappingURL=BasicBroadcast.js.map