# numbers
assert 2+2==4

#print((50-5*6)/4)
assert (50-5*6)/4 == 5.0

#print(8/5)
assert 8/5 == 1.6

#print(7//3)
assert 7//3 == 2

#print(7//-3)
assert 7//-3 == -3

width=20
height=5*9
#print(width*height)
assert width*height == 900

x=y=z=0
#print(x)
#print(y)
#print(z)
assert x==0
assert y==0
assert z==0

#not sure how to convert this to assert (raise)?
try:
  print(n)
except:
  print('n is not defined')

#print(3 * 3.75 / 1.5)
assert 3 * 3.75 / 1.5 == 7.5

#print(7.0 / 2)
assert 7.0 / 2 == 3.5

# strings
#print('spam eggs')
assert 'spam eggs' == "spam eggs"

#print('doesn\'t')
#print("doesn't")
assert 'doesn\'t' == "doesn't"
#print('"Yes," he said.')
#print("\"Yes,\" he said.")

assert '"Yes," he said.' == "\"Yes,\" he said."

#print('"Isn\'t," she said.')
assert '"Isn\'t," she said.' == "\"Isn't,\" she said."
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
#print(word)
assert word == 'HelpA'

#print('<' + word*5 + '>')
assert word*5 == "HelpAHelpAHelpAHelpAHelpA"

#print('str' 'ing')
assert 'str' 'ing' == 'string'

#print('str'.strip() + 'ing')
assert 'str'.strip() + 'ing' == 'string'
assert ' str '.strip() + 'ing' == 'string'

# string methods
x='fooss'
#print(x.replace('o','X',20))
assert x.replace('o', 'X', 20) == 'fXXss'

#print('GhFF'.lower())
assert 'GhFF'.lower() == 'ghff'

#print(x.lstrip('of'))
assert x.lstrip('of') == 'ss'

x='aZjhkhZyuy'

#print(x.find('Z'))
#print(x.rfind('Z'))
#print(x.rindex('Z'))
assert x.find('Z') == 1
assert x.rfind('Z') == 6
assert x.rindex('Z') == 6

try:
    print(x.rindex('K'))
except ValueError:
    print('erreur')

#print(x.split('h'))
assert x.split('h') == ['aZj', 'k', 'Zyuy']

print(x.split('h',1))
assert x.split('h',1) == ['aZj', 'khZyuy']   # this fails!

#print(x.startswith('aZ'))
assert x.startswith('aZ')

#print(x.strip('auy'))
assert x.strip('auy') == 'ZjhkhZ'

#print(x.upper())
assert x.upper() == 'AZJHKHZYUY'

# list examples
a=['spam','eggs',100,1234]

#print(a[:2]+['bacon',2*2])
assert a[:2] + ['bacon', 2*2] == ['spam', 'eggs', 'bacon', 4]

#print(3*a[:3]+['Boo!'])
assert 3*a[:3]+['Boo!'] == ['spam', 'eggs', 100, 'spam', 'eggs', 100, 'spam', 'eggs', 100, 'Boo!']

#print(a[:])
assert a[:] == ['spam', 'eggs', 100, 1234]

a[2]=a[2]+23
assert a == ['spam', 'eggs', 123, 1234]

a[0:2]=[1,12]
#print(a)
assert a == [1, 12, 123, 1234]

a[0:2]=[]
#print(a)
assert a == [123, 1234]

a[1:1]=['bletch','xyzzy']
#print(a)
assert a == [123, 'bletch', 'xyzzy', 1234]


a[:0]=a
#print(a)
assert a == [123, 'bletch', 'xyzzy', 1234, 123, 'bletch', 'xyzzy', 1234]

a[:]=[]
#print(a)
assert a == []

a.extend('ab')
#print(a)
assert a == ['a', 'b']

a.extend([1,2,33])
#print(a)
assert a == ['a', 'b', 1, 2, 33]

# lambda
g = lambda x,y=99: 2*x+y
assert g(10,6)==26
assert g(10)==119

x = [lambda x:x*2,lambda y:y*3]
assert x[0](5)==10
assert x[1](10)==30
