# homebridge-Vedo-Full-Radio
Comelit Vedo Full Radio plugin for [Homebridge](https://github.com/nfarina/homebridge)

# Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g git+https://git@github.com/fafoulon/homebridge-comelit-vedo-full-radio.git`
3. Make sure you have an account on [ComelitCloud.it](https://comelitcloud.it)
4. Update your configuration file. See sample-config.json snippet below.

# Configuration

Configuration sample:

```json
{
   "accessories": [
        {
            "accessory": "Vedo-Full-Radio",
            "name": "Alarme",
            "email": "youremail@gmail.com",
            "password": "yourpasswordgoeshere",
            "panel" : "0",
            "area" : "0",
            "comelit_server" : "https://comelitcloud.it:3069",
            "user-agent" : "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5"
            
        }
    ]
}
```

Fields:

* "accessory": Must always be "Vedo-Full-Radio" (required)
* "name": Can be anything (required)
* "email": your login email, same as website (required)
* "panel": If you have only one alarm registered, keep it to 0 (required)
* "panel": If you have only one alarm registered, keep it to 0 (required)
* "area": If you have only one alarm registered, keep it also to 0 (required)
* "comelit_server": Comelit server (required)

# Help needed

It's my first try at writing a homebridge plugin, so I could really use some help to clean or improve the code. Feel free to fork and make a pull request :-) 

# About the cookies

* When you login to the website, you get a cookie, that needs to be passed to each subsequent request.
* You also need to make a "PUT" request to tell which Panel you want to work with.
* homekit is requesting current and target state at the exact same moment, so it's usually (70% of the time) crashing the second request. That's why I store the first value and pass it to the second request.
* there is currently no support for alarm trigger notification -> I would need some help.
