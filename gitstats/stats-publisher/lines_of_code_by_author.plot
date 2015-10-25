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
plot 'lines_of_code_by_author.dat' using 1:2 title "James Stewart" w lines, 'lines_of_code_by_author.dat' using 1:3 title "Paul Hayes" w lines, 'lines_of_code_by_author.dat' using 1:4 title "Alex Tomlins" w lines, 'lines_of_code_by_author.dat' using 1:5 title "Jordan Hatch" w lines, 'lines_of_code_by_author.dat' using 1:6 title "Joshua Marshall" w lines, 'lines_of_code_by_author.dat' using 1:7 title "Jamie Cobbett" w lines, 'lines_of_code_by_author.dat' using 1:8 title "Gareth Rushgrove" w lines, 'lines_of_code_by_author.dat' using 1:9 title "Dafydd Vaughan" w lines, 'lines_of_code_by_author.dat' using 1:10 title "Steve Laing" w lines, 'lines_of_code_by_author.dat' using 1:11 title "Vinay Patel" w lines, 'lines_of_code_by_author.dat' using 1:12 title "Paul Battley" w lines, 'lines_of_code_by_author.dat' using 1:13 title "David Thompson" w lines, 'lines_of_code_by_author.dat' using 1:14 title "Craig R Webster" w lines, 'lines_of_code_by_author.dat' using 1:15 title "Kushal Pisavadia" w lines, 'lines_of_code_by_author.dat' using 1:16 title "Ben Griffiths" w lines, 'lines_of_code_by_author.dat' using 1:17 title "James Weiner" w lines, 'lines_of_code_by_author.dat' using 1:18 title "David Heath" w lines, 'lines_of_code_by_author.dat' using 1:19 title "Stuart Gale" w lines, 'lines_of_code_by_author.dat' using 1:20 title "Mazz" w lines, 'lines_of_code_by_author.dat' using 1:21 title "Mazz Mosley" w lines
