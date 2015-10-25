var chart;

function updateChart(x, y) {
        
    console.log("add " + x + " " + y)
    chart.series[0].addPoint( [x, y] )
}

function drawChart(timeData, userData) {
    
    Highcharts.setOptions({
	global: {
            useUTC: false
	}
    });
    
    chart = new Highcharts.Chart({
      chart: {
        renderTo: 'chart',
        defaultSeriesType: 'line',
        marginRight: 130,
        marginBottom: 25,
	events: {
        }
      },
      title: {
         text: 'Lab stats',
         x: -20 //center
      },
      subtitle: {
         text: 'Source: Imperial',
         x: -20
      },
      xAxis: {
        categories: timeData
      },
      yAxis: {
         title: {
            text: 'No of users'
         },
         plotLines: [{
            value: 0,
            width: 1,
            color: '#808080'
         }]
      },
      tooltip: {
         formatter: function() {
                   return '<b>'+ this.series.name +'</b><br/>'+
               this.y + ' users at ' + this.x;
         }
      },
      legend: {
         layout: 'vertical',
         align: 'right',
         verticalAlign: 'top',
         x: -10,
         y: 100,
         borderWidth: 0
      },
      series: [{
         name: 'users in lab',
         data: userData
      }]
   });
}