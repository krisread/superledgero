const { expect, assert } = require("chai");

const Ledger = require('../lib/ledger.model');
const Account = require('../lib/account.model');
const Entry = require('../lib/entry.model');

const { AccountTypes } = require('../lib/constants');

function dollars(bucks) {
  return bucks * 100;
}

describe('Accounting Scenarios', () => {

  beforeEach(async ()=>{
  });

  afterEach(async () => {
  });

  it('should walk through an entire accounting scenario', async()=> {

    let userAccount, alAccount, romitAccount, feesAccount;
    let ledger, postedEntry;

    try {
      userAccount = new Account({name: 'VISA-0045', type: AccountTypes.CUSTOMER});
      await userAccount.save();

      alAccount = new Account({name: 'AL_RECEIVABLES', type: AccountTypes.CORPORATE});
      await alAccount.save();

      feesAccount = new Account({name: 'AL_PROCESSOR_FEES', type: AccountTypes.CORPORATE});
      await feesAccount.save();

      romitAccount = new Account({name: 'ROMIT', type: AccountTypes.VENDOR});
      await romitAccount.save();

      ledger = await Ledger.create({name: 'Super'});

      postedEntry = await ledger
        .debit(userAccount, dollars(20))
        .credit(romitAccount, dollars(20))
        .debit(romitAccount, dollars(1))
        .credit(feesAccount, dollars(1))
        .debit(romitAccount, dollars(19))
        .credit(alAccount, dollars(19))
        .memo("Purchase of 20 tickets.")
        .post();

      expect(postedEntry.posted).to.be.true;
      expect(postedEntry.sumCents()).to.equal(0);
      expect(postedEntry.isBalanced()).to.be.true;
      expect(postedEntry.memos.length).to.equal(1);
      expect(postedEntry.debits().length).to.equal(3);
      expect(postedEntry.credits().length).to.equal(3);

      await postedEntry.void();
      expect(postedEntry.voided).to.be.true;

    } finally {
      // todo removing ledger entries is bad hmm-kay, these need to all be soft deletes only
      if (postedEntry) await postedEntry.remove();
      if (ledger) await ledger.remove();
      if (romitAccount) await romitAccount.remove();
      if (feesAccount) await feesAccount.remove();
      if (alAccount) await alAccount.remove();
      if (userAccount) await userAccount.remove();
    }

  })


});