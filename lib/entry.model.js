const _ = require('lodash');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const TimestampPlugin = require('mongoose-timestamp');

const PostingSchema = require('./_posting.schema');
const { AccountStatuses, Currencies } = require('./constants');
const SuperledgeroError = require('./superledgero_error');

// todo disallow change to ledger, unposting, unvoiding, deleting memos, etc via validations
const EntrySchema = new Schema({
  ledger: {
    type: Schema.Types.ObjectId,
    ref: 'Ledger',
    index: true,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    enum: Currencies
  },
  posted: {
    type: Boolean,
    required: true,
    default: false
  },
  postedAt: {
    type: Date,
    required: false
  },
  voided: {
    type: Boolean,
    required: true,
    default: false
  },
  voidedAt: {
    type: Date,
    required: false
  },
  memos: {
    type: [String],
    default: []
  },
  postings: {
    type: [PostingSchema]
  }
});
EntrySchema.plugin(TimestampPlugin);

EntrySchema.methods.debits = function() {
  return _.filter(this.postings, posting => posting.changeCents < 0);
};

EntrySchema.methods.credits = function() {
  return _.filter(this.postings, posting => posting.changeCents > 0);
};

EntrySchema.methods.sumCents = function() {
   return _.reduce(this.postings, function (result, posting) {
     return result + posting.changeCents;
   },0);
};

EntrySchema.methods.isBalanced = function() {
  return this.sumCents() === 0;
};

// todo check to make sure certain fields aren't modified before save()?
EntrySchema.methods.post = async function(memo=undefined) {
  if (this.posted) throw new SuperledgeroError('Entry already posted');
  if (this.voided) throw new SuperledgeroError('Entry already voided');
  if (!await this.isBalanced()) throw new SuperledgeroError('Entry is not balanced');
  if (memo) this.memos.push(memo);
  this.posted = true;
  this.postedAt = new Date();
  return this.save();
};

// todo check to make sure certain fields aren't modified before save()?
EntrySchema.methods.void = async function(memo=undefined) {
  if (this.voided) throw new SuperledgeroError('Entry already voided');
  if (!this.posted) throw new SuperledgeroError('Unposted entry cannot be void');
  if (!await this.isBalanced()) throw new SuperledgeroError('Entry is not balanced');
  if (memo) this.memos.push(memo);
  this.voided = true;
  this.voidedAt = new Date();
  return this.save();
};

function validatePosting(account, changeCents) {
  if(!Number.isInteger(changeCents)) throw new SuperledgeroError(('Amounts must be in cents with no decimal: ' + String(changeCents)));
  if (changeCents <= 0) throw new SuperledgeroError('Amounts for credits or debits must be positive');
  if (this.posted) throw new SuperledgeroError('Cannot modify a posted entry');
  if (this.voided) throw new SuperledgeroError('Cannot modify a voided entry');
  if (this.currency !== account.currency) throw new SuperledgeroError('Account currency must match ' + this.currency);
  if(account.status === AccountStatuses.FROZEN) throw new SuperledgeroError('Cannot modify a frozen account');
  if(account.status === AccountStatuses.CLOSED) throw new SuperledgeroError('Cannot modify a closed account');
}

EntrySchema.methods.debit = function(account, changeCents, memo) {
  validatePosting.call(this, account, changeCents);
  this.postings.push({account: account._id, entry: this._id, changeCents: -changeCents, memo});
  return this;
};

EntrySchema.methods.credit = function(account, changeCents, memo) {
  validatePosting.call(this, account, changeCents);
  this.postings.push({account: account._id, entry: this._id, changeCents, memo});
  return this;
};

EntrySchema.methods.memo = function(msg) {
  this.memos.push(msg);
  return this;
};

module.exports = mongoose.model('Entry', EntrySchema);


