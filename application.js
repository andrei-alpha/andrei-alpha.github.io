var myDays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
var myMonths = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var temp = "http://andreibantonescu.herokuapp.com/logs/new/"

function send(data) {

    $.ajax({
        url: temp + data,
        type: "get",
        cache: "false"
    });
}

function getInfo() {

    var res = $('#data').html()
    res = res.replace(/&nbsp;/g," ")
    res = res.replace(/<tr>/g,"")
    res = res.replace(/<\/tr>/g,"")
    data2 = res.split(/<[//]*td>/)

    var cnt = 0,newData = []
    for(var i = 1;i < data2.length;++i)
        if(data2[i] != "" && data2[i][0] != '<') {
            var rem = data2[i].split(/:/)
            rem.shift()
            newData[cnt++] = rem.join(':')
        }

    var start = newData.length - 8;
    var myDate = new Date();
    var day = myDays[ myDate.getDay() ]
    var month = myMonths[ myDate.getMonth() ]

    var data = []
	  var minutes  = myDate.getMinutes()
	  if(minutes < 10)
		  minutes = '0' + minutes;

    data[0] = "Time: <b>" +  day + " " + month + " " + myDate.getUTCDate() + " " + myDate.getFullYear() +
        " " + myDate.getHours() + ":" + minutes + " GMT " + myDate.getTimezoneOffset() + "</b>"
    data[1] = "IP: " + newData[start + 2]
    data[2] = "Host IP: " + newData[start + 3]
    data[3] = "From: " + newData[start + 0]
    data[4] = "OS: " + newData[start + 4]
    data[5] = "Sys Language: " + newData[start + 5]
    data[6] = "Browser: " + newData[start + 6]
    data[7] = "Pages seen: " + newData[start + 7]

    for(var i = 0;i < 8;++i) {
        data[i] = data[i].replace(/\//g,"$")
    }
    //console.log(data)
    send(data)
}


