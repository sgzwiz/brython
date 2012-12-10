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
# list examples
a=['spam','eggs',100,1234]
assert a[:2]+['bacon',2*2]==['spam','eggs','bacon',4]
assert 3*a[:3]+['Boo!']==['spam','eggs',100,'spam','eggs',
100,'spam','eggs',100,'Boo!']
assert a[:]==['spam','eggs',100,1234]
a[2]=a[2]+23
assert a==['spam','eggs',123,1234]
a[0:2]=[1,12]
assert a==[1,12,123,1234]
a[0:2]=[]
assert a==[123,1234]
a[1:1]=['bletch','xyzzy']
assert a==[123,'bletch','xyzzy',1234]
a[:0]=a
assert a==[123,'bletch','xyzzy',
    1234,123,'bletch','xyzzy',1234]
a[:]=[]
assert a==[]
a.extend('ab')
assert a==['a','b']
a.extend([1,2,33])
assert a==['a','b',1,2,33]
a = ['a', 'b', 'c', 'd']
assert len(a)==4
q = [2, 3]
p = [1, q, 4]
assert len(p)==3
assert p[1]==[2, 3]
assert p[1][0]==2
p[1].append('xtra')
assert p==[1,[2,3,'xtra'],4]
assert q==[2,3,'xtra']

log('list tests ok')

# Fibonacci
a, b = 0, 1
res = []
while b<10:
    res.append(b)
    a, b = b, a+b
assert res==[1,1,2,3,5,8]
log('Fibonacci ok')
