// Benchmarking for Orchid, this is just for this library
// TODO: make it blazing flast

const orchid = require('../build');
const getDuration = (start) => {
  const end = process.hrtime(start);
  return (end[0] * 1e9 + end[1]) / 1e6;
};

async function make() {
  console.log('Creating 1 request to "https://jsonplaceholder.typicode.com/todos/1"...');

  const startOnce = process.hrtime();
  await orchid.get('https://jsonplaceholder.typicode.com/todos/1');
  const endOnce = getDuration(startOnce);

  console.log(`Created a request once to "https://jsonplaceholder.typicode.com/todos/1" (~${endOnce.toFixed(2)}ms)`);
  console.log('Creating 10 requests to "https://jsonplaceholder.typicode.com/todos/1"...');

  const items10 = [];
  for (let i = 0; i < 10; i++) {
    const start = process.hrtime();
    await orchid.get('https://jsonplaceholder.typicode.com/todos/1');

    items10[i] = getDuration(start);
    console.log(`[${i + 1}/10] Made a request to "https://jsonplaceholder.typicode.com/todos/1" (~${items10[i].toFixed(2)}ms)`);
  }
}

// Research -- courtesy of 06/09/2020 @ 03:37
// 1 request takes 100-140ms to complete
// 10 requests takes 89-120ms to complete

make()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
