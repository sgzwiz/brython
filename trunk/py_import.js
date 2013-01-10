// import modules

function $importer(){
    // returns the XMLHTTP object to handle imports
    if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
        var $xmlhttp=new XMLHttpRequest();
    }else{// code for IE6, IE5
        var $xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    // we must add a fake query string to force the browser to execute the
    // request - some use the cache after the first request
    var fake_qs = '?foo='+Math.random().toString(36).substr(2,8)
    var timer = setTimeout( function() {
        $xmlhttp.abort()
        $raise('NotFoundError',"No module named '"+module+"'")}, 5000)
    return [$xmlhttp,fake_qs,timer]
}

function $import_js(module,alias){
    // import JS modules in folder /libs
    var imp = $importer()
    var $xmlhttp = imp[0],fake_qs=imp[1],timer=imp[2],res=null
    $xmlhttp.onreadystatechange = function(){
        if($xmlhttp.readyState==4){
            window.clearTimeout(timer)
            if($xmlhttp.status==200 || $xmlhttp.status==0){res=$xmlhttp.responseText}
            else{
                // don't throw an exception here, it will not be caught (issue #30)
                res = Error()
                res.name = 'NotFoundError'
                res.message = "No module named '"+module+"'"
            }
        }
    }
    $xmlhttp.open('GET',document.$brython_path+'libs/'+module+'.js'+fake_qs,false)
    if('overrideMimeType' in $xmlhttp){$xmlhttp.overrideMimeType("text/plain")}
    $xmlhttp.send()
    if(res.constructor===Error){throw res} // module not found
    try{
        eval(res)
        // check that module name is in namespace
        if(eval('$module')===undefined){
            $raise('ImportError',"name '$module' is not defined in module")
        }
        if(alias===undefined){alias=module}
        eval(alias+'=$module')
        // add class and __str__
        eval(alias+'.__class__ = $type')
        eval(alias+'.__str__ = function(){return "<module \''+module+"'>\"}")
    }catch(err){$raise('ImportError',err.message)}
}

function $import_py(module){
    // import Python modules, in the same folder as the HTML page with
    // the Brython script
    var imp = $importer()
    var $xmlhttp = imp[0],fake_qs=imp[1],timer=imp[2],res=null
    $xmlhttp.onreadystatechange = function(){
        if($xmlhttp.readyState==4){
            window.clearTimeout(timer)
            if($xmlhttp.status==200 || $xmlhttp.status==0){res=$xmlhttp.responseText}
            else{
                // don't throw an exception here, it will not be caught (issue #30)
                res = Error('NotFoundError',"No module named '"+module+"'")
            }
        }
    }
    $xmlhttp.open('GET',module+'.py'+fake_qs,false)
    $xmlhttp.send()
    if(res.constructor===Error){throw res} // module not found
    var stack = $py2js(res,module)
    // insert module name as a JS object
    stack.list.splice(0,0,['code',module+'= new object()'],['newline','\n'])
    // search for module-level names
    // functions
    var $pos=0           
    while(true){
        var $mlname_pos = stack.find_next_at_same_level($pos,"keyword","function")
        if($mlname_pos===null){break}
        var $func_name = stack.list[$mlname_pos+1][1]
        stack.list.splice($mlname_pos,2,['code',module+'.'+$func_name+"=function"])
        // modify declaration at the end of function
        var br_pos = stack.find_next($mlname_pos,'bracket','{')
        var br_end = stack.find_next_matching(br_pos)
        var $fend = stack.find_next(br_end,"func_end")
        var $fend_code = stack.list[$fend][1]
        $fend_code = module+'.'+$fend_code.substr(1)
        $pv_pos = $fend_code.search(';')
        $fend_code = ";"+$fend_code.substr(0,$pv_pos)
        stack.list[$fend][1] = $fend_code
        $pos = $mlname_pos+1
    }
    // variables
    var $pos=0           
    while(true){
        var $mlname_pos = stack.find_next_at_same_level($pos,"assign_id")
        if($mlname_pos===null){break}
        stack.list[$mlname_pos][1]=module+'.'+stack.list[$mlname_pos][1]
        $pos = $mlname_pos+1
    }
    try{
        eval(stack.to_js())
        // add class and __str__
        eval(module+'.__class__ = $type')
        eval(module+'.__str__ = function(){return "<module \''+module+"'>\"}")
    }catch(err){
        $raise(err.name,err.message)
    }
}

$import_funcs = [$import_js,$import_py]
function $import(module){
    for(var i=0;i<$import_funcs.length;i++){
        try{$import_funcs[i](module);return}
        catch(err){
            if(err.name==="NotFoundError"){
                if(i==$import_funcs.length-1){
                    $raise('ImportError',"no module named '"+module+"'")
                }else{
                    continue
                }
            }else{throw(err)}
        }
    }
}

function $import_from(module,names){
    
}
