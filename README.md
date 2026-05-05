# su9king.github.io

A composition in software — by Min Chul Shin.

12 slides arguing that software is art. Click anywhere or press any key
to advance. The piece runs forward only and is meant to be experienced
**once** — returning visitors land directly on the signature slide.

## Music

Drop a single audio file as `music.mp3` in the repo root. The page
will pick it up automatically. The track is routed through a Web Audio
lowpass filter that opens up across the slides, so the music feels muffled
and quiet at the start and wide-open and loud at the climax (slide 10),
then resolves.

The site still works without `music.mp3` — it just runs silent.

### Recommended tracks

For a 3–6 minute piece that suits a contemplative cinematic build:

- **Erik Satie — Gymnopédie No. 1** (public domain) · [Musopen](https://musopen.org/music/2353-3-gymnopedies/)
- **Erik Satie — Gnossienne No. 1** (public domain) · [Musopen](https://musopen.org/music/2354-6-gnossiennes/)
- **Claude Debussy — Clair de Lune** (public domain) · [Musopen](https://musopen.org/music/2547-suite-bergamasque-l-75/)
- Royalty-free contemporary ambient piano on [Pixabay Music](https://pixabay.com/music/search/ambient%20piano/)

Download an mp3, rename it `music.mp3`, drop it in the repo root, and
push.

## One-time view

The first time someone visits, they see all 12 slides in order. After
that — even on a fresh tab, even after clearing cookies — they land
directly on the signature slide (12). The "seen" flag lives in
`localStorage`.

To reset (e.g. when developing), append `?replay` to the URL:

    https://su9king.github.io/?replay

## Stack

Pure HTML / CSS / Canvas / Web Audio. No build step, no dependencies
beyond Google Fonts. Open `index.html` in a browser, or visit
[su9king.github.io](https://su9king.github.io).
