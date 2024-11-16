"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authentication_1 = require("../controllers/authentication");
const multer_1 = require("../middlewares/multer");
exports.default = (router) => {
    router.post('/auth/signup', authentication_1.registerUser);
    router.post('/auth/login', authentication_1.loginUser);
    router.get(`/auth/retrieve-session`, authentication_1.retrieveSession);
    router.post('/auth/team/register', multer_1.upload.single('image'), authentication_1.registerTeam);
    router.patch('/auth/team/update/:id', authentication_1.updateTeamInfo);
    router.patch('/auth/team/update-sigil/:id', authentication_1.updateTeamSigil);
    router.get('/testing', (req, res) => {
        res.success('Working');
    });
};
//# sourceMappingURL=authentication.js.map