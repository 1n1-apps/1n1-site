import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { labelFor, readTheme, setUp } from '../src/assets/theme.js';

function storage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
}

// A document with just what the toggle touches.
function fakeDocument({ withButton = true } = {}) {
  const attrs = { 'data-theme': 'dark' };
  const label = { textContent: '' };
  let onClick = null;
  const button = {
    hidden: true,
    querySelector: (sel) => (sel === '[data-label]' ? label : null),
    addEventListener: (type, fn) => {
      if (type === 'click') onClick = fn;
    },
  };
  return {
    label,
    button,
    click: () => onClick(),
    documentElement: {
      getAttribute: (n) => attrs[n],
      setAttribute: (n, v) => {
        attrs[n] = v;
      },
    },
    querySelector: (sel) => (sel === '.theme' && withButton ? button : null),
  };
}

describe('readTheme', () => {
  it('returns the saved light choice, and dark for anything else', () => {
    assert.equal(readTheme(storage({ theme: 'light' })), 'light');
    assert.equal(readTheme(storage({ theme: 'dark' })), 'dark');
    assert.equal(readTheme(storage({ theme: 'sepia' })), 'dark');
    assert.equal(readTheme(storage()), 'dark');
    assert.equal(readTheme(null), 'dark');
  });

  it('falls back to dark when storage refuses to be read', () => {
    const refusing = {
      getItem: () => {
        throw new Error('denied');
      },
    };
    assert.equal(readTheme(refusing), 'dark');
  });
});

describe('labelFor', () => {
  it('names the action the button will take', () => {
    assert.equal(labelFor('dark'), 'Switch to the light theme');
    assert.equal(labelFor('light'), 'Switch to the dark theme');
  });
});

describe('setUp', () => {
  it('shows the saved theme, reveals the button and labels it', () => {
    const doc = fakeDocument();
    setUp(doc, storage({ theme: 'light' }));
    assert.equal(doc.documentElement.getAttribute('data-theme'), 'light');
    assert.equal(doc.button.hidden, false);
    assert.equal(doc.label.textContent, 'Switch to the dark theme');
  });

  it('flips the theme on click and remembers it', () => {
    const doc = fakeDocument();
    const store = storage();
    setUp(doc, store);
    doc.click();
    assert.equal(doc.documentElement.getAttribute('data-theme'), 'light');
    assert.equal(store.data.theme, 'light');
    doc.click();
    assert.equal(doc.documentElement.getAttribute('data-theme'), 'dark');
    assert.equal(store.data.theme, 'dark');
    assert.equal(doc.label.textContent, 'Switch to the light theme');
  });

  it('still flips when storage refuses writes or is absent', () => {
    const doc = fakeDocument();
    setUp(doc, {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    });
    doc.click();
    assert.equal(doc.documentElement.getAttribute('data-theme'), 'light');
    const bare = fakeDocument();
    setUp(bare, null);
    bare.click();
    assert.equal(bare.documentElement.getAttribute('data-theme'), 'light');
  });

  it('does nothing on a page without the toggle', () => {
    const doc = fakeDocument({ withButton: false });
    setUp(doc, storage());
    assert.equal(doc.documentElement.getAttribute('data-theme'), 'dark');
  });
});
