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

function mandelbrot2(xy) {
    var z = new Complex(xy.x, xy.y);
    var i = 0;

    while (i < mandelbrot2.maxIter && z.abs() <= mandelbrot2.bailout) {
        var z3 = z.pow( new Complex(3.0, 0.0) );
        var z2 = z.pow( new Complex(2.0, 0.0) );
        var z1 = z;
        z = z3.add(z2).add(z).add(xy);
        i++;
    }

    if (i < mandelbrot2.maxIter) {
        i -= Math.log(Math.log(z.abs())) / Math.log(mandelbrot.power.abs());
        return i / mandelbrot2.maxIter;
    }
    else
        return mandelbrot2.maxIter;
}
mandelbrot2.maxIter = 100;
mandelbrot2.bailout = 4.0;
mandelbrot2.power = 3.0;
mandelbrot2.offset = new Complex(-3.0, -2.0);
mandelbrot2.size = new Complex(0.25, 0.25);

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

function newton(xy) {
    var z = new Complex(xy.x, xy.y);
    var i = 0;

    while (i < newton.maxIter) {
        z = z.mul( new Complex(2.0, 0.0) ).add( z.sqrt().inv() ).div( new Complex(3.0, 0.0) );
        var delta = z.mul( z.sqrt() ).sub( new Complex(1.0, 0.0) );
        
        if(delta.mod() < 0.0001) {
            //var s = Math.ceil(100.0 + Math.log(2.0 + Math.log(2.0 + i) ) );
            
            if(z.x * z.x < 0.01)
                i = i - 5; // + s % 35;
            else if(z.y > 0.5)
                i = i + 5; // + s % 35;
            else
                i = i + 10; // + s % 35;
            
            break;
        }
        i++;
    }

    return i / newton.maxIter;
}
newton.maxIter = 100;
newton.power = new Complex(2.0, 0.0);
newton.bailout = 4.0;
newton.offset = new Complex(-2.5, -2.0);
newton.size = new Complex(0.25, 0.25);
