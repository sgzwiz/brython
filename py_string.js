function str(arg){
    if(arg===undefined){return '<undefined>'}
    else if(arg.__str__!==undefined){return arg.__str__()}
    else{return arg.toString()}
}
str.__class__ = $type
str.__name__ = 'str'
str.__str__ = function(){return "<class 'str'>"}
str.toString = str.__str__

// add Brython attributes to Javascript String

String.prototype.__add__ = function(other){
    if(!(typeof other==="string")){
        try{return other.__radd__(this)}
        catch(err){throw TypeError(
            "Can't convert "+other.__class__+" to str implicitely")}
    }else{
        return this+other
    }
}

String.prototype.__class__ = str

String.prototype.__contains__ = function(item){
        if(!(typeof item==="string")){throw TypeError(
             "'in <string>' requires string as left operand, not "+item.__class__)}
        var nbcar = item.length
        for(var i=0;i<this.length;i++){
            if(this.substr(i,nbcar)==item){return True}
        }
        return False
    }

String.prototype.__eq__ = function(other){return other===this.valueOf()}

String.prototype.__getattr__ = function(attr){
    var obj = this
    return function(){
        args = [obj]
        for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
        return str.__getattr__(attr).apply(obj,args)
    }
}

str.__getattr__ = function(attr){
    switch(attr){
        case 'capitalize':
            return $string_capitalize
        case 'center': 
            return $string_center
        case 'count': 
            return $string_count
        case 'endswith': 
            return $string_endswith
        case 'find': 
            return $string_find
        case 'index': 
            return $string_index
        case 'join':
            return $string_join
        case 'lower':
            return $string_lower
        case 'lstrip': 
            return $string_lstrip
        case 'replace': 
            return $string_replace
        case 'rfind': 
            return $string_rfind
        case 'rindex': 
            return $string_rindex
        case 'rstrip': 
            return $string_rstrip
        case 'split':
        case 'splitfields':
            return $string_split
        case 'splitlines':
            return $string_splitlines
        case 'startswith': 
            return $string_startswith
        case 'strip':
            return $string_strip
        case 'upper':
            return $string_upper
       default:
            return this[attr]
    }
}

String.prototype.__getitem__ = function(arg){
    if(isinstance(arg,int)){
        var pos = arg
        if(arg<0){pos=this.length+pos}
        if(pos>=0 && pos<this.length){return this.charAt(pos)}
        else{throw IndexError('string index out of range')}
    } else if(isinstance(arg,slice)) {
        var step = arg.step===None ? 1 : arg.step
        if(step>0){
            var start = arg.start===None ? 0 : arg.start
            var stop = arg.stop===None ? this.__len__() : arg.stop
        }else{
            var start = arg.start===None ? this.__len__()-1 : arg.start
            var stop = arg.stop===None ? 0 : arg.stop
        }
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
                for(i=start;i>=stop;i+=step){
                    res += this.charAt(i)
                }
            }
        }            
        return res
    } else if(isinstance(arg,bool)){
        return this.__getitem__(int(arg))
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
            if(!res){this.is_format = false;return}
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
                    if(!isinstance(src,dict)){throw TypeError("format requires a mapping")}
                    src=src.__getitem__(this.mapping_key)
                }
                if(this.type=="s"){return str(src)}
                else if(this.type=="i" || this.type=="d"){
                    if(!isinstance(src,[int,float])){throw TypeError(
                        "%"+this.type+" format : a number is required, not "+str(src.__class__))}
                    return str(int(src))
                }else if(this.type=="f" || this.type=="F"){
                    if(!isinstance(src,[int,float])){throw TypeError(
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
                if(f.is_format && f.type!=="%"){
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
            if(nb_repl>1){throw TypeError('not enough arguments for format string')}
            else{elts[1]=elts[1].format(args)}
        }else{
            if(nb_repl==args.length){
                for(var i=0;i<args.length;i++){
                    var fmt = elts[1+2*i]
                    elts[1+2*i]=fmt.format(args[i])
                }
            }else if(nb_repl<args.length){throw TypeError(
                "not all arguments converted during string formatting")
            }else{throw TypeError('not enough arguments for format string')}
        }
        var res = ''
        for(var i=0;i<elts.length;i++){res+=elts[i]}
        // finally, replace %% by %
        res = res.replace(/%%/g,'%')
        return res
    }

String.prototype.__mul__ = function(other){
    if(!isinstance(other,int)){throw TypeError(
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
        throw StopIteration()
    }
}

String.prototype.__not_in__ = function(item){return !item.__contains__(this.valueOf())}

String.prototype.__setattr__ = function(attr,value){setattr(this,attr,value)}

String.prototype.__setitem__ = function(attr,value){
    throw TypeError("'str' object does not support item assignment")
}
String.prototype.__str__ = function(){
    return this.toString()
}

// generate comparison methods
var $comp_func = function(other){
    if(typeof other !=="string"){throw TypeError(
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
    throw TypeError(
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

function $string_center(obj,width,fillchar){
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

function $string_count(obj,elt){
    if(!(typeof elt==="string")){throw TypeError(
        "Can't convert '"+str(elt.__class__)+"' object to str implicitly")}
    var res = 0
    for(var i=0;i<obj.length-elt.length+1;i++){
        if(obj.substr(i,elt.length)===elt){res++}
    }
    return res
}

function $string_endswith(obj){
    // Return True if the string ends with the specified suffix, otherwise 
    // return False. suffix can also be a tuple of suffixes to look for. 
    // With optional start, test beginning at that position. With optional 
    // end, stop comparing at that position.
    var args = []
    for(var i=1;i<arguments.length;i++){args.push(arguments[i])}
    var $ns=$MakeArgs("str.endswith",args,['suffix'],
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

function $string_find(obj){
    // Return the lowest index in the string where substring sub is found, 
    // such that sub is contained in the slice s[start:end]. Optional 
    // arguments start and end are interpreted as in slice notation. 
    // Return -1 if sub is not found.
    var args = []
    for(var i=1;i<arguments.length;i++){args.push(arguments[i])}
    var $ns=$MakeArgs("str.find",args,['sub'],
        {'start':0,'end':obj.length},null,null)
    var sub = $ns['sub'],start=$ns['start'],end=$ns['end']
    if(!isinstance(sub,str)){throw TypeError(
        "Can't convert '"+str(sub.__class__)+"' object to str implicitly")}
    if(!isinstance(start,int)||!isinstance(end,int)){throw TypeError(
        "slice indices must be integers or None or have an __index__ method")}
    var s = obj.substring(start,end)
    var escaped = list("[.*+?|()$^")
    var esc_sub = ''
    for(var i=0;i<sub.length;i++){
        if(escaped.indexOf(sub.charAt(i))>-1){esc_sub += '\\'}
        esc_sub += sub.charAt(i)
    }
    var res = s.search(esc_sub)
    if(res==-1){return -1}
    else{return start+res}
}

function $string_index(obj){
    // Like find(), but raise ValueError when the substring is not found.
    var args = []
    for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
    var res = $string_find.apply(obj,args)
    if(res===-1){throw ValueError("substring not found")}
    else{return res}
}

function $string_join(obj,iterable){
    if(!'__item__' in iterable){throw TypeError(
         "'"+str(iterable.__class__)+"' object is not iterable")}
    var res = '',count=0
    for(var i=0;i<iterable.length;i++){
        var obj2 = iterable.__getitem__(i)
        if(!isinstance(obj2,str)){throw TypeError(
            "sequence item "+count+": expected str instance, "+obj2.__class__+"found")}
        res += obj2+obj
        count++
    }
    if(count==0){return ''}
    res = res.substr(0,res.length-obj.length)
    return res
}

function $string_lower(obj){return obj.toLowerCase()}

function $string_lstrip(obj,x){
    var pattern = null
    if(x==undefined){pattern="\\s*"}
    else{pattern = "["+x+"]*"}
    var sp = new RegExp("^"+pattern)
    return obj.replace(sp,"")
}

function $re_escape(str)
{
  var specials = "[.*+?|()$^"
  for(var i=0;i<specials.length;i++){
      var re = new RegExp('\\'+specials.charAt(i),'g')
      str = str.replace(re, "\\"+specials.charAt(i))
  }
  return str
}

function $string_replace(obj,old,_new,count){
    if(count!==undefined){
        if(!isinstance(count,[int,float])){throw TypeError(
            "'"+str(count.__class__)+"' object cannot be interpreted as an integer")}
        var re = new RegExp($re_escape(old),'g')
        
        var res = obj.valueOf()
        while(count>0){
            if(obj.search(re)==-1){return res}
            res = res.replace(re,_new)
            count--
        }
        return res
    }else{
        var re = new RegExp($re_escape(old),"g")
        return obj.replace(re,_new)
    }
}

function $string_rfind(obj){
    // Return the highest index in the string where substring sub is found, 
    // such that sub is contained within s[start:end]. Optional arguments 
    // start and end are interpreted as in slice notation. Return -1 on failure.
    var args = []
    for(var i=1;i<arguments.length;i++){args.push(arguments[i])}
    var $ns=$MakeArgs("str.find",args,['sub'],
        {'start':0,'end':obj.length},null,null)
    var sub = $ns['sub'],start=$ns['start'],end=$ns['end']
    if(!isinstance(sub,str)){throw TypeError(
        "Can't convert '"+str(sub.__class__)+"' object to str implicitly")}
    if(!isinstance(start,int)||!isinstance(end,int)){throw TypeError(
        "slice indices must be integers or None or have an __index__ method")}
    var s = obj.substring(start,end)
    var reversed = ''
    for(var i=s.length-1;i>=0;i--){reversed += s.charAt(i)}
    var res = reversed.search(sub)
    if(res==-1){return -1}
    else{return start+s.length-1-res}
}

function $string_rindex(obj){
    // Like rfind() but raises ValueError when the substring sub is not found
    var args = []
    for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
    var res = $string_rfind.apply(obj,arguments)
    if(res==-1){throw ValueError("substring not found")}
    else{return res}
}

function $string_rstrip(obj,x){
    if(x==undefined){pattern="\\s*"}
    else{pattern = "["+x+"]*"}
    sp = new RegExp(pattern+'$')
    return str(obj.replace(sp,""))
}

function $string_split(obj){
    var args = []
    for(var i=1;i<arguments.length;i++){args.push(arguments[i])}
    var $ns=$MakeArgs("str.split",args,[],{},'args','kw')
    var sep=null,maxsplit=-1
    if($ns['args'].length>=1){sep=$ns['args'][0]}
    if($ns['args'].length==2){maxsplit=$ns['args'][1]}
    if(sep===null){var re=/\s/}
    else{
        var escaped = list('*.[]()|$^')
        var esc_sep = ''
        for(var i=0;i<sep.length;i++){
            if(escaped.indexOf(sep.charAt(i))>-1){esc_sep += '\\'}
            esc_sep += sep.charAt(i)
        }
        var re = new RegExp(esc_sep)
    }
    return obj.split(re,maxsplit)
}

function $string_splitlines(obj){return $string_split(obj,'\n')}

function $string_startswith(obj){
    // Return True if string starts with the prefix, otherwise return False. 
    // prefix can also be a tuple of prefixes to look for. With optional 
    // start, test string beginning at that position. With optional end, 
    // stop comparing string at that position.
    var args = []
    for(var i=1;i<arguments.length;i++){args.push(arguments[i])}
    $ns=$MakeArgs("str.startswith",args,['prefix'],
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

function $string_strip(obj,x){
    if(x==undefined){x = "\\s"}
    pattern = "["+x+"]"
    return $string_rstrip($string_lstrip(obj,x),x)
}

function $string_upper(obj){return obj.toUpperCase()}
