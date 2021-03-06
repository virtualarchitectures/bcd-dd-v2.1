//Options for chart
const srcPathFig2a = "../data/Stories/Housing/part_3/processed/homeless_figures_parsed.csv";
const srcPathFig2b = "../data/Stories/Housing/part_3/processed/drhe_homelessness.csv";
let titleFig2 = "Families in Emergency Accommodation in Dublin (2014-2018)";
const divIDFig2 = "homelessness-chart";

Promise.all([
    d3.csv(srcPathFig2a),
    d3.csv(srcPathFig2b)
  ])
  .then((data) => {

    let tracesFig2 = [];
    tracesFig2.push(getTrace(data[0], "date", "Individual adults"));
    tracesFig2.push(getTrace(data[0], "date", "Dependents"));

    tracesFig2.push(getTrace(data[1], "date", "Hotels and B&Bs"));
    tracesFig2.push(getTrace(data[1], "date", "All Other Accommodation"));

    function getTrace(data, xVar, yVar) {
      let trace = Object.assign({}, TRACES_DEFAULT);
      trace.name = yVar;
      trace.stackgroup = 'one';
      trace.visible = true;
      trace.x = data.map((x) => {
        return x[xVar];
      });
      trace.y = data.map((y) => {
        return +y[yVar];
      });
      // trace.connectgaps = true;
      trace.mode = 'lines';
      return trace;
    }
    tracesFig2[2].visible = false;
    tracesFig2[3].visible = false;

    //Set layout options
    let layout = Object.assign({}, STACKED_AREA_CHART_LAYOUT);
    layout.title = Object.assign({}, MULTILINE_CHART_LAYOUT.title);
    layout.title.text = titleFig2;
    layout.height = 500;
    layout.showlegend = false;
    layout.xaxis = Object.assign({}, STACKED_AREA_CHART_LAYOUT.xaxis);
    layout.xaxis.nticks = 7;
    layout.xaxis.title = '';
    layout.xaxis.range = ['Jun-14', 'Nov-18'];
    layout.yaxis = Object.assign({}, STACKED_AREA_CHART_LAYOUT.yaxis);
    layout.yaxis.range = [1, 5000];
    // layout.yaxis.visible = false;
    layout.yaxis.title = '';
    layout.margin = Object.assign({}, STACKED_AREA_CHART_LAYOUT.margin);
    layout.margin = {
      l: 0,
      r: 0,
      t: 100 //button row
    };
    layout.colorway = CHART_COLORWAY_VARIABLES;

    let annotationsCount = [];
    let annotationsType = [];
    tracesFig2.forEach((trace, i) => {
      // console.log("trace: " + JSON.stringify(trace));
      let annotation = Object.assign({}, ANNOTATIONS_DEFAULT);
      annotation.x = trace.x[trace.x.length - 1];
      annotation.y = trace.y[trace.y.length - 1];
      annotation.text = trace.name.split('Rev')[0];
      annotation.font = Object.assign({}, ANNOTATIONS_DEFAULT.font);
      annotation.font.color = CHART_COLORWAY_VARIABLES[i % 2]; //Is this order smae as fetching from object in trace?
      annotation.text = trace.name;
      if (i < 2) {
        annotationsCount.push(annotation);
      } else {
        annotationsType.push(annotation);
      }
    })
    annotationsCount[1].y = annotationsCount[0].y + annotationsCount[1].y;
    annotationsType[1].y = annotationsType[0].y + annotationsType[1].y;

    layout.annotations = annotationsCount;


    //Set button menu
    let updateMenus = [];
    updateMenus[0] = Object.assign({}, UPDATEMENUS_BUTTONS_BASE);
    updateMenus[0] = Object.assign(updateMenus[0], {
      buttons: [{
          args: [{
              'visible': [true, true, false, false]
            },
            {
              'title': titleFig2,
              'annotations': annotationsCount,
              // 'margin.r': marginRUnauth,
              'yaxis.range': [1, 5000]
            }
          ],
          label: 'Individuals and Dependents',
          method: 'update',
          // execute: true
        },
        {
          args: [{
              'visible': [false, false, true, true]
            },
            {
              'title': titleFig2,
              'annotations': annotationsType,
              // 'margin.r': marginRAccom,
              'yaxis.range': [1, 1500],
              'yaxis.nticks': 3
            }
          ],
          label: 'Families By Accomodation Type',
          method: 'update',
          // execute: true
        },
      ],
    });

    layout.updatemenus = updateMenus;


    Plotly.newPlot(divIDFig2, tracesFig2, layout, {
      modeBar: {
        orientation: 'v',
        bgcolor: 'black',
        color: null,
        activecolor: null
      },
      modeBarButtons: MULTILINE_CHART_MODE_BAR_BUTTONS_TO_INCLUDE,
      displayModeBar: true,
      displaylogo: false,
      showSendToCloud: false,
      responsive: true,
      toImageButtonOptions: {
        filename: 'Dublin Dashboard - ' + titleFig2,
        width: null,
        height: null,
        format: 'png'
      }
    });
  }) //end of then
  .catch(function(err) {
    console.log("Error loading file:\n " + err)
  });