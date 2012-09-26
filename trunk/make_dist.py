# script to compact all Brython scripts in a single one
import tokenize

sources = ['py_classes','py2js','py_tokenizer','py_utils','py_ajax','py_dom','py_local_storage']

res = ''
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

print('size : originals %s compact %s gain %.2f' %(src_size,len(res),100*(src_size-len(res))/src_size))