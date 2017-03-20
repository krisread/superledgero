const _ = require('lodash');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const SuperledgeroError = require('./superledgero_error');

const PostingSchema = new Schema({
  account: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    index: true,
    required: true
  },
  entry: {
    type: Schema.Types.ObjectId,
    ref: 'Entry',
    index: true,
    required: true
  },
  changeCents: {
    type: Number,
    required: true
  },
  memo: String
});

PostingSchema.methods.isDebit = function() {
  return this.changeCents < 0;
};

PostingSchema.methods.isCredit = function() {
  return this.changeCents < 0;
};

PostingSchema.pre('save', function(next) {
  // todo doesn't work WHYY?
  //  if (!this.isNew) next(new SuperledgeroError('Cannot edit Postings'));
  next();
});

module.exports = PostingSchema;
