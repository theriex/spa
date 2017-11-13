/*jslint node, multivar, white, fudge */

var indexer = (function () {
    "use strict";

    var mode = "static",
        jsdir = null,
        fs = require("fs"),
        readopt = {encoding: "utf8"},
        writeopt = {encoding: "utf8"},
        picext = ["jpg", "png", "gif"],
        txtext = ["txt", "html"],
        audext = ["mp3"],
        vidext = ["mp4", "webm", "ogg"],
        linkext = ["link"],
        specialFiles = ["SPA_Opts.txt"],
        sectionStarted = false,
        haveYouTubeLink = false,
        opts = null;


    function getFileContents (path, conversion) {
        var text = "";
        try {
            text = fs.readFileSync(path, readopt);
        } catch(ignore) {
            //console.log("getFileContents: " + ignore);
            if(conversion !== "failok") {
                path = path.slice(0, path.lastIndexOf(".")) + "_template" +
                    path.slice(path.lastIndexOf("."));
                text = fs.readFileSync(path, readopt); }
        }
        if(conversion === "modemarker") {
            text = text.replace(/\$MODE/g, mode); }
        if(conversion === "txt2html") {
            text = text.replace(/\n\n/g, "<br/><br/>\n\n"); }
        return text;
    }


    function startSection (hardstart) {
        var html = "";
        if(sectionStarted && hardstart) {  //close previous section
            sectionStarted = false;
            html += "</div> <!-- hard start " + hardstart + " -->\n"; }
        if(!sectionStarted) {
            html += "<div class=\"sectiondiv\">\n";
            sectionStarted = true; }
        return html;
    }


    function endSection (marker) {
        var html = "";
        marker = marker || "";
        if(sectionStarted) {
            html = "</div> <!-- section end " + marker + " -->\n";
            sectionStarted = false; }
        return html;
    }


    function logObject (pre, obj) {
        var txt = pre || "";
        Object.keys(obj).forEach(function (key) {
            txt += "\n  " + key + ": " + obj[key]; });
        console.log(txt);
    }


    function getYouTubeScriptHTML () {
        var html;
        html = "<script src=\"https://www.youtube.com/player_api\"></script>\n";
        html += "<script>\n" +
            "var youtubeState = {ready:false};\n" +
            "function onYouTubePlayerAPIReady () {\n" +
            "    youtubeState.ready = true;\n" +
            "    if(youtubeState.startf) {\n" +
            "        youtubeState.startf(); }\n" +
            "}\n" +
            "</script>\n";
        return html;
    }


    function isYouTubeLink (link) {
        if(link.indexOf("youtube.com") > 0 || link.indexOf("youtu.be") >= 0) {
            return true; }
        return false;
    }


    function idForPath (path) {
        path = path.replace(/\//g, "");
        path = path.replace(/\./g, "");
        path = path.replace(/#/g, "");
        path = path.replace(/\s/g, "");
        path = path.replace(/_xsec_/g, "");
        path = path.replace(/_/g, "");
        path = path.replace(/-/g, "");
        path = path.replace(/"/g, "");
        path = path.replace(/'/g, "");
        return path;
    }


    function getMediaPlayLink (path, suffix, url, linkname) {
        var html, id = idForPath(path) + suffix;
        html = "<div id=\"" + id + "\">\n" +
            "<a href=\"" + url + "\"\n" +
            "   onclick=\"app.play('" + id + "','" + url + "');" +
            "return false;\">\n" +
            "&#x25b6;" + //black right pointing triangle
            "<span class=\"mediatitle\">" +linkname + "</span></a></div>";
        return html;
    }


    function getLinkContentHTML (pb) {
        var html = "",
            url = getFileContents(pb.path).trim(), 
            linkname = pb.base;
        if(linkname.indexOf(".") > 0) {
            linkname = linkname.slice(0, linkname.lastIndexOf(".")); }
        if(isYouTubeLink(url)) {
            haveYouTubeLink = true;
            html = getMediaPlayLink(pb.path, "YTdiv", url, linkname); }
        return html;
    }


    function enc (uc) {
        return encodeURIComponent(uc).replace(/[!'()*]/g, function(c) {
            return '%' + c.charCodeAt(0).toString(16); });
    }


    //By default, text is class textblockdiv. If an associated img is
    //found during app.init, then the class is switched to pbtxtdiv.
    function getPicBlockSuppHTML (pb, idx, pre) {
        var html = "", src;
        //dynamic or static caption text:
        if(mode === "dynamic") {  //txt file may be provided later..
            html += "  <div class=\"textblockdiv\" id=\"pbt" + idx + "\">" +
                pb.base + "</div>\n"; }
        else if(pb.txt) {  //include static text if given
            src = pb.path;
            if(pb.img) {
                src = src.slice(0, -1 * pb.img.length) + pb.txt; }
            //logObject("pb with text:", pb);
            //console.log("src: " + src);
            html += "  <div class=\"textblockdiv\" id=\"pbt" + idx + "\">\n" +
                getFileContents(src, "txt2html") + "</div>\n"; }
        //audio or video or external link:
        if(pb.aud) {
            html += getMediaPlayLink(pb.path, "audiodiv", 
                                     enc(pre + pb.base + "." + pb.aud),
                                     pb.base); }
        else if(pb.vid) {
            html += getMediaPlayLink(pb.path, "videodiv",
                                     enc(pre + pb.base + "." + pb.vid),
                                     pb.base); }
        else if(pb.link) {
            html += getLinkContentHTML(pb); }
        return html;
    }


    function decoratorImageHTML (pb) {
        //always include the folderdecodiv so it can be used to potentially
        //take up space in a page with sparsely decorated folders.
        var html = "<div class=\"folderdecodiv\">";
        if(pb.deco) {
            html += "<img class=\"folderdecoimg\" src=\"" + 
                pb.deco.base + "." + pb.deco.img + "\"/>"; }
        html += "</div>\n";
        return html;
    }


    function decoratorTextHTML (pb) {
        var html, base = pb.base.replace(/_xsec_/g, "");
        html = getFileContents(base + ".html", "failok");
        if(!html) {
            html = getFileContents(base + ".txt", "failok");
            if(!html) {
                html = base; }
            html = "<h2>" + html + "</h2>\n"; }
        return html;
    }


    //Not using figure and figcaption because a pic is not a figure and might
    //want audio in addition to a text label.  Simple div layout.
    function picBlockHTML (pb, idx, pre) {
        var src = "", html = "";
        //console.log("picBlockHTML: " + pb.base);
        if(pb.stat.isDirectory()) {
            if(pb.base.indexOf("_xsec_") >= 0) {
                //console.log("section dir: " + pb.path);
                html += startSection("sectional " + pb.path);
                //logObject("xsec dir", pb);
                html += decoratorImageHTML(pb);
                html += decoratorTextHTML(pb);
                html += processTree(pb, html, pb.base + "/");
                html += endSection("sectional " + pb.path); }
            else if(pb.base.indexOf("_xntr_") >= 0) {
                console.log("non-traversed dir: " + pb.path);
                html = startSection(pb.path);
                html += "<div class=\"subdirdiv\">" +
                    "<a href=\"" + pre + pb.base + "/index.html\">" +
                    pb.base.replace(/_xntr_/g, "") + "</a></div>";
                html += endSection("subdirdiv"); }
            else {
                html = startSection(pb.path);
                html += "<div class=\"subdirdiv\">" +
                    "<a href=\"" + pre + pb.base + "/index.html\">" + pb.base +
                    "</a></div>";
                html += endSection("subdirdiv"); } }
        else {
            src = pb.img? (pre + pb.base + "." + pb.img) : "";
            html = startSection();  //verify section started
            html += "<div class=\"picblockdiv\">\n"; 
            if(src) {
                html += "  <div class=\"pbimgdiv\" id=\"pbi" + idx + "\">\n";
                html += "    <img src=\"" + src + "\"/></div>\n"; }
            html += getPicBlockSuppHTML(pb, idx, pre);
            html += "</div> <!-- picblockdiv -->"; }
        return html + "\n";
    }


    function isIndexableFilePath (path) {
        var retval = true;
        //console.log("isIndexableFilePath: " + path);
        if(path.indexOf("_xnoi_") >= 0) {
            return false; }
        if(path.slice(-1) === "~") {
            return false; }
        specialFiles.forEach(function (spfn) {
            if(path.endsWith(spfn)) {
                retval = false; } });
        return retval;
    }


    function getIndexHTML (title, pbs, contentonly, secb) {
        var html = "";
        if(!contentonly) {  //fresh file start
            if(opts.titlehtml) {
                //console.log("reading titlehtml: " + secb + opts.titlehtml);
                html += getFileContents(secb + opts.titlehtml, "failok"); }
            if(!html) {
                html += "<h1>" + title + "</h1>\n"; }
            sectionStarted = false; }
        pbs.forEach(function (pb, idx) {
            //console.log("getIndexHTML " + idx + ": " + pb.path);
            if(isIndexableFilePath(pb.path) && !pb.folderDeco) {
                html += picBlockHTML(pb, idx, secb); } });
        if(!contentonly) {
            html += endSection("getindex"); }
        return html;
    }


    function getPicForBlocks (pbs) {
        var pic = "";
        if(opts.pagepic) {
            pic = opts.pagepic; }
        else if(pbs) {
            pbs.forEach(function (pb) {
                if(!pic && pb.img && !pb.stat.isDirectory()) {
                    pic = pb.base + "." + pb.img; } }); }
        return pic;
    }


    function getPageTitle (dirpath) {
        if(opts.pagetitle) {
            return opts.pagetitle; }
        return dirpath.slice(dirpath.lastIndexOf("/") + 1);
    }


    function makeIndex (parpb, pbs, contentonly, secb) {
        var html = "", pgt = getPageTitle(parpb.path);
        secb = secb || parpb.path + "/";
        if(!contentonly) {
            html += "<!doctype html>\n" +
                "<html>\n" +
                "<head>\n" +
                "<meta http-equiv=\"Content-Type\"" +
                " content=\"text/html; charset=UTF-8\" />\n" +
                "<meta name=\"robots\" content=\"noodp\" />\n" +
                "<meta name=\"description\" content=\"$NAME\" />\n" +
                "<meta name=\"viewport\"" +
                " content=\"width=device-width, initial-scale=1.0\">\n" +
                "<meta name=\"mobile-web-app-capable\" content=\"yes\">\n" +
                "<title>$NAME</title>\n" +
                "<link rel=\"icon\" href=\"$PAGEPIC\" />\n" +
                "<link rel=\"image_src\" href=\"$PAGEPIC\" />\n" +
                "<style type=\"text/css\">\n";
            html = html.replace(/\$NAME/g, pgt);
            html = html.replace(/\$PAGEPIC/g, getPicForBlocks(pbs));
            //write css
            html += getFileContents(jsdir + "album.css");
            html += "</style>\n";
            if(opts.pagecss) {
                html += "<link href=\"" + opts.pagecss + "\"" +
                    " rel=\"stylesheet\" type=\"text/css\" />\n"; }
            html += "</head>\n<body id=\"bodyid\">\n"; }
        //write html
        html += getIndexHTML(pgt, pbs, contentonly, secb);
        if(!contentonly) {
            //write supporting js funcs
            if(haveYouTubeLink) {
                html += getYouTubeScriptHTML(); }
            html += "\n<script>\n";
            html += getFileContents(jsdir + "suppfuncs.js", "modemarker");
            html += "</script>\n";
            html += "</body>\n</html>\n";
            fs.writeFileSync(parpb.path + "/index.html", html, writeopt); }
        return html;
    }


    function isKnownFileExtension (ext) {
        ext = ext.toLowerCase();
        if(picext.indexOf(ext) >= 0) {
            return true; }
        if(txtext.indexOf(ext) >= 0) {
            return true; }
        if(audext.indexOf(ext) >= 0) {
            return true; }
        if(vidext.indexOf(ext) >= 0) {
            return true; }
        return false;
    }


    function getBaseName (fname) {
        if(!fname || fname.indexOf(".") === 0 || fname === "index.html" ||
               fname.indexOf("~") === fname.length - 1) {
            return ""; }
        if(fname.indexOf(".") > 0 &&
           isKnownFileExtension(fname.slice(fname.lastIndexOf(".") + 1))) {
            fname = fname.slice(0, fname.lastIndexOf(".")); }
        return fname;
    }


    function addFileToBlock (pb, pdir, fname) {
        var ext = "";
        if(!pb.path) {
            pb.path = pdir + "/" + fname; }
        if(!pb.stat) {
            pb.stat = fs.statSync(pb.path); }
        if(fname.indexOf(".") > 0) {
            ext = fname.slice(fname.lastIndexOf(".") + 1);
            if(picext.indexOf(ext.toLowerCase()) >= 0) {
                pb.img = ext; }
            else if(txtext.indexOf(ext.toLowerCase()) >= 0) {
                pb.txt = ext; }
            else if(audext.indexOf(ext.toLowerCase()) >= 0) {
                pb.aud = ext; }
            else if(vidext.indexOf(ext.toLowerCase()) >= 0) {
                if(pb.vid) { //already had one video format
                    pb.vid += "|" + ext; }
                else {
                    pb.vid = ext; } }
            else if(linkext.indexOf(ext.toLowerCase()) >= 0) {
                pb.link = ext; } }
        //console.log("addFileToBlock: " + fname + ", pb.base: " + pb.base + ", pb.img: " + pb.img + ", pb.txt: " + pb.txt + ", pb.aud:" + pb.aud + ", pb.vid: " + pb.vid + ", pb.link: " + pb.link);
    }


    function noteFolderDecoratorFiles (pbs) {
        pbs.forEach(function (pb) {
            if(pb.stat.isDirectory()) {
                pb.corename = pb.base;
                pb.corename = pb.corename.replace(/_xsec_/g, "");
                pb.corename = pb.corename.replace(/_xntr_/g, "");
                pbs.forEach(function (df) {
                    if(df.base === pb.corename && !df.stat.isDirectory()) {
                        //console.log(df.path + " decorates folder " + pb.base);
                        df.folderDeco = pb;
                        pb.deco = df; } }); } });
    }


    function readOptionOverrides (dn) {
        var txt = getFileContents(dn + "/SPA_Opts.txt", "failok");
        opts = {sort:1};
        if(!txt) {
            return; }
        txt = txt.split("\n");
        txt.forEach(function (line) {
            line = line.split("=");
            switch(line[0].trim().toLowerCase()) {
            case "sort":
                if(line[1].trim().toLowerCase() === "reverse") {
                    opts.sort = -1; }
                break;
            case "pagepic":
                opts.pagepic = line[1].trim(); break;
            case "pagecss":
                opts.pagecss = line[1].trim(); break;
            case "pagetitle":
                opts.pagetitle = line[1].trim(); break;
            case "titlehtml":
                opts.titlehtml = line[1].trim(); break;
            default: 
                if(line[0].trim()) {
                    console.log("Unrecognized SPA_Opts id: " + line[0]); }}});
    }


    function processTree (parpb, contentonly, secb) {
        var html, pbd = {}, pbs = [], dirlist;
        if(!isIndexableFilePath(parpb.path)) {
            console.log("no index: " + parpb.path);
            return ""; }
        dirlist = fs.readdirSync(parpb.path);
        if(!dirlist || !dirlist.length) {
            console.log("no dir " + parpb.path);
            return ""; }
        console.log("processTree: " + parpb.path);
        readOptionOverrides(parpb.path);
        //console.log(parpb.path + ": " + dirlist.length + " files");
        dirlist.forEach(function (fname) {
            var bn, pb;
            bn = getBaseName(fname);
            if(bn) {  //not a hidden file
                pb = pbd[bn] || {base:bn};
                pbd[bn] = pb;
                addFileToBlock(pb, parpb.path, fname); } });
        Object.keys(pbd).forEach(function (bn) {
            pbs.push(pbd[bn]); });
        pbs.sort(function (a, b) {
            var n1 = a.base.toLowerCase(),
                n2 = b.base.toLowerCase();
            if(n1 < n2) { return -1 * opts.sort; }
            if(n1 > n2) { return 1 * opts.sort; }
            return 0; });
        // console.log("pbs dump:");
        // pbs.forEach(function (pb) {
        //     console.log("    " + pb.path); });
        noteFolderDecoratorFiles(pbs);
        // pbs.forEach(function (pb, idx) {
        //     console.log("processTree " + idx + ": " + pb.base); });
        html = makeIndex(parpb, pbs, contentonly, secb);
        pbs.forEach(function (pb) {
            if(pb.stat.isDirectory() &&(pb.base.indexOf("_xsec_") < 0) &&
                                       (pb.base.indexOf("_xntr_") < 0)) {
                processTree(pb); } });
        return html;
    }


    function run (argv) {
        var root = argv[1],
            pdir = argv[2],
            scriptname = "make_index_files.js";
        if(pdir && pdir.indexOf("-dyn") === 0) {
            mode = "dynamic";
            pdir = argv[3]; }
        jsdir = root.slice(0, -1 * scriptname.length);
        pdir = pdir || jsdir + "pics";
        console.log("jsdir: " + jsdir);
        console.log(" pdir: " + pdir);
        console.log(" mode: " + mode);
        processTree({path:pdir});
    }
        

    return {
        run: function (argv) { run(argv); }
    };
}());

indexer.run(process.argv);
