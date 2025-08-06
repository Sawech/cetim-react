export const replaceVariables = (expr, variables) => {
  // First check if all variables in the expression exist
  const variableNames = variables.map(v => v.name);
  const variablePattern = /[a-zA-Z_]\w*/g; // Pattern to match variable names
  const usedVariables = new Set();
  let match;
  
  // Find all variable names in the expression
  while ((match = variablePattern.exec(expr)) !== null) {
    // Skip math functions
    if (!['sqrt', 'pow', 'Math'].includes(match[0])) {
      usedVariables.add(match[0]);
    }
  }

  // Check if all used variables exist
  for (const varName of usedVariables) {
    if (!variableNames.includes(varName)) {
      return null; // Return null if any variable is missing
    }
  }

  // If all variables exist, proceed with replacement
  let result = expr;
  variables.forEach((item) => {
    result = result.replace(
      new RegExp(`\\b${item.name}\\b`, "g"),
      item.computedValue
    );
  });
  return result;
};

export const replaceMathFunctions = (expr) => {
  return expr
    .replace(/sqrt\(([^)]+)\)/g, "Math.sqrt($1)")
    .replace(/pow\(([^,]+),([^)]+)\)/g, "Math.pow($1,$2)");
};