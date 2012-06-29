def foo(x):
 return x.upper()
alert(max(['a','Z'],key=foo))
alert(max(['A','Z']))
t = ['a','b']
t[0]+='bsdfqs'
alert(t)
alert('ab'*3)
z = 'a'
z += 'bc'
alert('Z'+z)

x={1:'a',2:'b'}
for k,v in x.items():
 alert('%s:%s' %(k,v))

x='azerty'
v = ''
for u in reversed(x):
 v += u
alert(v)