# spa
Simple Photo Album

Makes a web site out of directories of photos.  Leaves source files alone.
Requires node.js to build the site, and http-server or the equivalent to
view the site.  You can install http-server using the node package manager:
$ npm install http-server -g

File Interpretation:
-------------------

  - All Web page compatible image files become page images.  Files may
    optionally start with YYYY_MM_DD or some subpart. An "_xdsm_" in the
    name means display small, "_xnoi_" means don't include in page.

  - A corresponding .txt file is a comment for a photo.  A corresponding
    .mp3 file is audio about a photo.  Any freestanding .txt files become
    paragraphs in the page.

  - Files can be organized into directories using the same naming used for
    photo files.  A subdir with "_xsec_" in the name gets made into a
    section within the parent directory, otherwise each directory gets its
    own page.

Usage:
-----

$ node make_index_files.js picspath
$ http-server picspath

make_index_files.js looks for a directory below it called "pics" if no
picspath specified.  The css to be inserted into each index file is pulled
from picspath/album.css if that file exists, otherwise it is copied from
album_template.css.  Only index.html files are written.

