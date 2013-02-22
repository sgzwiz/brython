function $list(){
    // used for list displays
    // different from list : $list(1) is valid (matches [1])
    // but list(1) is invalid (integer 1 is not iterable)
    var args = new Array()
    for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
    return new $ListClass(args)
}

function list(){
    if(arguments.length===0){return []}
    else if(arguments.length>1){
        throw TypeError("list() takes at most 1 argument ("+arguments.length+" given)")
    }
    var res = []
    res.__init__(arguments[0])
    return res
}
list.__class__ = $type
list.__name__ = 'list'
list.__str__ = function(){return "<class 'list'>"}
list.toString = list.__str__

function $ListClass(items){

    var x = null,i = null;
    this.iter = null
    this.__class__ = list
    this.items = items // JavaScript array
}

// add Brython attributes to Javascript Array

Array.prototype.__add__ = function(other){
    return this.valueOf().concat(other.valueOf())
}

Array.prototype.__class__ = list

Array.prototype.__contains__ = function(item){
    for(var i=0;i<this.length;i++){
        try{if(this[i].__eq__(item)){return true}
        }catch(err){void(0)}
    }
    return false
}

Array.prototype.__delitem__ = function(arg){
    if(isinstance(arg,int)){
        var pos = arg
        if(arg<0){pos=this.length+pos}
        if(pos>=0 && pos<this.length){
            this.splice(pos,1)
            return
        }
        else{throw IndexError('list index out of range')}
    } else if(isinstance(arg,slice)) {
        var start = arg.start || 0
        var stop = arg.stop || this.length
        var step = arg.step || 1
        if(start<0){start=this.length+start}
        if(stop<0){stop=this.length+stop}
        var res = [],i=null
        if(step>0){
            if(stop>start){
                for(i=start;i<stop;i+=step){
                    if(this[i]!==undefined){res.push(i)}
                }
            }
        } else {
            if(stop<start){
                for(i=start;i>stop;i+=step.value){
                    if(this[i]!==undefined){res.push(i)}
                }
                res.reverse() // must be in ascending order
            }
        }
        // delete items from left to right
        for(var i=res.length-1;i>=0;i--){
            this.splice(res[i],1)
        }
        return
    } else {
        throw TypeError('list indices must be integer, not '+str(arg.__class__))
    }
}

Array.prototype.__eq__ = function(other){
    if(isinstance(other,list)){
        if(other.length==this.length){
            for(var i=0;i<this.length;i++){
                if(!this[i].__eq__(other[i])){return False}
            }
            return True
        }
    }
    return False
}

Array.prototype.__getattr__ = function(attr){
    var obj=this
    switch(attr){
        case 'append':
            return function(other){
                if(isinstance(other,list)){obj.push(list(other))}
                else{obj.push(other)}
            }
        case 'count':
            return $list_count(obj)
        case 'extend':
            return $list_extend(obj)
        case 'index':
            return $list_index(obj)
        case 'pop':
            return $list_pop(obj)
        case 'remove':
            return $list_remove(obj)
        case 'reverse':
            return function(){$list_reverse(obj)}
        case 'sort':
            return function(arg){$list_sort(obj,arg)}
        default:
            return this[attr]
    }
}

Array.prototype.__getitem__ = function(arg){
    if(isinstance(arg,int)){
        var items=this.valueOf()
        var pos = arg
        if(arg<0){pos=items.length+pos}
        if(pos>=0 && pos<items.length){return items[pos]}
        else{
            throw IndexError('list index out of range')
        }
    } else if(isinstance(arg,slice)) {
        var step = arg.step===None ? 1 : arg.step
        if(step>0){
            var start = arg.start===None ? 0 : arg.start
            var stop = arg.stop===None ? this.__len__() : arg.stop
        }else{
            var start = arg.start===None ? this.__len__()-1 : arg.start
            var stop = arg.stop===None ? 0 : arg.stop
        }
        if(start<0){start=int(this.length+start)}
        if(stop<0){stop=this.length+stop}
        var res = [],i=null,items=this.valueOf()
        if(step>0){
            if(stop<=start){return res}
            else {
                for(i=start;i<stop;i+=step){
                    if(items[i]!==undefined){res.push(items[i])}
                }
                return res
            }
        } else {
            if(stop>=start){return res}
            else {
                for(i=start;i>=stop;i+=step){
                    if(items[i]!==undefined){res.push(items[i])}
                }
                return res
            }
        } 
    } else if(isinstance(arg,bool)){
        return this.__getitem__(int(arg))
    } else {
        throw TypeError('list indices must be integer, not '+str(arg.__class__))
    }
}

Array.prototype.__init__ = function(){
    this.splice(0,this.length)
    if(arguments.length===0){return}
    var arg = arguments[0]
    for(var i=0;i<arg.__len__();i++){
        this.push(arg.__item__(i))
    }
}

Array.prototype.__item__ = function(i){return this[i]}

Array.prototype.__in__ = function(item){return item.__contains__(this)}

Array.prototype.__len__ = function(){return this.length}
    
Array.prototype.__ne__ = function(other){return !this.__eq__(other)}
    
Array.prototype.__next__ = function(){
    if(this.iter===null){this.iter=0}
    if(this.iter<this.valueOf().length){
        this.iter++
        return this.valueOf()[this.iter-1]
    } else {
        this.iter = null
        throw StopIteration()
    }
}

Array.prototype.__not_in__ = function(item){return !item.__contains__(this)}

Array.prototype.__setitem__ = function(arg,value){
    if(isinstance(arg,int)){
        var pos = arg
        if(arg<0){pos=this.length+pos}
        if(pos>=0 && pos<this.length){this[pos]=value}
        else{throw IndexError('list index out of range')}
    } else if(isinstance(arg,slice)){
        var start = arg.start===None ? 0 : arg.start
        var stop = arg.stop===None ? this.__len__() : arg.stop
        var step = arg.step===None ? 1 : arg.step
        if(start<0){start=this.length+start}
        if(stop<0){stop=this.length+stop}
        this.splice(start,stop-start)
        // copy items in a temporary JS array
        // otherwise, a[:0]=a fails
        if(hasattr(value,'__item__')){
            var $temp = list(value)
            for(var i=$temp.length-1;i>=0;i--){
                this.splice(start,0,$temp[i])
            }
        }else{
            throw TypeError("can only assign an iterable")
        }
    }else {
        throw TypeError('list indices must be integer, not '+str(arg.__class__))
    }
}

Array.prototype.toString = function(){
    var res = "[",i=null,items=this.valueOf()
    for(i=0;i<items.length;i++){
        var x = items[i]
        if(isinstance(x,str)){res += "'"+x+"'"} 
        else{res += x.toString()}
        if(i<items.length-1){res += ','}
    }
    return res+']'
}

function $list_count(obj){
    return function(elt){
        var res = 0
        for(var i=0;i<obj.length;i++){
            if(obj[i].__eq__(elt)){res++}
        }
        return res
    }
}

function $list_extend(obj){
    return function(other){
        if(arguments.length!=1){throw TypeError(
            "extend() takes exactly one argument ("+arguments.length+" given)")}
        try{
            for(var i=0;i<other.__len__();i++){
                obj.push(other.__item__(i))
            }
        }catch(err){
            throw TypeError("object is not iterable")
        }
    }
}

function $list_index(obj){
    return function(elt){
        for(var i=0;i<obj.length;i++){
            if(obj[i].__eq__(elt)){return i}
        }
        throw ValueError(str(elt)+" is not in list")
    }
}

function $list_remove(obj){
    return function(elt){
        for(var i=0;i<obj.length;i++){
            if(obj[i].__eq__(elt)){
                obj.splice(i,1)
                return
            }
        }
        throw ValueError(str(elt)+" is not in list")
    }
}

function $list_pop(obj){
    return function(elt){
        if(arguments.length==0){return obj.pop()}
        else if(arguments.length==1){
            var pos = arguments[0]
            if(isinstance(pos,int)){
                var res = obj[pos]
                obj.splice(pos,1)
                return res
            }else{
                throw TypeError(pos.__class__+" object cannot be interpreted as an integer")
            }
        }else{ 
            throw TypeError("pop() takes at most 1 argument ("+arguments.length+' given)')
        }
    }
}

function $list_reverse(obj){
    for(var i=0;i<parseInt(obj.length/2);i++){
        var buf = obj[i]
        obj[i] = obj[obj.length-i-1]
        obj[obj.length-i-1] = buf
    }
}
    
// QuickSort implementation found at http://en.literateprograms.org/Quicksort_(JavaScript)
function $partition(arg,array,begin,end,pivot)
{
    var piv=array[pivot];
    array.swap(pivot, end-1);
    var store=begin;
    for(var ix=begin;ix<end-1;++ix) {
        if(arg(array[ix]).__le__(arg(piv))) {
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

function $list_sort(obj,arg){
    if(!arg){arg=function(x){return x}}
    else if(typeof arg==="string"){arg=function(x){return x.__getitem__(arg)}}
    if(obj.length==0){return}
    $qsort(arg,obj,0,obj.length)
}

