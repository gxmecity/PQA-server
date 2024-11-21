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
exports.retrieveSession = exports.getUserDetails = exports.deleteUser = exports.updateUser = exports.updateTeamSigil = exports.updateTeamInfo = exports.getTeamById = exports.getQuizMasterTeams = exports.registerTeam = exports.loginTeam = exports.loginUser = exports.registerUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("../middlewares/errorHandler");
const users_1 = require("../shemas/users");
const cloudinary_1 = require("../lib/cloudinary");
const teams_1 = require("../shemas/teams");
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, fullname, role } = req.body;
        if (!email || !password)
            throw new errorHandler_1.CustomError('Invalid Credentials', 400);
        const foundUser = yield users_1.UserModel.findOne({ email });
        if (foundUser)
            throw new errorHandler_1.CustomError('User with this email already exists', 401);
        const newUser = yield users_1.UserModel.create({ email, password, fullname });
        const token = jsonwebtoken_1.default.sign({ _id: newUser._id.toString() }, process.env.JWT_SECRET, {
            expiresIn: '3 days',
        });
        res.success({ user: newUser, token }, 'Account Created Successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const foundUser = yield users_1.UserModel.findOne({ email }).select('+password');
        if (!foundUser)
            throw new errorHandler_1.CustomError('Account Not Found', 401);
        const isPasswordValid = yield foundUser.comparePassword(password);
        if (!isPasswordValid)
            throw new errorHandler_1.CustomError('Invalid Password', 401);
        const token = jsonwebtoken_1.default.sign({ _id: foundUser._id.toString() }, process.env.JWT_SECRET, {
            expiresIn: '3 days',
        });
        res.success({ user: foundUser, token }, 'Logged In Successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.loginUser = loginUser;
const loginTeam = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, passphrase } = req.body;
    try {
        const foundTeam = yield teams_1.TeamModel.findById(id).select('+passphrase');
        const isPhraseValid = yield foundTeam.comparePassphrase(passphrase);
        if (!isPhraseValid)
            throw new errorHandler_1.CustomError('Invalid Passphrase', 401);
        res.success(foundTeam, 'Logged In Successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.loginTeam = loginTeam;
const registerTeam = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, passphrase, team_members, quiz_master } = req.body;
    const file = req.file;
    try {
        if (!name || !passphrase || !quiz_master)
            throw new errorHandler_1.CustomError('Invalid Credentials', 400);
        let asset = '';
        if (file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
            const cldRes = yield (0, cloudinary_1.handleUpload)(dataURI);
            asset = cldRes.secure_url;
        }
        const newTeam = yield teams_1.TeamModel.create({
            name,
            passphrase,
            team_members,
            quiz_master,
            sigil: asset,
        });
        res.success(newTeam, 'Team Created Successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.registerTeam = registerTeam;
const getQuizMasterTeams = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const teams = yield teams_1.TeamModel.find({ quiz_master: id });
        res.success(teams);
    }
    catch (error) {
        next(error);
    }
});
exports.getQuizMasterTeams = getQuizMasterTeams;
const getTeamById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const team = yield teams_1.TeamModel.findById(id).populate('quiz_master');
        res.success(team, 'Team details');
    }
    catch (error) {
        next(error);
    }
});
exports.getTeamById = getTeamById;
const updateTeamInfo = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const details = req.body;
    try {
        const updatedTeam = yield teams_1.TeamModel.findByIdAndUpdate(id, details, {
            new: true,
        });
        res.success(updatedTeam, 'Team Updated Successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.updateTeamInfo = updateTeamInfo;
const updateTeamSigil = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const file = req.file;
    try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
        const cldRes = yield (0, cloudinary_1.handleUpload)(dataURI);
        const asset = cldRes.secure_url;
        const updatedTeam = yield teams_1.TeamModel.findByIdAndUpdate(id, { sigil: asset }, {
            new: true,
        });
        res.success(updatedTeam, 'Sigil Updated Successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.updateTeamSigil = updateTeamSigil;
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user_id = req.user_id;
    const details = req.body;
    try {
        const updatedUser = yield users_1.UserModel.findByIdAndUpdate(user_id, details, {
            new: true,
        });
        res.success(updatedUser, 'Account Updated Succesfully');
    }
    catch (error) {
        next(error);
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user_id = req.user_id;
    try {
        const updatedUser = yield users_1.UserModel.findByIdAndDelete(user_id);
        res.success(null, 'Account Deleted Succesfully');
    }
    catch (error) {
        next(error);
    }
});
exports.deleteUser = deleteUser;
const getUserDetails = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const foundUser = yield users_1.UserModel.findById(id);
        res.success({ user: foundUser });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserDetails = getUserDetails;
const retrieveSession = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    try {
        if (!token) {
            throw new errorHandler_1.CustomError('No Authorization token', 401);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const loggedinUser = yield users_1.UserModel.findById(decoded._id);
        res.success({ user: loggedinUser });
    }
    catch (error) {
        next(error);
    }
});
exports.retrieveSession = retrieveSession;
//# sourceMappingURL=authentication.js.map