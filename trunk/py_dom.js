// DOM classes

function $Document(){

    this.__le__ = function(other){
        if($isinstance(other,$AbstractTag)){
            var $i=0
            for($i=0;$i<other.children.length;$i++){
                document.body.appendChild(other.children[$i])
            }
        } else {document.body.appendChild(other.elt)}
    }
    
    this.insert_before = function(other,ref_elt){
        document.insertBefore(other.elt,ref_elt.elt)
    }

    this.__getitem__ = function(id){
        return $DomElement(document.getElementById(id.value))
    }

}

doc = new $Document()

function $DomElement(elt){
    var i = null
    var elt_name = elt.tagName
    if(elt_name===undefined && elt.nodeName=="#text"){ // text node
        return str(elt.data)
    }
    var obj = new $TagClass()
    if(elt_name===undefined && elt.nodeName=="#document"){ // document
        obj.__class__ = $Document
    }else{
        obj.__class__ = eval(elt_name)
    }
    obj.elt = elt
    return obj
}

// classes to interact with DOM
function $AbstractTagClass(){
    // for abstract tags
    this.__class__ = $AbstractTag
    this.children = []
    this.appendChild = function(child){    
        this.children.push(child)
    }

    this.__add__ = function(other){
        if($isinstance(other,$AbstractTag)){
            this.children = this.children.concat(other.children)
        } else {this.children.push(other.elt)}
        return this
    }        

   this.__iadd__ = function(other){
        if($isinstance(other,$AbstractTag)){
            this.children = this.children.concat(other.children)
        } else {this.children.push(other.elt)}
    }        

    this.clone = function(){
        var res = $AbstractTag(), $i=0
        for($i=0;$i<this.children.length;$i++){
            res.children.push(this.children[$i].cloneNode(true))
        }
        return res
    }
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
'onselectstart','onstart','onstop','onsubmit','onunload')

function $TagClass(_class,args){
    // represents an HTML tag
    var $i = null
    if(_class!=undefined){
        this.name = str(_class).value
        eval("this.__class__ ="+_class)
        this.elt = document.createElement(this.name)
    }
    if(args!=undefined && args.length>0){
        $start = 0
        $first = args[0]
        // if first argument is not a keyword, it's the tag content
        if(!$isinstance($first,$Kw)){
            $start = 1
            if($isinstance($first,str)){
                txt = document.createTextNode($first.value)
                this.elt.appendChild(txt)
            } else if($isinstance($first,int) || $isinstance($first,float)){
                txt = document.createTextNode($first.value.toString())
                this.elt.appendChild(txt)
            } else if($isinstance($first,$AbstractTag)){
                for($i=0;$i<$first.children.length;$i++){
                    this.elt.appendChild($first.children[$i])
                }
            } else {
                try{this.elt.appendChild($first.elt)}
                catch(err){$Exception('ValueError','wrong element '+$first.elt)}
            }
        }
        // attributes
        for($i=$start;$i<args.length;$i++){
            // keyword arguments
            $arg = args[$i]
            if($isinstance($arg,$Kw)){
                if($arg.name.toLowerCase() in $events){
                    eval('this.elt.'+$arg.name.toLowerCase()+'=function(){'+$arg.value.value+'}')
                } else {
                    this.elt.setAttribute($arg.name,$arg.value.value)
                }
            }
        }
    }
    // if not id was provided, generate one
    if('elt' in this){
        if(!this.elt.getAttribute('id')){ // '' for IE, null for Chrome and Firefox
            this.elt.setAttribute('id',Math.random().toString(36).substr(2, 8))
        }
    }

    this.__le__ = function(other){
        if($isinstance(other,$AbstractTag)){
            var $i=0
            for($i=0;$i<other.children.length;$i++){
                this.elt.appendChild(other.children[$i])
            }
        } else {this.elt.appendChild(other.elt)}
    }
    
    this.__add__ = function(other){
        var res = $AbstractTag() // abstract tag
        res.children = [this.elt]
        if($isinstance(other,$AbstractTag)){
            var $i=0
            for($i=0;$i<other.children.length;$i++){
                res.children.push(other.children[$i])
            }
        } else {res.children.push(other.elt)}
        return res
    }

    this.__radd__ = function(other){ // add to a string
        var res = $AbstractTag() // abstract tag
        var txt = document.createTextNode(other.value)
        res.children = [txt,this.elt]
        return res        
    }

    this.__iadd__ = function(other){
        this.__class__ = $AbstractTag // change to abstract tag
        this.children = [this.elt]
        if($isinstance(other,$AbstractTag)){
            for($i=0;$i<other.children.length;$i++){
                this.children.push(other.children[$i])
            }
        } else {this.children.push(other.elt)}
    }

    this.__eq__ = function(other){
        if(!('getAttribute' in other.elt)){return False}
        return $bool_conv(this.elt.getAttribute('id')==other.elt.getAttribute('id'))
    }

    this.__ne__ = function(other){return not(this.__eq__(other))}

    this.__getitem__ = function(key){
        return $JS2Py(this.elt[$str(key)])
    }
    
    this.__setitem__ = function(key,value){
        this.elt.setAttribute($str(key),$str(value))
    }
    
    this.clone = function(){
        res = new TagClass(this.name)
        res.elt = this.elt.cloneNode(true)
        return res
    }

    this.parent = function(){
        if(this.elt.parentElement){return $DomElement(this.elt.parentElement)}
        else{return None}
    }

    this.children = function(){
        var res = list()
        for(i=0;i<this.elt.childNodes.length;i++){
            res.append($DomElement(this.elt.childNodes[i]))
        }
        return res
    }

    this.text = function(){
        return str(this.elt.innerText || this.elt.textContent)
    }
    
    this.html = function(){return str(this.elt.innerHTML)}
    this.set_html = function(value){this.elt.innerHTML=$str(value)}

    this.show = function(){document.body.appendChild(this.elt)}
    
    this.value = function(){
        if(value in this.elt){return str(this.elt.value)}
        else{$Exception("AttributeError",
            "'"+$str(this.name)+"' object has no attribute 'value'")}
    }
}

function A(){
    var $args = [],$i=0
    for($i=0;$i<arguments.length;$i++){$args.push(arguments[$i])}
    return new $TagClass(A,$args)
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
            'SCRIPT', 'SMALL', 'SPAN', 'STRIKE',
            'STRONG', 'STYLE', 'SUB', 'SUP', 'TABLE',
            'TEXTAREA', 'TITLE', 'TT', 'U', 'UL',
            'VAR', 'BODY', 'COLGROUP', 'DD', 'DT', 'HEAD',
            'HTML', 'LI', 'P', 'TBODY','OPTION', 
            'TD', 'TFOOT', 'TH', 'THEAD', 'TR',
            'AREA', 'BASE', 'BASEFONT', 'BR', 'COL', 'FRAME',
            'HR', 'IMG', 'INPUT', 'ISINDEX', 'LINK',
            'META', 'PARAM']

$tags = $tags.concat(['CIRCLE','ELLIPSE','SVG','TEXT','RECT'])
            
for($i=0;$i<$tags.length;$i++){
    $code = $src.replace(/A/gm,$tags[$i])
    eval($code)
}
