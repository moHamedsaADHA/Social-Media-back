import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
            required: true,
    },
    text: {
        type: String,
        required: true,
    },
    replies: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
    }],
}, { timestamps: true })

commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ post: 1, createdAt: -1 }, { sparse: true });

export default mongoose.model('Comment', commentSchema);
