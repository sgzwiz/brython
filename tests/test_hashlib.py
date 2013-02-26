import hashlib

m = hashlib.md5()

m.update("hashlib test")
assert m.hexdigest() == "c8fead1ad6206097c6073cdf20f49f93"

m.update("another test")
assert m.hexdigest() == "175a023e6f75d81e2ecdcdc75d96e6fe"

