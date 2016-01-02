var nconf = require('nconf');
var mongoClient = require('mongodb').MongoClient;

nconf.argv().env().file('config/config.json');

var mongoConfig = getMongoConfig();

exports.since = function(startTime, endTime, callback) { 

    mongoClient.connect(mongoURL(mongoConfig.database), function(err, db) {
      if (err) {
        throw err;
      }

      db.collection("thermostat-events").find(
        { $and: [ {_id: { $gt: timestampToObjectId(startTime), $lt: timestampToObjectId(endTime) }}]}
      ).sort(
        {_id: -1}
      ).map(function(t) { 
        return { value: t.value, timestamp: t._id.getTimestamp().getTime(), name: t.name }
      })
      .toArray(function(err, result) {
        if (err) {
          throw err;
        }
        callback(result);
      });
    });
}

exports.paginated = function(startIndex, nPerPage, callback) {
    mongoClient.connect(mongoURL(mongoConfig.database), function(err, db) {
      if (err) {
        throw err;
      }

      db.collection("thermostat-events").find({}).sort(
        {_id: -1}
      ).skip(
      	startIndex
      ).limit(
      	nPerPage
      ).map(function(t) { 
        return { value: t.value, timestamp: t._id.getTimestamp().getTime(), name: t.name }
      })
      .toArray(function(err, result) {
        if (err) {
          throw err;
        }
        callback(result);
      });
    });
}

function timestampToObjectId(timestamp) {
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
    mongoConfig.host = nconf.get('MONGO_HOST');
    mongoConfig.port = nconf.get('MONGO_PORT');
    mongoConfig.database = nconf.get('MONGO_DATABASE');
    mongoConfig.username = nconf.get('MONGO_USERNAME');
    mongoConfig.password = nconf.get('MONGO_PASSWORD');
    return mongoConfig;
}

function mongoURL(dbName) {
    return 'mongodb://'+ mongoConfig.username +':'+mongoConfig.password+'@'+mongoConfig.host+':'+mongoConfig.port+'/'+dbName;
}

// unused so far
// function objectIdMinusDays(days) {
//     var d = new Date();
//     d.setDate(d.getDate() - days);
//     return timestampToObjectId(d);
// }