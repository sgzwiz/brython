function forEachArray(obj){
    var i=0;
    var res = null;
    this.Do = function(_func){
        for(i=0;i<obj.length;i++){
            if(obj[i]!=undefined){
                _func(obj[i])
            }
        }
    }
    this.Enumerate = function(_func){
        for(i=0;i<obj.length;i++){
            if(obj[i]!=undefined){
                _func(i,obj[i])
            }
        }
    }
    this.Map = function(func){
        res = new Array()
        for(i=0;i<obj.length;i++){
            if(obj[i]!=undefined){
                res.push(func(obj[i]))
            }
        }
        return res
    }
}

function forEachString(obj){
    var i=0
    this.Do = function(_func){
        for(i=0;i<obj.length;i++){
            _func(obj.charAt(i))
        }
    }
    this.Enumerate = function(_func){
        for(i=0;i<obj.length;i++){
            if(obj[i]!=undefined){
                _func(i,obj.charAt(i))
            }
        }
    }
    this.Map = function(func){
        res = ""
        for(i=0;i<obj.length;i++){
            res += func(obj.charAt(i))
        }
        return res
    }
}

function $ForEach(obj){
    if(Object.prototype.toString.apply(obj)=="[object Array]"){
        return new forEachArray(obj)
    } else if(typeof obj=="string") {
        return new forEachString(obj)
    } else if(typeof obj=="number") {
        return new forEachNumber(obj)
    }
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

function forEachNumber(obj){
    this.Do = function(_func){
        for(i=0;i<obj;i++){
            _func(i)
        }
    }
}

function $last(item){
    if(typeof item=="string"){return item.charAt(item.length-1)}
    else if(typeof item=="object"){return item[item.length-1]}
}
