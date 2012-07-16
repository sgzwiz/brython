function $TimeClass(){
    
    this.__getattr__ = function(attr){return getattr(this,attr)}
    
    this.time = function(){
        var obj = new Date()
        return int(obj.getTime())
    }
}
time = new $TimeClass()

//window.time = time