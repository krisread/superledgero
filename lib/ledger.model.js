const _ = require('lodash');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const TimestampPlugin = require('mongoose-timestamp');
const SuperledgeroError = require('./superledgero_error');

const Entry = require('./entry.model');
const { Currencies } = require('./constants');

const LedgerSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    enum: Currencies
  }
});
LedgerSchema.plugin(TimestampPlugin);

LedgerSchema.statics.open = async function(name) {
  let ledgr = await this.findOne({name});
  if (!ledgr) {
    throw new SuperledgeroError('Ledger not found with name: ' + name);
  }
  return ledgr;
};

LedgerSchema.methods.debit = function(account, changeCents, memo) {
  return new Entry({ ledger: this._id, currency: this.currency }).debit(account, changeCents, memo);
};

LedgerSchema.methods.credit = function(account, changeCents, memo) {
  return new Entry({ ledger: this._id, currency: this.currency }).credit(account, changeCents, memo);
};

module.exports = mongoose.model('Ledger', LedgerSchema);
