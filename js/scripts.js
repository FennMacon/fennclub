var mb = document.getElementById("imgmb").style;
var tv = document.getElementById("imgtv").style;
var sp = document.getElementById("imgsp").style;
var ow = document.getElementById("imgow").style;
var head = document.getElementById("topname");

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

function namechange() {
    const fonts = ['Roboto', 'Roboto Mono', 'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Georgia', 'Garamond', 'Courier New', 'Brush Script MT', 'Comic Sans'];
    const random = Math.floor(Math.random() * fonts.length);

        head.style.fontFamily = fonts[random];
}

