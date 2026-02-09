import { text } from "express";
import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    userId: {
        // foreign key to reference User model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',    
        required: true,
    },
    image: {
        type: String,
    },
    text: {
        type: String,
    },
    // [] ==> because a post can have multiple likes from different users
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    // analytics: keep a counter for comments to avoid counting array length on every request
    commentsCount: {
        type: Number,
        default: 0,
    },
}, { timestamps: true })    

export default mongoose.model('Post', postSchema);
