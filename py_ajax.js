// ajax

function $XmlHttpClass(obj){
    this.__class__ = 'XMLHttpRequest'
    this.__getattr__ = function(attr){
        if('get_'+attr.value in this){return this['get_'+attr.value]()}
        else if(attr.value in obj){return $JS2Py(obj[attr.value])}
        return getattr(obj,attr)
    }
    
    this.get_text = function(){return str(obj.responseText)}
    
    this.get_xml = function(){alert(obj.responseXML);return $DomElement(obj.responseXML)}
}

function $AjaxClass(){

    if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
        var $xmlhttp=new XMLHttpRequest();
    }else{// code for IE6, IE5
        var $xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    $xmlhttp.$ajax = this
    $xmlhttp.$requestTimer = null
    
    $xmlhttp.onreadystatechange = function(){
        // here, "this" refers to $xmlhttp, *not* to the $AjaxClass instance !!!
        var state = this.readyState
        var req = this.$ajax
        var timer = this.$requestTimer
        var obj = new $XmlHttpClass($xmlhttp)
        if(state===0 && 'on_uninitialized' in req){req.on_uninitialized(obj)}
        else if(state===1 && 'on_loading' in req){req.on_loading(obj)}
        else if(state===2 && 'on_loaded' in req){req.on_loaded(obj)}
        else if(state===3 && 'on_interactive' in req){req.on_interactive(obj)}
        else if(state===4 && 'on_complete' in req){
            if(timer !== null){window.clearTimeout(timer)}
            req.on_complete(obj)
        }
    }

    this.__getattr__ = function(attr){return getattr(this,attr)}
    
    this.__setattr__ = function(attr,value){setattr(this,attr,value)}

    this.open = function(method,url,async){
        $xmlhttp.open(method.value,url.value,$bool(async));
    }

    this.set_header = function(key,value){
        $xmlhttp.setRequestHeader(key.value,value.value)
    }
    
    this.send = function(params){
        // params is a Python dictionary
        if(!params || params.$keys.length==0){$xmlhttp.send();return}
        if(!$isinstance(params,dict)){throw new TypeError(
            "send() argument must be dictonary, not '"+$str(params.__class__)+"'")}
        var res = ''
        for(i=0;i<params.$keys.length;i++){
            res += $str(params.$keys[i])+'='+$str(params.$values[i])+'&'
        }
        res = res.substr(0,res.length-1)
        $xmlhttp.send(res)
    }

    // if no reply after requestTimeOut seconds, abort request
    // found at http://ajaxpatterns.org/XMLHttpRequest_Call#Detecting_Errors
    this.set_timeout = function(seconds,func){
        $xmlhttp.$requestTimer = setTimeout(
            function() {$xmlhttp.abort();func()}, 
            seconds.value*1000); 
    }
}

function ajax(){
    return new $AjaxClass()
}
