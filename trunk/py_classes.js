// exceptions
function $StopIteration(message) {  
    this.name = "StopIteration";  
    this.message = message || "Default Message";  
}
$StopIteration.prototype = new Error()

function $Exception(type,msg){
    msg = type+':'+msg+'\n'
    var lines = document.py_src.split('\n')
    msg += 'Line '+document.line_num+'\n'+lines[document.line_num-1]
    throw new Error(msg)
}
function $UnsupportedOpType(op,class1,class2){
    $Exception("TypeError",
        "unsupported operand type(s) for "+op+": '"+$str(class1)+"' and '"+$str(class2)+"'")
}
function $AssertEqual(v1,v2,type,msg){if(v1!==v2){$Exception(type,msg)}}
function $AssertNotEqual(v1,v2,type,msg){if(v1===v2){$Exception(type,msg)}}

// built-in functions
function abs(obj){
    if($isinstance(obj,int)){return int(Math.abs(obj.value))}
    else if($isinstance(obj,float)){return float(Math.abs(obj.value))}
    else{$Exception('TypeError',"Bad operand type for abs(): '"+$str(obj.__class__)+"'")}
}

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
    else if('__bool__' in obj){return obj.__bool__()===True} //===True){return true}return false}
    else if('__len__' in obj){return obj.__len__().__gt__(int(0))}
    return true
}

function $bool_conv(arg){if(arg){return True}else{return False}}

function bool(obj){return $bool_conv($bool(obj))}

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
    
    this.__len__ = function() {return int($keys.length)}
    this.__str__ = function(){
        if($keys.length==0){return str('{}')}
        var res = "{",key=null,value=null
        for(i=0;i<$keys.length;i++){
            key = $keys[i]
            value = $values[i]
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

    this.__add__ = function(other){
        var msg = "unsupported operand types for +:'dict' and "
        throw TypeError(msg+"'"+($str(other.__class__) || typeof other)+"'")
    }

    this.__eq__ = function(other){
        if(!$isinstance(other,dict)){return False}
        if(!other.$keys.length==$keys.length){return False}
        for(i=0;i<$keys.length;i++){
            test = false
            var key = $keys[i]
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

    this.__ne__ = function(other){return not(this.__eq__(other))}

    this.__getitem__ = function(arg){
        // search if arg is in the keys : must be the same Python type
        // and string values are the same
        for(i=0;i<$keys.length;i++){
            if($bool(arg.__eq__(this.$keys[i]))){return $values[i]}
        }
        $Exception('KeyError',str(arg))
    }

    this.__setitem__ = function(key,value){
        for(i=0;i<$keys.length;i++){
            try{
                if($bool(key.__eq__($keys[i]))){ // reset value
                    $values[i]=value
                    this.$values[i]=value
                    return
                }
            }catch(err){ // if __eq__ throws an exception
                void(0)
            }
        }
        // create a new key/value
        $keys.push(key);this.$keys=$keys
        $values.push(value);this.$values=$values
    }

    this.__next__ = function(){
        if(this.iter==null){this.iter==0}
        if(this.iter<$keys.length){
            this.iter++
            return $keys[this.iter-1]
        } else {
            this.iter = null
            throw new $StopIteration()
        }
    }

    this.__in__ = function(item){return item.__contains__(this)}
    this.__not_in__ = function(item){return not(item.__contains__(this))}

    this.__contains__ = function(item){
        return list($keys).__contains__(item)
    }

    this.items = function(){return new $DictIterator($keys,$values)}
    this.keys = function(){
        var res = list()
        for(i=0;i<$keys.length;i++){res.append($keys[i])}
        return res
    }
    this.values = function() {
        var res = list()
        for(i=0;i<$values.length;i++){res.append($values[i])}
        return res
    }
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
    if(arguments.length!=2){$Exception("TypeError",
        "filter expected 2 arguments, got "+arguments.length)}
    var func = arguments[0]
    var iterable = arguments[1]
    if(!'__next__' in iterable){$Exception("TypeError",
         "'"+$str(iterable.__class__)+"' object is not iterable")}
    return new $FilterClass(func,iterable)
}

function $FloatClass(value){
    this.value = value
    this.__class__ = float
    this.__str__ = function(){return str(value.toString())}
    this.__int__ = function(){return int(parseInt(value))}
    this.__float__ = function(){return this}
    
    var $op_func = function(other){
        if($isinstance(other,int)){return float(value-other.value)}
        else if($isinstance(other,float)){return float(value-other.value)}
        else{$Exception("TypeError",
                "unsupported operand type(s) for -: 'int' and '"+$str(other.__class__)+"'")
        }
    }
    $op_func += '' // source code
    var $ops = {'+':'add','-':'sub','*':'mul','/':'truediv'}
    for($op in $ops){
        eval('this.__'+$ops[$op]+'__ = '+$op_func.replace(/-/gm,$op))
    }

    var $augm_op_func = function(other){
        if($isinstance(other,int)){value -= other.value;this.value=value}
        else if($isinstance(other,float)){value -= other.value;this.value=value}
        else{$Exception("TypeError",
                "unsupported operand type(s) for -=: 'int' and '"+$str(other.__class__)+"'")
        }
    }
    $augm_op_func += '' // source code
    var $ops = {'+=':'iadd','*=':'imul','/=':'itruediv'}
    for($op in $ops){
        eval('this.__'+$ops[$op]+'__ = '+$augm_op_func.replace(/-=/gm,$op))
    }

    this.__floordiv__ = function(other){
        if($isinstance(other,int)){return int(Math.floor(value/other.value))}
        else if($isinstance(other,float)){return int(Math.floor(value/other.value))}
        else{$Exception("TypeError",
                "unsupported operand type(s) for //: 'int' and '"+$str(other.__class__)+"'")
        }
    }

    this.__in__ = function(item){return item.__contains__(this)}
    this.__not_in__ = function(item){return not(item.__contains__(this))}

    // comparison methods
    var $comp_func = function(other){
        if($isinstance(other,int)){return $bool_conv(this.value > other.value)}
        else if($isinstance(other,float)){return $bool_conv(this.value > other.value)}
        else{$Exception("TypeError",
                "unorderable types: "+$str(this.__class__)+'() > '+$str(other.__class__)+"()")
        }
    }
    $comp_func += '' // source code
    var $comps = {'>':'gt','>=':'ge','<':'lt','<=':'le','==':'eq','!=':'ne'}
    for($op in $comps){
        eval("this.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
    }

    // unsupported operations
    var $notimplemented = function(other){
        $Exception('TypeError',
            "unsupported operand types for OPERATOR: '"+$str(this.__class__)+"' and '"+$str(other.__class__)+"'")
    }
    $notimplemented += '' // coerce to string
    for($op in $operators){
        var $opfunc = '__'+$operators[$op]+'__'
        if(!($opfunc in this)){
            eval('this.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
        }
    }
}

function float(value){
    if(typeof value=="number"){return new $FloatClass(parseFloat(value))}
    else if(typeof value=="string" && parseFloat(value)!=NaN){return new $FloatClass(parseFloat(value))}
    else if($isinstance(value,int)){return new $FloatClass(value)}
    else if($isinstance(value,float)){return value}
    else if($isinstance(value,str) && !isNaN(parseFloat(value.value))){
        return new $FloatClass(parseFloat(value.value))
    } else {$Exception('ValueError',"Could not convert to float(): '"+$str(value)+"'")}
}

function getattr(obj,attr,_default){
    if(attr in obj){return obj[attr]}
    else if(_default !==undefined){return _default}
    else{$Exception('AttributeError',
        "'"+$str(obj.__class__)+"' object has no attribute '"+attr.value+"'")}
}

function hasattr(obj,attr){
    try{getattr(obj,attr);return True}
    catch(err){return False}
}

function $IntegerClass(value){
        
    this.value = value

    this.__class__ = int

    this.__str__ = function(){return str(value.toString())}
    this.__int__ = function(){return int(parseInt(value))}
    this.__float__ = function(){return this}

    var $op_func = function(other){
        if($isinstance(other,int)){return int(value-other.value)}
        else if($isinstance(other,float)){return int(value-other.value)}
        else{$UnsupportedOpType("-",int,other.__class__)}
    }
    $op_func += '' // source code
    var $not_comps = {'+':'add','-':'sub'}
    for($op in $not_comps){
        eval('this.__'+$not_comps[$op]+'__ = '+$op_func.replace(/-/gm,$op))
    }

   this.__mul__ = function(other){
        if($isinstance(other,int)){return int(value*other.value)}
        else if($isinstance(other,float)) {return float(value*other.value)}
        else if($isinstance(other,str)) {
            var res = '',i=0
            for(i=0;i<value;i++){res+=other.value}
            return str(res)
        }else{$UnsupportedOpType("*",int,other.__class__)}
    }

    this.__truediv__ = function(other){
        if($isinstance(other,list(int,float))){return float(value/other.value)}
        else{$UnsupportedOpType("/",int,other.__class__)}
    }

    this.__floordiv__ = function(other){
        if($isinstance(other,list(int,float))){return int(Math.floor(value/other.value))}
        else{$UnsupportedOpType("//",int,other.__class__)}
    }

    this.__pow__ = function(other){
        if($isinstance(other,list(int,float))){return int(Math.floor(value/other.value))}
        else{$UnsupportedOpType("//",int,other.__class__)}
    }

    var $augm_op_func = function(other){
        if($isinstance(other,list(int,float))){value -= other.value;this.value=value}
        else{$UnsupportedOpType("-=",int,other.__class__)}
    }
    $augm_op_func += '' // source code
    var $ops = {'+=':'iadd','-=':'isub','*=':'imul','/=':'itruediv'}
    for($op in $ops){
        eval('this.__'+$ops[$op]+'__ = '+$augm_op_func.replace(/-=/gm,$op))
    }

    this.__ifloordiv__ = function(other){
        if($isinstance(other,int)){value = Math.floor(value/other.value);this.value=value}
        else if($isinstance(other,float)){value = Math.floor(value/other.value);this.value=value}
        else{$UnsupportedOpType("//=",int,other.__class__)}
    }

    this.__in__ = function(item){return item.__contains__(this)}
    this.__not_in__ = function(item){return not(item.__contains__(this))}

    // comparison methods
    var $comp_func = function(other){
        if($isinstance(other,list(int,float))){
            return $bool_conv(value > other.value)
        }
        else{$Exception("TypeError",
                "unorderable types: "+$str(this.__class__)+'() > '+$str(other.__class__)+"()")
        }
    }
    $comp_func += '' // source code
    var $comps = {'>':'gt','>=':'ge','<':'lt','<=':'le','==':'eq','!=':'ne'}
    for($op in $comps){
        eval("this.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
    }

    // unsupported operations
    var $notimplemented = function(other){
        $Exception('TypeError',
            "unsupported operand types for OPERATOR: '"+$str(this.__class__)+"' and '"+$str(other.__class__)+"'")
    }
    $notimplemented += '' // coerce to string
    for($op in $operators){
        var $opfunc = '__'+$operators[$op]+'__'
        if(!($opfunc in this)){
            eval('this.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
        }
    }
    
}
function int(value){
    if(typeof value=="number"){return new $IntegerClass(parseInt(value))}
    else if(typeof value=="string" && parseInt(value)!=NaN){return new $IntegerClass(parseInt(value))}
    else if($isinstance(value,int)){return value}
    else if($isinstance(value,float)){return new $IntegerClass(parseInt(value))}
    else if($isinstance(value,str) && parseInt(value.value)!=NaN){
        return new $IntegerClass(parseInt(value.value))
    } else { $Exception('ValueError',
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
    $Exception('TypeError',"'"+$str(obj.__class__)+"' object is not iterable")
}

function len(obj){
    if('__len__' in obj){return obj.__len__()} 
    else {$Exception('TypeError',"object of type "+$str(obj.__class__)+" has no len()")}
}

function $ListClass(items){
    var x = null,i = null;
    this.iter = null
    this.__class__ = list
    this.items = items // JavaScript array

    this.__len__ = function(){return int(items.length)}
    
    this.__str__ = function(){
        var res = "["
        for(i=0;i<items.length;i++){
            x = items[i]
            if($isinstance(x,str)){res += x.__repr__().value} 
            else{res += x.__str__().value}
            if(i<items.length-1){res += ','}
        }
        return str(res+']')
    }
        
    this.__add__ = function(other){return list(items.concat(other.items))}

    this.__eq__ = function(other){
        if($isinstance(other,list)){
            if(other.items.length==items.length){
                for(i=0;i<items.length;i++){
                    if(items[i].__eq__(other.items[i])===False){return False}
                }
                return True
            }
        }
        return False
    }

    this.__ne__ = function(other){return not(this.__eq__(other))}
    
    this.__getitem__ = function(arg){
        if($isinstance(arg,int)){
            var pos = arg.value
            if(arg.value<0){pos=items.length+pos}
            if(pos>=0 && pos<items.length){return items[pos]}
            else{$Exception('IndexError','list index out of range')}
        } else if($isinstance(arg,slice)) {
            start = arg.start || int(0)
            stop = arg.stop || this.__len__()
            step = arg.step || int(1)
            if(start.value<0){start=int(this.__len__()+start.value)}
            if(stop.value<0){stop=int(this.__len__()+stop.value)}
            var res = list()
            if(step.value>0){
                if(stop.value<=start.value){return res}
                else {
                    for(i=start.value;i<stop.value;i+=step.value){
                        if(items[i]!==undefined){res.append(items[i])}
                    }
                    return res
                }
            } else {
                if(stop.value>=start.value){return res}
                else {
                    for(i=start.value;i>stop.value;i+=step.value){
                        if(this.items[i]!==undefined){res.append(items[i])}
                    }
                    return res
                }
            } 
        } else {
            $Exception('TypeError',
                'list indices must be integer, not '+$str(arg.__class__))
        }
    }

    this.__setitem__ = function(arg,value){
        if($isinstance(arg,int)){
            var pos = arg.value
            if(arg.value<0){pos=items.length+pos}
            if(pos>=0 && pos<items.length){items[pos]=value}
            else{$Exception('IndexError','list index out of range')}
        } else if($isinstance(arg,slice)) {
            start = arg.start || $Integer(0)
            stop = arg.stop || this.__len__()
            step = arg.step || $Integer(1)
            if(start.value<0){start=$Integer(this.__len__()+start.value)}
            if(stop.value<0){stop=$Integer(this.__len__()+stop.value)}
            var res = new Array()
            for(i=start.value;i<stop.value;i+=step.value){
                res.push(items[i])
            }
            return res
        }else {
            $Exception('TypeError',
                'list indices must be integer, not '+$str(arg.__class__))
        }
    }

    this.__next__ = function(){
        if(this.iter===null){this.iter=0}
        if(this.iter<items.length){
            this.iter++
            return items[this.iter-1]
        } else {
            this.iter = null
            throw new $StopIteration()
        }
    }

    this.__in__ = function(item){return item.__contains__(this)}
    this.__not_in__ = function(item){return not(item.__contains__(this))}

    this.__contains__ = function(item){
        for(i=0;i<items.length;i++){
            try{if(items[i].__eq__(item)===True){return True}
            }catch(err){void(0)}
        }
        return False
    }

    this.append = function(item){items.push(item)}

    this.reverse = function(){
        for(i=0;i<parseInt(items.length/2);i++){
            buf = items[i]
            items[i] = items[items.length-i-1]
            items[items.length-i-1] = buf
        }
        this.items = items
    }
    
    this.sort = function(arg){
        if(!arg){arg=function(x){return x}}
        else if($isinstance(arg,str)){arg=function(x){return x.__getitem__(arg)}}
        // bubble sort
        var buf = null
        while(true){
            sorted = true
            for(i=0;i<items.length-1;i++){
                if($bool(arg(items[i+1]).__lt__(arg(items[i])))){
                    buf = items[i+1]
                    items[i+1] = items[i]
                    items[i] = buf
                    sorted = false
                }
            }
            if(sorted){break}
        }
        this.items = items
    }

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
            $Exception('TypeError',"'"+$str(args[0].__class__)+"' object is not iterable")
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
        if(!'__next__' in iterable){$Exception("TypeError",
             "'"+$str(iterable.__class__)+"' object is not iterable")}
        iterables.push(iterable)
    }
    return new $MapClass(func,iterables)
}

function $extreme(args,op){ // used by min() and max()
    if(op==='__gt__'){var $op_name = "max"}
    else{var $op_name = "min"}
    if(args.length==0){$Exception("TypeError",$op_name+" expected 1 argument, got 0")}
    var last_arg = args[args.length-1]
    var last_i = args.length-1
    var has_key = false
    if($isinstance(last_arg,$Kw)){
        if(last_arg.name === 'key'){
            var func = last_arg.value
            has_key = true
            last_i--
        }else{$Exception("TypeError",$op_name+"() got an unexpected keyword argument")}
    }else{var func = function(x){return x}}
    if((has_key && args.length==2)||(!has_key && args.length==1)){
        alert('cas 1')
        var arg = args[0]
        if(!('__next__' in arg)){$Exception("TypeError",
            "'"+$str(arg)+"' object is not iterable")}
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

function $max(){
    if(arguments.length==0){$Exception("TypeError","max expected 1 argument, got 0")}
    var last_arg = arguments[arguments.length-1]
    var last_i = arguments.length-1
    var has_key = false
    if($isinstance(last_arg,$Kw)){
        if(last_arg.name === 'key'){
            var func = last_arg.value
            has_key = true
            last_i--
        }else{$Exception("TypeError","max() got an unexpected keyword argument")}
    }else{var func = function(x){return x}}
    if((has_key && arguments.length==2)||(!has_key && arguments.length==1)){
        var arg = arguments[0]
        if(!('__next__' in arg)){$Exception("TypeError",
            "'"+$str(arg)+"' object is not iterable")}
        var res = null
        while(true){
            try{
                var x = func(next(arg))
                if(res===null || $bool(getattr(x,op)(func(res)))){res = x}
            }catch(err){
                if(err.name=="StopIteration"){return res}
                throw err
            }
        }
    } else {
        var res = null
        for(var i=0;i<=last_i;i++){
            var x = arguments[i]
            if(res===null || $bool(func(x).__gt__(func(res)))){res = x}
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
    $Exception('TypeError',"'"+$str(obj.__class__)+"' object is not iterable")
}

function not(obj){
    if($bool(obj)){return False}else{return True}
}

// round
function round(arg,n){
    if(!$isinstance(arg,(int,float))){
        $Exception('TypeError',
            "type "+$str(arg.__class__)+" doesn't define __round__ method")
    }
    if(n===undefined){n=int(0)}
    if(!$isinstance(n,int)){$Exception("TypeError",
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

    this.__len__ = function(){return int(this.items.length)}
    
    this.__str__ = function(){
        var res = "["
        for(i=0;i<this.items.length;i++){
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
        
    this.__add__ = function(other){
        return set(this.items.concat(other.items))
    }

    this.__eq__ = function(other){
        if($isinstance(other,set)){
            if(other.items.length==this.items.length){
                for(i=0;i<this.items.length;i++){
                    if(this.__contains__(other.items[i])===False){
                        return False
                    }
                }
                return True
            }
        }
        return False
    }

    this.__ne__ = function(other){return not(this.__eq__(other))}
    
    this.__next__ = function(){
        if(this.iter==null){this.iter==0}
        if(this.iter<this.items.length){
            this.iter++
            return this.items[this.iter-1]
        } else {
            this.iter = null
            throw new $StopIteration()
        }
    }

    this.__in__ = function(item){return item.__contains__(this)}
    this.__not_in__ = function(item){return not(item.__contains__(this))}

    this.__contains__ = function(item){
        for(i=0;i<this.items.length;i++){
            try{if(this.items[i].__eq__(item)){return True}
            }catch(err){void(0)}
        }
        return False
    }

    this.add = function(item){
        var i=0
        for(i=0;i<this.items.length;i++){
            try{if(item.__eq__(this.items[i])){return}}
            catch(err){void(0)} // if equality test throws exception
        }
        this.items.push(item)
    }

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
            $Exception('TypeError',"'"+$str(args[0].__class__)+"' object is not iterable")
        }
    } else {
        $Exception("TypeError","set expected at most 1 argument, got "+arguments.length)
    }
}

function $StringClass(value){

    var i = null

    this.__class__ = str
    this.value = value
    this.iter = null
    
    this.__len__ = function(){return int(value.length)}
    this.__str__ = function(){return this}

    this.__repr__ = function(){
        res = "'"
        res += value.replace('\n','\\\n')
        res += "'"
        return str(res)
    }

    this.__int__ = function(){
        var $int = parseInt(value)
        if($int==NaN){$Exception("ValueError",
            "invalid literal for int() with base 10: '"+value+"'")}
        else{return int($int)}
    }
    this.__float__ = function(){
        var $float = parseFloat(value)
        if($float==NaN){$Exception("ValueError",
            "could not convert string to float(): '"+value+"'")}
        else{return float($float)}
    }
    // operators
    this.__add__ = function(other){
        if(!$isinstance(other,str)){
            try{return other.__radd__(this)}
            catch(err){$Exception('TypeError',
                "Can't convert "+other.__class__+" to str implicitely")}
        }else{return str(value+other.value)}
    }
    this.__iadd__ = function(other){
        $AssertEqual($isinstance(other,str),true,
            'TypeError',"Can't convert "+$str(other.__class__)+" to str implicitely")
        value += other.value
        this.value = value
    }
    this.__mul__ = function(other){
        $AssertEqual($isinstance(other,int),true,
            'TypeError',"Can't multiply sequence by non-int of type '"+$str(other.__class__)+"'")
        $res = ''
        for(var i=0;i<other.value;i++){$res+=value}
        return str($res)
    }
    this.__imul__ = function(other){
        $AssertEqual($isinstance(other,int),true,
            'TypeError',"Can't multiply sequence by non-int of type '"+$str(other.__class__)+"'")
        $res = ''
        for(var i=0;i<other.value;i++){$res+=value}
        value = $res
        this.value = $res
    }

    this.__mod__ = function(args){
        // string formatting (old style with %)
        var flags = $List2Dict('#','0','-',' ','+')
        var ph = [] // placeholders for replacements
        
        function format(s){
            var conv_flags = '([#\\+\\- 0])*'
            var conv_types = '[diouxXeEfFgGcrsa%]'
            var re = new RegExp('\\%(\\(.+\\))*'+conv_flags+'(\\*|\\d*)(\\.\\*|\\.\\d*)*(h|l|L)*('+conv_types+'){1}')
            var res = re.exec(s)
            this.is_format = true
            if(res===null){this.is_format = false;return}
            this.src = res[0]
            this.mapping_key = res[1]
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
        }
        var elts = []
        var pos = 0, start = 0, nb_repl = 0
        while(pos<value.length){
            if(value.charAt(pos)=='%'){
                var f = new format(value.substr(pos))
                if(f.is_format){
                    elts.push(value.substring(start,pos))
                    elts.push(f)
                    start = pos+f.src.length
                    pos = start
                    nb_repl++
                }else{pos++}
            }else{pos++}
        }
        elts.push(value.substr(start))
        if(!$isinstance(args,tuple)){
            if(nb_repl>1){$Exception('TypeError','not enough arguments for format string')}
            else{elts[1]=$str(args)}
        }else{
            if(nb_repl==args.items.length){
                for(i=0;i<args.items.length;i++){elts[1+2*i]=$str(args.items[i])}
            }else if(nb_repl<args.items.length){$Exception('TypeError',
                "not all arguments converted during string formatting")
            }else{$Exception('TypeError','not enough arguments for format string')}
        }
        var res = ''
        for(i=0;i<elts.length;i++){res+=elts[i]}
        return str(res)
    }
    
    // generate comparison methods
    var $comp_func = function(other){
        if(!$isinstance(other,str)){$Exception('TypeError',
            "unorderable types: "+$str(this.__class__)+'() > '+$str(other.__class__)+"()")}
        return $bool_conv(value > other.value)
    }
    $comp_func += '' // source code
    var $comps = {'>':'gt','>=':'ge','<':'lt','<=':'le','==':'eq','!=':'ne'}
    for($op in $comps){
        eval("this.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
    }

    this.__or__ = function(other){
        if(value.length==0){return other}
        else{return this}
    }
    
    // unsupported operations
    var $notimplemented = function(other){
        $Exception('TypeError',
            "unsupported operand types for OPERATOR: '"+$str(this.__class__)+"' and '"+$str(other.__class__)+"'")
    }
    $notimplemented += '' // coerce to string
    for($op in $operators){
        var $opfunc = '__'+$operators[$op]+'__'
        if(!($opfunc in this)){
            eval('this.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
        }
    }

    this.__getitem__ = function(arg){
        if($isinstance(arg,int)){
            var pos = arg.value
            if(arg.value<0){pos=value.length+pos}
            if(pos>=0 && pos<value.length){return str(value.charAt(pos))}
            else{$Exception('IndexError','string index out of range')}
        } else if($isinstance(arg,slice)) {
            start = arg.start || int(0)
            stop = arg.stop || this.__len__()
            step = arg.step || int(1)
            if(start.value<0){start=int(this.__len__()+start.value)}
            if(stop.value<0){stop=int(this.__len__()+stop.value)}
            var res = ''
            if(step.value>0){
                if(stop.value<=start.value){return str('')}
                else {
                    for(i=start.value;i<stop.value;i+=step.value){
                        res += value.charAt(i)
                    }
                }
            } else {
                if(stop.value>=start.value){return str('')}
                else {
                    for(i=start.value;i>stop.value;i+=step.value){
                        res += value.charAt(i)
                    }
                }
            }            
            return str(res)
        }
    }

    this.__next__ = function(){
        if(this.iter==null){this.iter==0}
        if(this.iter<value.length){
            this.iter++
            return str(value.charAt(this.iter-1))
        } else {
            this.iter = null
            throw new $StopIteration()
        }
    }

    this.__in__ = function(item){return item.__contains__(this)}
    this.__not_in__ = function(item){return not(item.__contains__(this))}

    this.__contains__ = function(item){
        if(!$isinstance(item,str)){$Exception("TypeError",
         "'in <string>' requires string as left operand, not "+item.__class__)}
        var nbcar = item.value.length
        for(i=0;i<value.length;i++){
            if(value.substr(i,nbcar)==item.value){return True}
        }
        return False
    }

    this.strip = function(x){
        if(x==undefined){
            x = "\\s"
        }
        pattern = "["+x+"]"
        sp = new RegExp("^"+pattern+"+|"+pattern+"+$","g")
        return str(value.replace(sp,""))
    }

    this.upper = function(){return str(value.toUpperCase())}

}

function $str(obj){ // JS string for obj
    return str(obj).value
}

function str(arg){
    // compute value = JS string
    if(arg===undefined){return str('--undefined--');$Exception('ValuerError','calling str on undefined')}
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
        for(i=0;i<this.args.length;i++){
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
    this.__str__ = function(){return str('True')}
    this.__bool__ = function(){return True}
    this.__and__ = function(other){return bool(other)}
    this.__or__ = function(other){return True}
}
True = new $TrueClass()

function $FalseClass(){
    this.__str__ = function(){return str('False')}
    this.__bool__ = function(){return False}
    this.__and__ = function(other){return False}
    this.__or__ = function(other){return bool(other)}
}
False = new $FalseClass()

function $NoneClass(){
    this.__str__ = function(){return str('None')}
    this.__bool__ = function(){return False}
}
None = new $NoneClass()

// transform native JS types into Brython types
function $JS2Py(src){
    htmlelt_pattern = new RegExp(/\[object HTML(.*)Element\]/)
    if(typeof src=="string"){
        return str(src)
    } else if(typeof src=="number") {
        if(src.toString().search(/\./)==-1){
            return int(src)
        } else {
            return float(src)
        }
    } else if(typeof src=="object" && src.constructor==Array){return new $ListClass(src)}
    else if(src.tagName!==undefined && src.nodeName!==undefined){return $DomElement(src)}
    else {return src}
}

// alert
function $Alert(src){alert(str(src).value)}

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
        $AssertEqual($isinstance(indices[i],int),true,'TypeError',
        "slice indices must be integers or None or have an __index__ method")
    }
    if(step!==null){
        $AssertNotEqual(step.value,0,'ValueError','slice step cannot be zero')
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

// object
function object(){
    return new Object()
}

// DOM classes

function $Document(){}

function $DomElement(elt){
    var i = null
    var elt_name = elt.tagName
    if(elt_name===undefined && elt.nodeName=="#text"){ // text node
        return str(elt.data)
    }
    var obj = new $TagClass()
    if(elt_name===undefined && elt.nodeName=="#document"){ // document
        obj.__class__ = $Document
    }else{
        obj.__class__ = eval(elt_name)
    }
    obj.elt = elt
    return obj
}

// classes to interact with DOM
function $AbstractTagClass(){
    // for abstract tags
    this.__class__ = $AbstractTag
    this.children = []
    this.appendChild = function(child){    
        this.children.push(child)
    }

    this.__add__ = function(other){
        if($isinstance(other,$AbstractTag)){
            this.children = this.children.concat(other.children)
        } else {this.children.push(other.elt)}
        return this
    }        

   this.__iadd__ = function(other){
        if($isinstance(other,$AbstractTag)){
            this.children = this.children.concat(other.children)
        } else {this.children.push(other.elt)}
    }        

    this.clone = function(){
        var res = $AbstractTag(), $i=0
        for($i=0;$i<this.children.length;$i++){
            res.children.push(this.children[$i].cloneNode(true))
        }
        return res
    }
}

function $AbstractTag(){
    return new $AbstractTagClass()
}

$events = $List2Dict('onabort','onactivate','onafterprint','onafterupdate',
'onbeforeactivate','onbeforecopy','onbeforecut','onbeforedeactivate',
'onbeforeeditfocus','onbeforepaste','onbeforeprint','onbeforeunload',
'onbeforeupdate','onblur','onbounce','oncellchange','onchange','onclick',
'oncontextmenu','oncontrolselect','oncopy','oncut','ondataavailable',
'ondatasetchanged','ondatasetcomplete','ondblclick','ondeactivate','ondrag',
'ondragend','ondragenter','ondragleave','ondragover','ondragstart','ondrop',
'onerror','onerrorupdate','onfilterchange','onfinish','onfocus','onfocusin',
'onfocusout','onhashchange','onhelp','oninput','onkeydown','onkeypress',
'onkeyup','onload','onlosecapture','onmessage','onmousedown','onmouseenter',
'onmouseleave','onmousemove','onmouseout','onmouseover','onmouseup',
'onmousewheel','onmove','onmoveend','onmovestart','onoffline','ononline',
'onpaste','onpropertychange','onreadystatechange','onreset','onresize',
'onresizeend','onresizestart','onrowenter','onrowexit','onrowsdelete',
'onrowsinserted','onscroll','onsearch','onselect','onselectionchange',
'onselectstart','onstart','onstop','onsubmit','onunload')

function $TagClass(_class,args){
    // represents an HTML tag
    var $i = null
    if(_class!=undefined){
        this.name = str(_class).value
        eval("this.__class__ ="+_class)
        this.elt = document.createElement(this.name)
    }
    if(args!=undefined && args.length>0){
        $start = 0
        $first = args[0]
        // if first argument is not a keyword, it's the tag content
        if(!$isinstance($first,$Kw)){
            $start = 1
            if($isinstance($first,str)){
                txt = document.createTextNode($first.value)
                this.elt.appendChild(txt)
            } else if($isinstance($first,int) || $isinstance($first,float)){
                txt = document.createTextNode($first.value.toString())
                this.elt.appendChild(txt)
            } else if($isinstance($first,$AbstractTag)){
                for($i=0;$i<$first.children.length;$i++){
                    this.elt.appendChild($first.children[$i])
                }
            } else {
                try{this.elt.appendChild($first.elt)}
                catch(err){$Exception('ValueError','wrong element '+$first.elt)}
            }
        }
        // attributes
        for($i=$start;$i<args.length;$i++){
            // keyword arguments
            $arg = args[$i]
            if($isinstance($arg,$Kw)){
                if($arg.name.toLowerCase() in $events){
                    eval('this.elt.'+$arg.name.toLowerCase()+'=function(){'+$arg.value.value+'}')
                } else {
                    this.elt.setAttribute($arg.name,$arg.value.value)
                }
            }
        }
    }
    // if not id was provided, generate one
    if('elt' in this){
        if(!this.elt.getAttribute('id')){ // '' for IE, null for Chrome and Firefox
            this.elt.setAttribute('id',Math.random().toString(36).substr(2, 8))
        }
    }

    this.__le__ = function(other){
        if($isinstance(other,$AbstractTag)){
            var $i=0
            for($i=0;$i<other.children.length;$i++){
                this.elt.appendChild(other.children[$i])
            }
        } else {this.elt.appendChild(other.elt)}
    }
    
    this.__add__ = function(other){
        var res = $AbstractTag() // abstract tag
        res.children = [this.elt]
        if($isinstance(other,$AbstractTag)){
            var $i=0
            for($i=0;$i<other.children.length;$i++){
                res.children.push(other.children[$i])
            }
        } else {res.children.push(other.elt)}
        return res
    }

    this.__radd__ = function(other){ // add to a string
        var res = $AbstractTag() // abstract tag
        var txt = document.createTextNode(other.value)
        res.children = [txt,this.elt]
        return res        
    }

    this.__iadd__ = function(other){
        this.__class__ = $AbstractTag // change to abstract tag
        this.children = [this.elt]
        if($isinstance(other,$AbstractTag)){
            for($i=0;$i<other.children.length;$i++){
                this.children.push(other.children[$i])
            }
        } else {this.children.push(other.elt)}
    }

    this.__eq__ = function(other){
        if(!('getAttribute' in other.elt)){return False}
        return $bool_conv(this.elt.getAttribute('id')==other.elt.getAttribute('id'))
    }

    this.__ne__ = function(other){return not(this.__eq__(other))}

    this.__getitem__ = function(key){
        return $JS2Py(this.elt[$str(key)])
    }
    
    this.__setitem__ = function(key,value){
        this.elt.setAttribute($str(key),$str(value))
    }
    
    this.clone = function(){
        res = new TagClass(this.name)
        res.elt = this.elt.cloneNode(true)
        return res
    }

    this.parent = function(){
        if(this.elt.parentElement){return $DomElement(this.elt.parentElement)}
        else{return None}
    }

    this.children = function(){
        var res = list()
        for(i=0;i<this.elt.childNodes.length;i++){
            res.append($DomElement(this.elt.childNodes[i]))
        }
        return res
    }

    this.text = function(){
        return str(this.elt.innerText || this.elt.textContent)
    }
    
    this.html = function(){return str(this.elt.innerHTML)}
    this.set_html = function(value){this.elt.innerHTML=$str(value)}

    this.show = function(){
        document.body.appendChild(this.elt)
    }
}

function A(){
    var $args = [],$i=0
    for($i=0;$i<arguments.length;$i++){$args.push(arguments[$i])}
    return new $TagClass(A,$args)
}

var $src = A+'' // source of function A
$tags = ['A', 'ABBR', 'ACRONYM', 'ADDRESS', 'APPLET',
            'B', 'BDO', 'BIG', 'BLOCKQUOTE', 'BUTTON',
            'CAPTION', 'CENTER', 'CITE', 'CODE',
            'DEL', 'DFN', 'DIR', 'DIV', 'DL',
            'EM', 'FIELDSET', 'FONT', 'FORM', 'FRAMESET',
            'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
            'I', 'IFRAME', 'INS', 'KBD', 'LABEL', 'LEGEND',
            'MAP', 'MENU', 'NOFRAMES', 'NOSCRIPT', 'OBJECT',
            'OL', 'OPTGROUP', 'PRE', 'Q', 'S', 'SAMP',
            'SCRIPT', 'SMALL', 'SPAN', 'STRIKE',
            'STRONG', 'STYLE', 'SUB', 'SUP', 'TABLE',
            'TEXTAREA', 'TITLE', 'TT', 'U', 'UL',
            'VAR', 'BODY', 'COLGROUP', 'DD', 'DT', 'HEAD',
            'HTML', 'LI', 'P', 'TBODY','OPTION', 
            'TD', 'TFOOT', 'TH', 'THEAD', 'TR',
            'AREA', 'BASE', 'BASEFONT', 'BR', 'COL', 'FRAME',
            'HR', 'IMG', 'INPUT', 'ISINDEX', 'LINK',
            'META', 'PARAM']

$tags = $tags.concat(['CIRCLE','ELLIPSE','SVG','TEXT','RECT'])
            
for($i=0;$i<$tags.length;$i++){
    $code = $src.replace(/A/gm,$tags[$i])
    eval($code)
}