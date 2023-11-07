// Wait for the DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
    // Initialize your application
    init();
});

function init() {
    fetchData();
}


function fetchData() {
    d3.csv("../data/output.csv")
        .then(function (data) {
            console.log('Data loaded successfully.');

            // get the unique App values
            const uniqueApps = [...new Set(data.map(d => d.Appendix))]
            uniqueApps.unshift("All");
            // console.log('Unique App:', uniqueApps);

            // get the unique Year values
            const uniqueYear = [...new Set(data.map(d => d.Year))]
            uniqueYear.unshift("All");
            // console.log('Unique Year:', uniqueYear);

            // get the unique Class values
            const uniqueClass = [...new Set(data.map(d => d.Class))]
            uniqueClass.unshift("All");
            // console.log('Unique Class:', uniqueClass);

            // create dynamic app filter options
            var appDropDown = d3.select('#appFilter');
            var yearDropDown = d3.select('#yearFilter');
            var classDropDown = d3.select('#classFilter');


            appDropDown.selectAll("option")
                .data(uniqueApps)
                .enter()
                .append('option')
                .text(d => d)
                .attr('value', d => d);

            yearDropDown.selectAll("option")
                .data(uniqueYear)
                .enter()
                .append('option')
                .text(d => d)
                .attr('value', d => d);

            classDropDown.selectAll("option")
                .data(uniqueClass)
                .enter()
                .append('option')
                .text(d => d)
                .attr('value', d => d);

            // add event listeners for the filter
            appDropDown.on('change', filterData);
            yearDropDown.on('change', filterData);
            classDropDown.on('change', filterData);

            // filter data
            filterData();

            // function to filter data
            function filterData() {
                const selectedAppValue = appDropDown.node().value;
                const selectedYearValue = yearDropDown.node().value;
                const selectedClassValue = classDropDown.node().value;


                // Filter the data based on selected filter values
                const filteredData = data.filter(d => {
                    const appCondition = selectedAppValue === 'All' || d.Appendix === selectedAppValue;
                    const yearCondition = selectedYearValue === 'All' || d.Year === selectedYearValue;
                    const classCondition = selectedClassValue === 'All' || d.Class === selectedClassValue;
                    return appCondition && yearCondition && classCondition;

                });

                // console.log('show filtered data', filteredData)

                // Call a function to display the data in a table
                createNumChart(filteredData);
                createCharts(filteredData);
                // createImportersTimeSeries(filteredData, selectedYearValue);
                createTimeSeries(filteredData, selectedYearValue);
                createTermChart(filteredData);
                createChart1Sum(filteredData);
                createChart2Sum(filteredData);
                createTreeMap(filteredData);
                createTreeMap2(filteredData);

            }

        })
        .catch(function (error) {
            console.error('Error fetching or processing data:', error);
        });

}


function createNumChart(data) {
    // Calculate the total number of records
    var totalRecords = data.length;
    // console.log(totalRecords)

    // count the total number of unique exporters
    var uniqueExporters = new Set(data.map(d => d.Exporter)).size;
    // console.log('uniqueExporters', uniqueExporters)

    // count the total number of unique importers
    var uniqueImporters = new Set(data.map(d => d.Importer)).size;
    // console.log('uniqueImporters', uniqueImporters)

    // calculate the balance
    var balance = uniqueExporters - uniqueImporters;
    // console.log(balance)

    // display in  HTML elements
    document.querySelector('.totalRecords .value').textContent = totalRecords;
    document.querySelector('.numExporters .value').textContent = uniqueExporters;
    document.querySelector('.numImporters .value').textContent = uniqueImporters;
    // document.querySelector('.balance .value').textContent = balance;
};

function createCharts(data1) {
    // Remove the existing chart elements
    d3.select('#chart').selectAll('*').remove();

    var chart_data = [];

    // count the number of purpose
    // var purposeCounts = d3.rollup(Array.from(data1), v => v.length, d => d.Purpose);
    var purposeCounts = d3.rollup(Array.from(data1), v => v.length, d => d.Purpose_original, d => d.Purpose);

    // Convert purposeCounts to an array of objects
    // var purposeCountArray = Array.from(purposeCounts, ([Purpose, count]) => ({ Purpose, count }));
    var purposeCountArray = Array.from(purposeCounts, ([Purpose_original, [PurposeCount]]) => ({ Purpose_original, PurposeCount }));


    // Sort purposeCountArray from largest to smallest
    purposeCountArray.sort((a, b) => b.PurposeCount[1] - a.PurposeCount[1]);

    // console.log(purposeCountArray)
    // configure the SVG dimensions and margins
    var margin = { top: 25, right: 40, bottom: 40, left: 40 };
    var width = 420 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    // Create the main SVG container
    var svg = d3.select('#chart').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up the scales
    var xScale = d3.scaleLinear()
        .domain([0, d3.max(purposeCountArray, d => d.PurposeCount[1])])
        .nice()
        .range([0, width]);

    var yScale = d3.scaleBand()
        .domain(purposeCountArray.map(d => d.Purpose_original))
        .range([0, height])
        .padding(0.1);

    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('.2s'));

    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    // Create a group for the bars
    var bars = svg.append("g");

    // Create the bars and add interactivity
    var bar = bars.selectAll(".bar")
        .data(purposeCountArray)
        .enter().append("g")
        .attr("class", "bar");

    // Add the bars
    bar.append('rect')
        .attr('x', 0)  // Set x to 0
        .attr('y', d => yScale(d.Purpose_original))  // Use y for the purpose
        .attr('width', d => xScale(d.PurposeCount[1]))  // Use x for the count
        .attr('height', yScale.bandwidth())  // Use y bandwidth
        .style('fill', 'steelblue')
        .on("mouseenter", function (event, d) {
            d3.select(this).attr("opacity", 0.5);
        })
        .on("mouseleave", function (event, d) {
            d3.select(this).attr("opacity", 1);
        })
        // Make div appear
        .on("mouseover", function () {
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event, d) {
            return tooltip
                .style("top", event.pageY + 30 + "px")
                .style("left", event.pageX + 20 + "px")
                // .html("Count: " + d3.format(",.0f")(d.PurposeCount[1]));
                .html("Purpose: " + d.PurposeCount[0] + "<br>" + "Count: " + d3.format(",.0f")(d.PurposeCount[1]));
        })
        // Make div disappear
        .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
        });

    // Add data labels
    bar.append('text')
        .attr('x', (d) => xScale(d.PurposeCount[1]) + 5)
        .attr('y', (d) => yScale(d.Purpose_original) + yScale.bandwidth() / 2 + 5)
        .attr('text-anchor', 'start')
        .text((d) => d3.format('.2s')(d.PurposeCount[1]));

    // Add x-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Add y-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))
        .call(xAxis);

    // create chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-family", "sans-serif")
        .style("font-weight", "bold")
        .style("fill", "#999b9e")
        .text("Distribution of Purpose");

    // Add zoom functionality
    var zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    function zoomed(event) {
        // Update the xScale based on the zoom transform
        var newScale = event.transform.rescaleX(xScale);
        bars.selectAll("rect")
            .attr('width', d => newScale(d.PurposeCount[1]));
        svg.select(".x-axis").call(xAxis.scale(newScale));
    }

    // Apply the zoom behavior to the SVG
    svg.call(zoom);
}

function createTimeSeries(data, selectedYear) {
    // Remove the existing chart elements
    d3.select('#timeseries').selectAll('*').remove();

    // count the number of records per Exporter
    var counts = d3.rollup(Array.from(data), v => v.length, d => d.Year, d => d.Exporter_d3c);

    // prepare the data to convert it to year, country, count format
    var countPerExporterByYear = [];

    counts.forEach((value, year) => {
        value.forEach((count, country) => {
            countPerExporterByYear.push({ Year: year, Country: country, Count: count });
        });
    });

    // Replace missing or empty country values with "unknown"
    countPerExporterByYear.forEach(d => {
        if (d.Country === '') {
            d.Country = 'unknown';
        }
    });

    // parse date string to data object
    countPerExporterByYear.forEach(d => {
        d.Year = new Date(d.Year);
    })


    // console.log('result exporters', countPerExporterByYear)

    // Group the data by year and calculate the sum of counts for each year
    const yearlySumData = d3.rollup(
        countPerExporterByYear,
        v => d3.sum(v, d => d.Count),
        d => d.Year
    );

    // Convert the aggregated data to an array for easier charting
    const yearlySumArray = Array.from(yearlySumData, ([Year, Count]) => ({ Year, Count }));

    // Sort the data by year 
    yearlySumArray.sort((a, b) => d3.ascending(a.Year, b.Year));

    // console.log('yearlysumarray', yearlySumArray)

    // console.log('selectedYear ', selectedYear)


    if (selectedYear === 'All') {
        createTimeSeriesLineChart(yearlySumArray)
    } else {
        createTimeSeriesBarChart(yearlySumArray)
    };

    function createTimeSeriesLineChart(yearlySumArray) {

        // configure the SVG dimensions and margins
        var margin = { top: 25, right: 30, bottom: 40, left: 40 };
        // var width = 400 - margin.left - margin.right;
        var width = 420 - margin.left - margin.right;

        // var height = 300 - margin.top - margin.bottom;
        var height = 300 - margin.top - margin.bottom;

        // create SVG container
        var svg = d3.select('#timeseries').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // find unique years
        const uniqueYears = Array.from(d3.rollup(yearlySumArray, v => v.length, d => d.Year).keys());

        // define scale for x and y axis
        const xScale = d3.scaleTime()
            .domain([d3.min(uniqueYears), d3.max(uniqueYears)])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(yearlySumArray, d => d.Count)])
            .nice()
            .range([height, 0]);

        // Create a time format function for the x-axis labels
        const timeFormat = d3.timeFormat("%Y");

        // Create a line generator
        const line = d3.line()
            .x(d => xScale(d.Year))
            .y(d => yScale(d.Count));

        // Create and style the line chart
        svg.append("path")
            .datum(yearlySumArray)
            .attr("class", "line")
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2);

        // Create x and y axes
        const xAxis = d3.axisBottom(xScale)
            .tickValues(uniqueYears)
            // .ticks(uniqueYears.length)
            .tickFormat(timeFormat);

        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d3.format('.2s'));

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis);

        svg.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Create a div element for the tooltip
        var tooltip = d3.select("#timeseries").append("div")
            .attr("class", "tooltip")
            .style("visibility", "hidden");

        // Add tooltips to data points
        svg.selectAll(".dot")
            .data(yearlySumArray)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.Year))
            .attr("cy", d => yScale(d.Count))
            .attr("r", 4)
            .attr("fill", "steelblue")
            .on("mouseover", (event, d) => {
                // Show the tooltip on mouseover
                tooltip.style("visibility", "visible")
                    .html("Year: " + timeFormat(d.Year) + "<br>Count: " + d.Count)
                    .style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mousemove", function (event) {
                // Update tooltip position on mousemove
                tooltip.style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                // Hide the tooltip on mouseout
                tooltip.style("visibility", "hidden");
            });

        // Create chart title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-family", "sans-serif")
            .style("font-weight", "bold")
            .style("fill", "#999b9e")
            .text("Number of Trades Over the Years");
    }


    function createTimeSeriesBarChart(yearlySumArray) {

        // Configure the SVG dimensions and margins
        var margin = { top: 25, right: 30, bottom: 40, left: 40 };
        var width = 420 - margin.left - margin.right;
        var height = 300 - margin.top - margin.bottom;

        // Create SVG container
        var svg = d3.select('#timeseries').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Find unique years
        const uniqueYears = Array.from(d3.rollup(yearlySumArray, v => v.length, d => d.Year).keys());

        // Define scales for x and y axis
        const xScale = d3.scaleBand()
            .domain(uniqueYears.map(String))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(yearlySumArray, d => d.Count)])
            .nice()
            .range([height, 0]);

        // Create a time format function for the x-axis labels
        const timeFormat = d3.timeFormat("%Y");

        // Create x and y axes
        const xAxis = d3.axisBottom(xScale)
            .tickValues(uniqueYears)
            // .ticks(uniqueYears.length)
            .tickFormat(timeFormat);


        const tooltip = d3.select("body").append("div").attr("class", "tooltip");


        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d3.format('.2s'));

        // Append the bars
        svg.selectAll("rect")
            .data(yearlySumArray)
            .enter()
            .append("rect")
            .attr("x", d => xScale(String(d.Year)))
            .attr("y", d => yScale(d.Count))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.Count))
            .attr("fill", "steelblue")
            .on("mouseenter", function (event, d) {
                d3.select(this).attr("opacity", 0.5);
            })
            .on("mouseleave", function (event, d) {
                d3.select(this).attr("opacity", 1);
            })
            // Make div appear
            .on("mouseover", function () {
                return tooltip.style("visibility", "visible");
            })
            .on("mousemove", function (event, d) {
                return tooltip
                    .style("top", event.pageY + 30 + "px")
                    .style("left", event.pageX + 20 + "px")
                    .html("Year: " + timeFormat(d.Year) + "<br>Count: " + d.Count);
            })
            // Make div disappear
            .on("mouseout", function () {
                return tooltip.style("visibility", "hidden");
            });

        // Append x-axis
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("dx", xScale.bandwidth() / 2);

        // Append y-axis
        svg.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Create chart title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-family", "sans-serif")
            .style("font-weight", "bold")
            .style("fill", "#999b9e")
            .text("Total Number of Trades Over the Years");
    };

}


// function createImportersTimeSeries(data, selectedYear) {
//     // Remove the existing chart elements
//     d3.select('#timeseries').selectAll('*').remove();

//     // count the number of records per importer
//     var counts = d3.rollup(Array.from(data), v => v.length, d => d.Year, d => d.Importer_d3c);

//     // prepare the data to convert it to year, country, count format
//     var countPerImporterByYear = [];

//     counts.forEach((value, year) => {
//         value.forEach((count, country) => {
//             countPerImporterByYear.push({ Year: year, Country: country, Count: count });
//         });
//     });

//     // Replace missing or empty country values with "unknown"
//     countPerImporterByYear.forEach(d => {
//         if (d.Country === '') {
//             d.Country = 'unknown';
//         }
//     });

//     // parse date string to data object
//     countPerImporterByYear.forEach(d => {
//         d.Year = new Date(d.Year);
//     })


//     // console.log('result', countPerImporterByYear)

//     // Group the data by year and calculate the sum of counts for each year
//     const yearlySumData = d3.rollup(
//         countPerImporterByYear,
//         v => d3.sum(v, d => d.Count),
//         d => d.Year
//     );

//     // Convert the aggregated data to an array for easier charting
//     const yearlySumArray = Array.from(yearlySumData, ([Year, Count]) => ({ Year, Count }));

//     // Sort the data by year 
//     yearlySumArray.sort((a, b) => d3.ascending(a.Year, b.Year));

//     // console.log('yearlysumarray', yearlySumArray)

//     // console.log('selectedYear ', selectedYear)


//     if (selectedYear === 'All') {
//         createTimeSeriesLineChart(yearlySumArray)
//     } else {
//         createTimeSeriesBarChart(yearlySumArray)
//     };

//     function createTimeSeriesLineChart(yearlySumArray) {

//         // configure the SVG dimensions and margins
//         var margin = { top: 25, right: 30, bottom: 40, left: 40 };
//         var width = 420 - margin.left - margin.right;
//         var height = 300 - margin.top - margin.bottom;




//         // create SVG container
//         var svg = d3.select('#timeseries').append('svg')
//             .attr('width', width + margin.left + margin.right)
//             .attr("height", height + margin.top + margin.bottom)
//             .append("g")
//             .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//         // find unique years
//         const uniqueYears = Array.from(d3.rollup(yearlySumArray, v => v.length, d => d.Year).keys());

//         // define scale for x and y axis
//         const xScale = d3.scaleTime()
//             .domain([d3.min(uniqueYears), d3.max(uniqueYears)])
//             .range([0, width]);

//         const yScale = d3.scaleLinear()
//             .domain([0, d3.max(yearlySumArray, d => d.Count)])
//             .nice()
//             .range([height, 0]);

//         // Create a time format function for the x-axis labels
//         const timeFormat = d3.timeFormat("%Y");

//         // Create a line generator
//         const line = d3.line()
//             .x(d => xScale(d.Year))
//             .y(d => yScale(d.Count));

//         // Create and style the line chart
//         svg.append("path")
//             .datum(yearlySumArray)
//             .attr("class", "line")
//             .attr("d", line)
//             .attr("fill", "none")
//             .attr("stroke", "steelblue")
//             .attr("stroke-width", 2);

//         // Create x and y axes
//         const xAxis = d3.axisBottom(xScale)
//             .tickValues(uniqueYears)
//             // .ticks(uniqueYears.length)
//             .tickFormat(timeFormat);

//         const yAxis = d3.axisLeft(yScale)
//             .tickFormat(d3.format('.2s'));

//         svg.append("g")
//             .attr("class", "x-axis")
//             .attr("transform", `translate(0, ${height})`)
//             .call(xAxis);


//         svg.append("g")
//             .attr("class", "y-axis")
//             .call(yAxis);

//         // Create a div element for the tooltip
//         var tooltip = d3.select("#timeseries").append("div")
//             .attr("class", "tooltip")
//             .style("visibility", "hidden");

//         // Add tooltips to data points
//         svg.selectAll(".dot")
//             .data(yearlySumArray)
//             .enter().append("circle")
//             .attr("class", "dot")
//             .attr("cx", d => xScale(d.Year))
//             .attr("cy", d => yScale(d.Count))
//             .attr("r", 4)
//             .attr("fill", "steelblue")
//             .on("mouseover", (event, d) => {
//                 // Show the tooltip on mouseover
//                 tooltip.style("visibility", "visible")
//                     .html("Year: " + timeFormat(d.Year) + "<br>Count: " + d.Count)
//                     .style("top", (event.pageY + 10) + "px")
//                     .style("left", (event.pageX + 10) + "px");
//             })
//             .on("mousemove", function (event) {
//                 // Update tooltip position on mousemove
//                 tooltip.style("top", (event.pageY + 10) + "px")
//                     .style("left", (event.pageX + 10) + "px");
//             })
//             .on("mouseout", function () {
//                 // Hide the tooltip on mouseout
//                 tooltip.style("visibility", "hidden");
//             });

//         // create chart title
//         svg.append("text")
//             .attr("x", width / 2)
//             .attr("y", -margin.top / 2)
//             .attr("text-anchor", "middle")
//             .style("font-size", "16px")
//             .style("font-family", "sans-serif")
//             .style("font-weight", "bold")
//             .style("fill", "#999b9e")
//             .text("Number of Records for Importer");

//     };

//     function createTimeSeriesBarChart(yearlySumArray) {

//         // Configure the SVG dimensions and margins
//         var margin = { top: 25, right: 30, bottom: 40, left: 40 };
//         var width = 420 - margin.left - margin.right;
//         var height = 300 - margin.top - margin.bottom;


//         // Create SVG container
//         var svg = d3.select('#timeseries').append('svg')
//             .attr('width', width + margin.left + margin.right)
//             .attr("height", height + margin.top + margin.bottom)
//             .append("g")
//             .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//         // Find unique years
//         const uniqueYears = Array.from(d3.rollup(yearlySumArray, v => v.length, d => d.Year).keys());

//         // Define scales for x and y axis
//         const xScale = d3.scaleBand()
//             .domain(uniqueYears.map(String))
//             .range([0, width])
//             .padding(0.1);

//         const yScale = d3.scaleLinear()
//             .domain([0, d3.max(yearlySumArray, d => d.Count)])
//             .nice()
//             .range([height, 0]);

//         // Create a time format function for the x-axis labels
//         const timeFormat = d3.timeFormat("%Y");

//         // Create x and y axes
//         const xAxis = d3.axisBottom(xScale)
//             .tickValues(uniqueYears)
//             // .ticks(uniqueYears.length)
//             .tickFormat(timeFormat);

//         const yAxis = d3.axisLeft(yScale)
//             .tickFormat(d3.format('.2s'));

//         // Append the bars
//         svg.selectAll("rect")
//             .data(yearlySumArray)
//             .enter()
//             .append("rect")
//             .attr("x", d => xScale(String(d.Year)))
//             .attr("y", d => yScale(d.Count))
//             .attr("width", xScale.bandwidth())
//             .attr("height", d => height - yScale(d.Count))
//             .attr("fill", "steelblue");

//         // Append x-axis
//         svg.append("g")
//             .attr("class", "x-axis")
//             .attr("transform", `translate(0, ${height})`)
//             .call(xAxis)
//             .selectAll("text")
//             .style("text-anchor", "middle")
//             .attr("dx", xScale.bandwidth() / 2);

//         // Append y-axis
//         svg.append("g")
//             .attr("class", "y-axis")
//             .call(yAxis);

//         // Create chart title
//         svg.append("text")
//             .attr("x", width / 2)
//             .attr("y", -margin.top / 2)
//             .attr("text-anchor", "middle")
//             .style("font-size", "16px")
//             .style("font-family", "sans-serif")
//             .style("font-weight", "bold")
//             .style("fill", "#999b9e")
//             .text("Number of Records for Importer");
//     };

// }

function createTermChart(data) {
    d3.select('#term1chart').selectAll('*').remove();

    // count the total quantity of each source
    var termCount = d3.rollup(Array.from(data), v => v.length, d => d.Term);
    // console.log('termCount', termCount)

    // Convert purposeCounts to an array of objects
    var termCountArray = Array.from(termCount, ([Term, count]) => ({ Term, count }));

    // Sort purposeCountArray from largest to smallest
    termCountArray.sort((a, b) => b.count - a.count);

    // Slice the top 10 items
    var top10Data = termCountArray.slice(0, 10);

    // console.log('top 10 termCountArray', top10Data)

    // configure the SVG dimensions and margins
    var margin = { top: 25, right:  150, bottom: 40, left: 20 };
    var width = 500 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    // Create the main SVG container
    var svg = d3.select('#term1chart').append('svg')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + 120 + "," + margin.top + ")");


    // Set up the scales
    var xScale = d3.scaleLinear()
        .domain([0, d3.max(top10Data, d => d.count)])
        .nice()
        .range([0, width]);

    var yScale = d3.scaleBand()
        .domain(top10Data.map(d => d.Term))
        .range([0, height])
        .padding(0.1);

    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('.2s'));

    const tooltip = d3.select("#term1chart").append("div").attr("class", "tooltip");

    // Create a group for the bars
    var bars = svg.append("g");

    // Create the bars and add interactivity
    var bar = bars.selectAll(".bar")
        .data(top10Data)
        .enter().append("g")
        .attr("class", "bar");

    // Add the bars
    bar.append('rect')
        .attr('x', 0)  // Set x to 0
        .attr('y', d => yScale(d.Term))  // Use y for the Term
        .attr('width', d => xScale(d.count))  // Use x for the count
        .attr('height', yScale.bandwidth())  // Use y bandwidth
        .style('fill', 'steelblue')
        .on("mouseenter", function (event, d) {
            d3.select(this).attr("opacity", 0.5);
        })
        .on("mouseleave", function (event, d) {
            d3.select(this).attr("opacity", 1);
        })
        // Make div appear
        .on("mouseover", function () {
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event, d) {
            return tooltip
                .style("top", event.pageY + 30 + "px")
                .style("left", event.pageX + 20 + "px")
                .html("Count: " + d3.format(",.0f")(d.count));
        })
        // Make div disappear
        .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
        });

    // Add data labels
    bar.append('text')
        .attr('x', (d) => xScale(d.count) + 5)
        .attr('y', (d) => yScale(d.Term) + yScale.bandwidth() / 2 + 5)
        .attr('text-anchor', 'start')
        .text((d) => d3.format('.2s')(d.count));

    // Add x-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Add y-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))
        .call(xAxis);

    // create chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-family", "sans-serif")
        .style("font-weight", "bold")
        .style("fill", "#999b9e")
        .text("Top 10 Term");

}

function createChart1Sum(data) {

    console.log(data)
    
    // Remove the existing chart elements
    d3.select('#chart1sum').selectAll('*').remove();

    // count the total quantity of each country
    var exporterSum = d3.rollup(Array.from(data), v => v.length, d => d.Exporter_d3c, d => d.Exporter);
    console.log('exporterSum', exporterSum)
    // Convert exporterSum to an array of objects
    var exporterSumArray = Array.from(exporterSum, ([Exporter_d3c, [ExporterSum]]) => ({ Exporter_d3c, ExporterSum }));
    // console.log(exporterSumArray)
    // Sort exporterSumArray from largest to smallest
    exporterSumArray = exporterSumArray.sort((a, b) => b.ExporterSum[1] - a.ExporterSum[1]);

    // Slice the top 10 items
    var top10Data = exporterSumArray.slice(0, 10);
    // console.log(top10Data)

    // configure the SVG dimensions and margins
    var margin = { top: 25, right: 30, bottom: 40, left: 40 };
    var width = 420 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    // create svg container
    var svg = d3.select('#chart1sum').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up the scales
    var yScale = d3.scaleBand()
        .domain(top10Data.map(d => d.ExporterSum[0]))
        .range([0, height])
        .padding(0.1);

    var xScale = d3.scaleLinear()
        .domain([0, d3.max(top10Data, d => d.ExporterSum[1])])
        .nice()
        .range([0, width]);

    // add tooltip
    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    // Create the bars
    svg.selectAll(".bar")
        .data(top10Data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.ExporterSum[0]))
        .attr("width", d => xScale(d.ExporterSum[1]))
        .attr("height", yScale.bandwidth())
        .style("fill", "steelblue") // Set the fill color here
        .on("mouseenter", function (event, d) {
            d3.select(this).attr("opacity", 0.5);
        })
        .on("mouseleave", function (event, d) {
            d3.select(this).attr("opacity", 1);
        })
        // Make div appear
        .on("mouseover", function () {
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event, d) {
            return tooltip
                .style("top", event.pageY + 30 + "px")
                .style("left", event.pageX + 20 + "px")
                .html("Country: " + d.Exporter_d3c + "<br>" + "Count: " + d3.format(",.0f")(d.ExporterSum[1]));
        })
        // Make div disappear
        .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
        });


    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('.2s'));

    const yAxis = d3.axisLeft(yScale);

    // Add x-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add y-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // create chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-family", "sans-serif")
        .style("font-weight", "bold")
        .style("fill", "#999b9e")
        .text("Top 10 Exporter Countries");
}

function createChart2Sum(data) {
    // Remove the existing chart elements
    d3.select('#chart2sum').selectAll('*').remove();

    // count the total quantity of each country
    var importerSum = d3.rollup(Array.from(data), v => v.length, d => d.Importer_d3c, d => d.Importer);
    // console.log(importerSum)
    // Convert exporterSum to an array of objects
    var importerSumArray = Array.from(importerSum, ([Importer_d3c, [ImporterSum]]) => ({ Importer_d3c, ImporterSum }));
    // console.log(importerSumArray)
    // Sort exporterSumArray from largest to smallest
    importerSumArray.sort((a, b) => b.ImporterSum[1] - a.ImporterSum[1]);

    // Slice the top 10 items
    var top10Data = importerSumArray.slice(0, 10);
    // console.log(top10Data)

    // configure the SVG dimensions and margins
    var margin = { top: 25, right: 30, bottom: 40, left: 40 };
    var width = 420 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    // create svg container
    var svg = d3.select('#chart2sum').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up the scales
    var yScale = d3.scaleBand()
        .domain(top10Data.map(d => d.ImporterSum[0]))
        .range([0, height])
        .padding(0.1);

    var xScale = d3.scaleLinear()
        .domain([0, d3.max(top10Data, d => d.ImporterSum[1])])
        .nice()
        .range([0, width]);

    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    // Create the bars
    svg.selectAll(".bar")
        .data(top10Data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.ImporterSum[0]))
        .attr("width", d => xScale(d.ImporterSum[1]))
        .attr("height", yScale.bandwidth())
        .style("fill", "steelblue") // Set the fill color here
        .on("mouseenter", function (event, d) {
            d3.select(this).attr("opacity", 0.5);
        })
        .on("mouseleave", function (event, d) {
            d3.select(this).attr("opacity", 1);
        })
        // Make div appear
        .on("mouseover", function () {
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event, d) {
            return tooltip
                .style("top", event.pageY + 30 + "px")
                .style("left", event.pageX + 20 + "px")
                .html("Country: " + d.Importer_d3c + "<br>" + "Count: " + d3.format(",.0f")(d.ImporterSum[1]));
        })
        // Make div disappear
        .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
        });


    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('.2s'));

    const yAxis = d3.axisLeft(yScale);

    // Add x-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add y-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // create chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-family", "sans-serif")
        .style("font-weight", "bold")
        .style("fill", "#999b9e")
        .text("Top 10 Importer Countries");


}

function createTreeMap(data) {
    // Remove the existing chart elements
    d3.select('#treemap').selectAll('*').remove();


    var aggregatedData = d3.rollup(
        data,
        v => v.length,
        d => d.Appendix,
        d => d.Source_original
     );

    // console.log(aggregatedData)

    // Create a hierarchical structure for the treemap
    var hierarchicalData = {
        name: "All Appendix",
        children: []
    };


    // Sort the classes by class count in descending order
    const sortedAppendix = Array.from(aggregatedData, ([appendixName, classCount]) => ({ appendixName, classCount }))
        .sort((a, b) => b.classCount - a.classCount);

    // Limit to the top 3 Appendix
    const top3Appendix = sortedAppendix.slice(0, 3);

    top3Appendix.forEach(({ appendixName, classCount }) => {
        const classEntry = {
            name: appendixName,
            children: []
        };

        // Get the terms for the current class
        const appendixSources = aggregatedData.get(appendixName);

        // Sort the terms by quantity in descending order
        const sortedAppendix = Array.from(appendixSources, ([Source_original, count]) => ({ name: Source_original, value: count }));
        sortedAppendix.sort((a, b) => b.value - a.value);

        // Limit to the top 3 terms within each class
        const limitedChildren = sortedAppendix.slice(0, 3);

        classEntry.children = limitedChildren;

        hierarchicalData.children.push(classEntry);

    });

    // console.log('hierarchicalData', hierarchicalData);


// Configure the SVG dimensions and margins based on the container width
var margin = { top: 25, right: 30, bottom: 20, left: 30 };
var containerWidth = document.getElementById('treemap').clientWidth;
var width = containerWidth - margin.left - margin.right;
var height = 300 - margin.top - margin.bottom; 

// Create the main SVG container
var svg = d3.select('#treemap').append('svg')
    .attr("width", containerWidth)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var treemap = d3.treemap()
        .size([width, height])
        .padding(1)
        .tile(d3.treemapSquarify);

    // Create a hierarchy from the data
    var root = d3.hierarchy(hierarchicalData)
        .sum(function (d) { return d.value; });

    // Define a color scale based on unique classes using a color palette
    var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Assign colors based on the "Class" attribute
    var classColors = {};
    root.children.forEach(function (classNode, classIndex) {
        classColors[classNode.data.name] = colorScale(classNode.data.name);
    });

    // Compute the treemap layout and append the cells
    treemap(root);

    // Define a color scale
    // var color = d3.scaleSequential(d3.interpolateBlues)
    //     .domain([0, d3.max(root.leaves(), function(d) { return d.value; })]);
    const tooltip = d3.select("body").append("div").attr("class", "tooltip");


    // Apply the color scale to the treemap cells
    svg.selectAll(".cell")
        .data(root.leaves())
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", function (d) { return d.x0; })
        .attr("y", function (d) { return d.y0; })
        .attr("width", function (d) { return d.x1 - d.x0; })
        .attr("height", function (d) { return d.y1 - d.y0; })
        .style("fill", function (d) { return classColors[d.parent.data.name]; }) // Assign color based on class
        .style("stroke", "#fff")
        // Make div appear
        .on("mouseover", function () {
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event, d) {
            // const sourceLabel = data.find(item => item.Appendix === d.parent.data.name).Source; // Retrieve the 'Source' property from the original data
            var sourceData = data.find(item => item.Appendix === d.parent.data.name && item.Source_original === d.data.name);
            return tooltip
                .style("top", event.pageY + 30 + "px")
                .style("left", event.pageX + 20 + "px")
                .html("Appendix: " + d.parent.data.name + "<br>" + "Source: " + sourceData.Source + "<br>" + "Count: " + d3.format(",.0f")(d.data.value));
        })
        // Make div disappear
        .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
        });

    // Add text labels to the cells
    svg.selectAll(".label")
        .data(root.leaves())
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", function (d) { return (d.x0 + d.x1) / 2; }) // Center the labels
        .attr("y", function (d) { return (d.y0 + d.y1) / 2; }) // Center the labels
        .attr("dy", "0.35em") // Vertical alignment adjustment
        .attr("text-anchor", "middle") // Center the text horizontally
        .text(function (d) { return d.data.name; });

    // create chart title
    svg.append("text")
        .attr("x", containerWidth / 2) // Center the title within the container width
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-family", "sans-serif")
        .style("font-weight", "bold")
        .style("fill", "#999b9e")
        .text("Top 3 Sources for Appendix");

}

// function createTreeMap(data) {
//     // Remove the existing chart elements
//     d3.select('#treemap').selectAll('*').remove();

//     var aggregatedData = d3.rollup(
//         data,
//         v => v.length,
//         d => d.Class,
//         d => d.Source_original
//     );

//     // console.log(aggregatedData)

//     // Create a hierarchical structure for the treemap
//     var hierarchicalData = {
//         name: "All Classes",
//         children: []
//     };


//     // Sort the classes by class count in descending order
//     const sortedClasses = Array.from(aggregatedData, ([className, classCount]) => ({ className, classCount }))
//         .sort((a, b) => b.classCount - a.classCount);

//     // Limit to the top 3 classes
//     const top3Classes = sortedClasses.slice(0, 3);

//     top3Classes.forEach(({ className, classCount }) => {
//         const classEntry = {
//             name: className,
//             children: []
//         };

//         // Get the terms for the current class
//         const classSources = aggregatedData.get(className);

//         // Sort the terms by quantity in descending order
//         const sortedSources = Array.from(classSources, ([Source_original, count]) => ({ name: Source_original, value: count }));
//         sortedSources.sort((a, b) => b.value - a.value);

//         // Limit to the top 3 terms within each class
//         const limitedChildren = sortedSources.slice(0, 3);

//         classEntry.children = limitedChildren;

//         hierarchicalData.children.push(classEntry);

//     });

//     // console.log('hierarchicalData', hierarchicalData);

//     // configure the SVG dimensions and margins
//     var margin = { top: 25, right: 5, bottom: 10, left: 5 };
//     var width = 420 - margin.left - margin.right;
//     var height = 300 - margin.top - margin.bottom;

//     // Create the main SVG container
//     var svg = d3.select('#treemap').append('svg')
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//         .append("g")
//         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


//     var treemap = d3.treemap()
//         .size([width, height])
//         .padding(1)
//         .tile(d3.treemapResquarify);

//     // Create a hierarchy from the data
//     var root = d3.hierarchy(hierarchicalData)
//         .sum(function (d) { return d.value; });

//     // Define a color scale based on unique classes using a color palette
//     var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

//     // Assign colors based on the "Class" attribute
//     var classColors = {};
//     root.children.forEach(function (classNode, classIndex) {
//         classColors[classNode.data.name] = colorScale(classNode.data.name);
//     });

//     // Compute the treemap layout and append the cells
//     treemap(root);

//     // Define a color scale
//     // var color = d3.scaleSequential(d3.interpolateBlues)
//     //     .domain([0, d3.max(root.leaves(), function(d) { return d.value; })]);
//     const tooltip = d3.select("body").append("div").attr("class", "tooltip");


//     // Apply the color scale to the treemap cells
//     svg.selectAll(".cell")
//         .data(root.leaves())
//         .enter()
//         .append("rect")
//         .attr("class", "cell")
//         .attr("x", function (d) { return d.x0; })
//         .attr("y", function (d) { return d.y0; })
//         .attr("width", function (d) { return d.x1 - d.x0; })
//         .attr("height", function (d) { return d.y1 - d.y0; })
//         .style("fill", function (d) { return classColors[d.parent.data.name]; }) // Assign color based on class
//         .style("stroke", "#fff")
//         // Make div appear
//         .on("mouseover", function () {
//             return tooltip.style("visibility", "visible");
//         })
//         .on("mousemove", function (event, d) {
//             return tooltip
//                 .style("top", event.pageY + 30 + "px")
//                 .style("left", event.pageX + 20 + "px")
//                 .html("Class: " + d.parent.data.name + "<br>" + "Source: " + d.data.name + "<br>" + "Count: " + d3.format(",.0f")(d.data.value));
//         })
//         // Make div disappear
//         .on("mouseout", function () {
//             return tooltip.style("visibility", "hidden");
//         });;

//     // Add text labels to the cells
//     svg.selectAll(".label")
//         .data(root.leaves())
//         .enter()
//         .append("text")
//         .attr("class", "label")
//         .attr("x", function (d) { return (d.x0 + d.x1) / 2; }) // Center the labels
//         .attr("y", function (d) { return (d.y0 + d.y1) / 2; }) // Center the labels
//         .attr("dy", "0.35em") // Vertical alignment adjustment
//         .attr("text-anchor", "middle") // Center the text horizontally
//         .text(function (d) { return d.data.name; });

//     // create chart title
//     svg.append("text")
//         .attr("x", width / 2)
//         .attr("y", -margin.top / 2)
//         .attr("text-anchor", "middle")
//         .style("font-size", "16px")
//         .style("font-family", "sans-serif")
//         .style("font-weight", "bold")
//         .style("fill", "#999b9e")
//         .text("Top 3 Sources for Top 3 Classes");

// }


// function createTreeMap2(data) {
//     // Remove the existing chart elements
//     d3.select('#treemap2').selectAll('*').remove();

//     var aggregatedData = d3.rollup(
//         data,
//         v => v.length,
//         d => d.Term,
//         d => d.Source_original
//     );

//     // console.log(aggregatedData)

//     // Create a hierarchical structure for the treemap
//     var hierarchicalData = {
//         name: "All Classes",
//         children: []
//     };
    
//     var limitedChildrenList = [];

//     // Sort the classes by class count in descending order
//     const sortedClasses = Array.from(aggregatedData, ([termName, termCount]) => ({ termName, termCount }))
//         .sort((a, b) => b.classCount - a.classCount);

//     // Limit to the top 3 classes
//     const top3Classes = sortedClasses.slice(0, 3);

//     top3Classes.forEach(({ termName, termCount }) => {
//         const termEntry = {
//             name: termName,
//             children: []
//         };

//         // Get the terms for the current class
//         const termSources = aggregatedData.get(termName);

//         // Sort the terms by quantity in descending order
//         const sortedSources = Array.from(termSources, ([Source_original, count]) => ({ name: Source_original, value: count }));
//         sortedSources.sort((a, b) => b.value - a.value);

//         // Limit to the top 3 terms within each class
//         limitedChildren = sortedSources.slice(0, 3);

//         limitedChildrenList.push(limitedChildren)

//         termEntry.children = limitedChildren;

//         hierarchicalData.children.push(termEntry);


//     });

//     console.log(limitedChildrenList)

//     console.log('hierarchicalData', hierarchicalData);

//     // configure the SVG dimensions and margins
//     var margin = { top: 25, right: 5, bottom: 10, left: 5 };
//     var width = 420 - margin.left - margin.right;
//     var height = 300 - margin.top - margin.bottom;

//     // Create the main SVG container
//     var svg = d3.select('#treemap2').append('svg')
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//         .append("g")
//         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



//     var dataScale = d3.scaleLinear()
//         .domain([d3.min(limitedChildrenList, function (d,i) { return d[i].value }),
//         d3.max(limitedChildrenList, function (d, i) { return d[i].value })]);



//     dataScale.range([50, 1000]);

//     var treemap = d3.treemap()
//         .size([width, height])
//         .padding(1)
//         .tile(d3.treemapBinary);

//     // Create a hierarchy from the data
//     var root = d3.hierarchy(hierarchicalData)
//         // added 100 to ensure boxes can be seen even for small numbers
//         .sum(function (d) { return dataScale(d.value); });

//     // Define a color scale based on unique classes using a color palette
//     var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

//     // Assign colors based on the "Class" attribute
//     var termColors = {};
//     root.children.forEach(function (termNode, termIndex) {
//         termColors[termNode.data.name] = colorScale(termNode.data.name);
//     });

//     // Compute the treemap layout and append the cells
//     treemap(root);

//     // Define a color scale
//     // var color = d3.scaleSequential(d3.interpolateBlues)
//     //     .domain([0, d3.max(root.leaves(), function(d) { return d.value; })]);
//     const tooltip = d3.select("body").append("div").attr("class", "tooltip");


//     // Apply the color scale to the treemap cells
//     svg.selectAll(".cell")
//         .data(root.leaves())
//         .enter()
//         .append("rect")
//         .attr("class", "cell")
//         .attr("x", function (d) { return d.x0; })
//         .attr("y", function (d) { return d.y0; })
//         .attr("width", function (d) { return d.x1 - d.x0; })
//         .attr("height", function (d) { return d.y1 - d.y0; })
//         .style("fill", function (d) { return termColors[d.parent.data.name]; }) // Assign color based on class
//         .style("stroke", "#fff")
//         // Make div appear
//         .on("mouseover", function () {
//             return tooltip.style("visibility", "visible");
//         })
//         .on("mousemove", function (event, d) {
//             return tooltip
//                 .style("top", event.pageY + 30 + "px")
//                 .style("left", event.pageX + 20 + "px")
//                 .html("Term: " + d.parent.data.name + "<br>" + "Source: " + d.data.name + "<br>" + "Count: " + d3.format(",.0f")(d.data.value));
//         })
//         // Make div disappear
//         .on("mouseout", function () {
//             return tooltip.style("visibility", "hidden");
//         });;

//     // Add text labels to the cells
//     svg.selectAll(".label")
//         .data(root.leaves())
//         .enter()
//         .append("text")
//         .attr("class", "label")
//         .attr("x", function (d) { return (d.x0 + d.x1) / 2; }) // Center the labels
//         .attr("y", function (d) { return (d.y0 + d.y1) / 2; }) // Center the labels
//         .attr("dy", "0.35em") // Vertical alignment adjustment
//         // .attr("dx", "0.35em")
//         .attr("text-anchor", "middle") // Center the text horizontally
//         .text(function (d) { return d.data.name; });

//     // create chart title
//     svg.append("text")
//         .attr("x", width / 2)
//         .attr("y", -margin.top / 2)
//         .attr("text-anchor", "middle")
//         .style("font-size", "16px")
//         .style("font-family", "sans-serif")
//         .style("font-weight", "bold")
//         .style("fill", "#999b9e")
//         .text("Top 3 Sources for Top 3 Terms");

// }