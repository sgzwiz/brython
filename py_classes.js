// built-in functions
function abs(obj){
    if(isinstance(obj,int)){return int(Math.abs(obj))}
    else if(isinstance(obj,float)){return float(Math.abs(obj.value))}
    else{throw TypeError("Bad operand type for abs(): '"+str(obj.__class__)+"'")}
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
    if(iterable.__item__===undefined){
        throw TypeError("'"+iterable.__class__.__name__+"' object is not iterable")
    }
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
            throw AssertionError(
                "exception raised '"+err.name+"', expected '"+$ns['exc']+"'")
        }
        return
    }
    throw AssertionError("no exception raised, expected '"+$ns['exc']+"'")
}

function bool(obj){ // return true or false
    if(obj===null){return False}
    else if(obj===undefined){return False}
    else if(isinstance(obj,dict)){return obj.keys.length>0}
    else if(isinstance(obj,tuple)){return obj.length>0}
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
bool.__hash__ = function() {
    if(this.valueOf()) return 1
    return 0
}

function $class(obj,info){
    this.obj = obj
    this.info = info
    this.__class__ = Object
    this.toString = function(){return "<class '"+info+"'>"}
}

function $confirm(src){return confirm(src)}

// dictionary

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

function dict(){
    if(arguments.length==0){return new $DictClass([],[])}
    else if(arguments.length===1 && isinstance(arguments[0],dict)){
        return arguments[0]
    }
    var $ns=$MakeArgs('dict',arguments,[],{},'args','kw')
    var args = $ns['args']
    var kw = $ns['kw']
    if(args.length>0){ // format dict([(k1,v1),(k2,v2)...])
        var iterable = args[0]
        var obj = new $DictClass([],[])
        for(var i=0;i<iterable.__len__();i++){
            var elt = iterable.__item__(i)
            obj.__setitem__(elt.__item__(0),elt.__item__(1))
        }
        return obj
    }else if(kw.$keys.length>0){ // format dict(k1=v1,k2=v2...)
        return kw
    }
}

dict.__name__ = 'dict'
dict.toString = function(){return "<class 'dict'>"}


dict.__add__ = function(self,other){
    var msg = "unsupported operand types for +:'dict' and "
    throw TypeError(msg+"'"+(str(other.__class__) || typeof other)+"'")
}

dict.__class__ = $type

dict.__contains__ = function(self,item){
    return self.$keys.__contains__(item)
}

dict.__delitem__ = function(self,arg){
    // search if arg is in the keys
    for(var i=0;i<self.$keys.length;i++){
        if(arg.__eq__(self.$keys[i])){
            self.$keys.splice(i,1)
            self.$values.splice(i,1)
            return
        }
    }
    throw KeyError(str(arg))
}

dict.__eq__ = function(self,other){
    if(other===undefined){ // compare self to class "dict"
        return self===dict
    }
    if(!isinstance(other,dict)){return False}
    if(other.$keys.length!==self.$keys.length){return False}
    for(var i=0;i<self.$keys.length;i++){
        var key = self.$keys[i]
        for(j=0;j<other.$keys.length;j++){
            try{
                if(other.$keys[j].__eq__(key)){
                    if(!other.$values[j].__eq__(self.$values[i])){
                        return False
                    }
                }
            }catch(err){void(0)}
        }
    }
    return True
}

dict.__getattr__ = function(attr){
    if(this[attr]!==undefined){return this[attr]}
    else{throw AttributeError("'dict' object has no attribute '"+attr+"'")}
}

dict.__getitem__ = function(self,arg){
    // search if arg is in the keys
    for(var i=0;i<self.$keys.length;i++){
        if(arg.__eq__(self.$keys[i])){return self.$values[i]}
    }
    throw KeyError(str(arg))
}

dict.__hash__ = function(self) {throw TypeError("unhashable type: 'dict'");}

dict.__in__ = function(self,item){return item.__contains__(self)}

dict.__item__ = function(self,i){return self.$keys[i]}

dict.__len__ = function(self) {return self.$keys.length}

dict.__ne__ = function(self,other){return !dict.__eq__(self,other)}

dict.__next__ = function(self){
    if(self.iter==null){self.iter==0}
    if(self.iter<self.$keys.length){
        self.iter++
        return self.$keys[self.iter-1]
    } else {
        self.iter = null
        throw StopIteration()
    }
}

dict.__not_in__ = function(self,item){return !(item.__contains__(self))}

dict.__setitem__ = function(self,key,value){
    for(var i=0;i<self.$keys.length;i++){
        try{
            if(key.__eq__(self.$keys[i])){ // reset value
                self.$values[i]=value
                return
            }
        }catch(err){ // if __eq__ throws an exception
            void(0)
        }
    }
    // create a new key/value
    self.$keys.push(key)
    self.$values.push(value)
}

dict.__str__ = function(self){
    if(self===undefined){return "<class 'dict'>"}
    if(self.$keys.length==0){return '{}'}
    var res = "{",key=null,value=null,i=null        
    var qesc = new RegExp('"',"g") // to escape double quotes in arguments
    for(var i=0;i<self.$keys.length;i++){
        if(typeof self.$keys[i]==="string"){key='"'+$escape_dq(self.$keys[i])+'"'}
        else{key = str(self.$keys[i])}
        if(typeof self.$values[i]==="string"){value='"'+$escape_dq(self.$values[i])+'"'}
        else{value = str(self.$values[i])}
        res += key+':'+value+','
    }
    return res.substr(0,res.length-1)+'}'
}

dict.items = function(self){
    return new $iterator(zip(self.$keys,self.$values),"dict_items")
}

dict.keys = function(self){
    return new $iterator(self.$keys,"dict keys")
}

dict.values = function(self){
    return new $iterator(self.$values,"dict values")
}

$DictClass.prototype.__class__ = dict

$DictClass.prototype.__getattr__ = function(attr){
    if(attr==='__class__'){return this.__class__}
    var obj = this
    var res = function(){
        var args = [obj]
        for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
        return dict[attr].apply(obj,args)
    }
    res.__str__ = function(){return "<built-in method "+attr+" of dict object>"}
    return res
}

// set other $DictClass.prototype attributes
for(var attr in dict){
    if($DictClass.prototype[attr]===undefined){
        $DictClass.prototype[attr]=(function(attr){
            return function(){
                var args = [this]
                for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
                return dict[attr].apply(this,args)
            }
        })(attr)
    }
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
    if(src===""){throw SyntaxError("unexpected EOF while parsing")}
    try{return eval(__BRYTHON__.py2js(src).to_js())}
    catch(err){
        if(err.py_error===undefined){throw RuntimeError(err.message)}
        if(document.$stderr){document.$stderr.__getattr__('write')(document.$stderr_buff+'\n')}
        else{throw(err)}
    }
}         

function exec(src){
    try{eval(__BRYTHON__.py2js(src).to_js())}
    catch(err){
        if(err.py_error===undefined){console.log(err);err = RuntimeError(err+'')}
        var trace = err.__name__+': '+err.message+err.info
        if(document.$stderr){document.$stderr.__getattr__('write')(trace)}
        else{console.log(trace)}
        throw err
    }
}         

function filter(){
    if(arguments.length!=2){throw TypeError(
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
    if(value===undefined){return new $FloatClass(0.0)}
    if(typeof value=="number" || (typeof value=="string" && !isNaN(value))){
        return new $FloatClass(parseFloat(value))
    }
    if(isinstance(value,float)) return value
    if (value == 'inf') return new $FloatClass(Infinity);
    if (value == '-inf') return new $FloatClass(-Infinity);
    if (typeof value == 'string' && value.toLowerCase() == 'nan') return new $FloatClass(Number.NaN)
    
    throw ValueError("Could not convert to float(): '"+str(value)+"'")
}

float.__class__ = $type
float.__name__ = 'float'
float.toString = function(){return "<class 'float'>"}

float.__hash__ = function() {
    // http://cw.tactileint.com/++Floats/Ruby,JavaScript,Ruby
    frexp=function (re) {
       var ex = Math.floor(Math.log(re) / Math.log(2)) + 1;
       var frac = re / Math.pow(2, ex);
       return [frac, ex];
    }

    if (this.value === Infinity || this.value === -Infinity) {
       if (this.value < 0.0) return -271828
       return 314159;
    } else if (isNaN(this.value)) {
       return 0;
    }

    var r=frexp(this.value);
    r[0] *= Math.pow(2,31)
    hipart = int(r[0])
    r[0] = (r[0] - hipart) * Math.pow(2,31)
    var x = hipart + int(r[0]) + (r[1] << 15)
    return x & 0xFFFFFFFF;
}

function $FloatClass(value){
    this.value = value
    this.__class__ = float
    this.__hash__ = float.__hash__
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
        if(other===0){throw ZeroDivisionError('division by zero')}
        else{return float(Math.floor(this.value/other))}
    }else if(isinstance(other,float)){
        if(!other.value){throw ZeroDivisionError('division by zero')}
        else{return float(Math.floor(this.value/other.value))}
    }else{throw TypeError(
        "unsupported operand type(s) for //: 'int' and '"+other.__class__+"'")
    }
}

$FloatClass.prototype.__getattr__ = function(attr){
    if(this[attr]!==undefined){return this[attr]}
    else{throw AttributeError("'float' object has no attribute '"+attr+"'")}
}

$FloatClass.prototype.__hash__=float.__hash__;

$FloatClass.prototype.__in__ = function(item){return item.__contains__(this)}

$FloatClass.prototype.__not_in__ = function(item){return !(item.__contains__(this))}

$FloatClass.prototype.__truediv__ = function(other){
    if(isinstance(other,int)){
        if(other===0){throw ZeroDivisionError('division by zero')}
        else{return float(this.value/other)}
    }else if(isinstance(other,float)){
        if(!other.value){throw ZeroDivisionError('division by zero')}
        else{return float(this.value/other.value)}
    }else{throw TypeError(
        "unsupported operand type(s) for //: 'int' and '"+other.__class__+"'")
    }
}

// operations
var $op_func = function(other){
    if(isinstance(other,int)){return float(this.value-other)}
    else if(isinstance(other,float)){return float(this.value-other.value)}
    else if(isinstance(other,bool)){ 
         var bool_value=0; 
         if (other.valueOf()) bool_value=1;
         return float(this.value-bool_value)}
    else{throw TypeError(
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
    else{throw TypeError(
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
    throw TypeError(
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
    else{throw AttributeError(
        "'"+str(obj.__class__)+"' object has no attribute '"+attr+"'")}
}

function hasattr(obj,attr){
    try{getattr(obj,attr);return True}
    catch(err){return False}
}

function hash(obj){
    if (isinstance(obj, int)) { return obj.valueOf();}
    if (isinstance(obj, bool)) { return int(obj);}
    if (obj.__hashvalue__ !== undefined) { return obj.__hashvalue__;}
    if (obj.__hash__ !== undefined) {
       obj.__hashvalue__=obj.__hash__()
       return obj.__hashvalue__
    } else {
       throw AttributeError(
        "'"+str(obj.__class__)+"' object has no attribute '__hash__'")
    }
}

//not a direct alias of prompt: input has no default value
function input(src){
    return prompt(src)
}

function int(value){
    if(value===undefined){return 0}
    else if(isinstance(value,int)){return value}
    else if(value===True){return 1}
    else if(value===False){return 0}
    else if(typeof value=="number" ||
        (typeof value=="string" && parseInt(value)!=NaN)){
        return parseInt(value)
    }else if(isinstance(value,float)){
        return parseInt(value.value)
    }else{ throw ValueError(
        "Invalid literal for int() with base 10: '"+str(value)+"'"+value.__class__)
    }
}
int.__class__ = $type
int.__name__ = 'int'
int.toString = function(){return "<class 'int'>"}

Number.prototype.__class__ = int

Number.prototype.__floordiv__ = function(other){
    if(isinstance(other,int)){
        if(other==0){throw ZeroDivisionError('division by zero')}
        else{return Math.floor(this/other)}
    }else if(isinstance(other,float)){
        if(!other.value){throw ZeroDivisionError('division by zero')}
        else{return float(Math.floor(this/other.value))}
    }else{$UnsupportedOpType("//","int",other.__class__)}
}

Number.prototype.__getattr__ = function(attr){
    if(this[attr]!==undefined){return this[attr]}
    throw AttributeError("'int' object has no attribute '"+attr+"'")
}

Number.prototype.__hash__ = function(){return this.valueOf()}

Number.prototype.__in__ = function(item){return item.__contains__(this)}

Number.prototype.__int__ = function(){return this}

Number.prototype.__mul__ = function(other){
    var val = this.valueOf()
    if(isinstance(other,int)){return this*other}
    else if(isinstance(other,float)){return float(this*other.value)}
    else if(isinstance(other,bool)){
         var bool_value=0
         if (other.valueOf()) bool_value=1
         return this*bool_value}
    else if(typeof other==="string") {
        var res = ''
        for(var i=0;i<val;i++){res+=other}
        return res
    }else if(isinstance(other,[list,tuple])){
        var res = []
        // make temporary copy of list
        var $temp = other.slice(0,other.length)
        for(var i=0;i<val;i++){res=res.concat($temp)}
        if(isinstance(other,tuple)){res=tuple.apply(this,res)}
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

Number.prototype.__setattr__ = function(attr,value){throw AttributeError(
    "'int' object has no attribute "+attr+"'")}

Number.prototype.__str__ = function(){return this.toString()}

Number.prototype.__truediv__ = function(other){
    if(isinstance(other,int)){
        if(other==0){throw ZeroDivisionError('division by zero')}
        else{return float(this/other)}
    }else if(isinstance(other,float)){
        if(!other.value){throw ZeroDivisionError('division by zero')}
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
    else if(isinstance(other,bool)){
         var bool_value=0;
         if(other.valueOf()) bool_value=1;
         return this.valueOf()-bool_value}
    else{throw TypeError(
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
    else{throw TypeError(
        "unorderable types: "+str(this.__class__)+'() > '+str(other.__class__)+"()")}
}
$comp_func += '' // source code
var $comps = {'>':'gt','>=':'ge','<':'lt','<=':'le','==':'eq','!=':'ne'}
for($op in $comps){
    eval("Number.prototype.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
}

// unsupported operations
var $notimplemented = function(other){
    throw TypeError(
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
    throw TypeError("'"+str(obj.__class__)+"' object is not iterable")
}

function $iterator(obj,info){
    this.__getattr__ = function(attr){
        var res = this[attr]
        if(res===undefined){throw AttributeError(
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
    catch(err){throw TypeError("object of type "+obj.__class__+" has no len()")}
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
    if(args.length==0){throw TypeError($op_name+" expected 1 argument, got 0")}
    var last_arg = args[args.length-1]
    var last_i = args.length-1
    var has_key = false
    if(isinstance(last_arg,$Kw)){
        if(last_arg.name === 'key'){
            var func = last_arg.value
            has_key = true
            last_i--
        }else{throw TypeError($op_name+"() got an unexpected keyword argument")}
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
                if(err.__name__=="StopIteration"){return res}
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
        throw StopIteration('')
    }
    throw TypeError("'"+str(obj.__class__)+"' object is not iterable")
}

function $not(obj){return !bool(obj)}

function $ObjectClass(){
    this.__class__ = "<class 'object'>"
}
$ObjectClass.prototype.__getattr__ = function(attr){
    if(attr in this){return this[attr]}
    else{throw AttributeError("object has no attribute '"+attr+"'")}
}
$ObjectClass.prototype.__delattr__ = function(attr){delete this[attr]}
$ObjectClass.prototype.__setattr__ = function(attr,value){this[attr]=value}

function object(){
    return new $ObjectClass()
}
object.__class__ = $type
object.__name__ = 'object'
object.__str__ = "<class 'object'>"
object.__hash__ = function () { 
    document.$py_next_hash+=1; 
    return document.$py_next_hash;
}

$ObjectClass.prototype.__hash__ = object.__hash__

function $open(){
    // first argument is file : can be a string, or an instance of a DOM File object
    // XXX only DOM File supported at the moment
    // other arguments : 
    // - mode can be 'r' (text, default) or 'rb' (binary)
    // - encoding if mode is 'rb'
    var $ns=$MakeArgs('open',arguments,['file'],{'mode':'r','encoding':'utf-8'},'args','kw')
    for(var attr in $ns){eval('var '+attr+'=$ns["'+attr+'"]')}
    if(args.length>0){var mode=args[0]}
    if(args.length>1){var encoding=args[1]}
    if(isinstance(file,JSObject)){return new $OpenFile(file.js,mode,encoding)}
}

function $print(){
    var $ns=$MakeArgs('print',arguments,[],{},'args','kw')
    var args = $ns['args']
    var kw = $ns['kw']
    var end = '\n'
    var res = ''
    if(kw['end']!==undefined){end=kw['end']}
    for(var i=0;i<args.length;i++){
        res += str(args[i])
        if(i<args.length-1){res += ' '}
    }
    res += end
    document.$stdout.__getattr__('write')(res)
}

// compatibility with previous versions
log = function(arg){console.log(arg)} 

function $prompt(text,fill){return prompt(text,fill || '')}

// range
function range(){
    var $ns=$MakeArgs('range',arguments,[],{},'args',null)
    var args = $ns['args']
    if(args.length>3){throw TypeError(
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
    if(step==0){throw ValueError("range() arg 3 must not be zero")}
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
    }else{throw TypeError(
        "argument to reversed() must be a sequence")}
}

function round(arg,n){
    if(!isinstance(arg,[int,float])){
        throw TypeError("type "+str(arg.__class__)+" doesn't define __round__ method")
    }
    if(n===undefined){n=0}
    if(!isinstance(n,int)){throw TypeError(
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
            throw TypeError("'"+arg.__class__.__name__+"' object is not iterable")
        }
    } else {
        throw TypeError("set expected at most 1 argument, got "+arguments.length)
    }
}
set.__class__ = $type
set.__name__ = 'set'
set.toString = function(){return "<class 'set'>"}

set.__hash__ = function() {throw TypeError("unhashable type: 'set'");}

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

$SetClass.prototype.__getattr__ = function(attr){
    if(this[attr]!==undefined){return this[attr]}
    else{throw AttributeError("'set' object has no attribute '"+attr+"'")}
}

$SetClass.prototype.__hash__ = set.__hash__

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
    if(!isinstance(attr,str)){throw TypeError("setattr(): attribute name must be string")}
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
    if(args.length>3){throw TypeError(
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
    if(step==0){throw ValueError("slice step must not be zero")}
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
        var res = args.__str__()
        res = '('+res.substr(1,res.length-2)
        if(obj.length===1){res+=','}
        return res+')'
    }

    obj.__hash__ = function () {
      // http://nullege.com/codes/show/src%40p%40y%40pypy-HEAD%40pypy%40rlib%40test%40test_objectmodel.py/145/pypy.rlib.objectmodel._hash_float/python
      var x= 0x345678
      for(var i=0; i < args.length; i++) {
         var y=args[i].__hash__();
         x=(1000003 * x) ^ y & 0xFFFFFFFF;
      }
      return x
    }
    obj.__str__ = obj.toString

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

Boolean.prototype.__hash__ = function() {
   if(this.valueOf()) return 1
   return 0
}

Boolean.prototype.__mul__ = function(other){
    if(this.valueOf()) return other;
    return 0;
}

Boolean.prototype.__add__ = function(other){
    if(this.valueOf()) return other + 1;
    return other;
}

Boolean.prototype.toString = function(){
    if(this.valueOf()) return "True"
    return "False"
}

function $NoneClass(){
    this.__class__ = new $class(this,"NoneType")
    this.value = null
    this.__bool__ = function(){return False}
    this.__eq__ = function(other){return other===None}
    this.__hash__ = function(){return 0}
    this.__str__ = function(){return 'None'}
}
None = new $NoneClass()

// built-in exceptions

Exception = function (msg){
    var err = Error()
    err.info = ''

    if(document.$debug && msg.split('\n').length==1){
        var module = document.$line_info[1]
        var line_num = document.$line_info[0]
        var lines = document.$py_src[module].split('\n')
        err.info += "\nmodule '"+module+"' line "+line_num
        err.info += '\n'+lines[line_num-1]
    }

    err.message = msg

    err.args = tuple(msg.split('\n')[0])
    err.__str__ = function(){return msg}
    err.toString = err.__str__
    err.__getattr__ = function(attr){return this[attr]}
    err.__name__ = 'Exception'
    err.__class__ = Exception
    err.py_error = true
    document.$exc_stack.push(err)
    return err
}

Exception.__str__ = function(){return "<class 'Exception'>"}
Exception.__class__ = $type

function $make_exc(name){
    var $exc = (Exception+'').replace(/Exception/g,name)
    eval(name+'='+$exc)
    eval(name+'.__str__ = function(){return "<class '+"'"+name+"'"+'>"}')
    eval(name+'.__class__=$type')
}

var $errors = ['AssertionError','AttributeError','EOFError','FloatingPointError',
    'GeneratorExit','ImportError','IndexError','KeyError','KeyboardInterrupt',
    'NameError','NotImplementedError','OSError','OverflowError','ReferenceError',
    'RuntimeError','StopIteration','SyntaxError','IndentationError','TabError',
    'SystemError','SystemExit','TypeError','UnboundLocalError','ValueError',
    'ZeroDivisionError','IOError']
for(var i=0;i<$errors.length;i++){$make_exc($errors[i])}
