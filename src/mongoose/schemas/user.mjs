import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  }
})

export const UserDBModel = mongoose.model('User', schema);
