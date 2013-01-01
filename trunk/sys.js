sys = {
    __getattr__ : function(attr){
        if(attr==="stdout"){return document.$stdout}
        if(attr==="stderr"){return document.$stderr}
        else if(attr in this){return this[attr]}
        else{$raise('AttributeError','module sys has no attribute '+attr)}},
    __setattr__ : function(attr,value){
        if(attr==="stdout"){document.$stdout=value}
        if(attr==="stderr"){document.$stderr=value}
    },
    has_local_storage:typeof(Storage)!=="undefined",
    version_info:[1,0,"20130101-143229"]
}