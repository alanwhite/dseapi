'use strict';

// This strikes me as a really poor way to structure logic so please
// any node.js gurus out there please help me out!

const JWT = require('jsonwebtoken');
const AWS = require('aws-sdk');
const VALIDATE = require('/var/task/functions/app/validator.js');
var fs = require('fs');

const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const AUTH0_ISSUER = process.env.AUTH0_ISSUER;
const DOMAIN_NAME = process.env.DOMAIN_NAME;

// change for SimpleDB
const simpledb = new AWS.SimpleDB();

const validateRequest = new VALIDATE(JWT, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_ISSUER);

module.exports.get = (event, context, callback) => {

  // here id means the account id, as provided within the JWT
  // so we need to validate the JWT provided matches
  // the theory being you can only see your licenses

  // the jwt has the user_id in the sub after "auth0|"
  // need to compare that to the id provided and do a HTTP_FORBIDDEN
  // if not

  // desired outcome template
  console.log(process.cwd());
  fs.readdir('/var/task/functions', function(err, items) {
      console.log(items);

      for (var i=0; i<items.length; i++) {
          console.log(items[i]);
      }


  const response = {
    statusCode: 200,
    headers: {
       "Access-Control-Allow-Origin" : "*"
    },
    body: JSON.stringify({
      message: 'You are a logged in user so you can see this',
      input: event,
    }),
  };

  if (event.headers.Authorization) {
    // remove "bearer " from token
    const token = event.headers.Authorization.substring(7);

    validateRequest.forUser(token,event.pathParameters.id, (err, data) => {
      if (err) {
        response.statusCode = 403;
        response.body = JSON.stringify({
          message: 'Not permitted to access requested resource',
          input: event,
        });

        return callback(null, response);
      } else {

        // go get it
        var params = {
          DomainName: DOMAIN_NAME,
          ItemName: event.pathParameters.id,
          AttributeNames: [
            'lic'
          ],
          ConsistentRead: false
        };

        simpledb.getAttributes(params, function(err, data) {
          if (err) {
            console.log(err, err.stack); // an error occurred

            response.statusCode = 500;
            response.body = JSON.stringify({
              message: 'Unable to retrieve from datastore',
              input: event,
            });
            return callback(null, response);
          } else {
            console.log(data);           // successful response
            response.body = JSON.stringify(data);
            return callback(null, response);
          }
        });
      }
    });

  } else { // no auth token present
    response.statusCode = 401;
    response.body = JSON.stringify({
      message: 'Nope, not without logging in first',
      input: event,
    });

    return callback(null, response);
  }
  });
};
