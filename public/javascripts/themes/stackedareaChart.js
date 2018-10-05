class StackedAreaChart {

    // constructor function
    constructor (_element, _titleX, _titleY, _dateVariable, _keys){

        // load in arguments from config object
        this.element = _element;
        this.titleX = _titleX;
        this.titleY = _titleY;
        this.date = _dateVariable;
        this.keys = _keys;
        
        // create the chart
        this.init();
    }

    // initialise method to draw chart area
    init(){
        let dv = this,
            elementNode = d3.select(dv.element).node(),
            elementWidth = elementNode.getBoundingClientRect().width,
            aspectRatio = elementWidth < 800 ? elementWidth * 0.65 : elementWidth * 0.5;

        const breakPoint = 678;
        
        // margin
        dv.margin = { 
            top: 50,
            bottom: 80
        };

        dv.margin.right = elementWidth < breakPoint ? 0 : 150;
        dv.margin.left = elementWidth < breakPoint ? 0 : 80;
        
        dv.width = elementWidth - dv.margin.left - dv.margin.right;
        dv.height = aspectRatio - dv.margin.top - dv.margin.bottom;

        // select parent element and append SVG + g
        const svg = d3.select(dv.element)
            .append("svg")
            .attr("width", dv.width + dv.margin.left + dv.margin.right)
            .attr("height", dv.height + dv.margin.top + dv.margin.bottom);

        dv.g = svg.append("g")
            .attr("transform", "translate(" + dv.margin.left + 
                ", " + dv.margin.top + ")");

        // transition 
        dv.t = () => { return d3.transition().duration(1000); };
        
        dv.colourScheme = ["#aae0fa","#00929e","#da1e4d","#ffc20e","#16c1f3","#086fb8","#003d68"];

        // set colour function
        dv.colour = d3.scaleOrdinal(dv.colourScheme.reverse());

        // for the tooltip from the d3 book
        dv.bisectDate = d3.bisector(d => { return (d[dv.date]); }).left;

        dv.addAxis();
    }

    addAxis(){
        let dv = this;

        dv.yAxisCall = d3.axisLeft();
        dv.xAxisCall = d3.axisBottom();

        dv.gridLines = dv.g.append("g")
            .attr("class", "grid-lines");

        dv.xAxis = dv.g.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + dv.height +")");

        dv.yAxis = dv.g.append("g")
            .attr("class", "y-axis");

        // X title
        dv.xLabel = dv.g.append("text")
            .attr("class", "titleX")
            .attr("x", dv.width/2)
            .attr("y", dv.height + 60)
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .text(dv.titleX);

        // Y title
        dv.yLabel = dv.g.append("text")
            .attr("class", "titleY")
            .attr("x", - (dv.height/2))
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text(dv.titleY);

        // call the legend method
        dv.addLegend();
    }

    // // pass the data and the nest value
    // getData(_data, _tX, _tY, yScaleFormat, _name, _value){
    //     let dv = this;
    //         // dv.yScaleFormat = dv.formatValue(yScaleFormat);

    //         _tX ? dv.titleX = _tX: dv.titleX = dv.titleX;
    //         _tY ? dv.titleY = _tY: dv.titleY = dv.titleY;
 
    //     // TODO filter data set before calling nestData function

    //     let dataProcessed = dv.nestData(_data, "label", _name, _value);
    //         dv.nestedData = dataProcessed;
            
    //         // call function to create/update scales
    //         dv.createScales();
    // }

    // pass the data and the nest value
    getData(_data, _tX, _tY, yScaleFormat){
        let dv = this;
            dv.yScaleFormat = dv.formatValue(yScaleFormat);

            _tX ? dv.titleX = _tX: dv.titleX = dv.titleX;
            _tY ? dv.titleY = _tY: dv.titleY = dv.titleY;
            
            _data !== null ? dv.nestedData =_data : dv.nestedData = dv.nestedData;

            dv.createScales();
    }

    createScales(){
        let dv = this;

        // set scales
        dv.x = d3.scaleTime().range([0, dv.width]);
        dv.y = d3.scaleLinear().range([dv.height, 0]);

        // get the the combined max value for the y scale
        let maxDateVal = d3.max(dv.nestedData, d => {
            var vals = d3.keys(d).map(key => { 
                return key !== dv.date ? d[key] : 0;
            });
            return d3.sum(vals);
        });

        // Update scales
        dv.x.domain(d3.extent(dv.nestedData, (d) => {  return (d[dv.date]); }));
        dv.y.domain([0, maxDateVal]);

        dv.drawGridLines();

        // Update axes
        dv.xAxisCall.scale(dv.x);
        dv.xAxis.transition(dv.t()).call(dv.xAxisCall);

        dv.yAxisCall.scale(dv.y);
        dv.yAxis.transition(dv.t()).call(dv.yAxisCall);

        // d3 area function
        dv.area = d3.area()
            .x(function(d) { return dv.x((d.data[dv.date]))})
            .y0(function(d) { return dv.y(d[0]); })
            .y1(function(d) { return dv.y(d[1]); });

         // d3 stack function
        dv.stack = d3.stack().keys(dv.keys);
        dv.data = (dv.stack(dv.nestedData));

        dv.update();
    }

    update(){
        let dv = this;
            d3.select(dv.element).select(".focus").remove();
            d3.select(dv.element).select(".focus_overlay").remove();

        // select all regions and join data with old
        const regions = dv.g.selectAll(".region")
            .data(dv.data);
        
        // Exit old elements not present in new data.
        // regions.exit()
        //     .transition(t)
        //     .attr("y", y(0))
        //     .attr("height", 0)
        //     .remove();

        // update the paths
        regions.select(".area")
            .transition(dv.t)
            .attr("d", dv.area);

        // Enter elements
        regions.enter().append("g")
            .attr("class", "region")
            .append("path")
                .attr("class", "area")
                // .transition(t)
                .attr("d", dv.area)
                .style("fill", function(d){
                    return dv.colour(d.key);
                })
                .style("fill-opacity", 0.75);
    }

    addLegend(){
        let dv = this;

        // create legend group
        var legend = dv.g.append("g")
            .attr("transform", "translate(0,0)");

        // create legend array, this needs to come from the data.
        dv.legendArray = [];
        
        dv.keys.forEach( (d) => {

            let obj = {};
                obj.label = d;
                obj.colour = dv.colour(d);
                dv.legendArray.push(obj);
        });
        dv.legendArray.reverse();

        // get data and enter onto the legend group
        let legends = legend.selectAll(".legend")
            .data(dv.legendArray)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => { return "translate(0," + i * 40 + ")"; })
            .attr("id", (d,i) => "legend-item" + i )
            .style("font", "12px sans-serif")
            .attr("cursor", "pointer")
            .on("click", (d,i) => { 

                let label = d3.select(dv.element).select("#legend-item" + i);
                    label.classed("active", label.classed("active") ? false : true);
 
                // get index of legend item
                let filterValues = dv.keys.findIndex(idx => idx.key === d.label);

                // // set its disabled field to true or false
                // dv.nestedData[filterValues].disabled = !dv.nestedData[filterValues].disabled; 

                // if (!dv.nestedData.filter(function(d) { return !d.disabled }).length) {
                //   dv.nestedData.forEach(function(d) {
                //     d.disabled = false;
                //   });
                //   d3.select(dv.element).selectAll(".legend").classed("active", false);
                // }

                // // dv.getData(dv.value,dv.data);
                // dv.update();
            });
        
        // add legend boxes    
        legends.append("rect")
            .attr("class", "legendRect")
            .attr("x", dv.width + 10)
            .attr("width", 25)
            .attr("height", 25)
            .attr("fill", d => { return d.colour; })
            .attr("fill-opacity", 0.75);

        legends.append("text")
            .attr("class", "legendText")
            // .attr("x", dv.width + 40)
            .attr("y", 12)
            .attr("dy", ".025em")
            .attr("text-anchor", "start")
            .text(d => { return d.label; })
            .call(dv.textWrap, 110, dv.width + 34); 
    }

    drawGridLines(){
        let dv = this;

        dv.gridLines.selectAll('line')
            .remove();

        dv.gridLines.selectAll('line.horizontal-line')
            .data(dv.y.ticks)
            .enter()
                .append('line')
                .attr('class', 'horizontal-line')
                .attr('x1', (0))
                .attr('x2', dv.width)
                .attr('y1', (d) => { return dv.y(d) })
                .attr('y2', (d) => dv.y(d));
    }

    addTooltip(title, format){

        let dv = this;
            // ttData = data;

            dv.ttTitle = title;
            dv.valueFormat = format;
            dv.ttWidth = 250,
            dv.ttHeight = 50,
            dv.ttBorderRadius = 3;
            dv.formatYear = d3.timeFormat("%Y");

            // formats thousands, Millions, Euros and Percentage

        // add group to contain all the focus elements
        let focus = dv.g.append("g")
                .attr("class", "focus")
                .style("display", "none")
                .style("visibility", "hidden");
            
            // Year label
            focus.append("text")
                .attr("class", "focus_quarter")
                .attr("x", 9)
                .attr("y", 7);
            
            // Focus line
            focus.append("line")
                .attr("class", "focus_line")
                .attr("y1", 0)
                .attr("y2", dv.height);
        
            focus.append("g")
                .attr("class", "focus-circles");

        let bcdTooltip = focus.append("g")
                .attr("class", "bcd-tooltip")
                .attr("width", dv.ttWidth)
                .attr("height", dv.ttHeight);
            
        let toolGroup =  bcdTooltip.append("g")
                .attr("class", "tooltip-group")
                .style("visibility", "hidden");

            dv.drawTooltip();
            
            // attach group append circle and text for each region

            dv.keys.forEach( (d,i) => {
                let tooltip = dv.g.select(".focus-circles")
                    .append("g")
                    .attr("class", "tooltip_" + i);
    
                tooltip.append("circle")
                    .attr("r", 0)
                    .transition(dv.t)
                    .attr("r", 5)
                    .attr("fill", dv.colour(d))
                    .attr("stroke", dv.colour(d));
                
                dv.updateTooltip(d,i);

            });
    
            // append a rectangle overlay to capture the mouse
            dv.g.append("rect")
                .attr("class", "focus_overlay")
                .attr("width", dv.width + 10) // give a little extra for last value
                .attr("height", dv.height)
                .style("fill", "none")
                .style("pointer-events", "all")
                .style("visibility", "hidden")
                .on("mouseover", () => { focus.style("display", null); })
                .on("mouseout", () => { focus.style("display", "none"); })
                .on("mousemove", mousemove);
            
            function mousemove(){
                focus.style("visibility","visible");
                toolGroup.style("visibility","visible");

                let mouse = d3.mouse(this),
                    x0 = dv.x.invert(mouse[0]),
                    i = dv.bisectDate(dv.nestedData, x0, 1), // use the bisect for linear scale.
                    d0 = dv.nestedData[i - 1],
                    d1 = dv.nestedData[i],
                    d;  

                d1 !== undefined ? d = x0 - d0[dv.date] > d1[dv.date] - x0 ? d1 : d0 : false;

                dv.updatePosition(mouse[0], 10);

                dv.keys.forEach( (reg,idx) => {

                    // console.log(reg, idx);
                    let dvalue = dv.data[idx]; 

                    let dd0 = dvalue[i - 1],
                        dd1 = dvalue[i],
                        dd;  
                        dd1 !== undefined ? dd = x0 - dd0.data[dv.date] > dd1.data[dv.date] - x0 ? dd1 : dd0 : false;

                    let id = ".tooltip_" + idx,
                        tpId = ".tooltipbody_" + idx,
                        ttTitle = dv.g.select(".tooltip-title");
                        
                    let tooltip = d3.select(dv.element).select(id);
                    let tooltipBody = d3.select(dv.element).select(tpId); 
                        tooltipBody.attr("transform", "translate(5," + idx * 25 +")");
                    
                    if(d !== undefined){
                        tooltip.attr("transform", "translate(" + dv.x(d[dv.date]) + "," + dv.y(dd[1]) + ")");
                        // tooltipBody.attr("transform", "translate(" + dv.x(d.date) + "," + dv.y(d[dv.value]) + ")");
                        // tooltipBody.select(".tp-text-left").text(dv.keys[idx]);
                        tooltipBody.select(".tp-text-right").text(d[reg]);
                        ttTitle.text(dv.ttTitle + " " + (d.label)); //label needs to be passed to this function 
                        focus.select(".focus_line").attr("transform", "translate(" + dv.x((d[dv.date])) + ", 0)");
                    }

                });
            }
    }

    drawTooltip(){
        let dv = this;

        let tooltipTextContainer = dv.g.select(".tooltip-group")
          .append("g")
            .attr("class","tooltip-text");

        let tooltip = tooltipTextContainer
            .append("rect")
            .attr("class", "tooltip-container")
            .attr("width", dv.ttWidth)
            .attr("height", dv.ttHeight)
            .attr("rx", dv.ttBorderRadius)
            .attr("ry", dv.ttBorderRadius)
            .attr("fill","#f8f8f8")
            .attr("stroke", "#6c757d")
            .attr("stroke-width", "1");

        let tooltipTitle = tooltipTextContainer
          .append("text")
            .text("test tooltip")
            .attr("class", "tooltip-title")
            .attr("x", 5)
            .attr("y", 16)
            .attr("dy", ".35em")
            .style("fill", "#1d2124");

        let tooltipDivider = tooltipTextContainer
            .append("line")
                .attr("class", "tooltip-divider")
                .attr("x1", 5)
                .attr("x2", 240)
                .attr("y1", 31)
                .attr("y2", 31)
                .style("stroke", "#6c757d");

        let tooltipBody = tooltipTextContainer
                .append("g")
                .attr("class","tooltip-body")
                // .style("transform", "translateY(8px)")
                .attr("transform", "translate(5,50)");
    }

    updateTooltip(d,i){
        let dv = this;

        let tooltipBodyItem = dv.g.select(".tooltip-body")
            .append("g")
            .attr("class", "tooltipbody_" + i);

        tooltipBodyItem.append("text")
            .text(d)
            .attr("class", "tp-text-left")
            .attr("x", "12")
            .attr("dy", ".35em");

        tooltipBodyItem.append("text")
            .attr("class", "tp-text-right")
            .attr("x", "10")
            .attr("dy", ".35em")
            .attr("dx", dv.ttWidth - 40)
            .attr("text-anchor","end");

        tooltipBodyItem.append("circle")
            .attr("class", "tp-circle")
            .attr("r", "6")
            .attr("fill", dv.colour(d));
        
        dv.updateSize();
    }

    updatePosition(xPosition, yPosition){
        let dv = this;
        // get the x and y values - y is static
        let [tooltipX, tooltipY] = dv.getTooltipPosition([xPosition, yPosition]);
        // move the tooltip
        dv.g.select(".bcd-tooltip").attr("transform", "translate(" + tooltipX + ", " + tooltipY +")");
    }

    updateSize(){
        let dv = this;
        let height = dv.g.select(".tooltip-body").node().getBBox().height;
        dv.ttHeight += height + 5;
        dv.g.select(".tooltip-container").attr("height", dv.ttHeight);
    }

    resetSize() {
        let dv = this;
        dv.ttHeight = 50;
    }

    getTooltipPosition([mouseX, mouseY]) {
        let dv = this;
        let ttX,
            ttY = mouseY;

        // show right
        if (mouseX < dv.width / 2) {
            ttX = mouseX;
        } else {
            // show left
            ttX = mouseX -255
        }
        return [ttX, ttY];
    }

    textWrap(text, width, xpos = 0, limit=2) {
        text.each(function() {
            let words,
                word,
                line,
                lineNumber,
                lineHeight,
                y,
                dy,
                tspan;

            text = d3.select(this);
    
            words = text.text().split(/\s+/).reverse();
            line = [];
            lineNumber = 0;
            lineHeight = 1;
            y = text.attr("y");
            dy = parseFloat(text.attr("dy"));
            tspan = text
                .text(null)
                .append("tspan")
                .attr("x", xpos)
                .attr("y", y)
                .attr("dy", dy + "em");
    
            while ((word = words.pop())) {
                line.push(word);
                tspan.text(line.join(" "));

                if (tspan.node() && tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));

                    if (lineNumber < limit - 1) {
                        line = [word];
                        tspan = text.append("tspan")
                            .attr("x", xpos)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
                        // if we need two lines for the text, move them both up to center them
                        text.classed("move-up", true);
                    } else {
                        line.push("...");
                        tspan.text(line.join(" "));
                        break;
                    }
                }
            }
        });
    }

    formatValue(format){
        // formats thousands, Millions, Euros and Percentage
        switch (format){
            case "millions":
                return d3.format(".2s");
                break;
        
            case "euros":
                return "undefined";
                break;
        
            case "thousands":
                return d3.format(",");
                break;
        
            case "percentage":
                return d3.format(".2%");
                break;
        
            default:
                return "undefined";
        }
    }

    formatQuarter(date, i){
        let newDate = new Date();
        newDate.setMonth(date.getMonth() + 1);
        let year = (date.getFullYear());
        let q = Math.ceil(( newDate.getMonth()) / 3 );
        return year+" Q" + q;
    }

    // nestData(data, date, name, value){
    //     let nested_data = d3.nest()
    //         .key(function(d) { return d[date]; })
    //         .entries(data); // its the string not the date obj

    //         console.log("data before split into objects HAHAHA",nested_data);

    //     let mqpdata = nested_data.map(function(d){
    //         let obj = {
    //             label: d.key
    //         }
    //             d.values.forEach(function(v){
    //             obj[v[name]] = v[value];
    //             obj.date = v.date;
    //         })
    //     return obj;
    //   })
    //   console.log("this is the data sent", mqpdata);
    //   return mqpdata;
    // }
}



