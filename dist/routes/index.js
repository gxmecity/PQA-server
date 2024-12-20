"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = __importDefault(require("./authentication"));
const quiz_1 = __importDefault(require("./quiz"));
const events_1 = __importDefault(require("./events"));
const router = express_1.default.Router();
exports.default = () => {
    (0, authentication_1.default)(router);
    (0, quiz_1.default)(router);
    (0, events_1.default)(router);
    return router;
};
//# sourceMappingURL=index.js.map