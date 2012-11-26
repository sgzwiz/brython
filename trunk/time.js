function norm_str(arg,nb){
    // left padding with 0
    var res = arg.toString()
    while(res.length<nb){res = '0'+res}
    return res
}

function $TimeClass(){
    
    this.__getattr__ = function(attr){return this[attr]}

    this.clear_interval = function(int_id){window.clearInterval(int_id.value)}
    
    this.set_interval = function(func,interval){
        return int(window.setInterval(func,interval.value))
    }
    this.set_timeout = function(func,interval){
        window.setTimeout(func,interval.value)
    }
    this.time = function(){
        var obj = new Date()
        return int(obj.getTime())
    }
    this.strftime = function(format,arg){
        if(arg){var obj = new Date(arg)}else{var obj=new Date()}
        var res = format.value
        res = res.replace(/%H/,norm_str(obj.getHours(),2))
        res = res.replace(/%M/,norm_str(obj.getMinutes(),2))
        res = res.replace(/%S/,norm_str(obj.getSeconds(),2))
        res = res.replace(/%Y/,norm_str(obj.getFullYear(),4))
        res = res.replace(/%y/,norm_str(obj.getFullYear(),4).substr(2))
        res = res.replace(/%m/,norm_str(obj.getMonth()+1,2))
        res = res.replace(/%d/,norm_str(obj.getDate(),2))
        return str(res)
    }
}
time = new $TimeClass()
