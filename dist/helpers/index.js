"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqueId = void 0;
exports.generateSlug = generateSlug;
function generateSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');
}
const uniqueId = function () {
    return 'id-' + Math.random().toString(36).substr(2, 16);
};
exports.uniqueId = uniqueId;
//# sourceMappingURL=index.js.map