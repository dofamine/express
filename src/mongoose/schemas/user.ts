import mongoose, { type InferSchemaType } from 'mongoose';

const userDatabaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
});

export type User = InferSchemaType<typeof userDatabaseSchema>;

export const UserDBModel = mongoose.model('User', userDatabaseSchema);
