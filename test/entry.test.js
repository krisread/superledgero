const { expect, assert } = require("chai");

const Ledger = require('../lib/ledger.model');
const Account = require('../lib/account.model');
const Entry = require('../lib/entry.model');
const SuperledgeroError = require('../lib/superledgero_error');

const { AccountTypes, AccountStatuses } = require('../lib/constants');

function dollars(bucks) {
  return bucks * 100;
}

describe('Entry Test', () => {

  it('should create entries', async() => {

  });

  it('should not create invalid entries', async() => {

  });

  it('should get credits and debits on entries', async() => {

  });

  it('should calculate sum of credits and debits and be able to check if balanced', async() => {

  });

  it('should post entries', async() => {

  });

  it('should not post invalid entries', async() => {

  });

  it('should void entries', async() => {

  });

  it('should not void invalid entries', async() => {

  });

  it('should post entries', async() => {

  });

  it('should create a debit', async() => {

  });

  it('should not create an invalid debit', async() => {

  });

  it('should create a credit', async() => {

  });

  it('should not create an invalid credit', async() => {

  });

  it('should save a memo', async() => {

  });

});