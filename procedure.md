### Procedure

This experiment simulates a distributed system with multiple processes working together to compute `π` using the trapezoidal rule for numerical integration. Here is a step-by-step outline of the algorithm used:

1. **Divide the Workload**: The interval `[0, 1]` is divided into `N` segments, where each process gets `N/P` segments (`P` is the number of processors). Each segment involves computing an area that contributes to `π`.
2. **Local Computation**: Each process computes the area under the curve for its assigned segments using the formula for a circle, $y = \sqrt{1 - x^2}$, and the trapezoidal rule, where the area of each trapezoid is $\frac{1}{2} \times (y_{i-1} + y_i) \times \Delta x$.
3. **Send Results to Master Node**: Each process sends its partial result to the master process using `MPI_Send`.
4. **Aggregate Results**: The master node gathers all partial results using `MPI_Reduce`, sums them, and multiplies by `4` to get the final approximation of `π`.

<br>
<br>

When you run the experiment, you will observe the following steps:

1. **Setup Parameters:**
   - Locate the "Number of Processes" slider in the **Control Panel**. This control sets how many processes (simulated processors) will divide and compute the trapezoidal areas. Adjust the slider between 1 and 8 processes.
   - Adjust the "Number of Subintervals" slider to set the precision of the computation. This control sets the number of intervals the function will be divided into, which impacts the accuracy of π computation.

2. **Initialize the Experiment:**
   - After setting the desired number of processes and subintervals, click the **"Start Calculation"** button to begin.
   - The animation will display trapezoids being computed by each process within a visual representation of the integral, displayed on the canvas. Observe the different trapezoid areas calculated by each process as they appear sequentially.

3. **Monitor Process Controls:**
   - In the **Process Controls** section, adjust the speed of each process using the slider to simulate processors running at different speeds. Observe how this affects the overall computation time in the **Results** section.

4. **Analyze Results:**
   - As the computation progresses, the **Results** section displays:
     - **Computed π:** The current approximation of π as calculated by the processes.
     - **Wall-clock Time:** The real time taken for the computation, which reflects the overall efficiency when using multiple processes.
     - **Process Time:** The total computation time for all processes combined, used for calculating efficiency.

6. **Reset if Needed:**
   - To rerun the experiment with different parameters, click the **"Reset"** button. This clears previous results and resets the canvas.

The posttest quiz will evaluate your observations and understanding of the experiment. Please take note of the posttest questions to ensure you capture the relevant details during the experiment.
