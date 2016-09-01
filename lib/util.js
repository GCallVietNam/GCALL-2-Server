// Utility functions involving time calculations

// Text indicating time gaps between two time points

module.exports.showGap=function(start,end){
	var text='';
	const sec=1000;
	const min=sec*60;
	const hr=min*60;
	const day=hr*24;
	const gap=end-start;
	if (gap<min){
		text=Math.floor(gap/sec)+' secs';
	} else{
		if (gap<day){
			if (gap<hr){
				text=Math.floor(gap/min)+' min';
				if (gap>=2*min){
					text=text+'s';
				}
			} else{
				text=Math.floor(gap/hr)+' hr';
				if (gap>=2*hr){
					text=text+'s';
				}
			}
		} else{
			text=Math.floor(gap/day)+' day';
			if (gap>=2*day){
				text=text+'s';
			}
		}
	}
	text=text+' ago';
	return text;
}

// Text indicating number of minutes and seconds, input is number of seconds

module.exports.secToMin=function(time){
	var text='';
	if (time<60){
		text=time.toString()+' sec';
		if (time!=1){
			text=text+'s';
		}
	} else{
		const min=Math.floor(time/60);
		text=min.toString()+' min';
		if (min>=2){
			text=text+'s';
		}
		const sec=time-min*60;
		if (sec>0){
			text=text+' '+sec.toString()+' sec';
			if (sec>2){
				text=text+'s';
			}
		}
	}
	return text;
}

// Sort calllogs in descending order

module.exports.sortLogs=function(logs){
	for (var i=logs.length-1;i>=1;i--){
		for (var j=0;j<=i-1;j++){
			if (logs[j].at<logs[i].at){
				var tmp=logs[i];
				logs[i]=logs[j];
				logs[j]=tmp;
			}
		}
	}
	return logs;
}

// Sort Twilio calllogs in ascending order

module.exports.sortTwilioLogs=function(logs){
	for (var i=logs.length-1;i>=1;i--){
		for (var j=0;j<=i-1;j++){
			if (logs[j].startTime>logs[i].startTime){
				var tmp=logs[i];
				logs[i]=logs[j];
				logs[j]=tmp;
			}
		}
	}
	return logs;
}