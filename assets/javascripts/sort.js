import 'sort.scss';
import Vue from 'vue';

const Compare = { LT: -1, EQ: 0, GT: 1 };
function compare(x, y) {
  if (x < y) return Compare.LT;
  if (x == y) return Compare.EQ;
  if (x > y) return Compare.GT;
}
function random(max) {
  return Math.floor(Math.random() * max);
}
function buildValues() {
  var values = [];
  var max = 256;

  for (var i = 0; i < 32; ++i) {
    var v = {
      value: random(max),
      current: false,
      compared: false
    };
    values.push(v);
  }

  return values;
}

class BubbleSort {
  constructor(app) {
    this.name = "Bubble Sort";
    this.app = app;

    // State data
    this.i = 0;
    this.max = this.app.values.length;
    this.swapped = false;
    this.complete = false;
  }

  next() {
    var i = this.i;
    var j = i + 1;
    var cmp = this.app.compare(i, j);

    if (cmp == Compare.GT) {
      this.app.swap(i, j);
      this.swapped = true;
    }

    this.i += 1;

    if (this.i >= this.max - 1) {
      if (this.swapped) {
        this.i = 0;
        this.swapped = false;
        this.max -= 1;
      } else {
        this.complete = true;
      }
    }
  }
}

class InsertionSort {
  constructor(app) {
    this.name = "Insertion Sort";
    this.app = app;

    // State
    this.i = 0; // main iterator
    this.j = 0; // for finding insertion index of v[i]
    this.k = null; // for keeping track of swap position
    this.complete = false;
  }

  next() {
    if (this.k != null) {
      this.app.swap(this.k, this.k - 1);
      this.k -= 1;
      if (this.k == this.j) {
        this.k = null;
        this.j = this.i;
      }
      return;
    }

    if (this.i == this.j) {
      this.i += 1;
      this.j = 0;
    }

    if (this.i == this.app.values.length) {
      this.complete = true;
      return;
    }

    var c = this.app.compare(this.i, this.j);

    if (c == Compare.LT) {
      this.k = this.i;
    } else {
      this.j += 1;
    }
  }
}

class SelectionSort {
  constructor(app) {
    this.app = app;
    this.name = "Selection Sort";
    this.length = this.app.values.length;

    // State
    this.i = 0; // main iterator
    this.j = null; // iterator for find smallest
    this.k = null; // current smallest index
    this.complete = false;
  }

  next() {
    if (this.j != null) {
      this.j += 1;

      if (this.j < this.length) {
        var c = this.app.compare(this.k, this.j);

        if (c == Compare.GT) {
          this.k = this.j;
        }
      } else {
        if (this.k != this.i) this.app.swap(this.i, this.k);
        this.k = null;
        this.j = null;
      }
    } else {
      this.app.clear({ flag0: true });

      this.k = this.i;
      this.j = this.i;

      this.app.select(this.i, { flag0: true });
    }

    if (this.k == null) {
      this.i += 1;
      if (this.i == this.length) {
        this.complete = true;
        this.app.clear({ flag0: true });
      }
    }
  }
}

class MergeSort {
  constructor(app) {
    this.app = app;
    this.name = "Merge Sort";

    // state
    this.i = 0;
    this.length = this.app.values.length;
    this.complete = false;
    this.stack = [{ function: this._divide, args: [0, this.length] }];
  }

  next() {
    var job = this.stack.pop();

    if (job) {
      job.function.apply(this, job.args);
    } else {
      this.complete = true;
      this.app.clear({ all: true });
    }
  }

  _divide(i, j) {
    var length = j - i;

    if (length <= 1) {
      return;
    }

    var m = i + length / 2;
    
    this.app.clear({ all: true });
    this.app.select(m, { flag0: true });
    this.app.selectRange(i, m, { flag1: true });
    this.app.selectRange(m, j, { flag2: true });

    this.stack.push({ function: this._merge, args: [i, j] });
    this.stack.push({ function: this._divide, args: [i, m] });
    this.stack.push({ function: this._divide, args: [m, j] });
  }

  _merge(i, j) {
    this.app.clear({ all: true });
    this.app.selectRange(i, j, { flag0: true });
    
    var length = j - i;
    var m = i + length / 2;
    
    switch(length) {
      case 1:
        break;
        
      case 2: 
        var c = this.app.compare(i, i + 1, { clear: false });
        
        if (c == Compare.GT) {
          this.app.swap(i, i + 1);
        }
        
        break;
      
      default:
        this.app.selectRange(i, m, { flag1: true });
        this.app.selectRange(m, j, { flag2: true, clear: false });
        
        var side = [];
        
        var iLow = i;
        var iHigh = m;
        
        for(var k = i; k < j; ++k) {
          var c;
          
          if (iHigh < j) {
            c = this.app.compare(iLow, iHigh);
          }
          
          if (iLow < m && (iHigh >= j || (c == Compare.LT || c == Compare.EQ))) {
            side.push(this.app.read(iLow));
            iLow += 1;
          } else {
            side.push(this.app.read(iHigh));
            iHigh += 1;
          }
        }
        
        // Copy back from side to values.
        for (var n = 0; n < length; ++n) {
          this.app.write(i + n, side[n]);
        }
        
        break;
    }
  }
}

// Application

function newApp() {
  var values = buildValues();

  // Return Vue.
  return new Vue({
    el: "#app",
    destroy: function() {
      this.$destroy();
    },
    data: {
      values: values,

      algorithm: null,
      algorithm_name: null,
      comparisons: 0,
      swaps: 0,
      flags: ['current', 'compared', 'flag0', 'flag1', 'flag2']
    },

    methods: {
      clear: function(options) {
        let defaults = {
          current: true,
          compared: true
        };
        
        var opts = Object.assign(defaults, options || {});
        var _this = this;
        
        this.flags.forEach(function(flag) {
          if (opts[flag] || opts.all) {
            _this
              .values
              .filter(x => x[flag])
              .forEach(c => c[flag] = false)
          }
        });
      },

      compare: function(i, j, options) {
        console.log("compare " + i + ", " + j)
        var defaults = {
          clear: true,
          current: true,
          compared: true
        };
        
        var opts = Object.assign(defaults, options || {});
        
        if (opts.clear) {
          this.clear(); 
        }
        
        this.values[i].current = opts.current;
        this.values[j].compared = opts.compared;
        this.comparisons += 1;
        
        return compare(this.values[i].value, this.values[j].value);
      },

      read: function(i) { return this.values[i].value },
      
      select: function(i, options) {
        let defaults = { 
          clear: true, 
          current: true 
        };
        
        var opts = Object.assign(defaults, options || {});
        if (opts.clear) this.clear();
        
        var value = this.values[i];
        this.flags.forEach((flag) => value[flag] = opts[flag] || opts.all);
      },

      selectRange: function(range_start, range_end, options) {
        let defaults = {
          clear: true,
          current: true
        };
        
        var opts = Object.assign(defaults, options || {});
        if (opts.clear) this.clear({ all: true });

        for (var i = range_start; i < range_end; ++i) {
          this.flags.forEach((flag) => this.values[i][flag] = opts[flag]);
        }
      },

      swap: function(i, j) {
        var s = this.values[j].value;
        this.values[j].value = this.values[i].value;
        this.values[i].value = s;
        this.swaps += 1;
      },

      write: function(i, v) {
        if (!v) { console.log("Write A[" + i + "] = " + v) }
        this.values[i].value = v;
        this.swaps += 1;
      },
      
      _stop: function() {
        clearTimeout(this.algorithmTimer);
        this.clear();
      },
      _start: function(algorithm) {
        this._stop();
        delete this.algorithm;

        this.swaps = 0;
        this.comparisons = 0;
        this.algorithm_name = algorithm.name;
        this.algorithm = algorithm;

        var c;
        var _this = this;

        c = function() {
          _this.algorithm.next();

          if (algorithm.complete) {
            _this.clear();
          } else {
            _this.algorithmTimer = setTimeout(c, 32);
          }
        };

        c();
      },

      newList: function() {
        this._stop();
        var values = buildValues();
        this.values = values;
      },
      bubbleSort: function() {
        this._start(new BubbleSort(this));
      },
      insertionSort: function() {
        this._start(new InsertionSort(this));
      },
      selectionSort: function() {
        this._start(new SelectionSort(this));
      },
      mergeSort: function() {
        this._start(new MergeSort(this));
      },
      quickSortLomuto: function() {
        this._start(new quickSortLomuto(this));
      },
      quickSortHoare: function() {
        this._start(new quickSortHoare(this));
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", function(event) {
  var app = newApp();
});
