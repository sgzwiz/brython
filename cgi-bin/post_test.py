#!c:/python33/python.exe
import cgi

print('Content-type: text/html')
print()

print('script cgi with post<p>')
fs = cgi.FieldStorage()
for key in fs.keys():
    print('%s:%s' %(key,fs[key].value)+'<br>')
print('ok')