const orchid = require('../build');
const client = new orchid.HttpClient({
  baseUrl: 'https://api.floofy.dev'
});

async function main() {
  const res = await client.get('yiff');
  console.log(res);
}

main();
