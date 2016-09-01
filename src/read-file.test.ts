import {join} from 'path';
import {expect} from 'chai';
import {readFile} from './read-file';

describe('Read File Function', () => {

  let file;

  beforeEach(async () => {
    file = await readFile(join(__dirname, '..', 'dumps', 'dump1.sql'));
  });

  it('read #1', async () => {
    expect((await file.next()).value).to.be.equal('--');
    expect((await file.next()).value).to.be.equal('-- PostgreSQL database dump');
    expect((await file.next()).value).to.be.equal('--');
  });

  it('read #2', async () => {
    expect(await file.next(3)).to.deep.equal([
      { value: '--', done: false },
      { value: '-- PostgreSQL database dump', done: false },
      { value: '--', done: false }
    ]);
  });

  it('read #3', async () => {
    let result;

    do {
      result = (await file.next(20)).pop();
    } while (!result.done);

    expect(result).to.deep.equal({ value: '', done: true });
  });

  it('read #4', async () => {
    let result;

    do {
      result = (await file.next(20)).pop();
    } while (!result.done);

    result = await file.next();

    expect(result).to.deep.equal({ value: '', done: true });
  });
});
