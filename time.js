function $TimeClass(){
    
    this.__getattr__ = function(attr){return getattr(this,attr)}

    this.clear_interval = function(){window.clearInterval()}
    
    this.set_interval = function(func,interval){
        window.setInterval(func,interval.value)
    }
    this.set_timeout = function(func,interval){
        window.setTimeout(func,interval.value)
    }
    this.time = function(){
        var obj = new Date()
        return int(obj.getTime())
    }
}
time = new $TimeClass()
