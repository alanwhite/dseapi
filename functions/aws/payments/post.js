'use strict';

// This strikes me as a really poor way to structure logic so please
// any node.js gurus out there please help me out!

const VALIDATE = require('../../app/validator.js');
const ACCOUNTMOD = require('../../app/accounts.js');

const validateRequest = new VALIDATE();
const accounts = new ACCOUNTMOD();

module.exports.post = (event, context, callback) => {

  //Return 200 to caller
  callback(null, {
      statusCode: '200'
  });

  //Read the IPN message sent from PayPal and prepend 'cmd=_notify-validate'
  var body = 'cmd=_notify-validate&' + event.body;

  console.log('Verifying');
  console.log(body);

  var options = {
      url: 'https://www.sandbox.paypal.com/cgi-bin/webscr',
      method: 'POST',
      headers: {
          'Connection': 'close'
      },
      body: body,
      strictSSL: true,
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
  };

  //POST IPN data back to PayPal to validate
  request(options, function callback(error, response, body) {
      if (!error && response.statusCode === 200) {

          //Inspect IPN validation result and act accordingly
          if (body.substring(0, 8) === 'VERIFIED') {

              //The IPN is verified
              console.log('Verified IPN!');
          } else if (body.substring(0, 7) === 'INVALID') {

              //The IPN invalid
              console.log('Invalid IPN!');
          } else {
              //Unexpected response body
              console.log('Unexpected response body!');
              console.log(body);
          }
      }else{
          //Unexpected response
          console.log('Unexpected response!');
          console.log(response);
      }

  });

};
