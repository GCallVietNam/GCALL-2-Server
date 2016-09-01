const Kaiseki=require('../lib/kaiseki');
const app_id='YOUR_APP_ID';
const master_key='YOUR_MASTER_KEY';
const rest_api_key='YOUR_REST_API_KEY';
const server_url='YOUR_PARSE_SERVER';
const mount_path='YOUR_MOUNT_PATH';

module.exports=new Kaiseki(app_id,master_key,rest_api_key,server_url,mount_path);