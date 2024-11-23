"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const helpers_1 = require("./helpers");
const ably_1 = require("ably");
dotenv_1.default.config();
const realtime = new ably_1.Realtime({
    key: process.env.ABLY_API_KEY,
});
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
app.get('/api/realtime-auth', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenParams = { clientId: (0, helpers_1.uniqueId)() };
        const tokenRequest = yield realtime.auth.createTokenRequest(tokenParams);
        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.send(JSON.stringify(tokenRequest));
    }
    catch (error) {
        response
            .status(500)
            .send('Error requesting token: ' + JSON.stringify(error));
    }
}));
app.use(errorHandler_1.default);
//# sourceMappingURL=index.js.map