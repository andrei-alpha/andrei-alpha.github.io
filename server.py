import os
import time

cnt = 0

while True:
	cnt = cnt + 1
	
	f = open('clock.html', 'w')
	f.write('<META HTTP-EQUIV="REFRESH" CONTENT="5">')
	f.write('<html>Python server running...</br></>')
	f.write('Computed ' + str(cnt) +  ' digits of Pi<br></br>')
	f.write('<h2><B STYLE="FONT-FAMILY: SANS-SERIF;LETTER-SPACING: -2px;COLOR: #3377AA;FONT-SIZE: 180%">' + time.ctime() + '</h2></html>')
	f.close()

	time.sleep(1)


  
