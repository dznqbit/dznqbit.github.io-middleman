import 'conway6.scss';
import * as d3 from "d3";

// conway16.js
// its conway on a hex grid

// Adapted heavily from:
// https://bl.ocks.org/mbostock/5249328
// http://www.redblobgames.com/grids/hexagons/

// Some light reading
// https://github.com/d3/d3-geo/blob/master/README.md

// To make it hard, we're diverging a little from RBG's advised coordinate system.
//
// Pointy-top hexes.
// Cubic coordinates all over the place.
// All Cubics abide by the constraint x + y - z = 0
//
// X increases to the upper right
// Z increases to the lower right 
// Y increases directly downward

// Conway Rules
// 
// Any live cell with fewer than two live neighbours dies, as if caused by under-population.
// Any live cell with two or three live neighbours lives on to the next generation.
// Any live cell with more than three live neighbours dies, as if by over-population.
// Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.

let darkGray  = d3.rgb(188, 188, 188);
let black = d3.rgb(0, 0, 0);

let width = 820,
    height = 820,
    hexRadius = 25;

let enableLog = false;

// For setTimeout.
let timer;

// Cell Data.
let cells; 

// DOM entity.
let svg;

// DOM entity.
let hexagons;

const util = {
// THIS IS WRONG. UPDATE IF YOU'RE GOING TO USE IT.
//  axialToCubic: function(ax) { throw 'derp'; return new Cubic(ax.q, (- ax.q - ax.r), ax.r); },
  cubicToAxial: function(qb) { return new Axial(qb.x, qb.y); },
  cubicToPixel: function(qb) { return this.axialToPixel(this.cubicToAxial(qb)); },

  // cubic:   Cubic coordinate.
  // Returns: Pixel coordinates appropriate for svg.
  axialToPixel: function(ax) {
    var x = hexRadius * Math.sqrt(3) * (ax.q + ax.r / 2);
    var y = hexRadius * (3 / 2) * ax.r;

    return new Pixel(x, y);
  }
};

// Translation matrices. Arrays of x,y,z
const cubicTranslations = [
  [+1, -1,  0],
  [+1,  0, +1],
  [ 0, +1, +1],
  [-1, +1,  0],
  [-1,  0, -1],
  [ 0, -1, -1]
];

cubicTranslations.upRight   = cubicTranslations[0];
cubicTranslations.right     = cubicTranslations[1];
cubicTranslations.downRight = cubicTranslations[2];
cubicTranslations.downLeft  = cubicTranslations[3];
cubicTranslations.left      = cubicTranslations[4];
cubicTranslations.upLeft    = cubicTranslations[5];

function Axial(q, r) {
  this.q = q;
  this.r = r;
}

function Cubic(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

Cubic.prototype.isValid   = function()    { return (this.x + this.y - this.z) == 0; };
Cubic.prototype.toString  = function()    { return '(' + [this.x, this.y, this.z].join(',') + ')'; };
Cubic.prototype.translate = function(tr)  { return new Cubic(this.x + tr[0], this.y + tr[1], this.z + tr[2]); };
Cubic.prototype.neighbors = function()    { var _t = this; return cubicTranslations.map(function(translation) { return _t.translate(translation); }); };

function Pixel(x, y) {
  this.x = x;
  this.y = y;
}

function Cell(cubic, filled) {
  this.cubic = cubic;
  this.filled = filled;
}

Cell.prototype.neighbors = function(cellGrid) {
  if (!cellGrid) { throw "cellGrid cannot be null"; }
  return this
    .cubic.neighbors()
    .map((qb) => { return cellGrid.get(qb.toString()); })
    .filter(x => x)
  ;
};

Cell.prototype.toString = function() { return this.cubic.toString(); };
Cell.prototype.toggle   = function() { this.filled = this.filled ? false : true; return this.filled; };

function CellGrid(rings) {
  this.cells = new Map();
  this.count = 0;

  // Constructor
  // Given a ring count, create an Origin cell with concentric rings around it.
  // Create the cells.
  let _t = this;
  let addCell = function(cell) { _t.set(cell.cubic, cell); };
  let numRings = (rings || 1);

  for (let radius = 0; radius <= numRings; ++radius) {
    if (radius == 0) {
      let originCell = new Cell(new Cubic(0, 0, 0), true);
      addCell(originCell);
      continue;
    }

    for (let tIndex = 0; tIndex < cubicTranslations.length; ++tIndex) { 
      // Set anchor
      let anchorCoordinates = cubicTranslations[tIndex].map((v) => { return v * radius; });
      let anchor = new Cell(new Cubic(...anchorCoordinates), false);
      addCell(anchor);

      let numConnectingCells = radius - 1;
      if (numConnectingCells > 0) {
        let ccTranslation = cubicTranslations[(tIndex + 2) % 6]
        for (let ccIndex = 1; ccIndex <= numConnectingCells; ++ccIndex) {
          let scaledTranslation = ccTranslation.map((v) => { return v * ccIndex; });
          let ccCubic = anchor.cubic.translate(scaledTranslation);
          let cc = new Cell(ccCubic, false);
          addCell(cc);
        }
      }
    }
  }
};

CellGrid.prototype.random = function(p)    { let pp = p || 0.6; for (let [_, cell] of this.cells) { cell.filled = (Math.random() < pp); } };
CellGrid.prototype.clear  = function()    { for (let [_, cell] of this.cells) { cell.filled = false; } };
CellGrid.prototype.set    = function(a,b) { let r = this.cells.set(a.toString(), b); this.count = this.cells.size; return r; };
CellGrid.prototype.get    = function(a)   { return this.cells.get(a.toString()); };
CellGrid.prototype.values = function()    { return this.cells.values(); };

// Will return path suitable for applying towards <path d="..." />
// Pointy tops. Clockwise, from the top-most point.
function hexPath(centerX, centerY, radius) {
  var points = [];
  
  // RedBlobGames hex algo.
  for (let i = 0; i < 6; ++i) {
    let angleDeg = 60 * i   + 30;
    let angleRad = Math.PI / 180 * angleDeg;
    let point = [
      (centerX + radius * Math.cos(angleRad)).toFixed(4),
      (centerY + radius * Math.sin(angleRad)).toFixed(4)
    ];

    points.push(point);
  }

  // In RBG's algorithm, #5 = pointed top.
  var dString = `M ${points[5][0]} ${points[5][1]}`;
  for (let i in [6, 0, 1, 2, 3, 4]) {
    dString += ` L ${points[i][0]} ${points[i][1]}`;
  }

  return dString;
};

function draw() {
  let tStart = new Date();

  let cellz = Array.from(cells.values());

  let hexagonz  = hexagons.selectAll('g.hexagon').data(cellz);
  let hexagon   = hexagonz
    .enter()
    .append('g')
    .attr('data-cubic', d => d.cubic.toString())
    .append('path')
    .attr('stroke', black)
    .attr('d', function(d) {
      let px = util.cubicToPixel(d.cubic);
      return hexPath(px.x, px.y, hexRadius); 
    })

    .on('click', function(cell) { cell.toggle(); d3.select(this).attr('class', cell.filled ? 'hexagon fill' : 'hexagon'); })
  ;

  hexagon
    .attr('class', function(d) { return (d.filled ? 'hexagon fill' : 'hexagon'); })
  ;

  let tEnd = new Date();
  var durString = String(tEnd - tStart) + 'ms';

  log('drew ' + cells.count + ' cells in ' + durString);
};

function clearCell(c) { c.nextFilled = false; log(`${c.toString()} CLEAR`); }
function fillCell(c)  { c.nextFilled = true;  log(`${c.toString()} FILL`);  }
function nextConway() {
  let tStart = new Date();

  // Generate the next wave.
  for (let [_, cell] of cells.cells) {
    let neighbors = cell.neighbors(cells);

    let numFilledNeighbors = neighbors.filter(n => n.filled).length;

    if (cell.filled) {
      // Any live cell with fewer than two live neighbours dies, as if caused by under-population.
      if (numFilledNeighbors < 2) { clearCell(cell); }

      // Any live cell with two or three live neighbours lives on to the next generation.

      // Any live cell with more than three live neighbours dies, as if by over-population.
      if (numFilledNeighbors > 3) { clearCell(cell); }
    } else {
      // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
      if (numFilledNeighbors == 3) { fillCell(cell); }
    }
  }


  // Now move the values over.
  for (let [_, cell] of cells.cells) {
    cell.filled = cell.nextFilled;
  }

  let tEnd = new Date();
  var durString = String(tEnd - tStart) + 'ms';

  log(`Conway'd ${cells.count} in ${durString}`);
}

function step() {
  nextConway();
  draw();
  timer = setTimeout(function() { requestAnimationFrame(step); }, 500);
}

function stop() {
  clearTimeout(timer);
}

function log(msg) {
  if (enableLog) { console.log(msg); }
}

// Kicker off.
document.addEventListener("DOMContentLoaded", function() {
  cells = new CellGrid(16);
  cells.random(0.5);

  svg = d3.select("main").append("svg")
    .attr("width", width)
    .attr("height", height)
  ;

  hexagons = svg
    .append('g')
    .attr('class', 'hexagons')
    .attr('transform', 'translate(400, 400)')
  ;

  // Stroke perimeter.
  svg.append('line').attr('stroke', darkGray).attr('x1', 0).attr('y1', 0).attr('x2', width).attr('y2', 0);
  svg.append('line').attr('stroke', darkGray).attr('x1', width).attr('y1', 0).attr('x2', width).attr('y2', height);
  svg.append('line').attr('stroke', darkGray).attr('x1', width).attr('y1', height).attr('x2', 0).attr('y2', height);
  svg.append('line').attr('stroke', darkGray).attr('x1', 0).attr('y1', height).attr('x2', 0).attr('y2', 0);

  draw();
  step();
});
