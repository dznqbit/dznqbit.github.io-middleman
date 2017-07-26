let svgWidth  = 660;
let svgHeight = 660;

let numRows = 20;
let numCols = 20;

let padding = 0;
let cellWidth   = (svgWidth  - 2*padding) / numRows;
let cellHeight  = (svgHeight - 2*padding) / numCols;

const hoverColor = '#EEEEEE';

var data;  
var svg;

function buildData() {
  let data = [];

  for (let i = 0; i < numRows; ++i) {
    for (let j = 0; j < numCols; ++j) {
      var d = { 
        x: j, 
        y: i, 
        color: '#FFFFFF' 
      };

      data.push(d); 
    }
  }

  return data;
};

function withCell(x, y, fn) {
  if (x >= 0 && x < numCols && y >= 0 && y < numRows) {
    var di  = y * numCols + x;
    var d   = data[di];
    fn(d);
  }
};

function rectMouseover() {
  var rect = d3.select(this).select("rect");

  var x = Number(rect.attr('data-x'));
  var y = Number(rect.attr('data-y'));
  var updateColor = function(d) { d.color = hoverColor; };

  withCell(x,     y,      updateColor);
  withCell(x,     y + 1,  updateColor);
  withCell(x + 1, y,      updateColor); 
  withCell(x,     y - 1,  updateColor);
  withCell(x - 1, y,      updateColor);

  svg.selectAll('g').data(data);
  svg.selectAll('g rect').attr('fill', function(d, i) { return d.color; });
};

function rectMouseout() {
  var rect = d3.select(this).select("rect");

  var x = Number(rect.attr('data-x'));
  var y = Number(rect.attr('data-y'));
  var updateColor = function(d) { d.color = '#FFFFFF'; };

  withCell(x,     y,      updateColor);
  withCell(x,     y + 1,  updateColor);
  withCell(x + 1, y,      updateColor); 
  withCell(x,     y - 1,  updateColor);
  withCell(x - 1, y,      updateColor);

  svg.selectAll('g').data(data);
  svg.selectAll('g rect').attr('fill', function(d, i) { return d.color; });
};

function drawSquare(elem) {
  elem
    .append('rect')
      .attr('x', function(d, i) { return padding + (cellWidth  * d.x); })
      .attr('y', function(d, i) { return padding + (cellHeight * d.y); })
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('stroke', 'black')
      .attr('fill', function(d, i) { return d.color; })

      .attr('data-x', function(d, i) { return d.x; })
      .attr('data-y', function(d, i) { return d.y; })
  ;
};

function drawCoordinates(elem) {
  elem
    .append('text')
      .attr('text-anchor', 'middle')
      .attr('x', function(d, i) { return padding + (cellWidth  * (0.5 + d.x)); })
      .attr('y', function(d, i) { return padding + (cellHeight * (0.5 + d.y)); })
      .text(function(d, i) { return String(d.x) + "x" + String(d.y); })
      .attr('font-family', 'sans-serif')
      .attr('font-size', '9px')
      .attr('fill', 'black')
  ;
};

document.addEventListener("DOMContentLoaded", function() {
  data = buildData();
  svg  = d3
    .select("body main")
    .append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .attr('background', 'transparent')
  ;

  var g = svg
    .selectAll('g')
    .data(data)
    .enter()
      .append('g')
  ;

  drawSquare(g);
  // drawCoordinates(g);
        
  g
    .on('mouseover',  rectMouseover)
    .on('mouseout',   rectMouseout)
  ;
});
