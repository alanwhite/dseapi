const pbewithmd5anddes = require("./pbewithmd5anddes.js");

class Licenses {

  constructor(licenseKey, saltKey) {
    this.password = licenseKey || process.env.LICENSE_KEY;
    this.salt = saltKey || process.env.LICENSE_SALT;
  }

  createLicenseToken(name,email,when,callback) {
    const tokenString = name + ',' + email + ',' + when + '\n';

    pbewithmd5anddes.encrypt(tokenString,this.password,new Buffer.from(this.salt,'utf-8'),20,function(err,msg) {
      // msg contains encrypted string
      callback(null,msg);
    });
  }
}

module.exports = Licenses;
