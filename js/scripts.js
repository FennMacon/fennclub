var mb = document.getElementById("imgmb").style;
var tv = document.getElementById("imgtv").style;
var sp = document.getElementById("imgsp").style;
var ow = document.getElementById("imgow").style;
const head = document.getElementById("topname");
let namecount = 0

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



        ++namecount;
        if (namecount == 20) {
            head.innerHTML = "stop that";
        }
        if (namecount == 25) {
            head.innerHTML = "this is just rude";
        }
        if (namecount == 30) {
            head.innerHTML = "are you having fun?";
        }
        if (namecount == 35) {
            head.innerHTML = "I'm gonna scream";
        }
        if (namecount == 40) {
            head.innerHTML = "if you do this again I'm leaving";
        }
        if (namecount == 41) {
            head.innerHTML = "wow, bye!";
        }
        if (namecount == 42) {
            head.innerHTML = "";
        }
}

