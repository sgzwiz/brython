
# list examples
a=['spam','eggs',100,1234]
log(a[:2]+['bacon',2*2])
log(3*a[:3]+['Boo!'])
log(a[:])
a[2]=a[2]+23
log(a)
a[0:2]=[1,12]
log(a)
a[0:2]=[]
log(a)
a[1:1]=['bletch','xyzzy']
log(a)
a[:0]=a
log(a)
a[:]=[]
log(a)