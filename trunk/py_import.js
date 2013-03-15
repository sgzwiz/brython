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
        throw ImportError("No module named '"+module+"'")}, 5000)
    return [$xmlhttp,fake_qs,timer]
}

function $import_js(module,alias,names){
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
    $xmlhttp.open('GET',__BRYTHON__.brython_path+'libs/'+module+'.js'+fake_qs,false)
    if('overrideMimeType' in $xmlhttp){$xmlhttp.overrideMimeType("text/plain")}
    $xmlhttp.send()
    if(res.constructor===Error){throw res} // module not found
    try{
        eval(res)
        // check that module name is in namespace
        if(eval('$module')===undefined){
            throw ImportError("name '$module' is not defined in module")
        }
       
        if(names===undefined){
            if(alias===undefined){alias=module}
            eval(alias+'=$module')

            // add class and __str__
            eval(alias+'.__class__ = $type')
            eval(alias+'.__str__ = function(){return "<module \''+module+"'>\"}")
            eval(alias+'.__file__ = "' +document.$brython_path+'libs/'+ module + '.js"')
        }else{
            if(names.length===1 && names[0]==='*'){
                for(var name in $module){
                    if(name.substr(0,1)==='_'){continue}
                    eval(name+'=$module[name]')
                }
            }else{
                if (alias !== undefined) {
                  for(var i=0;i<names.length;i++){
                    if (alias[i] !== undefined) {
                       eval(alias[i]+'=$module[names[i]]')
                    } else {
                       eval(names[i]+'=$module[names[i]]')
                    }
                  }
                } else {
                  for(var i=0;i<names.length;i++){
                    eval(names[i]+'=$module[names[i]]')
                  }
                }
            }
        }
    }catch(err){throw ImportError(err.message)}
}

function $import_py_search_path(module,alias,names){
    // try all paths in __BRYTHON__.path
    var modnames = [module, '__init__']
    for(var i=0;i<__BRYTHON__.path.length;i++){
       for(var j=0; j < modnames.length; j++) {
           var path = __BRYTHON__.path[i]
           if (modnames[j] == '__init__') path += '/' + module

           try {
             $import_py(module,alias,names,path)
             return
           }catch(err){
             if(err.name!=='ImportError'){throw err}
           }
       }
    }
    // if we get here, we couldn't import the module
    throw ImportError("No module named '"+module+"'")
}

function $import_py(module,alias,names,path){
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
                res = Error('ImportError',"No module named '"+module+"'")
            }
        }
    }
   
    
    var module_path= path+'/'+module+'.py'
    $xmlhttp.open('GET', module_path+fake_qs,false)
    $xmlhttp.send()

    if(res.constructor===Error){res.name='ImportError';throw res} // module not found

    document.$py_module_path[module]=module_path
    var root = __BRYTHON__.py2js(res,module)
    var body = root.children
    root.children = []
    // use the module pattern : module name returns the results of an anonymous function
    var mod_node = new $Node('expression')
    if(names!==undefined){alias='$module'}
    new $NodeJSCtx(mod_node,alias+'=(function()')
    root.insert(0,mod_node)
    mod_node.children = body
    // search for module-level names : functions, classes and variables
    var mod_names = []
    for(var i=1;i<mod_node.children.length;i++){
        var node = mod_node.children[i]
        // use function get_ctx() 
        // because attribute 'context' is renamed by make_dist...
        var ctx = node.get_ctx().tree[0]
        if(ctx.type==='def'||ctx.type==='class'){
            if(mod_names.indexOf(ctx.name)===-1){mod_names.push(ctx.name)}
            
        }else if(ctx.type==='assign'){
            var left = ctx.tree[0]
            if(left.type==='expr'&&left.tree[0].type==='id'&&left.tree[0].tree.length===0){
                var id_name = left.tree[0].value
                if(mod_names.indexOf(id_name)===-1){mod_names.push(id_name)}
            }
        }
    }
    // create the object that will be returned when the anonymous function is run
    var ret_code = 'return {'
    for(var i=0;i<mod_names.length;i++){
        ret_code += mod_names[i]+':'+mod_names[i]+','
    }
    ret_code += '__getattr__:function(attr){return this[attr]},'
    ret_code += '__setattr__:function(attr,value){this[attr]=value}'
    ret_code += '}'
    var ret_node = new $Node('expression')
    new $NodeJSCtx(ret_node,ret_code)
    mod_node.add(ret_node)
    // add parenthesis for anonymous function execution
    
    var ex_node = new $Node('expression')
    new $NodeJSCtx(ex_node,')()')
    root.add(ex_node)
    
    if(names!==undefined){
        if(names.length===1 && names[0]==='*'){
            var new_node = new $Node('expression')
            new $NodeJSCtx(new_node,'for(var $attr in $module)')
            root.add(new_node)
            var attr_node = new $Node('expression')
            new $NodeJSCtx(attr_node,'if($attr.charAt(0)!=="_"){eval($attr+"=$module[$attr]")}')
            new_node.add(attr_node)
        }else{
            if (alias !== undefined) {
              for(var i=0;i<names.length;i++){
                 var new_node = new $Node('expression')
                 new $NodeJSCtx(new_node,alias[i]+'=$module.'+names[i])
                 root.add(new_node)
              }
            } else {
              for(var i=0;i<names.length;i++){
                 var new_node = new $Node('expression')
                 new $NodeJSCtx(new_node,names[i]+'=$module.'+names[i])
                 root.add(new_node)
              }
            }
        }
    }
    
    try{
        var js = root.to_js()
        eval(js)
        // add class and __str__
        eval(alias+'.__class__ = $type')
        eval(alias+'.__str__ = function(){return "<module \''+module+"'>\"}")
        eval(alias+'.__file__ = "' + module_path + '"')
    }catch(err){
        eval('throw '+err.name+'(err.message)')
    }
}

$import_funcs = [$import_js,$import_py_search_path]

function $import_single(name,alias,names){
    for(var j=0;j<$import_funcs.length;j++){
        console.log(names);
        try{$import_funcs[j](name,alias,names);return}
        catch(err){
            if(err.name==="NotFoundError"){
                if(j==$import_funcs.length-1){
                    throw ImportError("no module named '"+name+"'")
                }else{
                    continue
                }
            }else{throw(err)}
        }
    }
}

function $import_list(modules){ // list of objects with attributes name and alias
    for(var i=0;i<modules.length;i++){
        var module = modules[i][0]
        $import_single(modules[i][0],modules[i][1])
        document.$py_module_alias[modules[i][0]]=modules[i][1]
    }
}

function $import_from(module,names,parent_module,alias){
    var relpath;

    if (parent_module !== undefined) {
       //this is a relative path import
       // ie,  from .mymodule import a,b,c
       //get parent module

       //throw ImportError('from .. import .. not supported yet');

       relpath=document.$py_module_path[parent_module];
       var i=relpath.lastIndexOf('/');
       relpath=relpath.substring(0, i);
    
       alias=document.$py_module_alias[parent_module];
       //console.log(parent_module+','+alias+','+relpath);
    } else if (alias !== undefined) {
       $import_single(module,alias,names)
    } else {
       $import_single(module,module,names)
    }
}
