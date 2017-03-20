const _ = require('lodash');
const Schema = require('mongoose').Schema;
const TimestampPlugin = require('mongoose-timestamp');
const { AccountStatuses } = require('./constants');

const AccountHistorySchema = new Schema({
  status: {
    type: String,
    required: true,
    enum: Object.keys(AccountStatuses)
  },
  memo: String
});
AccountHistorySchema.plugin(TimestampPlugin);

module.exports = AccountHistorySchema;
