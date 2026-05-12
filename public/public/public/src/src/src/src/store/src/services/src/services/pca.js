export function calculatePCA(matrix) {
  if (matrix.length < 3) return { coordinates: [], variance: [0, 0] };

  const n = matrix.length;
  const m = matrix[0].values.length;

  const means = [];
  for (let j = 0; j < m; j++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += matrix[i].values[j];
    means.push(sum / n);
  }

  const centered = matrix.map((row) => ({
    id: row.id,
    values: row.values.map((v, j) => v - means[j]),
  }));

  const cov = [];
  for (let j = 0; j < m; j++) {
    cov[j] = [];
    for (let k = 0; k < m; k++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += centered[i].values[j] * centered[i].values[k];
      }
      cov[j][k] = sum / (n - 1);
    }
  }

  const pc1 = powerIteration(cov);
  const residual = deflate(cov, pc1);
  const pc2 = powerIteration(residual);

  const lambda1 = rayleighQuotient(cov, pc1);
  const lambda2 = rayleighQuotient(cov, pc2);
  const totalVariance = trace(cov);
  const variance = [lambda1 / totalVariance, lambda2 / totalVariance];

  const coordinates = matrix.map((row) => ({
    id: row.id,
    x: dot(row.values, pc1),
    y: dot(row.values, pc2),
  }));

  return { coordinates, variance, pc1, pc2 };
}

function powerIteration(matrix, iterations = 50) {
  const n = matrix.length;
  let vec = Array(n).fill(1 / Math.sqrt(n));
  for (let iter = 0; iter < iterations; iter++) {
    const newVec = matrix.map((row) => dot(row, vec));
    const norm = Math.sqrt(dot(newVec, newVec));
    vec = newVec.map((v) => v / norm);
  }
  return vec;
}

function deflate(matrix, eigenvec) {
  const lambda = rayleighQuotient(matrix, eigenvec);
  return matrix.map((row, i) =>
    row.map((val, j) => val - lambda * eigenvec[i] * eigenvec[j])
  );
}

function rayleighQuotient(matrix, vec) {
  const mv = matrix.map((row) => dot(row, vec));
  return dot(mv, vec) / dot(vec, vec);
}

function dot(a, b) {
  return a.reduce((sum, v, i) => sum + v * (b[i] || 0), 0);
}

function trace(matrix) {
  return matrix.reduce((sum, row, i) => sum + (row[i] || 0), 0);
}
