'use strict';

const NOTIFIER = require('../../app/notifier.js');
const notify = new NOTIFIER();

// wrap aws pub/sub SNS event receiver
module.exports.notifyPurchase = (event) => {
  const msg = event.Records[0].Sns.Message;
  notify.sendSMS(msg);
};
