/*jslint node, multivar, white, fudge */

var indexer = (function () {
    "use strict"

    var jsdir = null,
        fs = require("fs"),
        readopt = {encoding: "utf8"},
        writeopt = {encoding: "utf8"},
        picext = ["jpg", "png", "gif"],
        txtext = ["txt"],
        audext = ["mp3"],
        cached = {};


    function getFileContents (fname) {
        var text = "", path = jsdir + "/" + fname;
        try {
            text = fs.readFileSync(path, readopt);
        } catch(ignore) {
            path = path.slice(0, path.lastIndexOf(".")) + "_template" +
                path.slice(path.lastIndexOf("."))
            text = fs.readFileSync(path, readopt);
        }
        return text;
    }


    //Not using figure and figcaption because a pic is not a figure and might
    //want audio in addition to a text label.
    function picBlockHTML (pb, idx) {
        var html;
        console.log("picBlockHTML: " + pb.base);
        if(pb.stat.isDirectory()) {
            html = "<div class=\"subdirdiv\">" +
                "<a href=\"" + pb.base + "/index.html\"></div>"; }
        else {
            html = "<div class=\"picblockdiv\">";
            if(pb.img) {
                html += "<div class=\"pbimgdiv\" id=\"pbi" + idx + "\">" +
                    "<img src=\"" + pb.base + "." + pb.img + "\"></div>"; }
            //always provide a div for text if found
            html += "<div class=\"pbtxtdiv\" id=\"pbt" + idx + "\"></div>";
            if(pb.aud) {
                html += "<div class=\"pbauddiv\">" +
                    "<audio src=\"" + pb.base + "." + pb.aud + "\">" +
                    "</audio></div>"; }
            html += "</div>"; }
        return html + "\n";
    }


    function getIndexHTML (pbs) {
        var html = "<div class=\"sectiondiv\">\n";
        pbs.forEach(function (pb, idx) {
            html += picBlockHTML(pb, idx); });
        html += "</div>\n";
        return html;
    }


    function makeIndex (pics, pbs) {
        var html;
        html = "<!doctype html>\n" +
            "<html>\n" +
            "<head>\n" +
            "<meta http-equiv=\"Content-Type\"" +
                 " content=\"text/html; charset=UTF-8\" />\n" +
            "<meta name=\"robots\" content=\"noodp\" />\n" +
            "<meta name=\"description\" content=\"$NAME\" />\n" +
            "<meta name=\"viewport\"" +
                 " content=\"width=device-width, initial-scale=1.0\">\n" +
            "<title>$NAME</title>\n" +
            "<style type=\"text/css\">\n";
        html = html.replace(/\$NAME/g, pics.slice(pics.lastIndexOf("/") + 1));
        html += getFileContents("album.css");
        html += "</style>\n</head>\n<body id=\"bodyid\">\n";
        html += getIndexHTML(pbs);
        html += "\n<script>\n";
        html += getFileContents("suppfuncs.js");
        html += "</script>\n</body>\n</html>\n";
        fs.writeFileSync(pics + "/index.html", html, writeopt);
    }


    function getBaseName (fname) {
        if(!fname || fname.indexOf(".") === 0 || fname === "index.html" ||
               fname.indexOf("~") === fname.length - 1) {
            return ""; }
        if(fname.indexOf(".") > 0) {
            fname = fname.slice(0, fname.lastIndexOf(".")); }
        return fname;
    }


    function addFileToBlock (pb, pics, fname) {
        var ext = "";
        if(!pb.path) {
            pb.path = pics + "/" + fname; }
        if(!pb.stat) {
            pb.stat = fs.statSync(pb.path) }
        if(fname.indexOf(".") > 0) {
            ext = fname.slice(fname.lastIndexOf(".") + 1);
            if(picext.indexOf(ext.toLowerCase()) >= 0) {
                pb.img = ext; }
            else if(txtext.indexOf(ext.toLowerCase()) >= 0) {
                pb.txt = ext; }
            else if(audext.indexOf(ext.toLowerCase()) >= 0) {
                pb.aud = ext; } }
    }


    function processTree (pics) {
        var pbd = {}, pbs = [], dirlist = fs.readdirSync(pics);
        if(!dirlist || !dirlist.length) {
            console.log("no dir " + pics);
            return; }
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
        makeIndex(pics, pbs);
        pbs.forEach(function (pb) {
            if(pb.stat.isDirectory() && (pb.base.indexOf("_xsec_") < 0)) {
                processTree(pics + "/" + pb.base); } });
    }


    function run (root, pics) {
        var scriptname = "make_index_files.js";
        jsdir = root.slice(0, -1 * scriptname.length);
        pics = pics || jsdir + "/pics";
        processTree(pics)
    }
        

    return {
        run: function (root, pics) { run(root, pics); }
    };
}());

indexer.run(process.argv[1], process.argv[2]);
