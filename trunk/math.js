math = {
    __getattr__ : function(attr){
        var res = this[attr]
        if(res===undefined){$raise('AttributeError','module has no attribute '+attr)}
        return res
    },
    cos : function(x){return float(Math.cos(x.value))},
    floor:function(x){return int(Math.floor(x.value))},
    pi : float(Math.PI),
    sin : function(x){return float(Math.sin(x.value))},
    sqrt : function(x){return float(Math.sqrt(x.value))}
}
