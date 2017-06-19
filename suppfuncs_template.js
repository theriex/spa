/*global window, document */
/*jslint browser, multivar, white, fudge, for */

var app = (function () {
    "use strict";

    var mode = "$MODE";

    function toggleDispClass (evt) {
        var img = evt.target;
        evt.preventDefault();
        evt.stopPropagation();
        if(!img.style.maxHeight || img.style.maxHeight === "200px"
                                || img.style.maxHeight === "100px") {
            img.style.maxHeight = "100%";
            img.style.maxWidth = "100%"; }
        else {
            if(img.className === "smallimg") {
                img.style.maxHeight = "100px";
                img.style.maxWidth = "160px"; }
            else {
                img.style.maxHeight = "200px";
                img.style.maxWidth = "320px"; } }
    }


    function fetchTextFileContent (tn, src) {
        var txt, req = new XMLHttpRequest();
        src = src.slice(0, src.lastIndexOf(".")) + ".txt";
        console.log("Fetching text URL: " + src);
        req.open("GET", src, true);
        req.onreadystatechange = function() {
            if(req.readyState === 4) {    //ready to access
                if(req.status === 200) {  //successful request
                    txt = req.responseText;
                    txt = txt.replace(/\n\n/g, "<br/><br/>\n\n");
                    tn.innerHTML += "<br/>" + txt; } } };
        req.send(null);
    }


    function init () {
        var inode, tnode, i, nodes = document.getElementsByTagName("img");
        //nodes is an HTMLCollection, not an array.  Basic iteration only.
        for(i = 0; nodes && nodes.length && i < nodes.length; i += 1) {
            inode = nodes[i];
            tnode = inode.parentNode.nextElementSibling;
            if(inode.src.indexOf(".none") >= 0) {
                inode.style.display = "None";
                if(mode === "dynamic") {  //hide placeholder text
                    tnode.innerHTML = "<!-- " + tnode.innerHTML + " -->"; }
                tnode.className = "textblockdiv"; }
            else {
                inode.title = inode.src;
                inode.addEventListener("click", app.toggleImgDispClass); }
            if(tnode && mode === "dynamic") {
                fetchTextFileContent(tnode, inode.src); } }
    }


    return {
        init: function () { init(); },
        toggleImgDispClass: function (evt) { toggleDispClass(evt); }
    };
}());

app.init();
