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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboardForSeries = exports.deleteQuizSeries = exports.updateQuizSeries = exports.getQuizSeriesById = exports.getAllUsersSeries = exports.createNewQuizSeries = exports.deleteQuizEvent = exports.updateQuizEvent = exports.getQuizEventById = exports.getAllUsersEvent = exports.createNewQuizEvent = void 0;
const quiz_1 = require("../shemas/quiz");
const createNewQuizEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user_id;
    const { title, host_entry_code, entry_code, quiz, scheduled_date } = req.body;
    try {
        const event = yield quiz_1.QuizEventModel.create({
            title,
            host_entry_code,
            entry_code,
            quiz,
            scheduled_date,
            creator: user,
        });
        res.success(event, 'Event Created');
    }
    catch (error) {
        next(error);
    }
});
exports.createNewQuizEvent = createNewQuizEvent;
const getAllUsersEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const userEvents = yield quiz_1.QuizEventModel.find({ creator: id })
            .populate('creator')
            .select('-host_entry_code, -entry_code, -leaderboard');
        res.success(userEvents, 'User Created Events');
    }
    catch (error) {
        next(error);
    }
});
exports.getAllUsersEvent = getAllUsersEvent;
const getQuizEventById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const event = yield quiz_1.QuizEventModel.findById(id)
            .populate('creator')
            .select('-host_entry_code, -entry_code');
        res.success(event, 'Quiz Event Details');
    }
    catch (error) {
        next(error);
    }
});
exports.getQuizEventById = getQuizEventById;
const updateQuizEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const details = req.body;
    try {
        const updatedEvent = yield quiz_1.QuizEventModel.findByIdAndUpdate(id, details, {
            new: true,
        });
        res.success(updatedEvent, 'Event Updated Successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.updateQuizEvent = updateQuizEvent;
const deleteQuizEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield quiz_1.QuizEventModel.findByIdAndDelete(id);
        res.success('Event Deleted');
    }
    catch (error) {
        next(error);
    }
});
exports.deleteQuizEvent = deleteQuizEvent;
const createNewQuizSeries = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user_id;
    const { title } = req.body;
    try {
        const series = yield quiz_1.QuizSeriesModel.create({ title, creator: user });
        res.success(series, 'Series Created Successfuly');
    }
    catch (error) {
        next(error);
    }
});
exports.createNewQuizSeries = createNewQuizSeries;
const getAllUsersSeries = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const userCrestedSeries = yield quiz_1.QuizSeriesModel.find({ creator: id });
        res.success(userCrestedSeries, 'User Created Series');
    }
    catch (error) {
        next(error);
    }
});
exports.getAllUsersSeries = getAllUsersSeries;
const getQuizSeriesById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const event = yield quiz_1.QuizSeriesModel.findById(id);
        res.success(event, 'Quiz Series Details');
    }
    catch (error) {
        next(error);
    }
});
exports.getQuizSeriesById = getQuizSeriesById;
const updateQuizSeries = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const details = req.body;
    try {
        const updatedEvent = yield quiz_1.QuizSeriesModel.findByIdAndUpdate(id, details, {
            new: true,
        });
        res.success(updatedEvent, 'Series Updated Successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.updateQuizSeries = updateQuizSeries;
const deleteQuizSeries = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield quiz_1.QuizSeriesModel.findByIdAndDelete(id);
        res.success('Series Deleted');
    }
    catch (error) {
        next(error);
    }
});
exports.deleteQuizSeries = deleteQuizSeries;
const getLeaderboardForSeries = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const leaderboard = yield quiz_1.QuizSeriesModel.aggregate([
            { $match: { _id: id } },
            {
                $lookup: {
                    from: 'quizevents',
                    localField: 'events',
                    foreignField: '_id',
                    as: 'eventDetails',
                },
            },
            { $unwind: '$eventDetails' },
            { $unwind: '$eventDetails.leaderboard' },
            {
                $match: {
                    'eventDetails.leaderboard.player.team_id': {
                        $exists: true,
                        $ne: null,
                    },
                },
            },
            {
                $group: {
                    _id: '$eventDetails.leaderboard.player.team_id',
                    totalScore: { $sum: '$eventDetails.leaderboard.score' },
                    players: { $addToSet: '$eventDetails.leaderboard.player.name' },
                },
            },
            { $sort: { totalScore: -1 } },
        ]);
        res.success(leaderboard, 'Series Leaderboard');
    }
    catch (error) {
        next(error);
    }
});
exports.getLeaderboardForSeries = getLeaderboardForSeries;
//# sourceMappingURL=event.js.map