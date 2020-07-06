const { HttpClient, middleware, CycleType } = require('../build');

const orchid = new HttpClient([
  middleware.logging({ namespace: 'Suite #1' }), 
  middleware.forms(),
  {
    name: 'uwu',
    cycleType: CycleType.Execute,
    intertwine() {
      console.log(this.middleware.get('uwu'));
    }
  },
  {
    name: 'owo',
    cycleType: CycleType.Done,
    intertwine() {
      console.log(this.middleware.get('owo'));
    }
  }
]);

orchid
  .request({
    method: 'post',
    url: 'http://httpbin.org/post',
    data: new (require('form-data'))().append('a', 'b'),
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(console.log).catch(console.error);