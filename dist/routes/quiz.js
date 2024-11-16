"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const quiz_1 = require("../controllers/quiz");
const multer_1 = require("../middlewares/multer");
const authentication_1 = require("../middlewares/authentication");
exports.default = (router) => {
    router.get('/quiz', quiz_1.getAllPublishedQuizList);
    router.get('/quiz/:id', quiz_1.getQuizDetailsById);
    router.get('/quiz/my-quiz', authentication_1.authMiddleware, quiz_1.getUsersQuizList);
    router.post('/quiz/my-quiz', authentication_1.authMiddleware, quiz_1.createNewQuiz);
    router.get('/quiz/my-quiz/:id', authentication_1.authMiddleware, quiz_1.getUserQuizDetailsById);
    router.patch('/quiz/my-quiz/:id', authentication_1.authMiddleware, quiz_1.updateQuizDetails);
    router.delete('/quiz/my-quiz/:id', authentication_1.authMiddleware, quiz_1.deleteQuiz);
    router.post('/quiz/my-quiz/:id/round', authentication_1.authMiddleware, quiz_1.addNewQuizRound);
    router.patch('/quiz/my-quiz/:id/round/:round_id', authentication_1.authMiddleware, quiz_1.updateQuizRound);
    router.delete('/quiz/my-quiz/:id/round/:round_id', authentication_1.authMiddleware, quiz_1.deleteQuizRound);
    router.post('/quiz/upload', authentication_1.authMiddleware, multer_1.upload.single('file'), quiz_1.uploadedQuestionsCSV);
};
//# sourceMappingURL=quiz.js.map