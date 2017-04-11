/*
 * Emulates Java's PBEWITHMD5ANDDES for node.js
 *
 * Props to http://qzaidi.github.io/2013/04/21/java-crypto-node/
 */
var crypto = require('crypto');

var pbewithmd5anddes = {

  KDF: function(password,salt,iterations) {
    var pwd = new Buffer(password,'utf-8');
    var key = Buffer.concat([pwd, salt]);
    var i;
    for (i = 0; i < iterations; i+=1) {
      key = crypto.createHash("md5").update(key).digest();
    }
    return key;
  },

  getKeyIV: function(password,salt,iterations) {
    var key = this.KDF(password,salt,iterations);
    var keybuf = new Buffer(key,'binary').slice(0,8);
    var ivbuf = new Buffer(key,'binary').slice(8,16);
    return [ keybuf, ivbuf ];
  },

  encrypt: function(payload,password,salt,iterations,cb) {
    var kiv = this.getKeyIV(password,salt,iterations);
    var cipher = crypto.createCipheriv('des', kiv[0],kiv[1]);
    var encrypted = [];
    encrypted.push(cipher.update(payload,'utf-8','hex'));
    encrypted.push(cipher.final('hex'));
    return cb(undefined,new Buffer(encrypted.join(''),'hex').toString('base64'));
  },

  decrypt: function(payload,password,salt,iterations,cb) {
    var encryptedBuffer = new Buffer(payload,'base64');
    var kiv = this.getKeyIV(password,salt,iterations);
    var decipher = crypto.createDecipheriv('des', kiv[0],kiv[1]);
    var decrypted = [];
    decrypted.push(decipher.update(encryptedBuffer));
    decrypted.push(decipher.final());
    return cb(undefined, decrypted.join(''));
  }
};

module.exports = pbewithmd5anddes;
