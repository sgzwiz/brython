// ajax
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
        if(state===0 && 'on_uninitialized' in req){
            req.on_uninitialized(str($xmlhttp.status),str($xmlhttp.responseText))
        }else if(state===1 && 'on_loading' in req){
            req.on_loading(str($xmlhttp.status),str($xmlhttp.responseText))
        }else if(state===2 && 'on_loaded' in req){
            req.on_loaded(str($xmlhttp.status),str($xmlhttp.responseText))
        }else if(state===3 && 'on_interactive' in req){
            req.on_interactive(str($xmlhttp.status),str($xmlhttp.responseText))
        }else if(state===4 && 'on_complete' in req){
            if(timer !== null){window.clearTimeout(timer)}
            req.on_complete(str($xmlhttp.status),str($xmlhttp.responseText))
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
        if(!$isinstance(params,dict)){$Exception("TypeError",
            "send() argument must be dictonary, not '"+$str(params.__class__)+"'")}
        var res = ''
        for(i=0;i<params.$keys.length;i++){
            res += $str(params.$keys[i])+'='+$str(params.$values[i])+'&'
        }
        res = res.substtr(0,res.length-1)
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

function unfold(periode,code_prog){

    xmlhttp.onreadystatechange=function(){
        $("progress").innerHTML = "sending, state "+xmlhttp.readyState
        if(xmlhttp.readyState==4){
            clearTimeout(requestTimer);
            if(xmlhttp.status==200){
                resp=xmlhttp.responseText;
                document.getElementById("progress").innerHTML = 'ok'
                elt = $('div'+code_prog)
                elt.innerHTML = resp
                toggler.innerHTML='-'
            } else {
                msg = '<b style="color:red;">Your changes could not been saved</b>'
                msg += ' - Error status '+xmlhttp.status
                document.getElementById("progress").innerHTML = msg
                trace(xmlhttp.responseText)
            }
        } else {
            document.getElementById("progress").style.visibility = "visible"
        }
    }
    params = "periode="+periode
    params += "&code_prog="+code_prog

    // if no reply after requestTimeOut seconds, abort request
    // found at http://ajaxpatterns.org/XMLHttpRequest_Call#Detecting_Errors
    requestTimeout = 7
    requestTimer = setTimeout(function() {
           xmlhttp.abort();
           msg = 'Server did not within '+requestTimeout+' seconds - abort request'
           document.getElementById("progress").innerHTML = msg
         }, requestTimeout*1000); 
    
    try{
        xmlhttp.open("POST","liste_projets",false);
        xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        xmlhttp.send(params);
    } catch(err) {
        document.getElementById("progress").innerHTML = "error "+err.description
        document.getElementById("progress").style.visibility = "visible" 
    }
}
