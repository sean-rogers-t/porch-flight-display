# Porch Flight Display

A browser emulator for an internet-connected LED sign that shows where overhead flights originated, alongside a recognizable city landmark. The first hardware target is a sheltered porch display with amber lettering and a black frame.

**Current version uses sample flights.** Aircraft tracking and physical hardware control are planned.

## Try it

Open **`index.html`** in a modern browser. Everything is embedded, including the six city icons. No installation, account, API key, or internet connection is needed to run the emulator.

1. Switch between the four display layouts.
2. Choose a sample city and compare 32, 64, and 128 LED rows.
3. Select **D · Reveal**, then **Play samples**, to watch the city, landmark, and combined views in sequence.
4. Adjust brightness and hold time, pause the sequence, or step through manually.

| Layout | Display face | Arrangement |
| --- | --- | --- |
| A · City + symbol | 2:1 | City beside its landmark |
| B · Postcard | 1:1 | City above its landmark |
| C · Skyline | 3:1 | City above a schematic skyline and landmark |
| D · Reveal | 2:1 | City, landmark, and combined views in sequence |

Sample origins: New York (LGA), London (LHR), Paris (CDG), San Francisco (SFO), Seattle (SEA), and Tokyo (HND). All sample destinations are Chicago O’Hare (ORD). These samples do not represent current flights.

## How it works

The renderer draws a whole-pixel bitmap font and rasterizes city SVGs into a selectable LED grid. A second canvas renders the grid as amber LED dots. The animation moves between pixel buffers, so it represents a sequence that could later run on LED hardware.

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
| `build_emulator.py` | Embeds artwork and builds both outputs |
| `index.html` | Self-contained browser application |
| `porch-display.html` | Self-contained conversation visualization fragment |

Both generated HTML files are checked in so the emulator works immediately after cloning or downloading the repository. Rebuild them after editing the template, CSS, or artwork.

## Next steps

- Choose the preferred aspect ratio and minimum resolution.
- Refine library artwork for small LED grids.
- Add a flight-data adapter that separates live positions from route information.
- Tune aircraft selection to the visible sky and avoid rapid switching between nearby planes.
- Prototype a physical panel and sheltered outdoor enclosure.

## Credits

[City Icons](https://svgcities.com/) by [Studio Partdirector](https://partdirector.ch), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See [the artist’s license statement](https://svgcities.com/license) and [source repository](https://github.com/anto1/city-icons/tree/main/public/icons).

The six original SVG files were downloaded on 2026-09-11. The emulator crops, rasterizes, thresholds, and recolors the artwork. The artwork license applies separately from the application code.

## Validation

The original emulator was checked in a browser across all six icons, all four layouts, and all three resolutions. City selection, manual reveal phases, brightness, timing, automatic advancement, pause, and finite six-flight completion were verified. The standalone page was also checked at 736px and 360px widths: all six icons loaded, city and layout selection worked, reveal phases rendered, and there was no horizontal overflow at 360px. No browser warnings or errors were reported.
