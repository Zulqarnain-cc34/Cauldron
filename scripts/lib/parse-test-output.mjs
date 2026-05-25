/** Parse Node.js built-in test runner summary lines from combined output. */
export function parseNodeTestOutput(output) {
  const text = output ?? '';
  const pass = Number(text.match(/# pass (\d+)/)?.[1] ?? NaN);
  const fail = Number(text.match(/# fail (\d+)/)?.[1] ?? NaN);
  return {
    pass: Number.isFinite(pass) ? pass : null,
    fail: Number.isFinite(fail) ? fail : null,
  };
}
