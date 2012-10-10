// localStorage

function $LocalStorageClass(){
    this.__class__ = 'localStorage'
    this.supported = typeof(Storage)!=="undefined"

    this.__delitem__ = function(key){
        if(this.supported){localStorage.removeItem(key.value)}
        else{$raise('NameError',"local storage is not supported by this browser")}
   }

    this.__getitem__ = function(key){
        if(this.supported){
            res = localStorage[key.value]
            if(res===undefined){return None}
            else{return $JS2Py(res)}
        }
        else{$raise('NameError',"local storage is not supported by this browser")}
   }

    this.__setitem__ = function(key,value){
        if(this.supported){localStorage[key.value]=value.value}
        else{$raise('NameError',"local storage is not supported by this browser")}
   }
    
}

local_storage = new $LocalStorageClass()
