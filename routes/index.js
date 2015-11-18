var express = require('express');
var router = express.Router();
var nconf = require('nconf');

nconf.argv().env().file('config/config.json');

var confFile = nconf.get("CONFIG_FILE");
if(confFile) {
	nconf.file(confFile);
}

var mongoConfig = getMongoConfig();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Benvenue Temps' });
});

router.get('/temps', function (req, res, next) {
	var startTime;
	if(req.query.st === undefined) {
		var d = new Date();
		d.setDate(d.getDate() - 1);
		startTime = d;
	} else {
		console.log(req.query.st);
		startTime = new Date(parseInt(req.query.st));
	}
	console.log(startTime);

	var MongoClient = require('mongodb').MongoClient

    var connectionStr = 'mongodb://'+ mongoConfig.username +':'+mongoConfig.password+'@'+mongoConfig.host+':'+mongoConfig.port+'/'+mongoConfig.database;
	MongoClient.connect(connectionStr, function(err, db) {
	  if (err) {
	    throw err;
	  }

	  db.collection("temperatures").find(
	  	{ $and: [ {_id: { $gt: objectIdWithTimestamp(startTime) }}, {bbq: { $gt: 10, $lt: 25}}, {temperature: { $gt: 10, $lt: 25}}]}
      ).sort(
        {_id: -1}
      ).map(function(t) { 
        return { bbq: (t.bbq*1.8) + 32, temp: (t.temperature*1.8) + 32, timestamp: t._id.getTimestamp().getTime() }
      })
      .toArray(function(err, result) {
	    if (err) {
	      throw err;
	    }
	    res.json(result);
	  });
	});

});

function objectIdMinusDays(days) {
	var d = new Date();
	d.setDate(d.getDate() - days);
	return objectIdWithTimestamp(d);
}

function objectIdWithTimestamp(timestamp) {
	var ObjectID = require('mongodb').ObjectID;

    // Convert string date to Date object (otherwise assume timestamp is a date)
    if (typeof(timestamp) == 'string') {
        timestamp = new Date(timestamp);
    }

    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp/1000).toString(16);

    // Create an ObjectId with that hex timestamp
    var constructedObjectId = new ObjectID(hexSeconds + "0000000000000000");

    return constructedObjectId
}

function getMongoConfig() {
	var mongoConfig = {};
	mongoConfig.host = nconf.get('mongo:host');
	mongoConfig.port = nconf.get('mongo:port');
	mongoConfig.database = nconf.get('mongo:database');
	mongoConfig.username = nconf.get('mongo:username');
	mongoConfig.password = nconf.get('mongo:password');
	return mongoConfig;
}

module.exports = router;
