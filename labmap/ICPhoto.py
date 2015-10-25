import urllib, urllib2, cookielib
from urllib import urlretrieve
import htmlParser
import getpass
import sys
import os

username = 'aba111'
password = ''

def getPhoto(username, password, id):
    if os.path.exists('photos/' + id + '.jpg'):
        return
    
    passman = urllib2.HTTPPasswordMgrWithDefaultRealm()
    passman.add_password(None, "https://www.doc.ic.ac.uk/internal", username, password)
    authhandler = urllib2.HTTPBasicAuthHandler(passman)
    opener = urllib2.build_opener(authhandler)
    
    f = opener.open("https://www.doc.ic.ac.uk/internal/photosearch/" + id)
    data = f.read()
    myparser = htmlParser.htmlParser()
    myparser.feed(data)
    f.close()
    
    f = opener.open(myparser.data[0])
    data = f.read()
    
    if not os.path.exists('photos/'):
        os.makedirs('photos/')
        
    photo = open('photos/' + id + '.jpg', 'w')
    photo.write(data)
    photo.close
    os.chmod('photos/' + id + '.jpg', 388)

def cmd_main(username, password, id):
    try:
        getPhoto(username, password, id)
    except:
        return 'error'
    return 'succes'

def main():
    global username
    global password
    
    print ''
    print '###############################################################'
    print 'IC Photo, a imperial database photo download'
    print 'made by Andrei Antonescu, Python inside'
    print '###############################################################'
    print ''
    print ''
    
    while True:
        print "Using " + username + " for acces (yes/no) ?"
        res = sys.stdin.readline()
        if 'no' in res:
            sys.stdout.write("Enter the username: ")
            username = sys.stdin.readline().rstrip()
        else:
            break;
        
    password = getpass.getpass()
    
    while True:
        sys.stdout.write("Enter the id for which you want the pic: ")
        id = sys.stdin.readline().rstrip()
        if 'exit' in id:
            return
        try:
            getPhoto(username, password, id)
        except:
            print 'Error: Picture not found for user ' + id + '!'

if __name__ == '__main__':
    main()