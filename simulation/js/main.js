// CONSTANTS
// ---------

/** Input element for number of processes. */
const IPROCESSES = document.getElementById('processes-input');
/** Output element for number of processes. */
const OPROCESSES = document.getElementById('processes-output');
/** Input element for number of intervals. */
const IINTERVALS = document.getElementById('intervals-input');
/** Output element for number of intervals. */
const OINTERVALS = document.getElementById('intervals-output');
/** Canvas element for computation visualization. */
const CDISPLAY   = document.getElementById('display');
/** Output element for the computation time. */
const ORUNTIME   = document.getElementById('runtime');
/** Element for the span time. */
const OSPANTIME  = document.getElementById('spantime');
/** Output element for the approximated value of π. */
const ORESULT    = document.getElementById('result');
/** Element for quiz questions. */
const EQUIZ      = document.getElementById('quiz');
/** Start button. */
const BSTART     = document.getElementById('start');
/** Reset button. */
const BRESET     = document.getElementById('reset');
/** Process controls. */
const IPROCESS_CONTROLS = document.getElementById('process-controls');
/** Process details. */
const IPROCESS_DETAILS  = document.getElementById('process-details');

/** Base tick duration in milliseconds. */
const BASE_TICK = 1000;
/** Trapezoid fill style. */
const TRAPEZOID_FILL = 'rgba(100, 100, 255, 0.5)';



// PARAMETERS
// ----------

var simulation = {
  /** Begin time of the simulation. */
  beginTime: 0,
  /** End time of the simulation. */
  endTime: -1,
  /** Number of processes. */
  processes: 2,
  /** Number of intervals. */
  intervals: 50,
  /** Interval IDs that have been processed. */
  processed: [],
  /** Has each process finished? */
  finished: [],
  /** Runtime of each process. */
  runtimes: [],
  /** Speeds of each process. */
  speeds: [],
  /** Next interval to process for each process. */
  nextIntervals: [],
  /** Timers for each process. */
  timers: [],
  /** Timer for checking if all processes have finished. */
  finishedTimer: null
};




// FUNCTIONS
// ---------

/** Main function. */
function main() {
  var s = simulation;
  // Show number of processes and intervals.
  IPROCESSES.oninput = function() {
    s.processes = parseInt(this.value, 10);
    OPROCESSES.textContent = s.processes.toString();
  }
  IINTERVALS.oninput = function() {
    s.intervals = parseInt(this.value, 10);
    OINTERVALS.textContent = s.intervals.toString();
  }
  // Handle buttons.
  BSTART.onclick = function() {
    stopSimulation();
    startSimulation();
  }
  BRESET.onclick = stopSimulation;
  // Initialize the simulation.
  stopSimulation();
  console.log('Not just bread and butter, add paneer too. -wolfram77')
}
main();


/**
 * Start the simulation.
 */
function startSimulation() {
  var s = simulation;
  var P = s.processes;
  s.beginTime = Date.now();
  s.processed = [];
  s.finished  = new Array(P).fill(false);
  s.runtimes  = new Array(P).fill(0);
  s.speeds    = new Array(P).fill(1);
  s.timers    = new Array(P).fill(null);
  s.nextIntervals = new Array(P).fill(0);
  // Launch processes.
  for (var p=0; p<P; ++p) {
    var t = BASE_TICK / s.speeds[p];
    s.timers[p] = setInterval(runProcess, t, p);
  }
  // Prepare to draw.
  clearDisplay();
  hideSimulationControls();
  drawProcessControls();
  drawProcessDetails();
  drawResults();
  // Check if all processes have finished.
  s.finishedTimer = setInterval(() => {
    drawResults();
    if (!s.finished.every(x => x)) return;
    clearInterval(s.finishedTimer);
  }, 500);
}


/**
 * Stop the simulation.
 */
function stopSimulation() {
  var s = simulation;
  s.beginTime = 0;
  s.endTime   = -1;
  s.processed = [];
  s.finished  = [];
  s.runtimes  = [];
  s.speeds    = [];
  s.nextIntervals = [];
  // Stop all timers.
  for (var timer of s.timers)
    if (timer != null) clearInterval(timer);
  s.timers = [];
  // Stop the finished timer.
  if (s.finishedTimer != null) clearInterval(s.finishedTimer);
  s.finishedTimer = null;
  // Clear the display, results, and process controls.
  clearDisplay();
  clearResults();
  showSimulationControls();
  clearProcessControls();
  clearProcessDetails();
}


/**
 * Run a process.
 * @param {number} p process ID
 */
function runProcess(p) {
  var s  = simulation;
  var N  = s.intervals / s.processes;
  var ib = Math.floor(p * N), ie = Math.floor((p + 1) * N);
  var ip = s.nextIntervals[p] || ib;
  if (ip < ie) {
    s.processed.push(ip);
    drawTrapezoid(ip, s.intervals);
    s.nextIntervals[p] = ++ip;
  }
  if (ip >= ie) finishProcess(p);
}


/**
 * Mark a process as finished.
 * @param {number} p process ID
 */
function finishProcess(p) {
  var s = simulation;
  // Mark the process as finished, and record the runtime.
  s.finished[p] = true;
  s.runtimes[p] = s.runtimes[p] || (Date.now() - s.beginTime);
  // Clear the timer.
  if (s.timers[p] == null) return;
  clearInterval(s.timers[p]);
  s.timers[p] = null;
}


/**
 * Change the speed of a process.
 * @param {number} p process ID
 * @param {number} speed new speed
 */
function changeProcessSpeed(p, speed) {
  var s = simulation;
  s.speeds[p] = speed;
  // Adjust the timer interval, if the process is running.
  if (s.timers[p] == null) return;
  clearInterval(s.timers[p]);
  var t = BASE_TICK / speed;
  s.timers[p] = setInterval(runProcess, t, p);
}


/**
 * Draw trapezoids for the unit circle.
 * @param {Array<number>} ids trapzoid IDs
 * @param {number} steps number of steps
 */
function drawTrapezoids(ids, steps) {
  var ctx = CDISPLAY.getContext('2d');
  var cw  = CDISPLAY.width;
  var ch  = CDISPLAY.height;
  var tw  = cw / steps;
  // Clear canvas.
  ctx.clearRect(0, 0, cw, ch);
  // Draw the trapezoids.
  for (var id of ids) {
    var x0 = Math.floor(id * tw);
    var x1 = Math.floor((id + 1) * tw);
    var y0 = circleY(x0/cw);
    var y1 = circleY(x1/cw);
    ctx.beginPath();
    ctx.moveTo(x0, ch - y0 * ch);
    ctx.lineTo(x1, ch - y1 * ch);
    ctx.lineTo(x1, ch);
    ctx.lineTo(x0, ch);
    ctx.closePath();
    ctx.fillStyle = TRAPEZOID_FILL;
    ctx.fill();
    ctx.stroke();
  }
}


/**
 * Draw a trapezoid for the unit circle.
 * @param {number} id trapezoid ID
 * @param {number} steps number of steps
 */
function drawTrapezoid(id, steps) {
  var ctx = CDISPLAY.getContext('2d');
  var cw  = CDISPLAY.width;
  var ch  = CDISPLAY.height;
  var tw  = cw / steps;
  // Draw the trapezoid.
  var x0 =  id * tw;
  var x1 = (id + 1) * tw;
  var y0 = circleY(x0/cw);
  var y1 = circleY(x1/cw);
  ctx.beginPath();
  ctx.moveTo(x0, ch - y0 * ch);
  ctx.lineTo(x1, ch - y1 * ch);
  ctx.lineTo(x1, ch);
  ctx.lineTo(x0, ch);
  ctx.closePath();
  ctx.fillStyle = TRAPEZOID_FILL;
  ctx.fill();
  ctx.stroke();
}


/**
 * Clear the display.
 */
function clearDisplay() {
  var ctx = CDISPLAY.getContext('2d');
  var cw  = CDISPLAY.width;
  var ch  = CDISPLAY.height;
  ctx.clearRect(0, 0, cw, ch);
}


/**
 * Draw the result details.
 */
function drawResults() {
  var s = simulation;
  var P = s.processes;
  // Update the computation time.
  var t = Date.now() - s.beginTime;
  ORUNTIME.textContent = (t/1000).toFixed(3);
  // Update the span time.
  var ts = 0;
  for (var p=0; p<P; ++p)
    ts += s.runtimes[p]? s.runtimes[p]: Date.now() - s.beginTime;
  OSPANTIME.textContent = (ts/1000).toFixed(3);
  // Update the approximated value of π.
  var pending = '';
  for (var p=0; p<P; ++p)
    pending += s.finished[p]? '' : `P${p}, `;
  pending = pending.slice(0, -2);
  var pi = pending? 0 : 4 * circleIntegration(0, 1, s.intervals);
  ORESULT.textContent = pending? `Pending ${pending}` : pi.toString();
}


/**
 * Clear the result details.
 */
function clearResults() {
  ORUNTIME.textContent  = '0';
  OSPANTIME.textContent = '0';
  ORESULT.textContent   = '0';
}


/**
 * Draw speed controls for each process.
 */
function drawProcessControls() {
  var s = simulation;
  var P = s.processes;
  IPROCESS_CONTROLS.innerHTML = '';
  for (let p=0; p<P; ++p) {
    // Create elements, assuming Bulma CSS.
    let field = document.createElement('div');
    field.className = 'field';
    let label = document.createElement('label');
    label.className = 'label';
    label.htmlFor = `speed-process-${p}`;
    label.textContent = `Adjust P${p + 1}'s speed`;
    let control = document.createElement('div');
    control.className = 'control';
    let input = document.createElement('input');
    input.type = 'range';
    input.id = `speed-process-${p}`;
    input.min = '1';
    input.max = '10';
    input.step = '1';
    input.value = '1';
    let help = document.createElement('p');
    help.className = 'help';
    help.textContent = `P${p + 1}'s speed: `;
    let span = document.createElement('span');
    span.id = `speed-process-${p}-value`;
    span.textContent = '1';
    // Append elements.
    help.appendChild(span);
    control.appendChild(input);
    field.appendChild(label);
    field.appendChild(control);
    field.appendChild(help);
    // Add event listener.
    input.oninput = function() {
      let speed = parseInt(this.value, 10);
      span.textContent = speed.toString();
      changeProcessSpeed(p, speed);
    }
    // Append elements.
    IPROCESS_CONTROLS.appendChild(field);
  }
}


/**
 * Clear process controls.
 */
function clearProcessControls() {
  IPROCESS_CONTROLS.innerHTML = '';
}


/**
 * Draw the details, what each process is doing.
 */
function drawProcessDetails() {
  var s = simulation;
  var P = s.processes;
  IPROCESS_DETAILS.innerHTML = '';
  // Append a header.
  var h3 = document.createElement('strong');
  h3.textContent = 'Process Details';
  IPROCESS_DETAILS.appendChild(h3);
  // Append divs for each process.
  for (let p=0; p<P; ++p) {
    var N  = s.intervals / P;
    var ib = Math.floor(p * N), ie = Math.floor((p + 1) * N);
    let div = document.createElement('div');
    div.id = `process-details-${p}`;
    div.textContent = `P${p+1} is computing area of trapezoids from ${ib+1} to ${ie}`;
    IPROCESS_DETAILS.appendChild(div);
  }
  // Append final divs.
  let div = document.createElement('div');
  div.textContent = 'The total area is the sum of all trapezoids.';
  IPROCESS_DETAILS.appendChild(div);
  div = document.createElement('div');
  div.textContent = 'The approximated value of π is 4 times the total area.';
  IPROCESS_DETAILS.appendChild(div);
}


/**
 * Clear the process details.
 */
function clearProcessDetails() {
  IPROCESS_DETAILS.innerHTML = '';
}


/**
 * Hide the simulation controls.
 */
function hideSimulationControls() {
  var e = document.getElementById('simulation-controls');
  e.style.display = 'none';
}


/**
 * Show the simulation controls.
 */
function showSimulationControls() {
  var e = document.getElementById('simulation-controls');
  e.style.display = 'block';
}


/**
 * Perform trapezoidal integration of unit circle, for a given range of x values.
 * @param {number} xb begin x value
 * @param {number} xe end x value
 * @param {number} steps number of steps
 * @returns {number} area under the curve
 */
function circleIntegration(xb, xe, steps) {
  var dx = (xe - xb)/steps;
  var a  = 0;
  for (var i=1; i<steps; ++i)
    a += circleY(xb + i*dx);
  a += (circleY(xb) + circleY(xe)) / 2;
  return a * dx;
}


/**
 * Get the y-coordinate of a point on the unit circle, given the x-coordinate.
 * @param {number} x x-coordinate
 * @returns {number} y-coordinate
 */
function circleY(x) {
  return Math.sqrt(1 - x*x);
}
