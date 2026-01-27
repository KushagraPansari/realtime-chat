import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500,
      default: ""
    },
    avatar: {
      type: String,
      default: ""
    },
    members: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ createdBy: 1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;