"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token)
        throw new errorHandler_1.CustomError('Authentication token missing', 401);
    try {
        const decoded = jsonwebtoken_1.default.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user_id = decoded._id;
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=authentication.js.map