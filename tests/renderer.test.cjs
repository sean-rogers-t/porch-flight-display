const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');

// Model the restricted drawing surface: primitive shapes work, but there is no
// Image, drawImage, offscreen canvas, or getImageData. Test actual UI handlers.
function emulator() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'porch-display.html'), 'utf8');
  const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  const embedded = html.match(/id="pd-icon-data">([\s\S]*?)<\/script>/)[1];
  let surface = new Uint32Array(0), width = 0, height = 0, circles = [], clears = 0;
  const colors = new Map();
  const color = value => {
    if (!colors.has(value)) colors.set(value, colors.size + 1);
    return colors.get(value);
  };
  const ctx = {
    fillStyle: '', globalAlpha: 1,
    clearRect() { surface.fill(0); clears++; },
    fillRect() { surface.fill(color(this.fillStyle)); },
    beginPath() { circles = []; },
    moveTo() {},
    arc(x, y, radius) { circles.push([x, y, radius]); },
    fill() {
      const ink = color(this.fillStyle);
      for (const [cx, cy, radius] of circles) {
        for (let y = Math.max(0, Math.floor(cy - radius)); y < Math.min(height, Math.ceil(cy + radius)); y++) {
          for (let x = Math.max(0, Math.floor(cx - radius)); x < Math.min(width, Math.ceil(cx + radius)); x++) {
            if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= radius ** 2) surface[y * width + x] = ink;
          }
        }
      }
    }
  };
  function element() {
    return { dataset: {}, style: {}, value: '', listeners: {}, attributes: {},
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(type, fn) { this.listeners[type] = fn; }
    };
  }
  const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], element()]));
  const root = elements.get('porch-display-emulator'), canvas = elements.get('pd-canvas');
  const buttons = new Map('abcdefg'.split('').map(key => [key, Object.assign(element(), { dataset: { layout: key } })]));
  Object.defineProperties(canvas, {
    width: { get: () => width, set: value => { width = value; surface = new Uint32Array(width * height); } },
    height: { get: () => height, set: value => { height = value; surface = new Uint32Array(width * height); } }
  });
  canvas.getContext = () => ctx;
  root.querySelector = selector => elements.get(selector.slice(1));
  root.querySelectorAll = () => [...buttons.values()];
  elements.get('pd-icon-data').textContent = embedded;
  let now = 0, sequence = 0;
  const raf = new Map(), intervals = new Map();
  vm.runInNewContext(script, {
    document: { getElementById: id => elements.get(id), addEventListener() {}, hidden: false },
    matchMedia: () => ({ matches: false }), performance: { now: () => now },
    requestAnimationFrame: fn => { const id = ++sequence; raf.set(id, fn); return id; },
    cancelAnimationFrame: id => raf.delete(id),
    setInterval: fn => { const id = ++sequence; intervals.set(id, fn); return id; },
    clearInterval: id => intervals.delete(id)
  });
  const trigger = (el, type) => el.listeners[type]({ target: el });
  return {
    root, raf,
    layout: key => trigger(buttons.get(key), 'click'),
    select(id, value) { const el = elements.get(id); el.value = value; trigger(el, 'change'); },
    click: id => trigger(elements.get(id), 'click'),
    hash: () => createHash('sha256').update(Buffer.from(surface.buffer)).digest('hex'),
    get clears() { return clears; },
    tick(ms) { now += ms; for (const fn of intervals.values()) fn(); }
  };
}

test('landmarks are immediately available without browser image APIs', () => {
  const app = emulator();
  assert.equal(app.root.dataset.ready, 'true');
  assert.equal(app.root.dataset.artworkCount, '6');
  for (const rows of ['32', '64', '128']) for (const city of ['0', '1', '2', '3', '4', '5']) {
    app.select('pd-resolution', rows);
    app.select('pd-city', city);
    const frames = new Set();
    for (const layout of ['e', 'f', 'g']) {
      const before = app.clears;
      app.layout(layout);
      assert.ok(app.clears > before, 'each selection explicitly clears the visible canvas');
      assert.equal(app.root.dataset.cols, String(2 * Number(rows)));
      assert.equal(app.root.dataset.city, city);
      assert.ok(Number(app.root.dataset.litPixels) > 50);
      frames.add(app.hash());
    }
    assert.equal(frames.size, 3, 'each layout draws a different complete frame');
  }
});

test('returning to the same selection produces the exact original frame', () => {
  const app = emulator(), original = app.hash();
  for (const city of ['3', '1', '5', '2', '4']) {
    app.select('pd-city', city);
    app.layout('f'); app.layout('g');
  }
  app.select('pd-resolution', '128'); app.layout('d'); app.click('pd-phase');
  app.select('pd-resolution', '64'); app.select('pd-city', '0'); app.layout('e');
  assert.equal(app.hash(), original, 'no old lettering or landmark pixels remain');
  assert.equal(app.raf.size, 0, 'manual selections replace the frame immediately');
});

test('a stale animation callback cannot paint over a new selection', () => {
  const app = emulator();
  app.click('pd-play'); app.tick(4100);
  const stale = [...app.raf.values()][0];
  assert.equal(typeof stale, 'function');
  app.layout('g'); app.select('pd-city', '3');
  const current = app.hash();
  stale(4300);
  assert.equal(app.hash(), current);
  assert.equal(app.root.dataset.playing, 'false');
});
