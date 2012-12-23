// cross-browser utility functions
function $getMouseOffset(target, ev){
    ev = ev || window.event;
    var docPos    = $getPosition(target);
    var mousePos  = $mouseCoords(ev);
    return {x:mousePos.x - docPos.x, y:mousePos.y - docPos.y};
}

function $getPosition(e){
    var left = 0;
    var top  = 0;
    var width = e.offsetWidth;
    var height = e.offsetHeight;

    while (e.offsetParent){
        left += e.offsetLeft;
        top  += e.offsetTop;
        e     = e.offsetParent;
    }

    left += e.offsetLeft;
    top  += e.offsetTop;

    return {left:left, top:top, width:width, height:height};
}

function $mouseCoords(ev){
    var posx = 0;
    var posy = 0;
    if (!ev) var ev = window.event;
    if (ev.pageX || ev.pageY){
        posx = ev.pageX;
        posy = ev.pageY;
    } else if (ev.clientX || ev.clientY){
        posx = ev.clientX + document.body.scrollLeft
            + document.documentElement.scrollLeft;
        posy = ev.clientY + document.body.scrollTop
            + document.documentElement.scrollTop;
    }
    var res = object()
    res.x = int(posx)
    res.y = int(posy)
    res.__getattr__ = function(attr){return this[attr]}
    res.__class__ = "MouseCoords"
    return res
}

// DOM classes

function $MouseEvent(ev){
    this.event = ev
    this.__class__ = "MouseEvent"
}
$MouseEvent.prototype.__getattr__ = function(attr){
    if(attr=="x"){return $mouseCoords(this.event).x}
    if(attr=="y"){return $mouseCoords(this.event).y}
    if(attr=="data"){return new $Clipboard(this.event.dataTransfer)}
    return getattr(this.event,attr)
}

function $DomWrapper(js_dom){
    this.value=js_dom
    this.__class__ = "$DomWrapper"
}

$DomWrapper.prototype.__getattr__ = function(attr){
    if(attr in this.value){
        var obj = this.value,obj_attr = this.value[attr]
        if(typeof this.value[attr]=='function'){
            return function(){
                var args = []
                for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
                var res = obj_attr.apply(obj,args)
                if(typeof res == 'object'){return new $DomWrapper(res)}
                else if(res===undefined){return None}
                else{return $JS2Py(res)}
            }
        }else{
            return $JS2Py(this.value[attr])
        }
    }else{
        $raise('AttributeError','object has no attribute '+attr)
    }
}

$DomWrapper.prototype.__setattr__ = function(attr,value){
    if(isinstance(value,"$DomWrapper")){
        this.value[attr]=value.value
    }else{
        this.value[attr]=value
    }
}

function $Clipboard(data){ // drag and drop dataTransfer
    this.data = data
    this.__class__ = "Clipboard"
}
$Clipboard.prototype.__getitem__ = function(name){
    return this.data.getData(name)
}
$Clipboard.prototype.__setitem__ = function(name,value){
    this.data.setData(name,value)
}
$Clipboard.prototype.__setattr__ = function(attr,value){
    eval("this.data."+attr+"=value")
}
function $DomObject(obj){
    this.obj=obj
    this.type = obj.constructor.toString()
}
$DomObject.prototype.__getattr__ = function(attr){
    return getattr(this.obj,attr)
}

function $OptionsClass(parent){ // parent is a SELECT tag
    this.parent = parent
    
    this.__getattr__ = function(attr){
        if('get_'+attr in this){return eval('this.get_'+attr)}
        if(attr in this.parent.elt.options){
            var obj = eval('this.parent.elt.options.'+attr)
            if((typeof obj)=='function'){
                $raise('AttributeError',"'options' object has no attribute '"+attr+'"')
            }
            return $JS2Py(obj)
        }
    }
    
    this.__class__ = 'options'

    this.__getitem__ = function(arg){
        return parent.options[arg]
    }
    this.__delitem__ = function(arg){
        parent.options.remove(arg)
    }

    this.__len__ = function() {return parent.options.length}

    this.__setattr__ = function(attr,value){
        parent.options[attr]=value
    }

    this.__setitem__ = function(attr,value){
        parent.options[attr]= $JS2Py(value)
    }

    this.get_append = function(element){
        parent.options.add(element)
    }

    this.get_insert = function(index,element){
        if(index===undefined){parent.options.add(element)}
        else{parent.options.add(element,index)}
    }

    this.get_item = function(index){
        return parent.options.item(index)
    }
    
    this.get_namedItem = function(name){
        return parent.options.namedItem(name)
    }
    
    this.get_remove = function(arg){parent.options.remove(arg)}
}

HTMLDocument.prototype.__delitem__ = function(key){
    if(typeof key==="string"){
        var res = document.getElementById(key)
        if(res){res.parentNode.removeChild(res)}
        else{$raise("KeyError",key)}
    }else{
        try{
            var elts=document.getElementsByTagName(key),res=list()
            for(var $i=0;$i<elts.length;$i++){res.append(elts[$i])}
            return res
        }catch(err){
            $raise("KeyError",key)
        }
    }
}

HTMLDocument.prototype.__getattr__ = function(attr){return getattr(this,attr)}

HTMLDocument.prototype.__getitem__ = function(key){
    if(typeof key==="string"){
        var res = document.getElementById(key)
        if(res){return res}
        else{$raise("KeyError",key)}
    }else{
        try{
            var elts=document.getElementsByTagName(key.name),res=[]
            for(var $i=0;$i<elts.length;$i++){res.push(elts[$i])}
            return res
        }catch(err){
            $raise("KeyError",str(key))
        }
    }
}

HTMLDocument.prototype.__le__ = function(other){
    if(isinstance(other,$AbstractTag)){
        var $i=0
        for($i=0;$i<other.children.length;$i++){
            document.body.appendChild(other.children[$i])
        }
    }else if(isinstance(other,[str,int,float,list,dict,set,tuple])){
        txt = document.createTextNode(str(other))
        document.body.appendChild(txt)
    } else {document.body.appendChild(other)}
}

HTMLDocument.prototype.__setattr__ = function(attr,value){
    if(attr in $events){document.addEventListener(attr.substr(2),value)}
    else{document[attr]=value}
}

doc = document

win = { 
    __getattr__ : function(attr){return getattr(window,attr)},
    location: {__getattr__:function(attr){return getattr(window.location,attr)}}
}

// classes to interact with DOM
function $AbstractTagClass(){
    // for abstract tags
    this.__class__ = $AbstractTag
    this._class_name = 'abstract'
    this.children = []
}
$AbstractTagClass.prototype.appendChild = function(child){    
    this.children.push(child)
}

$AbstractTagClass.prototype.__add__ = function(other){
    if(isinstance(other,$AbstractTag)){
        this.children = this.children.concat(other.children)
    }else if(isinstance(other,str)){
        this.children = this.children.concat(document.createTextNode(other))
    }else{this.children.push(other)}
    return this
}

$AbstractTagClass.prototype.__radd__ = function(other){
    var res = $AbstractTag()
    res.children = this.children.concat(document.createTextNode(other))
    return res
}

$AbstractTagClass.prototype.clone = function(){
    var res = $AbstractTag(), $i=0
    for($i=0;$i<this.children.length;$i++){
        res.children.push(this.children[$i].cloneNode(true))
    }
    return res
}

function $AbstractTag(){
    return new $AbstractTagClass()
}

$events = $List2Dict('onabort','onactivate','onafterprint','onafterupdate',
'onbeforeactivate','onbeforecopy','onbeforecut','onbeforedeactivate',
'onbeforeeditfocus','onbeforepaste','onbeforeprint','onbeforeunload',
'onbeforeupdate','onblur','onbounce','oncellchange','onchange','onclick',
'oncontextmenu','oncontrolselect','oncopy','oncut','ondataavailable',
'ondatasetchanged','ondatasetcomplete','ondblclick','ondeactivate','ondrag',
'ondragend','ondragenter','ondragleave','ondragover','ondragstart','ondrop',
'onerror','onerrorupdate','onfilterchange','onfinish','onfocus','onfocusin',
'onfocusout','onhashchange','onhelp','oninput','onkeydown','onkeypress',
'onkeyup','onload','onlosecapture','onmessage','onmousedown','onmouseenter',
'onmouseleave','onmousemove','onmouseout','onmouseover','onmouseup',
'onmousewheel','onmove','onmoveend','onmovestart','onoffline','ononline',
'onpaste','onpropertychange','onreadystatechange','onreset','onresize',
'onresizeend','onresizestart','onrowenter','onrowexit','onrowsdelete',
'onrowsinserted','onscroll','onsearch','onselect','onselectionchange',
'onselectstart','onstart','onstop','onsubmit','onunload',
// for smartphones
'ontouchstart','ontouchmove','ontouchend'
)

function $Tag(class_name,args){
    // represents an HTML tag
    var $i = null
    var elt = null
    if(class_name!==undefined){
        var elt = document.createElement(class_name)
        elt.parent = this
        elt.__class__ = class_name
    }
    if(args!=undefined && args.length>0){
        $start = 0
        $first = args[0]
        // if first argument is not a keyword, it's the tag content
        if(!isinstance($first,$Kw)){
            $start = 1
            if(isinstance($first,[str,int,float])){
                txt = document.createTextNode($first.toString())
                elt.appendChild(txt)
            } else if(isinstance($first,$AbstractTag)){
                for($i=0;$i<$first.children.length;$i++){
                    elt.appendChild($first.children[$i])
                }
            } else {
                try{elt.appendChild($first)}
                catch(err){$raise('ValueError','wrong element '+$first)}
            }
        }
        // attributes
        for($i=$start;$i<args.length;$i++){
            // keyword arguments
            $arg = args[$i]
            if(isinstance($arg,$Kw)){
                if($arg.name.toLowerCase().substr(0,2)==="on"){ // events
                    eval('elt.'+$arg.name.toLowerCase()+'=function(){'+$arg.value+'}')
                }else if($arg.name.toLowerCase()=="style"){
                    this.set_style($arg.value)
                } else {
                    if($arg.value!==false){
                        // option.selected=false sets it to true :-)
                        elt.setAttribute($arg.name.toLowerCase(),$arg.value)
                    }
                }
            }
        }
    }
    // if id was not set, generate one
    if(elt && !elt.getAttribute('id')){
        elt.setAttribute('id',Math.random().toString(36).substr(2, 8))
    }
    return elt
}

Node.prototype.__add__ = function(other){
    var res = $AbstractTag() // abstract tag
    res.children = [this]
    if(isinstance(other,$AbstractTag)){
        for(var $i=0;$i<other.children.length;$i++){res.children.push(other.children[$i])}
    } else if(isinstance(other,[str,int,float,list,dict,set,tuple])){
        res.children.push(document.createTextNode(str(other)))
    }else{res.children.push(other)}
    return res
}

Node.prototype.__eq__ = function(other){return this.isEqualNode(other)}

Node.prototype.__getattr__ = function(attr){
    if('get_'+attr in this){return this['get_'+attr]()}
    return getattr(this,attr)
}

Node.prototype.__getitem__ = function(key){
    return this.childNodes[key]
}

Node.prototype.__item__ = function(key){ // for iteration
    console.log('iterate on tag, item '+key+' '+this.childNodes[key])
    return this.childNodes[key]
}

Node.prototype.__le__ = function(other){
    if(isinstance(other,$AbstractTag)){
        var $i=0
        for($i=0;$i<other.children.length;$i++){
            this.appendChild(other.children[$i])
        }
    }else if(typeof other==="string" || typeof other==="number"){
        var $txt = document.createTextNode(other.toString())
        this.appendChild($txt)
    }else{
        this.appendChild(other)
    }
}

Node.prototype.__len__ = function(){return this.childNodes.length}

Node.prototype.__mul__ = function(other){
    if(isinstance(other,int) && other.valueOf()>0){
        var res = $AbstractTag()
        for(var i=0;i<other.valueOf();i++){
            var clone = this.get_clone()()
            res.children.push(clone)
        }
        return res
    }else{
        $raise('ValueError',"can't multiply "+this.__class__+"by "+other)
    }
}

Node.prototype.__ne__ = function(other){return $not(this.__eq__(other))}

Node.prototype.__radd__ = function(other){ // add to a string
    var res = $AbstractTag() // abstract tag
    var txt = document.createTextNode(other)
    res.children = [txt,this]
    return res        
}

Node.prototype.__setattr__ = function(attr,value){
    if(attr in $events){this.addEventListener(attr.substr(2),value)}
    else if('set_'+attr in this){return this['set_'+attr](value)}
    else if(attr in this){this[attr]=value}
    else{setattr(this,attr,value)}
}
    
Node.prototype.__setitem__ = function(key,value){
    this.childNodes[key]=value
}

Node.prototype.toString = function(){return this.get_html()}
    
Node.prototype.get_clone = function(){
    res = this.cloneNode(true)
    // copy events - may not work since there is no getEventListener()
    for(var evt in $events){    
        if(this[evt]){res[evt]=this[evt]}
    }
    var func = function(){return res}
    return func
}

Node.prototype.get_remove = function(child){
    this.removeChild(child)
}

Node.prototype.get_getContext = function(){ // for CANVAS tag
    if(!('getContext' in this)){$raise('AttributeError',
        "object has no attribute 'getContext'")}
    var obj = this
    return function(ctx){return new $DomWrapper(obj.getContext(ctx))}
}

Node.prototype.get_parent = function(){
    if(this.parentElement){return this.parentElement}
    else{return None}
}

Node.prototype.get_options = function(){ // for SELECT tag
    return new $OptionsClass(this)
}

Node.prototype.get_left = function(){
    return int($getPosition(this)["left"])
}

Node.prototype.get_top = function(){
    return int($getPosition(this)["top"])
}

Node.prototype.get_children = function(){
    var res = []
    for(var i=0;i<this.childNodes.length;i++){
        res.push(this.childNodes[i])
    }
    return res
}

Node.prototype.get_reset = function(){ // for FORM
    var $obj = this
    return function(){$obj.reset()}
}

Node.prototype.get_style = function(){
    return new $DomWrapper(this.style)
}
    
Node.prototype.set_style = function(style){ // style is a dict
    for(var i=0;i<style.$keys.length;i++){
        this.style[style.$keys[i]] = style.$values[i]
    }
}

Node.prototype.get_submit = function(){ // for FORM
    var $obj = this
    return function(){$obj.submit()}
}

Node.prototype.get_text = function(){
    return this.innerText || this.textContent
}
    
Node.prototype.get_html = function(){return this.innerHTML}

Node.prototype.get_value = function(value){return this.value}

Node.prototype.set_html = function(value){this.innerHTML=str(value)}

Node.prototype.set_text = function(value){
    this.innerText=str(value)
    this.textContent=str(value)
}

Node.prototype.set_value = function(value){this.value = value.toString()}

function A(){return $Tag('A',arguments)}

var $src = A+'' // source of function A
$tags = ['A', 'ABBR', 'ACRONYM', 'ADDRESS', 'APPLET',
            'B', 'BDO', 'BIG', 'BLOCKQUOTE', 'BUTTON',
            'CAPTION', 'CENTER', 'CITE', 'CODE',
            'DEL', 'DFN', 'DIR', 'DIV', 'DL',
            'EM', 'FIELDSET', 'FONT', 'FORM', 'FRAMESET',
            'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
            'I', 'IFRAME', 'INS', 'KBD', 'LABEL', 'LEGEND',
            'MAP', 'MENU', 'NOFRAMES', 'NOSCRIPT', 'OBJECT',
            'OL', 'OPTGROUP', 'PRE', 'Q', 'S', 'SAMP',
            'SCRIPT', 'SELECT', 'SMALL', 'SPAN', 'STRIKE',
            'STRONG', 'STYLE', 'SUB', 'SUP', 'TABLE',
            'TEXTAREA', 'TITLE', 'TT', 'U', 'UL',
            'VAR', 'BODY', 'COLGROUP', 'DD', 'DT', 'HEAD',
            'HTML', 'LI', 'P', 'TBODY','OPTION', 
            'TD', 'TFOOT', 'TH', 'THEAD', 'TR',
            'AREA', 'BASE', 'BASEFONT', 'BR', 'COL', 'FRAME',
            'HR', 'IMG', 'INPUT', 'ISINDEX', 'LINK',
            'META', 'PARAM']

// HTML5 tags
$tags = $tags.concat(['ARTICLE','ASIDE','FIGURE','FOOTER','HEADER','NAV',
    'SECTION','AUDIO','VIDEO','CANVAS','COMMAND','DATALIST',
    'DETAILS','OUTPUT','PROGRESS','HGROUP','MARK','METER','TIME',
    'RP','RT','RUBY'])

// create classes
for($i=0;$i<$tags.length;$i++){
    $code = $src.replace(/A/gm,$tags[$i])
    eval($code)
}
