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
	
	login(this);
}

function login(that){
	
		request.post({
  			url: that.server_address+"/login",
  			rejectUnauthorized: false,
  			headers: {'content-type' : 'application/x-www-form-urlencoded'},
  			body:    "email="+that.email+"&password="+that.password,
  			referer: that.server_address,
  			"user-agent": that.user_agent
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
					url: that.server_address+"/panels/"+that.panel,
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
					referer: that.server_address,
					"user-agent": that.user_agent
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
		var self = this;
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
						console.log("We have an error getting the status not treated: "+error); 
						callback(error);
						
					}else{
						if (body == '"Cannot connect to panel"'){
							console.log("We have an error getting the status not treated: "+error); 
							callback(error);
						}else if(body.startsWith('<!DOCTYPE html')){
							console.log("HTML answer - cookies not good"); 
							login(self);
							setTimeout(function() {
							    self.getCurrentState(callback);
							}, 1300);
							
						}else
						{		
							var state = JSON.parse(body)[0]["state"];
							console.log("Area in current state "+state);
							var returnstate = Characteristic.SecuritySystemTargetState.DISARM;
							if (state == "armed"){
								
								self.securityService.setCharacteristic(Characteristic.SecuritySystemTargetState, Characteristic.SecuritySystemTargetState.AWAY_ARM);
								returnstate = Characteristic.SecuritySystemTargetState.AWAY_ARM;
							}else if (state == "arm in progress"){
								returnstate = Characteristic.SecuritySystemTargetState.DISARM;
								self.securityService.setCharacteristic(Characteristic.SecuritySystemTargetState, Characteristic.SecuritySystemTargetState.AWAY_ARM);
							}else{
								self.securityService.setCharacteristic(Characteristic.SecuritySystemTargetState, Characteristic.SecuritySystemTargetState.DISARM);
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
            		.on('set', this.setTargetState.bind(this));

			this.informationService = new Service.AccessoryInformation();
			this.informationService
				.setCharacteristic(Characteristic.Manufacturer, 'Comelit')
				.setCharacteristic(Characteristic.Model, 'Vedo Full Radio');

			return [this.informationService, this.securityService];

    	}
};