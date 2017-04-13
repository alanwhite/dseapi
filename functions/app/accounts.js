const AWS = require('aws-sdk');
// TODO: abstract away the database provider with plugin

const DOMAIN_NAME = process.env.DOMAIN_NAME;
// TODO: check all providers can support environment variable

class Accounts {
  constructor() {
    this.simpledb = new AWS.SimpleDB();
  }

  getLicensesForAccount(account, callback) {

    var params = {
      DomainName: DOMAIN_NAME,
      ItemName: account,
      AttributeNames: ['lic'],
      ConsistentRead: false
    };

    this.simpledb.getAttributes(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        return callback(err);
      } else {
        // console.log(data);

        var payload = {
          apiVersion : 1,
          licenses: []
        }

        for (var i in data.Attributes) {
          var license = { txn: "", token: "" }
          license.token = data.Attributes[i].Value;
          payload.licenses.push(license);
        }

        return callback(null, JSON.stringify(payload));
      }
    });

  }

  addLicenseToAccount(account, license, callback) {

    var params = {
      DomainName: DOMAIN_NAME,
      ItemName: account,
      Attributes: [
        {
          Name: 'lic',
          Value: license, /* required */
          Replace: false
        }]
    };

    this.simpledb.putAttributes(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        return callback(err);
      } else {
        console.log(data);
        return callback(null, JSON.stringify(data));
      }
    });

  }
}

module.exports = Accounts;
