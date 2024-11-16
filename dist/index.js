"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const body_parser_1 = __importDefault(require("body-parser"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const successHandler_1 = __importDefault(require("./middlewares/successHandler"));
const dbConect_1 = require("./config/dbConect");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use(body_parser_1.default.urlencoded({
    extended: false,
}));
app.use(body_parser_1.default.json());
const server = http_1.default.createServer(app);
(0, dbConect_1.dbConnect)();
server.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
app.use(successHandler_1.default);
app.use('/api', (0, routes_1.default)());
app.use(errorHandler_1.default);
//# sourceMappingURL=index.js.map