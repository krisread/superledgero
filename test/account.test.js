const _ = require('lodash');
const { expect, assert } = require("chai");

const Ledger = require('../lib/ledger.model');
const Account = require('../lib/account.model');
const Entry = require('../lib/entry.model');

const { AccountTypes, AccountStatuses } = require('../lib/constants');

function dollars(bucks) {
  return bucks * 100;
}

describe('Account', () => {

  let ledger;
  let userAccount, alAccount, romitAccount, feesAccount;

  beforeEach(async function() {
    ledger = await Ledger.create({name: 'Super-Test'});

    userAccount = new Account({name: 'VISA-0045', type: AccountTypes.CUSTOMER});
    await userAccount.save();

    alAccount = new Account({name: 'AL_RECEIVABLES', type: AccountTypes.CORPORATE});
    await alAccount.save();

    feesAccount = new Account({name: 'AL_PROCESSOR_FEES', type: AccountTypes.CORPORATE});
    await feesAccount.save();

    romitAccount = new Account({name: 'ROMIT', type: AccountTypes.VENDOR});
    await romitAccount.save();
  });

  afterEach(async function() {
    if (romitAccount) await romitAccount.remove();
    if (feesAccount) await feesAccount.remove();
    if (alAccount) await alAccount.remove();
    if (userAccount) await userAccount.remove();
    if (ledger) await ledger.remove();
  });

  it('Should calculate account balances or volumes', async() => {
    let postedEntryA, postedEntryB;
    try {
      postedEntryA = await ledger
        .debit(userAccount, dollars(20))
        .credit(romitAccount, dollars(20))
        .debit(romitAccount, dollars(1))
        .credit(feesAccount, dollars(1))
        .debit(romitAccount, dollars(19))
        .credit(alAccount, dollars(19))
        .memo("Purchase of 20 tickets.")
        .post();

      postedEntryB = await ledger
        .debit(userAccount, dollars(5))
        .credit(alAccount, dollars(5))
        .memo("Purchase of 20 tickets.")
        .post();

      expect(await userAccount.balanceCents()).to.equal(dollars(-25));
      expect(await userAccount.volumeCents()).to.equal(dollars(25));

      expect(await romitAccount.balanceCents()).to.equal(dollars(0));
      expect(await romitAccount.volumeCents()).to.equal(dollars(20)); // we moved 20 bucks through

      expect(await feesAccount.balanceCents()).to.equal(dollars(1));
      expect(await feesAccount.volumeCents()).to.equal(dollars(1));

      expect(await alAccount.balanceCents()).to.equal(dollars(24));
      expect(await alAccount.volumeCents()).to.equal(dollars(24));
    } finally {
      if (postedEntryA) await postedEntryA.remove();
      if (postedEntryB) await postedEntryB.remove();
    }
  });

  it('should not create invalid accounts', async() => {

  });

  it('Should preserve status histories', async() => {
    expect(userAccount.status).to.equal(AccountStatuses.OPEN);
    await userAccount.freeze();
    expect(userAccount.status).to.equal(AccountStatuses.FROZEN);
    await userAccount.unfreeze();
    expect(userAccount.status).to.equal(AccountStatuses.OPEN);
    await userAccount.close();
    expect(userAccount.status).to.equal(AccountStatuses.CLOSED);

    expect(userAccount.history[0].status).to.equal(AccountStatuses.OPEN);
    expect(userAccount.history[1].status).to.equal(AccountStatuses.FROZEN);
    expect(userAccount.history[2].status).to.equal(AccountStatuses.OPEN);
  });

  it('Should get balance and volume as of a past date', async() => {

  });


  it('Should respect frozen, open or closed status', async() => {

  });

  it('Should get non-voided debits or credits', async() => {
    let postedEntryA, postedEntryB;
    try {
      postedEntryA = await ledger
      .debit(userAccount, dollars(20), "userdebit")
      .debit(userAccount, dollars(5), "userdebit")
      .credit(romitAccount, dollars(20))
      .debit(romitAccount, dollars(1))
      .credit(feesAccount, dollars(6))
      .debit(romitAccount, dollars(19))
      .credit(alAccount, dollars(19))
      .post();

    const debits = await userAccount.debits();
    expect(debits.length).to.equal(2);
    expect(debits[0].memo).to.equal("userdebit");
    expect(debits[1].memo).to.equal("userdebit");
    expect(debits[0]._id).to.not.eql(debits[1]._id);
    expect(debits[0].account).to.eql(debits[1].account);

    } finally {
      if (postedEntryA) await postedEntryA.remove();
    }
  });

  it('Should get an account audit sheet', async() => {

  });

});