"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const successHandler = (req, res, next) => {
    res.success = (data, message = "Request was successful", statusCode = 200) => {
        res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    };
    next();
};
exports.default = successHandler;
//# sourceMappingURL=successHandler.js.map