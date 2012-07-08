
function $resolve(name,scope){
    if($ns[scope][name]!==undefined){return $ns[scope][name]}
    else{
        obj=eval(name)
        if(obj===undefined){throw new NameError("name '"+name+"'is not defined")}
        else{return obj}
    }
}

function $MakeArgs($fname,$args,$required,$defaults,$other_args,$other_kw){
    var i=null
    var $PyVars = {}
    var $def_names = []
    for(k in $defaults){$def_names.push(k);$ns[$fname][k]=$defaults[k]}
    if($other_args != null){$ns[$fname][$other_args]=list()}
    if($other_kw != null){$keys=list();$values=list()}
    for(i=0;i<$args.length;i++){
        $arg=$args[i]
        $PyVar=$JS2Py($arg)
        if(!$isinstance($arg,$Kw)){
            if(i<$required.length){
                eval($required[i]+"=$PyVar")
                $ns[$fname][$required[i]]=$PyVar
            } else if(i<$required.length+$def_names.length) {
                $ns[$fname][$def_names[i-$required.length]]=$PyVar
            } else if($other_args!=null){
                eval('$ns[$fname]["'+$other_args+'"].append($PyVar)')
            } else {
                msg = $fname+"() takes "+$required.length+' positional arguments '
                msg += 'but more were given'
                throw TypeError(msg)
            }
        } else{
            $PyVar = $arg.value
            if($arg.name in $PyVars){
                throw new TypeError($fname+"() got multiple values for argument '"+$arg.name+"'")
            } else if($arg.name==$required[i]){
                eval($required[i]+"=$PyVar")
                $ns[$fname][$required[i]]=$PyVar
            } else if($arg.name in $defaults){
                $ns[$fname][$arg.name]=$arg.value
            } else if($other_kw!=null){
                $keys.append(str($arg.name))
                $values.append($PyVar)
            } else {
                throw new TypeError($fname+"() got an unexpected keyword argument '"+$arg.name+"'")
            }
            if($arg.name in $defaults){delete $defaults[$arg.name]}
        }
    }
    if($other_kw!=null){$ns[$fname][$other_kw]=dict($keys,$values)}
}

function PyConvArgs(){
    var $i=0,$args = []
    for($i=0;$i<arguments.length;$i++){$args.push(arguments[$i])}
    $MakeArgs($arguments)
}

function $Assign(targets,right_expr,assign_pos){
    var i=0,target=null
    var rlist = right_expr.list()
    if(rlist[0][0]=="bracket"){rlist=rlist.slice(1,rlist.length-1)}
    var rs = new Stack(rlist)
    var rs_items = rs.split(',')
    if(rs_items.length>1){
        if(rs_items.length>targets.length){
            throw new ValueError("Too many values to unpack (expected "+rs_items.length+")")
        } else if(rs_items.length<targets.length){
            throw new ValueError("Need more than "+rs_items.length+" values to unpack")
        } else {
            var seq=[]
            for(i=0;i<targets.length;i++){
                seq = seq.concat(targets[i].list)
                seq.push(['assign','=',assign_pos])
                seq = seq.concat(rs_items[i].list)
                seq.push(['delimiter',';',assign_pos])
            }
        }        
    } else {
        var seq = [['code',"var $var=iter",assign_pos]]
        seq.push(['bracket','(',assign_pos])
        seq = seq.concat(right_expr.list())
        seq.push(['bracket',')',assign_pos])
        seq.push(['delimiter',';',assign_pos])
        $ForEach(targets).Enumerate(function(i,target){
            seq = seq.concat(target.list)
            seq.push(['assign','=',assign_pos])
            seq.push(['code','next($var);',assign_pos])
        })
    }
    return seq
}

// source text of the PyConvArgs function
PyConvArgs += ''
var lines = PyConvArgs.split('\n')
lines = lines.slice(1,lines.length-1)
PyConvArgs = ''
$ForEach(lines).Do(function(line){PyConvArgs += line+'\n'})

$OpeningBrackets = $List2Dict('(','[','{')

function py2js(src,context){
    // context is "main" for the main script, the module name if import
    var i = 0
    src = src.replace(/\r\n/gm,'\n')
    while (src.length>0 && (src.charAt(0)=="\n" || src.charAt(0)=="\r" || src.charAt(0)==" ")){
        src = src.substr(1)
    }
    if(src.charAt(src.length-1)!="\n"){src+='\n'}
    if(context===undefined){context='__main__';document.$py_src={'__main__':src}}
    else{document.$py_src[context] = src}
    document.$context = context
    
    // map position to line number
    var pos2line = {}
    var lnum=1
    for(i=0;i<src.length;i++){
        pos2line[i]=lnum
        if(src.charAt(i)=='\n'){lnum+=1}
    }
    
    tokens = $tokenize(src)
    stack = new Stack(tokens)
        
    // add a line number at the end of each line in source code
    // used for traceback
    stack.list.splice(0,0,['code','document.line_num=1',0],['newline','\n',0])
    var pos = 2
    while(true){
        var nl = stack.find_next(pos,'newline')
        if(nl==null){break}
        stack.list.splice(nl,0,['code',';document.line_num='+stack.list[nl][1],stack.list[nl][2]])
        pos = nl+2
    }
    
    // replace "not in" and "is not" by operator
    var repl = [['not','in'],['is','not']]
    for(i=0;i<repl.length;i++){
        var seq = repl[i]
        var pos = stack.list.length-1
        while(pos>0){
            var op_pos = stack.find_previous(pos,"operator",seq[1])
            if(op_pos==null){break}
            if(op_pos>1 && stack.list[op_pos-1][0]=="operator"
                && stack.list[op_pos-1][1]==seq[0]){
                    stack.list.splice(op_pos-1,2,['operator',seq[0]+'_'+seq[1],stack.list[op_pos][2]])
            }
            pos = op_pos-2
        }
    }

    // create variable $ns for namespace if it doesn't exist
    stack.list.splice(0,0,['code','try{$ns}catch(err){$ns={0:{}}}',0],
        ['newline','\n',0])

    // for each opening bracket, define after which token_types[,token values] 
    // they are *not* the start of a display
    var not_a_display = { 
        '[':[["id"],["assign_id"],['literal'],["qualifier"],["bracket",$List2Dict("]",")")]], // slicing
        '(':[["id"],["assign_id"],["qualifier"],["bracket",$List2Dict("]",")")]], // call
        '{':[[]] // always a display
        }
    var PyType = {'(':'tuple','[':'$list','{':'dict'}
    $ForEach(['[','(','{']).Do(function(bracket){
        pos = stack.list.length-1
        while(true){
            var br_elt = stack.find_previous(pos,"bracket",bracket)
            if(br_elt==null){break}
            if(br_elt>0){
                var previous = stack.list[br_elt-1]
                var is_display = true
                $ForEach(not_a_display[bracket]).Do(function(args){
                    if(args[0]==previous[0]){
                        if(args.length!=2 || (previous[1] in args[1])){
                            is_display = false
                        }
                    }
                })
                if(!is_display){pos = br_elt-1;continue}
                // display : insert tuple, list or dict
                var pyType = PyType[bracket]
                var br_pos = stack.list[br_elt][2]
                sequence = [['id',pyType,br_elt[2]],['bracket','(',br_pos]]
                var end = stack.find_next_matching(br_elt)
                if(pyType=='dict'){
                    // split elements
                    var args = new Stack(stack.list.slice(br_elt+1,end))
                    if(args.list.length>0){
                        sequence = [['id','dict'],['bracket','(']]
                        var kvs = args.split(',') // array of Stack instances
                        $ForEach(kvs).Do(function(kv){
                            // each kv has attributes start and end = position in args
                            var elts = kv.split(':')
                            var key = elts[0] // key.start = position in kv
                            var value = elts[1]
                            // key and value are atoms with start and end relative to kv
                            // position of key in args is kv.start+key.start
                            var key_start = kv.start+key.start
                            var key_end = kv.start+key.end
                            sequence.push(['id','list'])
                            sequence.push(['bracket','('])
                            sequence = sequence.concat(args.list.slice(key_start,key_end+1))
                            sequence.push(['delimiter',',',br_pos])
                            var value_start = kv.start+value.start
                            var value_end = kv.start+value.end
                            sequence = sequence.concat(args.list.slice(value_start,value_end+1))
                            sequence.push(['bracket',')'])
                            sequence.push(['delimiter',',',br_pos])
                        })
                        sequence.pop() // remove last comma
                    }
                } else {
                    sequence = sequence.concat(stack.list.slice(br_elt+1,end))
                }
                sequence.push(['bracket',')',stack.list[end][2]])
                tail = stack.list.slice(end+1,stack.list.length)
                stack.list = stack.list.slice(0,br_elt)
                stack.list = stack.list.concat(sequence)
                stack.list = stack.list.concat(tail)
            }
            pos = br_elt - 1
        }    
    })
    
    // conversion of arguments in function definitions
    var pos = stack.list.length-1
    while(true){
        var def_pos = stack.find_previous(pos,"keyword","def")
        if(def_pos==null){break}
        var func_token = stack.list[def_pos+1]
        var arg_start = stack.list[def_pos+2]
        if(func_token[0]=='id' && arg_start[0]=='bracket'
            && arg_start[1]=='(' && 
            !(stack.list[def_pos+3][0]=="bracket" && stack.list[def_pos+3][1]==")")){
            // function definition
            arg_end = stack.find_next_matching(def_pos+2)
            // mark ids as argument ids
            for(var i=def_pos+2;i<arg_end;i++){
                if(stack.list[i][0]=='id'){stack.list[i][0]='arg_id'}
            }
            var s = new Stack(stack.list.slice(def_pos+3,arg_end))
            var args = s.split(',') // list of stacks
            var required = []
            var defaults = {}
            var other_args = null
            var other_kw = null
            for(i=args.length-1;i>=0;i--){
                arg = args[i]
                var op = null
                if(arg.list[0][0]=="operator" && arg.list[1][0]=="arg_id"){
                    // *args or **kw
                    if(arg.list[0][1]=="*"){op='*';other_args = arg.list[1][1]}
                    else if(arg.list[0][1]=='**'){op='**';other_kw = arg.list[1][1]}
                    if(op!=null){
                         // remove argument
                        if(i==0){
                            stack.list.splice(def_pos+2+arg.start+1,arg.end-arg.start+1)
                        } else { // also remove comma
                            stack.list.splice(def_pos+2+arg.start,arg.end-arg.start+2)                        
                        }
                    }
                }
                if(op==null){
                    var elts = arg.split("=")
                    if(elts.length>1){
                        // argument with default value
                        defaults[elts[0].list[0][1]]=elts[1].list[0][1]
                        // remove argument
                        if(i==0){
                            stack.list.splice(def_pos+3+arg.start,arg.end-arg.start+1)
                        } else {
                            stack.list.splice(def_pos+2+arg.start,arg.end-arg.start+2)
                        }
                    } else {
                        // required positional argument
                        required.push(arg.list[0][1])
                    }
                }
            }
            // insert code after end of function definition (next delimiter ':')
            var end_def = stack.find_next_at_same_level(def_pos,"delimiter",":")
            if(end_def==null){
                throw new SyntaxError("Unable to find definition end "+end_def)
            }
            var arg_code = '"'+func_token[1]+'",$args,'
            
            if(required.length==0){arg_code+='[],'}
            else{
                arg_code += '['
                required.reverse()
                $ForEach(required).Do(function(req){arg_code+="'"+req+"',"})
                arg_code = arg_code.substr(0,arg_code.length-1)+"],"
            }
            req_code = '    $defaults={};\n'
            for(x in defaults){
                req_code += '    $defaults["'+x+'"]='+defaults[x]+'\n'
            }
            arg_code += '$defaults,'
            if(other_args==null){arg_code+="null,"}
            else{arg_code += '"'+other_args+'",'}
            if(other_kw==null){arg_code+="null"}
            else{arg_code += '"'+other_kw+'"'}
            var fcode = "    $fname='"+func_token[1]+"'\n"
            var conv_args = PyConvArgs.replace(/\$arguments/,arg_code)
            stack.list.splice(end_def+1,0,['code',req_code+conv_args,stack.list[end_def][2]])
        }
        pos = def_pos-1
    }

    // calls
    pos = stack.list.length-1
    while(true){
        var br_pos = stack.find_previous(pos,"bracket","(")
        if(br_pos==null){break}
        if(stack.list[br_pos-1][0]=='id' && br_pos>1 && stack.list[br_pos-2][0]!="keyword" &&
            stack.list[br_pos-2][1] != 'def'){
            var end_call = stack.find_next_matching(br_pos)
            var s = new Stack(stack.list.slice(br_pos+1,end_call))
            var args = s.split(',')
            for(i=args.length-1;i>=0;i--){
                var arg = args[i]
                var elts = arg.split('=')
                if(elts.length==2){
                    // keyword argument
                    var src_pos = elts[0].list[0][2]
                    var seq = [['code','$Kw("'+elts[0].list[0][1]+'",',src_pos]]
                    seq = seq.concat(elts[1].list)
                    seq.push(['code',')',src_pos])
                    var code = '$Kw("'+elts[0].list[0][1]+'",'
                    code += elts[1].to_js()+')'
                    // remove original argument
                    stack.list.splice(br_pos+1+arg.start,arg.end-arg.start+1)
                    // insert keyword arg
                    tail = stack.list.slice(br_pos+1+arg.start,stack.list.length)
                    stack.list = stack.list.slice(0,br_pos+1+arg.start).concat(seq).concat(tail)
                }
            }
        }
        pos = br_pos-1
    }

    // consecutive + and - signs
    pos = 0
    var sign2mult = {'+':1,'-':-1}
    while(true){
        var sign = stack.find_next(pos,"operator","+","-")
        if(sign==null){break}
        var op = stack.list[sign]
        var mult = sign2mult[op[1]]
        while(sign<stack.list.length-1){
            var next = stack.list[sign+1]
            if(next[0]=="operator" && next[1] in sign2mult){
                mult *= sign2mult[next[1]]
                stack.list.splice(sign+1,1)
            } else { break }
        }
        if(mult != sign2mult[op[1]]){ // sign changed
            if(op[1]=='+'){stack.list[sign][1]='-'}
            else{stack.list[sign][1]='+'}
        }
        pos = sign+1
    }

    // unary + and -
    pos = 0
    while(true){
        var sign = stack.find_next(pos,"operator","+","-")
        if(sign==null){break}
        var op = stack.list[sign]
        if(sign>0 && 
            (stack.list[sign-1][0] in $List2Dict("delimiter","newline","indent","assign","operator") ||
                (stack.list[sign-1][0]=="bracket" && stack.list[sign-1][1]=="("))){
            if(sign<stack.list.length-1){
                var next = stack.list[sign+1]
                if(next[0]=="literal" && typeof next[1]=="number") { // literal
                    var value = next[1]
                    if(op[1]=='-'){
                        stack.list[sign+1][1]=-1*stack.list[sign+1][1]
                    }
                    // remove unary sign
                    stack.list.splice(sign,1)
                } else if(next[0]=="id") { // insert 1 * or -1 *
                    var mult = 1
                    if(op[1]=="-"){mult=-1}
                    stack.list.splice(sign,1,["literal",mult,op[2]],
                        ['operator','*',op[2]])
                }
            }
        }
        pos=sign+1
    }
    
    // replace import module_list by Import(module_list)
    pos = 0
    while(pos<stack.list.length){
        var imp_pos = stack.find_next(pos,"keyword","import")
        if(imp_pos==null){break}
        var imported = stack.atom_at(imp_pos+1,true)
        if(imported.type != 'id' && imported.type != 'tuple'){
            document.line_num = pos2line[stack.list[imp_pos][2]]
            throw new SyntaxError("invalid syntax")
        }
        for(var i=0;i<imported.list().length;i++){
            if(stack.list[imported.start+i][0]=="id"){
                stack.list[imported.start+i][0]='literal'
                stack.list[imported.start+i][1]='"'+stack.list[imported.start+i][1]+'"'
            }
        }
        var src_pos = stack.list[imp_pos][2]
        stack.list.splice(imported.end+1,0,['bracket',')'])
        stack.list.splice(imp_pos,1,
            ['code','Import',src_pos],['bracket','(',src_pos])
        pos = imp_pos+1
    }

    // replace if,def,class,for by equivalents
    var kws = {'if':'if','else':'else','elif':'else if',
        'def':'function','class':'function','for':'for',
        'try':'try','except':'catch($exc)','finally':'finally'}
    var has_parenth = $List2Dict('if','elif','for')
    var $funcs = []
    var module_level_functions = []
    var loop_id = 0
    for(kw in kws){
        pos = 0
        while(pos<stack.list.length){
            var kw_pos = stack.find_next(pos,"keyword",kw)
            if(kw_pos==null){break}
            var kw_indent = stack.indent(kw_pos)
            var src_pos = stack.list[kw_pos][2]
            var block = stack.find_block(kw_pos)
            // block[0] = position of :
            // block[1] = last newline of block
            s = new Stack(stack.list.slice(block[0],block[1]+1))
            if(block==null){console.log('anomalie '+kw);pos=kw_pos-1;continue}
            var multiline = (s.find_next(0,'newline')!=null)
            // replace by Javascript keyword
            stack.list[kw_pos][1] = kws[kw]
            // replace : by {
            stack.list[block[0]][1]='{'
            var end_pos = stack.list[block[1]][2]

            tail = stack.list.slice(block[1],stack.list.length)
            if(kw in has_parenth){
                if(kw=="for"){
                    // remove 'for'
                    stack.list.splice(kw_pos,1)
                    var arg_list = stack.atom_at(kw_pos,true) // accept implicit tuple
                    var _in = stack.atom_at(arg_list.end+1)
                    var _in_list = stack.list.slice(_in.start,_in.end+1)
                    if(_in_list.length != 1 || 
                        _in_list[0][0]!="operator" || _in_list[0][1]!="in"){
                        throw new SyntaxError("missing 'in' after 'for'",src,src_pos)
                    }
                    var iterable = stack.atom_at(_in.end+1,true)
                    seq = []
                    loop_id++
                    if(kw_indent){seq.push(['indent',kw_indent,src_pos])}
                    seq.push(['id','$Iterable'+loop_id,src_pos])
                    seq.push(['assign','=',src_pos])
                    seq.push(['id','iter',src_pos])
                    seq.push(['bracket','(',src_pos])
                    seq = seq.concat(stack.list.slice(iterable.start,iterable.end+1))
                    seq.push(['bracket',')',src_pos])
                    seq.push(['newline','\n',src_pos])
                    if(kw_indent){seq.push(['indent',kw_indent,src_pos])}
                    seq.push(['code','while(true){',src_pos])
                    seq.push(['newline','\n',src_pos])
                    seq.push(['indent',kw_indent+4,src_pos])
                    seq.push(['code','try{',src_pos])
                    seq.push(['newline','\n',src_pos])
                    seq.push(['indent',kw_indent+8,src_pos])
                    seq.push(['code','var $Next=next($Iterable'+loop_id+')',src_pos])
                    seq.push(['newline','\n',src_pos])
                    seq.push(['indent',kw_indent+8,src_pos])
                    seq = seq.concat(stack.list.slice(arg_list.start,arg_list.end+1))
                    seq.push(['assign','=',src_pos])
                    seq.push(['code','$Next',src_pos])
                    seq = seq.concat(stack.list.slice(block[0],block[1]))
                    // code to include at block end
                    seq.push(['indent',kw_indent+4,src_pos])
                    seq.push(['code','}catch(err){',src_pos])
                    seq.push(['newline','\n',src_pos])
                    seq.push(['indent',kw_indent+8,src_pos])
                    seq.push(['code','if(err.name=="StopIteration"){break}',src_pos])
                    seq.push(['newline','\n',src_pos])
                    seq.push(['indent',kw_indent+8,src_pos])
                    seq.push(['code','else{throw err}',src_pos])
                    seq.push(['newline','\n',src_pos])
                    seq.push(['indent',kw_indent+4,src_pos])
                    seq.push(['code','}',src_pos])
                    stack.list = stack.list.slice(0,kw_pos)
                    stack.list = stack.list.concat(seq)
                } else { // if and elif : use bool()
                    var seq = [['bracket','(',src_pos]]
                    seq.push(['code','$bool',src_pos])
                    seq.push(['bracket','(',src_pos])
                    seq = seq.concat(stack.list.slice(kw_pos+1,block[0]))
                    seq.push(['bracket',')',src_pos]) // close bool
                    seq.push(['bracket',')',src_pos]) // close if / elif
                    seq.push(stack.list[block[0]])
                    seq = seq.concat(stack.list.slice(block[0]+1,block[1]))
                    stack.list = stack.list.slice(0,kw_pos+1)
                    stack.list = stack.list.concat(seq)
                }
            } else if(kws[kw]=="function"){
                var func_name = stack.list[kw_pos+1]
                var i=0,parent = null
                for(i=$funcs.length-1;i>=0;i--){
                    if(kw_pos>$funcs[i][1] && kw_pos<$funcs[i][2]){parent = $funcs[i][0];break}
                }
                $funcs.push([func_name[1],block[0],block[1],parent])
                // function name is a special id (for to_js())
                stack.list[kw_pos+1][0]="function_id"
                seq = stack.list.slice(kw_pos+1,block[0]+1)
                var fbody = stack.list.slice(block[0]+1,block[1])
                // create function namespace
                fbody.splice(0,0,['code','$ns["'+func_name[1]+'"]={};',0])
                seq = seq.concat(fbody)
                // mark all ids with function name
                for(var i=0;i<seq.length;i++){
                    if(seq[i][0]=="id" || seq[i][0]=="assign_id"){
                        seq[i].push(func_name[1])
                    }
                }
                stack.list = stack.list.slice(0,kw_pos+1)
                stack.list = stack.list.concat(seq)
                // set attribute __class__ of function
                var fname = stack.list[kw_pos+1][1]
                var code = ';'+fname+'.__class__ = Function;'
                if(parent==null){
                    code += 'window.'+fname+'='+fname+';'
                    module_level_functions.push(fname)
                } else {
                    code += '$ns["'+parent+'"]["'+fname+'"]='+fname+';'
                }
                tail.splice(0,0,['code',code])
            }else if(kw=="except"){
                var exc = new Stack(stack.list.slice(kw_pos+1,block[0]))
                if(exc.list.length>0){
                    var excs = stack.atom_at(kw_pos+1,true)
                    if(excs.type=="function_call"){
                        document.line_num = pos2line[stack.list[kw_pos][2]]
                        throw new SyntaxError("can only handle a single exception")
                    }
                    else if(excs.type=="id"){
                        var exc_name = stack.list[kw_pos+1][1]
                        var _block = stack.list.slice(block[0]+1,block[1])
                        stack.list = stack.list.slice(0,block[0]+1)
                        stack.list.splice(kw_pos+1,1)
                        stack.list.push(['code',
                            'if($exc.name!="'+exc_name+'"){throw $exc};',
                            stack.list[block[0][2]]])
                        stack.list = stack.list.concat(_block)
                    }
                }
            } else {
                stack.list = stack.list.slice(0,block[1])
            }
            stack.list.push(['newline','\n',end_pos])
            if(block[2]>0){
                stack.list.push(['indent',block[2],end_pos])
            }
            stack.list.push(['bracket','}',end_pos])
            stack.list = stack.list.concat(tail)
            pos = kw_pos+1
        }
    }
    
    // operators with authorized left operand types
    var ops_order = ["**","*","/","//","%","+","-",
        "<","<=",">",">=","!=","==",
        "+=","-=","*=","/=","//=","%=","**=",
        "and","or","in","not_in","is_not"]

    var ops = [], op = null
    var lo1 = $List2Dict(["id","bracket"])
    var lo2 = $List2Dict(["id","bracket","delimiter","operator"])
    $ForEach(ops_order).Do(function(op){
        if(op=="+" || op=="-"){
            ops.push([op,lo2])
        } else {
            ops.push([op,lo1])
        }
    })

    $ForEach(ops).Do(
    function(operator){
        var op_sign = operator[0]
        var auth_lo_types = operator[1]
        var py_op = '__'+$operators[op_sign]+'__'
        pos = stack.list.length-1
        while(true){
            var op = stack.find_previous(pos,"operator",op_sign)
            if(op==null){break}
            // left operand
            var lo = stack.atom_before(op,false)
            if(!lo.type in $List2Dict('id','literal','tuple')){
                document.line_num = pos2line[stack.list[op][2]]
                throw new SyntaxError("Bad left operand type "+lo.type+" for "+op_sign)
            }
            var par_before_lo = false
            if(lo.type!="tuple"){
                var before_lo = stack.list[lo.start-1]
                if(before_lo!=null){
                    if(before_lo[0]=="operator"){
                        par_before_lo = true
                    }
                }
            }
            if(op==stack.list.length-1){
                throw new SyntaxError("Bad right operand ",src,stack.list[op][2])
            }
            var ro = stack.atom_at(op+1,false)
            var los = new Stack(lo), ros = new Stack(lo)
            var ro_startswith_par = false
            if(ro!=null && ro.type=="tuple"){ro_startswith_par=true}
            
            // build replacement sequence
            var sequence = new Array()
            // add leading bracket if absent
            if(par_before_lo){sequence.push(["bracket","(",op[2]])}
            // add left operand
            sequence = sequence.concat(stack.list.slice(lo.start,lo.end+1))
            // add point and Python method
            sequence.push(["point",".",op[2]])
            sequence.push(["qualifier",py_op,op[2]])
            // add leading bracket if absent
            if(!ro_startswith_par){sequence.push(["bracket","(",op[2]])}
            // add right operand
            sequence = sequence.concat(stack.list.slice(ro.start,ro.end+1))
            // add trailing bracket if needed
            if(!ro_startswith_par){sequence.push(["bracket",")",op[2]])}
            // add trailing bracket if absent
            if(par_before_lo){sequence.push(["bracket",")",op[2]])}

            // sequence is complete. Remove previous operation
            tail = stack.list.slice(ro.end+1,stack.list.length)
            stack.list.splice(lo.start,ro.end-lo.start+1)
            // insert new sequence
            stack.list = stack.list.slice(0,lo.start).concat(sequence).concat(tail)
            // set position for next search
            pos = op-1
        }
    })

    // replace not expr by not(expr)
    pos = stack.list.length-1
    while(true){
        var op = stack.find_previous(pos,"operator","not")
        if(op==null){break}
        ro = stack.atom_at(op+1)
        seq = [['bracket','(']]
        seq = seq.concat(ro.list())
        seq.push(['bracket',')'])
        stack.list = stack.list.slice(0,op+1).concat(seq).concat(stack.list.slice(ro.end+1,stack.length))
        pos = op-1
    }
            
    // simple replacements
    var js2py = {'pass':'void(0)'}
    for(key in js2py){
        pos = 0
        while(true){
            var func_pos = stack.find_next(pos,'keyword',key)
            if(func_pos==null){break}
            stack.list[func_pos][1]=js2py[key]
            pos = func_pos+1
        }
    }

    var js2py = {'alert':'$Alert','prompt':'PyPrompt','confirm':'PyConfirm'}
    for(key in js2py){
        pos = 0
        while(true){
            var func_pos = stack.find_next(pos,'id',key)
            if(func_pos==null){break}
            stack.list[func_pos][0]='code' // to avoid resolution
            stack.list[func_pos][1]=js2py[key]
            pos = func_pos+1
        }
    }

    // assignments
    pos = stack.list.length-1
    while(true){
        var assign = stack.find_previous(pos,"assign","=")
        if(assign==null){break}
        var left = stack.atom_before(assign,true)
        var right = stack.atom_at(assign+1,true)
        if(left.type=="tuple" || left.type=="implicit_tuple"){
            // for multiple assignments
            var list = left.list()
            if(list[0][0]=="bracket"){
                list = list.slice(1,list.length-1)
            }
            var t_stack = new Stack(list)
            var targets = t_stack.split(',')
            document.line_num = pos2line[stack.list[assign][2]]
            var seq = $Assign(targets,right,stack.list[assign][2])
            tail = stack.list.slice(right.end+1,stack.list.length)
            stack.list = stack.list.slice(0,left.start).concat(seq).concat(tail)
            pos = left.start+seq.length-1
        } else if(left.type=='literal'){
            pos = left.list()[0][2]
            document.line_num = pos2line[pos]
            throw new SyntaxError("can't assign to literal")
        } else if(left.type=='qualified_id' || left.type=='slicing' || left.type=="function_call"){
            pos = assign-1
        } else {            
            // simple assignment - change type of left operand for JS rendering
            left.list()[0][0]="assign_id"
            pos = assign-1
        }
    }
    

    // remaining [ indicate subscription or slicing
    pos = stack.list.length-1
    while(true){
        br_pos = stack.find_previous(pos,'bracket','[')
        if(br_pos==null){break}
        src_pos = stack.list[br_pos][2]
        var end = stack.find_next_matching(br_pos)
        
        // create arguments for subscription or slicing
        var args = stack.list.slice(br_pos+1,end)
        var args1 = new Stack(args)
        var items = args1.split(":") // items are instances of Stack
        // replace : by ,
        var new_args = []
        if(items.length==1){ // single argument = subscription
            new_args = items[0].list
        } else { // slicing
            new_args = [['id','slice',src_pos]]
            new_args.push(['bracket','(',src_pos])
            $ForEach(items).Enumerate(function(i,item){
                if(item.list.length==0){
                    new_args.push(['keyword','null',src_pos])
                } else {
                    new_args = new_args.concat(item.list)
                }
                if(i<items.length-1){
                    new_args.push(["delimiter",",",src_pos])
                }
            })
            new_args.push(['bracket',')',stack.list[end][2]]) // close slice
        }
        // if end is followed by = it's an assignment to a slicing
        if(end<stack.list.length-1 && stack.list[end+1][0]=="assign"){
            // x[s]=y ==> x.__setitem__(s,y)
            var sequence = [['point','.',src_pos],['qualifier','__setitem__',src_pos],
                ['bracket','(',src_pos]]
            left = stack.atom_before(end+1)
            right = stack.atom_at(end+2)
            sequence = sequence.concat(new_args)
            sequence.push(['delimiter',',',stack.list[end+1][2]]) // replace =
            sequence = sequence.concat(right.list())
            sequence.push(['bracket',')',stack.list[end][2]]) // close __setitem__
            tail = stack.list.slice(right.end+1,stack.list.length)
            stack.list = stack.list.slice(0,br_pos)
            stack.list = stack.list.concat(sequence).concat(tail)
        } else {
            var sequence = [['point','.',src_pos],['qualifier','__getitem__',src_pos],
                ['bracket','(',src_pos]]
            sequence = sequence.concat(new_args)
            sequence.push(['bracket',')',stack.list[end][2]]) // close __getitem__
            tail = stack.list.slice(end+1,stack.list.length)
            stack.list = stack.list.slice(0,br_pos)
            stack.list = stack.list.concat(sequence).concat(tail)
        }
        pos = br_pos-1
    }

    // replace qualifiers by __getattr__ or __setattr___
    pos = stack.list.length-1
    while(true){
        q_pos = stack.find_previous(pos,'qualifier')
        if(q_pos==null){break}
        src_pos = stack.list[q_pos][2]
        if(q_pos<stack.list.length-1 && stack.list[q_pos+1][0]=="assign"){
            // assign to qualifier = set attribute
            var ro = stack.atom_at(q_pos+2)
            var q_name = stack.list[q_pos][1]
            if(q_name.substr(0,2)=='__'){pos=q_pos-1;continue}
            tail = stack.list.slice(ro.end+1,stack.list.length)
            var seq = [['code','__setattr__'],['bracket','('],
                ['literal',"'"+q_name+"'"],['delimiter',',']]
            seq = seq.concat(ro.list()).concat([['bracket',')']])
            stack.list = stack.list.slice(0,q_pos).concat(seq).concat(tail)
        }else{ // get attribute
            var q_name = stack.list[q_pos][1]
            if(q_name.substr(0,2)=='__'){pos=q_pos-1;continue}
            stack.list.splice(q_pos,1,['id','__getattr__'],['bracket','('],
                ['literal',"'"+q_name+"'"],['bracket',')'])
        }
        pos = q_pos-1
    }

    // return stack
    return stack
}

function $run(js){
    eval(js)
}

function brython(debug){
    var elts = document.getElementsByTagName("script")
    for($i=0;$i<elts.length;$i++){
        elt = elts[$i]
        if(elt.type=="text/brython"){
            var src = (elt.innerHTML || elt.textContent)
            js = py2js(src).to_js()
            if(debug){document.write('<textarea cols=120 rows=30>'+js+'</textarea>')}
            $run(js)
        }
    }
}