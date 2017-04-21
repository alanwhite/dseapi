const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const notifyPhoneNumber = process.env.PURCHASE_PHONE;
const twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken);

class Notifier {

  // sends a SMS message to me
  sendSMS(message) {

    const sms = {
      to: notifyPhoneNumber,
      body: message,
      from: twilioPhoneNumber,
    };

    twilioClient.messages.create(sms, (error, data) => {
      if ( error ) {
        console.log('error sending sms '+error);
      }
    });

  }
}

module.exports = Notifier;
