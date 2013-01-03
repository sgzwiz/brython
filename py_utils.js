// transform native JS types into Brython types
function $JS2Py(src){
    if(src===null){return None}
    if(src===false){return False}
    if(src===true){return True}
    if(isinstance(src,[str,int,float,list,dict,set])){return src}
    if(typeof src=="object"){
        if(src.constructor===Array){return src}
        else if(src.tagName!==undefined && src.nodeName!==undefined){return src}
        else{
            try{if(src.constructor==DragEvent){return new $MouseEvent(src)}}
            catch(err){void(0)}
            try{if(src.constructor==MouseEvent){return new $MouseEvent(src)}}
            catch(err){void(0)}
            try{if(src.constructor==KeyboardEvent){return new $DomWrapper(src)}}
            catch(err){void(0)}
            if(src.__class__!==undefined){return src}
            return new $DomWrapper(src)
        }
    }else{
        return src
    }
}

// exceptions
function $raise(name,msg) {
    // raises exception with specified name and message
    if(msg===undefined){msg=''}
    if(document.$debug && msg.split('\n').length==1){
        var module = document.$line_info[1]
        var line_num = document.$line_info[0]
        var lines = document.$py_src[module].split('\n')
        msg += "\nmodule '"+module+"' line "+line_num
        msg += '\n'+lines[line_num-1]
    }
    err = new Error()
    err.name = name
    err.message = msg
    err.py_error = true
    if(document.$stderr!==null){document.$stderr_buff = err.name+': '+err.message}
    throw err
}

function $src_error(name,module,msg,pos) {
    // map position to line number
    var pos2line = {}
    var lnum=1
    var src = document.$py_src[module]
    for(i=0;i<src.length;i++){
        pos2line[i]=lnum
        if(src.charAt(i)=='\n'){lnum+=1}
    }
    var line_num = pos2line[pos]
    var lines = src.split('\n')
    msg += "\nmodule '"+module+"' line "+line_num
    msg += '\n'+lines[line_num-1]
    err = new Error()
    err.name = name
    err.message = msg
    err.py_error = true
    if(document.$stderr!==null){document.$stderr_buff = err.message}
    throw err
}

function $SyntaxError(module,msg,pos) {
    $src_error('SyntaxError',module,msg,pos)
}

function $IndentationError(module,msg,pos) {
    $src_error('IndentationError',module,msg,pos)
}

// escaping double quotes
var $dq_regexp = new RegExp('"',"g") // to escape double quotes in arguments
function $escape_dq(arg){return arg.replace($dq_regexp,'\\"')}

// default standard output and error
// can be reset by sys.stdout or sys.stderr
document.$stderr = null
document.$stderr_buff = '' // buffer for standard output

document.$stdout = {
    write: function(data){console.log(data)}
}

// used for class of classes
function $type(){}
$type.__class__ = $type
$type.toString = function(){return "<class 'type'>"}

function $UnsupportedOpType(op,class1,class2){
    $raise('TypeError',
        "unsupported operand type(s) for "+op+": '"+class1+"' and '"+class2+"'")
}

// classes used for passing parameters to functions
// keyword arguments : foo(x=1)
function $KwClass(name,value){
    this.__class__ = $Kw
    this.name = name
    this.value = value
}
$KwClass.prototype.toString = function(){
    return '<kw '+this.name+' : '+this.value.toString()+'>'
}
function $Kw(name,value){
    return new $KwClass(name,value)
}

// packed tuple : foo(*args)
function $ptuple_class(arg){
    this.__class__ = $ptuple
    this.arg=arg
}
function $ptuple(arg){return new $ptuple_class(arg)}

// packed dict : foo(**kw)
function $pdict_class(arg){
    this.__class__ = $pdict
    this.arg=arg
}
function $pdict(arg){return new $pdict_class(arg)}


function $test_item(expr){
    // used to evaluate expressions with "and" or "or"
    // returns a Javascript boolean (true or false) and stores
    // the evaluation in a global variable $test_result
    document.$test_result = expr
    return bool(expr)
}

function $test_expr(){
    // returns the last evaluated item
    return document.$test_result
}

// define a function __eq__ for functions to allow test on Python classes
// such as object.__class__ == SomeClass
Function.prototype.__eq__ = function(other){
    if(typeof other !== 'function'){return False}
    return other+''===this+''
}
Function.prototype.__class__ = Function
Function.prototype.get_name = function(){
    var src = this.toString() // coerce to string
    pattern = new RegExp("function (.*?)\\(")
    var res = pattern.exec(src)
    value = '<function '+res[1]+'>'
}

Array.prototype.match = function(other){
    // return true if array and other have the same first items
    var $i = 0
    while($i<this.length && $i<other.length){
        if(this[$i]!==other[$i]){return false}
        $i++
    }
    return true
}

// IE doesn't implement indexOf on Arrays
if(!Array.indexOf){  
Array.prototype.indexOf = function(obj){  
    for(var i=0;i<this.length;i++){  
        if(this[i]==obj){  
            return i;  
        }  
    }  
    return -1;  
 }  
}

// in case console is not defined
try{console}
catch(err){
    console = {'log':function(data){void(0)}}
}

function $List2Dict(){
    var res = {}
    var i=0
    if(arguments.length==1 && arguments[0].constructor==Array){
        // arguments passed as a list
        for(i=0;i<arguments[0].length;i++){
            res[arguments[0][i]]=0
        }
    } else {
        for(i=0;i<arguments.length;i++){
            res[arguments[i]]=0
        }
    }
    return res
}

function $last(item){
    if(typeof item=="string"){return item.charAt(item.length-1)}
    else if(typeof item=="object"){return item[item.length-1]}
}

// classes to manipulate the tokens generated by py_tokenizer

function Atom(stack){
    this.parent = stack
    this.type = null
    this.stack = function(){
        return new Stack(this.parent.list.slice(this.start,this.end+1))
    }
    this.list = function(){
        return this.parent.list.slice(this.start,this.end+1)
    }
    this.to_js = function(){return this.stack().to_js()}
}

function Stack(stack_list){
    this.list = stack_list
}    
Stack.prototype.find_next = function(){
    // arguments are position to search from, researched type and
    // optional researched values
    // return position of next matching stack item or null
    var pos = arguments[0]
    var _type = arguments[1]
    var values = null
    if(arguments.length>2){
        values = {}
        for(i=2;i<arguments.length;i++){values[arguments[i]]=0}
    }
    for(i=pos;i<this.list.length;i++){
        if(this.list[i][0]===_type){
            if(values===null){
                return i
            } else if(this.list[i][1] in values){
                return i
            }
        }
    }
    return null
}

Stack.prototype.find_next_at_same_level = function(){
    // same as find_next but skips enclosures to find the token
    // at the same level as the one where search starts
    var pos = arguments[0]
    var _type = arguments[1]
    var values = null
    if(arguments.length>2){
        values = {}
        for(i=2;i<arguments.length;i++){values[arguments[i]]=0}
    }
    while(true){
        if(this.list[pos][0]==_type){
            if(values==null){return pos}
            else if(this.list[pos][1] in values){return pos}
        }else if(this.list[pos][0]=="bracket"){
            if(this.list[pos][1] in $OpeningBrackets){
                pos = this.find_next_matching(pos)
            }else if(this.list[pos][1] in $ClosingBrackets){
                return null
            }
        } 
        pos++
        if (pos>this.list.length-1){return null}
    }
}
    
Stack.prototype.find_previous = function(){
    // same as find_next but search backwards from pos
    var pos = arguments[0]
    var _type = arguments[1]
    var values = null
    if(arguments.length>2){
        values = {}
        for(i=2;i<arguments.length;i++){values[arguments[i]]=0}
    }
    for(i=pos;i>=0;i--){
        if(this.list[i][0]==_type){
            if(values==null){
                return i
            } else if(this.list[i][1] in values){
                return i
            }
        }
    }
    return null
}

Stack.prototype.find_next_matching = function(pos){
    // find position of stack item closing the bracket 
    // at specified position in the tokens stack
    
    var brackets = {"(":")","[":"]","{":"}"}
    var _item = this.list[pos]
    if(_item[0]=="bracket"){
        opening = _item[1]
        count = 0
        for(i=pos;i<this.list.length;i++){
            if(this.list[i][0]=="bracket"){
                var value = this.list[i][1]
                if(value==opening){count += 1}
                else if(value==brackets[opening]){
                    count -= 1
                    if(count==0){return i}
                }
            }
        }
    }
    return null
}

Stack.prototype.find_previous_matching = function(pos){
    // find position of stack item closing the bracket 
    // at specified position in the tokens stack
    
    var brackets = {")":"(","]":"[","}":"{"}
    var item = this.list[pos]
    var i=0
    if(item[0]=="bracket"){
        closing = item[1]
        count = 0
        for(i=pos;i>=0;i--){
            if(this.list[i][0]=="bracket"){
                var value = this.list[i][1]
                if(value==closing){count += 1;}
                else if(value==brackets[closing]){
                    count -= 1
                    if(count==0){return i}
                }
            }
        }
    }
    return null
}

Stack.prototype.ids_in = function(){
    var ids = []
    for(var i=0;i<this.list.length;i++){
        if(this.list[i][0]==='id'){
            var loc_var = this.list[i][1]
            if(ids.indexOf(loc_var)===-1){ids.push(loc_var)}
        }
    }    
    return ids
}
    
Stack.prototype.get_atoms = function(){
    var pos = 0
    var nb = 0
    var atoms = []
    while(pos<this.list.length){
        atom = this.atom_at(pos,true)
        atoms.push(atom)
        pos += atom.end-atom.start
    }
    return atoms
}

Stack.prototype.raw_atom_at = function(pos){
    atom = new Atom(this)
    atom.valid_type = true
    atom.start = pos
    if(pos>this.list.length-1){
        atom.valid_type = false
        atom.end = pos
        return atom
    }
    var dict1 = $List2Dict('id','assign_id','str','int','float')
    var $valid_kws=$List2Dict("True","False","None")
    if(this.list[pos][0] in dict1 || 
        (this.list[pos][0]=="keyword" && this.list[pos][1] in $valid_kws) ||
        (this.list[pos][0]=="bracket" && 
            (this.list[pos][1]=="(" || this.list[pos][1]=='['))){
        atom.type = this.list[pos][0]
        end = pos
        if(this.list[pos][0]=='bracket'){
            atom.type="tuple"
            end=this.find_next_matching(pos)
        }
        while(end<this.list.length-1){
            var item = this.list[end+1]
            if(item[0] in dict1 && atom.type=="qualified_id"){
                end += 1
            } else if(item[0]=="point"||item[0]=="qualifier"){
                atom.type = "qualified_id"
                end += 1
            } else if(item[0]=="bracket" && item[1]=='('){
                atom.type = "function_call"
                end = this.find_next_matching(end+1)
            } else if(item[0]=="bracket" && item[1]=='['){
                atom.type = "slicing"
                end = this.find_next_matching(end+1)
            } else {
                break
            }
        }
        atom.end = end
        return atom
    } else if(this.list[pos][0]=="bracket" && 
        (this.list[pos][1]=="(" || this.list[pos][1]=='[')){
        atom.type = "tuple"
        atom.end = this.find_next_matching(pos)
        return atom
    } else {
        atom.type = this.list[pos][0]
        atom.valid_type = false
        atom.end = pos
        return atom
    }
}

Stack.prototype.tuple_at = function(pos){
    var first = this.raw_atom_at(pos)
    var items=[first]
    while(true){
        var last = items[items.length-1]
        if(last.end+1>=this.list.length){break}
        var delim = this.list[last.end+1]
        if(delim[0]=='delimiter' && delim[1]==','){
            var next=this.raw_atom_at(last.end+2)
            if(next !==null && next.valid_type){items.push(next)}
            else{break}
        }else{break}
    }
    return items
}

Stack.prototype.atom_at = function(pos,implicit_tuple){
    if(!implicit_tuple){return this.raw_atom_at(pos)}
    else{
        var items = this.tuple_at(pos) // array of raw atoms
        atom = new Atom(this)
        if(items.length==1){return items[0]}
        else{
            atom.type="tuple"
            atom.start = items[0].start
            atom.end = items[items.length-1].end
            return atom
        }
    }
}

Stack.prototype.atom_before = function(pos,implicit_tuple){
        // return the atom before specified position
        atom = new Atom(this)
        if(pos==0){return null}
        atom.end = pos-1
        atom.start = pos-1
        // find position before atom
        var atom_parts=$List2Dict("id","assign_id","str",'int','float',"point","qualifier")
        var $valid_kws=$List2Dict("True","False","None")
        var closing = $List2Dict(')',']')
        while(true){
            if(atom.start==-1){break}
            var item = this.list[atom.start]
            if(item[0] in atom_parts){atom.start--;continue}
            else if(item[0]=="keyword" && item[1] in $valid_kws){
                atom.start--;continue
            }
            else if(item[0]=="bracket" && item[1] in closing){
                atom.start = this.find_previous_matching(atom.start)-1
                continue
            }
            else if(implicit_tuple && item[0]=="delimiter"
                    && item[1]==","){atom.start--;continue}
            break
        }
        atom.start++
        return this.atom_at(atom.start,implicit_tuple)
    }
    
Stack.prototype.indent = function(pos){
    // return indentation of the line of the item at specified position
    var ipos = this.find_previous(pos,"indent")
    return this.list[ipos][1]  
}

Stack.prototype.line_end = function(pos){
    // return position of line end
    var nl = this.find_next(pos,"newline")
    if(nl==null){nl = this.list.length}
    return nl
}

Stack.prototype.line_start = function(pos){
    // return position of line start
    var nl = this.find_previous(pos,"newline")
    if(nl==null){return 0}
    return nl+1    
}

Stack.prototype.next_at_same_indent = function(pos){
    var indent = this.indent(pos)
    var nxt_pos = this.find_next(pos,"newline")
    while(true){
        if(nxt_pos===null){return null}
        if(nxt_pos>=this.list.length-1){return null}
        else if(this.list[nxt_pos+1][0]=="indent"){
            var nxt_indent = this.list[nxt_pos+1][1]
            nxt_pos++
        }else{var nxt_indent=0}
        if(nxt_indent==indent){return nxt_pos+1}
        else if(nxt_indent<indent){return null}
        nxt_pos = this.find_next(nxt_pos+1,"newline")
    }    
}

Stack.prototype.split = function(delimiter){
    // split stack with specified delimiter
    var items = new Array(), count = 0,pos = 0,start = 0
    while(pos<this.list.length){
        pos = this.find_next_at_same_level(pos,'delimiter',delimiter)
        if(pos==null){pos=this.list.length;break}
        var s = new Stack(this.list.slice(start,pos))
        s.start = start
        s.end = pos-1
        items.push(s)
        start = pos+1
        pos++
    }
    var s = new Stack(this.list.slice(start,pos))
    s.start = start
    s.end = pos-1
    if(s.end<start){s.end=start}
    items.push(s)
    return items
}

Stack.prototype.find_block = function(pos){
        var item = this.list[pos]
        var closing_pos = this.find_next_at_same_level(pos+1,'delimiter',':')
        if(closing_pos!=null){
            // find block end : the newline before the first indentation equal
            // to the indentation of the line beginning with the keyword
            var kw_indent = this.indent(pos)
            var stop = closing_pos
            while(true){
                nl = this.find_next(stop,"newline")
                if(nl==null){stop = this.list.length-1;break}
                if(nl<this.list.length-1){
                    if(this.list[nl+1][0]=="indent"){
                        if(this.list[nl+1][1]<=kw_indent){
                            stop = nl
                            break
                        }
                    } else { // no indent
                        stop = nl
                        break
                    }
                } else {
                    stop = this.list.length-1
                    break
                }
                stop = nl+1
            }
            return [closing_pos,stop,kw_indent]
        }else{return null}
    }

Stack.prototype.to_js = function(){
    // build Javascript code
    var i=0,j=0,x=null
    var js = "",scope_stack=[]
    var t2 = $List2Dict('id','assign_id','str','int','float','keyword','code')

    for(i=0;i<this.list.length;i++){
        x = this.list[i]
        if(x[0]=="indent") {
            for(j=0;j<x[1];j++){js += " "}
        } else if(x[0] in t2) {
            if(x[0]=='int'){js += 'Number('+x[1]+')'}
            else if(x[0]==='float'){js += 'float('+x[1]+')'}
            else if(x[0]==='str'){js+= x[1].replace(/\n/gm,'\\n')}
            else{js += x[1]}
            if(i<this.list.length-1 && this.list[i+1][0] != "bracket"
                && this.list[i+1][0]!="point" && this.list[i+1][0]!="delimiter"){
                js += " "
            }
        } else {
            if(x[0]=="newline"){js += '\r\n'}
            else{js += x[1]}
        }
    }
    return js
}

Stack.prototype.dump = function(){
    ch = ''
    for(var i=0;i<this.list.length;i++){
        _item = this.list[i]
        ch += i+' '+_item[0]+' '+_item[1]+'\n'
    }
    alert(ch)
}



