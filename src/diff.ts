
export function diffLines(before: string[], after: string[]) {
  let oldIndexMap = {}, i;

  for (i = 0; i < before.length; i++) {
    oldIndexMap[before[i]] = oldIndexMap[before[i]] || [];
    oldIndexMap[before[i]].push(i);
  }

  let overlap = [], startOld, startNew, subLength, inew;

  startOld = startNew = subLength = 0;

  for (inew = 0; inew < after.length; inew++) {
    let overlapTmp = [];
    oldIndexMap[after[inew]] = oldIndexMap[after[inew]] || [];
    for (i = 0; i < oldIndexMap[after[inew]].length; i++) {
      let iold = oldIndexMap[after[inew]][i];

      overlapTmp[iold] = ((iold && overlap[iold - 1]) || 0) + 1;
      if (overlapTmp[iold] > subLength) {

        subLength = overlapTmp[iold];
        startOld = iold - subLength + 1;
        startNew = inew - subLength + 1;
      }
    }
    overlap = overlapTmp;
  }
  if (subLength === 0) {
    let result = [];
    if (before.length) { result.push(['-', before]); }
    if (after.length) { result.push(['+', after]); }
    return result;
  }

  return [].concat(
    diffLines(before.slice(0, startOld), after.slice(0, startNew)),
    [['=', after.slice(startNew, startNew + subLength)]],
    diffLines(before.slice(startOld + subLength), after.slice(startNew + subLength))
  );
};
