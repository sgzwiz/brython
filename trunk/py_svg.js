SVG = {
    __getattr__:function(attr){return this[attr]}
}

$svgNS = "http://www.w3.org/2000/svg"
$xlinkNS = "http://www.w3.org/1999/xlink"

function $SVGTag(tag_name,args){
    // represents an SVG tag
    var $i = null
    var $obj = this
    elt = document.createElementNS($svgNS,tag_name)
    if(args!=undefined && args.length>0){
        $start = 0
        $first = args[0]
        // if first argument is not a keyword, it's the tag content
        if(!isinstance($first,$Kw)){
            $start = 1
            if(isinstance($first,[str,int,float])){
                txt = document.createTextNode(str($first))
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
                if($arg.name.toLowerCase() in $events){ // events
                    eval('elt.'+$arg.name.toLowerCase()+'=function(){'+$arg.value+'}')
                }else if($arg.name.toLowerCase()=="style"){
                    elt.set_style($arg.value)
                } else {
                    if($arg.value!==false){
                        // option.selected=false sets it to true :-)
                        elt.setAttributeNS(null,$arg.name.replace('_','-'),$arg.value)
                    }
                }
            }
        }
    }
    // if id was not set, generate one
    return elt
}

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

$svg = function(){return $SVGTag('X',arguments)}
$svg += '' // source code

for(var i=0;i<$svg_tags.length;i++){
    var tag = $svg_tags[i]
    eval('SVG.'+tag+'='+$svg.replace('X',tag))
}