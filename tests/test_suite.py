# numbers
assert 2+2==4
print((50-5*6)/4)
print(8/5)
print(7//3)
print(7//-3)
width=20
height=5*9
print(width*height)
x=y=z=0
print(x)
print(y)
print(z)
try:
  print(n)
except:
  print('n is not defined')
print(3 * 3.75 / 1.5)
print(7.0 / 2)

# strings
print('spam eggs')
print('doesn\'t')
print("doesn't")
print('"Yes," he said.')
print("\"Yes,\" he said.")
print('"Isn\'t," she said.')
hello = "This is a rather long string containing\n\
several lines of text just as you would do in C.\n\
    Note that whitespace at the beginning of the line is\
 significant."
print(hello)
print("""\
Usage: thingy [OPTIONS]
     -h                        Display this usage message
     -H hostname               Hostname to connect to
""")
hello = r"This is a rather long string containing\n\
several lines of text much as you would do in C."
print(hello)

word = 'Help' + 'A'
print(word)
print('<' + word*5 + '>')

print('str' 'ing')
print('str'.strip() + 'ing')

# string methods
x='fooss'
print(x.replace('o','X',20))
print('GhFF'.lower())
print(x.lstrip('of'))
x='aZjhkhZyuy'
print(x.find('Z'))
print(x.rfind('Z'))
print(x.rindex('Z'))
try:
    print(x.rindex('K'))
except ValueError:
    print('erreur')
print(x.split('h'))
print(x.split('h',1))
print(x.startswith('aZ'))
print(x.strip('auy'))
print(x.upper())

# list examples
a=['spam','eggs',100,1234]
print(a[:2]+['bacon',2*2])
print(3*a[:3]+['Boo!'])
print(a[:])
a[2]=a[2]+23
print(a)
a[0:2]=[1,12]
print(a)
a[0:2]=[]
print(a)
a[1:1]=['bletch','xyzzy']
print(a)
a[:0]=a
print(a)
a[:]=[]
print(a)
a.extend('ab')
print(a)
a.extend([1,2,33])
print(a)
