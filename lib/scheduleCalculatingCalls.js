const kaiseki=require('../config/parse-config');
const kai=require('../lib/kaiseki-promise')(kaiseki);
const schedule=require('node-schedule');
const twilio=require('../lib/twilio-promise');
const Promise=require('bluebird');

const groupRepo=require('../model/group');
const calllogRepo=require('../model/calllog');

const util=require('./util');

const weekend={
	hour:17,
	minute:0,
	second:0
};

// Get a list of calllogs whose duration is more than 0

function getLogsCalculating(hotline,start,end){
	return new Promise((resolve,reject)=>{
		calllogRepo.getCalllogsBetween(hotline,start,end).then(
			(result)=>{
				var logs=[];
				const list=result;
				Promise.map(list,(item)=>{
					const client=twilio(item.accountSid,item.authToken);
					return client.calls(item.callSid).get().then(
						(result)=>{
							if (result.duration>0){
								logs.push(result);
							}
						});
				}).then(
					(result)=>resolve(logs));
			},
			(error)=>reject(error));
	});
}

// Scheduler that calculates number of simultaneous seconds each hotline used

module.exports=schedule.scheduleJob(weekend,function(){
	'use strict';

	var toPoint=new Date();
	toPoint=toPoint.toISOString();
	const params={
		where:{name:{$exists:false}}
	};
	// Get all hotlines
	kai.getObjectsAsync('Group',params).then(
		(result)=>{
			const list=JSON.parse(result.body).results;
			Promise.map(list,(item)=>{
				const fromPoint=item.lastCalculated || item.createdAt;
				const promise=getLogsCalculating(item.hotline,fromPoint,toPoint);
				return new Promise((resolve,reject)=>{
					// Get all calllogs in hotline whose duration is more than 0
					promise.then(
						(result)=>{
							const logs=util.sortTwilioLogs(result,0,result.length-1);
							var time=item.simultaneousSeconds || 0;
							// Add overlay
							for (var i=0;i<logs.length-1;i++){
								const point=logs[i].endTime;
								for (var j=i+1;j<logs.length;j++){
									const start=logs[j].startTime;
									if (start<point){
										const end=logs[j].endTime;
										var overlay=Number(logs[j].duration);
										if (end>point){
											overlay=Number(Date.parse(point)-Date.parse(start))/1000;
										}
										time=time+overlay;
									}
								}
							}
							const data={
								lastCalculated:toPoint,
								simultaneousSeconds:time
							};
							groupRepo.updateGroup(item.objectId,data).then(
								(result)=>resolve({hotline:item.hotline,time:time}));
						});
				}).then((result)=>console.log('Done '+item.hotline));
			}).then((result)=>console.log('Done all'));
		});
});
