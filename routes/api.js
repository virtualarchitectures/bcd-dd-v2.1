var express = require('express');
var router = express.Router();
var bikes_station_controller = require('../controllers/bikes_station_controller');
var small_area_controller = require('../controllers/small_area_controller');
//var housing_files_controller = require('../controllers/housing_files_controller');

router.get('/', function(req, res, next) {
  res.render('api', {
    title: 'API Test Page'
  });
});

router.get('/v1', function(req, res, next) {
  res.render('api_v1', {
    title: 'API Version 1'
  });
});

/****
Dublin Bikes
****/
router.get('/v1/dublinbikes', function(req, res) {
  res.render('api_dublinbikes', {
    title: 'Dublin Bikes API'
  });
});

//Return static info for all stations   
router.get('/v1/dublinbikes/stations', bikes_station_controller.list_all);
//Return data for an SA
//router.get('/v1/dublinbikes/station/:id', bikes_station_controller.bikes_station_data);

/****
Census
****/
router.get('/v1/census2016', function(req, res) {
  res.render('api_census2016', {
    title: 'Census 2016 API Test Page'
  });
});

//Return GEOGIDs for all SAs
router.get('/v1/census2016/smallareas', small_area_controller.list_all);
//Return data for an SA
router.get('/v1/census2016/smallarea/:id', small_area_controller.small_area_data);

/****
Housing
****/

router.get('/v1/housing', function(req, res) {
  res.render('housing', {
    title: 'Housing API Test Page'
  });
});


//Return GEOGIDs for all SAs
//router.get('/v1/housing/list', housing_files_controller.list_files);
//Return data for an SA
//router.get('/v1/census2016/smallarea/:id', small_area_controller.small_area_data);

module.exports = router;