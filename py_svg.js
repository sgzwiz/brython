SVG = {
    __getattr__:function(attr){console.log('get attribute '+attr+' '+this[attr]);return this[attr]}
}

$svgNS = "http://www.w3.org/2000/svg"
$xlinkNS = "http://www.w3.org/1999/xlink"

function $SVGTagClass(_class,args){
    // represents an HTML tag
    console.log('svg tag '+_class)
    var $i = null
    var $obj = this
    if(_class!==undefined){
        this.name = str(_class).value
        eval("this.__class__ =_class")
        this.elt = document.createElementNS($svgNS,this.name)
        this.elt.parent = this
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
                catch(err){$raise('ValueError','wrong element '+$first.elt)}
            }
        }
        // attributes
        for($i=$start;$i<args.length;$i++){
            // keyword arguments
            $arg = args[$i]
            if($isinstance($arg,$Kw)){
                if($arg.name.toLowerCase() in $events){ // events
                    eval('this.elt.'+$arg.name.toLowerCase()+'=function(){'+$arg.value.value+'}')
                }else if($arg.name.toLowerCase()=="style"){
                    this.set_style($arg.value)
                } else {
                    if($arg.value.value!==false){
                        // option.selected=false sets it to true :-)
                        this.elt.setAttributeNS(null,$arg.name.toLowerCase(),$arg.value.value)
                    }
                }
            }
        }
    }
    // if id was not set, generate one
    if('elt' in this && !this.elt.getAttribute('id')){
        this.elt.setAttribute('id',Math.random().toString(36).substr(2, 8))
    }
}

$SVGTagClass.prototype.__add__ = $TagClass.prototype.__add__
$SVGTagClass.prototype.__eq__ = $TagClass.prototype.__eq__
$SVGTagClass.prototype.__getattr__ = $TagClass.prototype.__getattr__
$SVGTagClass.prototype.__getitem__ = $TagClass.prototype.__getitem__
$SVGTagClass.prototype.__iadd__ = $TagClass.prototype.__iadd__
$SVGTagClass.prototype.__ne__ = $TagClass.prototype.__ne__
$SVGTagClass.prototype.__radd__ = $TagClass.prototype.__radd__
$SVGTagClass.prototype.__setattr__ = $TagClass.prototype.__setattr__
$SVGTagClass.prototype.__setitem__ = $TagClass.prototype.__setitem__

// SVG
var $svg_tags = ['a',
'altGlyph',
'altGlyphDef',
'altGlyphItem',
'animate',
'animateColor',
'animateMotion',
'animateTransform',
'circle',
'clipPath',
'color_profile', // instead of color-profile
'cursor',
'defs',
'desc',
'ellipse',
'feBlend',
'g',
'image',
'line',
'linearGradient',
'marker',
'mask',
'path',
'pattern',
'polygon',
'polyline',
'radialGradient',
'rect',
'stop',
'svg',
'text',
'tref',
'tspan',
'use']
for(var i=0;i<$svg_tags.length;i++){
    SVG[$svg_tags[i]]=function(){
        return $SVGTagClass($svg_tags[i],arguments)
    }
}
