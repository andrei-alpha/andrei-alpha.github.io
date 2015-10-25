set terminal png transparent size 640,240
set size 1.0,1.0

set terminal png transparent size 640,480
set output 'lines_of_code_by_author.png'
set key left top
set yrange [0:]
set xdata time
set timefmt "%s"
set format x "%Y-%m-%d"
set grid y
set ylabel "Lines"
set xtics rotate
set bmargin 6
plot 'lines_of_code_by_author.dat' using 1:2 title "nobu" w lines, 'lines_of_code_by_author.dat' using 1:3 title "akr" w lines, 'lines_of_code_by_author.dat' using 1:4 title "matz" w lines, 'lines_of_code_by_author.dat' using 1:5 title "svn" w lines, 'lines_of_code_by_author.dat' using 1:6 title "naruse" w lines, 'lines_of_code_by_author.dat' using 1:7 title "usa" w lines, 'lines_of_code_by_author.dat' using 1:8 title "ko1" w lines, 'lines_of_code_by_author.dat' using 1:9 title "eban" w lines, 'lines_of_code_by_author.dat' using 1:10 title "drbrain" w lines, 'lines_of_code_by_author.dat' using 1:11 title "knu" w lines, 'lines_of_code_by_author.dat' using 1:12 title "kosaki" w lines, 'lines_of_code_by_author.dat' using 1:13 title "mame" w lines, 'lines_of_code_by_author.dat' using 1:14 title "kazu" w lines, 'lines_of_code_by_author.dat' using 1:15 title "zzak" w lines, 'lines_of_code_by_author.dat' using 1:16 title "tadf" w lines, 'lines_of_code_by_author.dat' using 1:17 title "aamine" w lines, 'lines_of_code_by_author.dat' using 1:18 title "nagai" w lines, 'lines_of_code_by_author.dat' using 1:19 title "shugo" w lines, 'lines_of_code_by_author.dat' using 1:20 title "marcandre" w lines, 'lines_of_code_by_author.dat' using 1:21 title "tenderlove" w lines
