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

// class for all DOM objects
function DOMObject(){}
DOMObject.__class__ = $type
DOMObject.toString = function(){return "<class 'DOMObject'>"}

$DOMtoString = function(){
    var res = "<DOMObject object type '" 
    return res+$NodeTypes[this.nodeType]+"' name '"+this.nodeName+"'>"
}

// DOM node types
$NodeTypes = {1:"ELEMENT",
    2:"ATTRIBUTE",
    3:"TEXT",
    4:"CDATA_SECTION",
    5:"ENTITY_REFERENCE",
    6:"ENTITY",
    7:"PROCESSING_INSTRUCTION",
    8:"COMMENT",
    9:"DOCUMENT",
    10:"DOCUMENT_TYPE",
    11:"DOCUMENT_FRAGMENT",
    12:"NOTATION"
}

function DOMEvent(){}
DOMEvent.__class__ = $type
DOMEvent.toString = function(){return "<class 'DOMEvent'>"}

function $DOMEvent(ev){
    // wrapper for events for browsers that don't support addEventListener
    // and get the event object from window.event
    ev.__class__ = DOMEvent
    ev.__getattr__ = function(attr){return $JS2Py(ev[attr])}
    ev.preventDefault = function(){ev.returnValue=false}
    ev.stopPropagation = function(){ev.cancelBubble=true}
    ev.toString = function(){return '<DOMEvent object>'}
    return ev
}

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

function $OptionsClass(parent){ 
    // class for collection "options" of a SELECT tag
    // implements Python list interface
    this.parent = parent
    
    this.__getattr__ = function(attr){
        if('get_'+attr in this){return eval('this.get_'+attr)}
        if(attr in this.parent.elt.options){
            var obj = eval('this.parent.options.'+attr)
            if((typeof obj)=='function'){
                $raise('AttributeError',"'options' object has no attribute '"+attr+'"')
            }
            return $JS2Py(obj)
        }
    }
    
    this.__class__ = 'options'

    this.__getitem__ = function(key){
        return $DomObject(parent.options[key])
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

document.__class__ = DOMObject

document.__delitem__ = function(key){
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

document.__getattr__ = function(attr){return getattr(this,attr)}

document.__getitem__ = function(key){
    if(typeof key==="string"){
        var res = document.getElementById(key)
        if(res){return $DomObject(res)}
        else{$raise("KeyError",key)}
    }else{
        try{
            var elts=document.getElementsByTagName(key.name),res=[]
            for(var $i=0;$i<elts.length;$i++){res.push($DomObject(elts[$i]))}
            return res
        }catch(err){
            $raise("KeyError",str(key))
        }
    }
}

document.__item__ = function(i){
    var res = $DomObject(document.childNodes[i])
    return res
}

document.__le__ = function(other){
    if(isinstance(other,$TagSum)){
        var $i=0
        for($i=0;$i<other.children.length;$i++){
            document.body.appendChild(other.children[$i])
        }
    }else if(isinstance(other,[str,int,float,list,dict,set,tuple])){
        txt = document.createTextNode(str(other))
        document.body.appendChild(txt)
    } else {document.body.appendChild(other)}
}

document.__len__ = function(){return document.childNodes.length}

document.__setattr__ = function(attr,value){
    if(attr in $events){
        // value is a function taking an event as argument
        if(window.addEventListener){document.addEventListener(attr.substr(2),value)}
        else if(window.attachEvent){
            var callback = function(ev){return value($DOMEvent(window.event))}
            document.attachEvent(attr,callback)
        }
    }
    else{document[attr]=value}
}

document.toString = $DOMtoString

doc = document

function $Location(){
    var obj = new object()
    for(var x in window.location){obj[x]=window.location[x]}
    obj.__class__ = new $class(this,'Location')
    obj.toString = function(){return window.location.toString()}
    return obj
}

win = { 
    __getattr__ : function(attr){
        if(attr=='location'){return $Location()}
        return getattr(window,attr)
   }
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

// some browsers don't support the Node object
$hasNode = (typeof Node==="object")
if($hasNode){
    function $DomObject(elt){
        elt.__class__ = DOMObject
        elt.toString = $DOMtoString
        return elt
    }
}else{
    function Node(){} // define a Node object
    function $DomObject(elt){ 
        // returns the element, enriched with an attribute $brython_id for 
        // equality testing and with all the attributes of Node
        if(!('$brython_id' in elt)){
            // add a unique id for comparisons
            elt.$brython_id=Math.random().toString(36).substr(2, 8)
            // add attributes of Node to element
            for(var attr in Node.prototype){elt[attr]=Node.prototype[attr]}
            elt.toString = $DOMtoString
        }
        return elt
    }
}

Node.prototype.__add__ = function(other){
    // adding another element to self returns an instance of $TagSum
    var res = $TagSum()
    res.children = [this]
    if(isinstance(other,$TagSum)){
        for(var $i=0;$i<other.children.length;$i++){res.children.push(other.children[$i])}
    } else if(isinstance(other,[str,int,float,list,dict,set,tuple])){
        res.children.push(document.createTextNode(str(other)))
    }else{res.children.push(other)}
    return res
}

Node.prototype.__class__ = DOMObject

Node.prototype.__delitem__ = function(key){
    this.removeChild(this.childNodes[key])
}

Node.prototype.__eq__ = function(other){
    if('isEqualNode' in this){return this.isEqualNode(other)}
    else if('$brython_id' in this){return this.$brython_id===other.$brython_id}
    else{$raise('NotImplementedError','__eq__ is not implemented')}
}

Node.prototype.__getattr__ = function(attr){
    if('get_'+attr in this){return this['get_'+attr]()}
    return getattr(this,attr)
}

Node.prototype.__getitem__ = function(key){
    return $DomObject(this.childNodes[key])
}

Node.prototype.__in__ = function(other){return other.__contains__(this)}

Node.prototype.__item__ = function(key){ // for iteration
    return $DomObject(this.childNodes[key])
}

Node.prototype.__le__ = function(other){
    if(isinstance(other,$TagSum)){
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
        var res = $TagSum()
        for(var i=0;i<other.valueOf();i++){
            var clone = this.get_clone()()
            res.children.push(clone)
        }
        return res
    }else{
        $raise('ValueError',"can't multiply "+this.__class__+"by "+other)
    }
}

Node.prototype.__ne__ = function(other){return !this.__eq__(other)}

Node.prototype.__radd__ = function(other){ // add to a string
    var res = $TagSum()
    var txt = document.createTextNode(other)
    res.children = [txt,this]
    return res        
}

Node.prototype.__setattr__ = function(attr,value){
    if(attr.substr(0,2)=='on'){ // event
        // value is a function taking an event as argument
        if(window.addEventListener){this.addEventListener(attr.substr(2),value)}
        else if(window.attachEvent){
            var callback = function(ev){return value($DOMEvent(window.event))}
            this.attachEvent(attr,callback)
        }
    }else if('set_'+attr in this){return this['set_'+attr](value)}
    else if(attr in this){this[attr]=value}
    else{setattr(this,attr,value)}
}
    
Node.prototype.__setitem__ = function(key,value){
    this.childNodes[key]=value
}

Node.prototype.get_clone = function(){
    res = $DomObject(this.cloneNode(true))
    // copy events - may not work since there is no getEventListener()
    for(var evt in $events){    
        if(this[evt]){res[evt]=this[evt]}
    }
    var func = function(){return res}
    return func
}

Node.prototype.get_remove = function(){
    var obj = this
    return function(child){obj.removeChild(child)}
}

Node.prototype.get_getContext = function(){ // for CANVAS tag
    if(!('getContext' in this)){$raise('AttributeError',
        "object has no attribute 'getContext'")}
    var obj = this
    return function(ctx){return new $DomWrapper(obj.getContext(ctx))}
}

Node.prototype.get_parent = function(){
    if(this.parentElement){return $DomObject(this.parentElement)}
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
        res.push($DomObject(this.childNodes[i]))
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

// creation of an HTML element
function $Tag(tagName,args){
    // cl
    var $i = null
    var elt = null
    var elt = $DomObject(document.createElement(tagName))
    elt.parent = this
    if(args!=undefined && args.length>0){
        $start = 0
        $first = args[0]
        // if first argument is not a keyword, it's the tag content
        if(!isinstance($first,$Kw)){
            $start = 1
            if(isinstance($first,[str,int,float])){
                txt = document.createTextNode($first.toString())
                elt.appendChild(txt)
            } else if(isinstance($first,$TagSum)){
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
                    elt.set_style($arg.value)
                } else {
                    if($arg.value!==false){
                        // option.selected=false sets it to true :-)
                        elt.setAttribute($arg.name.toLowerCase(),$arg.value)
                    }
                }
            }
        }
    }
    return elt
}

function A(){return $Tag('A',arguments)}

// class used for tag sums
function $TagSumClass(){
    this.__class__ = $TagSum
    this.children = []
}
$TagSumClass.prototype.appendChild = function(child){    
    this.children.push(child)
}

$TagSumClass.prototype.__add__ = function(other){
    if(isinstance(other,$TagSum)){
        this.children = this.children.concat(other.children)
    }else if(isinstance(other,str)){
        this.children = this.children.concat(document.createTextNode(other))
    }else{this.children.push(other)}
    return this
}

$TagSumClass.prototype.__radd__ = function(other){
    var res = $TagSum()
    res.children = this.children.concat(document.createTextNode(other))
    return res
}

$TagSumClass.prototype.clone = function(){
    var res = $TagSum(), $i=0
    for($i=0;$i<this.children.length;$i++){
        res.children.push(this.children[$i].cloneNode(true))
    }
    return res
}

function $TagSum(){
    return new $TagSumClass()
}


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
