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
plot 'lines_of_code_by_author.dat' using 1:2 title "Matei Zaharia" w lines, 'lines_of_code_by_author.dat' using 1:3 title "Patrick Wendell" w lines, 'lines_of_code_by_author.dat' using 1:4 title "Reynold Xin" w lines, 'lines_of_code_by_author.dat' using 1:5 title "Tathagata Das" w lines, 'lines_of_code_by_author.dat' using 1:6 title "Mosharaf Chowdhury" w lines, 'lines_of_code_by_author.dat' using 1:7 title "Ankur Dave" w lines, 'lines_of_code_by_author.dat' using 1:8 title "Josh Rosen" w lines, 'lines_of_code_by_author.dat' using 1:9 title "Joseph E. Gonzalez" w lines, 'lines_of_code_by_author.dat' using 1:10 title "Prashant Sharma" w lines, 'lines_of_code_by_author.dat' using 1:11 title "Andrew Or" w lines, 'lines_of_code_by_author.dat' using 1:12 title "Michael Armbrust" w lines, 'lines_of_code_by_author.dat' using 1:13 title "Aaron Davidson" w lines, 'lines_of_code_by_author.dat' using 1:14 title "Shivaram Venkataraman" w lines, 'lines_of_code_by_author.dat' using 1:15 title "Xiangrui Meng" w lines, 'lines_of_code_by_author.dat' using 1:16 title "Cheng Lian" w lines, 'lines_of_code_by_author.dat' using 1:17 title "Stephen Haberman" w lines, 'lines_of_code_by_author.dat' using 1:18 title "Sean Owen" w lines, 'lines_of_code_by_author.dat' using 1:19 title "Imran Rashid" w lines, 'lines_of_code_by_author.dat' using 1:20 title "Davies Liu" w lines, 'lines_of_code_by_author.dat' using 1:21 title "Kay Ousterhout" w lines
