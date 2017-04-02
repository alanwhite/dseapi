'use strict';

// This strikes me as a really poor way to structure logic so please
// any node.js gurus out there please help me out!

const VALIDATE = require('../../app/validator.js');
const ACCOUNTMOD = require('../../app/accounts.js');

const validateRequest = new VALIDATE();
const accounts = new ACCOUNTMOD();

module.exports.get = (event, context, callback) => {

  // desired outcome template
  const response = {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin" : "*" },
    body: JSON.stringify({message: 'code pass through error'})
  };

  if (event.headers.Authorization) {
    // remove "bearer " from token
    const token = event.headers.Authorization.substring(7);

    validateRequest.forUser(token,event.pathParameters.id, (err, data) => {
      if (err) {
        response.statusCode = 403;
        response.body = JSON.stringify({
          message: 'Not permitted to access requested resource '+err,
          input: event,
        });

        return callback(null, response);
      } else {

        accounts.getLicensesForAccount(event.pathParameters.id, (err, data) => {
          if (err) {
            response.statusCode = 500;
            response.body = JSON.stringify({
              message: err,
              input: event,
            })
            return callback(null,response);
          } else {

            response.body = data;
            return callback(null,response);
          }
        });

      }
    });

  } else { // no auth token present
    response.statusCode = 401;
    response.body = JSON.stringify({
      message: 'You must login to access this resource',
      input: event,
    });

    return callback(null, response);
  }

};
