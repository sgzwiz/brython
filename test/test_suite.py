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

'azertu'.endswith(('a','tu'))
'azertu'.startswith(('a','sazer'))
'15'.isdigit()
',,'.join(['a','bc'])

x = {1:2,3:4}
log(x)
log(x[1])
del x[1]
log(x)

x = [1,2,5,8,99,'a']
del x[1::2]
log(x)
