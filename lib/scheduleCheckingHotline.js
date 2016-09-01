const kaiseki=require('../config/parse-config');
const kai=require('../lib/kaiseki-promise')(kaiseki);
const schedule=require('node-schedule');
const Promise=require('bluebird');

const groupRepo=require('../model/group');
const userRepo=require('../model/user');

const rule=new schedule.RecurrenceRule();
rule.hour=new schedule.Range(0,23,6);

// Scheduler that checks and updates expiration status of hotlines,
// then notify hotline master about expiration

module.exports=schedule.scheduleJob(rule,function(){
	'use strict';

	var checkpoint=new Date();
	var due=new Date();
	checkpoint=checkpoint.toISOString();
	due.setDate(due.getDate()+30);
	due=due.toISOString();
	var params={
		where:{name:{$exists:false}}
	};
	// Get all hotlines
	kai.getObjectsAsync('Group',params).then(
		(result)=>{
			const list=JSON.parse(result.body).results;
			Promise.map(list,(item)=>{
				return new Promise((resolve,reject)=>{
					var expire=new Date(item.expireAt);
					expire=expire.toISOString();
					// Check expiry date
					if (checkpoint>=expire){
						return new Promise((resolve,reject)=>{
							const data={
								registerAt:checkpoint,
								expireAt:due,
								pricing:'free'
							};
							groupRepo.updateGroup(item.objectId,data).then(
								(result)=>{
									if (item.pricing=='free'){
										resolve('Continue '+item.hotline);
									} else{
										var params={
											where:{
												hotline:item.hotline,
												objectId:{$ne:item.objectId}
											}
										};
										kai.getObjectsAsync('Group',params).then(
											(result)=>{
												const subs=JSON.parse(result.body).results;
												Promise.map(subs,(sub)=>
													groupRepo.updateGroup(sub.objectId,{pricing:'free'}))
												.then(
													(result)=>{
														userRepo.getUsersByGroup(item.hotline).then(
															(result)=>{
																// Notify master about hotline expiration
																Promise.map(result.deviceToken,(device)=>{
																	if (device.type=='ios'){
																		const notification={
																			where:{deviceToken:device.token},
																			data:{
																				title:'Hotline expired',
																				alert:'Your hotline '+item.hotline+' has expired and been changed to free package',
																				type:'expiration'
																			}
																		};
																		return kai.sendPushNotificationAsync(notification).then((result)=>(result));
																	} else{
																		var message="{\"default\": \"hello\",\"GCM\": \"{\\\"data\\\":{"
																		+"\\\"title\\\":\\\"Hotline expired\\\","
																		+"\\\"alert\\\":\\\"Your hotline "+item.hotline+"has expired and been changed to free package\\\","
																		+"\\\"type\\\":\\\"expiration\\\"}}\"}";
																		params={
																			PlatformApplicationArn:AppArn.gcm,
																			Token:device.token
																		};
																		return new Promise((res,rej)=>{
																			sns.createPlatformEndpointAsync(params).then(
																				(result)=>{
																					const arn=result.EndpointArn;
																					params={
																						TargetArn:arn,
																						MessageStructure:'json',
																						Message:message
																					};
																					sns.publishAsync(params).then(
																						(result)=>res(result));
																				});
																		});
																	}
																}).then((result)=>resolve('Expired '+item.hotline));
															});
													});
											});
									}
								});
						});
					} else{
						resolve('Continue '+item.hotline);
					}
				}).then((result)=>console.log(result));
			}).then((result)=>console.log('Done all'));
		});
});
