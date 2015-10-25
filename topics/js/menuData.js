var menuData = [];
menuData[0] = '<li> <a href="index.html" title="Introduction to CA">Introduction to CA</a></li>'
menuData[1] = '<li> <a href="timeline.html" title="">Timeline</a></li>'
menuData[2] = '<li> <a href="types_of_ca.html" title="">Types of CA</a></li>'
menuData[3] = '<li> <a href="game_of_life_overview.html" title="">Game of Life Overview</a></li>'
menuData[4] = '<li> <a href="game_of_life.html" title="Game of Life Applet">Game of Life Applet</a></li>'
menuData[5] = '<li> <a href="inhabitants_of_life.html" title="">Inhabitants of Life</a>   </li>'
menuData[6] = '<li> <a href="logic_gates.html" title="">Logic Gates</a></li>'
menuData[7] = '<li> <a href="turing_machines.html" title="">Turing Machines</a></li>'
menuData[8] = '<li> <a href="universal_computer.html" title="">Universal Computer</a></li>'
menuData[9] = '<li> <a href="unit_life_cells.html">Unit Life Cells</a></li>'
menuData[10] = '<li> <a href="replicator.html">Replicator</a></li>'
menuData[11] = '<li> <a href="reversible.html">Reversibility</a></li>'
menuData[12] = '<li> <a href="quiz.html">Quiz</a></li>'
menuData[13] = '<li> <a href="http://www.doc.ic.ac.uk/~aba111/topics/presentation/slides.pdf">Download Slides (PDF)</a></li>'
menuData[14] = '<li> <a href="references.html">References</a></li>'

$(document).ready(function() {
    var today = new Date();
    var deadline = new Date("March 21, 2012");
    var diff = deadline - today;
    var daysDiff = Math.round(diff / (1000*60*60*24));
    
    for(var i = 0;i <= 14; ++i)
        if(i != 13 || daysDiff < 1)
            $('#MainMenu').append(menuData[i]);
});




