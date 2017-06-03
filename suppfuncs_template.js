/*global window, document */
/*jslint browser, multivar, white, fudge, for */

var app = (function () {
    "use strict";

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
        var req = new XMLHttpRequest();
        src = src.slice(0, src.lastIndexOf(".")) + ".txt";
        console.log("Fetching text URL: " + src);
        req.open("GET", src, true);
        req.onreadystatechange = function() {
            if(req.readyState === 4) {    //ready to access
                if(req.status === 200) {  //successful request
                    tn.innerHTML = req.responseText; } } };
        req.send(null);
    }


    function init () {
        var i, nodes = document.getElementsByTagName("img");
        //nodes is an HTMLCollection, not an array.  Basic iteration only.
        for(i = 0; nodes && nodes.length && i < nodes.length; i += 1) {
            var tn;
            nodes[i].title = nodes[i].src;
            nodes[i].addEventListener("click", app.toggleImageDisplayClass);
            tn = nodes[i].parentNode.nextSibling;
            if(tn) {
                fetchTextFileContent(tn, nodes[i].src); } }
    }


    return {
        init: function () { init(); },
        toggleImageDisplayClass: function (evt) { toggleDispClass(evt); }
    };
}());

app.init();
