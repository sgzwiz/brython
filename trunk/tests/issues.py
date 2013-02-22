# issue 4
assert 2**3==8
# issue 9
assert {1,'a',3.14}.__class__==set
# issue 10
a = {'poide':4,'praf':2}
b = {'poide':4,'praf':2}
assert a == b
# issue 11
a = {'poide':7,'praf':10}
b = {'poide':7,'praf':10,'mank':23}
assert a != b
# issue 13
assert "a\nb".splitlines()==['a','b']
# issue 15
assert "width : %d%%" % 100 == 'width : 100%'
# issue 16
x = { "Z" : 26, "A" : 1 }
n = list(x.keys())
n.sort()
assert n[0]=='A'
assert x[n[0]]==1
assert n[1]=='Z'
assert x[n[1]]==26
# issue 18
try:
    1/0
    print('Fail')
except:
    print('OK')
# issue 21
assert True and False == False
# issue 22
def setx(o, v):
   setattr(o, "x", v)

o = object()
setattr(o, "x", 1)
assert o.x == 1 # direct setattr

o = object()
setx(o, 1)
assert o.x == 1 # indirect setattr

# issue 23
l = [ "A", "B" ]
n = [ i for i in l if i.startswith("A") ]
assert n==['A']

# issue 24
l = [ 9, 8 ]
d = {
   "A" : [ 1, 2 ]
   , "B" : [ 3, 4 ]
   }

def f():
    l = d["A"]
    return [ i for i in l if i > 1 ]

assert f()==[2]

# issue 25
def instance_repr(o):
    if isinstance(o, list):
        l = []
        for i in o:
            l.append( instance_repr(i) )
        s = "[ %s ]" % ", ".join(l)
    elif isinstance(o, str):
        # TODO other control characters
        s = str(o)
        s = s.replace("'", "\\'")
    elif isinstance(o, int):
        s = str(o)
    else:
        s = o.__class__
    return s

n = [ 1, 2, 3, 4 ]
assert instance_repr(n)=="[ 1, 2, 3, 4 ]"

n = [ "A", "B", "C", "D" ]
assert instance_repr(n)=="[ A, B, C, D ]"

# issue 26
x = True
assert x
assert isinstance(x, bool) 

y = bool(1)
assert y
assert isinstance(y, bool)

# issue 27
# just check that win.location doesn't throw "too much recursion"
x = win.location

# issue 31
d = {
1 : 1
, 2 : 2
#, 3 : 3
, 4 : 4
} 
assert d=={1:1,2:2,4:4}

# issue 33
e = [ 0, 2, 4, 6 ]
r = [ 0, 1, 2, 3, 4, 5 ]
x = [ i for i in r if i in e ]
assert x==[0,2,4]

# issue 34
e = [ 0, 2, 4, 6 ]
r = [ 0, 1, 2, 3, 4, 5 ]

def cond(i, e):
    return i in e

x = [ i for i in r if cond(i, e) ]
assert x==[0,2,4]

# issue 35
def f_35_1(n):
    ln = range(n)

    def condx(i):
        return i % 2 == 0

    return condx(n)

assert f_35_1(10)==True


def f_35_2(n):
    ln = range(n)

    def condx(i):
        return i % 2 == 0

    return [ i for i in ln if condx(i) ]

assert f_35_2(10)==[0,2,4,6,8]

# issue 36
def instance(i):
    o = object()
    o.id = i
    return o

def f_36(o):
    x = [ o.id for i in range(1) ]
    return x

o = instance(999)
assert f_36(instance(1))==[1]

# issue 37
x = True
y = False
res = x and not y
assert res==True

o = object()
o.res = res
assert o.res==True

o.res = (x and not y)
assert o.res==True

o.res = x and not y
assert o.res==True

# issue 39
somestring="abcdef"
reversedstring = somestring[::-1]
assert reversedstring=="fedcba"

# issue 44
funcs = []
for i in [1, 2]:
    def f(x=i):
        return x
    funcs.append(f)

assert funcs[0]()==1
assert funcs[1]()==2

# issue 45
import simple
assert simple.Simple().info=="SimpleClass"

# issue 46
class A:
    COUNTER = 0
    def __init__(self):
        self.COUNTER += 1

a = A()

class A:
   pass

a = A()
assert isinstance(a, A)

assert a.__class__ == A

# issue 47
stuff = ['abc', 'def', 'ghi']
stuff.remove('def')
assert stuff==['abc','ghi']

# issue 50
dest = [0,1,2,3,4,5,6,7,8,9]
assert [ i for i in range(100) if i <10 ] == dest
assert [ i for i in range(100) if i <10] == dest
assert [ i for i in range(10)]==dest

# issue 52
matrix = [
[1, 2, 3, 4],
[5, 6, 7, 8],
[9, 10, 11, 12],
]

transposed = zip(*matrix)
assert transposed[0]==[1,5,9]

# issue 54
x=[1,2]
assert x[4>2] == 2
assert x[int(True)]==2
assert x[True]==2

# issue 55
# nested list comprehension
SIMPLE = '@'+'.'*2+('\n'+'.'*3)*2
SIMPLE = SIMPLE.split('\n')
p = [['%s%d%d'%(p,x,y) for x, p in enumerate(' %s '%row)] for y, row in enumerate(SIMPLE)]
assert p==[[' 00','@10','.20','.30',' 40'],[' 01','.11','.21','.31',' 41'],[' 02','.12','.22','.32',' 42']]

# issue 56
assert "$XE$".replace("$XE$", "!")=="!"
assert "$XE".replace("$XE", "!")=='!'
assert "XE$".replace("XE$", "!")=="!"
assert "XE$".replace("$", "!")=="XE!"
assert "$XE".replace("$", "!")=="!XE"
assert "?XE".replace("?", "!")=="!XE"
assert "XE?".replace("?", "!")=="XE!"
assert "XE!".replace("!", "?")=="XE?"

# issue 59
class NOListComp:
 def show(self,x):
  return x
 def go_list(self):
  self.pair = [1,2]
  return ([self.show(u) for u in self.pair])
 def cheat_list_source(self):
  self.pair = [1,2]
  pair = self.pair
  return([self.show(u) for u in pair])
 def cheat_list_both(self):
  self.pair = [1,2]
  pair = self.pair
  show = self.show
  return([show(u) for u in pair])

assert NOListComp().go_list()==[1,2]
assert NOListComp().cheat_list_source()==[1,2]
assert NOListComp().cheat_list_both()==[1,2]

# issue 64
class NoCascade:
 def __init__(self):
  a = b = 2
  self.a = a

nc = NoCascade()
assert nc.a == 2

# issue 76
def unpack(x,y):
    return (x,y)
assert unpack(*[1,2])==(1,2)
assert unpack(**{'x':1, 'y':2})==(1,2)
class Un:
  def unpack(self, x, y):
    return (x,y)
assert Un().unpack(*(1,2))==(1,2)
assert Un().unpack(**{'x':1, 'y':2})==(1,2)

# issue 81
assert 'n' in [cardinal for cardinal in 'nesw']

# issue 83
def cards(cardin):
    assert 'n' in [cardinal for index,cardinal in enumerate(cardin)]
    assert 'n' in [cardinal for cardinal in '%s'%cardin]
    assert (0,'n') in [(index,cardinal) for index,cardinal in enumerate('%sw'%cardin)]
cards('nes')
