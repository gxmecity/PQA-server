"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizSeriesModel = exports.QuizEventModel = exports.QuizModel = void 0;
const mongoose_1 = require("mongoose");
const QuestionSchema = new mongoose_1.Schema({
    question: {
        question_text: { type: String },
        question_type: { type: String, required: true },
        question_media: {
            type: {
                type: String,
            },
            url: {
                type: String,
            },
        },
        multi_choice_options: {
            type: [String],
            default: [],
        },
        standalone_media: { type: Boolean, default: false },
    },
    answer: {
        answer_text: { type: String },
        is_blackbox: { type: Boolean, default: false },
    },
});
const RoundSchema = new mongoose_1.Schema({
    round_name: { type: String, required: true },
    round_type: { type: String, required: true },
    questions: { type: [QuestionSchema], default: [] },
    timer: { type: Number, required: true },
});
const QuizSchema = new mongoose_1.Schema({
    description: { type: String },
    creator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    publish: { type: Boolean, default: false },
    plays: { type: Number, default: 0 },
    title: { type: String, required: true },
    rounds: { type: [RoundSchema], default: [] },
}, {
    timestamps: true,
});
const ScoreSchema = new mongoose_1.Schema({
    player: {
        name: { type: String, required: true },
        id: { type: String, required: true },
        team_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team' },
    },
    score: { type: Number, default: 0 },
});
const QuizEventSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    host_entry_code: { type: String },
    entry_code: { type: String },
    quiz: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Quiz' },
    scheduled_date: { type: Date },
    finished: { type: Boolean, default: false },
    creator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    leaderboard: { type: [ScoreSchema], default: [] },
}, {
    timestamps: true,
});
const QuizSeriesSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    creator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    events: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'QuizEvent', default: [] }],
}, {
    timestamps: true,
});
exports.QuizModel = (0, mongoose_1.model)('Quiz', QuizSchema);
exports.QuizEventModel = (0, mongoose_1.model)('QuizEvent', QuizEventSchema);
exports.QuizSeriesModel = (0, mongoose_1.model)('QuizSeries', QuizSeriesSchema);
//# sourceMappingURL=quiz.js.map