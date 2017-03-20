# Superledgero

Superledgero is a double-entry accounting library for node.js and mongoose.

Features:

- Written with ES6 JS
- Double entry accounting
- Promise friendly
- Small footprint / few dependencies
- Does not presume anything about your system

Warnings:

- Work in progress
- Built using Node 7.5 with --harmony flags YMMV
- Please do not hack core

# Basics

There are three models you work with when using Superledgero:

### Ledger

A ledger records movements of money related to some business.  A ledger can only have one currency.

Ledger is really a convenient factory for making Entries.

**Properties of Ledger**
- `name` (String)
- `currency` (default: 'USD')

**Functions of Ledger**
- `Ledger.open(name)` --- _Static; Async; Same as Ledger.findOne({name: })_
- `ledger.debit(account, amountCents)` --- _Async; Start a new entry with a debit_
- `ledger.credit(account, amountCents)` --- _Async; Start a new entry with a credit_


### Account

An account represents any source or destination of funds.

**Properties of Account**
- `name` (String)
- `type` (CUSTOMER | CORPORATE | VENDOR)
- `currency` (default: 'USD')
- `memo` (String)

**Functions of Account**
- `account.debits()` --- _Async; Get all posted debits for the account_
- `account.credits()` --- _Async; Get all posted debits for the account_
- `account.close()` --- _Async; Permanently close this account_
- `account.freeze()` --- _Async; Freeze this account_
- `account.unfreeze()` --- _Async; Unfreeze (re-open) this account_
- `account.balanceCents(end, start)` --- _Async; Calculate account balance in cents_
- `account.volumeCents(end, start)` --- _Async; Calculate account throughput volume in cents_

### Entry

An entry is "an entry in the ledger".  It consists of debiting some accounts and crediting other accounts.

Entries must be balanced; money cannot be created or destroyed, only moved around!

Entries will typically be created via initiating a debit or credit in the Ledger (see below).

**Properties of Entry**
- `ledger` (ObjectId)
- `currency` (default: 'USD')
- `posted` (Boolean)
- `voided` (Boolean)
- `postedAt` (Date)
- `voidedAt` (Date)
- `memos` ([String])

**Functions of Entry**
- `entry.debits()` --- _Get all debits for this entry_
- `entry.credits()` --- _Get all credits for this entry_
- `entry.sumCents()` --- _Get sum of all credits and debits for this entry_
- `entry.isBalanced()` --- _Check if credits + debits =0 (required to post the entry)_
- `entry.debit(account, amountCents)` --- _Add another debit to the entry_
- `entry.credit(account, amountCents)` --- _Add another credit to the entry_
- `entry.memo(msg)` --- _Add a new memo to the entry_
- `entry.post()` --- _Async; Post the entry to the ledger (save)_
- `entry.void()` --- _Async; Void the entry in the ledger_


# Importing In Your Project

```javascript
const { Ledger, Account, Entry, Constants } = require('superledgero');
```

# Setting Up Accounts And Ledger

You will need to setup a ledger (once) in which you are going to record entries.

Reasons you might want multiple ledgers:

- One for each country or currency
- Different stores
- Different products or lines of business

You will need to create accounts for a your users, vendors, and your business.  How you do this is somewhat up to you.

```javascript
const ledger = await Ledger.create({name: 'Online Sales Ledger'})

const customerAccount = new Account({name: 'VISA-0045', type: Account.Types.CUSTOMER})
await customerAccount.save()

const merchantAccount = new Account({name: 'RECEIVABLES', type: Account.Types.CORPORATE})
await merchantAccount.save()

const feesAccount = new Account({name: 'FEES', type: Account.Types.CORPORATE})
await feesAccount.save()
```

# Writing Entries

This is the beautiful part!  Debiting and crediting happens in memory; the entry and it's debits or credits will not be saved until you call post().

A pleasant side effect of this is not having to deal with promises for each debit and credit, as the action is synchronous.

Calling memo is always optional.

```javascript
const entry = await ledger
  .debit(customerAccount, 2000)
  .credit(merchantAccount, 2000)
  .debit(merchantAccount, 100)
  .credit(feesAccount, 100)
  .memo("Purchase of a T-Shirt for $20.00")
  .post()
```

# Voiding Entries

Calling memo is always optional.

```javascript
await entry.memo("I don't want this entry anymore").void()
```

# Account Balance

Getting the balance is simple:

```javascript

const balance = customerAccount.balanceCents()
```

You can also get a balance as at a certain date:

```javascript
const endOfMonth = new Date("2017-01-31 23:59:59")

const balance = customerAccount.balanceCents(endOfMonth)
```

Or the delta over a time period:

```javascript
const changeInBalance = customerAccount.balanceCents(endDate, startDate);
```

# Account Volume

Sometimes we might put $20 into an account and then take $20 out.  The balance is $0 but we are curious what the throughput volume was.

We can get the volume for the account ($20 in the example above) similar to the balance:

```javascript

const volume = customerAccount.volumeCents()
```

You can also get a volume as at a certain date:

```javascript
const endOfMonth = new Date("2017-01-31 23:59:59")

const volume = customerAccount.volumeCents(endOfMonth)
```

Or the volume that moved through an account over a time period:

```javascript
const volume = customerAccount.volumeCents(endDate, startDate);
```

# Auditing an Account

An audit produces a report of all account activity that can be easily formatted into an account summary.

```javascript
const auditObject = customerAccount.audit();
```

# Opening Balances and Adjustments

If you want to "edit" or "adjust" an account balance, or open an account with an initial balance, you cannot do so without creating ledger entries.

A suggestion would be to create a "special account" and debit or credit the special account as part of a transaction to make the adjustments.

This is by design.

# Handling Errors

Errors thrown by Superledgero will be instances of SuperledgeroError.

Errors thrown by Mongoose (E.g. validation errors, etc) will be the usual MongooseError type.

# Future Work

- Improve Memos
- Improve Tests
- Improve Configurability / Options

This is intended to be a simple library and kept minimalist so I am not sure what can be improved! Share your ideas.
