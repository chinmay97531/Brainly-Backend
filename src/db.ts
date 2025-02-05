import mongoose, { model, Schema } from "mongoose";
import { MONGODBURL } from "./config";

mongoose.connect(MONGODBURL);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const contentSchema = new Schema({
    title: { type: String, required: true },
    type: String,
    link: { type: String, required: true },
    tags: [{type: mongoose.Types.ObjectId, ref: 'Tag'}],
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true }
})

const linkSchema = new Schema({
    hash: String,
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true, unique: true },
})

const UserModel = model("User", userSchema);
const ContentModel = model("Content", contentSchema);
const LinkModel = model("Link", linkSchema);

export { 
    UserModel,
    ContentModel,
    LinkModel
};
