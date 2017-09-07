/*global window, document */
/*jslint browser, multivar, white, fudge, for */

var app = (function () {
    "use strict";

    var mode = "$MODE",
        mediaState = {};

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


    function ytVidId (url) {
        var vid = url;
        if(vid.indexOf("v=") > 0) {
            vid = vid.slice(vid.indexOf("v=") + 2);
            if(vid.indexOf("&") > 0) {
                vid = vid.slice(0, vid.indexOf("&")); } }
        else {
            vid = vid.split("/");
            vid = vid[vid.length - 1]; }
        return vid;
    }


    function ytStart (event) {
        event.target.playVideo();
    }


    function ytStateChange (event) {
        if(event.data === 0) {
            app.playNextMedia(youtubeState.prev.id); }
    }


    function getMediaTitleSpan (html) {
        var start = "<span class=\"mediatitle\"",
            end = "</span>",
            idx = html.indexOf(start);
        if(idx >= 0) {
            html = html.slice(idx, html.indexOf(end) + end.length);
            return html; }
        return "";
    }


    function play (id, url) {
        var div, html;
        //clear previous playing (if any)
        if(youtubeState && youtubeState.prev) {
            youtubeState.player.clearVideo();
            div = app.byId(youtubeState.prev.id);
            div.innerHTML = youtubeState.prev.html;
            youtubeState.prev = null; }
        if(mediaState && mediaState.prev) {
            div = app.byId(mediaState.prev.id);
            div.innerHTML = mediaState.prev.html;
            mediaState.prev = null; }
        //start new player
        if(id.indexOf("YTdiv") > 0) {
            div = app.byId(id);
            youtubeState.prev = {id:id, html:div.innerHTML};
            div.innerHTML = getMediaTitleSpan(div.innerHTML) +
                "<div id=\"" + id + "player\"></div>";
            youtubeState.player = new YT.Player(
                id + "player",
                {width:420, height:315, videoId:ytVidId(url),
                 events: {"onReady":ytStart,
                          "onStateChange":ytStateChange}}); }
        else if(id.indexOf("audiodiv") > 0) {
            div = app.byId(id);
            mediaState.prev = {id:id, html:div.innerHTML};
            div.innerHTML = getMediaTitleSpan(div.innerHTML) +
                "<audio src=\"" + url + "\"" +
                " controls id=\"" + id + "player\"" +
                " onended=\"app.playNextMedia('" + id + "');return false;\"" +
                "></audio>";
            app.byId(id + "player").play(); }
        else if(id.indexOf("videodiv") > 0) {
            div = app.byId(id);
            mediaState.prev = {id:id, html:div.innerHTML};
            html = getMediaTitleSpan(div.innerHTML) +
                "<video controls id=\"" + id + "player\"" +
                " onended=\"app.playNextMedia('" + id + "');return false;\"" +
                ">";
            url.slice(url.lastIndexOf(".") + 1).split("|").forEach(
                function (ext) {
                    html += "<source src=\"" + 
                        url.slice(0, url.lastIndexOf(".") + 1) + ext + "\"" +
                        " type=\"video/" + ext + "\">"; });
            html += "</video>";
            div.innerHTML = html; }
        else {
            alert("Don't know how to play that"); }
    }


    function playNextMedia (id) {
        //If the next item is also playable media, assume it's the next
        //track in a sequence and should be played.  Otherwise let the user
        //click something to continue.
        var i, elem, child, link;
        elem = app.byId(id);  //audiodiv
        elem = elem.parentNode;  //picblockdiv
        elem = elem.nextElementSibling;  //next picblockdiv (if any)
        if(elem) {
            for(i = 0; i < elem.children.length; i += 1) {
                child = elem.children[i];
                if(child.tagName.toLowerCase() === "div" &&
                   child.id && (child.id.endsWith("audiodiv") ||
                                child.id.endsWith("YTdiv"))) {
                    link = child.firstElementChild;
                    if(link && link.href) {
                        play(child.id, link.href);
                        break; } } } }
    }


    return {
        init: function () { init(); },
        toggleImgDispClass: function (evt) { toggleDispClass(evt); },
        byId: function (elemid) { return document.getElementById(elemid); },
        play: function (id, url) { play(id, url); },
        playNextMedia: function (id) { playNextMedia(id); }
    };
}());

app.init();
