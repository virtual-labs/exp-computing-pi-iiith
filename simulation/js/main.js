// CONSTANTS
// ---------

/** Input element for number of processes. */
const IPROCESSES   = document.getElementById('numProcesses');
/** Output element for number of processes. */
const OPROCESSES   = document.getElementById('numProcessesValue');
/** Input element for number of intervals. */
const IINTERVALS   = document.getElementById('numSubIntervals');
/** Output element for number of intervals. */
const OINTERVALS   = document.getElementById('numSubIntervalsValue');
/** Canvas element for computation visualization. */
const CCOMPUTATION = document.getElementById('integrationCanvas');
/** Output element for the approximated value of π. */
const ORESULT      = document.getElementById('approximatedPi');
/** Output element for the computation time. */
const ORUNTIME     = document.getElementById('computationTime');
/** Element for quiz questions. */
const EQUIZ        = document.getElementById('questionContainer');
/** Start button. */
const BSTART       = document.getElementById('startButton');
/** Reset button. */
const BRESET       = document.getElementById('resetButton');

/** Trapezoid fill style. */
const TRAPEZOID_FILL = 'rgba(100, 100, 255, 0.5)';



// PARAMETERS
// ----------

var simulation = {
  processCount: 2,
  subIntervals: 50,
  intervals: [],
  answers: [],
  startTime: 0,
  states: [],
  promises: [],
  pausedProcess: -1,
  processTimes: [],
  totalTime: 0,
  totalProcessTime: 0
};

/** Renamed to `processCount` */
let numProcesses = 2;
/** Renamed to `subIntervals` */
let numSubIntervals = 50;
/** Renamed to `intervals` */
let intervals = [];
/** Renamed to `answers` */
let answers = [];
/** Renamed to `startTime` */
let startTime = 0;

/** Renamed to `states` */
let processState = []; // Tracks whether each process is paused or running
/** Renamed to `promises` */
let processPromises = []; // To hold the promises for each process
/** Renamed to `pausedProcess` */
let pausedProcess = -1; // Track which process is paused

/** Renamed to `processTimes` */
let processTimes = [];  // Array to store time taken by each process
/** Renamed to `totalTime` */
let totalComputationTime = 0;  // Total computation time
/** Renamed to `totalProcessTime` */
let singleProcessTime = 0;  // Time for the single process version




// FUNCTIONS
// ---------

/**
 * Delay the execution by a given number of milliseconds.
 * @param {number} ms delay in milliseconds
 * @returns {Promise} a promise that resolves after the delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Get the y-coordinate of a point on the unit circle, given the x-coordinate.
 * @param {number} x x-coordinate
 * @returns {number} y-coordinate
 */
function circleY(x) {
  return Math.sqrt(1 - x*x);
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
 * Draw all trapezoids for the unit circle.
 * @param {number} steps number of steps
 */
function drawAllTrapezoids(steps) {
  var ctx = CCOMPUTATION.getContext('2d');
  var cw  = CCOMPUTATION.width;
  var ch  = CCOMPUTATION.height;
  var tw  = cw / steps;
  // Clear canvas.
  ctx.clearRect(0, 0, cw, ch);
  // Draw the trapezoids.
  for (var i=0; i<steps; ++i) {
    var x0 =  i * tw;
    var x1 = (i + 1) * tw;
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


// Simulate the calculation for each process
async function calculatePi() {
  startTime = Date.now();
  answers = [];
  const subIntervalLength = numSubIntervals / numProcesses;
  let promises = [];
  let processResults = [];
  const ctx = CCOMPUTATION.getContext('2d');

  // Start by calculating the time for the single-process version (for speedup calculation)
  singleProcessTime = await calculateSingleProcessTime();

  // Loop through processes and simulate the computation
  for (let p = 0; p < numProcesses; p++) {
    let start = p * subIntervalLength;
    let end = (p + 1) * subIntervalLength;

    // Record the start time for each process
    let processStartTime = Date.now();

    // Simulate process computation and drawing trapezoids
    processResults.push(new Promise(async (resolve) => {
      const result = circleIntegration(start / numSubIntervals, end / numSubIntervals, numSubIntervals);
      answers.push(result);

      // Record the start time for this process
      let processStartTime = Date.now();

      // Draw the trapezoids assigned to this process
      for (let i = start; i < end; i++) {
        let x0 = i * (CCOMPUTATION.width / numSubIntervals);
        let x1 = (i + 1) * (CCOMPUTATION.width / numSubIntervals);
        let y0 = circleY(x0 / CCOMPUTATION.width);
        let y1 = circleY(x1 / CCOMPUTATION.width);

        // Simulate process paused state
        while (processState[p] === 'paused') {
          await delay(100);  // Wait until the process is resumed
        }

        ctx.beginPath();
        ctx.moveTo(x0, CCOMPUTATION.height - y0 * CCOMPUTATION.height);
        ctx.lineTo(x1, CCOMPUTATION.height - y1 * CCOMPUTATION.height);
        ctx.lineTo(x1, CCOMPUTATION.height);
        ctx.lineTo(x0, CCOMPUTATION.height);
        ctx.closePath();
        ctx.fillStyle = 'rgba(100, 100, 255, 0.5)';
        ctx.fill();
        ctx.stroke();

        // Introduce a slight delay to simulate computation and show trapezoids being drawn
        await delay(500); // Change the delay time to control the speed of drawing
      }

      // Record the time taken for this process
      let processEndTime = Date.now();
      processTimes[p] = processEndTime - processStartTime;  // Time for the process
      resolve(result);
    }));
  }

  // Wait for all processes to complete their work
  await Promise.all(processResults);

  // Final aggregation of results to calculate Pi
  let finalPi = answers.reduce((a, b) => a + b, 0) * 4;
  totalComputationTime = Date.now() - startTime;  // Total computation time

  ORESULT.textContent = finalPi.toFixed(8);
  ORUNTIME.textContent = totalComputationTime;

  // Calculate efficiency metrics
  calculateEfficiencyMetrics();

  // Final visual update to show all trapezoids (if any left)
  drawAllTrapezoids(numSubIntervals);
}


// Set event listeners
IPROCESSES.addEventListener('input', (e) => {
  numProcesses = parseInt(e.target.value);
  OPROCESSES.textContent = numProcesses;
});


IINTERVALS.addEventListener('input', (e) => {
  numSubIntervals = parseInt(e.target.value);
  OINTERVALS.textContent = numSubIntervals;
});


BSTART.addEventListener('click', () => {
  calculatePi();  // Start the calculation with visual delay
  createProcessControls(numProcesses);  // Create controls for each process
});


// Reset Button
BRESET.addEventListener('click', () => {
  const ctx = CCOMPUTATION.getContext('2d');
  ORESULT.textContent = '0';
  ORUNTIME.textContent = '0';
  answers = [];
  ctx.clearRect(0, 0, CCOMPUTATION.width, CCOMPUTATION.height);  // Clear the canvas on reset
});


const progressBar = document.getElementById('progressBar');

// Inside the loop where each process completes:
let completedProcesses = 0;
let totalProcesses = numProcesses;

for (let p = 0; p < numProcesses; p++) {
  // Inside the Promise of each process:
  processResults.push(new Promise(async (resolve) => {
    // After drawing the trapezoids for the current process
    completedProcesses++;
    progressBar.value = (completedProcesses / totalProcesses) * 100;
    resolve(result);
  }));
}


async function calculateSingleProcessTime() {
  let start = Date.now();
  // Calculate Pi using a single process (same logic, but without parallelism)
  circleIntegration(0, numSubIntervals, numSubIntervals);
  return Date.now() - start;  // Return time taken by single process
}


function calculateEfficiencyMetrics() {
  // Sum of times taken by each process
  let totalProcessTime = processTimes.reduce((acc, time) => acc + time, 0);

  // Speedup: single process time / multi-process time
  let speedup = singleProcessTime / totalComputationTime;

  // Efficiency: Speedup / Number of processes
  let efficiency = speedup / numProcesses;

  // Display the metrics on the UI
  document.getElementById('speedup').textContent = `Speedup: ${speedup.toExponential()}`;
  document.getElementById('efficiency').textContent = `Efficiency: ${efficiency.toExponential()}`;

  // Display individual process times
  processTimes.forEach((time, index) => {
    document.getElementById(`process-time-${index}`).textContent = `Process ${index + 1} Time: ${time}ms`;
  });
}





const questions = [
  { question: "What is the trapezoidal rule used for?", answer: "Numerical integration to approximate area under a curve." },
  { question: "What happens when you increase the number of processes?", answer: "It can reduce computation time but may introduce communication overhead." },
  { question: "What is the importance of dividing the task into smaller subintervals?", answer: "It allows parallel computation, improving efficiency." },
  // Add more questions as needed
];

// Display questions dynamically
function displayQuestions() {
  questions.forEach((q, index) => {
    let div = document.createElement('div');
    div.classList.add('question-item');
    div.innerHTML = `<span>Q${index + 1}:</span> ${q.question}`;
    EQUIZ.appendChild(div);
  });
}

// Call the function to display questions
displayQuestions();


// Create controls for each process
function createProcessControls(numProcesses) {
  const processControls = document.getElementById('process-controls');
  processControls.innerHTML = ''; // Clear previous controls

  for (let i = 0; i < numProcesses; i++) {
    const controlDiv = document.createElement('div');
    controlDiv.classList.add('process-control');

    const pauseButton = document.createElement('button');
    pauseButton.textContent = `Pause Process ${i + 1}`;
    pauseButton.onclick = () => toggleProcess(i);

    const statusText = document.createElement('span');
    statusText.textContent = 'Running';
    statusText.classList.add('status-text');
    statusText.id = `status-process-${i}`;

    controlDiv.appendChild(pauseButton);
    controlDiv.appendChild(statusText);

    processControls.appendChild(controlDiv);

    // Initialize process state
    processState[i] = 'running'; // All processes start as running
  }
}

// Toggle pause/resume state of a process
function toggleProcess(processIndex) {
  if (processState[processIndex] === 'running') {
    processState[processIndex] = 'paused';
    document.getElementById(`status-process-${processIndex}`).textContent = 'Paused';
    document.getElementById(`status-process-${processIndex}`).style.color = 'red';
  } else {
    processState[processIndex] = 'running';
    document.getElementById(`status-process-${processIndex}`).textContent = 'Running';
    document.getElementById(`status-process-${processIndex}`).style.color = 'green';
  }
}
