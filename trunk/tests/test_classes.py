class baz:
  A = 8
class bar(baz):
  x = 0
  def test(self):
    return 'test in bar'
  def test1(self,x):
    return x*'test1'

class foo(bar):
 def test(self):
  return 'test in foo'
 def test2(self):
   return 'test2'

obj = foo()
print(bar.test)
print(obj.test)
assert obj.A == 8
assert obj.x == 0
assert obj.test()=='test in foo'
assert obj.test1(2)=='test1test1'
assert obj.test2()=='test2'

print('passed all tests...')