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
        if(!img.style.maxHeight) {
            img.style.maxHeight = "100%";
            img.style.maxWidth = "100%"; }
        else {
            img.style.maxHeight = null;
            img.style.maxWidth = null; }
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
            inode.title = inode.src;
            inode.addEventListener("click", app.toggleImgDispClass);
            tnode = inode.parentNode.nextElementSibling;
            if(tnode) {
                tnode.className = "pbtxtdiv";
                if(mode === "dynamic") {
                    tnode.innerHTML = "<!-- " + tnode.innerHTML + " -->";
                    fetchTextFileContent(tnode, inode.src); } } }
        if(app.oninit) {  //function name set in SPA_Opts.txt
            app.oninit(); }
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


    function ytReady (event) {
        console.log("ytReady called");
    }


    function ytStart (event) {
        event.target.playVideo();
    }


    function ytStateChange (event) {
        if(event.data === 0) {
            app.playNextMedia(youtubeState.prev.id); }
    }


    function getMediaTitleHTML (html) {
        var start = "<span class=\"mediatitle\"",
            end = "</span>",
            idx = html.indexOf(start);
        if(idx >= 0) {
            html = html.slice(idx + start.length, html.indexOf(end));
            html = "<div class=\"mediatitle\">" + html + "</div>";
            return html; }
        return "";
    }


    //Not calculating size from parent div because that can vary.  The
    //appropriate size of a video presentation is relative to the screen.
    //Aspect ration for YouTube is 16:9
    function getVideoDims () {
        var vd = {w:320, h:180, maxwp:0.9, maxhp:0.5};
        vd.w = Math.max(vd.w, Math.round(vd.maxwp * window.innerWidth));
        vd.h = Math.round((vd.w / 16) * 9);
        if(vd.h > vd.maxhp * window.innerHeight) {
            vd.h = Math.round(vd.maxhp * window.innerHeight);
            vd.w = Math.round((vd.h / 9) * 16);
            if(vd.w < 320) {
                vd = {w:320, h:180}; } }
        return vd;
    }


    function play (id, url, opts) {
        var div, html, vdims;
        opts = opts || {};
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
            if(!youtubeState.ready) {
                return setTimeout(function () {
                    app.play(id, url, opts); }, 300); }
            div = app.byId(id);
            youtubeState.prev = {id:id, html:div.innerHTML};
            vdims = getVideoDims();
            div.innerHTML = getMediaTitleHTML(div.innerHTML) +
                "<div id=\"" + id + "player\"" + 
                    " style=\"width:" + vdims.w + "px;" +
                             "height:" + vdims.h + "px;\"></div>";
            youtubeState.player = new YT.Player(
                id + "player",
                {width:vdims.w, height:vdims.h, videoId:ytVidId(url),
                 events: {"onReady":(opts.loadonly? ytReady : ytStart),
                          "onStateChange":ytStateChange}}); }
        else if(id.indexOf("audiodiv") > 0) {
            div = app.byId(id);
            mediaState.prev = {id:id, html:div.innerHTML};
            div.innerHTML = getMediaTitleHTML(div.innerHTML) +
                "<audio src=\"" + url + "\"" +
                " controls id=\"" + id + "player\"" +
                " onended=\"app.playNextMedia('" + id + "');return false;\"" +
                "></audio>";
            app.byId(id + "player").play(); }
        else if(id.indexOf("videodiv") > 0) {
            div = app.byId(id);
            mediaState.prev = {id:id, html:div.innerHTML};
            html = getMediaTitleHTML(div.innerHTML) +
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
        var elem = app.byId(id),  //video or audio player div
            sib = elem.nextElementSibling,
            link;
        if(sib && sib.tagName.toLowerCase() === "div" &&
           sib.id && (sib.id.endsWith("audiodiv") ||
                      sib.id.endsWith("YTdiv"))) {
            link = sib.firstElementChild;
            if(link && link.href) {
                play(sib.id, link.href); } }
    }


    return {
        init: function () { init(); },
        toggleImgDispClass: function (evt) { toggleDispClass(evt); },
        byId: function (elemid) { return document.getElementById(elemid); },
        play: function (id, url, opts) { play(id, url, opts); },
        playNextMedia: function (id) { playNextMedia(id); }
    };
}());

