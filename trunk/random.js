random = {
    __getattr__ : function(attr){return this[attr.value]},
    random:function(x){return float(Math.random())}
}