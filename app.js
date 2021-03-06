/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var request = require('request');
var Twitter = require('twitter');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

var parser = require('json-parser');

var Client = require("ibmiotf");
var config = {
    "org": "82nnqq",
    "id": "MyTweets",
    "domain": "internetofthings.ibmcloud.com",
    "type": "Tweets",
    "auth-method": "token",
    "auth-token": "yqkd7382hdkd-"
};
var deviceClient = new Client.IotfDevice(config);
deviceClient.connect();

// create a new express server
var app = express();

var timesGetWeatherCalled = 0;
var intervalID;

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// When the device connects
deviceClient.on("connect", function() {
	console.log("Device connected!");
});

// When the device receives an error
deviceClient.on("error", function(err) {
	console.log("Error! - " + err);
});

app.get('/process_get', function(req, res)
{
	timesGetWeatherCalled = 0;
	// Prepare output in JSON format
	response = {
		latitude: req.query.latitude,
		longitude: req.query.longitude
	};
	
	intervalID = setInterval(function() {
		getWeather();
	}, 10000);
	// res.setHeader("Content-Type", "text/html");
	// res.end("<form action='https://jpeterkdemoapp.mybluemix.net/process_get' method='GET'>" + 
 //      		"Latitude: <input type='text' name='latitude' /><br />" + 
 //      		"Longitude: <input type='text' name='longitude' /><br />" +
 //      		"<input type='submit' text='submit' />" +
 //    		"</form>" +
 //    		"<p id='blankSpace'>" + JSON.stringify(body.forecasts) + "</p>");
});

function getWeather()
{
	if (timesGetWeatherCalled >= 5)
	{
		clearInterval(intervalID);
	}
	else
	{
		var callURL = "https://58a809af-857f-4b07-a8c3-2474229efe45:EwTcQmn8ST@twcservice.mybluemix.net/api/weather/v1/geocode/" + response.latitude + "/" + response.longitude + "/forecast/hourly/48hour.json?units=m&language=en-US";
		request.get(callURL, {
			json: true
		},
		function (error, response, body) {
			console.log("forecast: " + body.forecasts[0]);
			deviceClient.publish("status", "json", JSON.stringify(body.forecasts[0]));
		});
	}
	timesGetWeatherCalled++;
}

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
