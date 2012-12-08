# numbers
log(2+2)
log((50-5*6)/4)
log(8/5)
log(7//3)
log(7//-3)
width=20
height=5*9
log(width*height)
x=y=z=0
log(x)
log(y)
log(z)
try:
  log(n)
except:
  log('n is not defined')
log(3 * 3.75 / 1.5)
log(7.0 / 2)

# strings
log('spam eggs')
log('doesn\'t')
log("doesn't")
log('"Yes," he said.')
log("\"Yes,\" he said.")
log('"Isn\'t," she said.')
hello = "This is a rather long string containing\n\
several lines of text just as you would do in C.\n\
    Note that whitespace at the beginning of the line is\
 significant."
log(hello)
log("""\
Usage: thingy [OPTIONS]
     -h                        Display this usage message
     -H hostname               Hostname to connect to
""")
hello = r"This is a rather long string containing\n\
several lines of text much as you would do in C."
log(hello)

word = 'Help' + 'A'
log(word)
log('<' + word*5 + '>')

log('str' 'ing')
log('str'.strip() + 'ing')

# list examples
a=['spam','eggs',100,1234]
log(a[:2]+['bacon',2*2])
log(3*a[:3]+['Boo!'])
log(a[:])
a[2]=a[2]+23
log(a)
a[0:2]=[1,12]
log(a)
a[0:2]=[]
log(a)
a[1:1]=['bletch','xyzzy']
log(a)
a[:0]=a
log(a)
a[:]=[]
log(a)
a.extend('ab')
log(a)
a.extend([1,2,33])
log(a)
