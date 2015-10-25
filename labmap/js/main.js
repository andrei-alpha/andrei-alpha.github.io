function updateLabMapData() {
    var newT = $(document.createElement('table'));
    var newTHead = $(document.createElement('thead'));
    newTHead.append('<tr><th>Hostname</th><th>User name</th><th>Full name</th></tr>')
    var newTBody = $(document.createElement('tbody'));
    
    //console.debug(labmap.machines)
    
    $.each(labmap.machines, function(index, m) {
        m.tableRow = $(document.createElement('tr'));
        m.tableRow.append('<td>' + m.name + '</td><td>' + m.user.id + '</td><td>' + m.user.name + '</td>');
 
        newTBody.append(m.tableRow);
        
        //console.debug(newTBody);
    });
    
    newT.append(newTHead).append(newTBody);
    $('#user_table').replaceWith(newT);
    newT.attr('id','user_table').addClass('tablesorter'); //Redo the id
    
    
    $(newT).tablesorter({ debug: true, widthFixed: true});
    addClickForMachines()    
}

function addClickForMachines() {
    var x = 'false'
    
    $.each(labmap.machines, function(index, m) {
        if(m.status == '[Avaible]')   {   
            m.mapElement.addClass('clickable');
	    m.mapElement.click(function(){
	    	showUserDataForMachine(m);
	    });  
        }
	
	m.tableRow.addClass('clickable');
	m.tableRow.click(function(){
	    showUserDataForMachine(m);
	});
    });
}

function updateLabChartData() {
    var timeData = []
    var userData = []
    
    $.each(labmap.users, function(index, m) {
	timeData.push(m.time.substring(6, m.time.lenght) )
	userData.push(m.cnt)
    });
    
    if(labmap.users_size == 0) {
	drawChart(timeData, userData)
	labmap.users_size = userData.length
    }
    else {
	for(var i = labmap.users_size;i < userData.length; ++i)
	    updateChart( timeData[i], userData[i] )
	labmap.users_size = userData.length
    }
}

function showUserDataForMachine(m) {
    
    $("#user_info_image").attr('src', m.mapImage);
    $("#user_info_name").html('<a href="https://teachdb.doc.ic.ac.uk/db/viewtab?table=vPeople&arg0=' + m.user.id + '">' + m.user.name + '</a>');
    $("#user_info_username").html('<a href="mailto:' + m.user.id + '@ic.ac.uk">' + m.user.id + '</a>');
    $("#user_info_machine").html('<a href="ssh://' + m.name + '.doc.ic.ac.uk">' + m.name + '</a>');
}

var mode = 'Labchart'
function changeMode() {
    
    if(mode == 'Labmap') {
	mode = 'Labchart';
	$("#header-title").html(mode)
	$("#labmap").css('visibility', 'hidden');
	$("#chart").css('visibility', 'visible');
	$("#chart").find('.highcharts-container').show();
    }
    else {
	mode = 'Labmap';
	$("#header-title").html(mode)
	$("#chart").css('visibility', 'hidden');
	$("#chart").find('.highcharts-container').hide();
	$("#labmap").css('visibility', 'visible');
    }
    
}