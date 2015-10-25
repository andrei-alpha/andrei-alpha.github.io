function mandelbrot(xy) {
    var z = new Complex(xy.x, xy.y);
    var i = 0;

    while (i < mandelbrot.maxIter && z.abs() <= mandelbrot.bailout) {
        z = z.pow(mandelbrot.power).add(xy);
        i++;
    }

    if (i < mandelbrot.maxIter) {
        i -= Math.log(Math.log(z.abs())) / Math.log(mandelbrot.power.abs());
        return i / mandelbrot.maxIter;
    }
    else
        return mandelbrot.maxIter;
}
mandelbrot.maxIter = 100;
mandelbrot.power = new Complex(2.0, 0.0);
mandelbrot.bailout = 4.0;
mandelbrot.offset = new Complex(-3.0, -2.0);
mandelbrot.size = new Complex(0.25, 0.25);

function julia(xy) {
    var z = new Complex(xy.x, xy.y);
    var i = 0;

    while (i < julia.maxIter && z.abs() <= julia.bailout) {
        z = z.pow(julia.power).add(julia.seed);
        i++;
    }

    if (i < julia.maxIter) {
        i -= Math.log(Math.log(z.abs())) / Math.log(julia.power.abs());
        return i / julia.maxIter;
    }
    else
        return julia.maxIter;
}
julia.maxIter = 100;
julia.power = new Complex(2.0, 0.0);
julia.bailout = 4.0;
julia.offset = new Complex(-2.0, -2.0);
julia.size = new Complex(0.25, 0.25);
julia.seed = new Complex(0.285, -0.01);
