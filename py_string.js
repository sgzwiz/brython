String.prototype.__add__ = function(other){
    if(!(typeof other==="string")){
        try{return other.__radd__(this)}
        catch(err){$raise('TypeError',
            "Can't convert "+other.__class__+" to str implicitely")}
    }else{
        return this+other
    }
}

String.prototype.__class__ = new $class(this,'str')

String.prototype.__contains__ = function(item){
        if(!(typeof item==="string")){$raise('TypeError',
             "'in <string>' requires string as left operand, not "+item.__class__)}
        var nbcar = item.length
        for(var i=0;i<this.length;i++){
            if(this.substr(i,nbcar)==item){return True}
        }
        return False
    }

String.prototype.__eq__ = function(other){return other===this.valueOf()}

String.prototype.__getattr__ = function(attr){
    obj=this
    switch(attr){
        case 'capitalize':
            return $string_capitalize(obj)
        case 'center': 
            return $string_center(obj)
        case 'count': 
            return $string_count(obj)
        case 'endswith': 
            return $string_endswith(obj)
        case 'find': 
            return $string_find(obj)
        case 'index': 
            return $string_index(obj)
        case 'join':
            return $string_join(obj)
        case 'lower':
            return $string_lower(obj)
        case 'lstrip': 
            return $string_lstrip(obj)
        case 'replace': 
            return $string_replace(obj)
        case 'rfind': 
            return $string_rfind(obj)
        case 'rindex': 
            return $string_rindex(obj)
        case 'rstrip': 
            return $string_rstrip(obj)
        case 'split': 
            return $string_split(obj)
        case 'startswith': 
            return $string_startswith(obj)
        case 'strip':
            return $string_strip(obj)
        case 'upper':
            return $string_upper(obj)
       default:
            return this[attr]
    }
}

String.prototype.__getitem__ = function(arg){
    if(isinstance(arg,int)){
        var pos = arg
        if(arg<0){pos=this.length+pos}
        if(pos>=0 && pos<this.length){return this.charAt(pos)}
        else{$raise('IndexError','string index out of range')}
    } else if(isinstance(arg,slice)) {
        var start = arg.start===None ? 0 : arg.start
        var stop = arg.stop===None ? this.__len__() : arg.stop
        var step = arg.step===None ? 1 : arg.step
        if(start<0){start=this.length+start}
        if(stop<0){stop=this.length+stop}
        var res = '',i=null
        if(step>0){
            if(stop<=start){return ''}
            else {
                for(i=start;i<stop;i+=step){
                    res += this.charAt(i)
                }
            }
        } else {
            if(stop>=start){return ''}
            else {
                for(i=start;i>stop;i+=step){
                    res += this.charAt(i)
                }
            }
        }            
        return res
    }
}

String.prototype.__in__ = function(item){return item.__contains__(this.valueOf())}

String.prototype.__item__ = function(i){return this.charAt(i)}

String.prototype.__len__ = function(){return this.length}

String.prototype.__mod__ = function(args){
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
                    if(!isinstance(src,dict)){$raise('TypeError',"format requires a mapping")}
                    src=src.__getitem__(this.mapping_key)
                }
                if(this.type=="s"){return str(src)}
                else if(this.type=="i" || this.type=="d"){
                    if(!isinstance(src,[int,float])){$raise('TypeError',
                        "%"+this.type+" format : a number is required, not "+str(src.__class__))}
                    return str(int(src))
                }else if(this.type=="f" || this.type=="F"){
                    if(!isinstance(src,[int,float])){$raise('TypeError',
                        "%"+this.type+" format : a number is required, not "+str(src.__class__))}
                    return str(float(src))
                }
            }
        }
        
        // elts is an Array ; items of odd rank are string format objects
        var elts = []
        var pos = 0, start = 0, nb_repl = 0
        var val = this.valueOf()
        while(pos<val.length){
            if(val.charAt(pos)=='%'){
                var f = new format(val.substr(pos))
                if(f.is_format){
                    elts.push(val.substring(start,pos))
                    elts.push(f)
                    start = pos+f.src.length
                    pos = start
                    nb_repl++
                }else{pos++}
            }else{pos++}
        }
        elts.push(val.substr(start))
        if(!isinstance(args,tuple)){
            if(nb_repl>1){$raise('TypeError','not enough arguments for format string')}
            else{elts[1]=elts[1].format(args)}
        }else{
            if(nb_repl==args.length){
                for(var i=0;i<args.length;i++){
                    var fmt = elts[1+2*i]
                    elts[1+2*i]=fmt.format(args[i])
                }
            }else if(nb_repl<args.length){$raise('TypeError',
                "not all arguments converted during string formatting")
            }else{$raise('TypeError','not enough arguments for format string')}
        }
        var res = ''
        for(var i=0;i<elts.length;i++){res+=elts[i]}
        return str(res)
    }

String.prototype.__mul__ = function(other){
    if(!isinstance(other,int)){$raise('TypeError',
        "Can't multiply sequence by non-int of type '"+str(other.__class__)+"'")}
    $res = ''
    for(var i=0;i<other;i++){$res+=this.valueOf()}
    return $res
}

String.prototype.__ne__ = function(other){return other!==this.valueOf()}

String.prototype.__next__ = function(){
    if(this.iter==null){this.iter==0}
    if(this.iter<this.value.length){
        this.iter++
        return str(this.value.charAt(this.iter-1))
    } else {
        this.iter = null
        $raise('StopIteration')
    }
}

String.prototype.__not_in__ = function(item){return !item.__contains__(this.valueOf())}

String.prototype.__setattr__ = function(attr,value){setattr(this,attr,value)}

String.prototype.__setitem__ = function(attr,value){
    $raise('TypeError',"'str' object does not support item assignment")
}

// generate comparison methods
var $comp_func = function(other){
    if(typeof other !=="string"){$raise('TypeError',
        "unorderable types: 'str' > "+other.__class__+"()")}
    return this > other
}
$comp_func += '' // source code
var $comps = {'>':'gt','>=':'ge','<':'lt','<=':'le'}
for($op in $comps){
    eval("String.prototype.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
}

// unsupported operations
var $notimplemented = function(other){
    $raise('TypeError',
        "unsupported operand types for OPERATOR: '"+str(this.__class__)+"' and '"+str(other.__class__)+"'")
}
$notimplemented += '' // coerce to string
for($op in $operators){
    var $opfunc = '__'+$operators[$op]+'__'
    if(!($opfunc in String.prototype)){
        eval('String.prototype.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
    }
}

function $string_capitalize(obj){
    if(obj.length==0){return ''}
    return obj.charAt(0).toUpperCase()+obj.substr(1).toLowerCase()
}

function $string_center(obj){
    return function(width,fillchar){
        if(fillchar===undefined){fillchar=' '}else{fillchar=fillchar}
        if(width<=obj.length){return obj}
        else{
            var pad = parseInt((width-obj.length)/2)
            res = ''
            for(var i=0;i<pad;i++){res+=fillchar}
            res += obj
            for(var i=0;i<pad;i++){res+=fillchar}
            if(res.length<width){res += fillchar}
            return res
        }
    }
}

function $string_count(obj){
    return function(elt){
        if(!(typeof elt==="string")){$raise('TypeError',
            "Can't convert '"+str(elt.__class__)+"' object to str implicitly")}
        var res = 0
        for(var i=0;i<obj.length-elt.length+1;i++){
            if(obj.substr(i,elt.length)===elt){res++}
        }
        return res
    }
}

function $string_endswith(obj){
    // Return True if the string ends with the specified suffix, otherwise 
    // return False. suffix can also be a tuple of suffixes to look for. 
    // With optional start, test beginning at that position. With optional 
    // end, stop comparing at that position.
    return function(){
        var $ns=$MakeArgs("str.endswith",arguments,['suffix'],
            {'start':null,'end':null},null,null)
        var suffixes = $ns['suffix']
        if(!isinstance(suffixes,tuple)){suffixes=[suffixes]}
        var start = $ns['start'] || 0
        var end = $ns['end'] || obj.length-1
        var s = obj.substr(start,end+1)
        for(var i=0;i<suffixes.length;i++){
            suffix = suffixes[i]
            if(suffix.length<=s.length &&
                s.substr(s.length-suffix.length)==suffix){return True}
        }
        return False
    }
}

function $string_find(obj){
    // Return the lowest index in the string where substring sub is found, 
    // such that sub is contained in the slice s[start:end]. Optional 
    // arguments start and end are interpreted as in slice notation. 
    // Return -1 if sub is not found.
    return function(){
        var $ns=$MakeArgs("str.find",arguments,['sub'],
            {'start':0,'end':obj.length},null,null)
        var sub = $ns['sub'],start=$ns['start'],end=$ns['end']
        if(!isinstance(sub,str)){$raise('TypeError',
            "Can't convert '"+str(sub.__class__)+"' object to str implicitly")}
        if(!isinstance(start,int)||!isinstance(end,int)){$raise('TypeError',
            "slice indices must be integers or None or have an __index__ method")}
        var s = obj.substring(start,end)
        var res = s.search(sub)
        if(res==-1){return -1}
        else{return start+res}
    }
}

function $string_index(obj){
    // Like find(), but raise ValueError when the substring is not found.
    return function(){
        var args = []
        for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
        var res = $string_find(obj).apply(obj,args)
        if(res===-1){$raise('ValueError',"substring not found")}
        else{return res}
    }
}

function $string_join(obj){
    return function(iterable){
        if(!'__item__' in iterable){$raise('TypeError',
             "'"+str(iterable.__class__)+"' object is not iterable")}
        var res = '',count=0
        for(var i=0;i<iterable.length;i++){
            var obj2 = iterable.__getitem__(i)
            if(!isinstance(obj2,str)){$raise('TypeError',
                "sequence item "+count+": expected str instance, "+obj2.__class__+"found")}
            res += obj2+obj
            count++
        }
        if(count==0){return ''}
        res = res.substr(0,res.length-obj.length)
        return res
    }
}

function $string_lower(obj){
    return function(){return obj.toLowerCase()}
}

function $string_lstrip(obj){
    return function(x){
        var pattern = null
        if(x==undefined){pattern="\\s*"}
        else{pattern = "["+x+"]*"}
        var sp = new RegExp("^"+pattern)
        return obj.replace(sp,"")
    }
}

function $string_replace(obj){
    return function(old,_new,count){
        if(count!==undefined){
            if(!isinstance(count,[int,float])){$raise('TypeError',
                "'"+str(count.__class__)+"' object cannot be interpreted as an integer")}
            var re = new RegExp(old)
            var res = obj.valueOf()
            while(count>0){
                if(obj.search(re)==-1){return res}
                res = res.replace(re,_new)
                count--
            }
            return res
        }else{
            var re = new RegExp(old,"g")
            return obj.replace(re,_new)
        }
    }
}

function $string_rfind(obj){
    // Return the highest index in the string where substring sub is found, 
    // such that sub is contained within s[start:end]. Optional arguments 
    // start and end are interpreted as in slice notation. Return -1 on failure.
    return function(){
        var $ns=$MakeArgs("str.find",arguments,['sub'],
            {'start':0,'end':obj.length},null,null)
        var sub = $ns['sub'],start=$ns['start'],end=$ns['end']
        if(!isinstance(sub,str)){$raise('TypeError',
            "Can't convert '"+str(sub.__class__)+"' object to str implicitly")}
        if(!isinstance(start,int)||!isinstance(end,int)){$raise('TypeError',
            "slice indices must be integers or None or have an __index__ method")}
        var s = obj.substring(start,end)
        var reversed = ''
        for(var i=s.length-1;i>=0;i--){reversed += s.charAt(i)}
        var res = reversed.search(sub)
        if(res==-1){return -1}
        else{return start+s.length-1-res}
    }
}

function $string_rindex(obj){
    // Like rfind() but raises ValueError when the substring sub is not found
    return function(){
        var args = []
        for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
        var res = $string_rfind(obj).apply(obj,args)
        if(res==-1){$raise('ValueError',"substring not found")}
        else{return res}
    }
}

function $string_rstrip(x){
    if(x==undefined){pattern="\\s*"}
    else{pattern = "["+x.value+"]*"}
    sp = new RegExp(pattern+'$')
    return str(this.value.replace(sp,""))
}

function $string_split(obj){
    return function(){
        var $ns=$MakeArgs("str.split",arguments,['sep'],
            {'maxsplit':-1},null,null)
        var sep=$ns['sep'],maxsplit=$ns['maxsplit']
        var res = [],pos=0,spos=0
        if(isinstance(sep,str)){
            while(true){
                spos = obj.substr(pos).search(sep)
                if(spos==-1){break}
                res.push(obj.substr(pos,spos))
                pos += spos+sep.length
                if(maxsplit != -1 && res.length==maxsplit){break}
            }
            res.push(obj.substr(pos))
            return res
        }
    }
}

function $string_startswith(obj){
    // Return True if string starts with the prefix, otherwise return False. 
    // prefix can also be a tuple of prefixes to look for. With optional 
    // start, test string beginning at that position. With optional end, 
    // stop comparing string at that position.
    return function(){
        $ns=$MakeArgs("str.startswith",arguments,['prefix'],
            {'start':null,'end':null},null,null)
        var prefixes = $ns['prefix']
        if(!isinstance(prefixes,tuple)){prefixes=[prefixes]}
        var start = $ns['start'] || 0
        var end = $ns['end'] || obj.length-1
        var s = obj.substr(start,end+1)
        for(var i=0;i<prefixes.length;i++){
            prefix = prefixes[i]
            if(prefix.length<=s.length &&
                s.substr(0,prefix.length)==prefix){return True}
        }
        return False
    }
}

function $string_strip(obj){
    return function(x){
        if(x==undefined){x = "\\s"}
        pattern = "["+x+"]"
        sp = new RegExp("^"+pattern+"+|"+pattern+"+$","g")
        return obj.replace(sp,"")
    }
}

function $string_upper(obj){return function(){return obj.toUpperCase()}}

function str(arg){
    if(arg===undefined){return '<undefined>'}
    else{return arg.toString()}
}
str.toString = function(){return "<class 'str'>"}
