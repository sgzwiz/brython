class baz:
  A = 8
class bar(baz):
  x = 0
  def test(self):
    return 'test in bar'
  def test1(self,x):
    return x*'test1'

class truc:
    machin = 99
    
class foo(bar,truc):
 def test(self):
  return 'test in foo'
 def test2(self):
   return 'test2'

obj = foo()
assert str(bar.test)=="<function bar.test>"
assert obj.A == 8
assert obj.x == 0
assert obj.test()=='test in foo'
assert obj.test1(2)=='test1test1'
assert obj.test2()=='test2'

#there is an error here, displayed on web console
assert obj.machin == 99

class stack(list):

    def dup(self):
        if len(self):
            self.append(self[-1])

x = stack([1,7])
assert str(x)=='[1,7]'
x.dup()
assert str(x)=='[1,7,7]'

print('passed all tests..')
