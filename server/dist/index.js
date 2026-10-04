"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middleware/errorHandler");
const authMiddleware_1 = require("./middleware/authMiddleware");
const auth_1 = __importDefault(require("./routes/auth"));
const onboarding_1 = __importDefault(require("./routes/onboarding"));
const kategori_1 = __importDefault(require("./routes/kategori"));
const kegiatanRutin_1 = __importDefault(require("./routes/kegiatanRutin"));
const kegiatanDinamis_1 = __importDefault(require("./routes/kegiatanDinamis"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const shared_1 = __importDefault(require("./routes/shared"));
const magicPaste_1 = __importDefault(require("./routes/magicPaste"));
const scheduleMove_1 = __importDefault(require("./routes/scheduleMove"));
const cron_1 = __importDefault(require("./routes/cron"));
// Initialize services
const cronJobs_1 = require("./services/cronJobs");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Public routes (no auth required)
app.use('/api/shared', shared_1.default);
app.use('/api/cron', cron_1.default);
// Protected routes (auth required)
app.use('/api/auth', authMiddleware_1.authMiddleware, auth_1.default);
app.use('/api/onboarding', authMiddleware_1.authMiddleware, onboarding_1.default);
app.use('/api/kategori', authMiddleware_1.authMiddleware, kategori_1.default);
app.use('/api/rutin', authMiddleware_1.authMiddleware, kegiatanRutin_1.default);
app.use('/api/dinamis', authMiddleware_1.authMiddleware, kegiatanDinamis_1.default);
app.use('/api/calendar', authMiddleware_1.authMiddleware, calendar_1.default);
app.use('/api/analytics', authMiddleware_1.authMiddleware, analytics_1.default);
app.use('/api/schedule', authMiddleware_1.authMiddleware, magicPaste_1.default);
app.use('/api/schedule', authMiddleware_1.authMiddleware, scheduleMove_1.default);
// Simple ping route for UptimeRobot to keep the server awake
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is awake' });
});
app.use(errorHandler_1.errorHandler);
// If not running in Vercel (e.g. local development), start the server and background cron
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        (0, cronJobs_1.startCronJobs)();
    });
}
// Export for Vercel Serverless
exports.default = app;
