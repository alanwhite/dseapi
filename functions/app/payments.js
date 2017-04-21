const AWS = require('aws-sdk');
// TODO: abstract away the database provider with plugin
// TODO: find a way to abstract away publishing an AWS SNS message
// TODO: move to a request queue processing approach to allow for transient failures

const qs = require('qs');

const LICMOD = require('./licenses.js');
const licensor = new LICMOD();

const ACCOUNTMOD = require('./accounts.js');
const accounts = new ACCOUNTMOD();

const PAYMENT_LOG = process.env.PAYMENT_LOG;
const PURCHASE_EVENT = process.env.PURCHASE_EVENT;
// TODO: check all providers can support environment variable

class Payments {
  constructor() {
    this.simpledb = new AWS.SimpleDB();
    this.sns = new AWS.SNS({region:'eu-west-1'});
  }

  processVerifiedIPN(ipn, callback) {

    const data = qs.parse(ipn);

    // first just capture we've received a verified IPN
    this.createPaymentLogEntry(ipn, (err) => {
      if ( err ) return callback(err,"issue logging payment message");

      if ( data['payment_status'] != 'Completed' ) {
        console.log("not processing incomplete payment with status: "+data['payment_status']);
        return callback(null,"");
      }

      // check we've not already processed this transaction
      const txn_id = data['txn_id'];
      const account = data['custom'];
      const first_name = data['first_name'] || ' ';
      const last_name = data['last_name'] || ' ';
      const user_name = first_name + ' ' + last_name;
      const user_email = data['payer_email'];

      accounts.getLicensesForAccount(account, (err,licenses) => {
        if ( err ) {
          console.log("error retrieving licenses for ipn check");
          return callback(err);
        }

        for (var i in licenses.licenses ) {
          if ( txn == licenses[i].txn ) {
            console.log("error processing IPN, license already cut for this transaction");
            return callback(new Error('duplicate transaction'));
          }
        }

        // should maybe cut a license key of "hey who tried to mug me off"
        if ( data['mc_gross'] != '25.00' ) { // bit of a pain if we change pricing
          console.log("someone trying to pay non-std price");
          return callback(null,"");
        }

        // async send the purchase text
        this.sendPurchaseNotification("Drum Score Editor received a payment from "+user_name+", "+user_email);

        // cut a license
        licensor.createLicenseToken(user_name,user_email,'"' + new Date().toUTCString() + '"', function(err,licenseToken) {
          var newLicenseEntry = { txn: txn_id, token: licenseToken };

          // and store it in the account record for the user
          accounts.addLicenseToAccount(account, JSON.stringify(newLicenseEntry), function(err,result) {
            if ( err ) {
              console.log("error adding new license key: "+err);
              return callback(err);
            }

            console.log("new license key added successfully");
            return callback(null,result);
          });
        });
      });
    });
  }

  createPaymentLogEntry(ipn, callback) {

    var params = {
      DomainName: PAYMENT_LOG,
      ItemName: Date.now().toString(),
      Attributes: [
      {
        Name: 'ipn',
        Value: ipn, /* required */
        Replace: false
      }]
    };

    this.simpledb.putAttributes(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        return callback(err);
      }

      console.log(data);
      return callback(null);
    });

  }

  sendPurchaseNotification(msg) {
    const params = {
      Message: msg,
      TopicArn: 'arn:aws:sns:eu-west-1:248211596106:'+PURCHASE_EVENT, // yeah TODO: find a way to obtain aws id
    };

    this.sns.publish(params, function(error) {
      if (error) {
        console.log(error);
      }
    });
  }

}

module.exports = Payments;
