import * as denodeify from 'denodeify';
import * as fs from 'fs';

const BUFFER_SIZE = 4 * 1024;
const END_OF_LINE = '\n';

interface IReadFileOpts {
  bufferSize?: number;
}

const open = denodeify(fs.open);
const fstat = denodeify(fs.fstat);

interface INext { value: string; done: boolean; };

export async function readFile(fileName: string, {bufferSize = BUFFER_SIZE}: IReadFileOpts = {}) {
  const fd = <number>(await open(fileName, 'r'));
  const fileSize = (await fstat(fd)).size;

  let deferList = [], bufferStr = '', promise, index = 0;

  async function next() {
    const d = defer();
    deferList = [...deferList, d];
    promise = promise || read();
    return d.promise;
  }

  function onError(err) {
    deferList.map(p => p.reject(err));
    deferList = [];
    promise = undefined;
  }

  function onResolve() {
    const eof = index >= fileSize;
    let pos, dd, value;

    while (((pos = bufferStr.indexOf(END_OF_LINE)) !== -1 || eof) && deferList.length) {
      [dd, ...deferList] = deferList;

      if (pos !== -1) {
        [value, bufferStr] = [bufferStr.slice(0, pos), bufferStr.slice(pos + 1)];
      } else {
        [value, bufferStr] = [bufferStr, ''];
      }

      dd.resolve({
        value: value,
        done: eof && pos === -1
      });
    }

    if (deferList.length) {
      return read();
    } else {
      promise = undefined;
    }
  }

  async function read() {
    let p = new Promise(r => r());

    if (bufferStr.indexOf(END_OF_LINE) === -1) {
      p = readNextChunk().then(str => bufferStr += str);
    }

    return p.then(onResolve, onError);
  }

  async function readNextChunk() {
    return new Promise<string>((resolve, reject) => {
      bufferSize = Math.min(bufferSize, fileSize - index);

      fs.read(fd, new Buffer(bufferSize), 0, bufferSize, index, (error, bt, buffer) => {
        error ? reject(error) : resolve(buffer.toString());
      });

      index += bufferSize;
    });
  }

  return { next, fileSize };
}

function defer() {
  const d: any = {};
  d.promise = new Promise((resolve, reject) => {
    d.resolve = resolve;
    d.reject = reject;
  });
  return d;
}
