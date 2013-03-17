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
    if($other_kw != null){$dict_keys=[];$dict_values=[]}
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
                $dict_keys.push($arg.name)
                $dict_values.push($PyVar)
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
    if($other_kw!=null){$ns[$other_kw]=new $DictClass($dict_keys,$dict_values)}
    return $ns
}

function $list_comp(){
    var $env = arguments[0]
    for(var $arg in $env){
        eval("var "+$arg+'=$env["'+$arg+'"]')
    }
    var $res = 'res'+Math.random().toString(36).substr(2,8)
    var $py = $res+"=[]\n"
    var indent=0
    for(var i=2;i<arguments.length;i++){
        for(var j=0;j<indent;j++){$py += ' '}
        $py += arguments[i]+':\n'
        indent += 4
    }
    for(var j=0;j<indent;j++){$py += ' '}
    $py += $res+'.append('+arguments[1]+')'
    var $js = __BRYTHON__.py2js($py,'list comprehension').to_js()
    eval($js)
    return eval($res)
}

function $generator(func){
    var res = function(){
        func.$iter = []
        func.apply(this,arguments)
    
        var obj = new Object()
        obj.__class__ = $generator
        obj.__len__ = function(){return func.$iter.__len__()}
        obj.__item__ = function(rank){return func.$iter.__item__(rank)}
        return obj
    }
    res.__str__ = function(){return "<function "+res.__name__+">"}
    return res
}

function $ternary(env,cond,expr1,expr2){
    for(var attr in env){eval('var '+attr+'=env["'+attr+'"]')}
    var res = 'if ('+cond+'){\n'
    res += '    var $res = '+expr1+'\n}else{\n'
    res += '    var $res = '+expr2+'\n}'
    eval(res)
    return $res
}

function $lambda(args,body){
    var $res = 'res'+Math.random().toString(36).substr(2,8)
    var $py = 'def '+$res+'('+args+'):\n'
    $py += '    return '+body
    var $js = __BRYTHON__.py2js($py,'lambda').to_js()
    eval($js)
    return eval($res)    
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

// generic class for modules
function $module(){}
$module.__class__ = $type
$module.__str__ = function(){return "<class 'module'>"}

// generic attribute getter
function $getattr(obj,attr){ 
    if(obj[attr]!==undefined){
        var res = obj[attr]
        if(typeof res==="function"){
            res = $bind(res, obj) // see below
        }
        return $JS2Py(res)
    }    
}

// this trick is necessary to set "this" to the instance inside functions
// found at http://yehudakatz.com/2011/08/11/understanding-javascript-function-invocation-and-this/
function $bind(func, thisValue) {
    return function() {return func.apply(thisValue, arguments)}
}

// exceptions
function $raise(){
    // used for "raise" without specifying an exception
    // if there is an exception in the stack, use it, else throw a simple Exception
    if(__BRYTHON__.exception_stack.length>0){throw $last(__BRYTHON__.exception_stack)}
    else{throw Error('Exception')}
}

function $src_error(name,module,msg,pos) {
    // map position to line number
    var pos2line = {}
    var lnum=1
    var src = document.$py_src[module]
    var line_pos = {1:0}
    for(i=0;i<src.length;i++){
        pos2line[i]=lnum
        if(src.charAt(i)=='\n'){lnum+=1;line_pos[lnum]=i}
    }
    var line_num = pos2line[pos]
    var lines = src.split('\n')
    info = "\nmodule '"+module+"' line "+line_num
    info += '\n'+lines[line_num-1]+'\n'
    var lpos = pos-line_pos[line_num]
    for(var i=0;i<lpos;i++){info+=' '}
    info += '^\n'
    err = new Error()
    err.name = name
    err.__name__ = name
    err.message = msg
    err.info = info
    err.py_error = true
    throw err
}

function $SyntaxError(module,msg,pos) {
    $src_error('SyntaxError',module,msg,pos)
}

function $IndentationError(module,msg,pos) {
    $src_error('IndentationError',module,msg,pos)
}

// resolve instance attribute from its class factory
function $resolve_attr(obj,factory,attr){
    if(attr==='__class__'){return obj.__class__}
    if(obj[attr]!==undefined){
        if(typeof obj[attr]==='function'){
            var res = function(){return obj[attr].apply(obj,arguments)}
            res.__str__ = function(){
                return "<bound method '"+attr+"' of "+obj.__class__.__name__+" object>"
            }
            return res
        }else{return obj[attr]}
    }
    if(factory[attr]!==undefined){
        var res = factory[attr]
        if(typeof res==='function'){
            res = (function(func){
                return function(){
                    var args = [obj]
                    for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
                    return func.apply(obj,args)
                }
            })(res)
            res.__str__ = (function(x){
                return function(){
                    var res = "<bound method "+factory.__name__+'.'+x
                    res += ' of '+obj.__str__()+'>'
                    return res
                }
            })(attr)
        }
        return res
    }else{ // inheritance
        for(var i=0;i<factory.parents.length;i++){
            try{
                return $resolve_attr(obj,factory.parents[i],attr)
            }catch(err){
                void(0)
            }
        }
        throw AttributeError("'"+factory.__name__+"' object has no attribute '"+attr+"'")
    }
}

// generic code for class constructor
function $class_constructor(class_name,factory,parents){
    // function can have additional arguments : the parent classes
    var parent_classes = []
    if(parents!==undefined){
        if(isinstance(parents,tuple)){
            for(var i=0;i<parents.length;i++){
                if(parents[i]!==object){ // don't heritate from "object"
                    parent_classes.push(parents[i])
                }
            }
        }else if(parents!==object){parent_classes=[parents]}
    }
    factory.parents = parent_classes
    factory.__name__ = class_name
    var f = function(){
        
        var obj = new Object()
        var initialized = false
        if(factory.parents.length){
            eval('var obj = '+factory.parents[0].__name__+'.apply(null,arguments)')
            initialized = true
        }
        obj.__class__ = f
        // set attributes
        for(var attr in factory){
            if(attr=='__getattr__'){continue}
            if(attr=='__class__'){return f}
            else if(typeof factory[attr]==="function"){
                var func = factory[attr]
                obj[attr] = (function(func){
                    return function(){
                        var args = [obj]
                        for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
                        return func.apply(obj,args)
                    }
                })(func)
                obj[attr].__str__ = (function(x){
                    return function(){
                        var res = "<bound method "+class_name+'.'+x
                        res += ' of '+obj.__str__()+'>'
                        return res
                    }
                })(attr)
            }else{obj[attr] = factory[attr]}
        }
        obj.__getattr__ = function(attr){
            return $resolve_attr(obj,factory,attr)
        }
        obj.__setattr__ = function(attr,value){
            obj[attr]=value
        }
        try{$resolve_attr(obj,factory,'__str__')}
        catch(err){
            obj.__str__ = function(){return "<"+class_name+" object>"}
            obj.__str__.__name__ = "<bound method __str__ of "+class_name+" object>"
        }
        obj.toString = obj.__str__
        if(!initialized){
            try{
                var init_func = $resolve_attr(obj,factory,'__init__')
                var args = [obj]
                for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
                init_func.apply(null,arguments)
            }catch(err){void(0)}
        }
        return obj
    }
    f.__str__ = function(){return "<class '"+class_name+"'>"}
    for(var attr in factory){
        f[attr]=factory[attr]
        f[attr].__str__ = (function(x){
            return function(){return "<function "+class_name+'.'+x+'>'}
            })(attr)
    }
    f.__getattr__ = function(attr){
        if(f[attr]!==undefined){return f[attr]}
        return factory[attr]
    }
    f.__setattr__ = function(attr,value){factory[attr]=value}
    return f
}

// escaping double quotes
var $dq_regexp = new RegExp('"',"g") // to escape double quotes in arguments
function $escape_dq(arg){return arg.replace($dq_regexp,'\\"')}

// default standard output and error
// can be reset by sys.stdout or sys.stderr
document.$stderr = {'write':function(data){void(0)}}
document.$stderr_buff = '' // buffer for standard output

document.$stdout = {
    __getattr__:function(attr){return this[attr]},
    write: function(data){console.log(data)}
}

// used for class of classes
function $type(){}
$type.__class__ = $type
$type.__name__ = 'type'
$type.__str__ = function(){return "<class 'type'>"}
$type.toString = $type.__str__

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
Function.prototype.__str__ = function(){return "<function "+this.__name__+">"}

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
