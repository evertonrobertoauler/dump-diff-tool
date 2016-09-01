import {expect} from 'chai';
import { join } from 'path';
import { diffFile } from './diff-file';

describe('Diff File Function', () => {

  let diff;

  beforeEach(async () => {
    diff = await diffFile(
      join(__dirname, '..', 'dumps', 'dump1.sql'),
      join(__dirname, '..', 'dumps', 'dump2.sql')
    );
  });

  it('diff-file #1', async () => {
    expect(await diff.next()).to.be.equal({
      line: 5,
      type: '-',
      value: '-- Dumped from database version 9.5.3\n-- Dumped by pg_dump version 9.5.3'
    });
  });
});
