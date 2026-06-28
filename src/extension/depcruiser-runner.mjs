import { cruise } from 'dependency-cruiser';

const stdin = await readStdin();

if (!stdin.trim()) {
  throw new Error('depcruiser-runner requires JSON input on stdin');
}

const payload = JSON.parse(stdin);
const files = Array.isArray(payload.files) ? payload.files : [];
const options = payload.options && typeof payload.options === 'object' ? payload.options : {};
const resolveOptions = payload.resolveOptions && typeof payload.resolveOptions === 'object' ? payload.resolveOptions : undefined;
const transpileOptions = payload.transpileOptions && typeof payload.transpileOptions === 'object' ? payload.transpileOptions : undefined;

const result = await cruise(files, options, resolveOptions, transpileOptions);
process.stdout.write(`${JSON.stringify(result)}\n`);

async function readStdin() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}
