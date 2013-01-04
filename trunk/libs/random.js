random = {
    __getattr__ : function(attr){return this[attr]},
    random:function(x){return float(Math.random())}
}