
function themeCostum(i) {
    var k = 1.0 / 3.0;
    var k2 = 2.0 / 3.0;
    var cr = 0.0;
    var cg = 0.0;
    var cb = 0.0;
    if (i >= k2) {
        cr = i - k2;
        cg = (k - 1) - cr;
    }
    else if (i >= k) {
        cg = i - k;
        cb = (k - 1) - cg;
    }
    else {
        cb = i;
    }
    var r = parseInt(cr * 3 * 255);
    var g = parseInt(cg * 3 * 255);
    var b = parseInt(cb * 3 * 255);
    return [r, g, b];
}
themeCostum.background = "black";

function themeOrange(i) {
    var val = parseInt( i * 255);
    return [val, val / 2, 0]
}
themeOrange.background = "black";

function themeGreen(i) {
    var val = parseInt(i * 255);
    if(val > 100)
        return [0, 100 - val / 2, 0]
    return [0, 30 + val * 3 - val / 2, 0];
}
themeGreen.background = "rgb(0, 30, 0)";

function themeBlue(i) {
    var val = parseInt(i * 255);
    if(val > 100)
        return [0, 0, 100 - val  / 2];
    if(val > 40)
        return [240, 100 + val * 3 - val / 2, 200];
    return [0, 0, 100 + val * 5];
}

themeBlue.background = "rgb(0, 0, 100)";

function themeRed(i) {
    var val = parseInt(i * 255);
    if(val > 100)
        return [100 - val / 2, 0, 0]    
    return [100 + val * 3 - val / 2, 0, 0];
}
themeRed.background = "rgb(103, 0, 0)";

function themeBlackWhite(i) {
    var val = parseInt(i * 255);
    return [val, val, val]
}
themeBlackWhite.background = "black";