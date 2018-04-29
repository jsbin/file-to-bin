const lib = require('../');
const binToFile = require('bin-to-file');
const fs = require('fs');
const { promisify } = require('util');
const read = promisify(fs.readFile);
const diff = require('jest-diff');

expect.extend({
  toRoughlyMatch(received, expected) {
    const trimSplit = s =>
      s
        .trim()
        .split('\n')
        .map(_ => _.trim())
        // strip metadata build includes
        .filter(_ => !_.includes('<meta name="robots" content="none">'))
        .filter(Boolean);

    const rLines = trimSplit(received);
    const eLines = trimSplit(expected);

    const fail = rLines.find((line, i) => line.trim() !== eLines[i].trim());
    const pass = !fail;

    const message = pass
      ? () =>
          this.utils.matcherHint('.not.toBe') +
          '\n\n' +
          `Expected value to not rougly be:\n` +
          `  ${this.utils.printExpected(expected)}\n` +
          `Received:\n` +
          `  ${this.utils.printReceived(received)}`
      : () => {
          const diffString = diff(expected, received, {
            expand: this.expand,
          });
          return (
            this.utils.matcherHint('.toBe') +
            '\n\n' +
            `Expected value to roughly be:\n` +
            `  ${this.utils.printExpected(expected)}\n` +
            `Received:\n` +
            `  ${this.utils.printReceived(received)}` +
            (diffString ? `\n\nDifference:\n\n${diffString}` : '')
          );
        };

    return { actual: received, message, pass };
  },
});

const stripComments = s => s.replace(/<!--([\s\S]+)-->/g, '');

[1, 2, 3].forEach(n => {
  const fixture = require(`./fixtures/${n}.json`);
  test(`${fixture.url}/${fixture.revision} (${n}.json)`, async () => {
    const html = fixture.res ? fixture.res : binToFile(fixture);

    expect(html.length).toBeGreaterThan(1);
    const res = lib(html);

    expect(typeof res).toBe('object');
    expect(res.javascript).toRoughlyMatch(fixture.javascript);
    expect(stripComments(res.html)).toRoughlyMatch(fixture.html);
    expect(res.css).toEqual(fixture.css);
    expect(res.url).toEqual(fixture.url);
    expect(res.revision).toEqual(fixture.revision);
  });
});

test.only('zabihiheha', async () => {
  const fixture = require('./fixtures/zabihiheha.json');
  const html = await read(__dirname + '/fixtures/zabihiheha.html', 'utf8');
  const res = lib(html);

  const p = res.settings.processors;

  expect(typeof res).toBe('object');
  expect(res.source[p.javascript]).toRoughlyMatch(fixture.javascript);
  expect(stripComments(res.source[p.css])).toRoughlyMatch(fixture.css);
  expect(res.html).toRoughlyMatch(fixture.html);
});

test(`full deck of processors (4.json)`, async () => {
  const fixture = require(`./fixtures/4.json`);
  const html = fixture.res.full;

  expect(html.length).toBeGreaterThan(1);
  const res = lib(html);

  const p = res.settings.processors;

  expect(typeof res).toBe('object');
  expect(res.source[p.javascript]).toRoughlyMatch(fixture.javascript);
  expect(stripComments(res.source[p.html])).toRoughlyMatch(fixture.html);
  expect(stripComments(res.html)).not.toEqual(
    expect.stringContaining('<script ')
  );
  expect(res.source[p.css]).toRoughlyMatch(fixture.css);
  expect(res.url).toEqual(fixture.url);
  expect(res.revision).toEqual(fixture.revision);
});
