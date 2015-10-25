
labmap = {}
labmap.machines = []
labmap.users = []
labmap.users_size = 0

$(document).ready(function() {

   reloadLabMapData()
   setInterval(function() { reloadLabMapData(); }, 10000);
});

function User(user_id, user_name, user_photo, user_status, user_time) {
    return {
        id: user_id,
        name: user_name,
        photo: user_photo,
        status: user_status,
        time: user_time
    }
}

function Machine(machine_name, user, photo) {
    return {
        name: machine_name,
        user: user,
        tableRow: null,
        mapElement: $('#' + machine_name),
        mapImage: photo
    }
}

function reloadLabMapData() {

    var machines = []
    
    $.getJSON('labmap.json', function(data) {
       
        $.each(data, function(host, user) {
            
            var u = User(user.id, user.name, user.photo, user.status, user.time);
            var m = Machine(host, u, user.photo);
           
            machines.push(m);
        });
     
        labmap.machines = machines;
        updateLabMapData()   
    });
    
    var users = []
    
    $.getJSON('labdata.json', function(data) {
       
        $.each(data, function(attr, info) {
            
            if(attr == 'users')
            {
                $.each(info, function(ind, info) {
                    users.push( {time: info[0], cnt: info[1]} )
                });
            }
        });
       
       labmap.users = users;
       updateLabChartData()
    });
}