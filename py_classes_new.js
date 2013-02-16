// built-in functions
function abs(obj){
    if(isinstance(obj,int)){return int(Math.abs(obj))}
    else if(isinstance(obj,float)){return float(Math.abs(obj.value))}
    else{$raise('TypeError',"Bad operand type for abs(): '"+str(obj.__class__)+"'")}
}

function $alert(src){alert(str(src))}

function all(iterable){
    while(true){
        try{
            var elt = next(iterable)
            if(!bool(elt)){return False}
        }catch(err){return True}
    }
}

function any(iterable){
    while(true){
        try{
            var elt = next(iterable)
            if(bool(elt)){return True}
        }catch(err){return False}
    }
}

// not in Python but used for tests until unittest works
// "assert_raises(exception,function,*args)" becomes "if condition: pass else: raise AssertionError"
function assert_raises(){
    var $ns=$MakeArgs('assert_raises',arguments,['exc','func'],{},'args','kw')
    var args = $ns['args']
    try{$ns['func'].apply(this,args)}
    catch(err){
        if(err.name!==$ns['exc']){
            $raise('AssertionError',
                "exception raised '"+err.name+"', expected '"+$ns['exc']+"'")
        }
        return
    }
    $raise('AssertionError',"no exception raised, expected '"+$ns['exc']+"'")
}

function bool(obj){ // return true or false
    if(obj===null){return False}
    else if(isinstance(obj,dict)){return obj.keys.length>0}
    else if(isinstance(obj,tuple)){return obj.items.length>0}
    else if(typeof obj==="boolean"){return obj}
    else if(typeof obj==="number" || typeof obj==="string"){
        if(obj){return true}else{return false}
    }else if('__bool__' in obj){return obj.__bool__()}
    else if('__len__' in obj){return obj.__len__()>0}
    return true
}
bool.__class__ = $type
bool.__name__ = 'bool'
bool.__str__ = function(){return "<class 'bool'>"}
bool.toString = bool.__str__

function $class(obj,info){
    this.obj = obj
    this.info = info
    this.__class__ = Object
    this.toString = function(){return "<class '"+info+"'>"}
}

function $confirm(src){return confirm(src)}

// dictionary
function dict(){
    if(arguments.length==0){return new $DictClass([],[])}
    var iterable = arguments[0]
    var obj = new $DictClass([],[])
    for(var i=0;i<iterable.__len__();i++){
        var elt = iterable.__item__(i)
        obj.__setitem__(elt.__item__(0),elt.__item__(1))
    }
    return obj
}
dict.__class__ = $type
dict.__name__ = 'dict'
dict.toString = function(){return "<class 'dict'>"}

function $DictClass($keys,$values){
    // JS dict objects are indexed by strings, not by arbitrary objects
    // so we must use 2 arrays, one for keys and one for values
    var x = null;
    var i = null;
    this.iter = null
    this.__class__ = dict
    this.$keys = $keys // JS Array
    this.$values = $values // idem
}

$DictClass.prototype.toString = function(){
    if(this.$keys.length==0){return '{}'}
    var res = "{",key=null,value=null,i=null        
    var qesc = new RegExp('"',"g") // to escape double quotes in arguments
    for(var i=0;i<this.$keys.length;i++){
        if(typeof this.$keys[i]==="string"){key='"'+$escape_dq(this.$keys[i])+'"'}
        else{key = str(this.$keys[i])}
        if(typeof this.$values[i]==="string"){value='"'+$escape_dq(this.$values[i])+'"'}
        else{value = str(this.$values[i])}
        res += key+':'+value+','
    }
    return res.substr(0,res.length-1)+'}'
}

$DictClass.prototype.__add__ = function(other){
    var msg = "unsupported operand types for +:'dict' and "
    $raise('TypeError',msg+"'"+(str(other.__class__) || typeof other)+"'")
}

$DictClass.prototype.__class__ = dict

$DictClass.prototype.__contains__ = function(item){
    return this.$keys.__contains__(item)
}

$DictClass.prototype.__delitem__ = function(arg){
    // search if arg is in the keys
    for(var i=0;i<this.$keys.length;i++){
        if(arg.__eq__(this.$keys[i])){
            this.$keys.splice(i,1)
            this.$values.splice(i,1)
            return
        }
    }
    $raise('KeyError',str(arg))
}

$DictClass.prototype.__eq__ = function(other){
    if(!isinstance(other,dict)){return False}
    if(other.$keys.length!==this.$keys.length){return False}
    for(var i=0;i<this.$keys.length;i++){
        var key = this.$keys[i]
        for(j=0;j<other.$keys.length;j++){
            try{
                if(other.$keys[j].__eq__(key)){
                    if(!other.$values[j].__eq__(this.$values[i])){
                        return False
                    }
                }
            }catch(err){void(0)}
        }
    }
    return True
}

$DictClass.prototype.__getattr__ = function(attr){
    return $getattr(this,attr)
}

$DictClass.prototype.__getitem__ = function(arg){
    // search if arg is in the keys
    for(var i=0;i<this.$keys.length;i++){
        if(arg.__eq__(this.$keys[i])){return this.$values[i]}
    }
    $raise('KeyError',str(arg))
}

$DictClass.prototype.__in__ = function(item){return item.__contains__(this)}

$DictClass.prototype.__item__ = function(i){return this.$keys[i]}

$DictClass.prototype.__len__ = function() {return this.$keys.length}

$DictClass.prototype.__ne__ = function(other){return !this.__eq__(other)}

$DictClass.prototype.__next__ = function(){
    if(this.iter==null){this.iter==0}
    if(this.iter<this.$keys.length){
        this.iter++
        return this.$keys[this.iter-1]
    } else {
        this.iter = null
        $raise('StopIteration')
    }
}

$DictClass.prototype.__not_in__ = function(item){return !(item.__contains__(this))}

$DictClass.prototype.__setitem__ = function(key,value){
    for(var i=0;i<this.$keys.length;i++){
        try{
            if(key.__eq__(this.$keys[i])){ // reset value
                this.$values[i]=value
                return
            }
        }catch(err){ // if __eq__ throws an exception
            void(0)
        }
    }
    // create a new key/value
    this.$keys.push(key)
    this.$values.push(value)
}

$DictClass.prototype.items = function(){
    return new $iterator(zip(this.$keys,this.$values),"dict_items")
}

$DictClass.prototype.keys = function(){
    return new $iterator(this.$keys,"dict keys")
}

$DictClass.prototype.values = function(){
    return new $iterator(this.$values,"dict values")
}

function dir(obj){
    var res = []
    for(var attr in obj){res.push(attr)}
    res.sort()
    return res
}

function enumerate(iterator){
    var res = []
    for(var i=0;i<iterator.__len__();i++){
        res.push([i,iterator.__item__(i)])
    }
    return res
}

function $eval(src){
    if(src===""){$raise('SyntaxError',"unexpected EOF while parsing")}
    try{return eval($py2js(src).to_js())}
    catch(err){
        if(err.py_error===undefined){$raise('ExecutionError',err.message)}
        if(document.$stderr){document.$stderr.write(document.$stderr_buff+'\n')}
        else{throw(err)}
    }
}         

function exec(src){
    try{eval($py2js(src).to_js())}
    catch(err){
        if(err.py_error===undefined){$raise('ExecutionError',err.message)}
        //else if(document.$stderr){document.$stderr.write(document.$stderr_buff)}
        throw err
    }
}         

function filter(){
    if(arguments.length!=2){$raise('TypeError',
            "filter expected 2 arguments, got "+arguments.length)}
    var func=arguments[0],iterable=arguments[1]
    var res=[]
    for(var i=0;i<iterable.__len__();i++){
        if(func(iterable.__item__(i))){
            res.push(iterable.__item__(i))
        }
    }
    return res
}

function float(value){
    if(typeof value=="number" || (
        typeof value=="string" && !isNaN(value))){
        return new $FloatClass(parseFloat(value))
    }else if(isinstance(value,float)){return value}
    else{$raise('ValueError',"Could not convert to float(): '"+str(value)+"'")}
}
float.__class__ = $type
float.__name__ = 'float'
float.toString = function(){return "<class 'float'>"}

function $FloatClass(value){
    this.value = value
    this.__class__ = float
}

$FloatClass.prototype.toString = function(){
    var res = this.value+'' // coerce to string
    if(res.indexOf('.')==-1){res+='.0'}
    return str(res)
}

$FloatClass.prototype.__class__ = float

$FloatClass.prototype.__bool__ = function(){return bool(this.value)}
    
$FloatClass.prototype.__floordiv__ = function(other){
    if(isinstance(other,int)){
        if(other===0){$raise('ZeroDivisionError','division by zero')}
        else{return float(Math.floor(this.value/other))}
    }else if(isinstance(other,float)){
        if(!other.value){$raise('ZeroDivisionError','division by zero')}
        else{return float(Math.floor(this.value/other.value))}
    }else{$raise('TypeError',
        "unsupported operand type(s) for //: 'int' and '"+other.__class__+"'")
    }
}

$FloatClass.prototype.__in__ = function(item){return item.__contains__(this)}

$FloatClass.prototype.__not_in__ = function(item){return !(item.__contains__(this))}

$FloatClass.prototype.__truediv__ = function(other){
    if(isinstance(other,int)){
        if(other===0){$raise('ZeroDivisionError','division by zero')}
        else{return float(this.value/other)}
    }else if(isinstance(other,float)){
        if(!other.value){$raise('ZeroDivisionError','division by zero')}
        else{return float(this.value/other.value)}
    }else{$raise('TypeError',
        "unsupported operand type(s) for //: 'int' and '"+other.__class__+"'")
    }
}

// operations
var $op_func = function(other){
    if(isinstance(other,int)){return float(this.value-other)}
    else if(isinstance(other,float)){return float(this.value-other.value)}
    else{$raise('TypeError',
        "unsupported operand type(s) for -: "+this.value+" (float) and '"+other.__class__+"'")
    }
}
$op_func += '' // source code
var $ops = {'+':'add','-':'sub','*':'mul','%':'mod'}
for($op in $ops){
    eval('$FloatClass.prototype.__'+$ops[$op]+'__ = '+$op_func.replace(/-/gm,$op))
}

// comparison methods
var $comp_func = function(other){
    if(isinstance(other,int)){return this.value > other.valueOf()}
    else if(isinstance(other,float)){return this.value > other.value}
    else{$raise('TypeError',
        "unorderable types: "+this.__class__+'() > '+other.__class__+"()")
    }
}
$comp_func += '' // source code
var $comps = {'>':'gt','>=':'ge','<':'lt','<=':'le','==':'eq','!=':'ne'}
for($op in $comps){
    eval("$FloatClass.prototype.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
}

// unsupported operations
var $notimplemented = function(other){
    $raise('TypeError',
        "unsupported operand types for OPERATOR: '"+this.__class__+"' and '"+other.__class__+"'")
}
$notimplemented += '' // coerce to string
for($op in $operators){
    var $opfunc = '__'+$operators[$op]+'__'
    if(!($opfunc in $FloatClass.prototype)){
        eval('$FloatClass.prototype.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
    }
}

function getattr(obj,attr,_default){
    if(obj.__getattr__!==undefined &&
        obj.__getattr__(attr)!==undefined){
            return obj.__getattr__(attr)
    }
    else if(_default !==undefined){return _default}
    else{$raise('AttributeError',
        "'"+str(obj.__class__)+"' object has no attribute '"+attr+"'")}
}

function hasattr(obj,attr){
    try{getattr(obj,attr);return True}
    catch(err){return False}
}


//not a direct alias of prompt: input has no default value
function input(src){
    return prompt(src)
}

function int(value){
    if(isinstance(value,int)){return value}
    else if(value===True){return 1}
    else if(value===False){return 0}
    else if(typeof value=="number" ||
        (typeof value=="string" && parseInt(value)!=NaN)){
        return parseInt(value)
    }else if(isinstance(value,float)){
        return parseInt(value.value)
    }else{ $raise('ValueError',
        "Invalid literal for int() with base 10: '"+str(value)+"'"+value.__class__)
    }
}
int.__class__ = $type
int.__name__ = 'int'
int.toString = function(){return "<class 'int'>"}

Number.prototype.__class__ = int

Number.prototype.__floordiv__ = function(other){
    if(isinstance(other,int)){
        if(other==0){$raise('ZeroDivisionError','division by zero')}
        else{return Math.floor(this/other)}
    }else if(isinstance(other,float)){
        if(!other.value){$raise('ZeroDivisionError','division by zero')}
        else{return float(Math.floor(this/other.value))}
    }else{$UnsupportedOpType("//","int",other.__class__)}
}

Number.prototype.__getattr__ = function(attr){$raise('AttributeError',
    "'int' object has no attribute '"+attr+"'")}

Number.prototype.__in__ = function(item){return item.__contains__(this)}

Number.prototype.__int__ = function(){return this}

Number.prototype.__mul__ = function(other){
    var val = this.valueOf()
    if(isinstance(other,int)){return this*other}
    else if(isinstance(other,float)){return float(this*other.value)}
    else if(typeof other==="string") {
        var res = ''
        for(var i=0;i<val;i++){res+=other}
        return res
    }else if(isinstance(other,list)){
        var res = []
        // make temporary copy of list
        var $temp = other.slice(0,other.length)
        for(var i=0;i<val-1;i++){res=res.concat($temp)}
        return res
    }else{$UnsupportedOpType("*",int,other)}
}

Number.prototype.__not_in__ = function(item){
    res = item.__contains__(this)
    return !res
}

Number.prototype.__pow__ = function(other){
    if(typeof other==="number"){return int(Math.pow(this.valueOf(),other.valueOf()))}
    else{$UnsupportedOpType("//",int,other.__class__)}
}

Number.prototype.__setattr__ = function(attr,value){$raise('AttributeError',
    "'int' object has no attribute "+attr+"'")}

Number.prototype.__str__ = function(){return this.toString()}

Number.prototype.__truediv__ = function(other){
    if(isinstance(other,int)){
        if(other==0){$raise('ZeroDivisionError','division by zero')}
        else{return float(this/other)}
    }else if(isinstance(other,float)){
        if(!other.value){$raise('ZeroDivisionError','division by zero')}
        else{return float(this/other.value)}
    }else{$UnsupportedOpType("//","int",other.__class__)}
}

// operations
var $op_func = function(other){
    if(isinstance(other,int)){
        var res = this.valueOf()-other.valueOf()
        if(isinstance(res,int)){return res}
        else{return float(res)}
    }
    else if(isinstance(other,float)){return float(this.valueOf()-other.value)}
    else{$raise('TypeError',
        "unsupported operand type(s) for -: "+this.value+" (float) and '"+str(other.__class__)+"'")
    }
}
$op_func += '' // source code
var $ops = {'+':'add','-':'sub','%':'mod'}
for($op in $ops){
    eval('Number.prototype.__'+$ops[$op]+'__ = '+$op_func.replace(/-/gm,$op))
}

// comparison methods
var $comp_func = function(other){
    if(isinstance(other,int)){return this.valueOf() > other.valueOf()}
    else if(isinstance(other,float)){return this.valueOf() > other.value}
    else{$raise('TypeError',
        "unorderable types: "+str(this.__class__)+'() > '+str(other.__class__)+"()")}
}
$comp_func += '' // source code
var $comps = {'>':'gt','>=':'ge','<':'lt','<=':'le','==':'eq','!=':'ne'}
for($op in $comps){
    eval("Number.prototype.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
}

// unsupported operations
var $notimplemented = function(other){
    $raise('TypeError',
        "unsupported operand types for OPERATOR: '"+str(this.__class__)+"' and '"+str(other.__class__)+"'")
}
$notimplemented += '' // coerce to string
for($op in $operators){
    var $opfunc = '__'+$operators[$op]+'__'
    if(!($opfunc in Number.prototype)){
        eval('Number.prototype.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
    }
}

function isinstance(obj,arg){
    if(obj===null){return arg===None}
    if(obj===undefined){return false}
    if(arg.constructor===Array){
        for(var i=0;i<arg.length;i++){
            if(isinstance(obj,arg[i])){return true}
        }
        return false
    }else{
        if(arg===int){
            return ((typeof obj)=="number"||obj.constructor===Number)&&(obj.valueOf()%1===0)
        }
        if(arg===float){
            return ((typeof obj=="number")&&(obj.valueOf()%1!==0))||
                (obj.__class__===float)}
        if(arg===str){return (typeof obj=="string")}
        if(arg===list){return (obj.constructor===Array)}
        if(obj.__class__!==undefined){return obj.__class__===arg}
        return obj.constructor===arg
    }
}

function iter(obj){
    if('__item__' in obj){
        obj.__counter__= 0 // reset iteration counter
        return obj
    }
    $raise('TypeError',"'"+str(obj.__class__)+"' object is not iterable")
}

function $iterator(obj,info){
    this.__getattr__ = function(attr){
        var res = this[attr]
        if(res===undefined){$raise('AttributeError',
            "'"+info+"' object has no attribute '"+attr+"'")}
        else{return res}
    }
    this.__len__ = function(){return obj.__len__()}
    this.__item__ = function(i){return obj.__item__(i)}
    this.__class__ = new $class(this,info)
    this.toString = function(){return info+'('+obj.toString()+')'}
}

function len(obj){
    try{return obj.__len__()}
    catch(err){$raise('TypeError',"object of type "+obj.__class__+" has no len()")}
}

function map(){
    var func = arguments[0],res=[],rank=0
    while(true){
        var args = [],flag=true
        for(var i=1;i<arguments.length;i++){
            var x = arguments[i].__item__(rank)
            if(x===undefined){flag=false;break}
            args.push(x)
        }
        if(!flag){break}
        res.push(func.apply(null,args))
        rank++
    }
    return res
}

function $extreme(args,op){ // used by min() and max()
    if(op==='__gt__'){var $op_name = "max"}
    else{var $op_name = "min"}
    if(args.length==0){$raise('TypeError',$op_name+" expected 1 argument, got 0")}
    var last_arg = args[args.length-1]
    var last_i = args.length-1
    var has_key = false
    if(isinstance(last_arg,$Kw)){
        if(last_arg.name === 'key'){
            var func = last_arg.value
            has_key = true
            last_i--
        }else{$raise('TypeError',$op_name+"() got an unexpected keyword argument")}
    }else{var func = function(x){return x}}
    if((has_key && args.length==2)||(!has_key && args.length==1)){
        var arg = args[0]
        var $iter = iter(arg)
        var res = null
        while(true){
            try{
                var x = next($iter)
                if(res===null || bool(func(x)[op](func(res)))){res = x}
            }catch(err){
                if(err.name=="StopIteration"){return res}
                throw err
            }
        }
    } else {
        var res = null
        for(var i=0;i<=last_i;i++){
            var x = args[i]
            if(res===null || bool(func(x)[op](func(res)))){res = x}
        }
        return res
    }
}

function max(){
    var args = []
    for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
    return $extreme(args,'__gt__')
}

function min(){
    var args = []
    for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
    return $extreme(args,'__lt__')
}

function next(obj){
    if('__item__' in obj){
        if(obj.__counter__===undefined){obj.__counter__=0}
        var res = obj.__item__(obj.__counter__)
        if(res!==undefined){obj.__counter__++;return res}
        $raise('StopIteration')
    }
    $raise('TypeError',"'"+str(obj.__class__)+"' object is not iterable")
}

function $not(obj){return !bool(obj)}

function $ObjectClass(){
    this.__class__ = "<class 'object'>"
}
$ObjectClass.prototype.__getattr__ = function(attr){
    if(attr in this){return this[attr]}
    else{$raise('AttributeError',"object has no attribute '"+attr+"'")}
}
$ObjectClass.prototype.__delattr__ = function(attr){delete this[attr]}
$ObjectClass.prototype.__setattr__ = function(attr,value){this[attr]=value}

function object(){
    return new $ObjectClass()
}
object.__class__ = $type
object.__name__ = 'object'
object.__str__ = "<class 'object'>"

function $print(){
    var $ns=$MakeArgs('print',arguments,[],{},'args','kw')
    var args = $ns['args']
    var kw = $ns['kw']
    var end = '\n'
    var res = ''
    if(kw.__contains__('end')){end=kw.__getitem__('end')}
    for(var i=0;i<args.length;i++){
        res += str(args[i])
        if(i<args.length-1){res += ' '}
    }
    res += end
    document.$stdout.write(res)
}

log = $print // compatibility with previous versions

function $prompt(text,fill){return prompt(text,fill || '')}

// range
function range(){
    var $ns=$MakeArgs('range',arguments,[],{},'args',null)
    var args = $ns['args']
    if(args.length>3){$raise('TypeError',
        "range expected at most 3 arguments, got "+args.length)
    }
    var start=0
    var stop=0
    var step=1
    if(args.length==1){stop = args[0]}
    else if(args.length>=2){
        start = args[0]
        stop = args[1]
    }
    if(args.length>=3){step=args[2]}
    if(step==0){$raise('ValueError',"range() arg 3 must not be zero")}
    var res=[]
    if(step>0){
        for(var i=start;i<stop;i+=step){res.push(i)}
    }else if(step<0){
        for(var i=start;i>stop;i+=step){res.push(i)}
    }
    return res
}

function repr(obj){return obj.toString()}

function reversed(seq){
    // returns an iterator with elements in the reverse order from seq
    // only implemented for strings and lists
    if(isinstance(seq,list)){seq.reverse();return seq}
    else if(isinstance(seq,str)){
        var res=''
        for(var i=seq.length-1;i>=0;i--){res+=seq.charAt(i)}
        return res
    }else{$raise('TypeError',
        "argument to reversed() must be a sequence")}
}

function round(arg,n){
    if(!isinstance(arg,[int,float])){
        $raise('TypeError',"type "+str(arg.__class__)+" doesn't define __round__ method")
    }
    if(n===undefined){n=0}
    if(!isinstance(n,int)){$raise('TypeError',
        "'"+n.__class__+"' object cannot be interpreted as an integer")}
    var mult = Math.pow(10,n)
    return Number(Math.round(arg*mult)).__truediv__(mult)
}

// set
function set(){
    var i=0
    if(arguments.length==0){return new $SetClass()}
    else if(arguments.length==1){    // must be an iterable
        var arg=arguments[0]
        if(isinstance(arg,set)){return arg}
        var obj = new $SetClass()
        try{
            for(var i=0;i<arg.__len__();i++){
                obj.items.push(arg.__getitem__(i))
            }
            return obj
        }catch(err){
            $raise('TypeError',"'"+arg.__class__.__name__+"' object is not iterable")
        }
    } else {
        $raise('TypeError',"set expected at most 1 argument, got "+arguments.length)
    }
}
set.__class__ = $type
set.__name__ = 'set'
set.toString = function(){return "<class 'set'>"}

function $SetClass(){
    var x = null;
    var i = null;
    this.iter = null
    this.__class__ = set
    this.items = [] // JavaScript array
}
    
$SetClass.prototype.toString = function(){
    var res = "{"
    for(var i=0;i<this.items.length;i++){
        var x = this.items[i]
        if(isinstance(x,str)){res += "'"+x+"'"} 
        else{res += x.toString()}
        if(i<this.items.length-1){res += ','}
    }
    return res+'}'
}
    
$SetClass.prototype.__add__ = function(other){
    return set(this.items.concat(other.items))
}

$SetClass.prototype.__class__ = set

$SetClass.prototype.__contains__ = function(item){
    for(var i=0;i<this.items.length;i++){
        try{if(this.items[i].__eq__(item)){return True}
        }catch(err){void(0)}
    }
    return False
}

$SetClass.prototype.__eq__ = function(other){
    if(isinstance(other,set)){
        if(other.items.length==this.items.length){
            for(var i=0;i<this.items.length;i++){
                if(this.__contains__(other.items[i])===False){
                    return False
                }
            }
            return True
        }
    }
    return False
}

$SetClass.prototype.__in__ = function(item){return item.__contains__(this)}

$SetClass.prototype.__len__ = function(){return int(this.items.length)}

$SetClass.prototype.__ne__ = function(other){return !(this.__eq__(other))}

$SetClass.prototype.__item__ = function(i){return this.items[i]}

$SetClass.prototype.__not_in__ = function(item){return !(item.__contains__(this))}

$SetClass.prototype.add = function(item){
    var i=0
    for(i=0;i<this.items.length;i++){
        try{if(item.__eq__(this.items[i])){return}}
        catch(err){void(0)} // if equality test throws exception
    }
    this.items.push(item)
}

function setattr(obj,attr,value){
    if(!isinstance(attr,str)){$raise('TypeError',"setattr(): attribute name must be string")}
    obj[attr]=value
}

// slice
function $SliceClass(start,stop,step){
    this.__class__ = slice
    this.start = start
    this.stop = stop
    this.step = step
}
function slice(){
    var $ns=$MakeArgs('slice',arguments,[],{},'args',null)
    var args = $ns['args']
    if(args.length>3){$raise('TypeError',
        "slice expected at most 3 arguments, got "+args.length)
    }
    var start=0
    var stop=0
    var step=1
    if(args.length==1){stop = args[0]}
    else if(args.length>=2){
        start = args[0]
        stop = args[1]
    }
    if(args.length>=3){step=args[2]}
    if(step==0){$raise('ValueError',"slice step must not be zero")}
    return new $SliceClass(start,stop,step)
}

function sum(iterable,start){
    if(start===undefined){start=0}
    var res = 0
    for(var i=start;i<iterable.__len__();i++){        
        res = res.__add__(iterable.__item__(i))
    }
    return res
}

function $tuple(arg){return arg} // used for parenthesed expressions

function tuple(){
    var args = new Array(),i=0
    for(i=0;i<arguments.length;i++){args.push(arguments[i])}
    var obj = list(args)
    obj.__class__ = tuple
    obj.toString = function(){
        var res = args.toString()
        return '('+res.substr(1,res.length-2)+')'
    }
    return obj
}
tuple.__class__ = $type
tuple.__name__ = 'tuple'
tuple.__str__ = function(){return "<class 'tuple'>"}
tuple.toString = tuple.__str__

function zip(){
    var $ns=$MakeArgs('zip',arguments,[],{},'args','kw')
    var args = $ns['args']
    var kw = $ns['kw']
    console.log('zip args '+args)
    var rank=0,res=[]
    while(true){
        var line=[],flag=true
        for(var i=0;i<args.length;i++){
            var x=args[i].__item__(rank)
            if(x===undefined){flag=false;break}
            line.push(x)
        }
        if(!flag){return res}
        res.push(line)
        rank++
    }
}

// built-in constants : True, False, None

True = true
False = false

Boolean.prototype.__class__ = bool
Boolean.prototype.__eq__ = function(other){
    if(this.valueOf()){return !!other}else{return !other}
}

Boolean.prototype.toString = function(){
    if(this.valueOf()){return "True"}else{return "False"}
}

function $NoneClass(){
    this.__class__ = new $class(this,"NoneType")
    this.value = null
    this.__bool__ = function(){return False}
    this.__eq__ = function(other){return other===None}
    this.__str__ = function(){return 'None'}
}
None = new $NoneClass()
