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
    visibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'public',
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

postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 }, { sparse: true });
postSchema.index({ createdAt: -1 });

export default mongoose.model('Post', postSchema);
