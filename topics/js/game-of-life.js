var context, width, height, mouseState = 'up';
var lastX, lastY, cellSize = 5;
var N, M;
var delay = 0, running = 0, generation = 0;
var thread;
var board = new Array(1024);
var colors = {'live': 'green',
    'dead': '#FFFFFF',
    'border': '#F3F3F3',
}
var sliderValues = [0,2,5,10,20,35,50,100,250,500,1000];

var xx = new Array(-1,-1,-1,0,0,1,1,1);
var yy = new Array(-1,0,1,-1,1,-1,0,1);

$(function() {
    var canvas = document.getElementById('frame');

    // Check the element is in the DOM and the browser supports canvas
    if(!canvas.getContext) {
        alert('error loading canvas!');
        return;
    }
    
    // Initaliase a 2-dimensional drawing context
    context = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;
    N = Math.floor(width / cellSize);
    M = Math.floor(height / cellSize);
    
    // Initaliase the board
    for(var i = 0;i <= N; ++i)
        board[i] = new Array(1024);    
    
    for(var i = 0;i <= N; ++i)
    for(var j = 0;j <= M; ++j) {
        board[i][j] = false;
    }

    context.beginPath();
    context.rect(0, 0, width, height);
    context.fillStyle = "#F0F0F0";
    context.fill();
    
    //add the slider
    initSlider();
    
    //register events
    events.registerEvent(canvas, 'mousedown', events.canvasMouseDown, false);
    events.registerEvent(canvas, 'mouseup', events.canvasMouseUp, false);
    events.registerEvent(canvas, 'mousemove', events.canvasMouseMove, false);
    
    changeCellState(10, 10);
    changeCellState(11, 10);
    changeCellState(12, 10);
    
    drawGrid();
});

function initSlider() {
    $( ".slider" ).slider({
        animate: false,
        range: "min",
        value: 2,
        min: 0,
        max: 10,

        //this gets a live reading of the value and prints it on the page
        slide: function( event, ui ) {
            delay = sliderValues[ ui.value ];
            //console.log( ui.value );
            
            if(running == true)
                restartSimulation();
            $( "#slider-result" ).html(delay);
        },

        //this updates the hidden form field so we can submit the data using a form
        change: function(event, ui) {
        $('#hidden').attr('value', sliderValues[ ui.value ] );
        }

    });
}

function mousePosition(e) {
    // http://www.malleus.de/FAQ/getImgMousePos.html
    // http://www.quirksmode.org/js/events_properties.html#position
    var event, x, y, domObject, posx = 0, posy = 0, top = 0, left = 0;
    //a specific setup for this page, style.css 1005 max width 
    var marginLeft = (document.documentElement.clientWidth - 1005) / 2;
    
    event = e;
    if (!event) {
      event = window.event;
    }
  
    if (event.pageX || event.pageY) 	{
      posx = event.pageX;
      posy = event.pageY;
    } else if (event.clientX || event.clientY) 	{
      posx = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    
    domObject = event.target || event.srcElement;

    while ( domObject.offsetParent ) {
      console.log(domObject);
      console.log(left + " : " + top);
      
      left += domObject.offsetLeft;
      top += domObject.offsetTop;
      domObject = domObject.offsetParent;
    }
    
    domObject.pageTop = top;
    domObject.pageLeft = left;

    console.log(domObject);
    console.log(left + " : " + top);

    x = Math.ceil(((posx - domObject.pageLeft) / cellSize) - 1);
    y = Math.ceil(((posy - domObject.pageTop) / cellSize) - 1);
    var marginLeftOffset = Math.ceil(marginLeft / cellSize);
    
    console.log(marginLeftOffset);
    
    return [x - marginLeftOffset, y];
}
  
function changeCellState(x, y) {
    //console.log('change at: ', x, y);
    
    if(board[x][y] == true)
        board[x][y] = false;
    else
        board[x][y] = true;
}

function isAlive(x, y) {
    if(board[x][y] == true)
        return true;
    return false;
}

function ok(x, y) {
    if(x < 0 || x > N || y < 0 || y > M)
        return false;
    return true;
}

function clickCell(x, y) {
    
    if(x == lastX && y == lastY)
        return;
    lastX = x;
    lastY = y;
    
    changeCellState(x, y);
    drawCell(x, y);
}

function drawCell(x, y) {
    if( isAlive(x, y) == true)
        color = colors['live'];
    else
        color = colors['dead'];
    
    context.fillStyle = color;
    context.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 1, cellSize - 1);
}

function drawGrid() {
    for(var i = 0;i <= N; ++i) {
        context.beginPath();
        context.moveTo(i * cellSize, 0);
        context.lineTo(i * cellSize, height);
        context.strokeStyle = colors['border'];
        context.lineWidth = 1;
        context.stroke();
    }
    
    for(var j = 0;j <= M; ++j) {
        context.beginPath();
        context.moveTo(0, j * cellSize);
        context.lineTo(width, j * cellSize);
        context.strokeStyle = colors['border'];
        context.lineWidth = 1;
        context.stroke();
    }
    
    for(var x = 0;x <= N; ++x)
    for(var y = 0;y <= M; ++y) {
        drawCell(x, y);
    }
}

function nextStep() {
    var change = [];
    var algorithmTime, guiTime, liveCellNumber = 0;
    
    algorithmTime = (new Date());
    
    for(var i = 0;i <= N; ++i)
    for(var j = 0;j <= M; ++j) {
        
        var cnt = 0;
        for(var k = 0;k < 8;++k)
            if( (i + xx[k] >= 0 && i + xx[k] <= N && j + yy[k] >= 0 && j + yy[k] <= M) && board[i + xx[k] ][j + yy[k] ] == true)
                cnt = cnt + 1;
        
        if(board[i][j] == true)
            ++liveCellNumber;
        
        if(board[i][j] == false && cnt == 3)
            change.push( [i, j] );
        else if(board[i][j] == true && cnt != 2 && cnt != 3)
            change.push( [i, j] );
    }
    
    algorithmTime = (new Date()) - algorithmTime;
    guiTime = (new Date());
    
    //Update the grid
    $.each(change, function(id) {
        changeCellState(change[id][0], change[id][1]);
        drawCell(change[id][0], change[id][1]);
    });
    
    guiTime = (new Date()) - guiTime;
    ++generation;
    
    //Update statistics
    $('#step').html( Math.max(delay, algorithmTime + guiTime) );
    $('#algorithm').html(algorithmTime);
    $('#generation').html(generation);
    $('#livecells').html(liveCellNumber);
    $('#gui').html(guiTime);
}

function runSimulation() {
    if(running == 0) {
        //console.log('start'); 
        thread = setInterval('nextStep()', delay);
        $('#start').html('Stop');
        running = 1;
    }
    else {
        running = 0;
        $('#start').html('Start');
        clearInterval(thread);
    }
}

function restartSimulation() {
    running = 0;
    clearInterval(thread);
    runSimulation();
}

var events = {
    registerEvent : function (element, event, handler, capture) {
        if (/msie/i.test(navigator.userAgent)) {
          element.attachEvent('on' + event, handler);
        } else {
          element.addEventListener(event, handler, capture);
        }
    },
    canvasMouseDown: function(event) {
        mouseState = 'down';
        
        var cord = mousePosition(event);
        clickCell(cord[0], cord[1]);
    },
    canvasMouseUp: function(event) {
        mouseState = 'up';
    },
    canvasMouseMove: function(event) {
        if(mouseState == 'down') {
            var cord = mousePosition(event);
            clickCell(cord[0], cord[1]);
        }
    }
}

function insertToad() {
    changeCellState(100, 50);
    changeCellState(100, 51);
    changeCellState(99, 49);
    changeCellState(97, 50);
    changeCellState(97, 51);
    changeCellState(98, 52);
    drawGrid();
}

function insertGlider() {
    changeCellState(50, 8);
    changeCellState(50, 9);
    changeCellState(50, 10);
    changeCellState(49, 10);
    changeCellState(48, 9);
    drawGrid();
}

function insertSpaceship() {
    changeCellState(151, 9);
    changeCellState(150, 10);
    changeCellState(150, 11);
    changeCellState(150, 12);
    changeCellState(151, 12);
    changeCellState(152, 12);
    changeCellState(153, 12);
    changeCellState(154, 11);
    changeCellState(154, 9);
    drawGrid();
}

function clearGrid() {
    for(var i = 0;i <= N; ++i)
    for(var j = 0;j <= M; ++j)
        board[i][j] = false;
    
    drawGrid();
}

function random(min, max) {
    return min <= max ? min + Math.round(Math.random() * (max - min)) : null;
}

function randomGrid() {
    clearGrid();
    
    liveCells = (N * M) * 0.12;
    for(var i = 0;i < liveCells; ++i)
        board[ random(0,N) ][ random(0,M) ] = true;
    drawGrid();
}