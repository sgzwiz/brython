random = {
    __getattr__ : function(attr){return this[attr]},
    random:function(x){return float(Math.random())}
}
random.__class__ = $module // defined in $py_utils
random.__str__ = function(){return "<module 'random'>"}