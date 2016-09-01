const Promise=require('bluebird');

const twilio=require('twilio');

module.exports=Promise.promisifyAll(twilio);