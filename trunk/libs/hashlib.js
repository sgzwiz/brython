$module = {
    __getattr__ : function(attr){
        if (attr == 'new') {return $new;}
        return this[attr]
    },
    md5 : $md5,
    algorithms_guaranteed: ['md5'],
    algorithms_available: ['md5']
}

function $new(args) {
    if(args.length>1){$raise('TypeError',"Too many arguments:"+args.length)}

    if (args[0] === 'md5') return new $md5();
}

function $get_CryptoJS_lib(alg) {
   var imp=$importer()
   var $xmlhttp=imp[0], fake_qs=imp[1], timer=imp[2], res=null

   $xmlhttp.onreadystatechange = function(){
        if($xmlhttp.readyState==4){
            window.clearTimeout(timer)
            if($xmlhttp.status==200 || $xmlhttp.status==0){res=$xmlhttp.responseText}
            else{
                // don't throw an exception here, it will not be caught (issue #30)
                res = Error()
                res.name = 'NotFoundError'
                res.message = "No CryptoJS lib named '"+alg+"'"
            }
        }
   }

   $xmlhttp.open('GET', document.$brython_path+'libs/crypto_js/components/'+alg+'.js'+fake_qs,false)
   if('overrideMimeType' in $xmlhttp){$xmlhttp.overrideMimeType("text/plain")}
   $xmlhttp.send()
   if(res.constructor===Error){throw res} // module not found

   try{
      if (alg === 'core') {
        eval(res + "; document.CryptoJS=CryptoJS;")
      } else {
        eval("CryptoJS=document.CryptoJS; " + res)
      }
   } catch (err) { 
      throw Error("JS Eval Error", "Cannot eval CryptoJS algorithm '" + alg + "' : error:" + err);
   }
}

function $md5(){

    //if(args.length>1){$raise('TypeError',"Too many arguments:"+args.length)}

    if (document.CryptoJS === undefined) {
       $get_CryptoJS_lib('core');
    }

    if (document.CryptoJS.algo === undefined
        || document.CryptoJS.algo.MD5 === undefined) {
       $get_CryptoJS_lib('md5')
    }

    var hash = document.CryptoJS.algo.MD5.create()
    
    this.__class__ = $type

    this.__getattr__ = function(attr){return $getattr(this,attr)}
    
    this.__str__ = function(){return this.hexdigest();}
    this.update = function (msg) { hash.update(msg);}
    this.hexdigest = function() {
        var temp=hash.clone();
        temp=temp.finalize();
        //return hash.toString(document.CryptoJS.enc.Hex);
        return temp.toString();
    }
    return this;
}

$module.__class__ = $module
$module.__str__ = function() {return "<module 'hashlib'>"}
