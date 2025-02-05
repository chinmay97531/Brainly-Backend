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
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./db");
const app = (0, express_1.default)();
const config_1 = require("./config");
const middleware_1 = require("./middleware");
const utils_1 = require("./utils");
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requiredBody = zod_1.z.object({
        username: zod_1.z.string().min(2).max(50),
        password: zod_1.z.string().min(3).max(50),
        email: zod_1.z.string().min(3).max(100).email(),
    });
    const parsedDatawithSuccess = requiredBody.safeParse(req.body);
    if (!parsedDatawithSuccess.success) {
        console.log("Validation Errors:", parsedDatawithSuccess.error.errors);
        res.status(400).json({
            message: "Invalid Data",
            errors: parsedDatawithSuccess.error.errors,
        });
        return;
    }
    const { username, password, email } = parsedDatawithSuccess.data;
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, 5);
        yield db_1.UserModel.create({
            username: username,
            email: email,
            password: hashedPassword,
        });
    }
    catch (err) {
        res.status(400).json({
            message: "User already exists",
        });
        return;
    }
    res.json({
        message: "User Created",
    });
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    const user = yield db_1.UserModel.findOne({
        username: username,
    });
    if (!user) {
        res.status(403).json({
            message: "User not found",
        });
        return;
    }
    const passwordMatch = yield bcrypt_1.default.compare(password, user.password);
    if (passwordMatch) {
        const token = jsonwebtoken_1.default.sign({
            id: user._id.toString(),
        }, config_1.JWT_SECRET);
        res.json({
            token: token,
        });
    }
    else {
        res.status(403).json({
            message: "Incorrect Credentials",
        });
    }
}));
//@ts-ignore
app.post("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = req.body.link;
    const title = req.body.title;
    const type = req.body.type;
    try {
        yield db_1.ContentModel.create({
            link,
            title,
            type,
            //@ts-ignore
            userId: req.userId,
            tags: [],
        });
        res.json({
            message: "Content added",
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error adding content", error: error.message });
    }
}));
//@ts-ignore
app.get("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const content = yield db_1.ContentModel.find({
        userId: userId
    }).populate("userId", "username email");
    res.json({
        content
    });
}));
//@ts-ignore
app.delete("/api/v1/content", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { contentId } = req.body;
    //@ts-ignore
    const objectId = new mongoose_1.default.Types.ObjectId(contentId);
    const result = yield db_1.ContentModel.deleteOne({
        _id: objectId,
        // @ts-ignore
        userId: req.userId
    });
    if (result.deletedCount === 0) {
        return res.status(404).json({ message: "No matching content found to delete" });
    }
    res.json({
        message: "Delete content successfully"
    });
}));
//@ts-ignore
app.post("/api/v1/brain/share", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const share = req.body.share;
    if (share) {
        const existingLink = yield db_1.LinkModel.findOne({
            //@ts-ignore
            userId: req.userId
        });
        if (existingLink) {
            res.json({
                hash: existingLink.hash
            });
            return;
        }
        const hash = (0, utils_1.random)(10);
        yield db_1.LinkModel.create({
            //@ts-ignore
            userId: req.userId,
            hash: hash
        });
        res.json({
            message: "/share/" + hash
        });
    }
    else {
        yield db_1.LinkModel.deleteOne({
            //@ts-ignore
            userId: req.userId
        });
        res.json({
            message: "Updated sharable link"
        });
    }
}));
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hash = req.params.shareLink;
    const link = yield db_1.LinkModel.findOne({
        hash
    });
    if (!link) {
        res.status(411).json({
            message: "Sorry Incoorect Input"
        });
        return;
    }
    const content = yield db_1.ContentModel.find({
        userId: link.userId
    });
    const user = yield db_1.UserModel.findOne({
        _id: link.userId.toString()
    });
    if (!user) {
        res.status(411).json({
            message: "User not found, error should ideally not happen!"
        });
        return;
    }
    res.json({
        username: user.username,
        content: content
    });
}));
app.listen(3000, () => {
    console.log("Server is listening on PORT 3000");
});
