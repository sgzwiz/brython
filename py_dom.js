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

function $Document(){

    this.elt = document
    
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
    // if id was not set, generate one
    if('elt' in this && !this.elt.getAttribute('id')){
        this.elt.setAttribute('id',Math.random().toString(36).substr(2, 8))
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
    
    this.__getattr__ = function(attr){
        if('get_'+attr.value in this){return this['get_'+attr.value]()}
        return getattr(this,attr)
    }
    this.__setattr__ = function(attr,value){
        if('set_'+attr.value in this){return this['set_'+attr.value](value)}
        return setattr(this,attr,value)
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

    this.get_children = function(){
        var res = list()
        for(i=0;i<$obj.elt.childNodes.length;i++){
            res.append($DomElement($obj.elt.childNodes[i]))
        }
        return res
    }

    this.get_text = function(){
        return str($obj.elt.innerText || $obj.elt.textContent)
    }
    
    this.get_html = function(){return str($obj.elt.innerHTML)}

    this.make_draggable = function(target){
        // make item draggable ; can be dropped into target
        // target must define a method to handle dropping
        if(target===undefined){$Exception("TypeError",
            "make_draggable() takes 1 argument, none given")}
        var obj = this
        var container = this.elt
        while(container){
            if(container===target.elt){break}
            container = container.parentElement
        }
        if(!container){container=document.body}
        var container_is_doc = container===document.body
        
        this.elt.onmouseup = function(ev){
            this.onmousemove = null
            if(target.$visited && 'on_drop' in target){ // drop in target
                target.on_drop(obj)
            }else{ // put back in initial position
                var pos = document.$initial_pos
                this.style.position = pos.position
                this.style.left = pos.left
                this.style.top = pos.top
                delete document.$initial_pos
            }
            delete document.$drag_object
        }
        this.elt.onmouseover = function(ev){this.style.cursor = "move"}
        this.elt.onmouseout = function(ev){
            this.style.cursor="default"
            this.onmousemove=null
        }
        this.elt.onmousedown = function(ev){
            document.$drag_object = this.elt // global variable for drop management
            var dd = $getPosition(this);
            document.$initial_pos = {'left':this.style.left,'top':this.style.top,
                'position':this.style.position}
            var mouseWhenDown = $mouseCoords(ev)
            if(!container_is_doc){alert('container');var containerDims = $getPosition(container)}
            var topWhenDown = this.style.top || '0px'
            var topWhenDown = parseInt(topWhenDown.substr(0,topWhenDown.length-1))
            var leftWhenDown = this.style.left || '0px'
            var leftWhenDown = parseInt(leftWhenDown.substr(0,leftWhenDown.length-1))
            if(target===doc){function inside(pos,elt){return true}}
            else{
                var tgDims = $getPosition(target.elt)
                var tg_left = tgDims.x,tg_right=tgDims.x+tgDims.width
                var tg_top = tgDims.y,tg_down=tgDims.y+tgDims.height
                function inside(pos,elt){
                    if(pos.x>=tg_left && pos.x<=tg_right &&
                        pos.y>=tg_top && pos.y<=tg_down){return true}
                    return false
                }
            }
            target.$visited = false

            this.onmousemove = function(ev){
                // here "this" is the DOM element
                var mousePos = $mouseCoords(ev);
                this.style.position = 'absolute';
                var dx = mousePos.x - mouseWhenDown.x
                var dy = mousePos.y - mouseWhenDown.y
                var new_top = topWhenDown+dy
                if(container_is_doc ||(new_top>=0 && new_top+dd.height<containerDims.height)){ 
                    this.style.top = new_top
                } else {
                    this.onmousemove=null
                    document.$drag_object = null
                    return
                }
                var new_left = leftWhenDown+dx
                if(container_is_doc ||(new_left>=0 && new_left+dd.width<containerDims.width)){
                    this.style.left = new_left;
                } else {
                    this.onmousemove=null
                    document.$drag_object = null
                    return
                }
                var is_inside = inside(mousePos,target.elt)
                if(is_inside){
                    if(!target.$visited && 'on_enter' in target){target.on_enter(obj)}
                    target.$visited = true
                }else if(target.$visited){
                    if('on_leave' in target){target.on_leave(obj)}
                    target.$visited = false
                }
                return false;
            }
        }
    }

    this.set_html = function(value){$obj.elt.innerHTML=$str(value)}

    this.value = function(){
        if(value in $obj.elt){return str($obj.elt.value)}
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
            
for($i=0;$i<$tags.length;$i++){
    $code = $src.replace(/A/gm,$tags[$i])
    eval($code)
}
