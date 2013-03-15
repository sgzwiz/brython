import simple

class Simple2:
    def __init__(self):
        self.info = "SimpleClass2"

class Simple3(simple.Simple):
  def __init__(self):
      simple.Simple.__init__(self)

text = "text in simple"

print(simple.text == text)

_s=simple.Simple()
_s3=Simple3()
print(_s.info==_s3.info)
