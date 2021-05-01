const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    name: {
        type: String,
        require: true,
        minLength: 1,
    },
    email: {
        type: String,
        require: true,
        unique: true,
        minLength: 1,
    },
    password: {
        type: String,
        require: true,
        minLength: 1,
    },
})

module.exports = mongoose.model('User', userSchema)
