"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const quiz_1 = require("../controllers/quiz");
const multer_1 = require("../middlewares/multer");
const authentication_1 = require("../middlewares/authentication");
exports.default = (router) => {
    router.get('/quiz', quiz_1.getAllPublishedQuizList);
    router.get('/quiz/:id', quiz_1.getQuizDetailsById);
    router.get('/my-quiz', authentication_1.authMiddleware, quiz_1.getUsersQuizList);
    router.post('/my-quiz', authentication_1.authMiddleware, quiz_1.createNewQuiz);
    router.get('/my-quiz/:id', authentication_1.authMiddleware, quiz_1.getUserQuizDetailsById);
    router.patch('/my-quiz/:id', authentication_1.authMiddleware, quiz_1.updateQuizDetails);
    router.delete('/my-quiz/:id', authentication_1.authMiddleware, quiz_1.deleteQuiz);
    router.post('/my-quiz/:id/round', authentication_1.authMiddleware, quiz_1.addNewQuizRound);
    router.patch('/my-quiz/:id/round/:round_id', authentication_1.authMiddleware, quiz_1.updateQuizRound);
    router.delete('/my-quiz/:id/round/:round_id', authentication_1.authMiddleware, quiz_1.deleteQuizRound);
    router.post('/quiz-questions/upload', authentication_1.authMiddleware, multer_1.upload.single('file'), quiz_1.uploadedQuestionsCSV);
};
//# sourceMappingURL=quiz.js.map