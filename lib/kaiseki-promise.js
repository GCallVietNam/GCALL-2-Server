// Promisify Parse REST API

const Promise=require('bluebird');

module.exports=function(kaiseki){
	return Promise.promisifyAll(kaiseki);
}