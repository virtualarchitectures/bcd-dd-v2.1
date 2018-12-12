class MultiLineChart{

    constructor (obj){

        this.d = obj.d;
        this.e = obj.e;
        this.k = obj.k;
        this.ks = obj.ks;
        this.xV = obj.xV;
        this.yV = obj.yV;
        this.cS = obj.c;
        this.tX = obj.tX;
        this.tY = obj.tY;
        this.ySF = obj.ySF || "thousands";

        this.drawChart();
    }

    drawChart(){
        let c = this;

        c.init();
        c.addAxis();
        c.getKeys();
        c.processData();
        c.drawTooltip();
        c.createScales();
        c.drawGridLines();
        c.drawLines();
        c.drawLegend();            
    }

    // initialise method to draw c area
    init(){
        let c = this,
            eN,
            eW,
            aR,
            cScheme,
            m = c.m = {},
            w,
            h,
            bP;

            eN = d3.select(c.e).node(),
            eW = eN.getBoundingClientRect().width,
            aR = eW < 800 ? eW * 0.55 : eW * 0.5,
            cScheme = c.cS || d3.schemeBlues[5].slice(1),
            bP = 576;
        
            // margins
            m.t = eW < bP ? 40 : 50;
            m.b = eW < bP ? 30 : 80;
            m.r = eW < bP ? 15 : 140;
            m.l = eW < bP ? 9 : 60;

            // dimensions
            w =  eW - m.l - m.r;
            h = aR - m.t - m.b;

            c.w = w;
            c.h = h;
            c.eN = eN;
            c.sscreens = eW < bP ? true : false;

            // to remove existing svg on resize
            d3.select(c.e).select("svg").remove(); 
            
            // add the svg to the target element
            c.svg = d3.select(c.e)
                .append("svg")
                .attr("width", w + m.l + m.r)
                .attr("height", h + m.t + m.b);
       
            // add the g to the svg and transform by top and left margin
            c.g = c.svg.append("g")
                .attr("transform", "translate(" + m.l + 
                    ", " + m.t + ")")
                .attr("class","chart-group");
        
            // set chart transition method
            c.t = () => { return d3.transition().duration(1000); };
            c.ease = d3.easeQuadInOut;

            // set chart colour method
            c.colour = d3.scaleOrdinal(cScheme);
            // set chart bisecector method
            c.bisectDate = d3.bisector( (d) => { return d[c.xV]; } ).left;
    }

    updateChart(obj){
        let c = this;

        if(obj){
            c.d = obj.d || c.d;
            c.k = obj.k || c.k;
            c.ks = obj.ks || c.ks;
            c.tX = obj.tX || c.tX;
            c.tY = obj.tY || c.tY;
            c.xV = obj.xV || c.xV;
            c.yV = obj.yV || c.yV;
            c.cS = obj.c || c.cS;
            c.ySF = obj.ySF || c.ySF;
        }

        c.createScales();
        c.drawLines();
        c.drawLegend();
    }

    addAxis(){       
        let c = this,
            g = c.g,
            gLines,
            xLabel,
            yLabel;

            gLines = g.append("g")
                .attr("class", "grid-lines");

            c.xAxis = g.append("g")
                .attr("class", "x-axis")
                .attr("transform", "translate(0," + c.h +")");
            
            c.yAxis = g.append("g")
                .attr("class", "y-axis");

            // X title
            xLabel = g.append("text")
                .attr("class", "titleX")
                .attr("x", c.w/2)
                .attr("y", c.h + 60)
                .attr("text-anchor", "middle")
                .text(c.tX);

            // Y title
            yLabel = g.append("text")
                .attr("class", "titleY")
                .attr("x", - (c.h/2))
                .attr("y", -45)
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .text(c.tY);
    }

    getKeys(){
        let c = this,
            findKeys = (d) => d.filter((e, p, a) => a.indexOf(e) === p);
            c.colour.domain(c.d.map(d => { return d.key; }));

            c.ks = c.ks !== undefined ? c.ks : c.d[0].key ? c.colour.domain() : findKeys(c.d.map(d => d[c.k]));
    }

    // check if the data needs to be nested or not!!
    processData(){
        let c = this;
        c.d = c.d[0].key ? c.d : c.nest(c.d,c.k); 
    }

    // this could be parent method
    nest(data,key){
        return d3.nest().key(d => { 
            return d[key];
        })
        .entries(data);
    }

    // needs to be called everytime the data changes
    createScales(){
        let c = this,
            yAxisCall,
            xAxisCall,
            x,
            y;

        yAxisCall = d3.axisLeft();
        xAxisCall = d3.axisBottom();
        x = c.getElement(".titleX").text(c.tX);
        y = c.getElement(".titleY").text(c.tY)

        // set scales
        c.x = d3.scaleTime().range([0, c.w]);
        c.y = d3.scaleLinear().range([c.h, 0]);

        // Update scales
        c.x.domain(d3.extent(c.d[0].values, d => {
            return (d[c.xV]); }));
        
        // for the y domain to track negative numbers 
        const minValue = d3.min(c.d, d => {
            return d3.min(d.values, d => { return d[c.yV]; });
        });

        // Set Y axis scales 0 if positive number else use minValue
        c.y.domain([ minValue >=0 ? 0 : minValue,
            d3.max(c.d, d => { 
            return d3.max(d.values, d => { return d[c.yV]; });
            })
        ]);

        // Update X axis
        c.tickNumber ? xAxisCall.scale(c.x).ticks(c.tickNumber) : xAxisCall.scale(c.x);
        c.xAxis.transition(c.t()).call(xAxisCall);
        
        // Update Y axis
        c.ySF ? yAxisCall.scale(c.y).tickFormat(c.formatValue(c.ySF) ) : yAxisCall.scale(c.y);
        c.yAxis.transition(c.t()).call(yAxisCall);
    }

    drawLines(){
        let c = this,
            g = c.g; 

        // d3 line function
       c.line = d3.line()
           .defined(function(d){return !isNaN(d[c.yV]);})
           .x( d => {
               return c.x(d[c.xV]); 
           })
           .y( d => { //this works
               return c.y(d[c.yV]); 
           });
            // .curve(d3.curveCatmullRom);

       // select all regions and join data
       c.regions = g.selectAll(".regions")
           .data(c.d);
       
       // update the paths
       c.regions.select(".line")
           .transition(c.t)
           // .attr("d", d => {return c.line(d.values); });
           .attr("d", d => { 
               return d.disabled ? null : c.line(d.values); });
       
       // Enter elements
       c.regions.enter().append("g")
           .attr("class", "regions")
           .append("path")
           .style("stroke", d => {return c.colour(d.key); })
           .attr("class", "line")
           .attr("id", d => d.key)
           // .attr("d", d => {return c.line(d.values); })
           .attr("d", d => { 
               return d.disabled ? null : c.line(d.values); })
           // .style("stroke", d => ( c.d.map(function(v,i) {
           //     return c.colour || c.color[i % 10];
           //   }).filter(function(d,i) { return !c.d[i].disabled })))
           .style("stroke-width", "3px")
           .style("fill", "none");  
       
       // c.regions.transition(c.t)
       //     .attr("d", function (d) { return c.line(d.values); });
           
       c.regions.exit()
           .transition(c.t).remove();
    
    }

    drawTooltip(){
        let c = this;

            d3.select(c.e).select(".tool-tip.bcd").remove();

            c.newToolTip = d3.select(c.e)
                .append("div")
                    .attr("class","tool-tip bcd");
                    
            // check screen size
            c.sscreens ? 
            c.newToolTip.style("visibility","visible") : 
            c.newToolTip.style("visibility","hidden");

            c.newToolTipTitle = c.newToolTip
                .append("div")
                    .attr("id", "bcd-tt-title");

            c.tooltipHeaders();
            c.tooltipBody();
    }

    tooltipHeaders(){
        let c = this,
            div,
            p;
            
        div = c.newToolTip
            .append("div")
                .attr("class", "headers");

        div.append("span")
            .attr("class", "bcd-dot");

        p = div
            .append("p")
                .attr("class","bcd-text");

        p.append("span")
            .attr("class","bcd-text-title")
            .text("Type");

        p.append("span")
            .attr("class","bcd-text-value")
            .text("Value");

        p.append("span")
            .attr("class","bcd-text-rate")
            .text("% Rate");

        p.append("span")
            .attr("class","bcd-text-indicator");
    }

    tooltipBody(){
        let c = this,
            keys = c.ks,
            div,
            p;

        keys.forEach( (d, i) => {
            div = c.newToolTip
                    .append("div")
                    .attr("id", "bcd-tt" + i);
                
            div.append("span").attr("class", "bcd-dot");

            p = div.append("p").attr("class","bcd-text");

            p.append("span").attr("class","bcd-text-title");
            p.append("span").attr("class","bcd-text-value");
            p.append("span").attr("class","bcd-text-rate");
            p.append("span").attr("class","bcd-text-indicator");
        });
    }

    addTooltip(title, format, dateField, prefix, postfix){
        let c = this;

            d3.select(c.e).select(".focus").remove();
            d3.select(c.e).select(".focus_overlay").remove();

            c.ttTitle = title;
            c.valueFormat = c.formatValue(format);
            c.dateField = dateField;
            c.ttWidth = 305;
            c.prefix = prefix ? prefix : " ";
            c.postfix = postfix ? postfix: " ";

            c.drawFocusLine();
            c.drawFocusOverlay();
    }

    drawFocusLine(){
        let c = this,
            g = c.g; 
            
            c.focus = g.append("g")
                .attr("class", "focus");
            
            c.focus.append("line")
                .attr("class", "focus_line")
                .attr("y1", 0)
                .attr("y2", c.h);
        
            c.focus.append("g")
                .attr("class", "focus_circles");
            
            c.ks.forEach( (d,i) => {
                c.drawFocusCircles(d,i);
            });
    }

    drawFocusCircles(d,i){
        let c = this,
            g = c.g; 

        let tooltip = g.select(".focus_circles")
            .append("g")
            .attr("class", "tooltip_" + i);

            tooltip.append("circle")
                .attr("r", 0)
                .transition(c.t)
                .attr("r", 5)
                .attr("fill", c.colour(d))
                .attr("stroke", c.colour(d));
    }

    drawFocusOverlay(){
        let c = this,
            g = c.g,
            focus = d3.select(c.e).select(".focus"),
            overlay = g.append("rect");
            
            overlay.attr("class", "focus_overlay")
                .attr("width", c.w)
                .attr("height", c.h)
                .style("fill", "none")
                .style("pointer-events", "all")
                .style("visibility", "hidden");

                if (c.sscreens){
                    mousemove();
                    overlay
                    .on("touchmove", mousemove, {passive:true})
                    .on("mousemove", mousemove, {passive:true});
                }
                else {
                    overlay
                    .on("mouseover", (d) => { 
                        focus.style("display", null);
                    }, {passive:true})
                    .on("mouseout", () => { 
                        focus.style("display", "none"); 
                        c.newToolTip.style("visibility","hidden");
                    })
                    .on("mousemove", mousemove, {passive:true});
                }
            
            function mousemove(){
                focus.style("visibility","visible");
                c.newToolTip.style("visibility","visible");

                let mouse = this ? d3.mouse(this) : c.w, // this check is for small screens < bP
                    x0 = c.x.invert(mouse[0] || mouse), // use this value if it exist else use the c.w
                    i = c.bisectDate(c.d[0].values, x0, 1),
                    tooldata = c.sortData(i, x0);
                    c.ttContent(tooldata);// add values to tooltip
            }
    }

    // mousemove(d){
    //     let c = this,
    //         focus = d3.select(c.e).select(".focus"),
    //         mouse = d3.mouse(d.node()) || c.w,

    //         // mouse = this ? d3.mouse(this) : c.w, // this check is for small screens < bP
    //         x0 = c.x.invert(mouse[0] || mouse), // use this value if it exist else use the c.w
    //         i = c.bisectDate(c.d[0].values, x0, 1),
    //         tooldata = c.sortData(i, x0);
            
    //         c.ttContent(tooldata);// add values to tooltip

    //         focus.style("visibility","visible");
    //         c.newToolTip.style("visibility","visible");
    // }

    getPerChange(d1, d0, v){
        let value;
            value = !isNaN(d1[v]) ? d0 ? (d1[v] -  d0[v])/d0[v]: "null" : null;
                if( value === Infinity){
                    return 0;   
                }
                else if(isNaN(value)){
                    return 0;
                }
        return value;
    }

    updatePosition(xPosition, yPosition){
        let c = this,
            g = c.g; 
        // get the x and y values - y is static
        let [tooltipX, tooltipY] = c.getTooltipPosition([xPosition, yPosition]);
            // move the tooltip
            g.select(".bcd-tooltip").attr("transform", "translate(" + tooltipX + ", " + tooltipY +")");
            c.newToolTip.style("left", tooltipX + "px").style("top", tooltipY + "px");
    }

    getTooltipPosition([mouseX, mouseY]) {
        let c = this;
        let ttX,
            ttY = mouseY,
            cSize = c.w - c.ttWidth;

        // show right - 60 is the margin large screens
        if (mouseX < cSize) {
            ttX = mouseX + 60 + 30;
        } else {
            // show left - 60 is the margin large screens
            ttX = (mouseX + 60) - c.ttWidth;
        }
        return [ttX, ttY];
    }

    getElement(name){
        let c = this,
            s = d3.select(c.e),
            e = s.selectAll(name);
        return e;
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
                            .attr("x", xpos*2)
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

    drawGridLines(){
        let c = this,
            gLines;
            
        gLines = c.getElement(".grid-lines");

        gLines.selectAll("line")
            .remove();

        gLines.selectAll("line.horizontal-line")
            .data(c.y.ticks)
            .enter()
            .append("line")
                .attr("class", "horizontal-line")
                .attr("x1", (0))
                .attr("x2", c.w)
                .attr("y1", (d) => c.y(d))
                .attr("y2", (d) => c.y(d));
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
        
            case "percentage2":
                return d3.format(".2%");
                break;

            case "percentage":
                return d3.format(".0%");
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

    hideRate(value){
        let c = this,
            i = c.getElement(".bcd-text-indicator"),
            r = c.getElement(".bcd-text-rate");     

            if(value){
                i.style("display", "none");
                r.style("display", "none");
            }
            else{
                i.style("display", "block");
                r.style("display", "block");
            }
            // value ? g.selectAll(".tp-text-indicator").style("display", "none") : g.selectAll(".tp-text-indicator").style("display", "block")
    }

    addBaseLine(value){
        let c = this,
            gLines = c.getElement(".grid-lines");;
        
            gLines.append("line")
                .attr("x1", 0)
                .attr("x2", c.w)
                .attr("y1", c.y(value))
                .attr("y2", c.y(value))
                .attr("stroke", "#dc3545");

    }

    pagination(data, selector, sliceBy, pageNumber, label){

        const c = this;
        
        const slices = c.slicer( data, sliceBy ), 
              times =  pageNumber,
              startSet = slices(times - 1);
              
            //  let newStart = [];
            //  startSet.length < sliceBy ? newStart = data.slice(50 - sliceBy) : newStart = startSet;
    
            d3.selectAll(selector + " .pagination-holder").remove();
    
        let moreButtons = d3.select(selector)
            .append("div")
            .attr("class", "pagination-holder text-center pb-2");
    
            c.d = startSet;
            c.drawChart();
            c.addTooltip();
    
        for(let i=0; i<times; i++){
            // let wg = slices(i)
                // wg.length < sliceBy ? wg = data.slice(50 - sliceBy) : wg;
            
            let wg = slices(i),
                sliceNumber = sliceBy - 1,
                secondText;
    
                if (typeof wg[sliceNumber] != 'undefined'){
                    secondText = wg[sliceNumber]
                }
                else{
                    let lastEl = wg.length - 1;
                        secondText = wg[lastEl];
                }
    
            let textString = label === "year" ? wg[sliceNumber][label] : wg[0][label] + " - " + secondText[label];
    
            moreButtons.append("button")
                .attr("type", "button")
                .attr("class", i === times -1 ? "btn btn-page mx-1 active" : "btn btn-page")
                .style("border-right", i === times -1 ? "none" : "1px Solid #838586")
            // .text(label + " " + (1+(i*sliceBy)) +" - "+ ((i+1)*sliceBy)) // pass this to the function
                .text(textString)
                .on("click", function(){
                if(!$(this).hasClass("active")){
                        $(this).siblings().removeClass("active");
                        $(this).addClass("active");
                        c.d = wg;
                        c.drawChart();
                        c.addTooltip();
                    }
                });
            }
    
    
        }

    slicer( arr, sliceBy ){
        if ( sliceBy < 1 || !arr ) return () => [];
        
        return (p) => {
            const base = p * sliceBy,
                    size = arr.length;
    
            let slicedArray = p < 0 || base >= arr.length ? [] : arr.slice( base,  base + sliceBy );
                
                if (slicedArray.length < (sliceBy/2)) return slicedArray = arr.slice(size - sliceBy);
                
                return slicedArray;
        };
    }

    sortData(i, x0) {
        let c =this,
            tD = c.d.map(d => {
                let s,
                    sPrev,
                    s0 = d.values[i - 1],
                    s1 = d.values[i],
                    v = c.yV;

                    s1 !== undefined ? s = x0 - s0[c.xV] > s1[c.xV] - x0 ? s1 : s0 : s = s0;
                    s1 !== undefined ? sPrev = x0 - s0[c.xV] > s1[c.xV] - x0 ? d.values[i-1] : d.values[i-2] : false;
                    // c.newToolTipTitle.text(c.ttTitle + " " + (s[c[c.xV]Field]));

                let obj = {};
                    obj.key = d.key;
                    obj.label = s.label;
                    obj.value = s[v];
                    obj.change = c.getPerChange(s, sPrev, v);
                    obj[c.xV] = s[c.xV];
                return obj;
        });
        c.moveTooltip(tD);
        tD.sort((a, b) => b.value - a.value);

        return tD;
    }

    ttContent(data){
        let c = this;
            data.forEach(( d, i) => {
                let id = "#bcd-tt" + i,
                    div = c.newToolTip.select(id),
                    unText = "N/A",
                    indicatorColour,
                    indicator = d.change > 0 ? " ▲" : d.change < 0 ? " ▼" : "",
                    rate = !d.change ? unText :d3.format(".1%")(!isNaN(d.change) ? d.change : null),
                    value =  isNaN(d.value) ? "" :  c.valueFormat !=="undefined"? c.prefix + c.valueFormat(d.value) : d.value,
                    p = div.select(".bcd-text");
                    if(c.arrowChange === true){
                        indicatorColour = d.change < 0 ? "#20c997" : d.change > 0 ? "#da1e4d" : "#f8f8f8";
                    }
                    else{
                        indicatorColour = d.change > 0 ? "#20c997" : d.change < 0 ? "#da1e4d" : "#f8f8f8";
                    }
                    div.style("opacity", 1);
                    div.select(".bcd-dot").style("background-color", c.colour(d.key));
                    p.select(".bcd-text-title").text(d.key);
                    p.select(".bcd-text-value").text(value);
                    p.select(".bcd-text-rate").text(rate);
                    p.select(".bcd-text-indicator").text(" " + indicator).style("color", indicatorColour);
            });
    }

    moveTooltip(d){
        let c = this;
            d.forEach( (d,i)=> {
                let id = ".tooltip_" + i, 
                    tooltip = d3.select(c.e).select(id),
                    v = "value";
                    
                if(d !== undefined){
                    c.updatePosition(c.x(d[c.xV]), 80);
                    c.newToolTipTitle.text(c.ttTitle + " " + (d[c.dateField]));
                    tooltip.attr("transform", "translate(" + c.x(d[c.xV]) + "," + c.y(!isNaN(d[v]) ? d[v]: 0) + ")");
                    c.focus.select(".focus_line").attr("transform", "translate(" + c.x(d[c.xV]) + ", 0)");
                }
            })
        }

    //replacing old legend method with new inline labels
    drawLegend() {
        // chart (c) object, vlaue (v), colour (z), line height(lH)
        let c = this,
            g = c.g,
            v = c.yV,
            z = c.colour,
            lH = 12;
        
        // data values for last readable value
        const lines = c.d.map(d => {
            let obj = {},
                vs = d.values.filter(idFilter),
                s = vs.length -1;
                // sF = d.values.length -1;
                obj.key = d.key;
                obj.last = vs[s] ? vs[s][v] : null;
                obj.x = vs[s] ? c.x(vs[s][c.xV]) : null;
                // obj.y = sF === s ? c.y(vs[s][v]) : c.y(vs[s][v]) - 15;
                obj.y = vs[s] ? c.y(vs[s][v]) : null;
            return obj;
        });

        const circles = c.d.map(d => {
            let obj = {},
                vs = d.values.filter(idFilter),
                s = vs.length -1;
                obj.key = d.key;
                obj.last = vs[s] ? vs[s][v]: null;
                obj.x = vs[s] ? c.x(vs[s][c.xV]): null;
                obj.y = vs[s] ? c.y(vs[s][v]): null;
            return obj;
        });

        // Define a custom force to stop labels going outside the svg
        const forceClamp = (min, max) => {
                let nodes;
                const force = () => {
                nodes.forEach(n => {
                    if (n.y > max) n.y = max;
                    if (n.y < min) n.y = min;
                });
                };
                force.initialize = (_) => nodes = _;
                return force;
        }

        // Set up the force simulation
        const force = d3.forceSimulation()
            .nodes(lines)
            .force("collide", d3.forceCollide(lH/2))
            // .force("y", d3.forceY(d => d.y).strength(4))  
            .force("x", d3.forceX(d => d.x).strength(2))   
            .force("clamp", forceClamp(0, c.h))
            .stop();

            // Execute the simulation
            for (let i = 0; i < 300; i++) force.tick();

        // Add labels
        const legendNames = g.selectAll(".label-legend").data(lines, d => d.y);
              legendNames.exit().remove();

        const legendCircles = g.selectAll(".legend-circles").data(circles, d => d.y);
              legendCircles.exit().remove();

        const legendGroup = legendNames.enter().append("g")
                .attr("class", "label-legend")
                .attr("transform", d => "translate(" + d.x + ", " + d.y + ")");

        const legendGC = legendCircles.enter().append("g")
                .attr("class", "legend-circles")
                .attr("transform", d => "translate(" + d.x + ", " + d.y + ")");
            
            legendGroup.append("text")
                .attr("class", "legendText")
                .attr("id", d => d.key)
                .attr("dy", ".01em")
                .text(d => d.key)
                // .call(c.textWrap, 110, 6)
                .attr("fill", d => z(d.key))
                .attr("alignment-baseline", "middle")
                .attr("dx", ".5em")
                .attr("x", 2);
        
            // legendGroup.append("line")
            //     .attr("class", "legend-line")
            //     .attr("x1", 0)
            //     .attr("x2", 6)
            //     .attr("stroke", "#fff");
            
            legendGC.append("circle")
                .attr("class", "l-circle")
                .attr("r", "6")
                .attr("fill", d => z(d.key));

        // check if number
        function isNum(d) {
            return !isNaN(d);
          }

        //filter out the NaN
        function idFilter(d) {
           return isNum(d[v]) && d[v] !== 0 ? true : false; 
        }
    }
    
    showSelectedLabels(array){
        let c = this, 
            e = c.xAxis;
            c.axisArray = array || c.axisArray;

            e.selectAll(".x-axis .tick")
            .style("display", "none");

        c.axisArray.forEach( n => {
            d3.select(  e._groups[0][0].childNodes[n])
            .style("display", "block");
        })

    }

}
