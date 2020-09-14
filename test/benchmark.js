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

// Research -- courtesy of 14/09/2020 @ 12:35
// 1 request takes 200ms to complete
// 10 requests takes 120-170ms to complete

// -- Note: Thanks to my best friend, Ice (https://github.com/IceeMC)
// this is what he gotten:
// 1 request takes 210ms (which is bad...)
// 10 requests takes 65-85ms (which is good)

// -- Note: Thanks to my other friend, David (https://github.com/ohlookitsderpy)
// this is what he gotten:
// 1 request takes 116ms (which is semi-good?)
// 10 requests takes 65-95ms

make()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
