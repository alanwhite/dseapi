'use strict';

// This strikes me as a really poor way to structure logic so please
// any node.js gurus out there please help me out!

const JWT = require('jsonwebtoken');
const AWS = require('aws-sdk');

const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const AUTH0_ISSUER = process.env.AUTH0_ISSUER;
const DOMAIN_NAME = process.env.DOMAIN_NAME;

// change for SimpleDB
const simpledb = new AWS.SimpleDB();

module.exports.get = (event, context, callback) => {

  // here id means the account id, as provided within the JWT
  // so we need to validate the JWT provided matches
  // the theory being you can only see your licenses

  // the jwt has the user_id in the sub after "auth0|"
  // need to compare that to the id provided and do a HTTP_FORBIDDEN
  // if not

  // desired outcome template
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
    const options = {
      audience: AUTH0_CLIENT_ID,
      issuer: AUTH0_ISSUER,
    };

    JWT.verify(token, AUTH0_CLIENT_SECRET, options, (err, decoded) => {
      if (err) {
        console.log('Error!');
        console.log(err);
        console.log(decoded);
        response.statusCode = 401;
        response.body = JSON.stringify({
          message: 'Error validating your login token',
          input: event,
        });
        callback(null, response);

      } else {
        // JWT is all good!
        console.log(decoded);
        console.log(decoded.iss);

        // now validate the is matches the subject in the token
        const requestedID = event.pathParameters.id;
        const tokenValidatedID = decoded.sub.substring(6);

        if ( requestedID != tokenValidatedID ) {
          console.log('Error! Attempt to access '+requestedID+' licenses by '+tokenValidatedID);

          response.statusCode = 403;
          response.body = JSON.stringify({
            message: 'Attempt to access other users licenses',
            input: event,
          });

          callback(null, response);
        } else {

          // we have vlidated the toekn and the requested ID so return the licenses
          var params = {
            DomainName: DOMAIN_NAME, /* required */
            ItemName: requestedID, /* required */
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

              callback(null, response);
            } else {
              console.log(data);           // successful response
              response.body = JSON.stringify(data);
              callback(null, response);
            }
          });
        }
      }

    });

  } else { // no auth token present
    response.statusCode = 403;
    response.body = JSON.stringify({
      message: 'Nope, not without logging in first',
      input: event,
    });

    callback(null, response);
  }

};
