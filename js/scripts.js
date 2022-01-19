var mb = document.getElementById("imgmb").style;
var tv = document.getElementById("imgtv").style;
var sp = document.getElementById("imgsp").style;
var ow = document.getElementById("imgow").style;

function togglemb() {
    if (mb.display == "none" || mb.display == "") {
        mb.display = "flex";
    } else {
        mb.display = "none";
    }
}

function toggletv() {
    if (tv.display == "none" || tv.display == "") {
        tv.display = "block";
    } else {
        tv.display = "none";
    }
}

function togglesp() {
    if (sp.display == "none" || sp.display == "") {
        sp.display = "flex";
    } else {
        sp.display = "none";
    }
}

function toggleow() {
    if (ow.display == "none" || ow.display == "") {
        ow.display = "block";
    } else {
        ow.display = "none";
    }
}