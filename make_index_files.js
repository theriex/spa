/*jslint node, multivar, white, fudge */

var indexer = (function () {
    "use strict";

    var jsdir = null,
        fs = require("fs"),
        readopt = {encoding: "utf8"},
        writeopt = {encoding: "utf8"},
        picext = ["jpg", "png", "gif"],
        txtext = ["txt"],
        audext = ["mp3"],
        sectionStarted = false;


    function getFileContents (fname) {
        var text = "", path = jsdir + fname;
        try {
            text = fs.readFileSync(path, readopt);
        } catch(ignore) {
            path = path.slice(0, path.lastIndexOf(".")) + "_template" +
                path.slice(path.lastIndexOf("."));
            text = fs.readFileSync(path, readopt);
        }
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


    //Not using figure and figcaption because a pic is not a figure and might
    //want audio in addition to a text label.
    function picBlockHTML (pb, idx, pre) {
        var src = "", html = "";
        //console.log("picBlockHTML: " + pb.base);
        if(pb.stat.isDirectory()) {
            if(pb.base.indexOf("_xsec_") >= 0) {
                console.log("section dir: " + pb.path);
                html += startSection("sectional " + pb.path);
                //logObject("xsec dir", pb);
                html += "<h2>" + pb.base.replace(/_xsec_/g, "") + "</h2>\n";
                html += processTree(pb.path, html, pb.base + "/");
                html += endSection("sectional " + pb.path); }
            else {
                html = startSection(pb.path);
                html += "<div class=\"subdirdiv\">" +
                    "<a href=\"" + pre + pb.base + "/index.html\">" + pb.base +
                    "</a></div>";
                html += endSection("subdirdiv"); } }
        else {  //always write an img for latching free text retrieval
            src = pb.base + "." + (pb.img || "none");
            html = startSection();
            html += "<div class=\"picblockdiv\">\n" +
                "  <div class=\"pbimgdiv\" id=\"pbi" + idx + "\">\n" +
                "    <img src=\"" + pre + src + "\"/></div>\n" +
                "  <div class=\"pbtxtdiv\" id=\"pbt" + idx + "\">" +
                pb.base + "</div>\n";
            if(pb.aud) {
                html += "<div class=\"pbauddiv\">" +
                    "<audio src=\"" + pre + pb.base + "." + pb.aud + "\">" +
                    "</audio></div>"; }
            html += "</div> <!-- picblockdiv -->"; }
        return html + "\n";
    }


    function getIndexHTML (title, pbs, contentonly, base) {
        var html = "";
        if(!contentonly) {  //fresh file start
            html += "<h1>" + title + "</h1>\n";
            sectionStarted = false; }
        pbs.forEach(function (pb, idx) {
            //console.log("getIndexHTML " + idx + ": " + pb.path);
            if(pb.path.indexOf("_xnoi_") < 0) {
                html += picBlockHTML(pb, idx, base); } });
        if(!contentonly) {
            html += endSection("getindex"); }
        return html;
    }


    function getPicForBlocks (pbs) {
        var pic = "";
        if(pbs) {
            pbs.forEach(function (pb) {
                if(!pic && pb.img && !pb.stat.isDirectory()) {
                    pic = pb.base + "." + pb.img; } }); }
        return pic;
    }


    function makeIndex (pics, pbs, contentonly, base) {
        var html = "", title = pics.slice(pics.lastIndexOf("/") + 1);
        base = base || "";
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
                "<title>$NAME</title>\n" +
                "<link rel=\"icon\" href=\"$PAGEPIC\" />\n" +
                "<link rel=\"image_src\" href=\"$PAGEPIC\" />\n" +
                "<style type=\"text/css\">\n";
            html = html.replace(/\$NAME/g, title);
            html = html.replace(/\$PAGEPIC/g, getPicForBlocks(pbs));
            //write css
            html += getFileContents("album.css");
            html += "</style>\n</head>\n<body id=\"bodyid\">\n"; }
        //write html
        html += getIndexHTML(title, pbs, contentonly, base);
        if(!contentonly) {
            //write supporting js funcs
            html += "\n<script>\n";
            html += getFileContents("suppfuncs.js");
            html += "</script>\n</body>\n</html>\n";
            fs.writeFileSync(pics + "/index.html", html, writeopt); }
        return html;
    }


    function isKnownFileExtension (ext) {
        if(picext.indexOf(ext) >= 0) {
            return true; }
        if(txtext.indexOf(ext) >= 0) {
            return true; }
        if(audext.indexOf(ext) >= 0) {
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


    function addFileToBlock (pb, pics, fname) {
        var ext = "";
        if(!pb.path) {
            pb.path = pics + "/" + fname; }
        if(!pb.stat) {
            pb.stat = fs.statSync(pb.path); }
        if(fname.indexOf(".") > 0) {
            ext = fname.slice(fname.lastIndexOf(".") + 1);
            if(picext.indexOf(ext.toLowerCase()) >= 0) {
                pb.img = ext; }
            else if(txtext.indexOf(ext.toLowerCase()) >= 0) {
                pb.txt = ext; }
            else if(audext.indexOf(ext.toLowerCase()) >= 0) {
                pb.aud = ext; } }
    }


    function processTree (pics, contentonly, base) {
        var html, pbd = {}, pbs = [], dirlist;
        if(pics.indexOf("_xnoi_") >= 0) {
            console.log("no index: " + pics);
            return ""; }
        dirlist = fs.readdirSync(pics);
        if(!dirlist || !dirlist.length) {
            console.log("no dir " + pics);
            return ""; }
        console.log("processTree: " + pics);
        //console.log(pics + ": " + dirlist.length + " files");
        dirlist.forEach(function (fname) {
            var bn, pb;
            bn = getBaseName(fname);
            if(bn) {  //not a hidden file
                pb = pbd[bn] || {base:bn};
                pbd[bn] = pb;
                addFileToBlock(pb, pics, fname); } });
        Object.keys(pbd).forEach(function (bn) {
            pbs.push(pbd[bn]); });
        pbs.sort(function (a, b) {
            var n1 = a.base.toLowerCase(),
                n2 = b.base.toLowerCase();
            if(n1 < n2) { return -1; }
            if(n1 > n2) { return 1; }
            return 0; });
        // pbs.forEach(function (pb, idx) {
        //     console.log("processTree " + idx + ": " + pb.base); });
        html = makeIndex(pics, pbs, contentonly, base);
        pbs.forEach(function (pb) {
            if(pb.stat.isDirectory() && (pb.base.indexOf("_xsec_") < 0)) {
                processTree(pics + "/" + pb.base); } });
        return html;
    }


    function run (root, pics) {
        var scriptname = "make_index_files.js";
        jsdir = root.slice(0, -1 * scriptname.length);
        pics = pics || jsdir + "pics";
        processTree(pics);
    }
        

    return {
        run: function (root, pics) { run(root, pics); }
    };
}());

indexer.run(process.argv[1], process.argv[2]);
