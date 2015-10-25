import cmd
import sys
import labmap
import signal
import getpass
import time

user = 'aba111'
password = ''

def main():
    global password
    password = getpass.getpass()
    
    labmap.server_main(user, password)
    
if __name__ == '__main__':
    main()