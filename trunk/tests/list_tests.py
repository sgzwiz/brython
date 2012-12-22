"""
Tests common to list and UserList.UserList
"""

type2test = list
# Iterable arg is optional
assert type2test([])==type2test()

# Init clears previous values
a = type2test([1, 2, 3])
a.__init__()
assert a == type2test([])

# Init overwrites previous values
a = type2test([1, 2, 3])
a.__init__([4, 5, 6])
assert a == type2test([4, 5, 6])

# Mutables always return a new object
b = type2test(a)
assert a==b

def test_repr():
    l0 = []
    l2 = [0, 1, 2]
    a0 = type2test(l0)
    a2 = type2test(l2)
    
    assert str(a0) == str(l0)
    assert repr(a0) == repr(l0)
    assert repr(a2) == repr(l2)
    log(str(a2))
    assert str(a2) == "[0,1,2]" # in regular Python [0, 1, 2]
    assert repr(a2) == "[0,1,2]"
    
    # skip next tests
    # a2.append(a2)
    # a2.append(3)
    # assert str(a2) == "[0, 1, 2, [...], 3]"
    # assert repr(a2) == "[0, 1, 2, [...], 3]"

test_repr()

def test_set_subscript():
    a = type2test(range(20))
    try:
        a.__setitem__(slice(0,10,0),[1,2,3])
    except ValueError:
        pass
    a.__setitem__(slice(0, 10), 1)
    assertRaises(TypeError, a.__setitem__, slice(0, 10), 1)
    assertRaises(ValueError, a.__setitem__, slice(0, 10, 2), [1,2])
    assertRaises(TypeError, a.__getitem__, 'x', 1)
    a[slice(2,10,3)] = [1,2,3]
    assertEqual(a, type2test([0, 1, 1, 3, 4, 2, 6, 7, 3,
                                        9, 10, 11, 12, 13, 14, 15,
                                        16, 17, 18, 19]))

test_set_subscript()

def test_reversed():
    a = type2test(range(20))
    r = reversed(a)
    assertEqual(list(r), type2test(range(19, -1, -1)))
    assertRaises(StopIteration, next, r)
    assertEqual(list(reversed(type2test())),
                     type2test())
    # Bug 3689: make sure list-reversed-iterator doesn't have __len__
    assertRaises(TypeError, len, reversed([1,2,3]))

def test_setitem():
    a = type2test([0, 1])
    a[0] = 0
    a[1] = 100
    assertEqual(a, type2test([0, 100]))
    a[-1] = 200
    assertEqual(a, type2test([0, 200]))
    a[-2] = 100
    assertEqual(a, type2test([100, 200]))
    assertRaises(IndexError, a.__setitem__, -3, 200)
    assertRaises(IndexError, a.__setitem__, 2, 200)

    a = type2test([])
    assertRaises(IndexError, a.__setitem__, 0, 200)
    assertRaises(IndexError, a.__setitem__, -1, 200)
    assertRaises(TypeError, a.__setitem__)

    a = type2test([0,1,2,3,4])
    a[0] = 1
    a[1] = 2
    a[2] = 3
    assertEqual(a, type2test([1,2,3,3,4]))
    a[0] = 5
    a[1] = 6
    a[2] = 7
    assertEqual(a, type2test([5,6,7,3,4]))
    a[-2] = 88
    a[-1] = 99
    assertEqual(a, type2test([5,6,7,88,99]))
    a[-2] = 8
    a[-1] = 9
    assertEqual(a, type2test([5,6,7,8,9]))

def test_delitem():
    a = type2test([0, 1])
    del a[1]
    assertEqual(a, [0])
    del a[0]
    assertEqual(a, [])

    a = type2test([0, 1])
    del a[-2]
    assertEqual(a, [1])
    del a[-1]
    assertEqual(a, [])

    a = type2test([0, 1])
    assertRaises(IndexError, a.__delitem__, -3)
    assertRaises(IndexError, a.__delitem__, 2)

    a = type2test([])
    assertRaises(IndexError, a.__delitem__, 0)

    assertRaises(TypeError, a.__delitem__)

def test_setslice():
    l = [0, 1]
    a = type2test(l)

    for i in range(-3, 4):
        a[:i] = l[:i]
        assertEqual(a, l)
        a2 = a[:]
        a2[:i] = a[:i]
        assertEqual(a2, a)
        a[i:] = l[i:]
        assertEqual(a, l)
        a2 = a[:]
        a2[i:] = a[i:]
        assertEqual(a2, a)
        for j in range(-3, 4):
            a[i:j] = l[i:j]
            assertEqual(a, l)
            a2 = a[:]
            a2[i:j] = a[i:j]
            assertEqual(a2, a)

    aa2 = a2[:]
    aa2[:0] = [-2, -1]
    assertEqual(aa2, [-2, -1, 0, 1])
    aa2[0:] = []
    assertEqual(aa2, [])

    a = type2test([1, 2, 3, 4, 5])
    a[:-1] = a
    assertEqual(a, type2test([1, 2, 3, 4, 5, 5]))
    a = type2test([1, 2, 3, 4, 5])
    a[1:] = a
    assertEqual(a, type2test([1, 1, 2, 3, 4, 5]))
    a = type2test([1, 2, 3, 4, 5])
    a[1:-1] = a
    assertEqual(a, type2test([1, 1, 2, 3, 4, 5, 5]))

    a = type2test([])
    a[:] = tuple(range(10))
    assertEqual(a, type2test(range(10)))

    assertRaises(TypeError, a.__setitem__, slice(0, 1, 5))

    assertRaises(TypeError, a.__setitem__)

def test_delslice():
    a = type2test([0, 1])
    del a[1:2]
    del a[0:1]
    assertEqual(a, type2test([]))

    a = type2test([0, 1])
    del a[1:2]
    del a[0:1]
    assertEqual(a, type2test([]))

    a = type2test([0, 1])
    del a[-2:-1]
    assertEqual(a, type2test([1]))

    a = type2test([0, 1])
    del a[-2:-1]
    assertEqual(a, type2test([1]))

    a = type2test([0, 1])
    del a[1:]
    del a[:1]
    assertEqual(a, type2test([]))

    a = type2test([0, 1])
    del a[1:]
    del a[:1]
    assertEqual(a, type2test([]))

    a = type2test([0, 1])
    del a[-1:]
    assertEqual(a, type2test([0]))

    a = type2test([0, 1])
    del a[-1:]
    assertEqual(a, type2test([0]))

    a = type2test([0, 1])
    del a[:]
    assertEqual(a, type2test([]))

def test_append():
    a = type2test([])
    a.append(0)
    a.append(1)
    a.append(2)
    assertEqual(a, type2test([0, 1, 2]))

    assertRaises(TypeError, a.append)

def test_extend():
    a1 = type2test([0])
    a2 = type2test((0, 1))
    a = a1[:]
    a.extend(a2)
    assertEqual(a, a1 + a2)

    a.extend(type2test([]))
    assertEqual(a, a1 + a2)

    a.extend(a)
    assertEqual(a, type2test([0, 0, 1, 0, 0, 1]))

    a = type2test("spam")
    a.extend("eggs")
    assertEqual(a, list("spameggs"))

    assertRaises(TypeError, a.extend, None)

    assertRaises(TypeError, a.extend)

def test_insert():
    a = type2test([0, 1, 2])
    a.insert(0, -2)
    a.insert(1, -1)
    a.insert(2, 0)
    assertEqual(a, [-2, -1, 0, 0, 1, 2])

    b = a[:]
    b.insert(-2, "foo")
    b.insert(-200, "left")
    b.insert(200, "right")
    assertEqual(b, type2test(["left",-2,-1,0,0,"foo",1,2,"right"]))

    assertRaises(TypeError, a.insert)

def test_pop():
    a = type2test([-1, 0, 1])
    a.pop()
    assertEqual(a, [-1, 0])
    a.pop(0)
    assertEqual(a, [0])
    assertRaises(IndexError, a.pop, 5)
    a.pop(0)
    assertEqual(a, [])
    assertRaises(IndexError, a.pop)
    assertRaises(TypeError, a.pop, 42, 42)
    a = type2test([0, 10, 20, 30, 40])

def test_remove():
    a = type2test([0, 0, 1])
    a.remove(1)
    assertEqual(a, [0, 0])
    a.remove(0)
    assertEqual(a, [0])
    a.remove(0)
    assertEqual(a, [])

    assertRaises(ValueError, a.remove, 0)

    assertRaises(TypeError, a.remove)

    """class BadExc(Exception):
        pass

    class BadCmp:
        def __eq__(self, other):
            if other == 2:
                raise BadExc()
            return False

    a = type2test([0, 1, 2, 3])
    assertRaises(BadExc, a.remove, BadCmp())

    class BadCmp2:
        def __eq__(self, other):
            raise BadExc()
    """
    d = type2test('abcdefghcij')
    d.remove('c')
    assertEqual(d, type2test('abdefghcij'))
    d.remove('c')
    assertEqual(d, type2test('abdefghij'))
    assertRaises(ValueError, d.remove, 'c')
    assertEqual(d, type2test('abdefghij'))

    # Handle comparison errors
    d = type2test(['a', 'b', BadCmp2(), 'c'])
    e = type2test(d)
    assertRaises(BadExc, d.remove, 'c')
    for x, y in zip(d, e):
        # verify that original order and values are retained.
        assertIs(x, y)

def test_count():
    a = type2test([0, 1, 2])*3
    assertEqual(a.count(0), 3)
    assertEqual(a.count(1), 3)
    assertEqual(a.count(3), 0)

    assertRaises(TypeError, a.count)

    """class BadExc(Exception):
        pass

    class BadCmp:
        def __eq__(self, other):
            if other == 2:
                raise BadExc()
            return False

    assertRaises(BadExc, a.count, BadCmp())"""

def test_index():
    u = type2test([0, 1])
    assertEqual(u.index(0), 0)
    assertEqual(u.index(1), 1)
    assertRaises(ValueError, u.index, 2)

    u = type2test([-2, -1, 0, 0, 1, 2])
    assertEqual(u.count(0), 2)
    assertEqual(u.index(0), 2)
    assertEqual(u.index(0, 2), 2)
    assertEqual(u.index(-2, -10), 0)
    assertEqual(u.index(0, 3), 3)
    assertEqual(u.index(0, 3, 4), 3)
    assertRaises(ValueError, u.index, 2, 0, -10)

    assertRaises(TypeError, u.index)

    """class BadExc(Exception):
        pass

    class BadCmp:
        def __eq__(self, other):
            if other == 2:
                raise BadExc()
            return False

    a = type2test([0, 1, 2, 3])
    assertRaises(BadExc, a.index, BadCmp())"""

    a = type2test([-2, -1, 0, 0, 1, 2])
    assertEqual(a.index(0), 2)
    assertEqual(a.index(0, 2), 2)
    assertEqual(a.index(0, -4), 2)
    assertEqual(a.index(-2, -10), 0)
    assertEqual(a.index(0, 3), 3)
    assertEqual(a.index(0, -3), 3)
    assertEqual(a.index(0, 3, 4), 3)
    assertEqual(a.index(0, -3, -2), 3)
    assertEqual(a.index(0, -4*sys.maxsize, 4*sys.maxsize), 2)
    assertRaises(ValueError, a.index, 0, 4*sys.maxsize,-4*sys.maxsize)
    assertRaises(ValueError, a.index, 2, 0, -10)
    a.remove(0)
    assertRaises(ValueError, a.index, 2, 0, 4)
    assertEqual(a, type2test([-2, -1, 0, 1, 2]))

    # Test modifying the list during index's iteration
    """class EvilCmp:
        def __init__(self, victim):
            victim = victim
        def __eq__(self, other):
            del victim[:]
            return False
    a = type2test()
    a[:] = [EvilCmp(a) for _ in range(100)]
    # This used to seg fault before patch #1005778
    assertRaises(ValueError, a.index, None)"""

def test_reverse():
    u = type2test([-2, -1, 0, 1, 2])
    u2 = u[:]
    u.reverse()
    assertEqual(u, [2, 1, 0, -1, -2])
    u.reverse()
    assertEqual(u, u2)

    assertRaises(TypeError, u.reverse, 42)

def test_clear():
    u = type2test([2, 3, 4])
    u.clear()
    assertEqual(u, [])

    u = type2test([])
    u.clear()
    assertEqual(u, [])

    u = type2test([])
    u.append(1)
    u.clear()
    u.append(2)
    assertEqual(u, [2])

    assertRaises(TypeError, u.clear, None)

def test_copy():
    u = type2test([1, 2, 3])
    v = u.copy()
    assertEqual(v, [1, 2, 3])

    u = type2test([])
    v = u.copy()
    assertEqual(v, [])

    # test that it's indeed a copy and not a reference
    u = type2test(['a', 'b'])
    v = u.copy()
    v.append('i')
    assertEqual(u, ['a', 'b'])
    assertEqual(v, u + ['i'])

    # test that it's a shallow, not a deep copy
    u = type2test([1, 2, [3, 4], 5])
    v = u.copy()
    assertEqual(u, v)
    assertIs(v[3], u[3])

    assertRaises(TypeError, u.copy, None)

def test_sort():
    u = type2test([1, 0])
    u.sort()
    assertEqual(u, [0, 1])

    u = type2test([2,1,0,-1,-2])
    u.sort()
    assertEqual(u, type2test([-2,-1,0,1,2]))

    assertRaises(TypeError, u.sort, 42, 42)

    def revcmp(a, b):
        if a == b:
            return 0
        elif a < b:
            return 1
        else: # a > b
            return -1
    u.sort(key=cmp_to_key(revcmp))
    assertEqual(u, type2test([2,1,0,-1,-2]))

    # The following dumps core in unpatched Python 1.5:
    def myComparison(x,y):
        xmod, ymod = x%3, y%7
        if xmod == ymod:
            return 0
        elif xmod < ymod:
            return -1
        else: # xmod > ymod
            return 1
    z = type2test(range(12))
    z.sort(key=cmp_to_key(myComparison))

    assertRaises(TypeError, z.sort, 2)

    def selfmodifyingComparison(x,y):
        z.append(1)
        if x == y:
            return 0
        elif x < y:
            return -1
        else: # x > y
            return 1
    assertRaises(ValueError, z.sort,
                      key=cmp_to_key(selfmodifyingComparison))

    assertRaises(TypeError, z.sort, 42, 42, 42, 42)

def test_slice():
    u = type2test("spam")
    u[:2] = "h"
    assertEqual(u, list("ham"))

def test_iadd():
    _super().test_iadd()
    u = type2test([0, 1])
    u2 = u
    u += [2, 3]
    assertIs(u, u2)

    u = type2test("spam")
    u += "eggs"
    assertEqual(u, type2test("spameggs"))

    assertRaises(TypeError, u.__iadd__, None)

def test_imul():
    u = type2test([0, 1])
    u *= 3
    assertEqual(u, type2test([0, 1, 0, 1, 0, 1]))
    u *= 0
    assertEqual(u, type2test([]))
    s = type2test([])
    oldid = id(s)
    s *= 10
    assertEqual(id(s), oldid)

def test_extendedslicing():
    #  subscript
    a = type2test([0,1,2,3,4])

    #  deletion
    del a[::2]
    assertEqual(a, type2test([1,3]))
    a = type2test(range(5))
    del a[1::2]
    assertEqual(a, type2test([0,2,4]))
    a = type2test(range(5))
    del a[1::-2]
    assertEqual(a, type2test([0,2,3,4]))
    a = type2test(range(10))
    del a[::1000]
    assertEqual(a, type2test([1, 2, 3, 4, 5, 6, 7, 8, 9]))
    #  assignment
    a = type2test(range(10))
    a[::2] = [-1]*5
    assertEqual(a, type2test([-1, 1, -1, 3, -1, 5, -1, 7, -1, 9]))
    a = type2test(range(10))
    a[::-4] = [10]*3
    assertEqual(a, type2test([0, 10, 2, 3, 4, 10, 6, 7, 8 ,10]))
    a = type2test(range(4))
    a[::-1] = a
    assertEqual(a, type2test([3, 2, 1, 0]))
    a = type2test(range(10))
    b = a[:]
    c = a[:]
    a[2:3] = type2test(["two", "elements"])
    b[slice(2,3)] = type2test(["two", "elements"])
    c[2:3:] = type2test(["two", "elements"])
    assertEqual(a, b)
    assertEqual(a, c)
    a = type2test(range(10))
    a[::2] = tuple(range(5))
    assertEqual(a, type2test([0, 1, 1, 3, 2, 5, 3, 7, 4, 9]))
    # test issue7788
    a = type2test(range(10))
    del a[9::1<<333]

def test_constructor_exception_handling():
    # Bug #1242657
    """class F(object):
        def __iter__():
            raise KeyboardInterrupt
    assertRaises(KeyboardInterrupt, list, F())"""
