// Promisify AWS SNS REST API

const Promise=require('bluebird');

const AWS=require('aws-sdk');
AWS.config.loadFromPath('./config/aws-config.json');

const sns=new AWS.SNS();
module.exports=Promise.promisifyAll(sns);