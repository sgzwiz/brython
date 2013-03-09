list = function(){

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

list.__add__ = function(Self){
    return function(other){
        var res = Self.valueOf().concat(other.valueOf())
        if(isinstance(Self,tuple)){res = tuple.apply(Self,res)}
        return res
    }
}

list.__class__ = $type

list.__contains__ = function(Self){
    return function(item){
        for(var i=0;i<Self.length;i++){
            try{if(Self[i].__eq__(item)){return true}
            }catch(err){void(0)}
        }
        return false
    }
}

list.__delitem__ = function(Self){
    return function(arg){
        if(isinstance(arg,int)){
            var pos = arg
            if(arg<0){pos=Self.length+pos}
            if(pos>=0 && pos<Self.length){
                Self.splice(pos,1)
                return
            }
            else{throw IndexError('list index out of range')}
        } else if(isinstance(arg,slice)) {
            var start = arg.start || 0
            var stop = arg.stop || Self.length
            var step = arg.step || 1
            if(start<0){start=Self.length+start}
            if(stop<0){stop=Self.length+stop}
            var res = [],i=null
            if(step>0){
                if(stop>start){
                    for(i=start;i<stop;i+=step){
                        if(Self[i]!==undefined){res.push(i)}
                    }
                }
            } else {
                if(stop<start){
                    for(i=start;i>stop;i+=step.value){
                        if(Self[i]!==undefined){res.push(i)}
                    }
                    res.reverse() // must be in ascending order
                }
            }
            // delete items from left to right
            for(var i=res.length-1;i>=0;i--){
                Self.splice(res[i],1)
            }
            return
        } else {
            throw TypeError('list indices must be integer, not '+str(arg.__class__))
        }
    }
}

list.__eq__ = function(Self){
    return function(other){
        if(isinstance(other,Self.__class__)){
            if(other.length==Self.length){
                for(var i=0;i<Self.length;i++){
                    if(!Self[i].__eq__(other[i])){return False}
                }
                return True
            }
        }
        return False
    }
}

list.__getattr__ = function(attr){
    switch(attr){
        case '__class__':
            var res = function(){return list}
            res.__str__ = list.__str__
            return res
        case '__name__':
            var res = function(){
                throw AttributeError(" 'list' object has no attribute '__name__'")
            }
            res.__str__ = function(){return 'list'}
            return res
        default:
            return list[attr]
    }
}

list.__getitem__ = function(Self){
    return function(arg){
        if(isinstance(arg,int)){
            var items=Self.valueOf()
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
                var stop = arg.stop===None ? Self.__len__() : arg.stop
            }else{
                var start = arg.start===None ? Self.__len__()-1 : arg.start
                var stop = arg.stop===None ? 0 : arg.stop
            }
            if(start<0){start=int(Self.length+start)}
            if(stop<0){stop=Self.length+stop}
            var res = [],i=null,items=Self.valueOf()
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
            return Self.__getitem__(int(arg))
        } else {
            throw TypeError('list indices must be integer, not '+str(arg.__class__))
        }
    }
}

list.__hash__ = function(Self){return function(){throw TypeError("unhashable type: 'list'")}}

list.__in__ = function(Self){return function(item){return item.__contains__(Self)}}

list.__init__ = function(Self){
    return function(){
        Self.splice(0,Self.length)
        if(arguments.length===0){return}
        var arg = arguments[0]
        for(var i=0;i<arg.__len__();i++){Self.push(arg.__item__(i))}
    }
}

list.__item__ = function(Self){return function(i){return Self[i]}}

list.__len__ = function(Self){return function(){return Self.length}}

list.__mul__ = function(Self){
    return function(other){
        if(isinstance(other,int)){return other.__mul__(Self)}
        else{throw TypeError("can't multiply sequence by non-int of type '"+other.__name+"'")}
    }
}

list.__name__ = 'list'

list.__ne__ = function(Self){return function(other){return !Self.__eq__(other)}}

list.__next__ = function(Self){
    return function(){
        if(Self.iter===null){Self.iter=0}
        if(Self.iter<Self.valueOf().length){
            Self.iter++
            return Self.valueOf()[Self.iter-1]
        } else {
            Self.iter = null
            throw StopIteration()
        }
    }
}

list.__not_in__ = function(Self){return function(item){return !item.__contains__(Self)}}

list.__setitem__ = function(Self){
    return function(arg,value){
        if(isinstance(arg,int)){
            var pos = arg
            if(arg<0){pos=Self.length+pos}
            if(pos>=0 && pos<Self.length){Self[pos]=value}
            else{throw IndexError('list index out of range')}
        } else if(isinstance(arg,slice)){
            var start = arg.start===None ? 0 : arg.start
            var stop = arg.stop===None ? Self.__len__() : arg.stop
            var step = arg.step===None ? 1 : arg.step
            if(start<0){start=Self.length+start}
            if(stop<0){stop=Self.length+stop}
            Self.splice(start,stop-start)
            // copy items in a temporary JS array
            // otherwise, a[:0]=a fails
            if(hasattr(value,'__item__')){
                var $temp = list(value)
                for(var i=$temp.length-1;i>=0;i--){
                    Self.splice(start,0,$temp[i])
                }
            }else{
                throw TypeError("can only assign an iterable")
            }
        }else {
            throw TypeError('list indices must be integer, not '+str(arg.__class__))
        }
    }
}

list.__str__ = function(Self){
    if(Self===undefined){return "<class 'list'>"}
    return function(){
        var res = "[",i=null,items=Self.valueOf()
        for(i=0;i<items.length;i++){
            var x = items[i]
            if(isinstance(x,str)){res += "'"+x+"'"} 
            else{res += x.toString()}
            if(i<items.length-1){res += ','}
        }
        return res+']'
    }
}

list.append = function(Self){return function (other){Self.push(other)}}

list.count = function(Self){
    return function(elt){
        var res = 0
        for(var i=0;i<Self.length;i++){
            if(Self[i].__eq__(elt)){res++}
        }
        return res
    }
}

list.extend = function(Self){
    return function(other){
        if(arguments.length!=1){throw TypeError(
            "extend() takes exactly one argument ("+arguments.length+" given)")}
        try{
            for(var i=0;i<other.__len__();i++){Self.push(other.__item__(i))}
        }catch(err){
            throw TypeError("object is not iterable")
        }
    }
}

list.index = function(Self){
    return function(elt){
        for(var i=0;i<Self.length;i++){
            if(Self[i].__eq__(elt)){return i}
        }
        throw ValueError(str(elt)+" is not in list")
    }
}

list.insert = function(Self){return function(i,item){Self.splice(i,0,item)}}

list.remove = function(Self){
    return function(elt){
        for(var i=0;i<Self.length;i++){
            if(Self[i].__eq__(elt)){
                Self.splice(i,1)
                return
            }
        }
        throw ValueError(str(elt)+" is not in list")
    }
}

list.pop = function(Self){
    return function(elt){
        if(arguments.length===0){return Self.pop()}
        else if(arguments.length==1){
            var pos = arguments[0]
            if(isinstance(pos,int)){
                var res = Self[pos]
                Self.splice(pos,1)
                return res
            }else{
                throw TypeError(pos.__class__+" object cannot be interpreted as an integer")
            }
        }else{ 
            throw TypeError("pop() takes at most 1 argument ("+arguments.length+' given)')
        }
    }
}

list.reverse = function(Self){
    return function(){
        for(var i=0;i<parseInt(Self.length/2);i++){
            var buf = Self[i]
            Self[i] = Self[Self.length-i-1]
            Self[Self.length-i-1] = buf
        }
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

list.sort = function(Self){
    return function(){
        var func=function(x){return x}
        var reverse = false
        for(var i=0;i<arguments.length;i++){
            var arg = arguments[i]
            if(isinstance(arg,$Kw)){
                if(arg.name==='key'){func=arg.value}
                else if(arg.name==='reverse'){reverse=arg.value}
            }
        }
        if(Self.length==0){return}
        $qsort(func,Self,0,Self.length)
        if(reverse){list.reverse(Self)()}
    }
}

list.toString = list.__str__

function $ListClass(items){

    var x = null,i = null;
    this.iter = null
    this.__class__ = list
    this.items = items // JavaScript array
}

// add Brython attributes to Javascript Array

Array.prototype.__class__ = list

Array.prototype.__getattr__ = function(attr){
    var res = list.__getattr__(attr)(this)
    if(res.__name__===undefined){
        res.__str__ = function(){return "<built-in method "+attr+" of list object>"}
    }
    return res
}

// set other Array.prototype attributes
for(var attr in list){
    if(attr.substr(0,2)==='__' && Array.prototype[attr]===undefined){
        Array.prototype[attr]=(function(a){return function(){return list[a](this).apply(this,arguments)}})(attr)
    }
}

return list
}()
