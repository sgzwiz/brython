# script to compact all Brython scripts in a single one
import tokenize
import re
import datetime

now = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')

sources = ['py_classes_new','py_list','py_string_new','py_import_new',
    'py2js_new','py_utils',
    'py_ajax','py_dom','py_svg','py_local_storage']

# update version number in module sys
sys_src = open('libs/sys.js').read()

sys_src = re.sub('version_info:\[1,0,".*?"\]',
    'version_info:[1,0,"%s"]' %now,sys_src)
out = open('libs/sys.js','w')
out.write(sys_src)
out.close()

res = '// brython.js www.brython.info\n'
res += '// version 1.0.%s\n' %now
res += '// version compiled from commented, indented source files at http://code.google.com/p/brython/\n'
src_size = 0
for fname in sources:
    src = open(fname+'.js').read()
    if fname=='py2js_new':
        src = src.replace('context','C')
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

while '\n\n' in res:
    res = res.replace('\n\n','\n')

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

# zip files
import os
import tarfile
import zipfile

dest_dir = os.path.join(os.getcwd(),'dist')
if not os.path.exists(dest_dir):
    os.mkdir(dest_dir)
name = 'Brython_site_mirror-%s' %now
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

# minimum package
name = 'Brython-%s' %now
dest_path = os.path.join(dest_dir,name)
dist1 = tarfile.open(dest_path+'.gz',mode='w:gz')
dist2 = tarfile.open(dest_path+'.bz2',mode='w:bz2')
dist3 = zipfile.ZipFile(dest_path+'.zip',mode='w',compression=zipfile.ZIP_DEFLATED)

def is_valid(filename):
    if filename.startswith('.'):
        return False
    if not filename.lower().endswith('.js'):
        return False
    return True

for arc,wfunc in (dist1,dist1.add),(dist2,dist2.add),(dist3,dist3.write):

    for path in 'brython.js','brython.png','README.txt','LICENCE.txt','test.html':
        wfunc(os.path.join(os.getcwd(),path),
                arcname=os.path.join(name,path))
    
    for path in os.listdir(os.path.join(os.getcwd(),'libs')):
        if os.path.splitext(path)[1]!='.js':
            continue
        abs_path = os.path.join(os.getcwd(),'libs',path)
        print('add',path)
        wfunc(os.path.join(os.getcwd(),'libs',path),
            arcname=os.path.join(name,'libs',path))

    arc.close()
