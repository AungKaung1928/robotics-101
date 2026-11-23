// Chapter 1.4 bench: closest() over one 360-reading scan, C++. Prints ns per call.
#include <chrono>
#include <cstdio>
#include <limits>
#include <random>
#include <vector>

double closest(const std::vector<double>& readings) {
  double best = std::numeric_limits<double>::infinity();
  for (double d : readings) {
    if (d < best) best = d;
  }
  return best;
}

int main() {
  std::mt19937 rng(0);
  std::uniform_real_distribution<double> u(0.12, 3.5);
  std::vector<double> scan(360);
  for (double& d : scan) d = u(rng);
  const int calls = 2000000;
  volatile double sink = 0.0;  // keeps the compiler from skipping the calls
  auto t0 = std::chrono::steady_clock::now();
  for (int i = 0; i < calls; ++i) {
    scan[i % 360] += 0.0 * i;  // a write per call so the result cannot be hoisted out of the loop
    sink = sink + closest(scan);
  }
  double ns = std::chrono::duration<double, std::nano>(std::chrono::steady_clock::now() - t0).count() / calls;
  std::printf("%.0f\n", ns);
}
