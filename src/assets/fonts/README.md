# Fonts

`archivo-1n1.woff2` is Archivo 2.001 (SIL Open Font License 1.1, `OFL.txt`; Copyright 2020 The
Archivo Project Authors), reduced for this site with fontTools:

- the variable axes limited to weight 400–800 and width 100–125, the range the site uses;
- glyphs subset to Basic Latin, Latin-1 and the site's punctuation (U+0020–007E, U+00A0–00FF,
  dashes, curly quotes, ellipsis, bullet, interpunct, euro, trademark);
- layout features kept: kerning, ligatures, contextual alternates, tabular and lining figures.

Source: `ofl/archivo/Archivo[wdth,wght].ttf` in github.com/google/fonts. Rebuild the same way when the
site needs a character outside the subset; a missing glyph falls back to the system sans.
