# script to compact all Brython scripts in a single one
import tokenize
import datetime
import re
now = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')

sources = ['py_classes','py2js','py_tokenizer','py_utils','py_ajax','py_dom',
    'py_svg','py_local_storage']

# update version number in module sys
sys_src = open('sys.js').read()
print(re.search('version_info:tuple\(int\(1\),int\(0\),str\(".*?"\)\)',sys_src))
sys_src = re.sub('version_info:tuple\(int\(1\),int\(0\),str\(".*?"\)\)',
    'version_info:tuple(int(1),int(0),str("%s"))' %now,sys_src)
out = open('sys.js','w')
out.write(sys_src)
out.close()

res = '// brython.js www.brython.info\n'
src_size = 0
for fname in sources:
    src = open(fname+'.js').read()
    src_size += len(src)
    pos = 0
    while pos<len(src):
        if src[pos] in ['"',"'"]:
            end = src.find(src[pos],pos+1)
            if end==-1:
                line = src[:pos].count('\n')
                raise SyntaxError('string not closed in %s line %s : %s' %(fname,line,src[pos:pos+20]))
            res += src[pos:end+1]
            pos = end+1
        elif src[pos]=='\r':
            pos += 1
        elif src[pos]==' ':
            if res and res[-1] in '({=[)}];\n':
                pos += 1
                continue
            res += ' '
            while pos<len(src) and src[pos]==' ':
                pos+=1
        elif src[pos] in '\r\n':
            res += src[pos]
            while pos<len(src) and src[pos] in '\r\n ':
                pos+=1
        elif src[pos:pos+2]=='//':
            end = src.find('\n',pos)
            if end==-1:
                break
            pos = end
        elif src[pos:pos+2]=='/*':
            end = src.find('*/',pos)
            if end==-1:
                break
            pos = end
        elif src[pos] in '={[(' and res and res[-1]==' ':
            res = res[:-1]+src[pos]
            pos += 1
        elif src[pos]==';' and pos<len(src)-1 and src[pos+1] in ' \r\n':
            pos +=1
        else:
            res += src[pos]
            pos += 1


out = open('brython.js','w')
out.write(res)
out.close()

try:
    out = open('../dist/brython_%s.js' %now,'w')
    out.write(res)
    out.close()
except IOError:
    pass

print('size : originals %s compact %s gain %.2f' %(src_size,len(res),100*(src_size-len(res))/src_size))

# zip file
import os
import tarfile
dest_dir = os.path.join(os.getcwd(),'dist')
if not os.path.exists(dest_dir):
    os.mkdir(dest_dir)
name = 'Brython-%s' %now
dest_path = os.path.join(dest_dir,name)
dist = tarfile.open(dest_path+'.gz',mode='w:gz')

def is_valid(filename):
    if filename.startswith('.'):
        return False
    for ext in ['bat','log','gz']:
        if filename.lower().endswith('.%s' %ext):
            return False
    return True

for path in os.listdir(os.getcwd()):
    if not is_valid(path):
        continue
    abs_path = os.path.join(os.getcwd(),path)
    if os.path.isdir(abs_path) and path=="dist":
        continue
    print('add',path)
    dist.add(os.path.join(os.getcwd(),path),
        arcname=os.path.join(name,path))

dist.close()