### Theory

The Monte Carlo method is a computational algorithm that relies on repeated random sampling to obtain numerical results. The underlying concept is to use randomness to solve problems that might be deterministic in principle. They are often used in physical and mathematical problems and are most useful when it is difficult or impossible to use other approaches. Monte Carlo methods are mainly used in three problem classes: optimization, numerical integration, and generating draws from a probability distribution.

To estimate the value of Pi, we can use the Monte Carlo method. Imagine a square with side length 2r, centered at the origin. A circle with radius r is inscribed within this square. The area of the square is (2r)^2 = 4r^2, and the area of the circle is πr^2. The ratio of the area of the circle to the area of the square is (πr^2) / (4r^2) = π/4.

If we randomly generate a large number of points within the square, the ratio of the number of points that fall inside the circle to the total number of points generated should be approximately equal to the ratio of the areas, which is π/4.

So, if we generate N points, and M of them fall inside the circle, then M/N ≈ π/4, which means π ≈ 4 * (M/N).

In this experiment, we will simulate this process to estimate the value of Pi.
