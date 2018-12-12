const lib = require('../');
const binToFile = require('bin-to-file');
const fs = require('fs');
const { promisify } = require('util');
const read = promisify(fs.readFile);

test.only('stripped down', async () => {
  const fixture = require(`./fixtures/stripped.json`);
  const html = await read(__dirname + '/fixtures/stripped.html', 'utf8');
  const res = lib(html);

  expect(res).toMatchObject(fixture);
});
