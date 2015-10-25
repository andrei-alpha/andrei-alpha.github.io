import HTMLParser

class htmlParser(HTMLParser.HTMLParser):
    def __init__(self):
        HTMLParser.HTMLParser.__init__(self)
        self.recording = 0
        self.data = []
        
    def handle_starttag(self, tag, attrs):
        if self.recording and tag == 'img':
            for name, value in attrs:
                if name == 'src':
                    self.data.append(value)
        
        if tag != 'div':
            return
        
        for name, value in attrs:
            if value == 'studentphotoheader':
                self.recording = 1
    
    def handle_endtag(self, tag):
        if tag != 'div':
            return
        
        self.recording = 0
        return
    
    def handle_data(self, data):
        #print "Encountered   some data:" + data
        return