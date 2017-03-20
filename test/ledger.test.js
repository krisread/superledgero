const { expect, assert } = require("chai");

const Ledger = require('../lib/ledger.model');
const Account = require('../lib/account.model');
const Entry = require('../lib/entry.model');
const SuperledgeroError = require('../lib/superledgero_error');

const { AccountTypes, AccountStatuses } = require('../lib/constants');

function dollars(bucks) {
  return bucks * 100;
}

describe('Ledger Test', () => {

  it('should create and lookup ledgers', async () => {

    let ledgerA, ledgerB;
    try {
      ledgerA = await Ledger.create({name: 'My Ledger'});
      expect(ledgerA.name).to.equal('My Ledger');
      expect(ledgerA.currency).to.equal('USD');
      expect(ledgerA.createdAt).to.exist;
      expect(ledgerA.createdAt).to.be.most(new Date());

      ledgerB = await Ledger.open('My Ledger');
      expect(ledgerB._id).to.eql(ledgerA._id);

    } finally {
      if (ledgerA) await ledgerA.remove();
      if (ledgerB) await ledgerB.remove();
    }
  });

  it('Should throw when a ledger is not found', async() => {
    let ledgerA;
    try {
      ledgerA = await Ledger.open('My Ledger');
      expect.fail();
    }catch (err) {
      expect(err instanceof SuperledgeroError);
      expect(err.message).to.match(/Ledger not found with name.*/);
    } finally {
      if(ledgerA) ledgerA.remove();
    }
  });

  it('Should throw when ledger has no name', async() => {
    let ledgerA;
    try {
      ledgerA = await Ledger.create({});
      expect.fail();
    } catch (e) {
      expect(e.message).to.equal('Ledger validation failed');
    } finally {
      if (ledgerA) ledgerA.remove();
    }
  });

  it('Should throw with invalid currency', async() => {
    let ledgerA;
    try {
      ledgerA = await Ledger.create({name: 'Bad Currency Ledger', currency: 'XDV'});
      expect.fail();
    } catch (e) {
      expect(e.message).to.equal('Ledger validation failed');
    } finally {
      if (ledgerA) ledgerA.remove();
    }
  });

  it('Should create new entries starting with a debit', async() => {
    let ledgerA, accountA, entryA;
    try {
      ledgerA = await Ledger.create({name: 'My Ledger'});
      accountA = await Account.create({name: 'VISA-0045', type: AccountTypes.CUSTOMER});

      entryA = ledgerA.debit(accountA, 200);
      expect(entryA instanceof Entry).to.be.true;
      expect(entryA.currency).to.equal(ledgerA.currency);
      expect(entryA.currency).to.equal('USD');
      expect(entryA.isNew).to.be.true;
      expect(entryA.postings[0].changeCents).to.equal(-200);

    } finally {
      if (ledgerA) await ledgerA.remove();
      if(accountA) await accountA.remove();
      if(entryA) await entryA.remove();
    }
  });


  it('Should create new entries starting with a credit', async() => {
    let ledgerA, accountA, entryA;
    try {
      ledgerA = await Ledger.create({name: 'My Ledger'});
      accountA = await Account.create({name: 'VISA-0045', type: AccountTypes.CUSTOMER});

      entryA = ledgerA.credit(accountA, 200);
      expect(entryA instanceof Entry).to.be.true;
      expect(entryA.currency).to.equal(ledgerA.currency);
      expect(entryA.currency).to.equal('USD');
      expect(entryA.isNew).to.be.true;
      expect(entryA.postings[0].changeCents).to.equal(200);

    } finally {
      if (ledgerA) await ledgerA.remove();
      if(accountA) await accountA.remove();
      if(entryA) await entryA.remove();
    }
  });

  // More of these tests in Entry test file
  it('Should throw making a bad debit or credit', async() => {
    let ledgerA, accountA, entryA;
    try {
      ledgerA = await Ledger.create({name: 'My Ledger'});
      accountA = await Account.create({name: 'VISA-0045', type: AccountTypes.CUSTOMER});

      entryA = ledgerA.credit(accountA, 20.01);
      expect.fail();
    } catch (e) {
      expect(e.message).to.match(/Amounts must be in cents.*/);
    } finally {
      if (ledgerA) await ledgerA.remove();
      if(accountA) await accountA.remove();
      if(entryA) await entryA.remove();
    }
  });

});