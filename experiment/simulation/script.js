        class PiSimulation {
            MAX_VISUAL_ITEMS = 2000;

            constructor() {
                this.currentExperiment = 'monte-carlo';
                this.isRunning = false;
                this.processes = [];
                this.animationSpeed = 1.0;
                this.setupEventListeners();
                this.switchExperiment('monte-carlo');
            }

            setupEventListeners() {
                document.getElementById('experimentMethodSelector').addEventListener('change', (e) => {
                    this.switchExperiment(e.target.value);
                });
                document.getElementById('startBtn').addEventListener('click', () => this.startSimulation());
                document.getElementById('processCountSelector').addEventListener('change', () => this.initializeProcesses());
                document.getElementById('downloadMPICode').addEventListener('click', () => this.downloadMPICode());
                
                // Speed control
                const speedSlider = document.getElementById('speedSlider');
                const speedValue = document.getElementById('speedValue');
                speedSlider.addEventListener('input', (e) => {
                    this.animationSpeed = parseFloat(e.target.value);
                    speedValue.textContent = `${this.animationSpeed.toFixed(1)}x`;
                });
            }

            getAnimationDelay(baseDelay) {
                return baseDelay / this.animationSpeed;
            }

            switchExperiment(experiment) {
                if (this.isRunning) return;
                this.currentExperiment = experiment;
                document.getElementById('experimentMethodSelector').value = experiment;
                document.getElementById('precisionLabel').textContent = `Precision (${experiment === 'monte-carlo' ? 'Points' : 'Slices'})`;
                this.setupExperimentUI();
                this.resetStats();
            }

            setupExperimentUI() {
                const content = document.getElementById('experimentContent');
                if (this.currentExperiment === 'monte-carlo') {
                    content.innerHTML = `
                        <div class="pi-circle-container">
                            <div class="pi-circle">
                                <div class="pi-quarter-circle"></div>
                                <div class="pi-points" id="piPoints"></div>
                            </div>
                        </div>`;
                } else {
                    content.innerHTML = `
                        <div class="riemann-container">
                            <div class="riemann-graph">
                                <svg class="riemann-svg" id="riemannSvg"></svg>
                            </div>
                        </div>`;
                    this.setupRiemannGraph();
                }
                this.initializeProcesses();
            }

            setupRiemannGraph() {
                const svg = document.getElementById('riemannSvg');
                if (!svg) return;
                
                const width = 400, height = 400;
                const margin = 40;
                const graphWidth = width - 2 * margin;
                const graphHeight = height - 2 * margin;
                
                const curvePoints = [];
                for (let i = 0; i <= 100; i++) {
                    const x = i / 100;
                    const y = Math.sqrt(1 - x * x);
                    const svgX = margin + x * graphWidth;
                    const svgY = height - margin - y * graphHeight;
                    curvePoints.push(`${svgX},${svgY}`);
                }
                const curvePath = `M ${curvePoints.join(' L ')}`;
                
                svg.innerHTML = `
                    <defs>
                        <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <line x1="${margin}" y1="${height - margin}" x2="${width - margin}" y2="${height - margin}" class="riemann-axis-line"/>
                    <line x1="${margin}" y1="${margin}" x2="${margin}" y2="${height - margin}" class="riemann-axis-line"/>
                    <path id="quarterCircle" d="${curvePath}" 
                          class="riemann-curve-path" stroke="url(#curveGradient)"/>
                    <g id="rectangles"></g>
                `;
            }

            initializeProcesses() {
                const processCount = parseInt(document.getElementById('processCountSelector').value);
                const grid = document.getElementById('processGrid');
                grid.innerHTML = '';
                grid.style.gridTemplateColumns = `repeat(${Math.min(processCount, 4)}, 1fr)`;
                this.processes = [];
                
                for (let i = 0; i < processCount; i++) {
                    const node = document.createElement('div');
                    node.className = 'process-node';
                    node.innerHTML = `
                        <div class="process-id">P${i} ${i === 0 ? '(Master)' : ''}</div>
                        <div class="process-status">Idle</div>
                    `;
                    grid.appendChild(node);
                    this.processes.push({ id: i, node });
                }
            }

            async startSimulation() {
                if (this.isRunning) return;
                this.isRunning = true;
                document.getElementById('startBtn').disabled = true;
                
                this.resetStats();
                this.setupExperimentUI();

                const processCount = document.getElementById('processCountSelector').value;
                const method = this.currentExperiment === 'monte-carlo' ? 'Monte Carlo' : 'Riemann Sum';
                this.addLog(`Starting ${method} simulation with ${processCount} processes`, 'info');

                const runFunction = this.currentExperiment === 'monte-carlo' ? this.runMonteCarlo.bind(this) : this.runRiemannSum.bind(this);
                const piResult = await runFunction();
                
                // Update the Pi value display
                document.getElementById('piValue').textContent = piResult.toFixed(8);
                this.addLog(`Pi calculation completed: π ≈ ${piResult.toFixed(8)}`, 'success');
                this.processes.forEach(p => this.updateProcessStatus(p.id, 'Finished'));
                
                this.isRunning = false;
                document.getElementById('startBtn').disabled = false;
            }

            async runMonteCarlo() {
                const totalPoints = parseInt(document.getElementById('precisionSelector').value);
                const pointsPerProcess = Math.ceil(totalPoints / this.processes.length);
                let visualizedItems = 0;
                
                this.addLog(`Scattering ${pointsPerProcess.toLocaleString()} points per process`, 'info');
                await this.visualizeCommunication('scatter', `Assigning ${pointsPerProcess.toLocaleString()} points`);
                
                this.addLog('Starting parallel Monte Carlo sampling', 'info');
                const computePromises = this.processes.map(p => {
                    return new Promise(resolve => {
                        this.updateProcessStatus(p.id, 'Computing');
                        let localInside = 0;
                        for (let j = 0; j < pointsPerProcess; j++) {
                            const x = Math.random(), y = Math.random();
                            const isInside = x * x + y * y <= 1;
                            if (isInside) localInside++;
                            if (visualizedItems++ < this.MAX_VISUAL_ITEMS) this.drawPiPoint(x, y, isInside);
                        }
                        this.updateProgress(20 + (p.id + 1) / this.processes.length * 50);
                        resolve(localInside);
                    });
                });
                const results = await Promise.all(computePromises);
                
                this.addLog('Reducing partial results from all processes', 'info');
                await this.visualizeCommunication('reduce', `Receiving partial counts`);
                const totalInside = results.reduce((sum, val) => sum + val, 0);

                this.updateProgress(100);
                const piEstimate = 4 * (totalInside / (pointsPerProcess * this.processes.length));
                this.addLog(`Found ${totalInside} points inside circle out of ${pointsPerProcess * this.processes.length}`, 'success');
                return piEstimate;
            }

            drawPiPoint(x, y, isInside) {
                const point = document.createElement('div');
                point.className = `pi-point ${isInside ? 'inside' : 'outside'}`;
                // Scale coordinates to fit within the quarter circle visualization
                point.style.left = `${x * 100}%`;
                point.style.top = `${(1 - y) * 100}%`; // Flip Y coordinate for proper display
                const pointsContainer = document.getElementById('piPoints');
                if (pointsContainer) {
                    pointsContainer.appendChild(point);
                }
            }

            async runRiemannSum() {
                const numSlices = parseInt(document.getElementById('precisionSelector').value);
                const numProcesses = this.processes.length;
                const slicesPerProcess = Math.ceil(numSlices / numProcesses);
                
                const rectsContainer = document.getElementById('rectangles');
                if (rectsContainer) rectsContainer.innerHTML = '';
                
                this.addLog(`Scattering ${slicesPerProcess.toLocaleString()} slices per process`, 'info');
                await this.visualizeCommunication('scatter', `Assigning ${slicesPerProcess.toLocaleString()} slices`);

                this.addLog('Starting parallel Riemann sum computation', 'info');
                const totalVisualRects = Math.min(numSlices, this.MAX_VISUAL_ITEMS);

                const computePromises = this.processes.map((p, processId) => {
                    return new Promise(resolve => {
                        this.updateProcessStatus(processId, 'Computing');
                        
                        const startIndex = processId * slicesPerProcess;
                        const endIndex = Math.min(startIndex + slicesPerProcess, numSlices);
                        const numSlicesForProcess = endIndex - startIndex;
                        
                        let localArea = 0;
                        const rectsForViz = [];
                        
                        if (numSlicesForProcess > 0) {
                            const visualRectsForProcess = Math.ceil((numSlicesForProcess / numSlices) * totalVisualRects);
                            const vizStep = Math.max(1, Math.floor(numSlicesForProcess / visualRectsForProcess));
                            
                            for (let i = startIndex; i < endIndex; i++) {
                                const x = i / numSlices;
                                const height = Math.sqrt(1 - x * x);
                                const width = 1 / numSlices;
                                localArea += height * width;
                                
                                if ((i - startIndex) % vizStep === 0) {
                                    const representativeWidth = vizStep / numSlices;
                                    rectsForViz.push({
                                        x: x,
                                        height: height,
                                        width: representativeWidth,
                                        processId: processId
                                    });
                                }
                            }
                        }
                        this.updateProgress(20 + (processId + 1) / numProcesses * 50);
                        resolve({ area: localArea, vizRects: rectsForViz });
                    });
                });

                const results = await Promise.all(computePromises);
                
                const allVizRects = results.flatMap(r => r.vizRects);
                await this.animateRiemannRectangles(allVizRects);
                
                this.updateProgress(80);
                
                this.addLog('Reducing partial areas from all processes', 'info');
                await this.visualizeCommunication('reduce', `Receiving partial areas`);
                const totalArea = results.reduce((sum, r) => sum + r.area, 0);
                
                this.updateProgress(100);
                const piEstimate = 4 * totalArea;
                this.addLog(`Computed total area: ${totalArea.toFixed(8)}`, 'success');
                return piEstimate;
            }

            async animateRiemannRectangles(rectangles) {
                const svg = document.getElementById('riemannSvg');
                const rectsContainer = document.getElementById('rectangles');
                if (!svg || !rectsContainer) return;
                
                const width = 400, height = 400;
                const margin = 40;
                const graphWidth = width - 2 * margin;
                const graphHeight = height - 2 * margin;
                
                const allSvgRects = [];
                rectangles.forEach(rect => {
                    const svgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    svgRect.setAttribute('x', margin + rect.x * graphWidth);
                    svgRect.setAttribute('y', height - margin - rect.height * graphHeight);
                    svgRect.setAttribute('width', rect.width * graphWidth + 0.5);
                    svgRect.setAttribute('height', rect.height * graphHeight);
                    svgRect.setAttribute('class', `riemann-rect process-${rect.processId}`);
                    
                    rectsContainer.appendChild(svgRect);
                    allSvgRects.push({ element: svgRect, processId: rect.processId });
                });
                
                const rectsByProcess = {};
                allSvgRects.forEach(svgRect => {
                    if (!rectsByProcess[svgRect.processId]) rectsByProcess[svgRect.processId] = [];
                    rectsByProcess[svgRect.processId].push(svgRect.element);
                });

                const animationPromises = Object.keys(rectsByProcess).map(processId => {
                    return new Promise(resolve => {
                        const processRects = rectsByProcess[processId];
                        if (processRects.length === 0) {
                            resolve();
                            return;
                        }
                        
                        const delay = this.getAnimationDelay(1500) / processRects.length;
                        
                        processRects.forEach((element, i) => {
                            setTimeout(() => {
                                element.classList.add('visible');
                            }, i * delay);
                        });

                        setTimeout(resolve, processRects.length * delay);
                    });
                });
                
                await Promise.all(animationPromises);
            }

            async visualizeCommunication(type, message) {
                const masterNode = this.processes[0].node;
                const workerNodes = this.processes.slice(1).map(p => p.node);

                if (type === 'scatter') {
                    this.updateProgress(10);
                    this.updateProcessStatus(0, message);
                    masterNode.classList.add('sending');
                    workerNodes.forEach(node => node.classList.add('receiving'));
                } else if (type === 'reduce') {
                    this.updateProcessStatus(0, message);
                    masterNode.classList.add('receiving');
                    workerNodes.forEach((node, i) => {
                        this.updateProcessStatus(i + 1, 'Sending result');
                        node.classList.add('sending');
                    });
                }
                
                await new Promise(resolve => setTimeout(resolve, this.getAnimationDelay(1000)));
                
                this.processes.forEach(p => p.node.classList.remove('sending', 'receiving'));
            }

            updateProcessStatus(processId, status) {
                const p = this.processes[processId];
                if(p && p.node) {
                    p.node.querySelector('.process-status').textContent = status;
                    p.node.classList.remove('computing');
                    if(status.toLowerCase() === 'computing') p.node.classList.add('computing');
                }
            }
            
            updateProgress(percentage) {
                // Progress bar removed - no longer needed
                // Just log progress to console for debugging if needed
                console.log(`Progress: ${percentage}%`);
            }

            resetStats() {
                this.updateConfigDisplay();
                this.updateProgress(0);
                this.clearLogs();
                this.addLog('System reset and ready for simulation', 'info');
            }

            addLog(message, type = 'info') {
                const logsContainer = document.getElementById('logsContainer');
                if (!logsContainer) return;

                const now = new Date();
                const timeStr = now.toTimeString().split(' ')[0];
                
                const logEntry = document.createElement('div');
                logEntry.className = `log-entry ${type}`;
                logEntry.innerHTML = `
                    <span class="log-time">${timeStr}</span>
                    <span class="log-message">${message}</span>
                `;
                
                logsContainer.appendChild(logEntry);
                logsContainer.scrollTop = logsContainer.scrollHeight;
            }

            clearLogs() {
                const logsContainer = document.getElementById('logsContainer');
                if (logsContainer) {
                    logsContainer.innerHTML = `
                        <div class="log-entry">
                            <span class="log-time">00:00:00</span>
                            <span class="log-message">System initialized and ready</span>
                        </div>
                    `;
                }
            }

            updateConfigDisplay() {
                const processCount = document.getElementById('processCountSelector').value;
                const method = this.currentExperiment === 'monte-carlo' ? 'Monte Carlo' : 'Riemann Sum';
                
                document.getElementById('processCount').textContent = processCount;
                document.getElementById('calculationMethod').textContent = method;
                document.getElementById('piValue').textContent = '3.14159';
            }

            downloadMPICode() {
                const processCount = document.getElementById('processCountSelector').value;
                const method = this.currentExperiment;
                
                const mpiCode = this.generateMPICode(processCount, method);
                
                const blob = new Blob([mpiCode], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pi_calculation_mpi_${method}_${processCount}proc.c`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            generateMPICode(processCount, method) {
                if (method === 'monte-carlo') {
                    return this.generateMonteCarloMPICode(processCount);
                } else {
                    return this.generateRiemannSumMPICode(processCount);
                }
            }

            generateMonteCarloMPICode(processCount) {
                return `#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>

#define NUM_PROCESSES ${processCount}
#define TOTAL_POINTS 1000000

int main(int argc, char** argv) {
    int rank, size;
    long long points_per_process, points_in_circle = 0, total_in_circle = 0;
    double x, y, pi_estimate;
    
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    if (size != NUM_PROCESSES) {
        if (rank == 0) {
            printf("This program requires exactly %d processes.\\n", NUM_PROCESSES);
        }
        MPI_Finalize();
        return 1;
    }
    
    // Calculate points per process
    points_per_process = TOTAL_POINTS / NUM_PROCESSES;
    
    // Seed random number generator with unique value for each process
    srand(time(NULL) + rank);
    
    printf("Process %d: Generating %lld random points...\\n", rank, points_per_process);
    
    // Monte Carlo simulation - generate random points and count those inside unit circle
    for (long long i = 0; i < points_per_process; i++) {
        x = (double)rand() / RAND_MAX * 2.0 - 1.0;  // Random x in [-1, 1]
        y = (double)rand() / RAND_MAX * 2.0 - 1.0;  // Random y in [-1, 1]
        
        // Check if point is inside unit circle
        if (x * x + y * y <= 1.0) {
            points_in_circle++;
        }
    }
    
    printf("Process %d: Found %lld points inside circle\\n", rank, points_in_circle);
    
    // Reduce all partial results to get total count
    MPI_Reduce(&points_in_circle, &total_in_circle, 1, MPI_LONG_LONG, MPI_SUM, 0, MPI_COMM_WORLD);
    
    if (rank == 0) {
        // Calculate Pi estimate: Pi = 4 * (points_in_circle / total_points)
        pi_estimate = 4.0 * (double)total_in_circle / TOTAL_POINTS;
        
        printf("\\n=== MONTE CARLO PI ESTIMATION RESULTS ===\\n");
        printf("Total points generated: %d\\n", TOTAL_POINTS);
        printf("Points inside unit circle: %lld\\n", total_in_circle);
        printf("Estimated value of Pi: %.10f\\n", pi_estimate);
        printf("Actual value of Pi: %.10f\\n", M_PI);
        printf("Error: %.10f\\n", fabs(pi_estimate - M_PI));
        printf("Processes used: %d\\n", NUM_PROCESSES);
    }
    
    MPI_Finalize();
    return 0;
}

/*
 * Compilation: mpicc -o pi_monte_carlo pi_calculation_mpi_monte-carlo_${processCount}proc.c -lm
 * Execution: mpirun -np ${processCount} ./pi_monte_carlo
 * 
 * This MPI program estimates Pi using Monte Carlo method with ${processCount} processes.
 * Each process generates random points and counts those inside the unit circle.
 * The final Pi estimate is calculated as 4 * (total_points_in_circle / total_points).
 * 
 * Monte Carlo Method:
 * - Generate random points (x,y) in the square [-1,1] × [-1,1]
 * - Count points that fall inside the unit circle (x² + y² ≤ 1)
 * - Pi ≈ 4 × (points_in_circle / total_points)
 * - Accuracy improves with more sample points
 */`;
            }

            generateRiemannSumMPICode(processCount) {
                return `#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#define NUM_PROCESSES ${processCount}
#define TOTAL_INTERVALS 10000000

double function(double x) {
    // Function: f(x) = 4 / (1 + x²)
    // Integral from 0 to 1 gives Pi
    return 4.0 / (1.0 + x * x);
}

int main(int argc, char** argv) {
    int rank, size;
    long long intervals_per_process, i;
    double h, local_sum = 0.0, total_sum = 0.0, pi_estimate;
    double x_start, x_end, x;
    
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
    
    if (size != NUM_PROCESSES) {
        if (rank == 0) {
            printf("This program requires exactly %d processes.\\n", NUM_PROCESSES);
        }
        MPI_Finalize();
        return 1;
    }
    
    // Calculate intervals per process
    intervals_per_process = TOTAL_INTERVALS / NUM_PROCESSES;
    h = 1.0 / TOTAL_INTERVALS;  // Width of each interval
    
    // Calculate the range for this process
    x_start = rank * intervals_per_process * h;
    x_end = (rank + 1) * intervals_per_process * h;
    
    printf("Process %d: Computing integral from %.6f to %.6f\\n", rank, x_start, x_end);
    
    // Riemann sum calculation using midpoint rule
    for (i = 0; i < intervals_per_process; i++) {
        x = x_start + (i + 0.5) * h;  // Midpoint of interval
        local_sum += function(x);
    }
    
    local_sum *= h;  // Multiply by interval width
    
    printf("Process %d: Local sum = %.10f\\n", rank, local_sum);
    
    // Reduce all partial sums to get total integral value
    MPI_Reduce(&local_sum, &total_sum, 1, MPI_DOUBLE, MPI_SUM, 0, MPI_COMM_WORLD);
    
    if (rank == 0) {
        pi_estimate = total_sum;
        
        printf("\\n=== RIEMANN SUM PI CALCULATION RESULTS ===\\n");
        printf("Total intervals: %d\\n", TOTAL_INTERVALS);
        printf("Interval width (h): %.12f\\n", h);
        printf("Estimated value of Pi: %.10f\\n", pi_estimate);
        printf("Actual value of Pi: %.10f\\n", M_PI);
        printf("Error: %.10f\\n", fabs(pi_estimate - M_PI));
        printf("Processes used: %d\\n", NUM_PROCESSES);
    }
    
    MPI_Finalize();
    return 0;
}

/*
 * Compilation: mpicc -o pi_riemann pi_calculation_mpi_riemann-sum_${processCount}proc.c -lm
 * Execution: mpirun -np ${processCount} ./pi_riemann
 * 
 * This MPI program calculates Pi using numerical integration (Riemann sum) with ${processCount} processes.
 * Each process computes a portion of the integral of f(x) = 4/(1+x²) from 0 to 1.
 * The integral equals Pi, so this method provides a numerical approximation.
 * 
 * Riemann Sum Method:
 * - Divide interval [0,1] into small subintervals
 * - Approximate integral using midpoint rule
 * - ∫₀¹ 4/(1+x²) dx = Pi
 * - Each process handles a portion of the intervals
 * - Results are summed using MPI_Reduce
 */`;
            }
        }

        // Info modal functions
        function toggleInfoModal() {
            const modal = document.getElementById('infoModal');
            if (modal.classList.contains('show')) {
                closeInfoModal();
            } else {
                openInfoModal();
            }
        }

        function openInfoModal() {
            const modal = document.getElementById('infoModal');
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function closeInfoModal(event) {
            if (!event || event.target === document.getElementById('infoModal') || event.target.classList.contains('close-button')) {
                const modal = document.getElementById('infoModal');
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        }

        // Make modal functions globally available
        window.toggleInfoModal = toggleInfoModal;
        window.openInfoModal = openInfoModal;
        window.closeInfoModal = closeInfoModal;

        document.addEventListener('DOMContentLoaded', () => {
            new PiSimulation();
            
            // Keyboard shortcuts for info modal
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeInfoModal();
                    return;
                }
                if (e.key === 'F1' || (e.ctrlKey && e.key === 'h')) {
                    e.preventDefault();
                    toggleInfoModal();
                    return;
                }
            });
        });

        // Mobile orientation handling
        function checkOrientation() {
            const overlay = document.querySelector('.rotate-device-overlay');
            const isMobile = window.innerWidth < 768;
            const isPortrait = window.innerHeight > window.innerWidth;
            
            if (isMobile && isPortrait) {
                overlay.style.display = 'flex';
            } else {
                overlay.style.display = 'none';
            }
        }

        // Check orientation on load and resize
        window.addEventListener('load', checkOrientation);
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', () => {
            setTimeout(checkOrientation, 100);
        });