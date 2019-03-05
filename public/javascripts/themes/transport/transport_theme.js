/************************************
 * Bikes
 ************************************/
//let dublinBikesMapIcon = L.icon({
//    iconUrl: '/images/transport/bicycle-w-blue-15.svg',
//    iconSize: [30, 30], //orig size
//    iconAnchor: [iconAX, iconAY] //,
//            //popupAnchor: [-3, -76]
//});

let bikesIcon = L.Icon.extend({
    options: {
        iconSize: [35, 45],
        iconAnchor: [iconAX, iconAY],
        popupAnchor: [0, 0]
    }
});

let osmBike = new L.TileLayer(stamenTonerUrl_Lite, {
    minZoom: min_zoom,
    maxZoom: max_zoom,
    attribution: stamenTonerAttrib
});

let bikeMap = new L.Map('chart-transport-bikes', {
    closePopupOnClick: true
});
bikeMap.setView(new L.LatLng(dubLat, dubLng), zoom);
bikeMap.addLayer(osmBike);


let bikeCluster = L.markerClusterGroup();

let bikeTime = d3.timeFormat("%a %B %d, %H:%M");
let bikeHour = d3.timeFormat("%H");
//Get latest bikes data from file, display in map iconography
d3.json("/data/Transport/bikesData.json").then(function (data) {
    //console.log(data[0]);
    processLatestBikes(data);
});


/* TODO: performance- move to _each in updateMap */
function processLatestBikes(data_) {
    let bikeStands = 0;
    //console.log("Bike data \n");
    data_.forEach(function (d) {
        d.lat = +d.position.lat;
        d.lng = +d.position.lng;
        //add a property to act as key for filtering
        d.type = "Dublin Bikes Station";
        if (d.bike_stands) {
            bikeStands += d.bike_stands;
        }
    });
    d3.select('#stations-count').html(data_.length);
    d3.select('#stands-count').html(bikeStands);
    //console.log("# of available bike is " + available + "\n");
    //    console.log("Bike Station: \n" + JSON.stringify(data_[0].name));
    //    console.log("# of bike stations is " + data_.length + "\n"); // +
    updateMapBikes(data_);
}
;

//let markerRefBike; //TODO: fix horrible hack!!!
let customBikesStationMarker = L.Marker.extend({
    options: {
        id: 0
    }
});

let bikesStationPopupOptons = {
    // 'maxWidth': '500',
    'className': 'bikesStationPopup'
};

function updateMapBikes(data__) {
    bikeCluster.clearLayers();
    bikeMap.removeLayer(bikeCluster); //required
    _.each(data__, function (d, i) {
        let m = new customBikesStationMarker(
                new L.LatLng(d.lat, d.lng), {
            id: d["number"],
            icon: getBikesIcon(d),
            opacity: 0.95,
            title: d.type + ' - ' + d.name,
            alt: d.type + ' icon',
            riseOnHover: true,
            riseOffset: 250

        });
        m.bindPopup(bikesStationPopupInit(d), bikesStationPopupOptons);
        m.on('popupopen', getBikesStationPopup);
        bikeCluster.addLayer(m);
    });
    bikeMap.addLayer(bikeCluster);
    bikeMap.fitBounds(bikeCluster.getBounds());
}


function bikesStationPopupInit(d_) {
    let str = "<div class=\"container \">" +
            "<div class=\"row \">" +
            "<div class=\"col-sm-9 \">";
    if (d_.name) {
        str += "<h6>" + d_.name + '</h6>';
    }
    str += "</div>" +
            "<div class=\"col-sm-3 \">";
    if (d_.banking) {
        str += "<img alt=\"Banking icon \" src=\"images/bank-card-w.svg\" height= \"25px\" title=\"Banking available\" />";
    }
    str += '</div></div>'; //closes col then row

    // if (d_.type) {
    //   str += d_.type;
    // }
    if (d_.bike_stands) {
        str += '<div class=\"row \">';
        str += '<div class=\"col-sm-12 \">';
        str += '<b>' + d_.bike_stands + '</b> stands';
        str += '</div></div>';

        str += '<div class=\"row \">'
        str += '<span id="bike-spark-' + d_.number + '"> </span>';
        str += '</div>';
    }
    str += '</div>' //closes container
    return str;
}
//Sparkline for popup
function getBikesStationPopup() {
    ////d3.select("#bike-spark-67").text('Selected from D3');
    let sid_ = this.options.id;
    let bikeSpark = dc.lineChart("#bike-spark-" + sid_);
    //    let timeParse = d3.timeParse("%d/%m/%Y");
    d3.json("/api/dublinbikes/stations/" + sid_ + "/today").then(function (stationData) {
        // stationData.forEach(function (d) {
        //     d.hour = new Date(d["last_update"]).getHours();
        // });
        let standsCount = stationData[0].bike_stands;
        let ndx = crossfilter(stationData);
        let timeDim = ndx.dimension(function (d) {
            return d["last_update"];
        });
        let latest = timeDim.top(1)[0].last_update;
//        console.log ("latest: "+JSON.stringify(timeDim.top(1)[0].last_update));
        let availableBikesGroup = timeDim.group().reduceSum(function (d) {
            return d["available_bikes"];
        });
        //moment().format('MMMM Do YYYY, h:mm:ss a');
        let start = moment.utc().startOf('day').add(3, 'hours');
        let end = moment.utc().endOf('day').add(2, 'hours');

        //        console.log("bikes: " + JSON.stringify(timeDim.top(Infinity)));
        bikeSpark.width(250).height(100);
        bikeSpark.dimension(timeDim);
        bikeSpark.group(availableBikesGroup);
        //        console.log("day range: " + start + " - " + end);
        bikeSpark.x(d3.scaleTime().domain([start, end]));
        bikeSpark.y(d3.scaleLinear().domain([0, standsCount]));
        bikeSpark.margins({
            left: 20,
            top: 10,
            right: 20,
            bottom: 20
        });

        bikeSpark.xAxis().ticks(3);
        bikeSpark.renderArea(true);
        bikeSpark.renderDataPoints(false);
//        bikeSpark.renderDataPoints({radius: 10});//, fillOpacity: 0.8, strokeOpacity: 0.0});
        bikeSpark.renderLabel(false);//, fillOpacity: 0.8, strokeOpacity: 0.0}); //labels on points -> how to apply to last point only?
        bikeSpark.label(function (d) {
            if (d.x === latest) {
                console.log(JSON.stringify(d));
                let hour = new Date(d.x).getHours();
                let mins = new Date(d.x).getMinutes().toString().padStart(2, '0');
                let end = ((d.y == 1) ? ' bike' : ' bikes');
//                let str = hour + ':' + mins + 
                let str = JSON.stringify(d.y) + end;
                console.log(str);
                return str;
                ;
            }
            return '';
        });
//        bikeSpark.title(function (d, i) {
//            let hour = new Date(d.key).getHours();
//            let mins = new Date(d.key).getMinutes().toString().padStart(2, '0');
//            let val = ((d.value == 1) ? ' bike available' : ' bikes available');
//            let str = hour + ':' + mins + ' - ' + JSON.stringify(d.value) + val;
////              console.log(str);
//            return str;
//        });
        bikeSpark.renderVerticalGridLines(true);
        bikeSpark.useRightYAxis(true);
        bikeSpark.xyTipsOn(false);
        bikeSpark.brushOn(false);
        bikeSpark.clipPadding(15);
        bikeSpark.render();
    });
}

function getBikesIcon(d_) {
    var percentageFree = (d_.available_bikes / d_.bike_stands) * 100;
    console.log("% " + percentageFree);

    var one = new bikesIcon({iconUrl: 'images/transport/bikes_icon_blue_1.png'}),
            two = new bikesIcon({iconUrl: 'images/transport/bikes_icon_blue_2.png'}),
            three = new bikesIcon({iconUrl: 'images/transport/bikes_icon_blue_3.png'}),
            four = new bikesIcon({iconUrl: 'images/transport/bikes_icon_blue_4.png'}),
            five = new bikesIcon({iconUrl: 'images/transport/bikes_icon_blue_5.png'});
//            six = new bikeIcon({iconUrl: 'images/transport/bike120.png'});


    /*return percentageFree < 20 ? '#eff3ff' :
     percentageFree < 40  ? '#c6dbef' :
     percentageFree < 60  ? '#9ecae1' :
     percentageFree < 80  ? '#6baed6' :
     percentageFree < 100   ? '#3182bd' :
     percentageFree < 120   ? '#08519c' :
     '#000000';*/

    return percentageFree < 20 ? one :
            percentageFree < 40 ? two :
            percentageFree < 60 ? three :
            percentageFree < 80 ? four : five;
//            percentageFree < 101 ? five 
//            // percentageFree < 120   ? six :
//            'six';


}



/************************************
 * Bus Stops
 ************************************/

let osmBus = new L.TileLayer(stamenTonerUrl_Lite, {
    minZoom: min_zoom,
    maxZoom: max_zoom,
    attribution: stamenTonerAttrib
});

let busMap = new L.Map('chart-transport-bus');
busMap.setView(new L.LatLng(dubLat, dubLng), zoom);
busMap.addLayer(osmBus);
let markerRefBus;
busMap.on('popupopen', function (e) {
    markerRefBus = e.popup._source;
    //console.log("ref: "+JSON.stringify(e));
});

let busCluster = L.markerClusterGroup();

let dublinBusMapIcon = L.icon({
    iconUrl: '/images/transport/bus-15.svg',
    iconSize: [30, 30], //orig size
    iconAnchor: [iconAX, iconAY] //,
            //popupAnchor: [-3, -76]
});

d3.json("/data/Transport/busstopinformation_bac.json").then(function (data) {
    //    console.log("data.results[0]" + JSON.stringify(data.results[0]));
    processBusStops(data.results); //TODO: bottleneck?
});


function processBusStops(res_) {
    //    console.log("Bus data \n");
    res_.forEach(function (d) {
        d.lat = +d.latitude;
        d.lng = +d.longitude;
        //add a property to act as key for filtering
        d.type = "Dublin Bus Stop";

    });
    //    console.log("Bus Stop: \n" + JSON.stringify(res_[0]));
    //    console.log("# of bus stops is " + res_.length + "\n"); // +
    updateMapBuses(res_);
}
;

function updateMapBuses(data__) {
    busCluster.clearLayers();
    busMap.removeLayer(busCluster);
    _.each(data__, function (d, i) {
        let marker = L.marker(new L.LatLng(d.lat, d.lng), {
            icon: dublinBusMapIcon
        });
        marker.bindPopup(getBusContent(d));
        busCluster.addLayer(marker);
        //        console.log("getMarkerID: "+marker.optiid);
    });
    busMap.addLayer(busCluster);
    busMap.fitBounds(busCluster.getBounds());
}


function getBusContent(d_) {
    let str = '';
    if (d_.fullname) {
        str += '<b>' + d_.fullname + '</b><br>';
    }
    if (d_.stopid) {
        str += 'Stop ' + d_.stopid + '<br>';
    }
    if (d_.operators[0].routes) {
        str += 'Routes: ';
        _.each(d_.operators[0].routes, function (i) {
            str += i;
            str += ' ';
        });
        str += '<br>';
    }
    if (d_.address && d_.address !== d_.name) {
        str += d_.address + '<br>';
    }
    //    if (d_.stopid) {
    //        //add a button and attached the busstop id to it as data, clicking the button will query using 'stopid'
    //        str += '<br/><button type="button" class="btn btn-primary busRTPIbutton" data="'
    //                + d_.stopid + '">Real Time Information</button>';
    //    }
    ;

    return str;
}

////Handle button in publicMap popup and get RTPI data
//let busAPIBase = "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?format=json&stopid=";
//
//function displayRTPI(sid_) {
//    d3.json(busAPIBase + sid_)
//            .then(function (data) {
////                console.log("Button press " + sid_ + "\n");
//                let rtpiBase = "<br><br><strong> Next Buses: </strong> <br>";
//                let rtpi = rtpiBase;
//                if (data.results.length > 0) {
////                    console.log("RTPI " + JSON.stringify(data.results[0]));
//                    _.each(data.results, function (d, i) {
//                        //console.log(d.route + " Due: " + d.duetime + "");
//                        //only return n results
//                        if (i <= 7) {
//                            rtpi += "<br><b>" + d.route + "</b> " + d.direction + " to " + d.destination;
//                            if (d.duetime === "Due") {
//                                rtpi += "  <b>" + d.duetime + "</b>";
//                            } else {
//                                rtpi += "  <b>" + d.duetime + " mins</b>";
//                            }
//                        }
//
//                    });
//                } else {
//                    //console.log("No RTPI data available");
//                    rtpi += "No Real Time Information Available<br>";
//                }
////                console.log("split " + markerRefPublic.getPopup().getContent().split(rtpi)[0]);
//                markerRefBus.getPopup().setContent(markerRefBus.getPopup().getContent().split(rtpiBase)[0] + rtpi);
//            });
//
//}
//let displayRTPIBounced = _.debounce(displayRTPI, 100); //debounce using underscore
//
////TODO: replace jQ w/ d3 version
//$("div").on('click', '.busRTPIbutton', function () {
//    displayRTPIBounced($(this).attr("data"));
//});
//

/************************************
 * Luas
 ************************************/
let osmLuas = new L.TileLayer(stamenTonerUrl_Lite, {
    minZoom: min_zoom,
    maxZoom: max_zoom,
    attribution: stamenTonerAttrib
});

let luasMap = new L.Map('chart-transport-luas');
luasMap.setView(new L.LatLng(dubLat, dubLng), zoom);
luasMap.addLayer(osmLuas);
let markerRefLuas;
luasMap.on('popupopen', function (e) {
    markerRefLuas = e.popup._source;
    //console.log("ref: "+JSON.stringify(e));
});

let luasCluster = L.markerClusterGroup();

let luasMapIcon = L.icon({
    iconUrl: '/images/transport/rail-light-15.svg',
    iconSize: [30, 30], //orig size
    iconAnchor: [iconAX, iconAY] //,
            //popupAnchor: [-3, -76]
});

//create points on publicMap for Luas stops even if RTI not available
d3.tsv("/data/Transport/luas-stops.txt").then(function (data) {
    processLuas(data);
});

function processLuas(data_) {
    //    console.log("Luas- \n");
    data_.forEach(function (d) {
        d.lat = +d.Latitude;
        d.lng = +d.Longitude;
        d.StopID = +d.StopID;
        //add a property to act as key for filtering
        d.type = "Luas stop";
        //        console.log("luas stop : " + d.Name);
    });
    updateMapLuas(data_);
}

function updateMapLuas(data__) {
    luasCluster.clearLayers();
    luasMap.removeLayer(luasCluster);
    _.each(data__, function (d, k) {
        //        console.log("k: " + k + "\n");
        let marker = L.marker(new L.LatLng(d.lat, d.lng), {
            icon: luasMapIcon
        });
        marker.bindPopup(getLuasContent(d));
        luasCluster.addLayer(marker);
    });
    luasMap.addLayer(luasCluster);
    luasMap.fitBounds(luasCluster.getBounds());
}

function getLuasContent(d_) {
    let str = '';
    if (d_.Name) {
        str += '<b>' + d_.Name + '</b><br>';
    }
    if (d_.IrishName) {
        str += '<i>' + d_.IrishName + '</i><br>';
    }
    if (d_.LineID) {
        str += getLuasLine(d_.LineID) + ' Line <br>';
    }
    //    if (d_.Name) {
    //        str += '<br/><button type="button" class="btn btn-primary luasRTbutton" data="'
    //                + d_.StopID + '">Real Time Information</button>';
    //    }
    ;

    return str;
}

function getLuasLine(id_) {
    return (id_ === "1" ? "Red" : "Green");
}

//let luasAPIBase = "https://luasforecasts.rpa.ie/analysis/view.aspx?id=";
//
//
//function displayLuasRT(sid_) {
//    console.log("Button press " + luasAPIBase + sid_ + "\n");
//    //Luas API returns html, so we need to parse this into a suitable JSON structure
//    d3.html(luasAPIBase + sid_)
//            .then(function (htmlDoc) {
////                console.log(htmlDoc.body);
//                let infoString = htmlDoc.getElementById("cplBody_lblMessage")
//                        .childNodes[0].nodeValue;
//                //console.log("info: " + infoString + "\n");
//                let headings = htmlDoc.getElementsByTagName("th");
//                //console.log("#cols = " + headings.length + "\n");
//                let rows = htmlDoc.getElementsByTagName("tr");
//                //console.log("#rows = " + rows.length + "\n");
//                let tableData = [];
//                for (let i = 1; i < rows.length; i += 1) {
//                    let obj = {};
//                    for (let j = 0; j < headings.length; j += 1) {
//                        let heading = headings[j]
//                                .childNodes[0]
//                                .nodeValue;
//                        let value = rows[i].getElementsByTagName("td")[j].innerHTML;
//                        //console.log("\nvalue: "+ value);
//                        obj[heading] = value;
//                    }
//                    //console.log("\n");
//                    tableData.push(obj);
//                }
//                //console.log("tabledata: " + JSON.stringify(tableData));
//                let luasRTBase = "<br><br> Next trams after ";
//                let luasRT = luasRTBase + infoString.split("at ")[1] + "<br>";
//                if (tableData.length > 0) {
////                    console.log("RTPI " + JSON.stringify(data.results[0]));
//                    _.each(tableData, function (d, i) {
//                        //console.log(d.route + " Due: " + d.duetime + "");
//                        //only return n results
//                        if (i <= 7) {
//                            luasRT += "<br><b>" + d["Direction"]
//                                    + "</b> to <b>" + d["Destination"] + "</b>";
//                            if (d["Time"]) {
//                                let min = d["Time"].split(":")[1];
//                                if (min === "00") {
//                                    luasRT += " is <b>Due now</b>";
//
//                                } else {
//                                    luasRT += " is due in <b>" + min + "</b> mins";
//                                }
//                            } else {
//                                "n/a";
//                            }
//                        }
//
//                    });
//                } else {
//                    //console.log("No RTPI data available");
//                    luasRT += "No Real Time Information Available<br>";
//                }
////                console.log("split " + markerRefPublic.getPopup().getContent().split(rtpi)[0]);
//                markerRefLuas.getPopup().setContent(markerRefLuas.getPopup().getContent().split(luasRTBase)[0] + luasRT);
//            });
//}
//let displayLuasRTBounced = _.debounce(displayLuasRT, 100); //debounce using underscore
//
////TODO: replace jQ w/ d3 version
//$("div").on('click', '.luasRTbutton', function () {
//    displayLuasRTBounced($(this).attr("data"));
//});

/************************************
 * Parking Map
 ************************************/

let osmCarpark = new L.TileLayer(stamenTonerUrl_Lite, {
    minZoom: min_zoom,
    maxZoom: max_zoom,
    attribution: stamenTonerAttrib
});

let parkingMap = new L.Map('chart-transport-parking');
parkingMap.setView(new L.LatLng(dubLat, dubLng), zoom);
parkingMap.addLayer(osmCarpark);

let markerRefCarpark; //TODO: fix horrible hack!!!
parkingMap.on('popupopen', function (e) {
    markerRefCarpark = e.popup._source;
    //console.log("ref: "+JSON.stringify(e));
});

/************************************
 * Disabled Parking
 ************************************/
let disabledParkingkMapIcon = L.icon({
    iconUrl: '/images/transport/parking-15.svg',
    iconSize: [30, 30], //orig size
    iconAnchor: [iconAX, iconAY] //,
            //popupAnchor: [-3, -76]
});

let disabledParkingCluster = L.markerClusterGroup();

d3.csv("/data/Transport/fccdisabledparking-bayp20111013-2046.csv").then(function (data) {
    //    console.log("DP data length "+data.length);
    processDisabledParking(data); //TODO: bottleneck?
});

function processDisabledParking(data_) {
    //    console.log("- \n");
    data_.forEach(function (d) {
        d.lat = +d["LAT"];
        d.lng = +d["LONG"];
        //        d.StopID = +d.StopID;
        //add a property to act as key for filtering
        d.type = "Fingal County Council Disabled Parking Bay";
        //        console.log("DP bay : " + d.lat);
    });
    d3.select('#fingal-disabled_parking-count').html(data_.length);
    updateMapDisabledParking(data_);
}

function updateMapDisabledParking(data__) {
    disabledParkingCluster.clearLayers();
    parkingMap.removeLayer(disabledParkingCluster);
    _.each(data__, function (d, k) {
        //        console.log("d: " + d.type + "\n");
        let marker = L.marker(new L.LatLng(d.lat, d.lng), {
            icon: disabledParkingkMapIcon
        });
        marker.bindPopup(getDisbaledParkingContent(d));
        disabledParkingCluster.addLayer(marker);
    });
    parkingMap.addLayer(disabledParkingCluster);
    parkingMap.fitBounds(disabledParkingCluster.getBounds());
}

function getDisbaledParkingContent(d_) {
    let str = '';
    if (d_["AREA_DESC"]) {
        str += '<b>' + d_["AREA_DESC"] + '</b><br>';
    }
    if (d_.type) {
        str += '<b>' + d_.type + '</b><br><br>';
    }
    if (d_["TOTAL_SPACES"]) {
        str += 'Total Spaces: ' + d_["TOTAL_SPACES"] + '<br><br>';
    }
    if (d_["DIPPED_FOOTPATH"] === "TRUE") {
        str += '<i>This parking bay HAS a dipped footpath</i> <br>';
    } else {
        str += '<i>This parking bay DOES NOT HAVE a dipped footpath</i> <br>';
    }
    if (d_.Name) {
        str += '<br/><button type="button" class="btn btn-primary luasRTbutton" data="' +
                d_.StopID + '">Real Time Information</button>';
    }
    ;

    return str;
}

/************************************
 * Button listeners
 ************************************/
d3.select(".public_transport_bikes").on("click", function () {
    //    console.log("bikes");
    bikeMap.removeLayer(busCluster);
    bikeMap.removeLayer(luasCluster);
    if (!bikeMap.hasLayer(bikeCluster)) {
        bikeMap.addLayer(bikeCluster);
    }
    bikeMap.fitBounds(bikeCluster.getBounds());
});

d3.select(".public_transport_buses").on("click", function () {
    //    console.log("buses");
    publicMap.removeLayer(bikeCluster);
    publicMap.removeLayer(luasCluster);
    if (!publicMap.hasLayer(busCluster)) {
        publicMap.addLayer(busCluster);
    }
    publicMap.fitBounds(busCluster.getBounds());
});

d3.select(".public_transport_luas").on("click", function () {
    //    console.log("luas");
    publicMap.removeLayer(bikeCluster);
    publicMap.removeLayer(busCluster);
    if (!publicMap.hasLayer(luasCluster)) {
        publicMap.addLayer(luasCluster);
    }
    publicMap.fitBounds(luasCluster.getBounds());
});
d3.select(".public_transport_all").on("click", function () {
    //    console.log("all");
    if (!publicMap.hasLayer(busCluster)) {
        publicMap.addLayer(busCluster);
    }
    if (!publicMap.hasLayer(luasCluster)) {
        publicMap.addLayer(luasCluster);
    }
    if (!publicMap.hasLayer(bikeCluster)) {
        publicMap.addLayer(bikeCluster);
    }
    publicMap.fitBounds(busCluster.getBounds());

});

d3.select(".parking_multi").on("click", function () {
    //    console.log("bikes");
    //    parkingMap.removeLayer(busCluster);
    //    parkingMap.removeLayer(luasCluster);
    if (!parkingMap.hasLayer(carparkCluster)) {
        parkingMap.addLayer(carparkCluster);
    }
    parkingMap.fitBounds(carparkCluster.getBounds());
});