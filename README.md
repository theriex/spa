# spa
Simple Photo Album

Makes a web site out of directories of photos, optionally with accompanying
text files and audio recordings.  Leaves the source files alone, only writes
index.html files.  Requires node.js to run.


File Interpretation:
-------------------

  - All Web page compatible image files become page images.  Any file
    with "&#95;xnoi&#95;" in the name is not included in the page.

  - A corresponding .txt file is a comment for a photo.  A corresponding
    .mp3 file is audio about a photo.  Any freestanding .txt files become
    paragraphs in the page.

  - Files can be organized into folders/directories.  Any folder with
    "&#95;xsec&#95;" in the name gets made into a section within the parent
    folder page.  Folders with "&#95;xntr&#95;" are linked but not traversed.


Basic use:
---------

From the command line:
```
node make_index_files.js PICSPATH
```
Where PICSPATH is the name of the folder where your pictures are.  If you
don't specify PICSPATH, make_index_files.js looks for a directory below it
called "pics".


Advanced use:
------------

  - To override the look of the generated site pages, create an album.css
    file in the same directory as make_index_files.js

  - To read the text files dynamically rather than copying the text into the
    index.html files, specify
    ```
    node make_index_files.js -dynamic PICSPATH
    ```
    You will need to access index.html via a web server rather than as a
    static file to see the text.

