//Options for chart
//TODO: pass these in as config and/or create accessor functions
const srcPathFig3 = "../data/Stories/Housing/",
  srcFileFig3 = "housecomp.csv";
const typesFig3 = ["Dublin City", "Dún Laoghaire-Rathdown", "Fingal", "South Dublin", "Kildare", "Meath", "Wicklow", "Rest of Ireland"];
const titleFig3 = "Number of Housing Completions by Region (1994-2016)";
const divIDFig3 = "housing-completions-chart";

//@TODO: replace with bluebird style Promise.each, or e.g. https://www.npmjs.com/package/promise-each
//Want a better mechanism for page load that doesn't have to wait for all the data

d3.csv(srcPathFig3 + srcFileFig3)
  .then((data) => {

    //Data per type- use the array of type variable values
    let dataByType = [];
    typesFig3.forEach((typeName) => {
      dataByType.push(data.filter((v) => {
        return v.region === typeName;
      }));
    });

    //Traces
    let chartTraces = [];
    dataByType.forEach((typeData, i) => {
      let trace = Object.assign({}, TRACES_DEFAULT);
      trace.name = typeData[0].region;
      // trace.stackgroup = 'one';
      //reassign colour to -defocus some traces
      (i < 4) ? trace.opacity = 1.0: trace.opacity = 0.75; //magic number!!!
      trace.marker = Object.assign({}, TRACES_DEFAULT.marker);
      (i < 4) ? trace.marker.color = null: trace.marker.color = 'grey'; //magic number!!!
      // (i < 4) ? trace.marker.opacity = 1.0: trace.marker.opacity = 0.1; //magic number!!!
      trace.marker.opacity = 0.0; //magic number!!!

      trace.x = typeData.map((v) => {
        return v.date;
      });

      trace.y = typeData.map((v) => {
        return v.value;
      });

      chartTraces.push(trace);
    });


    //Set layout options
    let chartLayout = Object.assign({}, STACKED_AREA_CHART_LAYOUT);
    chartLayout.height = 500;
    chartLayout.title.text = titleFig3;
    chartLayout.marker = Object.assign({}, STACKED_AREA_CHART_LAYOUT.marker);
    chartLayout.marker.opacity = 0;;
    chartLayout.showlegend = false;
    chartLayout.xaxis = Object.assign({}, STACKED_AREA_CHART_LAYOUT.xaxis);
    chartLayout.xaxis.range = [1994, 2016];
    chartLayout.yaxis = Object.assign({}, STACKED_AREA_CHART_LAYOUT.yaxis);
    chartLayout.yaxis.fixedrange = false;
    chartLayout.margin = Object.assign({}, STACKED_AREA_CHART_LAYOUT.margin);
    chartLayout.margin = {
      l: 0,
      r: 180, //annotations space
      b: 40, //x axis tooltip
      t: 50 //button row
    };

    // chartLayout.hidesources = false;

    let chartAnnotations = [];
    chartTraces.forEach((trace, i) => {
      // console.log("trace: " + JSON.stringify(trace));
      let annotation = Object.assign({}, ANNOTATIONS_DEFAULT);
      annotation.x = trace.x[trace.x.length - 1];
      annotation.y = trace.y[trace.y.length - 1];
      (i < 4 || i == 7) ? annotation.text = trace.name: null;

      //de-focus some annotations
      //TODO: function for this
      (i < 4) ? annotation.opacity = 1.0: annotation.opacity = 0;
      annotation.font = Object.assign({}, ANNOTATIONS_DEFAULT.font);
      (i < 4) ? annotation.font.color = CHART_COLORWAY[i]: annotation.font.color = 'grey'; //magic number!!!
      (i < 4) ? annotation.showarrow = true: annotation.showarrow = false;
      (i < 4) ? annotation.arrowcolor = CHART_COLORWAY[i]: annotation.arrowcolor = 'grey'; //magic number!!!
      // console.log(annotation.font.color);
      chartAnnotations.push(annotation);
    })
    //add a one-off annotation
    let hoverAnnotation = Object.assign({}, ANNOTATIONS_DEFAULT);
    hoverAnnotation.x = 2010;
    hoverAnnotation.y = 40000;
    hoverAnnotation.opacity = 0.75;
    hoverAnnotation.text = 'Hover for more regions';
    hoverAnnotation.font.color = 'grey';
    chartAnnotations.push(hoverAnnotation);
    let annotation = Object.assign({}, ANNOTATIONS_DEFAULT);
    annotation.x = 2010;
    annotation.y = 35000;
    annotation.opacity = 0.75;
    annotation.text = 'Drag on plot to zoom';
    chartAnnotations.push(annotation);

    chartAnnotations[0].ax = 10; //DC
    chartAnnotations[1].ax = 10; //DLR
    chartAnnotations[2].ax = 10; //Fingal
    chartAnnotations[3].ax = 10; //SD
    chartAnnotations[7].ax = 10; //RoI

    chartAnnotations[0].ay = -12; //DC
    chartAnnotations[1].ay = -30; //DLR
    chartAnnotations[2].ay = -45; //Fingal
    chartAnnotations[3].ay = 0; //SD
    chartAnnotations[7].ay = 0; //RoI
    // chartAnnotations[5].ay = 0; // M

    //Set default view annotations
    chartLayout.annotations = chartAnnotations; //set default

    Plotly.newPlot(divIDFig3, chartTraces, chartLayout, {
      modeBarButtons: STACKED_AREA_CHART_MODE_BAR_BUTTONS_TO_INCLUDE,
      displayModeBar: true,
      displaylogo: false,
      showSendToCloud: false,
      responsive: true,
      toImageButtonOptions: {
        filename: 'Dublin Dashboard - ' + titleFig3,
        width: null,
        height: null,
        format: 'png'
      }
    });
  }) //end of then
  .catch(function(err) {
    console.log("Error loading file:\n " + err)
  });