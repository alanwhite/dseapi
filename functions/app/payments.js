const AWS = require('aws-sdk');
// TODO: abstract away the database provider with plugin

const qs = require('qs');

const ACCOUNTMOD = require('./accounts.js');
const accounts = new ACCOUNTMOD();


const PAYMENT_LOG = process.env.PAYMENT_LOG;
// TODO: check all providers can support environment variable

class Payments {
  constructor() {
    this.simpledb = new AWS.SimpleDB();
  }

  processVerifiedIPN(ipn, callback) {
    console.log("processing validated IPN");
    console.log('Printing all key-value pairs...');

    const data = qs.parse(ipn);

    // first just capture we've received a verified IPN
    this.createPaymentLogEntry(ipn, function(err) {
      if ( err ) return callback(err,"issue logging payment message");

      if ( data['payment_status'] != 'Completed' ) {
        console.log("not processing incomplete payment with status: "+data['payment_status']);
        return callback(null,"");
        console.log("TEST: should never see this message");
      }

      // check we've not already processed this transaction
      var txn_id = data['txn_id'];
      var account = data['custom'];

      accounts.getLicensesForAccount(account, function(err,licenses) {
        if ( err ) {
          console.log("error retrieving licenses for ipn check");
          return callback(err);
        }

        console.log("retrieved licenses "+licenses);

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

        // cut a license
        var newLicenseToken = 'test license key string';
        var newLicenseEntry = { txn: txn_id, token: newLicenseToken };

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

}

module.exports = Payments;
