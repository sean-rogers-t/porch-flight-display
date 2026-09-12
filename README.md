# Porch Flight Display

A browser emulator for an internet-connected LED sign that shows where overhead flights originated, alongside a recognizable city landmark. The first hardware target is a sheltered porch display with amber lettering and a black frame.

**Current version uses sample flights.** Aircraft tracking and physical hardware control are planned.

## Try it

**[Open the live emulator](https://sean-rogers-t.github.io/porch-flight-display/)** from any computer or phone.

Open **`index.html`** in a modern browser. Everything is embedded, including prepared pixel artwork for all six cities. No installation, account, API key, or internet connection is needed to run the emulator.

1. Compare the three larger-landmark layouts, E–G. All keep the city and landmark together in a 2:1 rectangle, starting at 128 × 64 LEDs, the same default resolution as D.
2. Choose a sample city and compare 32, 64, and 128 LED rows.
3. Expand **Earlier layouts A–D** to compare the originals. Select **D · Reveal**, then **Play samples**, to watch the city, landmark, and combined views in sequence.
4. Adjust brightness and hold time, pause the sequence, or step through manually.

| Layout | Display face | Arrangement |
| --- | --- | --- |
| A · City + symbol | 2:1 | City beside its landmark |
| B · Postcard | 1:1 | City above its landmark |
| C · Skyline | 3:1 | City above a schematic skyline and landmark |
| D · Reveal | 2:1 | City, landmark, and combined views in sequence |
| E · Landmark beside city | 2:1 | Larger landmark at left, city at right, airport/carrier footer |
| F · City below | 2:1 | Landmark above origin airport (left), city (middle), and sample carrier (right); default |
| G · City above | 2:1 | Airport, city, and carrier heading above a wide landmark area |

All three layouts E–G show the origin airport code at left and a sample carrier at right, in slightly dimmer lettering than the city. At 128 × 64 LEDs, E reserves 64 × 49 pixels for the landmark; F and G reserve 120 × 49 (120 × 41 when a long city needs two lines), compared with approximately 40 × 54 in A. Each icon retains its original proportions, so a tall tower will not fill the same width as a bridge. At 32 rows, carriers use compact codes, and F/G stack the city and metadata lines; the extra information leaves less room for the landmark.

Sample origins: New York (LGA), London (LHR), Paris (CDG), San Francisco (SFO), Seattle (SEA), and Tokyo (HND). All sample destinations are Chicago O’Hare (ORD). These samples do not represent current flights.

Sample carriers are United Airlines, British Airways, Air France, Alaska Airlines, and All Nippon Airways. They are illustrative data for comparing the footer, not live airline assignments.

## How it works

The renderer draws a whole-pixel bitmap font and samples prepared landmark alpha pixels into the selected LED grid. It clears the visible canvas directly before drawing each complete frame as amber LED dots. Artwork is available immediately, without browser image decoding, offscreen canvases, or question-mark placeholders. Manual selections replace the display immediately; sample playback can animate between pixel buffers.

The 32-row setting intentionally shows the limits of coarse panels: small details are omitted and long names may occupy the entire sign. Skyline context buildings are schematic, not geographically accurate. Browser size and brightness are not calibrated to physical dimensions or light output; weather resistance and electrical behavior are not emulated.

## Develop

Python 3.10 or newer is needed only to rebuild the generated files. The build uses the standard library.

```sh
python build_emulator.py
```

Then reopen or refresh `index.html`. Optional local server:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/ .

| File | Purpose |
| --- | --- |
| `porch-display.template.html` | Interface, sample data, LED font, and rendering logic |
| `standalone.css` | Browser styles for the controls surrounding the sign |
| `assets/` | Original city SVG artwork |
| `assets/landmark-pixels.json` | Prepared landmark pixels and source hashes |
| `rasterize_artwork.cjs` | Optional SVG-to-pixel preparation using Sharp |
| `build_emulator.py` | Validates prepared artwork and builds both outputs |
| `index.html` | Self-contained browser application |
| `porch-display.html` | Self-contained conversation visualization fragment |

Both generated HTML files are checked in so the emulator works immediately after cloning or downloading the repository. Rebuild them after editing the template, CSS, or artwork.

Only when changing the original SVG artwork, regenerate its pixel data first (Node.js and Sharp required):

```sh
npm install --no-save --no-package-lock sharp@0.35.4
node rasterize_artwork.cjs
python build_emulator.py
```

Normal layout changes still require only the Python build. Source hashes prevent an outdated pixel asset from silently being used after an SVG edit.

## Next steps

- Refine the selected 2:1 aspect ratio and choose the preferred landmark arrangement.
- Refine library artwork for small LED grids.
- Add a flight-data adapter that separates live positions from route information.
- Tune aircraft selection to the visible sky and avoid rapid switching between nearby planes.
- Prototype a physical panel and sheltered outdoor enclosure.

## Credits

[City Icons](https://svgcities.com/) by [Studio Partdirector](https://partdirector.ch), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See [the artist’s license statement](https://svgcities.com/license) and [source repository](https://github.com/anto1/city-icons/tree/main/public/icons).

The six original SVG files were downloaded on 2026-09-11. The emulator crops, rasterizes, thresholds, and recolors the artwork. The artwork license applies separately from the application code.

## Validation

The original emulator was checked in a browser across all six icons, all four layouts, and all three resolutions. City selection, manual reveal phases, brightness, timing, automatic advancement, pause, and finite six-flight completion were verified. The standalone page was also checked at 736px and 360px widths: all six icons loaded, city and layout selection worked, reveal phases rendered, and there was no horizontal overflow at 360px. No browser warnings or errors were reported.

The larger-landmark update was checked across all 54 combinations of E–G, six cities, and three resolutions. Every combination loaded all six icons, rendered lit pixels, preserved its selected city and resolution, and retained the 2:1 ratio. New York and San Francisco were visually inspected, including the complete long city name at 360px. No browser warnings or errors were reported.

The redraw fix adds regression checks for immediate artwork availability in a restricted renderer without image APIs, all 54 E–G combinations, identical frames when returning to a previous selection, and rejection of stale animation callbacks. Run them after building:

```sh
node --test tests/renderer.test.cjs
```

A browser screenshot comparison also verified that switching through different cities and layouts and returning to New York produces exactly the original canvas image.
