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
exports.TeamModel = void 0;
const mongoose_1 = require("mongoose");
const bcrypt_1 = require("bcrypt");
const helpers_1 = require("../helpers");
const teamsSchema = new mongoose_1.Schema({
    name: { type: String },
    quiz_master: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    slug: { type: String },
    sigil: { type: String },
    team_members: {
        type: [{ type: String }],
        validate: [teamMemberLength, '{PATH} must have at least 2 members'],
    },
    passphrase: { type: String },
}, {
    timestamps: true,
});
function teamMemberLength(val) {
    return val.length > 2;
}
teamsSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const team = this;
        if (team.isModified('name')) {
            this.slug = (0, helpers_1.generateSlug)(this.name);
        }
        try {
            if (!team.isModified('passphrase'))
                return next();
            const salt = (0, bcrypt_1.genSaltSync)(10);
            this.passphrase = yield (0, bcrypt_1.hash)(this.passphrase, salt);
            next();
        }
        catch (error) {
            return next(error);
        }
    });
});
teamsSchema.methods.comparePassphrase = function (enteredPhrase) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, bcrypt_1.compare)(enteredPhrase, this.passphrase);
    });
};
exports.TeamModel = (0, mongoose_1.model)('Team', teamsSchema);
//# sourceMappingURL=teams.js.map