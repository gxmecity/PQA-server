"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authentication_1 = require("../middlewares/authentication");
const authentication_2 = require("../controllers/authentication");
exports.default = (router) => {
    router.post('/auth/signup', authentication_2.registerUser);
    router.post('/auth/login', authentication_2.loginUser);
    router.get(`/auth/retrieve-session`, authentication_1.authMiddleware, authentication_2.retrieveSession);
    router.get(`/auth/dashboard-stats`, authentication_1.authMiddleware, authentication_2.getDashBoardStats);
    router.get('/auth/user/:id', authentication_2.getUserDetails);
    router.get('/teams/:id', authentication_2.getQuizMasterTeams);
    router.get('/team/:id', authentication_2.getTeamById);
    router.post('/team/register', authentication_2.registerTeam);
    router.patch('/team/update/:id', authentication_2.updateTeamInfo);
};
//# sourceMappingURL=authentication.js.map