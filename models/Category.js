import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
        trim: true,
        maxLength: 30
    },
    slug : {
        type: String,
        required: true,
        unique: true
    },
    parentId: {
        type: String
    }
    
}, {timestamps : true})

export const Category = mongoose.model('Category', CategorySchema);
