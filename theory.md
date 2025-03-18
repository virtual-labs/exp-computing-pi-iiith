### Theory

#### Why Compute π?

The number `π` (pi) is a fundamental mathematical constant that defines the ratio between a circle’s circumference and its diameter. As an irrational number, it cannot be precisely expressed as a simple fraction, but its decimal expansion continues indefinitely without repeating. `π` plays a crucial role in many mathematical and scientific formulas and finds applications across diverse fields such as physics, engineering, and computer science.

In practical terms, only 39 digits of `π` are necessary to calculate a circle as large as the observable universe with an accuracy down to the size of a hydrogen atom. However, calculating `π` to extremely high precision is valuable for testing the capabilities of supercomputers, serving as a benchmark for both accuracy and memory-intensive computation. Large-scale calculations of `π` are relentless in their demands on hardware: even a single bit error can be detected, making `π` an ideal test of a supercomputer's "global integrity."

<br>
<br>




#### Methods for Computing π

Many algorithms approximate `π` with varying trade-offs in terms of convergence rate, precision, and computational efficiency, particularly regarding parallelization. Below are some key methods commonly used for approximating `π`:

1. **Monte Carlo Method**: The Monte Carlo method leverages random sampling and probability to approximate `π`. By simulating points randomly within a square that encloses a quarter-circle, one can estimate `π` by calculating the ratio of points inside the quarter-circle to the total points in the square. Specifically, if points are uniformly distributed, the ratio approaches `π/4` as the number of points increases. Monte Carlo is particularly suited for parallel computation since random points can be generated and evaluated independently.

2. **Madhava–Leibniz Series**: The Madhava–Leibniz series is an infinite series representation: $\frac{\pi}{4} = \sum\limits_{k=0}^{\infty} \frac{(-1)^k}{2k + 1}$. While conceptually simple and derived from the arctangent Taylor series, this series converges slowly, requiring millions of terms to achieve modest precision. Although parallelization can be applied by splitting terms across processors, the slow convergence makes it inefficient for high-precision calculations.

3. **Numerical Integration (e.g., Riemann Sum)**: Numerical integration methods approximate `π` by integrating functions that have known relationships to `π`. For instance, integrating the function $f(x) = \sqrt{1 - x^2}$ from `0` to `1` estimates `π/4` due to the relationship with the unit circle’s quarter-area. The interval can be subdivided into smaller segments (a Riemann sum) and summed, with more segments yielding higher accuracy. This approach is well-suited to parallelization by dividing the interval across processors.

4. **Gauss-Legendre Algorithm**: This is a quadratically convergent iterative algorithm that combines arithmetic and geometric means, converging to `π` exponentially faster than previous methods. Each iteration doubles the number of correct digits, making it a top choice for high-precision calculations. However, it requires significant computational resources and is harder to parallelize due to its recursive structure.

5. **Chudnovsky Algorithm**: The Chudnovsky algorithm is a fast method for calculating the digits of π, based on Ramanujan's π formulae. It is based on the following rapidly convergent generalized hypergeometric series. It has been used to calculate the world record for `π` to 100 trillion digits. The formula is: $\frac{1}{\pi} = 12 \sum\limits_{k=0}^{\infty} \frac{(-1)^k (6k)! (13591409 + 545140134k)}{(3k)! (k!)^3 640320^{3k + 3/2}}$. Although computation-heavy, these formulas are suitable for parallelization, as each term can be computed independently before summation.

<br>
<br>




#### Distributed Systems and Their Challenges

Distributed systems are computing environments where tasks are processed across multiple, loosely connected nodes. They allows us to:

1. **Divide and Conquer**: Split the problem into smaller parts, each handled by a separate node.
2. **Parallel Computation**: Each node performs its part of the computation concurrently, accelerating the overall process.
3. **Aggregate Results**: Results from individual nodes are combined to form the final output.

However, these systems introduce several challenges that don't appear in traditional, single-machine programming:

1. **No Shared Memory**: Each node operates independently, lacking a shared memory space.
2. **No Common Physical Clock**: Synchronization across nodes is complex, as each node maintains its own clock, which can drift.
3. **Network Latency**: Geographically dispersed nodes may experience delays that affect synchronization.
4. **Communication Overhead**: Significant inter-node communication can slow down computation, especially with many nodes.
5. **Heterogeneity**: Nodes can differ in hardware, operating systems, and network speeds.
6. **Complexity**: Writing and debugging distributed programs can be challenging.

<br>
<br>




#### Message Passing Interface (MPI)

**Message Passing Interface (MPI)** has become a widely adopted standard for processes to communicate in distributed systems. It is particularly useful in scientific and engineering computations, where tasks are decomposed into independent sub-tasks that require coordination.

MPI provides a robust API that includes point-to-point communication (`MPI_Send`, `MPI_Recv`), collective operations (`MPI_Bcast`, `MPI_Reduce`, `MPI_Gather`), and synchronization primitives (`MPI_Barrier`). Point-to-point communication enables direct data exchange between processes, while collective operations optimize data movement across multiple processes, essential for scalable computation. The non-blocking operations (e.g., `MPI_Isend`, `MPI_Irecv`) allow processes to overlap computation with communication, reducing idle times and improving throughput in latency-sensitive applications.

The MPI standard supports a range of communication topologies, from one-dimensional to complex multi-dimensional cartesian grids, through `MPI_Cart_create`, enabling efficient data partitioning and access patterns for applications such as scientific simulations and large-scale numerical models. The design is tailored for scalability, as MPI allows flexible process management via `MPI_Comm_split` and `MPI_Comm_create`, enabling hierarchical or domain-specific decomposition for large problem spaces.

Error handling, fault tolerance mechanisms, and process rank management in MPI are designed to provide resilience, with a typical focus on graceful degradation in distributed environments. Furthermore, MPI implementations often exploit hardware-level optimizations, such as RDMA in InfiniBand, to minimize latency and maximize bandwidth, making it highly efficient on HPC infrastructures.

<br>
<br>




With this theoretical foundation, we can now encourage the reader to attempt the Pretest to assess their understanding of the concepts discussed. Following that, we will delve into the practical implementation of computing `π` using MPI in a distributed system.
