sys = {
    __getattr__ : function(attr){return this[attr]},
    has_local_storage:$bool_conv(typeof(Storage)!=="undefined"),
    version_info:tuple(int(1),int(0),str("20121209-171805"))
}