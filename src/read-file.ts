import * as denodeify from 'denodeify';
import * as fs from 'fs';
import {createStore, Store} from 'redux';
import { defer } from './defer';
import {Map, List, Range} from 'immutable';

const BUFFER_SIZE = 4 * 1024;
const END_OF_LINE = '\n';

enum ReaderTypes {
  INIT_READER,
  READ_LINE,
  SEND_LINES,
  READ_CHUNK,
  READ_CHUNK_SUCCESS,
  READ_CHUNK_FAILURE
}

export async function readFile(fileName: string, {bufferSize = BUFFER_SIZE}: IReadFileOpts = {}) {
  const file = <number>(await open(fileName, 'r'));
  const size = (await fstat(file)).size;

  const store = createStore<any>(reducer);

  store.dispatch({ type: ReaderTypes.INIT_READER, payload: { store, file, size, bufferSize } });

  async function next(lines = 1): Promise<any> {
    if (lines > 1) {
      return Promise.all(Range(0, lines).map(() => next()).toArray());
    } else {
      store.dispatch({ type: ReaderTypes.READ_LINE });
      return store.getState().get('deferredList').last().promise;
    }
  }

  return { next };
}

function reducer(state: Map<string, any> = Map({}), action) {
  switch (action.type) {

    case ReaderTypes.INIT_READER: {
      return Map<string, any>(Object.assign(action.payload, initialState));
    }

    case ReaderTypes.READ_LINE: {
      let {lineList, store, deferredList, index, size} = <IState>state.toObject();
      const deferred = defer();

      if (lineList.size || index >= size) {
        setTimeout(() => store.dispatch({ type: ReaderTypes.SEND_LINES }));
      } else if (!deferredList.size) {
        setTimeout(() => store.dispatch({ type: ReaderTypes.READ_CHUNK }));
      }

      return state.merge({ deferredList: deferredList.push(deferred) });
    }

    case ReaderTypes.SEND_LINES: {
      let {lineList, store, done, deferredList, index, size} = <IState>state.toObject();

      while (lineList.size && deferredList.size) {
        const [deferred, value] = [deferredList.first(), lineList.first()];
        [deferredList, lineList] = [deferredList.shift(), lineList.shift()];
        deferred.resolve({ value, done });
      }

      if (deferredList.size) {
        if (index < size) {
          setTimeout(() => store.dispatch({ type: ReaderTypes.READ_CHUNK }));
        } else {
          done = true;
          deferredList.map(d => d.resolve({ value: '', done }));
          deferredList.clear();
        }
      }

      return state.merge({ lineList, done, deferredList });
    }

    case ReaderTypes.READ_CHUNK: {
      const {file, size, store, bufferSize, index} = <IState>state.toObject();

      const readSize = Math.min(bufferSize, size - index);

      fs.read(file, new Buffer(readSize), 0, readSize, index, (error, bt, buffer) => {
        if (error) {
          store.dispatch({ type: ReaderTypes.READ_CHUNK_FAILURE, payload: error });
        } else {
          store.dispatch({ type: ReaderTypes.READ_CHUNK_SUCCESS, payload: buffer.toString() });
        }
      });

      return state;
    }

    case ReaderTypes.READ_CHUNK_FAILURE: {
      const {deferredList} = <IState>state.toObject();
      deferredList.map(d => d.reject(action.payload));
      return state.set('deferredList', List()).set('done', true);
    }

    case ReaderTypes.READ_CHUNK_SUCCESS: {
      let {size, store, deferredList, lineList, done, buffer, index} = <IState>state.toObject();

      buffer += action.payload;
      index += action.payload.length;

      let lines = buffer.split(END_OF_LINE);

      buffer = index < size ? lines.pop() : '';

      setTimeout(() => store.dispatch({ type: ReaderTypes.SEND_LINES }));

      return state.merge({ done, index, buffer, deferredList, lineList: lineList.concat(lines) });
    }

    default:
      return state;
  }
};

const open = denodeify(fs.open);
const fstat = denodeify(fs.fstat);

const initialState = {
  buffer: '',
  done: false,
  index: 0,
  deferredList: List(),
  lineList: List()
};

interface IReadFileOpts {
  bufferSize?: number;
}

interface IState {
  buffer: string;
  done: boolean;
  file: number;
  bufferSize: number;
  size: number;
  index: number;
  deferredList: List<any>;
  lineList: List<string>;
  store: Store<any>;
}
