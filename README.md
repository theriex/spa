# spa
Simple Photo Album

Creates index.html files for directories of photos and associated text.
Leaves source files alone.  Requires node.

File Interpretation:
-------------------

  - All Web page compatible image files become page images.  Files may
    optionally start with YYYY_MM_DD or some subpart. An "_xdsm_" in the
    name means display small, "_xnoi_" means don't include in page.

  - A corresponding .txt file is a comment for the photo.  A corresponding
    .mp3 file is audio about the photo.  Any freestanding .txt files become
    paragraphs in the page.

  - Files can be organized into directories using the same naming used for
    photo files.  A subdir with "_xsec_" in the name gets made into a
    section.  Otherwise each directory gets its own page.

Use:
---

$ node make_index_files.js picspath

Looks for a directory called "pics" if no picspath specified.  The css for
the pages is pulled from album.css if found, otherwise album_template.css.

