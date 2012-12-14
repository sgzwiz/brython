
function $MakeArgs($args,$required,$defaults,$other_args,$other_kw){
    // builds a namespace from the arguments provided in $args
    // in a function call like foo(x,y,z=1,*args,**kw) the parameters are
    // $required : ['x','y']
    // $defaults : {'z':int(1)}
    // $other_args = 'args'
    // $other_kw = 'kw'
    var i=null
    var $PyVars = {}
    var $def_names = []
    var $ns = {}
    for(k in $defaults){$def_names.push(k);$ns[k]=$defaults[k]}
    if($other_args != null){$ns[$other_args]=[]}
    if($other_kw != null){$dict_items=[]}
    for(i=0;i<$args.length;i++){
        $arg=$args[i]
        $PyVar=$JS2Py($arg)
        if(!isinstance($arg,$Kw)){ // positional arguments
            if(i<$required.length){
                eval($required[i]+"=$PyVar")
                $ns[$required[i]]=$PyVar
            } else if(i<$required.length+$def_names.length) {
                $ns[$def_names[i-$required.length]]=$PyVar
            } else if($other_args!=null){
                eval('$ns["'+$other_args+'"].push($PyVar)')
            } else {
                msg = $fname+"() takes "+$required.length+' positional arguments '
                msg += 'but more were given'
                throw TypeError(msg)
            }
        } else{ // keyword arguments
            $PyVar = $arg.value
            if($arg.name in $PyVars){
                throw new TypeError($fname+"() got multiple values for argument '"+$arg.name+"'")
            } else if($required.indexOf($arg.name)>-1){
                var ix = $required.indexOf($arg.name)
                eval($required[ix]+"=$PyVar")
                $ns[$required[ix]]=$PyVar
            } else if($arg.name in $defaults){
                $ns[$arg.name]=$arg
            } else if($other_kw!=null){
                $dict_items.push([$arg.name,$PyVar])
            } else {
                throw new TypeError($fname+"() got an unexpected keyword argument '"+$arg.name+"'")
            }
            if($arg.name in $defaults){delete $defaults[$arg.name]}
        }
    }
    if($other_kw!=null){$ns[$other_kw]=dict($dict_items)}
    return $ns
}

function $multiple_assign(indent,targets,right_expr,assign_pos){
    var i=0,target=null
    // for local variables inside functions, insert "var"
    for(var i=0;i<targets.list;i++){
        var left = targets[i]
        if(left.list[0][3]==="local"){left.list[0][1]="var "+left.list[0][1]}
    }
    var rlist = right_expr.list()
    if(rlist[0][0]=="bracket"){rlist=rlist.slice(1,rlist.length-1)}
    var rs = new Stack(rlist)
    var rs_items = rs.split(',')
    if(rs_items.length>1){
        if(rs_items.length>targets.length){
            $raise("ValueError","Too many values to unpack (expected "+targets.length+")")
        } else if(rs_items.length<targets.length){
            $raise("ValueError","Need more than "+rs_items.length+" values to unpack")
        } else {
            // right operands are evaluated first and stored in a temporary variable
            var seq=[['code','var $temp=[]'],['newline','\n']]
            for(i=0;i<targets.length;i++){
                seq.push(['indent',indent],['code','$temp.push'],['bracket','('])
                seq = seq.concat(rs_items[i].list)
                seq.push(['bracket',')'],['newline','\n',assign_pos])
            }
            for(i=0;i<targets.length;i++){
                seq.push(['indent',indent])
                seq = seq.concat(targets[i].list)
                seq.push(['assign','=',assign_pos],
                    ['code','$temp['+i+']'],['newline','\n',assign_pos])
            }
        }        
    } else {
        var seq = [['code',"var $var",assign_pos],
            ['assign','=']]
        seq = seq.concat(right_expr.list())
        seq.push(['newline','\n',assign_pos])
        for(var i=0;i<targets.length;i++){
            target = targets[i]
            seq.push(['indent',indent])
            seq = seq.concat(target.list)
            seq.push(['assign','='],['code','$var.__item__('+i+')'],
                ['newline','\n'])
        }
    }
    return seq
}

$OpeningBrackets = $List2Dict('(','[','{')

function $py2js(src,context,debug){
    // context is "main" for the main script, the module name if import   
    document.$debug = debug
    var i = 0
    src = src.replace(/\r\n/gm,'\n')
    while (src.length>0 && (src.charAt(0)=="\n" || src.charAt(0)=="\r")){
        src = src.substr(1)
    }
    if(src.charAt(src.length-1)!="\n"){src+='\n'}
    if(!context){context='__main__';document.$py_src={'__main__':src}}
    else{document.$py_src[context] = src}
    document.$context = context
    
    // map position to line number
    var pos2line = {}
    var lnum=1
    for(i=0;i<src.length;i++){
        pos2line[i]=lnum
        if(src.charAt(i)=='\n'){lnum+=1}
    }
    var dobj = new Date()
    var t0 = dobj.getTime()
    var times = {}
        
    // tokenization
    tokens = $tokenize(src)

    stack = new Stack(tokens)
    
    var $err_num = 0
    // add a line number at the end of each line in source code
    // used for traceback
    if(debug){
        var pos = 0
        var s_nl = 0
        while(true){
            var nl = stack.find_next(pos,'newline')
            if(nl==null){break}
            var indent_pos = stack.find_previous(nl,'indent')
            if(!stack.list[indent_pos+1].match(['keyword','else']) &&
                !stack.list[indent_pos+1].match(['keyword','elif']) &&
                !stack.list[indent_pos+1].match(['keyword','except'])){
                stack.list.splice(s_nl,0,stack.list[indent_pos],
                    ['code','document.line_num='+stack.list[nl][1],stack.list[nl][2]],
                    ['newline','\n'])
                s_nl = nl+4
                pos = nl+5
            }else{
                s_nl = nl+1
                pos = nl+2
            }
        }
    }
    var dobj = new Date()
    times['add line nums'] = dobj.getTime()-t0
    
    // replace "not in" and "is not" by operator
    var repl = [['not','in'],['is','not']]
    for(i=0;i<repl.length;i++){
        var seq = repl[i]
        var pos = stack.list.length-1
        while(pos>0){
            var op_pos = stack.find_previous(pos,"operator",seq[1])
            if(op_pos==null){break}
            if(op_pos>1 && stack.list[op_pos-1].match(["operator",seq[0]])){
                stack.list.splice(op_pos-1,2,['operator',seq[0]+'_'+seq[1],stack.list[op_pos][2]])
            }
            pos = op_pos-2
        }
    }

    // for each opening bracket, define after which token_types[,token values] 
    // they are *not* the start of a display
    var not_a_display = { 
        '[':[["id"],["assign_id"],['str'],['int'],['float'],["qualifier"],["bracket",$List2Dict("]",")")]], // slicing
        '(':[["id"],["assign_id"],["qualifier"],["bracket",$List2Dict("]",")")]], // call
        '{':[[]] // always a display
        }
    var PyType = {'(':'tuple','[':'$list','{':'dict'}
    var br_list = ['[','(','{']
    for(var ibr=0;ibr<br_list.length;ibr++){
        var bracket = br_list[ibr]
        var pos = stack.list.length-1
        while(true){
            var br_elt = stack.find_previous(pos,"bracket",bracket)
            if(br_elt==null){break}
            if(br_elt>0){
                var previous = stack.list[br_elt-1]
                var is_display = true
                for(var inad=0;inad<not_a_display[bracket].length;inad++){
                    var args = not_a_display[bracket][inad]
                    if(args[0]==previous[0]){
                        if(args.length!=2 || (previous[1] in args[1])){
                            is_display = false
                        }
                    }
                }
                if(!is_display){pos = br_elt-1;continue}
                // display : insert tuple, list or dict
                var pyType = PyType[bracket]
                var br_pos = stack.list[br_elt][2]
                var sequence = [['id',pyType,br_elt[2]],['bracket','(',br_pos]]
                var end = stack.find_next_matching(br_elt)
                if(pyType=='dict'){
                    // split elements
                    var args = new Stack(stack.list.slice(br_elt+1,end))
                    if(args.list.length>0){
                        sequence = [['id','dict'],['bracket','('],
                            ['id','$list'],['bracket','(']]
                        var kvs = args.split(',') // array of Stack instances
                        for(var ikv=0;ikv<kvs.length;ikv++){
                            var kv = kvs[ikv]
                            // each kv has attributes start and end = position in args
                            var elts = kv.split(':')
                            if(elts.length!=2){
                                document.line_num = pos2line[br_pos]
                                $raise("SyntaxError","invalid syntax")
                            }
                            var key = elts[0] // key.start = position in kv
                            var value = elts[1]
                            // key and value are atoms with start and end relative to kv
                            // position of key in args is kv.start+key.start
                            var key_start = kv.start+key.start
                            var key_end = kv.start+key.end
                            sequence.push(['id','$list'])
                            sequence.push(['bracket','('])
                            sequence = sequence.concat(args.list.slice(key_start,key_end+1))
                            sequence.push(['delimiter',',',br_pos])
                            var value_start = kv.start+value.start
                            var value_end = kv.start+value.end
                            sequence = sequence.concat(args.list.slice(value_start,value_end+1))
                            sequence.push(['bracket',')'])
                            sequence.push(['delimiter',',',br_pos])
                        }
                        sequence.pop() // remove last comma
                        sequence.push(['bracket',')']) // close list of (key,value) lists
                    }
                    sequence.push(['bracket',')',stack.list[end][2]])
                }else if(pyType=='tuple'){
                    var args = new Stack(stack.list.slice(br_elt+1,end))
                    var kvs = args.split(',') // array of Stack instances
                    if(kvs.length==1){sequence[0][1]='$tuple'} // single value, not tuple
                    if(kvs[kvs.length-1].list.length==0){ // tuple ends with ,)
                        if(kvs.length==2){sequence[0][1]='$tuple'} // single value, not tuple
                        stack.list[end-1]=['code',''] // remove last comma
                    }
                    sequence = sequence.concat(stack.list.slice(br_elt+1,end))
                    sequence.push(['bracket',')',stack.list[end][2]])
                }else{ // list
                    var args = new Stack(stack.list.slice(br_elt+1,end))
                    if(end > br_elt+1){ // not empty list
                        sequence = sequence.concat(stack.list.slice(br_elt+1,end))
                        sequence.push(['bracket',')',stack.list[end][2]])
                    }else{sequence.push(['bracket',')',stack.list[end][2]])}
                }
                tail = stack.list.slice(end+1,stack.list.length)
                stack.list = stack.list.slice(0,br_elt)
                stack.list = stack.list.concat(sequence)
                stack.list = stack.list.concat(tail)
            }
            pos = br_elt - 1
        }    
    }
    
    var dobj = new Date()
    times['displays'] = dobj.getTime()-t0

    // conversion of arguments in function definitions
    var pos = stack.list.length-1
    while(true){
        var def_pos = stack.find_previous(pos,"keyword","def")
        if(def_pos==null){break}
        var func_token = stack.list[def_pos+1]
        var arg_start = stack.list[def_pos+2]
        var indent_pos = stack.find_next(def_pos,'indent')
        var indent = stack.list[indent_pos][1]
        var f_indent = '\n'
        while(indent>0){f_indent+=' ';indent--}
        document.line_num = pos2line[func_token[2]]
        if(!func_token[0]=='id'){$raise("SyntaxError","wrong type after def")}
        if(arg_start[0]!='bracket' || arg_start[1]!='('){$raise("SyntaxError","missing ( after function name")}
        if(func_token[0]=='id' && arg_start[0]=='bracket'
            && arg_start[1]=='(' && 
            !(stack.list[def_pos+3].match(["bracket",")"]))){
            // function definition
            arg_end = stack.find_next_matching(def_pos+2)
            // mark ids as argument ids
            for(var i=def_pos+2;i<arg_end;i++){
                if(stack.list[i][0]=='id'){stack.list[i][0]='arg_id'}
            }
            var s = new Stack(stack.list.slice(def_pos+3,arg_end))
            var args = s.split(',') // list of stacks
            var required = []
            var defaults = []
            var has_defaults = false
            var other_args = null
            var other_kw = null
            for(var i=args.length-1;i>=0;i--){
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
                        defaults.push([elts[0].list[0][1],elts[1].to_js()])
                        has_defaults = true
                    } else {  // required positional argument
                        required.push(arg.list[0][1])
                    }
                    // remove argument
                    if(i==0){
                        stack.list.splice(def_pos+3+arg.start,arg.end-arg.start+1)
                    } else {
                        stack.list.splice(def_pos+2+arg.start,arg.end-arg.start+2)
                    }
                }
            }
             // insert code after end of function definition (next delimiter ':')
            var end_def = stack.find_next_at_same_level(def_pos,"delimiter",":")
            if(end_def==null){
                $raise("SyntaxError","Unable to find definition end "+end_def)
            }
            var arg_code = 'arguments,'
            
            if(required.length==0){arg_code+='[],'}
            else{
                arg_code += '['
                required.reverse()
                for(ireq=0;ireq<required.length;ireq++){
                    arg_code+="'"+required[ireq]+"',"
                }
                arg_code = arg_code.substr(0,arg_code.length-1)+"],"
            }

            var def_code = '{'
            if(has_defaults){
                for($idef=0;$idef<defaults.length;$idef++){
                    def_code += '"'+defaults[$idef][0]+'":'+defaults[$idef][1]+','
                }
                def_code = def_code.substr(0,def_code.length-1)
            }
            def_code += '}'
            arg_code += def_code+','
            if(other_args==null){arg_code+="null,"}
            else{arg_code += '"'+other_args+'",'}
            if(other_kw==null){arg_code+="null"}
            else{arg_code += '"'+other_kw+'"'}
            var fcode = f_indent+'for($var in $ns){eval("var "+$var+"=$ns[$var]")}'
            stack.list.splice(end_def+1,0,
                ['code',f_indent+"$ns=$MakeArgs("+arg_code+")"+fcode,stack.list[end_def][2]])
       }
        pos = def_pos-1
    }

    var dobj = new Date()
    times['function defs'] = dobj.getTime()-t0

    // calls
    pos = stack.list.length-1
    while(true){
        var br_pos = stack.find_previous(pos,"bracket","(")
        if(br_pos==null){break}
        if((stack.list[br_pos-1][0]=='id' || stack.list[br_pos-1][0]=="qualifier")
            && br_pos>1 && 
            !(stack.list[br_pos-2].match(["keyword",'def']))){
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
    var dobj = new Date()
    times['function calls'] = dobj.getTime()-t0

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
                (stack.list[sign-1][0]=="bracket" && ("({[".indexOf(stack.list[sign-1][1])>-1)))){
            if(sign<stack.list.length-1){
                var next = stack.list[sign+1]
                if(next[0]=="int" || next[0]=="float") { // literal
                    var value = next[1]
                    if(op[1]=='-'){
                        stack.list[sign+1][1]=-1*stack.list[sign+1][1]
                    }
                    // remove unary sign
                    stack.list.splice(sign,1)
                } else if(next[0]=="id") { // insert 1 * or -1 *
                    var mult = 1
                    if(op[1]=="-"){mult=-1}
                    stack.list.splice(sign,1,["int",mult,op[2]],
                        ['operator','*',op[2]])
                }
            }
        }
        pos=sign+1
    }
    
    // replace import module_list by $import(module_list)
    pos = 0
    while(pos<stack.list.length){
        var imp_pos = stack.find_next(pos,"keyword","import")
        if(imp_pos==null){break}
        var imported = stack.atom_at(imp_pos+1,true)
        if(imported.type != 'id' && imported.type != 'tuple'){
            document.line_num = pos2line[stack.list[imp_pos][2]]
            $raise("SyntaxError","invalid syntax")
        }
        for(var i=0;i<imported.list().length;i++){
            if(stack.list[imported.start+i][0]=="id"){
                stack.list[imported.start+i][0]='str'
                stack.list[imported.start+i][1]='"'+stack.list[imported.start+i][1]+'"'
            }
        }
        var src_pos = stack.list[imp_pos][2]
        stack.list.splice(imported.end+1,0,['bracket',')'])
        stack.list.splice(imp_pos,1,
            ['code','$import',src_pos],['bracket','(',src_pos])
        pos = imp_pos+1
    }

    var dobj = new Date()
    times['misc'] = dobj.getTime()-t0
    
    // for "try", close block by "catch(err)"
    var pos = 0
    while(true){
        var try_pos = stack.find_next(pos,"keyword","try")
        if(try_pos===null){break}
        var try_indent = 0
        if(try_pos==0){try_indent=0}
        else if(stack.list[try_pos-1][0]=='indent'){try_indent = stack.list[try_pos-1][1]}
        var block = stack.find_block(try_pos)
        var nxt = block[1]
        // find all except clauses for this try
        var exc_pos = try_pos
        var clauses = []
        while(true){
            exc_pos = stack.next_at_same_indent(exc_pos)
            if(exc_pos===null){break}
            if(stack.list[exc_pos][0]!=="keyword" &&
                ["except","finally","else"].indexOf(stack.list[exc_pos][1])==-1){
                    break
            }
            clauses.push(exc_pos)
        }
        // end of try..except blocks
        if(clauses.length==0){$raise('SyntaxError','invalid syntax')}
        var last_block = stack.find_block(clauses[clauses.length-1])
        // indent except blocks
        for(var i=clauses[0]-1;i<last_block[1];i++){
            if(stack.list[i][0]=="indent"){
                stack.list[i][1] = stack.list[i][1]+4
            }
        }
        for(var i=clauses.length-1;i>=0;i--){
            var clause = stack.list[clauses[i]]
            if(clause[1]=='except'){
                // replace by 'else'
                stack.list[clauses[i]][1]='else'
                if(!stack.list[clauses[i]+1].match(['delimiter',':'])){
                    // an exception is specified
                    var excs = stack.atom_at(clauses[i]+1,true)
                    if(excs.type=="id"){
                        var exc = stack.list[clauses[i]+1]
                        stack.list[clauses[i]+1]=['code','if($err'+$err_num+'.name=="'+exc[1]+'")']
                    }else if(excs.type=="function_call"){
                        var exc_str = [],exc_list = excs.list()
                        for(var j=2;j<exc_list.length;j++){
                            if(exc_list[j][0]=="id"){exc_str.push('"'+exc_list[j][1]+'"')}
                        }
                        stack.list.splice(clauses[i]+1,exc_list.length,
                            ['code','if(['+exc_str.join(',')+'].indexOf($err'+$err_num+'.name)>-1)'])
                    }else{$raise('SyntaxError','invalid syntax')}
                }
            }
        }
        // insert pseudo-Python code "catch $err:" just after the "try" block
        stack.list.splice(nxt+1,0,['indent',try_indent],['keyword','catch'],
            ['id','$err'+$err_num],['delimiter',':'],['newline','\n'])
        // add a line before all except clauses to avoid syntax error if there is only 
        // one clause "except:" without an error name
        stack.list.splice(nxt+6,0,['indent',try_indent+4],['code','if(false){void(0)}'],
            ['newline','\n'])
        pos = try_pos+1
        $err_num++
    }

    // "assert condition" becomes "if condition: pass else: raise AssertionError"
    var pos = 0
    while(true){
        var assert_pos = stack.find_next(pos,"keyword","assert")
        if(assert_pos===null){break}
        var assert_indent = 0
        if(assert_pos==0){assert_indent=0}
        else if(stack.list[assert_pos-1][0]=='indent'){assert_indent = stack.list[assert_pos-1][1]}
        var end = stack.find_next(assert_pos,"newline")
        if(end===null){end=stack.list.length-1}
        var cond_block = stack.list.slice(assert_pos+1,end+1)
        alert(cond_block)
        // replace assert by if
        stack.list.splice(assert_pos,1,['keyword','if'])
        stack.dump()
        stack.list.splice(end-1,0,['delimiter',':'],['newline','\n'],
            ['indent',assert_indent+4],['keyword','pass'],['newline','\n'])
        stack.dump()
        if(assert_indent>0){stack.list.splice(end+4,0,['indent',assert_indent]);end++}
        stack.list.splice(end+4,0,['keyword','else'],['delimiter',':'],['newline','\n'],
            ['indent',assert_indent+4],['code','$raise("AssertionError")'])
        stack.dump()
        pos = assert_pos+1
    }

    // replace if,elif,else,def,for,try,catch,finally by equivalents
    var kws = {'if':'if','else':'else','elif':'else if',
        'def':'function','for':'for','while':'while',
        'try':'try','catch':'catch','finally':'finally'}
    var has_parenth = $List2Dict('if','elif','while','for','catch')
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
            if(block===null){
                document.line_num = pos2line[stack.list[kw_pos][2]]
                $raise('SyntaxError')
            }
            // block[0] = position of :
            // block[1] = last newline of block
            s = new Stack(stack.list.slice(block[0],block[1]+1))
            if(block==null){console.log('anomalie '+kw);pos=kw_pos-1;continue}
            var multiline = (s.find_next(0,'newline')!=null)
            // replace by Javascript keyword
            stack.list[kw_pos][1] = kws[kw]
            // replace : by {
            stack.list[block[0]]=['bracket','{']
            var end_pos = stack.list[block[1]][2]

            tail = stack.list.slice(block[1],stack.list.length)
            if(kw in has_parenth){
                if(kw=="for"){
                    loop_id++
                    var block_indent = stack.indent(block[0]+1)
                    var arg_list = stack.atom_at(kw_pos+1,true) // accept implicit tuple
                    var _in = stack.atom_at(arg_list.end+1)
                    var _in_list = stack.list.slice(_in.start,_in.end+1)
                    if(_in_list.length != 1 || 
                        _in_list[0][0]!="operator" || _in_list[0][1]!="in"){
                        $raise("SyntaxError","missing 'in' after 'for'",src,src_pos)
                    }
                    var iterable = stack.atom_at(_in.end+1,true)
                    // create temporary variable for iterator
                    seq = [['indent',kw_indent],
                        ['code','var $iter'+loop_id],['assign','=']]
                    seq = seq.concat(iterable.list())
                    seq.push(['newline','\n'],['indent',kw_indent],['code','for'])
                    //if(kw_indent){seq.push(['indent',kw_indent,src_pos])}
                    var $loop = '(var $i'+loop_id+'=0;$i'+loop_id+'<'
                    $loop += '$iter'+loop_id+'.__len__();$i'+loop_id+'++){'
                    seq = seq.concat([['code',$loop],['newline','\n'],
                        ['indent',block_indent]])
                    seq = seq.concat(arg_list.list())
                    seq.push(['assign','='],['id','$iter'+loop_id])
                    seq.push(['point','.'],['qualifier','__item__'],
                        ['bracket','('],['id','$i'+loop_id],['bracket',')'])
                    //seq.push(['newline','\n'],['indent',block_indent])
                    seq = seq.concat(stack.list.slice(block[0]+1,block[1]))
                    stack.list = stack.list.slice(0,kw_pos-1)
                    stack.list = stack.list.concat(seq)
                    $err_num++
                } else if(kw=='if' || kw=='elif' || kw=='while'){ // if and elif : use bool()
                    var seq = [['bracket','(',src_pos]]
                    seq = seq.concat(stack.list.slice(kw_pos+1,block[0]))
                    seq.push(['bracket',')',src_pos]) // close if / elif
                    seq.push(stack.list[block[0]])
                    seq = seq.concat(stack.list.slice(block[0]+1,block[1]))
                    stack.list = stack.list.slice(0,kw_pos+1)
                    stack.list = stack.list.concat(seq)
                } else{ // catch
                    var seq = [['bracket','(',src_pos]]
                    seq = seq.concat(stack.list.slice(kw_pos+1,block[0]))
                    seq.push(['bracket',')',src_pos])
                    seq.push(stack.list[block[0]])
                    seq = seq.concat(stack.list.slice(block[0]+1,block[1]))
                    stack.list = stack.list.slice(0,kw_pos+1)
                    stack.list = stack.list.concat(seq)
                }
            } else if(kws[kw]=="function"){
                var func_name = stack.list[kw_pos+1]
                var i=0,parent = false
                for(i=$funcs.length-1;i>=0;i--){
                    if(kw_pos>$funcs[i][1] && kw_pos<$funcs[i][2]){parent = true;break}
                }
                $funcs.push([func_name[1],block[0],block[1],parent])
                // function name is a special id (for to_js())
                stack.list[kw_pos+1][0]="function_id"
                seq = stack.list.slice(kw_pos+1,block[0]+1)
                var fbody = stack.list.slice(block[0]+1,block[1])
                // globals ?
                var globals={}
                var fstack = new Stack(fbody)
                var global_pos = fstack.find_next(0,'keyword','global')
                if(global_pos!==null){
                    var globs = fstack.atom_at(global_pos+1,true)
                    if(globs.type=="id" || globs.type=="tuple" ||
                        globs.type=="function_call"){
                            var glob_list = globs.list()
                            for(var i=0;i<glob_list.length;i++){
                                if(glob_list[i][0]=='id'){globals[glob_list[i][1]]=0}
                            }
                    }
                    fbody.splice(global_pos,glob_list.length+1)
                }
                seq = seq.concat(fbody)
                // mark local ids
                // will be used in assignments to insert "var"
                for(var i=0;i<seq.length;i++){
                    if(seq[i][0]=="id"){
                        if(!(seq[i][1] in globals)){seq[i].push('local')}
                    }
                }
                stack.list = stack.list.slice(0,kw_pos+1)
                stack.list = stack.list.concat(seq)
                // make function visible at window level
                var fname = stack.list[kw_pos+1][1]
                var indent = stack.indent(kw_pos)
                var f_indent = ''
                while(indent>0){f_indent+=' ';indent--}
                if(!parent){
                    var code = '\n'+f_indent+'window.'+fname+'='+fname
                    module_level_functions.push(fname)
                    tail.splice(0,0,['func_end',code])
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

    var dobj = new Date()
    times['if def class for'] = dobj.getTime()-t0

    // replace not expr by $not(expr)
    pos = stack.list.length-1
    while(true){
        var op = stack.find_previous(pos,"operator","not")
        if(op==null){break}
        ro = stack.atom_at(op+1)
        seq = [['bracket','(']]
        seq = seq.concat(ro.list())
        seq.push(['bracket',')'])
        stack.list[op]=["id","$not",stack.list[op][2]]
        var tail = stack.list.slice(ro.end+1,stack.list.length)
        stack.list = stack.list.slice(0,op+1).concat(seq).concat(tail)
        pos = op-1
    }

    // replace augmented assigns (x+=1) by simple operator (x=x+1)
    pos = stack.list.length-1
    while(true){
        var assign = stack.find_previous(pos,"assign")
        if(assign===null){break}
        if(stack.list[assign][1] in $augmented_assigns){
            var left = stack.atom_before(assign)
            // if left argument is an id, it must not be declared by "var"
            if(left.type=="id"){left.list()[0][3]="global"}
            var op = stack.list[assign][1]
            var simple_op = op.substr(0,op.length-1) // remove trailing =
            stack.list[assign][1]="=" // replace += by =
            // insert simple operator before right argument
            stack.list.splice(assign+1,0,['operator',simple_op])
            // copy left argument to the right of =
            for(var i=left.list().length-1;i>=0;i--){
                stack.list.splice(assign+1,0,left.list()[i])
            }
        }
        pos = assign-1
    }
                    
    // operators with authorized left operand types
    var ops_order = ["**","*","/","//","%","-","+",
        "<","<=",">",">=","!=","==",
        "+=","-=","*=","/=","//=","%=","**=",
        "not_in","in","is_not"]

    var ops = [], op = null
    var lo1 = $List2Dict(["id","bracket"])
    var lo2 = $List2Dict(["id","bracket","delimiter","operator"])
    for(var i=0;i<ops_order.length;i++){
        op = ops_order[i]
        if(op=="+" || op=="-"){
            ops.push([op,lo2])
        } else {
            ops.push([op,lo1])
        }
    }
    var $lo_ok = $List2Dict('id','str','int','float','tuple')
    for(var i=0;i<ops.length;i++){
        operator = ops[i]
        var op_sign = operator[0]
        var auth_lo_types = operator[1]
        var py_op = '__'+$operators[op_sign]+'__'
        pos = 0
        while(true){
            var op = stack.find_next(pos,"operator",op_sign)
            if(op==null){break}
            // left operand
            var lo = stack.atom_before(op,false)
            if(!lo.type in $lo_ok){
                document.line_num = pos2line[stack.list[op][2]]
                $raise("SyntaxError","Bad left operand type "+lo.type+" for "+op_sign)
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
                $raise("SyntaxError","Bad right operand ",src,stack.list[op][2])
            }
            var ro = stack.atom_at(op+1,false)
            if(op_sign in $List2Dict("+=","-=","*=","/=","//=","%=","**=")){
                // for augmented assignments, right operand is the rest of the statement
                ro.end = stack.find_next(op,'newline')-1
            } 
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
            pos = op+1
        }
    }

    // for "and" and "or", rely on JS to avoid useless evaluations
    // eg don't evaluate "x[5]==3" in "5 in x and x[5]==3" if 5 is not in x

    var ops = {"and":"&&","or":"||"}
    for(var op in ops){
        var pos = 0
        while(true){
            var op_pos = stack.find_next(pos,'operator',op)
            if(op_pos===null){break}
            stack.list[op_pos][1]=ops[op]
            var left = stack.atom_before(op_pos,false)
            var right = stack.atom_at(op_pos+1,false)
            var head = stack.list.slice(0,left.start)
            var tail = stack.list.slice(right.end+1,stack.list.length)
            var nb = 0
            if(left.list()[0].match(['bracket','('])){
                left = [['id','$test_item']].concat(left.list())
                nb++
            }else if(!left.list()[0].match(['id','$test_item'])){
                left = [['id','$test_item'],['bracket','(']].concat(left.list()).concat([['bracket',')']])
                nb += 3
            }else{
                left = left.list()
            }
            if(right.list()[0].match(['bracket','('])){
                right = [['id','$test_item']].concat(right.list())
                nb++
            }else{
                right = [['id','$test_item'],['bracket','(']].concat(right.list()).concat([['bracket',')']])
                nb+=3
            }
            stack.list = head
            stack.list = stack.list.concat(left).concat([['operator',ops[op]]]).concat(right)
            stack.list = stack.list.concat(tail)
            pos+=nb
        }
    }
    // enclose sequences of $test_item inside a $test_result()
    var pos=0
    while(true){
        var test_pos = stack.find_next(pos,'id','$test_item')
        if(test_pos===null){break}
        var test_end = stack.find_next_matching(test_pos+1)
        while(test_end<stack.list.length-1 && stack.list[test_end+1][0]=='operator'
            &&(stack.list[test_end+1][1]=='&&' || stack.list[test_end+1][1]=='||')){
            test_end = stack.find_next_matching(test_end+3)
        }
        stack.list.splice(test_end,0,['bracket',')'])
        stack.list.splice(test_pos,0,['code','$test_expr'],['bracket','('])
        pos = test_end
   }

    var dobj = new Date()
    times['operators'] = dobj.getTime()-t0
    
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

    var js2py = {'alert':'$alert','prompt':'$prompt','confirm':'$confirm'}
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
    // first step : split chained assignments :
    // transform x=y=0 into y=0;x=y
    var pos = stack.list.length-1
    while(true){
        var assign = stack.find_previous(pos,"assign","=")
        if(assign===null){break}
        var line_start = stack.line_start(assign)
        var line_end = stack.line_end(assign)
        var line_stack = new Stack(stack.list.slice(line_start,line_end))
        var line_pos = line_stack.list.length-1
        var assigns = []
        var nb_assigns = 0
        while(true){
            var assign_pos = line_stack.find_previous(line_pos,'assign','=')
            if(assign_pos===null){break}
            nb_assigns++
            var left = line_stack.atom_before(assign_pos,true)
            var right = line_stack.atom_at(assign_pos+1,true)
            assigns.push(stack.list[line_start]) // indent
            assigns = assigns.concat(left.list())
            assigns.push(["assign","="])
            assigns = assigns.concat(right.list())
            assigns.push(['newline','\n'])
            line_pos=assign_pos-1
        }
        if(nb_assigns>1){
            var assign_stack = new Stack(assigns)
            var tail = stack.list.slice(line_end,stack.list.length)
            stack.list = stack.list.slice(0,line_start).concat(assigns).concat(tail)
        }
        pos = line_start
    }

    pos = stack.list.length-1
    while(true){
        var assign = stack.find_previous(pos,"assign","=")
        if(assign==null){break}
        var left = stack.atom_before(assign,true)
        var right = stack.atom_at(assign+1,true)
        if(left.type=="tuple" || 
            (left.type=="function_call" && left.list()[0][1]=="tuple")){
            // for multiple assignments
            var list = left.list()
            if(list[0].match(["id","tuple"])){
                list = list.slice(2,list.length-1)
            }
            var t_stack = new Stack(list)
            var targets = t_stack.split(',')
            document.line_num = pos2line[stack.list[assign][2]]
            var indent = stack.indent(assign)
            var seq = $multiple_assign(indent,targets,right,stack.list[assign][2])
            var tail = stack.list.slice(right.end+1,stack.list.length)
            stack.list = stack.list.slice(0,left.start).concat(seq).concat(tail)
            pos = left.start+seq.length-1
        } else if(left.type=='str' || left.type=='int' || left.type=='float'){
            pos = left.list()[0][2]
            document.line_num = pos2line[pos]
            $raise("SyntaxError","can't assign to literal")
        } else if(left.type=='qualified_id' || left.type=='slicing' || left.type=="function_call"){
            pos = assign-1
        } else {
            // simple assignment
            // for local variables inside functions, insert "var"
            if(left.list()[0][3]==="local"){left.list()[0][1]="var "+left.list()[0][1]}
            pos = assign-1
        }
    }

    var dobj = new Date()
    times['assignments'] = dobj.getTime()-t0

    // remaining [ indicate subscription or slicing
    pos = stack.list.length-1
    while(true){
        br_pos = stack.find_previous(pos,'bracket','[')
        if(br_pos==null){break}
        if(br_pos==0){break}
        var previous = stack.list[br_pos-1]
        if(['id','qualifier','keyword'].indexOf(previous[0])==-1){pos=br_pos-1;continue}
        src_pos = stack.list[br_pos][2]
        var end = stack.find_next_matching(br_pos)
        
        // create arguments for subscription or slicing
        var args = stack.list.slice(br_pos+1,end)
        if(args.length==0){$raise('SyntaxError','invalid syntax')}
        var args1 = new Stack(args)
        var items = args1.split(":") // items are instances of Stack
        // replace : by ,
        var new_args = []
        if(items.length==1){ // single argument = subscription
            new_args = items[0].list
        } else { // slicing
            new_args = [['id','slice',src_pos]]
            new_args.push(['bracket','(',src_pos])
            for(var i=0;i<items.length;i++){
                var item = items[i]
                if(item.list.length==0){
                    new_args.push(['keyword','null',src_pos])
                } else {
                    new_args = new_args.concat(item.list)
                }
                if(i<items.length-1){
                    new_args.push(["delimiter",",",src_pos])
                }
            }
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
            var func = '__getitem__'
            var x = stack.atom_before(br_pos)
            if(x.start>0){
                var before = stack.list[x.start-1]
                if(before[0]=='keyword' && before[1]=='del'){
                    var func = '__delitem__'
                }
            }
            var sequence = [['point','.',src_pos],['qualifier',func,src_pos],
                ['bracket','(',src_pos]]
            sequence = sequence.concat(new_args)
            sequence.push(['bracket',')',stack.list[end][2]]) // close __getitem__
            tail = stack.list.slice(end+1,stack.list.length)
            stack.list = stack.list.slice(0,br_pos)
            stack.list = stack.list.concat(sequence).concat(tail)
            if(func=='__delitem__'){ // remove 'del'
                stack.list.splice(x.start-1,1)
            }                
        }
        pos = br_pos-1
    }

    var dobj = new Date()
    times['slicings'] = dobj.getTime()-t0

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
            var seq = [['id','__setattr__'],['bracket','('],
                ['code',"'"+q_name+"'"],['delimiter',',']]
            seq = seq.concat(ro.list()).concat([['bracket',')']])
            stack.list = stack.list.slice(0,q_pos).concat(seq).concat(tail)
        }else{ // get attribute if its name doesnt start with __
            var func = '__getattr__'
            var x = stack.atom_before(q_pos)
            if(x.start>0){
                var before = stack.list[x.start-1]
                if(before[0]=='keyword' && before[1]=='del'){
                    var func = '__delattr__'
                }
            }
            var q_name = stack.list[q_pos][1]
            if(q_name.substr(0,2)=='__'){pos=q_pos-1;continue}
            stack.list.splice(q_pos,1,['id',func],['bracket','('],
                ['code',"'"+q_name+"'"],['bracket',')'])
            if(func=='__delattr__'){ // remove 'del'
                stack.list.splice(x.start-1,1)
            }
        }
        pos = q_pos-1
    }
    
    // replace $list by arrays
    var pos=0
    while(true){
        var $list_pos = stack.find_next(pos,'id','$list')
        if($list_pos===null){break}
        stack.list.splice($list_pos,1)
        var end = stack.find_next_matching($list_pos)
        stack.list[$list_pos][1]='['
        stack.list[end][1]=']'
        pos = $list_pos
    }

    // add a try/except clause in functions, for traceback XXX
    var pos = 0
    while(true){
        var func_pos = stack.find_next(pos,'keyword','function')
        if(func_pos===null){break}
        var br_pos = stack.find_next_at_same_level(func_pos,'bracket','{')
        var end_pos = stack.find_next_matching(br_pos)
        var block = new Stack(stack.list.slice(br_pos+1,end_pos))
        pos = func_pos+1
    }

    var dobj = new Date()
    times['total'] = dobj.getTime()-t0

    return stack
}

function $run(js){
    eval(js)
}

function brython(debug){
    var elts = document.getElementsByTagName("script")
    for($i=0;$i<elts.length;$i++){
        var elt = elts[$i]
        if(elt.type=="text/python"){
            var src = (elt.innerHTML || elt.textContent)
            js = $py2js(src,null,debug).to_js()
            if(debug==2){document.write('<textarea cols=120 rows=30>'+js+'</textarea>')}
            try{
                $run(js)
            }catch(err){$raise('ExecutionError',err.message)
                if(err.py_error===undefined){$raise('ExecutionError',err.message)}
                else{throw err}
            }
        }
    }
}