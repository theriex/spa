# spa
Simple Photo Album

Makes a web site out of directories of photos, optionally with accompanying
text files and audio recordings.  Leaves the source files alone, only writes
index.html files.  Requires node.js to run.


Basic use:
---------

From the command line, wherever you downloaded the files:
```
node make_index_files.js PICSPATH
```
Where PICSPATH is the name of the folder where your pictures are.  If you
don't specify PICSPATH, make_index_files.js looks for a directory below it
called "pics".


How it works:
------------

The app writes an index.html file in PICSPATH, and walks every folder in
PICSPATH writing index.html files linked to the parent index.html.  So you
end up with a tree of index.html pages you can easily browse.

The main reason to use the app is for associating text with photos to make a
photo album.  If you have a file called myphoto.png and you also have a file
called myphoto.txt in the same folder, the app figures the text should be a
caption for the photo.  The goal is to separate media organization and html
writing so you don't have to do both at the same time.

In actual fact you end up making changes to your files after seeing them in
the browser, and you make changes to html based on your media, but it's
still easier to separate those concerns.


Name hacks:
----------

There are flags you can include in the names of files or folders to cause
special handling:

  - "&#95;xnoi&#95;" (no index) means don't include this file or folder
    in the generated html.

  - "&#95;xsec&#95;" (section) means include the contents of this folder as
    a section in the parent page rather than writing a separate html file.

  - "&#95;xntr&#95;" (no traversal) means include a link to this folder but
    don't generate any html for it.

Name flags are ignored when associating filenames.


Sample associations:
-------------------

  - If myphoto.png and myphoto.txt, then the text from myphoto.txt becomes
    a caption describing the image for myphoto.png.

  - If myphoto.png and myphoto.html, then the html from myphoto.html becomes
    the image caption.  If both .html and .txt are exist, the .html is used.

  - Freestanding .txt or .html files become freestanding sections in the
    generated html page.

  - If myphoto.png and myphoto.mp3, the .mp3 is audio about the photo.  It
    might also be a pic for a music file.  Either way.

  - If myfolder and myfolder.png, then the pic is an image to accompany the
    folder link for added visual interest. 


Special files:
-------------

  - SPA_Opts.txt specifies options to change default behavior.  For example:
    ```
    pagetitle=theriex's page
    sort=reverse
    after=lastfolder
    pagepic=mainpic_xnoi_.png
    pagecss=site_xnoi_.css
    titlehtml=sitetitle_xnoi_.html
    ```
    If titlehtml is specified, then its contents replaces what would have
    been displayed for the pagetitle.


Advanced use:
------------

  - A .link file is understood as a reference to non-local media.  The name
    of the file is used as the text for the link, and the contents is
    interepreted as a media URL.  At the time of this writing, a url
    containing "youtube.com" or "youtu.be" should work.

  - To override the look of the generated site pages, create an album.css
    file in the same directory as make_index_files.js

  - To read the text files dynamically rather than copying the text into the
    index.html files, specify
    ```
    node make_index_files.js -dynamic PICSPATH
    ```
    You will need to access index.html via a web server rather than as a
    static file to see the text.  If you do not have a web server already
    installed try 
    ```
    sudo npm install http-server -g
    cd docroot
    http-server
    ```
    Then open a browser to http://localhost:8080 and marvel at how slowly
    the browser loads.  Might be better off running the generator every 5
    seconds in a command shell loop.
    

