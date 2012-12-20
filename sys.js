sys = {
    __getattr__ : function(attr){
        if(attr in this){return this[attr]}
        else{$raise('AttributeError','module sys has no attribute '+attr)}},
    has_local_storage:typeof(Storage)!=="undefined",
    version_info:[1,0,"20121220-205850"]
}