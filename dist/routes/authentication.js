"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authentication_1 = require("../middlewares/authentication");
const authentication_2 = require("../controllers/authentication");
const multer_1 = require("../middlewares/multer");
exports.default = (router) => {
    router.post('/auth/signup', authentication_2.registerUser);
    router.post('/auth/login', authentication_2.loginUser);
    router.get(`/auth/retrieve-session`, authentication_1.authMiddleware, authentication_2.retrieveSession);
    router.get('/teams/:id', authentication_2.getQuizMasterTeams);
    router.get('/team/:id', authentication_2.getTeamById);
    router.post('/team/register', multer_1.upload.single('image'), authentication_2.registerTeam);
    router.patch('/team/update/:id', multer_1.upload.single('image'), authentication_2.updateTeamInfo);
    router.get('/testing', (req, res) => {
        res.success('Working');
    });
};
//# sourceMappingURL=authentication.js.map