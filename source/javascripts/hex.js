let svgWidth  = 660;
let svgHeight = 660;

let numRows = 10;
let numCols = 10;

function buildData() {
  let data = [];

  for (let i = 0; i < numRows; ++i) {
    for (let j = 0; j < numCols; ++j) {
      data.push({ x: j, y: i }); 
    }
  }

  return data;
};

document.addEventListener("DOMContentLoaded", function() {
  var data  = buildData();
  var svg   = d3
    .select("body main")
    .append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .attr('background', 'transparent')
  ;

  console.log(data);

  svg
    .selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function(d, i) { return 10 + ((svgWidth  / numRows) * d.x); })
    .attr('cy', function(d, i) { return 10 + ((svgHeight / numCols) * d.y); })
    .attr('r', 2)
    .attr('fill', 'red')
    // .exit()
  ;

});
