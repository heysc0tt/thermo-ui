var express = require('express');
var router = express.Router();
var temps = require('../temps/temps-db');
var url = require('url');

router.get('/temps/since/:start?', function (req, res, next) {

    var d = new Date();
    d.setDate(d.getDate() - 1);
    var startTime = d;
    if(!(req.query.startTime === undefined)) {
        var t = new Date();
        t.setTime(req.query.startTime);
        startTime = t;
    }
    console.log("StartTime: " + startTime);
    var end = new Date();
    end.setDate(startTime.getDate() + 1);
    if(!(req.query.end === undefined) && req.query.end != '') {
        console.log("End Query: '" + req.query.end + "'");
        var t = new Date();
        t.setTime(req.query.end);
        end = t;
    }

    temps.since(startTime, end, function(r) {
        var json = wrapDataDate(r, req, startTime, end);
        res.json(json);
    });
});

router.get('/temps', function (req, res, next) {

    var startIndex = 0;
    if(!(req.query.startIndex === undefined)) {
        startIndex = parseInt(req.query.startIndex);
    }

    var perPage = 100;
    if(!(req.query.perPage === undefined)) {
        perPage = parseInt(req.query.perPage);
    }
    
    temps.paginated(startIndex, perPage, function(r) {
        var json = wrapData(r, req, startIndex, perPage);
        res.json(json);
	});
});

function wrapData(tempData, req, previousStart, perPage) {
    var json = {
        data: tempData,
        links: {
            next: nextPageUrl(req, previousStart, perPage),
            previous: previousStart <= 0 ? undefined : previousPageUrl(req, previousStart, perPage)
        }
    };
    return json;
}

function wrapDataDate(tempData, req, previousStartTime, previousEnd) {
    var json = {
        data: tempData,
        links: {
            next: nextSinceUrl(req, previousStartTime, previousEnd),
            previous: previousSinceUrl(req, previousStartTime, previousEnd)
        }
    };
    return json;
}

function nextPageUrl(req, previousStart, perPage) { 
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.baseUrl + req.path,
        query: { startIndex: (previousStart + perPage), perPage: perPage}
    });
}

function nextSinceUrl(req, previousStartTime, previousEnd) { 
    var period = previousEnd - previousStartTime;
    console.log("PreviousEnd: " + previousEnd);
    console.log("previousStartTime: " + previousStartTime);
    console.log("period: " + period);
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.baseUrl + req.path,
        query: { startTime: (previousStartTime - period), end: previousStartTime.getTime()}
    });
}

function previousPageUrl(req, previousStart, perPage) { 
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.baseUrl + req.path,
        query: { startIndex: Math.max(0, previousStart - perPage), perPage: perPage}
    });
}

function previousSinceUrl(req, previousStartTime, previousEnd) { 
    var period = previousEnd - previousStartTime;

    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.baseUrl + req.path,
        query: { startTime: previousEnd.getTime(), end: (previousEnd.getTime() + period) > Date.now() ? undefined : (previousEnd.getTime() + period) }
    });
}

function consolidateData(fullData) {
    var consolidatedData = [];

    var smaBBQ = simple_moving_averager(100);
    var smaTemp = simple_moving_averager(100);
    var lastTime = Date.now();
    for(var i=0;i<fullData.length;i++) {
        var bbqAvg = smaBBQ(fullData[i].bbq);
        var tempAvg = smaTemp(fullData[i].temp);
        if(fullData[i].timestamp < (lastTime - 300000)) {
            consolidatedData.push({timestamp: fullData[i].timestamp, bbq: bbqAvg, temp: tempAvg});
            lastTime = fullData[i].timestamp;
        }
    }
    return consolidatedData;
}

Number.prototype.round = function() {
      return Math.round(this);
}

function simple_moving_averager(period) {
    var nums = [];
    return function(num) {
        nums.push(num);
        if (nums.length > period)
            nums.splice(0,1);  // remove the first element of the array
        var sum = 0;
        for (var i in nums)
            sum += nums[i];
        var n = period;
        if (nums.length < period)
            n = nums.length;
        return(sum/n);
    }
}

module.exports = router;