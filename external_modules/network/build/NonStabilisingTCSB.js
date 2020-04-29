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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var CausalBroadcast_1 = __importDefault(require("./CausalBroadcast"));
var VectorClock_1 = __importDefault(require("./VectorClock"));
var Hook_1 = __importDefault(require("./Hook"));
var NonStabilisingTCSB = /** @class */ (function (_super) {
    __extends(NonStabilisingTCSB, _super);
    function NonStabilisingTCSB(network, header) {
        if (header === void 0) { header = "NTCSB"; }
        var _this = _super.call(this, network, header) || this;
        _this.tcsStable = new Hook_1.default();
        _this.tcsDeliver = new Hook_1.default();
        _this.onTCDeliver = function (msg) {
            var clock = VectorClock_1.default.fromJson(msg.timestamp.clock);
            _this.tcsDeliver.call(msg.message, clock);
        };
        _this.tcDeliver.add(_this.onTCDeliver);
        return _this;
    }
    NonStabilisingTCSB.prototype.tcsBroadcast = function (message) {
        this.cBroadcast(message);
    };
    NonStabilisingTCSB.prototype.toJSON = function () {
        return __assign({}, _super.prototype.toJSON.call(this));
    };
    return NonStabilisingTCSB;
}(CausalBroadcast_1.default));
exports.default = NonStabilisingTCSB;
//# sourceMappingURL=NonStabilisingTCSB.js.map