"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbConnect = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dbConnect = () => {
    try {
        const connect = mongoose_1.default.connect(process.env.MONGODB_URL);
        console.log('Database connected');
    }
    catch (error) {
        console.log(error);
    }
};
exports.dbConnect = dbConnect;
//# sourceMappingURL=dbConect.js.map