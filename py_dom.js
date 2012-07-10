// DOM classes

// utility functions
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

    return {x:left, y:top, width:width, height:height};
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
    return{x:posx,y:posy}
}

function $StyleClass(parent){

    this.__getattr__ = function(attr){return $JS2Py(eval('parent.elt.style.'+attr.value))}

    this.__getitem__ = function(attr){return $JS2Py(parent.elt.style[attr.value])}

    this.__setattr__ = function(attr,value){eval('parent.elt.style.'+attr.value+'= $str(value)')}

    this.__setitem__ = function(attr,value){parent.elt.style[attr.value]= $str(value)}

}

function $OptionsClass(parent){ // parent is a SELECT tag

    this.__getattr__ = function(attr){
        if('get_'+attr.value in this){return eval('this.get_'+attr.value)}
        return $JS2Py(eval('parent.elt.options.'+attr.value))}

    this.__getitem__ = function(attr){
        return $DomElement(parent.elt.options[attr.value])
    }

    this.__len__ = function() {return int(parent.elt.options.length)}

    this.__setattr__ = function(attr,value){
        eval('parent.elt.options.'+attr.value+'= $str(value)')
    }

    this.__setitem__ = function(attr,value){
        parent.elt.options[attr.value]= $JS2Py(value)
    }

    this.get_add = function(element,index){
        if(index===undefined){parent.elt.options.add(element.elt)}
        else{parent.elt.options.add(element.elt,index.value)}
    }

    this.get_item = function(index){
        return $DomElement(parent.elt.options.item(index.value))
    }
    
    this.get_namedItem = function(name){
        return $DomElement(parent.elt.options.namedItem(name.value))
    }
    
    this.get_remove = function(arg){parent.elt.options.remove(arg.value)}
    
}

function log(data){try{console.log($str(data))}catch(err){void(0)}}

function $Document(){

    this.elt = document
    
    this.__le__ = function(other){
        if($isinstance(other,$AbstractTag)){
            var $i=0
            for($i=0;$i<other.children.length;$i++){
                document.body.appendChild(other.children[$i])
            }
        }else if($isinstance(other,list(str,int,float,list,dict,set,tuple))){
            txt = document.createTextNode($str(other))
            document.body.appendChild(txt)
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
    var $obj = this
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
                catch(err){throw new ValueError('wrong element '+$first.elt)}
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
                    this.elt.setAttribute($arg.name.toLowerCase(),$arg.value.value)
                }
            }
        }
    }
    // if id was not set, generate one
    if('elt' in this && !this.elt.getAttribute('id')){
        this.elt.setAttribute('id',Math.random().toString(36).substr(2, 8))
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

    this.__eq__ = function(other){
        if(!('getAttribute' in other.elt)){return False}
        return $bool_conv(this.elt.getAttribute('id')==other.elt.getAttribute('id'))
    }

    this.__getattr__ = function(attr){
        if('get_'+attr.value in this){return this['get_'+attr.value]()}
        else if(attr.value in this.elt){return $JS2Py(this.elt[attr.value])}
        return getattr(this,attr)
    }

    this.__getitem__ = function(key){
        return $JS2Py(this.elt[key.value])
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

    this.__le__ = function(other){
        if($isinstance(other,$AbstractTag)){
            var $i=0
            for($i=0;$i<other.children.length;$i++){
                this.elt.appendChild(other.children[$i])
            }
        } else {this.elt.appendChild(other.elt)}
    }
    
    this.__ne__ = function(other){return not(this.__eq__(other))}

    this.__radd__ = function(other){ // add to a string
        var res = $AbstractTag() // abstract tag
        var txt = document.createTextNode(other.value)
        res.children = [txt,this.elt]
        return res        
    }

    this.__setattr__ = function(attr,value){
        if(attr.value in $events){eval('this.elt.'+attr.value.toLowerCase()+'=value')}
        else if('set_'+attr.value in this){return this['set_'+attr.value](value)}
        else if(attr.value in this.elt){this.elt[attr.value]=value.value}
        else{setattr(this,attr,value)}
    }
    
    this.__setitem__ = function(key,value){
        this.elt.setAttribute($str(key),$str(value))
    }
    
    this.clone = function(){
        res = new TagClass(this.name)
        res.elt = this.elt.cloneNode(true)
        return res
    }

    this.get_parent = function(){
        if($obj.elt.parentElement){return $DomElement($obj.elt.parentElement)}
        else{return None}
    }

    this.get_options = function(){ // for SELECT tag
        return new $OptionsClass(this)
    }

    this.get_children = function(){
        var res = list()
        for(var i=0;i<$obj.elt.childNodes.length;i++){
            res.append($DomElement($obj.elt.childNodes[i]))
        }
        return res
    }

    this.get_reset = function(){ // for FORM
        var $obj = this.elt
        return function(){$obj.reset()}
    }

    this.get_style = function(){
        return new $StyleClass(this)
    }
    
    this.set_style = function(style){ // style is a dict
        for(var i=0;i<style.$keys.length;i++){
            this.elt.style[$str(style.$keys[i])] = $str(style.$values[i])
        }
    }

    this.get_submit = function(){ // for FORM
        var $obj = this.elt
        return function(){$obj.submit()}
    }

    this.get_text = function(){
        return str($obj.elt.innerText || $obj.elt.textContent)
    }
    
    this.get_html = function(){return str($obj.elt.innerHTML)}

    this.get_value = function(value){return str(this.elt.value)}

    this.make_draggable = function(target){
        // make element draggable and droppable into target
        // use HTML5 drag and drop features
        this.elt.draggable = true
        this.elt.onmouseover = function(ev){this.style.cursor="move"}
        this.elt.ondragstart = function(ev){
            ev.dataTransfer.setData("Text",ev.target.id)
            // some browsers disable access to data store in dragover
            // so we have to put dragged id in a global variable
            document.$drag_id = ev.target.id 
        }
        if(!('$accepted' in target.elt)){target.elt.$accepted={}}
        target.elt.$accepted[this.elt.id]=0
        target.elt.ondragover = function(ev){
            ev.preventDefault()
            if(!(document.$drag_id in this.$accepted)){
                ev.dataTransfer.dropEffect='none'
            }
        }
        target.elt.ondrop = function(ev){
            ev.preventDefault();
            var elt_id=ev.dataTransfer.getData("Text");
            if(elt_id in this.$accepted){
                ev.target.appendChild(document.getElementById(elt_id));
            }
        }
    }

    this.set_html = function(value){$obj.elt.innerHTML=$str(value)}

    this.set_value = function(value){this.elt.value = $str(value)}
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
            'SCRIPT', 'SELECT', 'SMALL', 'SPAN', 'STRIKE',
            'STRONG', 'STYLE', 'SUB', 'SUP', 'TABLE',
            'TEXTAREA', 'TITLE', 'TT', 'U', 'UL',
            'VAR', 'BODY', 'COLGROUP', 'DD', 'DT', 'HEAD',
            'HTML', 'LI', 'P', 'TBODY','OPTION', 
            'TD', 'TFOOT', 'TH', 'THEAD', 'TR',
            'AREA', 'BASE', 'BASEFONT', 'BR', 'COL', 'FRAME',
            'HR', 'IMG', 'INPUT', 'ISINDEX', 'LINK',
            'META', 'PARAM']

$tags = $tags.concat(['CIRCLE','ELLIPSE','SVG','TEXT','RECT'])

// create classes
for($i=0;$i<$tags.length;$i++){
    $code = $src.replace(/A/gm,$tags[$i])
    eval($code)
}

