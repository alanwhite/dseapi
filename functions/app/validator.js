// helper class to validate JSON Web Tokens for DSE API

const JWT = require('jsonwebtoken');

const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
const AUTH0_ISSUER = process.env.AUTH0_ISSUER;

class Validator {

  // checks the user that Auth0 embeds in a JWT matches the user supplied as parameter
  forUser(jwt, user, callback) {
    this.token(jwt, (err,decoded) => {
      if (err) {
        console.log('Validator.forUser: bad jwt supplied');
        return callback(err);
      } else {
        const tokenValidatedID = decoded.sub;
        if ( user != tokenValidatedID ) {
          console.log('Validator.forUser: requested '+user+' does not match login user '+tokenValidatedID);
          return callback(new Error('User not authorized to access this resource'));
        } else {
          return callback(null, "" );
        }
      }
    });
  }

  // performs validation of the JSON Web Token and returns it decoded if successful
  token(jwt, callback) {
    const options = {
      audience: AUTH0_CLIENT_ID,
      issuer: AUTH0_ISSUER,
    };

    JWT.verify(jwt, AUTH0_CLIENT_SECRET, options, (err, decoded) => {
      if (err) {
        console.log('Validator.token: error in jwt '+err);
        return callback(err);
      } else {
        return callback(null, decoded);
      }
    });

  }

}

module.exports = Validator;
