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
exports.uploadedQuestionsCSV = exports.deleteQuizRound = exports.updateQuizRound = exports.addNewQuizRound = exports.deleteQuiz = exports.updateQuizDetails = exports.createNewQuiz = exports.getUserQuizDetailsById = exports.getQuizDetailsById = exports.getUsersQuizList = exports.getAllPublishedQuizList = void 0;
const convert_csv_to_json_1 = __importDefault(require("convert-csv-to-json"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const quiz_1 = require("../shemas/quiz");
const getAllPublishedQuizList = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const publishedQuizList = yield quiz_1.QuizModel.find({ publish: true })
            .populate('creator')
            .select('-rounds.questions.answer');
        res.success(publishedQuizList, 'List of avaiable quizes');
    }
    catch (error) {
        next(error);
    }
});
exports.getAllPublishedQuizList = getAllPublishedQuizList;
const getUsersQuizList = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user_id;
    try {
        const userQuizList = yield quiz_1.QuizModel.find({ creator: user })
            .populate('creator')
            .sort({ createdAt: -1 })
            .select('-rounds.questions.answer');
        res.success(userQuizList, 'List of user quizes');
    }
    catch (error) {
        next(error);
    }
});
exports.getUsersQuizList = getUsersQuizList;
const getQuizDetailsById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const quiz = yield quiz_1.QuizModel.findById(id)
            .populate('creator')
            .select('-rounds.questions.answer');
        res.success(quiz, 'List of user quizes');
    }
    catch (error) {
        next(error);
    }
});
exports.getQuizDetailsById = getQuizDetailsById;
const getUserQuizDetailsById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = req.user_id;
    try {
        const quiz = yield quiz_1.QuizModel.findOne({ _id: id, creator: user });
        res.success(quiz, 'List of user quizes');
    }
    catch (error) {
        next(error);
    }
});
exports.getUserQuizDetailsById = getUserQuizDetailsById;
const createNewQuiz = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user_id;
    const { title, description } = req.body;
    try {
        const newQuiz = yield quiz_1.QuizModel.create({
            title,
            description,
            creator: user,
        });
        res.success(newQuiz, 'Quiz created successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.createNewQuiz = createNewQuiz;
const updateQuizDetails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const details = req.body;
    try {
        const updatedQuiz = yield quiz_1.QuizModel.findByIdAndUpdate(id, { $set: details }, {
            new: true,
            runValidators: true,
        });
        res.success(updatedQuiz, 'Quiz updated successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.updateQuizDetails = updateQuizDetails;
const deleteQuiz = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield quiz_1.QuizModel.findByIdAndDelete(id);
        res.success(null, 'Quiz Deleted successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.deleteQuiz = deleteQuiz;
const addNewQuizRound = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const details = req.body;
    try {
        const updatedQuiz = yield quiz_1.QuizModel.findByIdAndUpdate(id, {
            $push: { rounds: details },
        }, {
            new: true,
        });
        res.success(updatedQuiz, 'Quiz updated successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.addNewQuizRound = addNewQuizRound;
const updateQuizRound = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user_id;
    const { id, round_id } = req.params;
    const details = req.body;
    try {
        const updatedQuiz = yield quiz_1.QuizModel.updateOne({ _id: id, 'rounds._id': round_id }, { $set: { 'rounds.$': details } });
        res.success(updatedQuiz, 'Quiz updated successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.updateQuizRound = updateQuizRound;
const deleteQuizRound = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user_id;
    const { id, round_id } = req.params;
    try {
        const updatedQuiz = yield quiz_1.QuizModel.findByIdAndUpdate(id, {
            $pull: { rounds: { _id: round_id } },
        }, {
            new: true,
        });
        res.success(updatedQuiz, 'Quiz updated successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.deleteQuizRound = deleteQuizRound;
const uploadedQuestionsCSV = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const filePath = path_1.default.join(__dirname, req.file.path);
    try {
        const jsonResult = convert_csv_to_json_1.default.getJsonFromCsv(filePath);
        fs_1.default.unlinkSync(filePath);
        res.success(jsonResult, 'Questions converted');
    }
    catch (error) {
        next(error);
    }
});
exports.uploadedQuestionsCSV = uploadedQuestionsCSV;
//# sourceMappingURL=quiz.js.map