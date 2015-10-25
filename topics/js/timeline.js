$(function () { 
    var tg1 = $("#placement").timeline({
        "min_zoom":5, 
        "max_zoom":100, 
        "show_centerline":true,
        "data_source":"js/timeline.json",
        "show_footer":true,
        "display_zoom_level":true,
        "event_overflow":"scroll"
    });
    
    $("#scrolldown").bind("click", function() {
        $(".timeglider-timeline-event").animate({top:"+=100"})
    })
    
    $("#scrollup").bind("click", function() {
        $(".timeglider-timeline-event").animate({top:"-=100"})
    })
    
}); 

/*
 <tr>
                      <td>1968-08-20</td>
                      <td></td>
                      <td>Born</td>
                                <td>Valley hospital in Ridgewood, NJ, to Martha &amp; Steve Richardson.</td>
                                <td>circle_green.png</td>
                                <td>&nbsp;</td>
                                <td>50</td>
                                <td>http://www.ridgewoodnj.net/main.cfm</td>
                                <td></td>
                    </tr>
                
                        <tr>
                      <td>1982-09-01</td>
                      <td>1986-06-20</td>
                      <td>HHS</td>
                                <td>Hanover (NH) High School.</td>
                                <td>star_blue.png</td>
                                <td>da</td>
                                <td>32</td>
                                <td>http://hanoverhigh.us/Hanover/</td>
                                <td></td>
                    </tr>
                
                        <tr>
                      <td>1987-03-01</td>
                      <td>1987-07-20</td>
                      <td>Asia</td>
                                <td>Thailand, India, and Nepal</td>
                                <td>circle_orange.png</td>
                                <td>mo</td>
                                <td>32</td>
                                <td></td>
                                <td></td>
                    </tr>
                
                        <tr>
                      <td>1986-09-01</td>
                      <td>1992-06-01</td>
                      <td>Wesleyan</td>
                                <td>Six years of too little sex, too many drugs, and questionable rock and roll.</td>
                                <td>star_blue.png</td>
                                <td>da</td>
                                <td>32</td>
                                <td>http://wesleyan.edu</td>
                                <td>full</td>
                    </tr>
                
                        <tr>
                      <td>1995-09-05</td>
                      <td>today</td>
                      <td>Marriage</td>
                                <td></td>
                                <td>star_green.png</td>
                                <td>ye</td>
                                <td>45</td>
                                <td></td>
                                <td></td>
                    </tr>
*/