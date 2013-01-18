var $operators = {
    "//=":"ifloordiv",">>=":"irshift","<<=":"ilshift",
    "**=":"ipow","**":"pow","//":"floordiv","<<":"lshift",">>":"rshift",
    "+=":"iadd","-=":"isub","*=":"imul","/=":"itruediv",
    "%=":"imod","&=":"iand","|=":"ior",
    "^=":"ipow","+":"add","-":"sub","*":"mul",
    "/":"truediv","%":"mod","&":"and","|":"or",
    "^":"pow","<":"lt",">":"gt",
    "<=":"le",">=":"ge","==":"eq","!=":"ne",
    //"or":"or","and":"and","in":"in","not":"not",
    //"not_in":"not_in","is_not":"is_not" // fake
    }

var $augmented_assigns = {
    "//=":"ifloordiv",">>=":"irshift","<<=":"ilshift",
    "**=":"ipow","+=":"iadd","-=":"isub","*=":"imul","/=":"itruediv",
    "%=":"imod","^=":"ipow"
}

var $first_op_letter = {}
for(op in $operators){$first_op_letter[op.charAt(0)]=0}

function $Node(type){
    this.type = type
    this.children=[]
    this.tokens = []
    this.add = function(child){
        this.children.push(child)
        child.parent = this
    }
    this.show = function(indent){
        var res = ''
        if(this.type==='module'){
            for(var i=0;i<this.children.length;i++){
                res += this.children[i].show(indent)
            }
        }else{
            indent = indent || 0
            for(var i=0;i<indent;i++){res+=' '}
            for(var i=0;i<this.tokens.length;i++){
                res += this.tokens[i][1]+' '
            }
            if(this.children.length>0){res += '{'}
            res +='\n'
            for(var i=0;i<this.children.length;i++){
                res += this.children[i].show(indent+4)
            }
            if(this.children.length>0){
                for(var i=0;i<indent;i++){res+=' '}
                res+='}\n'
            }
        }
        return res
   }
}

function $last(src){return src[src.length-1]}

function $check(node,expr,msg){
    if(!expr){throw Error('SyntaxError line '+node.line_num+'\n'+msg)}
}
function $checkEqu(node,expr,value,msg){
    if(expr!==value){throw Error('SyntaxError line '+node.line_num+'\n'+msg)}
}
function $checkInf(node,expr,value,msg){
    if(expr>=value){throw Error('SyntaxError line '+node.line_num+'\n'+msg)}
}
function $checkSup(node,expr,value,msg){
    if(expr<=value){throw Error('SyntaxError line '+node.line_num+'\n'+msg)}
}

var $loop_id=0

function $AssignCtx(context){
    // context is the left operand of assignment
    this.type = 'assign'
    // replace parent by this in parent tree
    context.parent.tree.pop()
    context.parent.tree.push(this)
    this.parent = context.parent
    context.type = 'left_term'
    this.tree = [context]
    this.toString = function(){return this.tree[0]+'='+this.tree[1]}
    console.log('create assign '+this)
}

function $AttrCtx(context){
    this.type = 'attribute'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return '.'+this.tree}
}

function $CallCtx(context){ // entering arguments of a callable
    this.type = 'call'
    this.toString = function(){return 'call ('+this.tree+')'}
    this.parent = context
    this.tree = []
    context.tree.push(this)
}

function $ClassCtx(context){
    this.type = 'class'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'class '+this.tree}
}

function $ComprehensionCtx(context){
    this.type = 'comprehension'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'comprehension '+this.tree}
}

function $DefCtx(context){
    this.type = 'def'
    this.has_name = false
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'def '+this.tree}
}

function $DictCtx(context){
    // context is the first key
    this.type = 'dict'
    this.parent = context.parent
    context.parent.tree.pop()
    context.parent.tree.push(this)
    context.name = 'dict_key'
    this.tree = [context]
    this.expect = ','
    this.toString = function(){return 'dict '+this.tree}
}

function $ExprCtx(context,name,with_commas){
    this.type = 'expr'
    // allow expression with comma-separted values, or a single value ?
    this.with_commas = with_commas
    this.name = name
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'expr '+this.name+' '+this.tree}
}

function $ForTarget(context){
    this.type = 'for_target'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'for_target'+' '+this.tree}
}

function $ForExpr(context){
    this.type = 'for'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'for '+this.tree}
}

function $FuncArgs(context){
    this.type = 'func_args'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'func args '+this.tree}
    this.expect = 'id'
    this.has_default = false
    this.has_star_arg = false
    this.has_kw_arg = false
}

function $FuncArgIdCtx(context,name){
    // id in function arguments
    // may be followed by = for default value
    this.type = 'func_arg_id'
    this.name = name
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'func arg id '+this.name +' '+this.tree}
    this.expect = '='
}

function $IdCtx(context,value,minus){
    // minus is set if there is a unary minus before the id
    this.type = 'id'
    this.toString = function(){return 'id '+this.value+' '+(this.tree||'')}
    this.value = value
    this.minus = minus
    this.parent = context
    this.tree = []
    context.tree.push(this)
}

function $ImportCtx(context){
    this.type = 'import'
    this.toString = function(){return 'import '+this.tree}
    this.parent = context
    this.tree = []
    context.tree.push(this)
}

function $IntCtx(context,value){
    this.type = 'int'
    this.value = value
    this.toString = function(){return 'int '+this.value}
    this.parent = context
    this.tree = []
    context.tree.push(this)
}

function $KwArgCtx(context){
    this.type = 'kw_arg'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return '**'+this.tree}
}

function $ListCtx(context){
    this.type = 'list'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'list['+this.tree+']'}
}

function $ListCompCtx(context){
    this.type = 'list_comp'
    this.parent = context.parent
    this.elt = context.tree[0]
    this.elt.name = 'target'
    // replaces the list in context parent
    context.parent.tree.pop()
    context.parent.tree.push(this)
    this.tree = []
    //context.tree.push(this)
    this.toString = function(){return 'list_comp[elt ('+this.elt+') '+this.tree+']'}
}

function $NodeCtx(node){
    this.node = node
    this.tree = []
    this.type = 'node'
    this.toString = function(){return 'node '+this.tree}
}

function $OpCtx(op,left_op){
    this.type = 'op'
    this.op = op
    var context = left_op.parent
    this.toString = function(){return this.op+'('+this.tree+')'}
    this.parent = context
    this.tree = [left_op]
    left_op.name = 'left_op'
    // operation replaces left operand
    context.tree.pop()
    context.tree.push(this)
}

function $ParentClassCtx(context){ // subscription or slicing
    this.type = 'parent_class'
    this.expect = 'id'
    this.toString = function(){return '('+this.tree+')'}
    this.parent = context
    this.tree = []
    context.tree.push(this)
}

function $StarArgCtx(context){
    this.type = 'star_arg'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return '*'+this.tree}
}

function $StringCtx(context,value){
    console.log('new string '+value)
    this.type = 'str'
    this.value = value
    this.toString = function(){return 'string '+this.value+' '+(this.tree||'')}
    this.parent = context
    this.tree = []
    context.tree.push(this)
}

function $SubCtx(context){ // subscription or slicing
    this.type = 'sub'
    this.toString = function(){return 'sub['+this.tree+']'}
    this.parent = context
    this.tree = []
    context.tree.push(this)
}

function $TupleCtx(context){ // subscription or slicing
    this.type = 'tuple'
    this.toString = function(){return '('+this.tree+')'}
    this.parent = context
    this.tree = []
    context.tree.push(this)
}

function $UnaryOrOp(context,sign){
    // after + and - : might be operator ou unary
    this.sign = sign
    obj = this
    this.transition = {
        'id':function(name){return new $IdCtx(obj.parent,name,true)},
        'int':function(value){
            if(sign==='-'){value=-value}
            return obj.parent.transition['int'](value)
        },
        'float':function(value){
            if(sign==='+'){return new $FloatCtx(obj.parent,value)}
            else{return new $FloatCtx(obj.parent,-value)}
        }
    }
    this.parent = context
    this.tree = []
    context.tree.push(this)
}

function $transition(context,token){
    console.log('transition '+context+' token '+token)
    
    if(context.type==='assign'){
    
        if(token==='eol'){return $transition(context.parent,'eol')}
        else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='attribute'){ 

        if(token==='id'){
            if(context.tree.length==0){
                console.log('attribute '+arguments[2])
                new $IdCtx(context,arguments[2])
                return context.parent
            }else{
                throw Error('SyntaxError : token '+token+' after '+context)
            }
        }else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='call'){ 
    
        if(token===','){return context}
        else if(['id','int','str','[','(','{'].indexOf(token)>-1){
            var expr = new $ExprCtx(context,'call args',false)
            return $transition(expr,token,arguments[2])
        }else if(token===')'){return context.parent}
        else if(token==='op'){
            var op=arguments[2]
            if(op==='-'){return new $UnaryOrOp(context,'-')}
            else if(op==='+'){return context}
            else{throw Error('SyntaxError')}
         }else if(token==='eol'){return $transition(context.parent,'eol')}
        else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='class'){
    
        if(token==='id'){new $IdCtx(context,arguments[2]);return context}
        else if(token==='('){return new $ParentClassCtx(context)}
        else if(token===':'){return context.parent}
        else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='comprehension'){

        if(token==='id'){new $IdCtx(context,arguments[2]);return context}
        else if(token===','){return context}
        else{return $transition(context.parent,token,arguments[2])}        

    }else if(context.type==='def'){
    
        if(token==='id'){
            if(context.has_name){
                throw Error('SyntaxError : token '+token+' after '+context)
            }else{
                context.has_name = true
                new $IdCtx(context,arguments[2])
                return context
            }
        }else if(token==='('){return new $FuncArgs(context)}
        else if(token===':'){return context.parent}
        else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='dict'){

        if(token===',' && context.expect===','){
            context.expect = ':'
            return new $ExprCtx(context,'dict_key',false)
        }else if(token===':' && context.expect===':'){
            context.expect = ','
            return new $ExprCtx(context,'dict_value',false)
        }else if(token==='}' && context.expect===','){
            return context.parent
        }else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='expr'){
    
        if(token==='id'){return new $IdCtx(context,arguments[2])}
        else if(token==='str'){return new $StringCtx(context,arguments[2])}
        else if(token==='int'){return new $IntCtx(context,arguments[2])}
        else if(token==='('){
            context.name = 'tuple'
            return context
        }else if(token==='['){
            context.name = 'list'
            return context
        }else if(token==='{'){
            context.name = 'dict_or_set'
            return context
        }else if(token==='}' && context.name =='dict_or_set'){
            if(context.tree.length===0){context.name = 'dict'}
            else{context.name = 'set'}
            return context.parent
        }else if(token===':' && context.name =='dict_or_set'){
            return new $ExprCtx(new $DictCtx(context),'dict_value',false)
        }else if(token===',' && context.name =='dict_or_set'){
            context.name = 'set'
            return context
        }else if(token==='}' && 
            (context.name =='dict' || context.name=='set')){
                return context.parent
        }else if(token===','||token===')'){
            console.log('with commas '+context.with_commas)
            if(context.with_commas){return context}
            else{return $transition(context.parent,token)}
        }else if(token==='op'){
            return new $ExprCtx(new $OpCtx(arguments[2],context),'right_op',false)
        }else if(token==='='){
            return new $ExprCtx(new $AssignCtx(context),'right_term',true)
        }else{return $transition(context.parent,token)}

    }else if(context.type==='for'){
    
        if(token==='in'){return new $ExprCtx(context,'iterable',true)}
        else if(token===':'){return context.parent}
        else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='for_target'){
    
        if(token==='id'){new $IdCtx(context,arguments[2]);return context}
        else if(token===','){return context}
        else{return $transition(context.parent,token)}

    }else if(context.type==='func_arg_id'){
    
        if(token==='=' && context.expect==='='){
            context.parent.has_default = true
            return new $ExprCtx(context,'arg_default',false)
        }else if(token===',' || token===')'){
            if(context.parent.has_default && context.tree.length==0){
                throw Error('SyntaxError: non-default argument follows default argument')
            }else{
                return $transition(context.parent,token)
            }
        }else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='func_args'){
    
        console.log('expect '+context.expect)
        if(token==='id' && context.expect==='id'){
            context.expect = ','
            return new $FuncArgIdCtx(context,arguments[2])
        }else if(token===','){
            if(context.has_kw_arg){throw Error('SyntaxError')}
            else if(context.expect===','){
                context.expect = 'id'
                return context
            }else{throw Error('SyntaxError : token '+token+' after '+context)}            
        }else if(token===')'){
            if(context.expect===','){return context.parent}
            else if(context.tree.length==0){return context.parent} // no argument
            else{throw Error('SyntaxError : token '+token+' after '+context)}
        }else if(token==='op'){
            var op = arguments[2]
            context.expect = ','
            if(op=='*'){return new $StarArgCtx(context)}
            else if(op=='**'){return new $KwArgCtx(context)}
            else{throw Error('SyntaxError : token '+op+' after '+context)}
        }else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='id'){
    
        if(token==='['){return new $SubCtx(context)}
        else if(token==='('){return new $CallCtx(context)}
        else if(token==='.'){console.log('attribute');return new $AttrCtx(context)}
        else if([']',')','}',',',':','=','op','if',
            'for','in','and','or','not','eol'].indexOf(token)>-1){
            return $transition(context.parent,token,arguments[2])
        }else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='import'){
    
        if(token==='id'){return new $IdCtx(context,arguments[2])}
        else{return $transition(context.parent,token)}

    }else if(context.type==='int'){
    
        if(token==='op'){return new $OpCtx(arguments[2],context)}
        else if([':',']',')','}',':',',','eol'].indexOf(token)>-1){
            return $transition(context.parent,token)
        }else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='kw_arg'){
    
        if(token==='id'){
            new $IdCtx(context,arguments[2])
            context.parent.has_kw_arg = true
            return context.parent
        }else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='list'){ 

        if(token===']'){return context.parent}
        else if(token==='for'){
            // list comprehension
            return new $ComprehensionCtx(new $ListCompCtx(context))
        }else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='list_comp'){ 

        if(token===']'){return context.parent}
        else if(token==='in'){return new $ExprCtx(context,'iterable',true)}
        else if(token==='if'){return new $ExprCtx(context,'condition',true)}
        else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='node'){
    
        if(['id','int','str','[','(','{'].indexOf(token)>-1){
            var expr = new $ExprCtx(context,'expression',true)
            return $transition(expr,token,arguments[2])
        }else if(token==='class'){return new $ClassCtx(context)}
        else if(token==='def'){return new $DefCtx(context)}
        else if(token==='for'){return new $ForTarget(new $ForExpr(context))}
        else if(['if','elif','while'].indexOf(token)>-1){
            return new $ConditionExpr(context,token)
        }else if(token==='import'){return new $ImportCtx(context)}
        else if(token==='eol'){console.log(''+context);return context}
        else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='op'){ 
    
        if(token==='int'){
            new $IntCtx(context,arguments[2]) // adds itself to obj tree
            return context.parent
        }else if(token==='str'){
            new $StringCtx(context,arguments[2])
            return context.parent
        }else if(token==='id'){
            new $IdCtx(context,arguments[2])
            return context.parent
        }else if([']',')','}',',','eol'].indexOf(token)>-1){
            return $transition(context.parent,token)
        }else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='parent_class'){

        if(token==='id' && context.expect==='id'){
            new $IdCtx(context,arguments[2])
            context.expect = ','
            return context
        }else if(token===',' && context.expect==','){
            context.expect='id'
            return context
        }else if(token===')'){return context.parent}
        else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='star_arg'){
    
        if(token==='id'){
            new $IdCtx(context,arguments[2])
            context.parent.has_star_arg = true
            return context.parent
        }else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='str'){
    
        if(token=='str'){return new $StringCtx(context.parent,context.value+value)}
        else if(token=='['){return new $SubCtx(context)}
        else if(['op',']',')','}',':',',','eol'].indexOf(token)>-1){
            return $transition(context.parent,token,arguments[2])
        }else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='sub'){ 
    
        // subscription x[a] or slicing x[a:b:c]
        if(['id','int','float','str','[','(','{'].indexOf(token)>-1){
            var expr = new $ExprCtx(context,'subscription',false)
            return $transition(expr,token,arguments[2])
        }else if(token===']'){return context.parent}
        else if(token===':'){new $IdCtx(context,':');return context}
        else if(token==='op'){
            if(op==='-'){return new $UnaryOrOp(context,'-')}
            else if(op==='+'){return context}
            else{throw Error('SyntaxError')}
        }
        else if(token==='eol'){return $transition(context.parent,'eol')}
        else{throw Error('SyntaxError : token '+token+' after '+context)}

    }else if(context.type==='tuple'){ 

        if(token===')'){return context.parent}
        else{throw Error('SyntaxError : token '+token+' after '+context)}

    }
}

function $checkAllowed(context,type){
    if(context.transition[type]===undefined){
        throw Error('transition not allowed '+type+' for '+context)
    }
}

function $py2js(src,module){
    src = src.replace(/\r\n/gm,'\n')
    while (src.length>0 && (src.charAt(0)=="\n" || src.charAt(0)=="\r")){
        src = src.substr(1)
    }
    if(src.charAt(src.length-1)!="\n"){src+='\n'}

    document.$py_src[module]=src 
    var root = $tokenize(src,module)
}

function $tokenize(src,module){
    var delimiters = [["#","\n","comment"],['"""','"""',"triple_string"],
        ["'","'","string"],['"','"',"string"],
        ["r'","'","raw_string"],['r"','"',"raw_string"]]
    var br_open = {"(":0,"[":0,"{":0}
    var br_close = {")":"(","]":"[","}":"{"}
    var br_stack = ""
    var br_pos = new Array()
    var kwdict = ["False","class","finally","is","return",
        "None","continue","for","lambda","try","raise","True","def","from",
        "nonlocal","while","del","global","with",
        "as","elif","if","yield","assert","else","import","pass",
        "break","except","raise","in","or","and","not"]
    var unsupported = ["is","from","nonlocal","with","yield"]
    // causes errors for some browsers
    // complete list at http://www.javascripter.net/faq/reserved.htm
    var forbidden = ['item','var',
        'closed','defaultStatus','document','frames',
        'history','innerHeight','innerWidth','length',
        'location','name','navigator','opener',
        'outerHeight','outerWidth','pageXOffset','pageYOffset',
        'parent','screen','screenLeft','screenTop',
        'screenX','screenY','self','status',
        'top',
        'super']

    var punctuation = {',':0,':':0} //,';':0}
    var int_pattern = new RegExp("^\\d+")
    var float_pattern = new RegExp("^\\d+\\.\\d*(e-?\\d+)?")
    var id_pattern = new RegExp("[\\$_a-zA-Z]\\w*")

    var context = null
    var tokens = []
    var root = new $Node('module')
    root.indent = -1
    var new_node = new $Node('expression')
    current = root
    var name = ""
    var _type = null
    var pos = 0
    indent = null

    var pos2line = {}
    var lnum=1
    for(i=0;i<src.length;i++){
        pos2line[i]=lnum
        if(src.charAt(i)=='\n'){lnum+=1}
    }
    lnum = 1
    while(pos<src.length){
        document.line_num = pos2line[pos]
        var flag = false
        var car = src.charAt(pos)
        // build tree structure from indentation
        if(indent===null){
            var indent = 0
            while(pos<src.length){
                if(src.charAt(pos)==" "){indent++;pos++}
                else if(src.charAt(pos)=="\t"){ 
                    // tab : fill until indent is multiple of 8
                    indent++;pos++
                    while(indent%8>0){indent++}
                }else{break}
            }
            // ignore empty lines
            if(src.charAt(pos)=='\n'){pos++;lnum++;indent=null;continue}
            new_node.indent = indent
            new_node.line_num = lnum
            // attach new node to node with indentation immediately smaller
            if(indent>current.indent){
                // control that parent ended with ':'
                if(context!==null){
                    console.log('new line '+context)
                    if(['def'].indexOf(context.tree[0].type)==-1){
                        $IndentationError(module,'unexpected indent',pos)
                    }else{ // remove :
                        current.tokens.pop()
                    }
                }
                // add a child to current node
                current.add(new_node)
            }else{ // same or lower level
                while(indent!==current.indent){
                    current = current.parent
                    if(current===undefined || indent>current.indent){
                        $IndentationError(module,'unexpected indent',pos)
                    }
                }
                current.parent.add(new_node)
            }
            current = new_node
            context = new $NodeCtx(new_node)
            continue
        }
        // comment
        if(car=="#"){
            var end = src.substr(pos+1).search('\n')
            if(end==-1){end=src.length-1}
            pos += end+1;continue
        }
        // string
        if(car=='"' || car=="'"){
            var raw = false
            var end = null
            if(name.length>0 && name.toLowerCase()=="r"){
                // raw string
                raw = true;name=""
            }
            if(src.substr(pos,3)==car+car+car){_type="triple_string";end=pos+3}
            else{_type="string";end=pos+1}
            var escaped = false
            var zone = car
            var found = false
            while(end<src.length){
                if(escaped){zone+=src.charAt(end);escaped=false;end+=1}
                else if(src.charAt(end)=="\\"){
                    if(raw){
                        zone += '\\\\'
                        end++
                    } else {
                        if(src.charAt(end+1)=='\n'){
                            // explicit line joining inside strings
                            end += 2
                            lnum++
                        } else {
                            zone+=src.charAt(end);escaped=true;end+=1
                        }
                    }
                } else if(src.charAt(end)==car){
                    if(_type=="triple_string" && src.substr(end,3)!=car+car+car){
                        end++
                    } else {
                        found = true
                        // end of string
                        if(tokens.length>0 && $last(tokens)[0]=="str"){
                            // implicit string concatenation : insert a + sign
                            tokens.push(['operator','+',end])
                        }
                        tokens.push(["str",zone+car,pos])
                        if(_type==="triple_string"){
                            context = $transition(context,'str',zone.substr(3))
                        }else{
                            context = $transition(context,'str',zone.substr(1))
                        }
                        pos = end+1
                        if(_type=="triple_string"){pos = end+3}
                        break
                    }
                } else { 
                    zone += src.charAt(end)
                    if(src.charAt(end)=='\n'){lnum++}
                    end++
                }
            }
            if(!found){
                document.line_num = pos2line[pos]
                $SyntaxError(module,"String end not found",pos)
            }
            continue
        }
        // identifier ?
        if(name==""){
            if(car.search(/[a-zA-Z_]/)!=-1){
                name=car // identifier start
                pos++;continue
            }
        } else {
            if(car.search(/\w/)!=-1){
                name+=car
                pos++;continue
            } else{
                if(kwdict.indexOf(name)>-1){
                    if(unsupported.indexOf(name)>-1){
                        document.line_num = pos2line[pos]
                        $SyntaxError(module,"Unsupported Python keyword '"+name+"'",pos)                    
                    }
                    context = $transition(context,name)
                    tokens.push(["keyword",name,pos-name.length])
                } else if(name in $operators) { // and, or
                    tokens.push(["operator",name,pos-name.length])
                //} else if(tokens.length>1 && $last(tokens)[0]=="point"
                //    && (['id','str','int','float','qualifier','bracket'].indexOf(tokens[tokens.length-2][0])>-1)) {
                //    tokens.push(["qualifier",name,pos-name.length])             
                } else {
                    if(forbidden.indexOf(name)>-1){name='$$'+name}
                    context = $transition(context,'id',name)
                    tokens.push(["id",name,pos-name.length])
                }
                name=""
                continue
            }
        }
        // point
        if(car=="."){
            tokens.push(["point",".",pos])
            context = $transition(context,'.')
            pos++;continue
        }
        // number
        if(car.search(/\d/)>-1){
            // digit
            var res = float_pattern.exec(src.substr(pos))
            if(res){
                if(res[0].search('e')>-1){
                    tokens.push(["float",res[0],pos])
                    context = $transition(context,'float',res[0])
                }else{
                    tokens.push(["float",eval(res[0]),pos])
                    context = $transition(context,'float',eval(res[0]))
                }
            }else{
                res = int_pattern.exec(src.substr(pos))
                tokens.push(["int",eval(res[0]),pos])
                context = $transition(context,'int',eval(res[0]))
            }
            pos += res[0].length
            continue
        }
        // line end
        if(car=="\n"){
            lnum++
            if(br_stack.length>0){
                // implicit line joining inside brackets
                pos++;continue
            } else {
                
                if(tokens.length>0){ // ignore empty lines
                    context = $transition(context,'eol')
                    current.tokens = tokens
                    tokens = []
                    indent=null
                    new_node = new $Node()
                }
                pos++;continue
            }
        }
        if(car in br_open){
            br_stack += car
            br_pos[br_stack.length-1] = pos
            context = $transition(context,car)
            tokens.push(["bracket",car,pos])
            pos++;continue
        }
        if(car in br_close){
            if(br_stack==""){
                $SyntaxError(module,"Unexpected closing bracket",pos)
            } else if(br_close[car]!=$last(br_stack)){
                document.line_num = pos2line[pos]
                $SyntaxError(module,"Unbalanced bracket",pos)
            } else {
                br_stack = br_stack.substr(0,br_stack.length-1)
                context = $transition(context,car)
                tokens.push(["bracket",car,pos])
                pos++;continue
            }
        }
        if(car=="="){
            if(src.charAt(pos+1)!="="){
                context = $transition(context,'=')
                tokens.push(["assign","=",pos])
                pos++;continue
            } else {
                tokens.push(["operator","==",pos])
                pos+=2;continue
            }
        }
        if(car in punctuation){
            tokens.push(["delimiter",car,pos])
            context = $transition(context,car)
            pos++;continue
        }
        // operators
        if(car in $first_op_letter){
            // find longest match
            var op_match = ""
            for(op_sign in $operators){
                if(op_sign==src.substr(pos,op_sign.length) 
                    && op_sign.length>op_match.length){
                    op_match=op_sign
                }
            }
            if(op_match.length>0){
                if(op_match in $augmented_assigns){
                    tokens.push(["assign",op_match,pos])
                }else{
                    context = $transition(context,'op',op_match)
                    tokens.push(["operator",op_match,pos])
                }
                pos += op_match.length
                continue
            }
        }
        if(car=='\\' && src.charAt(pos+1)=='\n'){
            lnum++;pos+=2;continue
        }
        if(car!=' '){$SyntaxError(module,'unknown token ['+car+']',pos)}
        pos += 1
    }
    new_node.tokens = tokens

    if(br_stack.length!=0){
        pos = br_pos.pop()
        document.line_num = pos2line[pos]
        throw Error("Unbalanced bracket "+br_stack.charAt(br_stack.length-1),pos)
    } 
    
    return root

}

function brython(debug){
    document.$py_src = {}
    document.$debug = debug
    var elts = document.getElementsByTagName("script")
    
    for(var $i=0;$i<elts.length;$i++){
        var elt = elts[$i]
        if(elt.type=="text/python"){
            var src = (elt.innerHTML || elt.textContent)
            $py2js(src,'__main__')
        }
    }
}