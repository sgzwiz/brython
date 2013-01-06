var $operators = {
    "//=":"ifloordiv",">>=":"irshift","<<=":"ilshift",
    "**=":"ipow","**":"pow","//":"floordiv","<<":"lshift",">>":"rshift",
    "+=":"iadd","-=":"isub","*=":"imul","/=":"itruediv",
    "%=":"imod","&=":"iand","|=":"ior",
    "^=":"ipow","+":"add","-":"sub","*":"mul",
    "/":"truediv","%":"mod","&":"and","|":"or",
    "^":"pow","<":"lt",">":"gt",
    "<=":"le",">=":"ge","==":"eq","!=":"ne",
    "or":"or","and":"and","in":"in","not":"not",
    "not_in":"not_in","is_not":"is_not" // fake
    }

var $augmented_assigns = {
    "//=":"ifloordiv",">>=":"irshift","<<=":"ilshift",
    "**=":"ipow","+=":"iadd","-=":"isub","*=":"imul","/=":"itruediv",
    "%=":"imod","^=":"ipow"
}

var $first_op_letter = {}
for(op in $operators){$first_op_letter[op.charAt(0)]=0}

function $tokenize(src,module){
    var delimiters = [["#","\n","comment"],['"""','"""',"triple_string"],
        ["'","'","string"],['"','"',"string"],
        ["r'","'","raw_string"],['r"','"',"raw_string"]]
    var br_open = {"(":0,"[":0,"{":0}
    var br_close = {")":"(","]":"[","}":"{"}
    var br_stack = ""
    var br_pos = new Array()
    var kwdict = ["False","class","finally","is","return",
        "None","continue","for","lambda","try","True","def","from",
        "nonlocal","while","del","global","with",
        "as","elif","if","yield","assert","else","import","pass",
        "break","except","raise"]
    var unsupported = ["is","from","nonlocal","with",
        "as","yield"]
    // causes errors for some browsers
    // complete list at http://www.javascripter.net/faq/reserved.htm
    var forbidden = ['item','var',
        'closed','defaultStatus','document','frames',
        'history','innerHeight','innerWidth','length',
        'location','name','navigator','opener',
        'outerHeight','outerWidth','pageXOffset','pageYOffset',
        'parent','screen','screenLeft','screenTop',
        'screenX','screenY','self','status',
        'top']

    var punctuation = {',':0,':':0} //,';':0}
    var int_pattern = new RegExp("^\\d+")
    var float_pattern = new RegExp("^\\d+\\.\\d*(e-?\\d+)?")
    var id_pattern = new RegExp("[\\$_a-zA-Z]\\w*")
    
    var stack = new Array()
    var name = ""
    var _type = null
    var pos = 0
    while(pos<src.length && src.charAt(pos)==' '){pos++}
    var indent_stack = [pos]
    stack.push(['indent',pos,0])

    var pos2line = {}
    var lnum=1
    for(i=0;i<src.length;i++){
        pos2line[i]=lnum
        if(src.charAt(i)=='\n'){lnum+=1}
    }
    lnum = 0
    while(pos<src.length){
        document.line_num = pos2line[pos]
        var flag = false
        var car = src.charAt(pos)
        // check indentation
        if(stack.length==0 || $last(stack)[0]=='newline'){
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
            if(src.charAt(pos)=='\n'){pos++;lnum++;continue}
            // indentation must be equal to some value in indent_stack, or
            // greater if last line ended with :
            if(stack.length>1){
                if(indent>$last(indent_stack)){
                    if(stack[stack.length-2][0] != "delimiter" &&
                        stack[stack.length-2][1] != ":"){
                        $IndentationError(module,"unexpected indent",pos)
                    }else{
                        indent_stack.push(indent)
                    }
                }else if(indent==$last(indent_stack)){
                    if(stack[stack.length-2][0]=="delimiter" &&
                        stack[stack.length-2][1]==":"){
                        $IndentationError(module,"expected an indented block",pos)
                    }
                }else if(indent<$last(indent_stack)){
                    indent_stack.pop()
                    while(true){
                        if(indent_stack.length==0){
                            $IndentationError(module,'unexpected indent',pos)
                        }
                        if(indent>$last(indent_stack)){
                            $IndentationError(module,'unexpected indent',pos)
                        }else if(indent==$last(indent_stack)){break}
                        else{indent_stack.pop()}
                    }
                }
            }else if(indent>0){
                $IndentationError(module,"unexpected indent",pos)
            }
            stack.push(["indent",indent,pos-indent])
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
                        if(stack.length>0 && $last(stack)[0]=="str"){
                            // implicit string concatenation : insert a + sign
                            stack.push(['operator','+',end])
                        }
                        stack.push(["str",zone+car,pos])
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
                    stack.push(["keyword",name,pos-name.length])
                } else if(name in $operators) { // and, or
                    stack.push(["operator",name,pos-name.length])
                } else if(stack.length>1 && $last(stack)[0]=="point"
                    && (['id','str','int','float','qualifier','bracket'].indexOf(stack[stack.length-2][0])>-1)) {
                    stack.push(["qualifier",name,pos-name.length])                 
                } else {
                    if(forbidden.indexOf(name)>-1){name='$$'+name}
                    stack.push(["id",name,pos-name.length])
                }
                name=""
                continue
            }
        }
        // point
        if(car=="."){
            stack.push(["point",".",pos])
            pos++;continue
        }
        // number
        if(car.search(/\d/)>-1){
            // digit
            var res = float_pattern.exec(src.substr(pos))
            if(res){
                if(res[0].search('e')>-1){stack.push(["float",res[0],pos])}
                else{stack.push(["float",eval(res[0]),pos])}
            }else{
                res = int_pattern.exec(src.substr(pos))
                stack.push(["int",eval(res[0]),pos])
            }
            pos += res[0].length
            continue
        }
        if(car=="\n"){
            lnum++
            if(br_stack.length>0){
                // implicit line joining inside brackets
                pos++;continue
            } else {
                // ignore empty lines
                if(stack[stack.length-1][0]!="newline"){
                    stack.push(["newline",lnum,pos])
                } else {
                    stack[stack.length-1][1] = lnum // update line num
                }
                pos++;continue
            }
        }
        if(car in br_open){
            br_stack += car
            br_pos[br_stack.length-1] = pos
            stack.push(["bracket",car,pos])
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
                stack.push(["bracket",car,pos])
                pos++;continue
            }
        }
        if(car=="="){
            if(src.charAt(pos+1)!="="){
                // assignment if outside of brackets
                if(br_stack.length==0){
                    stack.push(["assign","=",pos])
                } else { // like in foo(bar=9)
                    stack.push(["delimiter","=",pos])
                }
                pos++;continue
            } else {
                stack.push(["operator","==",pos])
                pos+=2;continue
            }
        }
        if(car in punctuation){
            stack.push(["delimiter",car,pos])
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
                    stack.push(["assign",op_match,pos])
                }else{
                    stack.push(["operator",op_match,pos])
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

    if(br_stack.length!=0){
        pos = br_pos.pop()
        document.line_num = pos2line[pos]
        $SyntaxError(module,"Unbalanced bracket "+br_stack.charAt(br_stack.length-1),pos)
    } 
    
    return stack

}
