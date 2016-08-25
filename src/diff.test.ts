import {expect} from 'chai';
import {diffLines} from './diff';

describe('Diff Lines Function', () => {
  it('diff #1', () => {
    const l1 = ['aaaa', 'bbbb', 'cccc'];
    const l2 = ['aaaa', 'dddd', 'cccc'];
    const ld = [['=', ['aaaa']], ['-', ['bbbb']], ['+', ['dddd']], ['=', ['cccc']]];
    expect(diffLines(l1, l2)).to.deep.equal(ld);
  });

  it('diff #2', () => {
    const l1 = ['aaaa', 'bbbb', 'cccc'];
    const l2 = ['aaaa', 'bbbb', 'cccc'];
    const ld = [['=', ['aaaa', 'bbbb', 'cccc']]];
    expect(diffLines(l1, l2)).to.deep.equal(ld);
  });

  it('diff #3', () => {
    const l1 = ['aaaa', 'bbbb', 'cccc', 'bbbb', 'cccc'];
    const l2 = ['aaaa', 'bbbb', 'cccc'];
    const ld = [['=', ['aaaa', 'bbbb', 'cccc']], ['-', ['bbbb', 'cccc']]];
    expect(diffLines(l1, l2)).to.deep.equal(ld);
  });

  it('diff #4', () => {
    const l1 = ['aaaa', 'bbbb', 'cccc'];
    const l2 = ['aaaa', 'bbbb', 'cccc', 'cccc', 'cccc'];
    const ld = [['=', ['aaaa', 'bbbb', 'cccc']], ['+', ['cccc', 'cccc']]];
    expect(diffLines(l1, l2)).to.deep.equal(ld);
  });
});
