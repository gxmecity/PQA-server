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
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const bcrypt_1 = require("bcrypt");
const usersSchema = new mongoose_1.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    raw_pass: {
        type: String,
        select: false,
    },
    profile_img: {
        type: String,
    },
    role: {
        type: String,
        enum: ['single_player', 'quiz_master'],
        default: 'quiz_master',
    },
}, {
    timestamps: true,
});
usersSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        try {
            if (!user.isModified('password'))
                return next();
            const salt = (0, bcrypt_1.genSaltSync)(10);
            this.password = yield (0, bcrypt_1.hash)(this.password, salt);
            next();
        }
        catch (error) {
            return next(error);
        }
    });
});
usersSchema.methods.comparePassword = function (enteredPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, bcrypt_1.compare)(enteredPassword, this.password);
    });
};
exports.UserModel = (0, mongoose_1.model)('User', usersSchema);
//# sourceMappingURL=users.js.map