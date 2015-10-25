var width = 0,height = 0;
var bodyWidth = 0,bodyHeight = 0;
var context = null, canvas = null;
var type = null, theme = null;
var lastFormula, tim;

var transformations = [];
var down = false;
var x1, y1, y2, x2;

$(function() {
    setUpContext();
    
    width = canvas.width;
    height = canvas.height;
    bodyWidth = document.documentElement.clientWidth;
    bodyHeight = document.documentElement.clientHeight;
 
    $('#wrapper').css('left',(bodyWidth - width) / 2);
    $('#wrapper').css('right',(bodyWidth - width) / 2);
    
    redraw();
});


function setUpContext() {
	canvas = document.getElementById('canvas');

    if(!canvas.getContext) {
        alert('Error loading canvas!');
        return;
    }
    
    context = canvas.getContext('2d');
}

function redraw() {
    
    if(transformations.length != 0) {
        lastFormula.offset.x = transformations[0][0];
        lastFormula.offset.y = transformations[0][1];

        lastFormula.size.x = transformations[0][2];
        lastFormula.size.y = transformations[0][3];
    
        transformations = [];
    }
    
    switch( $('#select-menu-fractal').val() ) {
        case "mandelbrot-1": { type = mandelbrot; mandelbrot.power = new Complex(2.0, 0.0); break; }
        case "mandelbrot-2": { type = mandelbrot; mandelbrot.power = new Complex(3.0, 0.0); break; }
		case "mandelbrot-3": { type = mandelbrot; mandelbrot.power = new Complex(3.0, 0.0) + new Complex(2.0, 0.0) + new Complex(1.0, 0.0); break; }
        case "julia-1": { type = julia; julia.seed = new Complex(-0.8, 0.156); break; }
        case "julia-2": { type = julia; julia.seed = new Complex(-0.618, 0.0); break; }
        case "julia-3": { type = julia; julia.seed = new Complex(-0.4, 0.6); break; }
        case "julia-4": { type = julia; julia.seed = new Complex(0.285, -0.01); break; }
    }
    
    switch( $('#select-menu-theme').val() ) {
        case "theme-1": { theme = themeGreen; break; }
        case "theme-2": { theme = themeOrange; break; }
        case "theme-3": { theme = themeCostum; break; }
        case "theme-4": { theme = themeBlue; break; }
        case "theme-5": { theme = themeRed; break; }
		case "theme-6": { theme = themeBlackWhite; break; }
    }

    generateFractal(type, theme);
}

function changeColor() {
    switch( $('#select-menu-theme').val() ) {
        case "theme-1": { theme = themeGreen; break; }
        case "theme-2": { theme = themeOrange; break; }
        case "theme-3": { theme = themeCostum; break; }
        case "theme-4": { theme = themeBlue; break; }
        case "theme-5": { theme = themeRed; break; }
		case "theme-6": { theme = themeBlackWhite; break; }
    }

    generateFractal(type, theme);
}

function generateFractal(formula, theme) {
    var html = document.getElementById("html");
	html.style.backgroundColor = theme.background;
	
	clearTimeout(tim);
    lastFormula = formula;

    offset = new Complex(formula.offset.x, formula.offset.y);
    size = new Complex(formula.size.x, formula.size.y);

    var img = context.getImageData(0, 0, width, height);
    var pix = img.data;
    var y = 0;

    function drawPixel(x, y, i) {
        var c = theme(i);
        var off = 4 * (y * width + x);
        pix[off] = c[0];
        pix[off + 1] = c[1];
        pix[off + 2] = c[2];
        pix[off + 3] = 255;
    }
    function drawLine() {
        for (var x = 0; x < width; x++) {
            var c = formula(new Complex(x / width / size.x + offset.x, y / height / size.y + offset.y));
            drawPixel(x, y, c);
        }
        context.putImageData(img, 0, 0);
        if (++y < height)
            tim = setTimeout(drawLine, 0);
    }
        
    drawLine();
}

function canvas_onmousedown(e) {
    var rect = document.getElementById("zoom");
    var wrapper = document.getElementById("wrapper");

    x1 = x2 = e.pageX - wrapper.offsetLeft;
    y1 = y2 = e.pageY - wrapper.offsetTop;

    down = true;
    
    rect.style.left = x1.toString() + "px";
    rect.style.top = y1.toString() + "px";

    rect.style.width = "0px";
    rect.style.height = "0px";
    rect.style.visibility = "visible";
}
    
function canvas_onmousemove(e) {
    if (down == false)
        return;
        
    var rect = document.getElementById("zoom");
    var wrapper = document.getElementById("wrapper");
    
    x2 = e.pageX - wrapper.offsetLeft;
    y2 = e.pageY - wrapper.offsetTop;

    rect.style.left = Math.min(x1, x2).toString() + "px";
    rect.style.top = Math.min(y1, y1 + x2 - x1).toString() + "px";

    rect.style.width = (Math.max(x1, x2) - Math.min(x1, x2)).toString() + "px";
    rect.style.height = (Math.max(x1, x2) - Math.min(x1, x2)).toString() + "px";
}
function canvas_onmouseup() {
    if (down == false)
        return;
        
    down = false;

    var rect = document.getElementById("zoom");

    rect.style.visibility = "collapse";

    var x = Math.min(x1, x2);
    var y = Math.min(y1, y1 + x2 - x1);
    var w = Math.max(x1, x2) - Math.min(x1, x2);
    
    var d = w / width;

    transformations.push([lastFormula.offset.x, lastFormula.offset.y, lastFormula.size.x, lastFormula.size.y] );

    lastFormula.offset.x += x / width / size.x;
    lastFormula.offset.y += y / height / size.y;

    lastFormula.size.x /= d;
    lastFormula.size.y /= d;

    generateFractal(lastFormula, theme);
}

function zoom_in() {
	down = true;
	x1 = width / 4;
	x2 = width / 4 * 3;
	y1 = height / 4;
	y2 = width / 4 * 3;
	
	canvas_onmouseup();
}

function zoom_out() {
    if(transformations.length == 0)
        return;
    
    var lastInd = transformations.length - 1;
    console.log(transformations[lastInd]);
    
    lastFormula.offset.x = transformations[lastInd][0];
    lastFormula.offset.y = transformations[lastInd][1];

    lastFormula.size.x = transformations[lastInd][2];
    lastFormula.size.y = transformations[lastInd][3];
    
    transformations.pop();
    generateFractal(lastFormula, theme);
}