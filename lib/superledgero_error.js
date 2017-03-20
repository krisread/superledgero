module.exports = function SuperledgeroError(param, extra) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;

  if (param instanceof Error) {
    this.message = param.message;
    this.cause = param;
  } else if (typeof param === 'string') {
    this.message = param;
  }
  this.extra = extra;
};
require('util').inherits(module.exports, Error);
