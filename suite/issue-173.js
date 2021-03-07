const orchid = require('../build');

const client = new orchid.HttpClient();

async function main() {
  const req = client.request({
    method: 'GET',
    url: 'https://floofy.dev',
    headers: {
      'User-Agent': 'owo my uwu?',
      Authorization: 'ea sports its in the gay'
    }
  });

  console.log(req.headers);
  console.log(await req);
}

main();
