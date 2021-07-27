const mongoose = require('mongoose')

const ArticleSchema = new mongoose.Schema({
    custyname: String,
    location: String,
    reviews: String

}, {
    timestamps: true
})

module.exports = ArticleSchema