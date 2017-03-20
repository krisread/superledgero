const _ = require('lodash');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const TimestampPlugin = require('mongoose-timestamp');

const Entry = require('./entry.model');
const AccountHistorySchema = require('./_account_history.schema');
const { AccountTypes, AccountStatuses, Currencies } = require('./constants');
const SuperledgeroError = require('./superledgero_error');

// todo prevent re-opening via an edit?
// todo disallow reassigning user, changing type, changing currency in validations?
const AccountSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: Object.keys(AccountTypes),
    index: true
  },
  status: {
    type: String,
    required: true,
    default: AccountStatuses.OPEN,
    enum: Object.keys(AccountStatuses),
    set: function(status) {
      this._status = this.status; // save old status for pre-save hook
      return status;
    }
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    enum: Currencies
  },
  history: [ AccountHistorySchema ],
  memo: String
});
AccountSchema.plugin(TimestampPlugin);

AccountSchema.pre('save', async function (next) {
  if (this.isModified('history')) {  // history is not mutable!
    this.invalidate('history');
  }
  if (this.isModified('status')) {
    this.history.push({ status: this._status });
  }
  return next();
});

AccountSchema.statics.findOrThrow = async function(_id) {
  const acct = await this.findOne({_id});
  if (!acct) throw new SuperledgeroError(`Account not found: ${_id}`);
  return acct;
};

// todo account for voidedAt Date?
function getFindPostingReduction (_id, testFunc, afterDate, beforeDate) {
  const mapReduction = {};
  mapReduction.scope = {
    account: _id,
    test: testFunc
  };
  mapReduction.query = {
    "postings.account": _id,
    voided: false,
    posted: true,
    postedAt: {"$gte": afterDate, "$lte": beforeDate}
  };
  mapReduction.map = function () {
    this.postings.forEach(function (posting) {
      if (posting.account.toString() == account.toString() && test(posting.changeCents))
        emit(posting._id, posting);
    });
  };
  mapReduction.reduce = key => key;
  return mapReduction;
}

AccountSchema.methods.debits = async function(beforeDate=new Date(), afterDate=new Date(0)) {
  const mapReduction = getFindPostingReduction(this._id, val => val < 0, afterDate, beforeDate);
  return Entry.mapReduce(mapReduction).then(results => _.map(results, obj => obj.value));
};

AccountSchema.methods.credits = async function(beforeDate=new Date(), afterDate=new Date(0)) {
  const mapReduction = getFindPostingReduction(this._id, val => val > 0, afterDate, beforeDate);
  return Entry.mapReduce(mapReduction).then(results => _.map(results, obj => obj.value));
};

AccountSchema.methods.close = async function() {
  this.status = AccountStatuses.CLOSED;
  return this.save();
};

AccountSchema.methods.freeze = async function(msg) {
  if (!this.status === AccountStatuses.OPEN) throw new SuperledgeroError('Can only freeze an open account');
  if (msg) this.memo = msg;
  this.status = AccountStatuses.FROZEN;
  return this.save();
};

AccountSchema.methods.unfreeze = async function() {
  this.status = AccountStatuses.OPEN;
  return this.save();
};

// Todo this is just rough...
AccountSchema.methods.audit = async function(beforeDate=new Date(), afterDate=new Date(0)) {
  const mapReduction = getFindPostingReduction(this._id, () => true, afterDate, beforeDate);
  return Entry.mapReduce(mapReduction)
    .then(results => _.map(results, obj => obj.value))
    .then(results => _.sortBy(results, [(posting => posting.createdAt)]));
};

// Build a map reduction query for postings on this account between given dates
// todo account for voidedAt Date?
function getFindPostingChangeAmountsReduction(_id, currency, afterDate, beforeDate) {
  const mapReduction = {};
  mapReduction.scope = {
    account: _id,
    currency
  };
  mapReduction.query = {
    "postings.account": _id,
    voided: false,
    posted: true,
    currency,
    postedAt: {"$gte": afterDate, "$lte": beforeDate}
  };
  mapReduction.map = function () {
    this.postings.forEach(function (posting) {
      if (posting.account.toString() == account.toString())
        emit(posting.account, posting.changeCents);
    });
  };
  return mapReduction;
}

// Get account balance
AccountSchema.methods.balanceCents = async function(beforeDate=new Date(), afterDate=new Date(0)) {
  const mapReduction = getFindPostingChangeAmountsReduction(this._id, this.currency, afterDate, beforeDate);
  mapReduction.reduce  = function(accountId, changeCents) {
    return Array.sum(changeCents);
  };
  return Entry.mapReduce(mapReduction).then(result => result.shift().value);
};

// Get Volume - the greater of the total credits or total debits over the time period.
AccountSchema.methods.volumeCents = async function(beforeDate=new Date(), afterDate=new Date(0)) {
  const mapReduction = getFindPostingChangeAmountsReduction(this._id, this.currency, afterDate, beforeDate);
  mapReduction.reduce  = function(accountId, changeCents) {
    return Math.max(
      Math.abs(
        Array.sum(changeCents.filter(value => value < 0))
      ),
      Math.abs(
        Array.sum(changeCents.filter(value => value > 0))
      )
    );
  };
  return Entry.mapReduce(mapReduction).then(result => result.shift().value);
};

module.exports = mongoose.model('Account', AccountSchema);
