var express = require('express');
var router = express.Router();
var temps = require('../temps/temps-db');

router.get('/temps/since', function (req, res, next) {
    var startTime;
    if(req.query.st === undefined) {
        var d = new Date();
        d.setDate(d.getDate() - 1);
        startTime = d;
    } else {
        startTime = new Date(parseInt(req.query.st));
    }
    
    temps.since(startTime, function(r) {
        res.json(r);
    });
});

router.get('/temps', function (req, res, next) {
    var startIndex = 0, perPage = 100;
    if(!(req.query.startIndex === undefined)) {
        startIndex = parseInt(req.query.startIndex);
    }
    if(!(req.query.perPage === undefined)) {
        perPage = parseInt(req.query.perPage);
    }
    
    temps.paginated(startIndex, perPage, function(r) {
        res.json(r);
	});
});

module.exports = router;