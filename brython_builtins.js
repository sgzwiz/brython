// global object with brython built-ins
__BRYTHON__ = new Object()
__BRYTHON__.__getattr__ = function(attr){return this[attr]}
__BRYTHON__.date = function(){
    if(arguments.length===0){return JSObject(new Date())}
    else if(arguments.length===1){return JSObject(new Date(arguments[0]))}
    else if(arguments.length===7){return JSObject(new Date(arguments[0],
        arguments[1]-1,arguments[2],arguments[3],
        arguments[4],arguments[5],arguments[6]))}
}
__BRYTHON__.has_local_storage = typeof(Storage)!=="undefined"
if(__BRYTHON__.has_local_storage){
    __BRYTHON__.local_storage = function(){return JSObject(localStorage)}
}
__BRYTHON__.has_json = typeof(JSON)!=="undefined"
__BRYTHON__.version_info = [1,1,"20130318-195129"]
__BRYTHON__.path = [] // path for .py modules