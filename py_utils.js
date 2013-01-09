function $MakeArgs($fname,$args,$required,$defaults,$other_args,$other_kw){
    // builds a namespace from the arguments provided in $args
    // in a function call like foo(x,y,z=1,*args,**kw) the parameters are
    // $required : ['x','y']
    // $defaults : {'z':int(1)}
    // $other_args = 'args'
    // $other_kw = 'kw'
    var i=null,$PyVars = {},$def_names = [],$ns = {}
    for(var k in $defaults){$def_names.push(k);$ns[k]=$defaults[k]}
    if($other_args != null){$ns[$other_args]=[]}
    if($other_kw != null){$dict_items=[]}
    // create new list of arguments in case some are packed
    var upargs = []
    for(var i=0;i<$args.length;i++){
        if($args[i]===null){upargs.push(null)}
        else if(isinstance($args[i],$ptuple)){
            for(var j=0;j<$args[i].arg.length;j++){
                upargs.push($args[i].arg[j])
            }
        }else if(isinstance($args[i],$pdict)){
            for(var j=0;j<$args[i].arg.$keys.length;j++){
                upargs.push($Kw($args[i].arg.$keys[j],$args[i].arg.$values[j]))
            }
        }else{
            upargs.push($args[i])
        }
    }
    for(var $i=0;$i<upargs.length;$i++){
        $arg=upargs[$i]
        $PyVar=$JS2Py($arg)
        if(isinstance($arg,$Kw)){ // keyword argument
            $PyVar = $arg.value
            if($arg.name in $PyVars){
                throw new TypeError($fname+"() got multiple values for argument '"+$arg.name+"'")
            } else if($required.indexOf($arg.name)>-1){
                var ix = $required.indexOf($arg.name)
                eval('var '+$required[ix]+"=$PyVar")
                $ns[$required[ix]]=$PyVar
            } else if($arg.name in $defaults){
                $ns[$arg.name]=$PyVar
            } else if($other_kw!=null){
                $dict_items.push([$arg.name,$PyVar])
            } else {
                throw new TypeError($fname+"() got an unexpected keyword argument '"+$arg.name+"'")
            }
            if($arg.name in $defaults){delete $defaults[$arg.name]}
        }else{ // positional arguments
            if($i<$required.length){
                eval('var '+$required[$i]+"=$PyVar")
                $ns[$required[$i]]=$PyVar
            } else if($i<$required.length+$def_names.length) {
                $ns[$def_names[$i-$required.length]]=$PyVar
            } else if($other_args!=null){
                eval('$ns["'+$other_args+'"].push($PyVar)')
            } else {
                msg = $fname+"() takes "+$required.length+' positional arguments '
                msg += 'but more were given'
                throw TypeError(msg)
            }
        }
    }
    if($other_kw!=null){$ns[$other_kw]=dict($dict_items)}
    return $ns
}

function $list_comp($loops,$expr,$cond,$env){
    // create local variables passed from the list comp environment
    for(var i=0;i<$env.length;i+=2){
        eval('var '+$env[i]+'=$env['+(i+1)+']')
    }
    var py = 'res = []\n'
    for(var i=0;i<$loops.length;i++){
        for(j=0;j<4*i;j++){py += ' '} // indent
        py += 'for '+$loops[i][0]+' in '+$loops[i][1]+':\n'
    }
    if($cond){
        for(var j=0;j<4*i;j++){py += ' '} // indent
        py += 'if '+$cond+':\n'
        i++
    }
    for(var j=0;j<4*i;j++){py += ' '} // indent
    py += 'tvar = '+$expr+'\n'
    for(var j=0;j<4*i;j++){py += ' '} // indent
    py += 'res.append(tvar)'
    var js = $py2js(py).to_js()
    eval(js)
    return res
}

// transform native JS types into Brython types
function $JS2Py(src){
    if(src===null){return None}
    if(typeof src==='number'){
        if(src%1===0){return src}
        else{return float(src)}
    }
    if(src.__class__!==undefined){return src}
    if(typeof src=="object"){
        if(src.constructor===Array){return src}
        else if($isNode(src)){return $DOMNode(src)}
        else if($isEvent(src)){return $DOMEvent(src)}
    }
    return JSObject(src)
}

// this trick is necessary to set "this" to the instance inside functions
// found at http://yehudakatz.com/2011/08/11/understanding-javascript-function-invocation-and-this/
function $bind(func, thisValue) {
    return function() {return func.apply(thisValue, arguments)}
}

function $getattr(obj,attr){ // generic attribute getter
    if(obj[attr]!==undefined){
        var res = obj[attr]
        if(typeof res==="function"){
            res = $bind(res, obj)
        }
        return $JS2Py(res)
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
