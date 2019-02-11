let async = require('async');
let BikesStation = require('../models/bikes_station');
// const recordLimit = 10000;
exports.list_all = function(req, res, next) {
  //console.log("Returning "+recordLimit+" records");
  const query = BikesStation.find({}, 'GEOGID -_id').limit();
  query.setOptions({
    lean: true
  });
  //query.collection(SmallArea.collection);
  query.exec(function(err, doc) {
    if (err) {
      res.render('api_error', {
        title: 'API Error'
      });
      return next(err);
    }
    res.send(doc);
  });
}

exports.bikes_station_data = function(req, res, next) {
  const query = BikesStation.find();
  query.setOptions({
    lean: true
  });
  //query.collection(SmallArea.collection);
  query.where('NUMBER').equals(req.params.id)
    .exec(function(err, doc) {
      if (err) {
        res.render('api_error', {
          title: 'API Error'
        });
        return next(err);

      }
      // if(doc.length>0){
      // res.render('small_area_data', {
      //   title: 'Small Area Data',
      //   sa: req.params.id,
      //   data: doc[0]
      //});
      res.send(doc);
      // }
      // else{
      //     // res.render('small_area_data', {
      //     //   title: 'Small Area Data',
      //     //   sa: req.params.id,
      //     //   data: 'No data found for a Small Area with this GEOGID' });
      //     res.send({});
      //
      // }
    });
}