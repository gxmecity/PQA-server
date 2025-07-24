"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const errorHandler_1 = __importStar(require("./middlewares/errorHandler"));
const successHandler_1 = __importDefault(require("./middlewares/successHandler"));
const dbConect_1 = require("./config/dbConect");
const helpers_1 = require("./helpers");
const ably_1 = require("ably");
const node_worker_threads_1 = require("node:worker_threads");
const quiz_1 = require("./shemas/quiz");
dotenv_1.default.config();
const globalQuizChName = 'tpq-main-quiz-thread';
let globalQuizChannel;
const activeQuizRooms = {};
let totalPlayersThroughout = 0;
const realtime = new ably_1.Realtime({
    key: process.env.ABLY_API_KEY,
    echoMessages: false,
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
app.get('/api/check-room-status', function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const quizCode = req.query.quizCode;
    try {
        if (!quizCode || typeof quizCode !== 'string')
            throw new errorHandler_1.CustomError('quizCode is required', 400);
        const foundRoom = Object.values(activeQuizRooms).find((room) => {
            return room.hostRoomCode === quizCode || room.roomCode === quizCode;
        });
        if (!foundRoom)
            throw new errorHandler_1.CustomError('Room not found', 404);
        if (!foundRoom.isRoomActive)
            throw new errorHandler_1.CustomError('Quiz Room not open', 400);
        res.success({
            entryCode: foundRoom.roomCode,
            totalPlayers: foundRoom.totalPlayers,
            isHost: foundRoom.hostRoomCode === quizCode,
            creator: foundRoom.host,
            eventMode: foundRoom.eventType,
        }, 'Quiz Room Found');
    }
    catch (error) {
        next(error);
    }
});
app.use(errorHandler_1.default);
realtime.connection.once('connected', () => {
    console.log('Ably Realtime connected');
    globalQuizChannel = realtime.channels.get(globalQuizChName);
    globalQuizChannel.presence.subscribe('enter', (player) => {
        createNewQuizRoom(player.data.roomCode, player.data.hostCode, player.data.quizId, player.data.eventType, player.clientId);
    });
});
const createNewQuizRoom = (roomCode, hostRoomCode, quizId, eventType, hostClientId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!node_worker_threads_1.isMainThread)
        return;
    const quiz = yield quiz_1.QuizModel.findById(quizId).lean();
    const worker = new node_worker_threads_1.Worker('./src/lib/quiz-room-server.js', {
        workerData: {
            roomCode,
            hostRoomCode,
            hostClientId,
            quizId,
            eventType,
            quiz: quiz || null,
            creatorId: quiz.creator.toString() || null,
        },
    });
    console.log(`CREATED NEW WORKER WITH ID ${worker.threadId}`);
    worker.on('message', (msg) => {
        if (msg.roomCode && !msg.killWorker) {
            activeQuizRooms[msg.roomCode] = {
                roomCode: msg.roomCode,
                hostRoomCode: msg.hostRoomCode,
                quizId: msg.quizId,
                totalPlayers: msg.totalPlayers,
                isRoomActive: msg.isRoomActive,
                host: msg.quizHost,
                eventType: msg.eventType,
            };
            totalPlayersThroughout += msg.totalPlayers;
        }
        else if (msg.roomCode && msg.killWorker) {
            totalPlayersThroughout -= msg.totalPlayers;
            delete activeQuizRooms[msg.roomCode];
        }
        else if (msg.roomCode) {
            activeQuizRooms[msg.roomCode].isRoomActive = msg.isRoomActive;
        }
    });
    worker.on('error', (error) => {
        console.error(`Worker error [${worker.threadId}]:`, error);
    });
    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Worker [${worker.threadId}] exited with error code ${code}`);
        }
        else {
            console.log(`Worker [${worker.threadId}] exited cleanly`);
        }
    });
});
//# sourceMappingURL=index.js.map