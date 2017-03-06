var Service, Characteristic, util;
var request = require("request");

module.exports = function(homebridge){
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory("homebridge-Vedo-Full-Radio", "Vedo-Full-Radio", HttpSecuritySystemAccessory);
}

function HttpSecuritySystemAccessory(log, config) {
	this.log = log;
	
	this.httpMethod = config["http_method"] || "GET";
	
	this.email = config["email"] || "";
	this.password = config["password"] || "";
	this.name = config["name"];
	this.panel = config["panel"] || "0";
	this.area = config["area"] || "0";
	this.user_agent = config["user-agent"];
	this.server_address = config["comelit_server"];
	var server_address = this.server_address;
	var panel = this.panel;
	
	request.post({
  			url: this.server_address+"/login",
  			rejectUnauthorized: false,
  			headers: {'content-type' : 'application/x-www-form-urlencoded'},
  			body:    "email="+this.email+"&password="+this.password,
  			referer: this.server_address,
  			"user-agent": this.user_agent
		}, function(error, response, body){
			
  			if (error) {
	  			console.log("We have an error with getting the Cookie : "+error); 
  			}else{
           		console.log("OK Cookies");

           		var fs = require('fs');
           		var cookie = response.headers["set-cookie"][0].split(';')[0];
				fs.writeFile("/tmp/cookie.comelit", cookie, function(err) {
				    if(err) {
				        return console.log(err);
				    }
				}); 

           		request.put({
					url: server_address+"/panels/"+panel,
					rejectUnauthorized: false,
					method: 'PUT',
					followAllRedirects: false,
					headers: {
    					'User-Agent': this.user_agent,
    					'X-Requested-With': 'XMLHttpRequest',
    					'Cookie' : cookie,
    					'Content-Type': 'application/json'
  					},
  					json: {"connect_status":"true"},
					referer: server_address,
					"user-agent": this.user_agent
				}, function(error, response, body){
					if (error) {
						console.log("We have an error getting all the panels : "+error); 
					}else{
						console.log("Panel set");
					}
				});

           	}
		});
}

HttpSecuritySystemAccessory.prototype = {



	setTargetState: function(state, callback) {
		this.log("Setting state to %s", state);
		var self = this;
		var new_state = null;
		switch (state) {
			case Characteristic.SecuritySystemTargetState.STAY_ARM:
				new_state = "arm";
				break;
			case Characteristic.SecuritySystemTargetState.AWAY_ARM :
				new_state = "arm";
				break;
			case Characteristic.SecuritySystemTargetState.NIGHT_ARM:
				new_state = "arm";
				break;
			case Characteristic.SecuritySystemTargetState.DISARM:
				new_state = "disarm";
				break;
		}
		
				var fs = require('fs');
				var cookie = fs.readFileSync('/tmp/cookie.comelit','utf8')
				
           		request.put({
					url: this.server_address+"/panels/"+this.panel+"/areas/"+this.area,
					rejectUnauthorized: false,
					method: 'PUT',
					followAllRedirects: false,
					headers: {
    					'User-Agent': this.user_agent,
    					'X-Requested-With': 'XMLHttpRequest',
    					'Cookie' : cookie,
    					'Content-Type': 'application/json'
  					},
  					json: {"state":new_state},
					referer: this.server_address,
					"user-agent": this.user_agent
				}, function(error, response, body){
					if (error) {
						console.log("Error setting state : "+error); 
						callback(error);
					}else{
						console.log('SetState function succeeded!');
						self.securityService.setCharacteristic(Characteristic.SecuritySystemCurrentState, state);
						callback(error, response, state);
					}
				});
	},
	
	getCurrentState: function(callback) {
		this.log("Getting current state");
		var fs = require('fs');
		var cookie = fs.readFileSync('/tmp/cookie.comelit','utf8')
		
		request.get({
					url: this.server_address+"/panels/"+this.panel+"/areas",
					rejectUnauthorized: false,
					method: 'GET',
					followAllRedirects: false,
					headers: {
    					'User-Agent': this.user_agent,
    					'X-Requested-With': 'XMLHttpRequest',
    					'Cookie' : cookie
  					},
  					timeout : 8000,
					referer: this.server_address,
					"user-agent": this.user_agent
				}, function(error, response, body){
					if (error) {
						if (error.code == 'ESOCKETTIMEDOUT'){
							var stats = fs.statSync("/tmp/comelitLastStatus");
							var util = require('util');
							var mtime = new Date(util.inspect(stats.mtime));
							var t2 = new Date();
							var dif = t2.getTime() - mtime.getTime();
							var Seconds_from_T1_to_T2 = dif / 1000;
							
							if (Seconds_from_T1_to_T2 <20){
								var state = fs.readFileSync('/tmp/comelitLastStatus','utf8')
								console.log("Using saved for current state "+state);
								var returnstate = Characteristic.SecuritySystemTargetState.DISARM;
								if (state == "armed"){
									returnstate = Characteristic.SecuritySystemTargetState.AWAY_ARM;
								}
								callback(null, returnstate);
							}else{
								console.log("We have an error getting the status : "+error); 
								callback(error);
							}
							
						}else{
							console.log("We have an error getting the status : "+error); 
							callback(error);
						}
					}else{
						if (body == '"Cannot connect to panel"'){
							var stats = fs.statSync("/tmp/comelitLastStatus");
							var util = require('util');
							var mtime = new Date(util.inspect(stats.mtime));
							var t2 = new Date();
							var dif = t2.getTime() - mtime.getTime();
							var Seconds_from_T1_to_T2 = dif / 1000;
						}else{				
							var state = JSON.parse(body)[0]["state"];
			           		fs.writeFile("/tmp/comelitLastStatus", state, function(err) {
							    if(err) {
							        return console.log(err);
							    }
							}); 
							console.log("Area in current state "+state);
							var returnstate = Characteristic.SecuritySystemTargetState.DISARM;
							if (state == "armed"){
								returnstate = Characteristic.SecuritySystemTargetState.AWAY_ARM;
							}
							callback(null, returnstate);
						}
					}
				});
	},

	getTargetState: function(callback) {
		this.log("Getting target state");
		var fs = require('fs');
		var cookie = fs.readFileSync('/tmp/cookie.comelit','utf8')
		
		request.get({
					url: this.server_address+"/panels/"+this.panel+"/areas",
					rejectUnauthorized: false,
					method: 'GET',
					followAllRedirects: false,
					headers: {
    					'User-Agent': this.user_agent,
    					'X-Requested-With': 'XMLHttpRequest',
    					'Cookie' : cookie
  					},
  					timeout : 8000,
					referer: this.server_address,
					"user-agent": this.user_agent
				}, function(error, response, body){
					if (error) {
						if (error.code == 'ESOCKETTIMEDOUT'){
							var stats = fs.statSync("/tmp/comelitLastStatus");
							var util = require('util');
							var mtime = new Date(util.inspect(stats.mtime));
							var t2 = new Date();
							var dif = t2.getTime() - mtime.getTime();
							var Seconds_from_T1_to_T2 = dif / 1000;
							
							if (Seconds_from_T1_to_T2 <20){
								var state = fs.readFileSync('/tmp/comelitLastStatus','utf8')
								console.log("Using saved for target state "+state);
								var returnstate = Characteristic.SecuritySystemTargetState.DISARM;
								if (state == "armed"){
									returnstate = Characteristic.SecuritySystemTargetState.AWAY_ARM;
								}else if (state == "arm in progress"){
									returnstate = Characteristic.SecuritySystemTargetState.AWAY_ARM;
								}
								callback(null, returnstate);
							}else{
								console.log("We have an error getting the status : "+error); 
								callback(error);
							}
							
						}else{
							console.log("We have an error getting the status : "+error); 
							callback(error);
						}
					}else{
						if (body == '"Cannot connect to panel"'){
							var stats = fs.statSync("/tmp/comelitLastStatus");
							var util = require('util');
							var mtime = new Date(util.inspect(stats.mtime));
							var t2 = new Date();
							var dif = t2.getTime() - mtime.getTime();
							var Seconds_from_T1_to_T2 = dif / 1000;
							console.log(Seconds_from_T1_to_T2);
						}else{	
							var state = JSON.parse(body)[0]["state"];
			           		fs.writeFile("/tmp/comelitLastStatus", state, function(err) {
							    if(err) {
							        return console.log(err);
							    }
							}); 
							console.log("Area in target state "+state);
							var returnstate = Characteristic.SecuritySystemTargetState.DISARM;
							if (state == "armed"){
								returnstate = Characteristic.SecuritySystemTargetState.AWAY_ARM;
							}else if (state == "arm in progress"){
								returnstate = Characteristic.SecuritySystemTargetState.AWAY_ARM;
							}
							callback(null, returnstate);
						}
					}
				});
	},

	identify: function(callback) {
		this.log("Identify requested!");
		callback(); // success
	},

	getServices: function() {
        	this.securityService = new Service.SecuritySystem(this.name);

        	this.securityService
            		.getCharacteristic(Characteristic.SecuritySystemCurrentState)
            		.on('get', this.getCurrentState.bind(this));

        	this.securityService
            		.getCharacteristic(Characteristic.SecuritySystemTargetState)
            		.on('get', this.getTargetState.bind(this))
            		.on('set', this.setTargetState.bind(this));

        	return [this.securityService];
    	}
};