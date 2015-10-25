import sys
sys.path.append('/homes/aba111/venv/ENV/lib/python2.6/site-packages/')
import paramiko
import cmd
import re
import curses.ascii
import signal
import getpass
import threading
import ICPhoto
import json
import time

#lab_machines = [ ["matrix","01","23"] ]
lab_machines = [ ["matrix","01","23"], ["corona","01","34"], #["glyph","01","35"],
    ["project","01","11"], ["visual","01","23"], ["fusion","01","38"], ["ray","01","20"],]

hosts = []
data = {}
info = {}
info['users'] = []
user = "aba111"
password = ""
comand = "finger"
console = "yes"

class TimeoutException(Exception): 
    pass 

def print_data():
    print json.dumps(data)

def main(userP, passP):
    global password
    global user
    global console
    
    if userP == '':
        password = getpass.getpass()
    else:
        password = passP
        user = userP
        console = "no"
    
    if 'yes' in console:
        print ""
        print "###############################################################"
        print ""

    for pc_cluster in lab_machines:
        for i in range( int(pc_cluster[1]), int(pc_cluster[2]) + 1 ):
            hosts.append( [pc_cluster[0] + "%02d" % i + ".doc.ic.ac.uk",user,password] )
     
    for host in hosts:
        try:
            #thread = threading.Thread(target = connect, args=(host,) )
            #thread.start()
            connect(host) 
        except:
            pass
        
    if 'yes' in console:
        print_data()
    else:
        info["users"].append( (time.strftime("%d/%m %H:%M", time.localtime()), len(data)) )
    
    return data

def cmd_main(userP, passP):
    return main(userP, passP)
    
def server_main(userP, passP):
    
    i = 0;
    while True:
        i = i + 1
        hosts = []
        data.clear()
        
        main(userP, passP)
        signal.alarm(0) #don`t want to triger the signal any more

        f = open('labmap.json', 'w')
        f.write( json.dumps(data) )
        f.close()
    
        f = open('labdata.json', 'w')
        f.write( json.dumps(info) )
        f.close()
        
        print 'computed for ' + str(i) + ' times'
        time.sleep(5)
        
def connect(host):
    def timeout_handler(signum, frame):
        raise TimeoutException()
    
    signal.signal(signal.SIGALRM, timeout_handler) 
    signal.alarm(2) # triger alarm in 2 seconds
        
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(
        paramiko.AutoAddPolicy())
    try:
        client.connect(host[0],
            username=host[1],
            password=host[2])
    except TimeoutException:
        if 'yes' in console:
            print "host: %s:" % host[0] + " Connection timeout!"
        return
    except:
        if 'yes' in console:
            print "host: %s:" % host[0] + " Connection refused!"
        return
    
    signal.alarm(0) #don`t want to triger the signal any more
    
    stdin, stdout, stderr = client.exec_command(comand)
    stdin.close()
    
    output = stdout.read().splitlines()
    if len(output) == 1:
        if 'yes' in console:
            print 'host: %s: %s' % (host[0], output[0])
    else:
        lastLine = output[ len(output) - 1 ]
        sep = re.compile('\s\s+')
        attr = sep.split(lastLine)
        if curses.ascii.isdigit(attr[3][0]):
            status = "[Idle]"
        else:
            status = "[Avaible]"
            attr[3] = ""
        
        photo = ICPhoto.cmd_main(host[1], host[2], attr[0])
        if 'error' in photo:
            photo = 'photos/nopic.jpg'
        else:
            photo = 'photos/' + attr[0] + '.jpg'
        
        data[ host[0].split(".")[0] ] = {'id': attr[0], 'name': attr[1], 'time': attr[3], 'status': status, 'photo': photo}
        if 'yes' in console:
            print 'host: %s: %s' % (host[0], lastLine)
       
    client.close()
    
if __name__ == '__main__':
    main('', '')
