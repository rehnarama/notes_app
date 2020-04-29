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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Hook_1 = __importDefault(require("../Hook"));
var MockConnection = /** @class */ (function () {
    function MockConnection(remoteId) {
        this.connectionState = "new";
        this.onMessage = new Hook_1.default();
        this.buffer = [];
        this.remoteId = remoteId;
    }
    MockConnection.prototype.send = function (message) {
        this.buffer.push(message);
    };
    MockConnection.prototype.close = function () {
        this.connectionState = "closed";
    };
    MockConnection.prototype.deliver = function () {
        var e_1, _a;
        if (this.peer !== undefined) {
            try {
                for (var _b = __values(this.buffer), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var msg = _c.value;
                    this.peer.onMessage.call(msg, this);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            this.buffer = [];
        }
    };
    MockConnection.createConnections = function (id1, id2) {
        var c1 = new MockConnection(id2); // Remote id will be the OTHER connection
        var c2 = new MockConnection(id1); // hence the flipped 1 & 2
        c1.peer = c2;
        c2.peer = c1;
        return [c1, c2];
    };
    return MockConnection;
}());
exports.MockConnection = MockConnection;
var MockNetwork = /** @class */ (function () {
    function MockNetwork(localId) {
        this.connections = [];
        this.onConnection = new Hook_1.default();
        this.localId = localId;
    }
    MockNetwork.prototype.connect = function (other) {
        var _a = __read(MockConnection.createConnections(this.localId, other.localId), 2), c1 = _a[0], c2 = _a[1];
        this.connections.push(c1);
        other.connections.push(c2);
        this.onConnection.call(c1);
        other.onConnection.call(c2);
    };
    MockNetwork.prototype.deliver = function (peers) {
        var e_2, _a;
        try {
            for (var _b = __values(this.connections), _c = _b.next(); !_c.done; _c = _b.next()) {
                var c = _c.value;
                if (peers === undefined || peers.indexOf(c.remoteId || -1) !== -1) {
                    c.deliver();
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    return MockNetwork;
}());
exports.default = MockNetwork;
//# sourceMappingURL=MockNetwork.js.map