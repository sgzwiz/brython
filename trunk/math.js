math = {
    __getattr__ : function(attr){return this[attr.value]},
    cos : function(x){return float(Math.cos(x.value))},
    floor:function(x){return int(Math.floor(x.value))},
    pi : float(Math.PI),
    sin : function(x){return float(Math.sin(x.value))},
    sqrt : function(x){return float(Math.sqrt(x.value))}
}
