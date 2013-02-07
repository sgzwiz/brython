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
    var root = $py2js(res,module)
    // insert module name as a JS object
    var mod_node = new $Node('expression')
    new $NodeJSCtx(mod_node,module+'= new object()')
    root.insert(0,mod_node)
    //stack.list.splice(0,0,['code',module+'= new object()'],['newline','\n'])
    // search for module-level names
    // functions and variables
    for(var i=1;i<root.children.length;i++){
        var node = root.children[i]
        console.log('child '+i+' '+node.context)
        var ctx = node.context.tree[0]
        if(ctx.type==='def'){
            node.context.tree=[]
            var assign = new $AssignCtx(new $IdCtx(new $ExprCtx(node.context,'func',false),module+'.'+ctx.name))
            ctx.name=''
            assign.tree[1]=ctx
            ctx.parent = assign
        }else if(ctx.type==='assign'){
            var left = ctx.tree[0]
            if(left.type==='expr'&&left.tree[0].type==='id'){
                console.log('reset id')
                left.tree[0].value=module+'.'+left.tree[0].value
            }
        }else{
            console.log('ctx type '+ctx.type)
        }
    }
    try{
        var js = root.to_js()
        eval(js)
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
