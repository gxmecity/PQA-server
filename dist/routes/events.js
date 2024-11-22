"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authentication_1 = require("../middlewares/authentication");
const event_1 = require("../controllers/event");
exports.default = (router) => {
    router.get('/events/:id', event_1.getAllUsersEvent);
    router.get('/events/event/:id', event_1.getQuizEventById);
    router.get('/play/host/:id', event_1.getQuizEventByHostId);
    router.get('/play/guest/:id', event_1.getQuizEventByEntryId);
    router.post('/events', authentication_1.authMiddleware, event_1.createNewQuizEvent);
    router.patch('/events/event/:id', authentication_1.authMiddleware, event_1.updateQuizEvent);
    router.delete('/events/event/:id', authentication_1.authMiddleware, event_1.deleteQuizEvent);
    router.get('/series/:id', event_1.getAllUsersSeries);
    router.get('/series/series/:id', event_1.getQuizSeriesById);
    router.post('/series', authentication_1.authMiddleware, event_1.createNewQuizSeries);
    router.patch('/series/series/:id', authentication_1.authMiddleware, event_1.updateQuizSeries);
    router.delete('/series/series/:id', authentication_1.authMiddleware, event_1.deleteQuizSeries);
    router.get('/series/leaderboard/:id', event_1.getLeaderboardForSeries);
};
//# sourceMappingURL=events.js.map