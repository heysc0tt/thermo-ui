var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Benvenue Temps' });
});

// router.get('/temps', function (req, res, next) {
//     var startTime;
//     if(req.query.st === undefined) {
//         var d = new Date();
//         d.setDate(d.getDate() - 1);
//         startTime = d;
//     } else {
//         startTime = new Date(parseInt(req.query.st));
//     }
    
//     retrieveTempData(startTime, function(r) {
//         res.json(r);
// 	});
// });


module.exports = router;
