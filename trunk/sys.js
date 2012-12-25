sys = {
    __getattr__ : function(attr){
        if(attr==="stdout"){return $stdout}
        if(attr==="stderr"){return $stderr}
        else if(attr in this){return this[attr]}
        else{$raise('AttributeError','module sys has no attribute '+attr)}},
    __setattr__ : function(attr,value){
        if(attr==="stdout"){$stdout=value}
        if(attr==="stderr"){$stderr=value}
    },
    has_local_storage:typeof(Storage)!=="undefined",
    version_info:[1,0,"20121225-174458"]
}