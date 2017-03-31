// helper class to validate JSON Web Tokens for DSE API

class Validator {

  constructor(JWTUtil, clientID, secret, issuer) {
    this.JWTUtil = JWTUtil;
    this.clientID = clientID;
    this.secret = secret;
    this.issuer = issuer;
  }

  // checks the user that Auth0 embeds in a JWT matches the user supplied as parameter
  forUser(jwt, user, callback) {
    token(jwt, (err,decoded) => {
      if (err) {
        console.log('Validator.forUser: bad jwt supplied');
        return callback(err);
      } else {
        const tokenValidatedID = decoded.sub.substring(6);
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
      audience: this.clientID,
      issuer: this.issuer,
    };

    this.JWTUtil.verify(jwt, this.secret, options, (err, decoded) => {
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
