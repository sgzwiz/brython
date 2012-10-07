// exceptions
function $StopIteration(message) {  
    this.name = "StopIteration";  
    this.message = message || "Default Message";  
}
$StopIteration.prototype = new Error()

function AttributeError(msg) {  
    this.name = "AttributeError";  
    var lines = document.$py_src[document.$context].split('\n')
    msg += '\nLine '+document.line_num+'\n'+lines[document.line_num-1]
    this.message = msg;  
}
AttributeError.prototype = new Error()

function ImportError(msg) {  
    this.name = "ImportError";  
    var lines = document.$py_src[document.$context].split('\n')
    msg += '\nLine '+document.line_num+'\n'+lines[document.line_num-1]
    this.message = msg;  
}
ImportError.prototype = new Error()

function IndexError(msg) {  
    this.name = "IndexError";  
    var lines = document.$py_src[document.$context].split('\n')
    msg += '\nLine '+document.line_num+'\n'+lines[document.line_num-1]
    this.message = msg;  
}
IndexError.prototype = new Error()

function KeyError(msg) {  
    this.name = "KeyError";  
    var lines = document.$py_src[document.$context].split('\n')
    msg += '\nLine '+document.line_num+'\n'+lines[document.line_num-1]
    this.message = msg;  
}
KeyError.prototype = new Error()

function NameError(msg) {  
    this.name = "NameError";  
    var lines = document.$py_src[document.$context].split('\n')
    msg += '\nLine '+document.line_num+'\n'+lines[document.line_num-1]
    this.message = msg;  
}
NameError.prototype = new Error()

function SyntaxError(msg) {  
    this.name = "SyntaxError";  
    var lines = document.$py_src[document.$context].split('\n')
    msg += '\nLine '+document.line_num+'\n'+lines[document.line_num-1]
    this.message = msg;  
}
SyntaxError.prototype = new Error()

function TypeError(msg) {  
    this.name = "TypeError";  
    var lines = document.$py_src[document.$context].split('\n')
    msg += '\nLine '+document.line_num+'\n'+lines[document.line_num-1]
    this.message = msg;  
}
TypeError.prototype = new Error()

function ValueError(msg) {  
    this.name = "ValueError";  
    var lines = document.$py_src[document.$context].split('\n')
    msg += '\nLine '+document.line_num+'\n'+lines[document.line_num-1]
    this.message = msg;  
}
ValueError.prototype = new Error()

function $UnsupportedOpType(op,class1,class2){
    throw new TypeError("unsupported operand type(s) for "+op+": '"+$str(class1)+"' and '"+$str(class2)+"'")
}

// built-in functions
function abs(obj){
    if($isinstance(obj,int)){return int(Math.abs(obj.value))}
    else if($isinstance(obj,float)){return float(Math.abs(obj.value))}
    else{throw new TypeError("Bad operand type for abs(): '"+$str(obj.__class__)+"'")}
}

function $alert(src){alert(str(src).value)}

function all(iterable){
    while(true){
        try{
            var elt = next(iterable)
            if(!$bool(elt)){return False}
        }catch(err){return True}
    }
}

function any(iterable){
    while(true){
        try{
            var elt = next(iterable)
            if($bool(elt)){return True}
        }catch(err){return False}
    }
}

function $bool(obj){ // return true or false ; used for if / elif
    if(obj===None||obj==False){return false}
    else if($isinstance(obj,list(int,float))){return obj.value!=0}
    else if($isinstance(obj,str)){return obj.value!=''}
    else if($isinstance(obj,list(list,tuple))){return obj.items.length>0}
    else if($isinstance(obj,dict)){return obj.keys.length>0}
    
    else if('__bool__' in obj){return obj.__bool__()===True}
    else if('__len__' in obj){return obj.__len__().__gt__(int(0))}
    return true
}

function $bool_conv(arg){if(arg){return True}else{return False}}

function bool(obj){return $bool_conv($bool(obj))}

function $confirm(src){return $bool_conv(confirm(src.value))}

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
$DictClass.prototype.__len__ = function() {return int(this.$keys.length)}
$DictClass.prototype.__str__ = function(){
    if(this.$keys.length==0){return str('{}')}
    var res = "{",key=null,value=null,i=null
    for(i=0;i<this.$keys.length;i++){
        key = this.$keys[i]
        value = this.$values[i]
        if($isinstance(key,str)){
            key=key.__repr__().value
        } else {
            key=key.__str__().value
        }
        if($isinstance(value,str)){
            value = value.__repr__().value
        } else {
            value = value.__str__().value
        }
        res += key+':'+value+','
    }
    return str(res.substr(0,res.length-1)+'}')
}

$DictClass.prototype.__add__ = function(other){
    var msg = "unsupported operand types for +:'dict' and "
    throw TypeError(msg+"'"+($str(other.__class__) || typeof other)+"'")
}

$DictClass.prototype.__delitem__ = function(arg){
    // search if arg is in the keys
    for(var i=0;i<this.$keys.length;i++){
        if($bool(arg.__eq__(this.$keys[i]))){
            this.$keys.splice(i,1)
            this.$values.splice(i,1)
            return
        }
    }
    console.log($str(arg))
    throw new KeyError($str(arg))
}

$DictClass.prototype.__eq__ = function(other){
    if(!$isinstance(other,dict)){return False}
    if(!other.$keys.length==this.$keys.length){return False}
    for(var i=0;i<this.$keys.length;i++){
        test = false
        var key = this.$keys[i]
        for(j=0;j<other.$keys.length;j++){
            try{
                if(other.$keys[j].__eq__(key)){
                    if($bool(other.$values[j].__eq__($values[i]))){
                        test = true;break
                    }
                }
            }catch(err){void(0)}
        }
        if(!test){return False}
    }
    return True
}

$DictClass.prototype.__ne__ = function(other){return not(this.__eq__(other))}

$DictClass.prototype.__getitem__ = function(arg){
    // search if arg is in the keys
    for(var i=0;i<this.$keys.length;i++){
        if($bool(arg.__eq__(this.$keys[i]))){return this.$values[i]}
    }
    throw new KeyError($str(arg))
}

$DictClass.prototype.__setitem__ = function(key,value){
    for(var i=0;i<this.$keys.length;i++){
        try{
            if($bool(key.__eq__(this.$keys[i]))){ // reset value
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

$DictClass.prototype.__next__ = function(){
    if(this.iter==null){this.iter==0}
    if(this.iter<this.$keys.length){
        this.iter++
        return this.$keys[this.iter-1]
    } else {
        this.iter = null
        throw new $StopIteration()
    }
}

$DictClass.prototype.__in__ = function(item){return item.__contains__(this)}
$DictClass.prototype.__not_in__ = function(item){return not(item.__contains__(this))}

$DictClass.prototype.__contains__ = function(item){
    return list(this.$keys).__contains__(item)
}

$DictClass.prototype.items = function(){return new $DictIterator(this.$keys,this.$values)}
$DictClass.prototype.keys = function(){
    var res = list()
    for(var i=0;i<this.$keys.length;i++){res.append(this.$keys[i])}
    return res
}
$DictClass.prototype.values = function() {
    var res = list()
    for(var i=0;i<this.$values.length;i++){res.append(this.$values[i])}
    return res
}

function $DictIterator(keys,values){
    this.keys = keys
    this.values = values
    this.iter = null
    this.__next__ = function(){
        if(this.iter==null){this.iter==0}
        if(this.iter<keys.length){
            this.iter++
            return list(keys[this.iter-1],this.values[this.iter-1])
        } else {
            this.iter = null
            throw new $StopIteration()
        }
    }
}    

function dict(){
    var args=new Array(),i=0
    for(i=0;i<arguments.length;i++){args.push(arguments[i])}
    var keys=[],values=[]
    for(i=0;i<args.length;i++){
        keys.push(args[i].items[0])
        values.push(args[i].items[1])
    }
    return new $DictClass(keys,values)
}

function $EnumerateClass(iterator){
    this.iterator = iterator
    this.count = -1
    this.__next__ = function(){
        this.count += 1
        return list(int(this.count),this.iterator.__next__())
    }
}
function enumerate(iterator){
    return new $EnumerateClass(iterator)
}

function $FilterClass(func,iterable){
    this.func = func
    this.iterable = iterable
    this.__next__ = function(){
        while(true){
            var elt = next(this.iterable)
            if($bool(this.func(elt))){return elt}
        }
    }
}
                
function filter(){
    if(arguments.length!=2){throw new TypeError(
            "filter expected 2 arguments, got "+arguments.length)}
    var func = arguments[0]
    var iterable = arguments[1]
    if(!'__next__' in iterable){throw new TypeError(
         "'"+$str(iterable.__class__)+"' object is not iterable")}
    return new $FilterClass(func,iterable)
}

function $FloatClass(value){
    this.value = value
    this.__class__ = float
}
$FloatClass.prototype.__str__ = function(){return str(this.value)}
$FloatClass.prototype.__int__ = function(){return int(parseInt(this.value))}
$FloatClass.prototype.__float__ = function(){return this}
    
var $op_func = function(other){
    if($isinstance(other,int)){return float(this.value-other.value)}
    else if($isinstance(other,float)){return float(this.value-other.value)}
    else{throw new TypeError(
        "unsupported operand type(s) for -: 'int' and '"+$str(other.__class__)+"'")
    }
}
$op_func += '' // source code
var $ops = {'+':'add','-':'sub','*':'mul','/':'truediv'}
for($op in $ops){
    eval('$FloatClass.prototype.__'+$ops[$op]+'__ = '+$op_func.replace(/-/gm,$op))
}

var $augm_op_func = function(other){
    if($isinstance(other,int)){this.value -= other.value}
    else if($isinstance(other,float)){this.value -= other.value}
    else{throw new TypeError(
        "unsupported operand type(s) for -=: 'int' and '"+$str(other.__class__)+"'")
    }
}
$augm_op_func += '' // source code
var $ops = {'+=':'iadd','*=':'imul','/=':'itruediv'}
for($op in $ops){
    eval('$FloatClass.prototype.__'+$ops[$op]+'__ = '+$augm_op_func.replace(/-=/gm,$op))
}

$FloatClass.prototype.__floordiv__ = function(other){
    if($isinstance(other,int)){return int(Math.floor(this.value/other.value))}
    else if($isinstance(other,float)){return int(Math.floor(this.value/other.value))}
    else{throw new TypeError(
        "unsupported operand type(s) for //: 'int' and '"+$str(other.__class__)+"'")
    }
}

$FloatClass.prototype.__in__ = function(item){return item.__contains__(this)}
$FloatClass.prototype.__not_in__ = function(item){return not(item.__contains__(this))}

// comparison methods
var $comp_func = function(other){
    if($isinstance(other,int)){return $bool_conv(this.value > other.value)}
    else if($isinstance(other,float)){return $bool_conv(this.value > other.value)}
    else{throw new TypeError(
        "unorderable types: "+$str(this.__class__)+'() > '+$str(other.__class__)+"()")
    }
}
$comp_func += '' // source code
var $comps = {'>':'gt','>=':'ge','<':'lt','<=':'le','==':'eq','!=':'ne'}
for($op in $comps){
    eval("$FloatClass.prototype.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
}

// unsupported operations
var $notimplemented = function(other){
    throw new TypeError(
        "unsupported operand types for OPERATOR: '"+$str(this.__class__)+"' and '"+$str(other.__class__)+"'")
}
$notimplemented += '' // coerce to string
for($op in $operators){
    var $opfunc = '__'+$operators[$op]+'__'
    if(!($opfunc in $FloatClass.prototype)){
        eval('$FloatClass.prototype.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
    }
}

function float(value){
    if(typeof value=="number"){return new $FloatClass(parseFloat(value))}
    else if(typeof value=="string" && parseFloat(value)!=NaN){return new $FloatClass(parseFloat(value))}
    else if($isinstance(value,int)){return new $FloatClass(value)}
    else if($isinstance(value,float)){return value}
    else if($isinstance(value,str) && !isNaN(parseFloat(value.value))){
        return new $FloatClass(parseFloat(value.value))
    } else {throw new ValueError("Could not convert to float(): '"+$str(value)+"'")}
}

function getattr(obj,attr,_default){
    if(!$isinstance(attr,str)){throw new TypeError("getattr(): attribute name must be string")}
    if(attr.value in obj){
        var res = obj[attr.value]
        if(typeof res==="function"){
            // this trick is necessary to set "this" to the instance inside functions
            // found at http://yehudakatz.com/2011/08/11/understanding-javascript-function-invocation-and-this/
            var bind = function(func, thisValue) {
                return function() {return func.apply(thisValue, arguments)}
            }
            res = bind(res, obj)
        }
        return $JS2Py(res)
    }
    else if(_default !==undefined){return _default}
    else{throw new AttributeError(
        "'"+$str(obj.__class__)+"' object has no attribute '"+attr.value+"'")}
}

function hasattr(obj,attr){
    try{getattr(obj,attr);return True}
    catch(err){return False}
}

function $ModuleClass(module){
    // module namespace is in $ns[module]
    this.__getattr__ = function(attr){
        return $ns[module][attr.value]
    }
}
function Import(){

    var js_modules = $List2Dict('time','datetime')
    var calling={'line':document.line_num,'context':document.$context}
    for(var i=0;i<arguments.length;i++){
        module = arguments[i]
        if(!isinstance(module,str)){throw new SyntaxError("invalid syntax")}
        var res = ''
        module = module.value // JS string
        var is_js = module in js_modules

        if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
            var $xmlhttp=new XMLHttpRequest();
        }else{// code for IE6, IE5
            var $xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
        }
        $xmlhttp.onreadystatechange = function(){
            if($xmlhttp.readyState==4){
                window.clearTimeout(timer)
                if($xmlhttp.status==200){res = $xmlhttp.responseText}
                else{
                    document.$context = calling.context
                    document.line_num = calling.line
                    throw new ImportError("No module named '"+module+"'")
                }
            }
        }
        // we must add a fake query string to force the browser to execute the
        // request - some use the cache after the first request
        var fake_qs = '?foo='+Math.random().toString(36).substr(2,8)
        // open in synchronous mode !
        if(is_js){$xmlhttp.open('GET','/'+module+'.js'+fake_qs,false)}
        else{$xmlhttp.open('GET',module+'.py'+fake_qs,false)}
        var timer = setTimeout( function() {
            $xmlhttp.abort()
            document.$context = calling.context
            document.line_num = calling.line
            throw new ImportError("No module named '"+module+"'")}, 5000)
        $xmlhttp.send()
        if(is_js){
            eval(res)
        }else{
            // if module was found, res is set to the Python source code
            // wrap it inside a def for name resolutions
            lines = res.split('\n')
            // random name for module
            var fake_name = '_'+Math.random().toString(36).substr(2, 8)
            new_lines = ['def '+fake_name+'():']
            for(var j=0;j<lines.length;j++){new_lines.push(' '+lines[j])}
            res = ''
            for(var j=0;j<new_lines.length;j++){res += new_lines[j]+'\n'}
            var stack = py2js(res,module)
            eval(stack.to_js())
            eval(fake_name+'()') // running the function will create the namespace
            eval(module+'=new $ModuleClass("'+fake_name+'")')
            for(attr in $ns['_']){eval(module+'.'+attr+"=$ns[fake_name][attr]")}
        }
    }
}

function $IntegerClass(value){
    this.value = value
    this.__class__ = int
}
$IntegerClass.prototype.__str__ = function(){return str(this.value)}
$IntegerClass.prototype.__int__ = function(){return this}
$IntegerClass.prototype.__float__ = function(){return float(this.value)}

var $op_func = function(other){
    if($isinstance(other,int)){return int(this.value-other.value)}
    else if($isinstance(other,float)){return int(this.value-other.value)}
    else{$UnsupportedOpType("-",int,other.__class__)}
}
$op_func += '' // source code
var $not_comps = {'+':'add','-':'sub'}
for($op in $not_comps){
    eval('$IntegerClass.prototype.__'+$not_comps[$op]+'__ = '+$op_func.replace(/-/gm,$op))
}

$IntegerClass.prototype.__mul__ = function(other){
    if($isinstance(other,int)){return int(this.value*other.value)}
    else if($isinstance(other,float)) {return float(this.value*other.value)}
    else if($isinstance(other,str)) {
        var res = '',i=0
        for(i=0;i<this.value;i++){res+=other.value}
        return str(res)
    }else{$UnsupportedOpType("*",int,other.__class__)}
}

$IntegerClass.prototype.__truediv__ = function(other){
    if($isinstance(other,list(int,float))){return float(this.value/other.value)}
    else{$UnsupportedOpType("/",int,other.__class__)}
}

$IntegerClass.prototype.__floordiv__ = function(other){
    if($isinstance(other,list(int,float))){return int(Math.floor(this.value/other.value))}
    else{$UnsupportedOpType("//",int,other.__class__)}
}

$IntegerClass.prototype.__pow__ = function(other){
    if($isinstance(other,list(int,float))){return int(Math.floor(this.value/other.value))}
    else{$UnsupportedOpType("//",int,other.__class__)}
}

var $augm_op_func = function(other){
    if($isinstance(other,list(int,float))){this.value -= other.value}
    else{$UnsupportedOpType("-=",int,other.__class__)}
}
$augm_op_func += '' // source code
var $ops = {'+=':'iadd','-=':'isub','*=':'imul','/=':'itruediv'}
for($op in $ops){
    eval('$IntegerClass.prototype.__'+$ops[$op]+'__ = '+$augm_op_func.replace(/-=/gm,$op))
}

$IntegerClass.prototype.__ifloordiv__ = function(other){
    if($isinstance(other,int)){this.value = Math.floor(this.value/other.value)}
    else if($isinstance(other,float)){this.value = Math.floor(this.value/other.value)}
    else{$UnsupportedOpType("//=",int,other.__class__)}
}

$IntegerClass.prototype.__in__ = function(item){return item.__contains__(this)}
$IntegerClass.prototype.__not_in__ = function(item){return not(item.__contains__(this))}

// comparison methods
var $comp_func = function(other){
    if($isinstance(other,list(int,float))){
        return $bool_conv(this.value > other.value)
    }
    else{throw new TypeError(
            "unorderable types: "+$str(this.__class__)+'() > '+$str(other.__class__)+"()")
    }
}
$comp_func += '' // source code
var $comps = {'>':'gt','>=':'ge','<':'lt','<=':'le','==':'eq','!=':'ne'}
for($op in $comps){
    eval("$IntegerClass.prototype.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
}

// unsupported operations
var $notimplemented = function(other){
    throw new TypeError(
        "unsupported operand types for OPERATOR: '"+$str(this.__class__)+"' and '"+$str(other.__class__)+"'")
}
$notimplemented += '' // coerce to string
for($op in $operators){
    var $opfunc = '__'+$operators[$op]+'__'
    if(!($opfunc in $IntegerClass.prototype)){
        eval('$IntegerClass.prototype.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
    }
}

function int(value){
    if(typeof value=="number"){return new $IntegerClass(parseInt(value))}
    else if(typeof value=="string" && parseInt(value)!=NaN){return new $IntegerClass(parseInt(value))}
    else if($isinstance(value,int)){return value}
    else if($isinstance(value,float)){return new $IntegerClass(parseInt(value.value))}
    else if($isinstance(value,str) && parseInt(value.value)!=NaN){
        return new $IntegerClass(parseInt(value.value))
    } else { throw new ValueError(
        "Invalid literal for int() with base 10: '"+$str(value)+"'")
    }   
}

function $isinstance(obj,arg){
    if(arg.__class__ === list || arg.__class__ === tuple){
        var $i=0
        for($i=0;$i<arg.items.length;$i++){
            if(obj.__class__===arg.items[$i]){return true}
        }
        return false
    } else {
        return obj.__class__ === arg
    }
}
function isinstance(obj,arg){return $bool_conv($isinstance(obj,arg))}

function iter(obj){
    if('__next__' in obj){
        obj.iter=null // reset iteration counter
        return obj
    }
    throw new TypeError("'"+$str(obj.__class__)+"' object is not iterable")
}

function len(obj){
    if('__len__' in obj){return obj.__len__()} 
    else {throw new TypeError("object of type "+$str(obj.__class__)+" has no len()")}
}

function $ListClass(items){

    var x = null,i = null;
    this.iter = null
    this.__class__ = list
    this.items = items // JavaScript array
}

$ListClass.prototype.__getattr__ = function(attr){return getattr(this,attr)}

$ListClass.prototype.__len__ = function(){return int(this.items.length)}
    
$ListClass.prototype.__str__ = function(){
    var res = "[",i=null
    for(i=0;i<this.items.length;i++){
        x = this.items[i]
        if($isinstance(x,str)){res += x.__repr__().value} 
        else{res += x.__str__().value}
        if(i<this.items.length-1){res += ','}
    }
    return str(res+']')
}
        
$ListClass.prototype.__add__ = function(other){
    return list(this.items.concat(other.items))
}

$ListClass.prototype.__delitem__ = function(arg){
    if($isinstance(arg,int)){
        var pos = arg.value
        if(arg.value<0){pos=this.items.length+pos}
        if(pos>=0 && pos<this.items.length){
            this.items.splice(pos,1)
            return
        }
        else{throw new IndexError('list index out of range')}
    } else if($isinstance(arg,slice)) {
        var start = arg.start || int(0)
        var stop = arg.stop || this.__len__()
        var step = arg.step || int(1)
        if(start.value<0){start=int(this.__len__()+start.value)}
        if(stop.value<0){stop=int(this.__len__()+stop.value)}
        var res = [],i=null
        if(step.value>0){
            if(stop.value>start.value){
                for(i=start.value;i<stop.value;i+=step.value){
                    if(this.items[i]!==undefined){res.push(i)}
                }
            }
        } else {
            if(stop.value<start.value){
                for(i=start.value;i>stop.value;i+=step.value){
                    if(this.items[i]!==undefined){res.push(i)}
                }
                res.reverse() // must be in ascending order
            }
        }
        // delete items from left to right
        for(var i=res.length-1;i>=0;i--){
            this.items.splice(res[i],1)
        }
        return
    } else {
        throw new TypeError('list indices must be integer, not '+$str(arg.__class__))
    }
}


$ListClass.prototype.__eq__ = function(other){
    if($isinstance(other,list)){
        if(other.items.length==this.items.length){
            for(var i=0;i<this.items.length;i++){
                if(this.items[i].__eq__(other.items[i])===False){return False}
            }
            return True
        }
    }
    return False
}

$ListClass.prototype.__ne__ = function(other){return not(this.__eq__(other))}
    
$ListClass.prototype.__getitem__ = function(arg){
    if($isinstance(arg,int)){
        var pos = arg.value
        if(arg.value<0){pos=this.items.length+pos}
        if(pos>=0 && pos<this.items.length){return this.items[pos]}
        else{throw new IndexError('list index out of range')}
    } else if($isinstance(arg,slice)) {
        var start = arg.start || int(0)
        var stop = arg.stop || this.__len__()
        var step = arg.step || int(1)
        if(start.value<0){start=int(this.__len__()+start.value)}
        if(stop.value<0){stop=int(this.__len__()+stop.value)}
        var res = list(),i=null
        if(step.value>0){
            if(stop.value<=start.value){return res}
            else {
                for(i=start.value;i<stop.value;i+=step.value){
                    if(this.items[i]!==undefined){res.append(this.items[i])}
                }
                return res
            }
        } else {
            if(stop.value>=start.value){return res}
            else {
                for(i=start.value;i>stop.value;i+=step.value){
                    if(this.items[i]!==undefined){res.append(this.items[i])}
                }
                return res
            }
        } 
    } else {
        throw new TypeError('list indices must be integer, not '+$str(arg.__class__))
    }
}

$ListClass.prototype.__setitem__ = function(arg,value){
    if($isinstance(arg,int)){
        var pos = arg.value
        if(arg.value<0){pos=this.items.length+pos}
        if(pos>=0 && pos<this.items.length){this.items[pos]=value}
        else{throw new IndexError('list index out of range')}
    } else if($isinstance(arg,slice)) {
        var start = arg.start || $Integer(0)
        var stop = arg.stop || this.__len__()
        var step = arg.step || $Integer(1)
        if(start.value<0){start=$Integer(this.__len__()+start.value)}
        if(stop.value<0){stop=$Integer(this.__len__()+stop.value)}
        var res = new Array(),i=null
        for(i=start.value;i<stop.value;i+=step.value){
            res.push(this.items[i])
        }
        return res
    }else {
        throw new TypeError('list indices must be integer, not '+$str(arg.__class__))
    }
}

$ListClass.prototype.__next__ = function(){
    if(this.iter===null){this.iter=0}
    if(this.iter<this.items.length){
        this.iter++
        return this.items[this.iter-1]
    } else {
        this.iter = null
        throw new $StopIteration()
    }
}

$ListClass.prototype.__in__ = function(item){return item.__contains__(this)}
$ListClass.prototype.__not_in__ = function(item){return not(item.__contains__(this))}

$ListClass.prototype.__contains__ = function(item){
    for(var i=0;i<this.items.length;i++){
        try{if(this.items[i].__eq__(item)===True){return True}
        }catch(err){void(0)}
    }
    return False
}

$ListClass.prototype.append = function(item){this.items.push(item)}

$ListClass.prototype.count = function(elt){
    var res = 0
    for(var i=0;i<this.items.length;i++){
        if($bool(this.items[i].__eq__(elt))){res++}
    }
    return int(res)
}

$ListClass.prototype.index = function(elt){
    for(var i=0;i<this.items.length;i++){
        if($bool(this.items[i].__eq__(elt))){return int(i)}
    }
    throw new ValueError($str(elt)+" is not in list")
}

$ListClass.prototype.reverse = function(){
    for(var i=0;i<parseInt(this.items.length/2);i++){
        buf = this.items[i]
        this.items[i] = this.items[this.items.length-i-1]
        this.items[this.items.length-i-1] = buf
    }
}
    
// QuickSort implementation found at http://en.literateprograms.org/Quicksort_(JavaScript)
function $partition(arg,array,begin,end,pivot)
{
    var piv=array[pivot];
    array.swap(pivot, end-1);
    var store=begin;
    var ix;
    for(ix=begin;ix<end-1;++ix) {
        if($bool(arg(array[ix]).__le__(arg(piv)))) {
            array.swap(store, ix);
            ++store;
        }
    }
    array.swap(end-1, store);
    return store;
}

Array.prototype.swap=function(a, b)
{
    var tmp=this[a];
    this[a]=this[b];
    this[b]=tmp;
}

function $qsort(arg,array, begin, end)
{
    if(end-1>begin) {
        var pivot=begin+Math.floor(Math.random()*(end-begin));
        pivot=$partition(arg,array, begin, end, pivot);
        $qsort(arg,array, begin, pivot);
        $qsort(arg,array, pivot+1, end);
    }
}

$ListClass.prototype.sort = function(arg){
    if(!arg){arg=function(x){return x}}
    else if($isinstance(arg,str)){arg=function(x){return x.__getitem__(arg)}}
    if(this.items.length==0){return}
    $qsort(arg,this.items,0,this.items.length)
}

function $list(){
    // used for list displays
    // different from list : $list(1) is valid (matches [1])
    // but list(1) is invalid (integer 1 is not iterable)
    var args = new Array(),i=0
    for(i=0;i<arguments.length;i++){args.push(arguments[i])}
    return new $ListClass(args)
}

function list(){
    var args = new Array(),i=0
    for(i=0;i<arguments.length;i++){args.push(arguments[i])}
    if(args.length==1){    // must be an iterable
        if('__next__' in args[0]){
            var new_args = []
            while(true){
                try{new_args.push(args[0].__next__())}
                catch(err){
                    if(err.name=="StopIteration"){break}
                }
            }
            return new $ListClass(new_args)
        }else if(typeof args[0]=="object" && args[0].constructor===Array){
            return new $ListClass(args[0])
        } else{
            throw new TypeError("'"+$str(args[0].__class__)+"' object is not iterable")
        }
    } else {
        return new $ListClass(args)
    }
}

function $MapClass(func,iterables){
    var iterable = null
    this.func = func
    this.iterables = iterables
    this.__next__ = function(){
        while(true){
            var args = [],src=''
            for(var i=0;i<this.iterables.length;i++){
                args.push(next(this.iterables[i]))
                src += 'args['+i+'],'
            }
            if(src){src = src.substr(0,src.length-1)}
            return eval('this.func('+src+')')
        }
    }
}

function map(){
    var func = arguments[0]
    var iterables = []
    for(var i=1;i<arguments.length;i++){
        var iterable = arguments[i]
        if(!'__next__' in iterable){throw new TypeError(
             "'"+$str(iterable.__class__)+"' object is not iterable")}
        iterables.push(iterable)
    }
    return new $MapClass(func,iterables)
}

function $extreme(args,op){ // used by min() and max()
    if(op==='__gt__'){var $op_name = "max"}
    else{var $op_name = "min"}
    if(args.length==0){throw new TypeError($op_name+" expected 1 argument, got 0")}
    var last_arg = args[args.length-1]
    var last_i = args.length-1
    var has_key = false
    if($isinstance(last_arg,$Kw)){
        if(last_arg.name === 'key'){
            var func = last_arg.value
            has_key = true
            last_i--
        }else{throw new TypeError($op_name+"() got an unexpected keyword argument")}
    }else{var func = function(x){return x}}
    if((has_key && args.length==2)||(!has_key && args.length==1)){
        alert('cas 1')
        var arg = args[0]
        if(!('__next__' in arg)){throw new TypeError("'"+$str(arg)+"' object is not iterable")}
        var res = null
        while(true){
            try{
                var x = next(arg)
                if(res!==null){alert($str(func(x))+op+$str(func(res))+'?'+$bool(getattr(func(x),op)(func(res))))}
                if(res===null || $bool(getattr(func(x),op)(func(res)))){res = x}
            }catch(err){
                if(err.name=="StopIteration"){return res}
                throw err
            }
        }
    } else {
        var res = null
        for(var i=0;i<=last_i;i++){
            var x = args[i]
            if(res===null || $bool(getattr(func(x),op)(func(res)))){res = x}
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
    if('__next__' in obj){return obj.__next__()}
    throw new TypeError("'"+$str(obj.__class__)+"' object is not iterable")
}

function not(obj){
    if($bool(obj)){return False}else{return True}
}

function $ObjectClass(){
    this.__getattr__ = function(attr){
        if(attr.value in this){return this[attr.value]}
        else{throw new AttributeError("object has no attribute '"+attr.value+"'")}
    }
    this.__delattr__ = function(attr){eval('delete this.'+attr.value)}
    this.__setattr__ = function(attr,value){this[attr.value]=value}
}

function object(){
    return new $ObjectClass()
}

function $prompt(src){return str(prompt(src.value))}

function $ReversedClass(seq){
    this.iter = null
    this.__next__ = function(){
        if(this.iter===null){this.iter=len(seq)}
        if(this.iter.value===0){throw new $StopIteration()}
        this.iter.value--
        return seq.__getitem__(this.iter)
    }
}
function reversed(seq){
    // returns an iterator with elements in the reverse order from seq
    // only implemented for strings and lists
    if(!$isinstance(seq,list(str,list))){throw new TypeError(
        "argument to reversed() must be a sequence")}
    return new $ReversedClass(seq)
}

function round(arg,n){
    if(!$isinstance(arg,(int,float))){
        throw new TypeError("type "+$str(arg.__class__)+" doesn't define __round__ method")
    }
    if(n===undefined){n=int(0)}
    if(!$isinstance(n,int)){throw new TypeError(
        "'"+n.__class__+"' object cannot be interpreted as an integer")}
    var mult = Math.pow(10,n.value)
    return int(Math.round(arg.value*mult)).__truediv__(int(mult))
}

// set
function $SetClass(){
    var x = null;
    var i = null;
    this.iter = null
    this.__class__ = set
    this.items = [] // JavaScript array
}
$SetClass.prototype.__len__ = function(){return int(this.items.length)}
    
$SetClass.prototype.__str__ = function(){
    var res = "["
    for(var i=0;i<this.items.length;i++){
        x = this.items[i]
        if($isinstance(x,str)){
            res += x.__repr__().value
        } else {
            res += x.__str__().value
        }
        if(i<this.items.length-1){res += ','}
    }
    return str(res+']')
}
    
$SetClass.prototype.__add__ = function(other){
    return set(this.items.concat(other.items))
}

$SetClass.prototype.__eq__ = function(other){
    if($isinstance(other,set)){
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

$SetClass.prototype.__ne__ = function(other){return not(this.__eq__(other))}

$SetClass.prototype.__next__ = function(){
    if(this.iter==null){this.iter==0}
    if(this.iter<this.items.length){
        this.iter++
        return this.items[this.iter-1]
    } else {
        this.iter = null
        throw new $StopIteration()
    }
}

$SetClass.prototype.__in__ = function(item){return item.__contains__(this)}
$SetClass.prototype.__not_in__ = function(item){return not(item.__contains__(this))}

$SetClass.prototype.__contains__ = function(item){
    for(var i=0;i<this.items.length;i++){
        try{if(this.items[i].__eq__(item)){return True}
        }catch(err){void(0)}
    }
    return False
}

$SetClass.prototype.add = function(item){
    var i=0
    for(i=0;i<this.items.length;i++){
        try{if(item.__eq__(this.items[i])){return}}
        catch(err){void(0)} // if equality test throws exception
    }
    this.items.push(item)
}



function set(){
    var i=0
    if(arguments.length==0){return new $SetClass()}
    else if(arguments.length==1){    // must be an iterable
        if('__next__' in arguments[0]){
            var iterable = arguments[0]
            var obj = new $SetClass()
            while(true){
                try{obj.add(next(iterable))}
                catch(err){if(err.name=="StopIteration"){break}}
            }
            return obj
        } else{
            throw new TypeError("'"+$str(args[0].__class__)+"' object is not iterable")
        }
    } else {
        throw new TypeError("set expected at most 1 argument, got "+arguments.length)
    }
}

function setattr(obj,attr,value){
    if(!$isinstance(attr,str)){throw new TypeError("setattr(): attribute name must be string")}
    obj[attr.value]=value
}

function $StringClass(value){

    var i = null

    this.__class__ = str
    this.value = value
    this.iter = null
}
    
$StringClass.prototype.__add__ = function(other){
        if(!$isinstance(other,str)){
            try{return other.__radd__(this)}
            catch(err){throw new TypeError(
                "Can't convert "+other.__class__+" to str implicitely")}
        }else{return str(this.value+other.value)}
    }

$StringClass.prototype.__contains__ = function(item){
        if(!$isinstance(item,str)){throw new TypeError(
         "'in <string>' requires string as left operand, not "+item.__class__)}
        var nbcar = item.value.length
        for(var i=0;i<this.value.length;i++){
            if(this.value.substr(i,nbcar)==item.value){return True}
        }
        return False
    }

$StringClass.prototype.__float__ = function(){
        var $float = parseFloat(this.value)
        if($float==NaN){throw new ValueError(
            "could not convert string to float(): '"+this.value+"'")}
        else{return float($float)}
    }

$StringClass.prototype.__getattr__ = function(attr){return getattr(this,attr)}

$StringClass.prototype.__getitem__ = function(arg){
        if($isinstance(arg,int)){
            var pos = arg.value
            if(arg.value<0){pos=this.value.length+pos}
            if(pos>=0 && pos<this.value.length){return str(this.value.charAt(pos))}
            else{throw new IndexError('string index out of range')}
        } else if($isinstance(arg,slice)) {
            var start = arg.start || int(0)
            var stop = arg.stop || this.__len__()
            var step = arg.step || int(1)
            if(start.value<0){start=int(this.__len__()+start.value)}
            if(stop.value<0){stop=int(this.__len__()+stop.value)}
            var res = '',i=null
            if(step.value>0){
                if(stop.value<=start.value){return str('')}
                else {
                    for(i=start.value;i<stop.value;i+=step.value){
                        res += this.value.charAt(i)
                    }
                }
            } else {
                if(stop.value>=start.value){return str('')}
                else {
                    for(i=start.value;i>stop.value;i+=step.value){
                        res += this.value.charAt(i)
                    }
                }
            }            
            return str(res)
        }
    }

$StringClass.prototype.__iadd__ = function(other){
        if(!isinstance(other,str)){throw new TypeError(
            "Can't convert "+$str(other.__class__)+" to str implicitely")}
        this.value += other.value
    }

$StringClass.prototype.__imul__ = function(other){
        if(!$isinstance(other,int)){throw new TypeError(
            "Can't multiply sequence by non-int of type '"+$str(other.__class__)+"'")}
        $res = ''
        for(var i=0;i<other.value;i++){$res+=this.value}
        this.value = $res
    }

$StringClass.prototype.__in__ = function(item){return item.__contains__(this)}

$StringClass.prototype.__int__ = function(){
        var $int = parseInt(this.value)
        if($int==NaN){throw new ValueError(
            "invalid literal for int() with base 10: '"+this.value+"'")}
        else{return int($int)}
    }

$StringClass.prototype.__len__ = function(){return int(this.value.length)}

$StringClass.prototype.__mod__ = function(args){
        // string formatting (old style with %)
        var flags = $List2Dict('#','0','-',' ','+')
        var ph = [] // placeholders for replacements
        
        function format(s){
            var conv_flags = '([#\\+\\- 0])*'
            var conv_types = '[diouxXeEfFgGcrsa%]'
            var re = new RegExp('\\%(\\(.+\\))*'+conv_flags+'(\\*|\\d*)(\\.\\*|\\.\\d*)*(h|l|L)*('+conv_types+'){1}')
            var res = re.exec(s)
            this.is_format = true
            if(res===undefined){this.is_format = false;return}
            this.src = res[0]
            if(res[1]){this.mapping_key=str(res[1].substr(1,res[1].length-2))}
            else{this.mapping_key=null}
        this.flag = res[2]
        this.min_width = res[3]
        this.precision = res[4]
        this.length_modifier = res[5]
        this.type = res[6]
            
        this.toString = function(){
                var res = 'type '+this.type+' key '+this.mapping_key+' min width '+this.min_width
                res += ' precision '+this.precision
                return res
            }
        this.format = function(src){
                if(this.mapping_key!==null){
                    if(!$isinstance(src,dict)){throw new TypeError("format requires a mapping")}
                    src=src.__getitem__(this.mapping_key)
                }
                if(this.type=="s"){return $str(src)}
                else if(this.type=="i" || this.type=="d"){
                    if(!$isinstance(src,list(int,float))){throw new TypeError(
                        "%"+this.type+" format : a number is required, not "+$str(src.__class__))}
                    return $str(int(src))
                }else if(this.type=="f" || this.type=="F"){
                    if(!$isinstance(src,list(int,float))){throw new TypeError(
                        "%"+this.type+" format : a number is required, not "+$str(src.__class__))}
                    return $str(float(src))
                }
            }
        }
        
        // elts is an Array ; items of odd rank are string format objects
        var elts = []
        var pos = 0, start = 0, nb_repl = 0
        while(pos<this.value.length){
            if(this.value.charAt(pos)=='%'){
                var f = new format(this.value.substr(pos))
                if(f.is_format){
                    elts.push(this.value.substring(start,pos))
                    elts.push(f)
                    start = pos+f.src.length
                    pos = start
                    nb_repl++
                }else{pos++}
            }else{pos++}
        }
        elts.push(this.value.substr(start))
        if(!$isinstance(args,tuple)){
            if(nb_repl>1){throw new TypeError('not enough arguments for format string')}
            else{elts[1]=elts[1].format(args)}
        }else{
            if(nb_repl==args.items.length){
                for(var i=0;i<args.items.length;i++){
                    var fmt = elts[1+2*i]
                    elts[1+2*i]=fmt.format(args.items[i])
                }
            }else if(nb_repl<args.items.length){throw new TypeError(
                "not all arguments converted during string formatting")
            }else{throw new TypeError('not enough arguments for format string')}
        }
        var res = ''
        for(var i=0;i<elts.length;i++){res+=elts[i]}
        return str(res)
    }
    
$StringClass.prototype.__mul__ = function(other){
    if(!$isinstance(other,int)){throw new TypeError(
        "Can't multiply sequence by non-int of type '"+$str(other.__class__)+"'")}
    $res = ''
    for(var i=0;i<other.value;i++){$res+=this.value}
    return str($res)
}

$StringClass.prototype.__next__ = function(){
    if(this.iter==null){this.iter==0}
    if(this.iter<this.value.length){
        this.iter++
        return str(this.value.charAt(this.iter-1))
    } else {
        this.iter = null
        throw new $StopIteration()
    }
}

$StringClass.prototype.__not_in__ = function(item){return not(item.__contains__(this))}

$StringClass.prototype.__or__ = function(other){
    if(this.value.length==0){return other}
    else{return this}
}

$StringClass.prototype.__repr__ = function(){
    res = "'"
    res += this.value.replace('\n','\\\n')
    res += "'"
    return str(res)
}

$StringClass.prototype.__str__ = function(){return this}

// generate comparison methods
var $comp_func = function(other){
    if(!$isinstance(other,str)){throw new TypeError(
        "unorderable types: "+$str(this.__class__)+'() > '+$str(other.__class__)+"()")}
    return $bool_conv(this.value > other.value)
}
$comp_func += '' // source code
var $comps = {'>':'gt','>=':'ge','<':'lt','<=':'le','==':'eq','!=':'ne'}
for($op in $comps){
    eval("$StringClass.prototype.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
}

// unsupported operations
var $notimplemented = function(other){
    throw new TypeError(
        "unsupported operand types for OPERATOR: '"+$str(this.__class__)+"' and '"+$str(other.__class__)+"'")
}
$notimplemented += '' // coerce to string
for($op in $operators){
    var $opfunc = '__'+$operators[$op]+'__'
    if(!($opfunc in $StringClass.prototype)){
        eval('$StringClass.prototype.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
    }
}

$StringClass.prototype.capitalize = function(){
    if(this.value.length==0){return str('')}
    return str(this.value.charAt(0).toUpperCase()+this.value.substr(1).toLowerCase())
}

$StringClass.prototype.center = function(width,fillchar){
    if(fillchar===undefined){fillchar=' '}else{fillchar=fillchar.value}
    width=width.value
    if(width<=this.value.length){return this}
    else{
        var pad = parseInt((width-this.value.length)/2)
        res = ''
        for(var i=0;i<pad;i++){res+=fillchar}
        res += this.value
        for(var i=0;i<pad;i++){res+=fillchar}
        if(res.length<width){res += fillchar}
        return str(res)
    }
}

$StringClass.prototype.count = function(elt){
    if(!$isinstance(elt,str)){throw new TypeError(
        "Can't convert '"+$str(elt.__class__)+"' object to str implicitly")}
    var res = 0
    for(var i=0;i<this.value.length-elt.value.length+1;i++){
        if(this.value.substr(i,elt.value.length)===elt.value){res++}
    }
    return int(res)
}

$StringClass.prototype.endswith = function(){
    // Return True if the string ends with the specified suffix, otherwise 
    // return False. suffix can also be a tuple of suffixes to look for. 
    // With optional start, test beginning at that position. With optional 
    // end, stop comparing at that position.
    $ns[0]={}
    $MakeArgs(0,arguments,['suffix'],{'start':null,'end':null},null,null)
    var suffixes = $ns[0]['suffix']
    if(!$isinstance(suffixes,tuple)){suffixes=$list(suffixes)}
    var start = $ns[0]['start'] || int(0)
    var end = $ns[0]['end'] || int(this.value.length-1)
    var s = this.value.substr(start.value,end.value+1)
    for(var i=0;i<suffixes.items.length;i++){
        suffix = suffixes.items[i]
        if(suffix.value.length<=s.length &&
            s.substr(s.length-suffix.value.length)==suffix.value){return True}
    }
    return False
}

$StringClass.prototype.find = function(){
    // Return the lowest index in the string where substring sub is found, 
    // such that sub is contained in the slice s[start:end]. Optional 
    // arguments start and end are interpreted as in slice notation. 
    // Return -1 if sub is not found.
    $ns[0]={}
    $MakeArgs(0,arguments,['sub'],{'start':int(0),'end':int(this.value.length)},null,null)
    var sub = $ns[0]['sub'],start=$ns[0]['start'],end=$ns[0]['end']
    if(!$isinstance(sub,str)){throw new TypeError(
        "Can't convert '"+$str(sub.__class__)+"' object to str implicitly")}
    if(!$isinstance(start,int)||!$isinstance(end,int)){throw new TypeError(
        "slice indices must be integers or None or have an __index__ method")}
    var s = this.value.substring(start.value,end.value)
    var res = s.search(sub.value)
    if(res==-1){return int(-1)}
    else{return int(start.value+res)}
}

$StringClass.prototype.index = function(){
    // Like find(), but raise ValueError when the substring is not found.
    var args = []
    for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
    var res = this.find.apply(this,args)
    if(res.value==-1){throw new ValueError("substring not found")}
    else{return res}
}

$StringClass.prototype.join = function(iterable){
    if(!'__next__' in iterable){throw new TypeError(
         "'"+$str(iterable.__class__)+"' object is not iterable")}
    var res = '',count=0
    while(true){
        try{
            obj = next(iterable)
            if(!$isinstance(obj,str)){throw new TypeError(
                "sequence item "+count+": expected str instance, "+$str(obj.__class__)+"found")}
            res += obj.value+this.value
            count++
        }catch(err){
            if(err.name=='StopIteration'){break}
            throw err
        }
    }
    if(count==0){return str('')}
    res = res.substr(0,res.length-this.value.length)
    return str(res)
}

$StringClass.prototype.lower = function(){return str(this.value.toLowerCase())}

$StringClass.prototype.lstrip = function(x){
    if(x==undefined){pattern="\\s*"}
    else{pattern = "["+x.value+"]*"}
    sp = new RegExp("^"+pattern)
    return str(this.value.replace(sp,""))
}

$StringClass.prototype.replace = function(old,_new,count){
    if(count!==undefined){
        if(!$isinstance(count,list(int,float))){throw new TypeError(
            "'"+$str(count.__class__)+"' object cannot be interpreted as an integer")}
        count=count.value
        var re = new RegExp(old.value)
        var res = this.value
        while(count>0){
            if(this.value.search(re)==-1){return str(res)}
            res = res.replace(re,_new.value)
            count--
        }
        return str(res)
    }else{
        var re = new RegExp(old.value,"g")
        return str(this.value.replace(re,_new.value))
    }
}

$StringClass.prototype.rfind = function(){
    // Return the highest index in the string where substring sub is found, 
    // such that sub is contained within s[start:end]. Optional arguments 
    // start and end are interpreted as in slice notation. Return -1 on failure.
    $ns[0]={}
    $MakeArgs(0,arguments,['sub'],{'start':int(0),'end':int(this.value.length)},null,null)
    var sub = $ns[0]['sub'],start=$ns[0]['start'],end=$ns[0]['end']
    if(!$isinstance(sub,str)){throw new TypeError(
        "Can't convert '"+$str(sub.__class__)+"' object to str implicitly")}
    if(!$isinstance(start,int)||!$isinstance(end,int)){throw new TypeError(
        "slice indices must be integers or None or have an __index__ method")}
    var s = this.value.substring(start.value,end.value)
    var reversed = ''
    for(var i=s.length-1;i>=0;i--){reversed += s.charAt(i)}
    var res = reversed.search(sub.value)
    if(res==-1){return int(-1)}
    else{return int(start.value+s.length-1-res)}
}
    
$StringClass.prototype.rindex = function(){
    // Like rfind() but raises ValueError when the substring sub is not found
    var args = []
    for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
    var res = this.rfind.apply(this,args)
    if(res.value==-1){throw new ValueError("substring not found")}
    else{return res}
}

$StringClass.prototype.rstrip = function(x){
    if(x==undefined){pattern="\\s*"}
    else{pattern = "["+x.value+"]*"}
    sp = new RegExp(pattern+'$')
    return str(this.value.replace(sp,""))
}

$StringClass.prototype.split = function(){
    $ns[0]={}
    $MakeArgs(0,arguments,['sep'],{'sep':None,'maxsplit':int(-1)},null,null)
    var sep=$ns[0]['sep'],maxsplit=$ns[0]['maxsplit'].value
    var res = [],pos=0,spos=0
    if($isinstance(sep,str)){
        var sep = sep.value
        while(true){
            spos = this.value.substr(pos).search(sep)
            if(spos==-1){break}
            res.push(str(this.value.substr(pos,spos)))
            if(maxsplit != -1 && res.length==maxsplit){break}
            pos += spos+sep.length
        }
        res.push(str(this.value.substr(pos)))
        return list(res)
    }
}

$StringClass.prototype.startswith = function(){
    // Return True if string starts with the prefix, otherwise return False. 
    // prefix can also be a tuple of prefixes to look for. With optional 
    // start, test string beginning at that position. With optional end, 
    // stop comparing string at that position.
    $ns[0]={}
    $MakeArgs(0,arguments,['prefix'],{'start':null,'end':null},null,null)
    var prefixes = $ns[0]['prefix']
    if(!$isinstance(prefixes,tuple)){prefixes=$list(prefixes)}
    var start = $ns[0]['start'] || int(0)
    var end = $ns[0]['end'] || int(this.value.length-1)
    var s = this.value.substr(start.value,end.value+1)
    for(var i=0;i<prefixes.items.length;i++){
        prefix = prefixes.items[i]
        if(prefix.value.length<=s.length &&
            s.substr(0,prefix.value.length)==prefix.value){return True}
    }
    return False
}

$StringClass.prototype.strip = function(x){
    if(x==undefined){
        x = "\\s"
    }
    pattern = "["+x+"]"
    sp = new RegExp("^"+pattern+"+|"+pattern+"+$","g")
    return str(this.value.replace(sp,""))
}

$StringClass.prototype.upper = function(){return str(this.value.toUpperCase())}

function $str(obj){ // JS string for obj
    return str(obj).value
}

function str(arg){
    // compute value = JS string
    if(arg===undefined){return str('--undefined--')}
    var value = ""
    try{
        // value is a Python type
        value = arg.__str__().value
    } catch(err) {
        if(arg.constructor==Function){
            var src = arg+'' // coerce to string
            pattern = new RegExp("function (.*?)\\(")
            var res = pattern.exec(src)
            value = res[1]
        } else {
            value = arg.toString()
        }
    }
    return new $StringClass(value)
}

function sum(iterable,start){
    if(start===undefined){start=int(0)}
    var res = start
    while(true){
        try{res.__add__(next(iterable))}
        catch(err){
            if(err.name=="StopIteration"){return res}
            else{throw err}
        }
    }
}

function $tuple(arg){return arg} // used for parenthesed expressions

function tuple(){
    var args = new Array(),i=0
    for(i=0;i<arguments.length;i++){args.push(arguments[i])}
    obj = new $ListClass(args)
    obj.__class__ = tuple
    return obj
}

function $ZipClass(args){
    this.args = args
    this.__next__ = function(){
        var $res = list(),i=0
        for(var i=0;i<this.args.length;i++){
            z = this.args[i].__next__()
            if(z===undefined){throw new $StopIteration}
            $res.append(z)
        }
        return $res
    }
}

function zip(){
    var i=null, args = new Array()
    for(i=0;i<arguments.length;i++){args.push(arguments[i])}
    return new $ZipClass(args)
}

// built-in constants : True, False, None
function $TrueClass(){
    this.value = true
    this.__str__ = function(){return str('True')}
    this.__bool__ = function(){return True}
    this.__and__ = function(other){return bool(other)}
    this.__or__ = function(other){return True}
}
True = new $TrueClass()

function $FalseClass(){
    this.value = false
    this.__str__ = function(){return str('False')}
    this.__bool__ = function(){return False}
    this.__and__ = function(other){return False}
    this.__or__ = function(other){return bool(other)}
}
False = new $FalseClass()

function $NoneClass(){
    this.__str__ = function(){return str('None')}
    this.__bool__ = function(){return False}
    this.__or__ = function(other){return other}
}
None = new $NoneClass()


// slice
function $SliceClass(start,stop,step){
    this.__class__ = slice
    this.start = start
    this.stop = stop
    this.step = step
}
function slice(){
    var start = arguments[0] || null
    var stop = arguments[1] || null
    var step = arguments[2] || null
    var indices = [start,stop,step]
    for(var i=0;i<indices.length;i++){
        if(indices[i]===null){continue}
        if(!$isinstance(indices[i],int)){throw new TypeError(
            "slice indices must be integers or None or have an __index__ method")}
    }
    if(step!==null){
        if(step.value===0){throw new ValueError('slice step cannot be zero')}
    }
    return new $SliceClass(start,stop,step)
}

// range
function $RangeClass(start,stop,step){
    var pos = start.value
    this.__next__ = function(){
        if(pos<stop.value){
            var res = int(pos)
            pos += step.value
            return res
        }else{throw new $StopIteration}
    }
}

function range(){
    var start=int(0)
    var stop=int(0)
    var step=int(1)
    if(arguments.length==1){
        stop = arguments[0]
    } else if(arguments.length>=2){
        start = arguments[0]
        stop = arguments[1]
    }
    if(arguments.length>=3){
        step=arguments[2]
    }
    return new $RangeClass(start,stop,step)
}

// used in function calls for keyword arguments
function $KwClass(name,value){
    this.__class__ = $Kw
    this.name = name
    this.value = value
}
function $Kw(name,value){
    return new $KwClass(name,value)
}

