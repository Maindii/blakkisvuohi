const vega = require('vega');
const fs = require('fs');
const when = require('when');

const lineChartTemplate = require('./linechart.json');

const blakkisChart = {};

blakkisChart.getLineGraphStream = function(data) {
  let deferred = when.defer();

  var lineChart = lineChartTemplate;
  lineChart.data.values = data;

  // create a new view instance for a given Vega JSON spec
  var view = new vega
    .View(vega.parse(lineChartTemplate))
    .renderer('none')
    .initialize();

  // generate static PNG file from chart
  view
    .toCanvas()
    .then(function (canvas) {
      // process node-canvas instance for example, generate a PNG stream to write var
      console.log('Generating PNG stream...');
      deferred.resolve(canvas.createPNGStream());
    })
    .catch(function (err) {
      console.log("Error writing PNG to file:")
      console.error(err)
      deferred.reject();
    });

};

module.exports = blakkisChart;