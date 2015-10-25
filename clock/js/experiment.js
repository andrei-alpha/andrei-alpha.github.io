$(function(){
	
	var props = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' '),
		prop,
		el = document.createElement('div');
	
	for(var i = 0, l = props.length; i < l; i++) {
		if(typeof el.style[props[i]] !== "undefined") {
			prop = props[i];
			break;
		}
	}
	
	if(window.location.hash != '#clock')
		window.location = '#clock';
	startClock();
	
	function startClock() {
		
		var angle = 360/60,
			date = new Date(),
			hour = (function() {
				var h = date.getHours();
				if(h > 12) {
					h = h - 12;
				}
				return h
			})(),
			minute = date.getMinutes(),
			second = date.getSeconds(),
			hourAngle = (360/12) * hour + (360/(12*60)) * minute;
		
		if(prop) {
			$('#minute')[0].style[prop] = 'rotate('+angle * minute+'deg)';
			$('#second')[0].style[prop] = 'rotate('+angle * second+'deg)';
			$('#hour')[0].style[prop] = 'rotate('+hourAngle+'deg)';
		}
	}
 
	setInterval('write()', 70);
});

var indX = 0;
var indY = 0;
var offset = 0;

function write() {
	if(offset > 0) {
		--offset;
		return;
	}
	
	if(indX == 0 && indY == 0)
		$('#python').html('');
	
	if(indX == python.length) {
		indX = 0;
		indY = 0;
		$('#python').append('<br></br>')
		$('#python').append('<img src="./images/python.png"></img>');
		offset = 10;
		return;
	}
	if(indY == python[indX].length) {
		++indX;
		indY = 0;
		$('#python').append('<br />');
		offset = 4;
		return;
	}
	
	$('#python').append(python[indX][indY]);
	++indY;
}

var img = ['..images/python.png'];
var python = ['"Beautifull is better than ugly.',
'Explicit is better than implicit.',
'Simple is better than complex.',
'Complex is better than complicated.',
'Flat is better than nested.',
'Sparse is better than dense.',
'Readability counts.',
'Special cases aren`t special enough to break the rules.',
'Although practicality beats purity.',
'Errors should never pass silently.',
'Unless explicitly silenced.',
'In the face of ambiguity, refuse the temptation to guess.',
'There should be one-- and preferably only one --obvious way to do it.',
'Although that way may not be obvious at first unless you`re Dutch.',
'Now is better than never.',
'Although never is often better than *right* now.',
'If the implementation is hard to explain, it`s a bad idea.',
'If the implementation is easy to explain, it may be a good idea.',
'Namespaces are one honking great idea -- let`s do more of those!"'
]
