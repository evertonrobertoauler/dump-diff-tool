import {join} from 'path';
import {expect} from 'chai';
import {readFile} from './read-file';
import {Range} from 'immutable';

describe('Read File Function', () => {
  it('read #1', async () => {
    const file = await readFile(join(__dirname, '..', 'dumps', 'dump1.sql'));

    expect((await file.next()).value).to.be.equal('--');
    expect((await file.next()).value).to.be.equal('-- PostgreSQL database dump');
    expect((await file.next()).value).to.be.equal('--');
  });

  it('read #2', async () => {
    const file = await readFile(join(__dirname, '..', 'dumps', 'dump1.sql'));

    const promise = Promise.all([file.next(), file.next(), file.next()]);

    expect(await promise).to.deep.equal([
      { value: '--', done: false },
      { value: '-- PostgreSQL database dump', done: false },
      { value: '--', done: false }
    ]);
  });

  it('read #3', async () => {
    const file = await readFile(join(__dirname, '..', 'dumps', 'dump1.sql'));

    let result;

    do {
      result = (await Promise.all(Range(0, 20).map(() => file.next()).toArray())).pop();
    } while (!result.done);

    expect(result).to.deep.equal({ value: '', done: true });
  });

  it('read #4', async () => {
    const file = await readFile(join(__dirname, '..', 'dumps', 'dump1.sql'));

    let result;

    do {
      result = (await Promise.all(Range(0, 20).map(() => file.next()).toArray())).pop();
    } while (!result.done);

    result = await file.next();

    expect(result).to.deep.equal({ value: '', done: true });
  });
});
