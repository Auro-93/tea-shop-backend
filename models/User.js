import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type : String,
        required: true,
        trim: true
    },
    email: {
        type : String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
        trim: true
    },
    image: {
        type : String,
        trim: true
    },
    role: {
        type : Number,
        default: 0
    },
    resetPwdToken: {
        type: String
    },
    
    expirePwdToken: {
        type: Date
    }

    
}, {timestamps : true});

export const User = mongoose.model('User', UserSchema);