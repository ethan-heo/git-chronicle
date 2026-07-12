import '@testing-library/jest-dom/vitest';

if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = function getClientRects(): DOMRectList {
    return {
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* iterator() {},
    } as DOMRectList;
  };
}

if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = function getBoundingClientRect(): DOMRect {
    return new DOMRect(0, 0, 0, 0);
  };
}
