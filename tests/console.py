import sys
import time
import random

#this sucks..  cannot find dis since "root" path is blah/test
#we might need to create a variable we pass via the brython function
# to state what the root path is.  
# For now, we'll hardcode a relative path. :(

sys.path.append("../Lib")
import dis

_rand=random.random()

editor=JSObject(ace).edit("editor")
editor.getSession().setMode("ace/mode/python")

if sys.has_local_storage:
    from local_storage import storage
else:
    storage = False

def reset_src():
    if storage:
       editor.setValue('%s' % storage["py_src"])
    else:
       editor.setValue('for i in range(10):\n\tprint(i)')

    editor.scrollToRow(0)
    editor.gotoLine(0)


def write(data):
    doc["console"].value += str(data)

sys.stdout = object()
sys.stdout.write = write

sys.stderr = object()
sys.stderr.write = write

def to_str(xx):
    return str(xx)

doc['version'].text = '.'.join(map(to_str,sys.version_info))

output = ''

def show_console():
    doc["console"].value = output
    doc["console"].cols = 60

def clear_text():
    editor.setValue('')
    doc["console"].value=''

def run():
    global output
    doc["console"].value=''
    src = editor.getValue()
    if sys.has_local_storage:
        storage["py_src"]=src
    t0 = time.time()
    exec(src)
    output = doc["console"].value
    print('<completed in %s ms>' %(time.time()-t0))

# load a Python script
def on_complete(req):
    editor.setValue(req.text)
    editor.scrollToRow(0)
    editor.gotoLine(0)

def load(evt):
    _name=evt.target.value
    req = ajax()
    req.on_complete = on_complete
    req.open('GET',_name+'?foo=%s' % _rand,False)
    req.send()

def show_js():
    src = editor.getValue()
    doc["console"].value = dis.dis(src)

def change_theme(evt):
    _theme=evt.target.value
    editor.setTheme(_theme)

    if storage:
       storage["ace_theme"]=_theme

def reset_theme():
    if storage:
       if storage["ace_theme"].startswith("ace/theme/"):
          editor.setTheme('%s' % storage["ace_theme"])

          doc["ace_theme"].value=storage["ace_theme"]

reset_src()
reset_theme()
