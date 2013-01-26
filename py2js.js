
function $multiple_assign(indent,targets,right_expr,assign_pos){
    var i=0,target=null
    // for local variables inside functions, insert "var"
    for(var i=0;i<targets.list;i++){
        var left = targets[i]
        if(left.list[0][3]==="local"){left.list[0][1]="var "+left.list[0][1]}
    }
    var rlist = right_expr.list
    if(rlist[0][0]=="bracket"){rlist=rlist.slice(1,rlist.length-1)}
    var rs = new Stack(rlist)
    var rs_items = rs.split(',')
    var seq = []
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
        seq.push(['code',"var $var",assign_pos],['assign','='])
        seq = seq.concat(right_expr.list)
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

var $OpeningBrackets = $List2Dict('(','[','{')
var $ClosingBrackets = $List2Dict(')',']','}')

function $py2js(src,module){
    var i=0,pos=0
    src = src.replace(/\r\n/gm,'\n')
    while (src.length>0 && (src.charAt(0)=="\n" || src.charAt(0)=="\r")){
        src = src.substr(1)
    }
    if(src.charAt(src.length-1)!="\n"){src+='\n'}
    if(module===undefined){module="__main__"}
    document.$py_src[module]=src
    
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
    tokens = $tokenize(src,module)

    stack = new Stack(tokens)

    var $err_num = 0
    // add a line number at the end of each line in source code
    // used for traceback
    if(document.$debug){
        var pos = 0
        var s_nl = 0
        while(true){
            var nl = stack.find_next(pos,'newline')
            if(nl==null){break}
            var indent_pos = stack.find_previous(nl,'indent')
            if(!stack.list[indent_pos+1].match(['keyword','else']) &&
                !stack.list[indent_pos+1].match(['keyword','elif']) &&
                !stack.list[indent_pos+1].match(['keyword','except'])){
                stack.list.splice(s_nl,0,['indent',stack.list[indent_pos][1]],
                    ['code','document.$line_info=['+stack.list[nl][1]+',"'+module+'"]',stack.list[nl][2]],
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
    
    // list comprehensions
    pos = 0
    while(true){
        var br_pos = stack.find_next(pos,'bracket','[')
        if(br_pos===null){break}
        var end = stack.find_next_matching(br_pos)
        if(end-br_pos<5){pos=br_pos+1;continue}
        var for_pos = stack.find_next_at_same_level(br_pos+1,'keyword','for')

        if(for_pos===null){pos = br_pos+1;continue}

        var expr = stack.list.slice(br_pos+1,for_pos)

        var s_expr = new Stack(expr)
        var res_env = s_expr.ids_in()
        var in_pos = stack.find_next_at_same_level(for_pos+1,'operator','in')
        if(in_pos===null){$SyntaxError(module,"missing 'in' in list comprehension",br_pos)}
        var qesc = new RegExp('"',"g") // to escape double quotes in arguments
        var loops = []
        var env = [] // variables found in iterables and conditions
        var lvar = new Stack(stack.list.slice(for_pos+1,in_pos))
        var local_env = lvar.ids_in()
        // there may be other for ... in ...
        while(true){
            for_pos = stack.find_next_at_same_level(in_pos+1,'keyword','for')
            if(for_pos===null){break}
            // close previous loop
            var s = new Stack(stack.list.slice(in_pos+1,for_pos))
            env = env.concat(s.ids_in())
            loops.push([lvar.to_js(),s.to_js().replace(qesc,'\\"')])
            in_pos = stack.find_next_at_same_level(for_pos+1,'operator','in')
            if(in_pos===null){$SyntaxError(module,"missing 'in' in list comprehension",br_pos)}
            lvar = new Stack(stack.list.slice(for_pos+1,in_pos))
            local_env = local_env.concat(lvar.ids_in())
        }
        var if_pos = stack.find_next_at_same_level(in_pos,'keyword','if')
        if(if_pos===null){
            var s = new Stack(stack.list.slice(in_pos+1,end))
            env = env.concat(s.ids_in())
            loops.push([lvar.to_js(),s.to_js().replace(qesc,'\\"')])
            var cond=[]
        }else{
            var s = new Stack(stack.list.slice(in_pos+1,if_pos))
            env = env.concat(s.ids_in())
            loops.push([lvar.to_js(),s.to_js().replace(qesc,'\\"')])
            var cond=stack.list.slice(if_pos+1,end)
        }
        seq = '$list_comp(['
        for(var i=0;i<loops.length;i++){
            seq += '["'+loops[i][0]+'","'+loops[i][1]+'"]'
            if(i<loops.length-1){seq += ','}
        }
        seq += '],'
        s = new Stack(expr)
        seq += '"'+s.to_js()+'",'
        if(cond.length>0){
            var c_start = cond[0][2]
            var c_end = stack.list[end][2]-1
            var c_src = src.slice(c_start,c_end)
            seq += '"'+c_src.replace(qesc,'\\"')+'",['
        }else{seq += '"",['}
        // add to env the variables in result variables that are not defined inside
        // the list comprehension
        // eg in [ obj for i in range(10) ], add 'obj' to env
        // in [i for i in range(10)] don't add 'i'
        for(var k=0;k<res_env.length;k++){
            if(env.indexOf(res_env[k])==-1 &&
                local_env.indexOf(res_env[k])==-1){env.push(res_env[k])}
        }
        // pass environment variables as arguments with name and value
        for(var i=0;i<env.length;i++){
            seq+="'"+env[i]+"',"+env[i]
            if(i<env.length-1){seq+=','}    
        }
        seq += '])'
        var tail = stack.list.slice(end+1,stack.list.length)
        stack.list = stack.list.slice(0,br_pos).concat([['code',seq]]).concat(tail)
        pos = br_pos+1
    }

    // for each opening bracket, define after which token_types[,token values] 
    // they are *not* the start of a display
    var not_a_display = { 
        '[':[["id"],["assign_id"],['str'],['int'],['float'],["qualifier"],
            ["bracket",$List2Dict("]",")")]], // slicing
        '(':[["id"],["assign_id"],["qualifier"],["bracket",$List2Dict("]",")")]], // call
        '{':[[]] // always a display
        }
    var PyType = {'(':'tuple','[':'$list','{':'dict_or_set'}
    var br_list = ['[','(','{']
    for(var ibr=0;ibr<br_list.length;ibr++){
        var bracket = br_list[ibr]
        pos = stack.list.length-1
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
                if(pyType=='dict_or_set'){
                    // split elements
                    var args = new Stack(stack.list.slice(br_elt+1,end))
                    if(args.list.length===0){ // {} = empty dict, not empty set
                        sequence = [['id','dict'],['bracket','(']]
                    }else{
                        sequence = [['id','dict'],['bracket','('],
                            ['id','$list'],['bracket','(']]
                        var kvs = args.split(',') // array of Stack instances
                        var pyType=null
                        for(var ikv=0;ikv<kvs.length;ikv++){
                            var kv = kvs[ikv]
                            // each kv has attributes start and end = position in args
                            var elts = kv.split(':')
                            if(pyType==null){
                                if(elts.length==1){
                                    pyType='set'
                                    sequence = [['id','set'],['bracket','(']]
                                }
                                else if(elts.length==2){pyType='dict'}
                                else{console.log(elts);$SyntaxError(module,"invalid syntax",br_pos)}
                                sequence[0][0][1]=pyType
                            }
                            var key = elts[0] // key.start = position in kv
                            // key and value are atoms with start and end relative to kv
                            // position of key in args is kv.start+key.start
                            var key_start = kv.start+key.start
                            var key_end = kv.start+key.end
                            if(pyType=='dict'){
                                var value = elts[1]
                                sequence.push(['id','$list'])
                                sequence.push(['bracket','('])
                                sequence = sequence.concat(args.list.slice(key_start,key_end+1))
                                sequence.push(['delimiter',',',br_pos])
                                var value_start = kv.start+value.start
                                var value_end = kv.start+value.end
                                sequence = sequence.concat(args.list.slice(value_start,value_end+1))
                                sequence.push(['bracket',')'])
                                sequence.push(['delimiter',',',br_pos])
                            }else{ // set
                                sequence = sequence.concat(args.list.slice(key_start,key_end+1))
                                sequence.push(['delimiter',',',br_pos])
                            }
                        }
                        sequence.pop() // remove last comma
                        if(pyType=='dict'){
                            sequence.push(['bracket',')']) // close list of (key,value) lists
                        }
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
    
    // methods and functions
    var fkw = ['class','def'],$funcs=[]
    for(i=0;i<fkw.length;i++){
        pos = 0
        var kw=fkw[i]
        while(true){
            var fpos = stack.find_next(pos,'keyword',kw)
            if(fpos===null){break}
            var block = stack.find_block(fpos)
            var func_name = stack.list[fpos+1]
            var parent = -1
            var offset = 0
            for(var j=$funcs.length-1;j>=0;j--){
                if(fpos>$funcs[j][2] && fpos<$funcs[j][3]){parent = j;break}
            }
            $funcs.push([kw,func_name[1],block[0],block[1],parent])
            // mark methods
            if(kw=='def' && parent>-1 && $funcs[parent][0]=='class'){
                stack.list[fpos+1][0]='method_id'
                if(stack.list[fpos+1][1].substr(0,2)=='$$'){
                    stack.list[fpos+1][1]=stack.list[fpos+1][1].substr(2)
                }
            }
            // add first line inside classes to set local var $instance to self
            if(kw==='class'){
                var block_indent = stack.list[block[0]+2][1]
                stack.list.splice(block[0]+2,0,['indent',block_indent],
                    ['code','var $instance=this'],['newline','\n'])
                offset += 3
            }
            // add empty parameter list for classes without arguments
            if(kw==='class' && !stack.list[fpos+2].match(['bracket','('])){
                stack.list.splice(fpos+2,0,['bracket','('],['bracket',')'])
                offset += 2
            }
            pos = fpos+offset+1
        }
    }          

    // conversion of arguments in function definitions
    pos = stack.list.length-1
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
        if(func_token[0]!=='id' && func_token[0]!=='method_id'){
            $SyntaxError(module,"wrong type after def",def_pos)
        }
        if(arg_start[0]!='bracket' || arg_start[1]!='('){
            $SyntaxError(module,"missing ( after function name",def_pos)
        }
        var end_def = stack.find_next_at_same_level(def_pos,"delimiter",":")
        if(end_def==null){
            $SyntaxError(module,"Unable to find definition end "+end_def,def_pos)
        }
        var has_args = false
        if(arg_start[0]=='bracket' && arg_start[1]=='(' && 
            !(stack.list[def_pos+3].match(["bracket",")"]))){
            // function definition
            has_args = true
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
            var instance = null // initialised to first argument if class method
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
                    } else {  // positional argument
                        if(i==0 && func_token[0]==='method_id'){
                            // for methods, first argument is the instance
                            var instance = arg
                        }else{
                            required.push(arg.list[0][1])
                        }
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
            var arg_code = '"'+func_token[1]+'",arguments,'
            
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
        }
        var block = stack.find_block(def_pos) // begins with [delimiter,newline,indent]
        var block_indent = stack.list[block[0]+2][1]
        stack.list.splice(block[0]+2,0,['indent',block_indent],
            ['code','document.$func_info=["'+module+'","'+func_token[1]+'"]'],
            ['newline','\n'])
        if(has_args){stack.list.splice(block[0]+5,0,
            ['indent',block_indent],['code',"$ns=$MakeArgs("+arg_code+")"],['newline','\n'],
            ['indent',block_indent],['code','for($var in $ns){eval("var "+$var+"=$ns[$var]")}'],
            ['newline','\n'])
        }
        if(func_token[0]==='method_id'){ // set first argument to instance
            stack.list.splice(block[0]+11,0,['indent',block_indent],
                ['code','var '+instance.list[0][1]+'=$instance'],['newline','\n'])
        }
        if(document.$debug){
            var block = stack.find_block(def_pos) // begins with [delimiter,newline,indent]
            // insert a try clause after func_info
            stack.list.splice(block[0]+5,0,['indent',block_indent],
                ['code','try'], // not "keyword", would be treated as Python "try:"
                ['bracket','{'],['newline','\n'])
            // indent all lines in function block
            for(var i=block[0]+8;i<block[1]+4;i++){
                if(stack.list[i][0]==='indent'){
                    stack.list[i][1]=stack.list[i][1]+4
                }
            }
            // end with catch
            stack.list.splice(block[1]+4,0,['newline','\n'],['indent',block_indent],
                ['bracket','}'],['code','catch(err'+$err_num+')'],
                ['code','{$raise(err'+$err_num+'.name,err'+$err_num+'.message)}']) 
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
                if(arg.list.length==0){continue}
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
                }else if(arg.list[0][0]=="operator" &&
                    ["*","**"].indexOf(arg.list[0][1])>-1){
                    // tuple or dict unpacking
                    if(arg.list[0][1]=='*'){var uf="$ptuple"}else{var uf="$pdict"}
                    stack.list.splice(br_pos+2+arg.end,0,['bracket',')'])
                    stack.list.splice(br_pos+1+arg.start,1,
                        ["code",uf],['bracket','('])
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
                (stack.list[sign-1].match(["keyword","return"])) ||
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

    // replace "from module import a,b" by "$import([module],[a,b])
    pos = 0
    while(pos<stack.list.length){
        var from_pos = stack.find_next(pos,"keyword","from")
        if(from_pos==null){break}
        if(stack.list[from_pos-1][0]!=='indent'){
            $SyntaxError("invalid syntax",from_pos)
        }
        if(from_pos<=stack.length-3 || 
            stack.list[from_pos+1][0]!=='id'){
            $SyntaxError("invalid syntax",from_pos)
        }
        var module = stack.list[from_pos+1][1]
        if(!stack.list[from_pos+2].match(['keyword','import'])){
            $SyntaxError("missing 'import' after 'from'",from_pos)
        }
        var names = []
        if(stack.list[from_pos+3].match(['operator','*'])){
            var names = ['*'],end=from_pos+3
        }else{
            var _names = stack.atom_at(from_pos+3,true)
            if(_names.type==="tuple"){
                for(var i=0;i<_names.items.length;i++){
                    names.push(_names.items[i].list()[0][1])
                }
            }else{ // 1 name to import
                names = [_names.list()[0][1]]
            }
            var end = _names.end
        }
        alert('module '+module+' names '+names+' end '+end)
        stack.list.splice(from_pos,end-from_pos+1,
            ['id','$import_from'],['bracket','('],['str','"'+module+'"'],
            ['delimiter',','],['code',names+''],['bracket',')'])
        stack.dump()
        pos = from_pos+1
    }
    
    // replace import module_list by $import(module_list)
    pos = 0
    while(pos<stack.list.length){
        var imp_pos = stack.find_next(pos,"keyword","import")
        if(imp_pos==null){break}
        var imported = stack.atom_at(imp_pos+1,true)
        if(imported.type != 'id' && imported.type != 'tuple'){
            $SyntaxError(module,"invalid syntax",imp_pos)
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
        if(clauses.length==0){$SyntaxError(module,'invalid syntax',exc_pos)}
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
                    }else{$SyntaxError(module,'invalid syntax',clause[3])}
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

    // "raise expr" becomes "$raise(expr)"
    pos = 0
    while(true){
        var raise_pos = stack.find_next(pos,"keyword","raise")
        if(raise_pos===null){break}
        var expr = stack.atom_at(raise_pos+1)
        stack.list.splice(expr.end+1,0,['bracket',')'])
        stack.list.splice(raise_pos,1,['code','$raise'],['bracket','('])
        pos = expr.end+1
    }


    // "assert condition" becomes "if condition: pass else: raise AssertionError"
    var pos = stack.list.length-1
    while(true){
        var assert_pos = stack.find_previous(pos,"keyword","assert")
        if(assert_pos===null){break}
        var assert_indent = stack.indent(assert_pos)
        var end = stack.line_end(assert_pos)
        var cond_block = stack.list.slice(assert_pos+1,end)
        stack.list[assert_pos][1]="if"
        stack.list.splice(end,0,['delimiter',':'],['newline','\n'],
            ['indent',assert_indent+4],['keyword','pass'],['newline','\n'],
            ['indent',assert_indent],['keyword','else'],['delimiter',':'],['newline','\n'],
            ['indent',assert_indent+4],['code','$raise("AssertionError")'])
        
        pos = assert_pos-1
    }

    // cheat for assert_raises until Exception classes are not implemented
    // assert_raises(Exception,... becomes assert_raises('Exception',...)
    pos = 0
    while(true){
        var ar_pos = stack.find_next(pos,'id','assert_raises')
        if(ar_pos===null){break}
        stack.list[ar_pos+2][0]='str'
        stack.list[ar_pos+2][1]='"'+stack.list[ar_pos+2][1]+'"'
        pos = ar_pos+1
    }

    // ternary operator
    var pos = stack.list.length-1
    while(true){
        var if_pos = stack.find_previous(pos,'keyword','if')
        if(if_pos===null){break}
        var line_end = stack.line_end(if_pos)
        var else_pos = stack.find_next(if_pos+1,'keyword','else')
        if(else_pos===null || else_pos>line_end){pos=if_pos-1;continue}
        var r1 = stack.atom_before(if_pos,true)
        var cond = stack.list.slice(if_pos+1,else_pos)
        var r2 = stack.atom_at(else_pos+1)
        var tail = stack.list.slice(r2.end+1,stack.list.length)
        var seq = cond
        seq.push(['delimiter','?'])
        seq = seq.concat(r1.list())
        seq.push(['delimiter',':'])
        seq = seq.concat(r2.list())
        stack.list = stack.list.slice(0,if_pos-r1.end+r1.start-1).concat(seq).concat(tail)
        pos = if_pos-1
    }

    // replace if,elif,else,class,def,for,try,catch,finally by equivalents
    var kws = {'if':'if','else':'else','elif':'else if',
        'class':'function','def':'function','for':'for','while':'while',
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
                if(kw==='if' || kw==='else'){
                    // might be ternary : x = r1 if cond else r2
                    pos = kw_pos+1
                    continue
                }
                $SyntaxError(module,'no condition',stack.list[kw_pos][2])
            }
            // block[0] = position of :
            // block[1] = last newline of block
            s = new Stack(stack.list.slice(block[0],block[1]+1))
            if(block==null){$SyntaxError(module,'missing block after '+kw,kw_pos)}
            var multiline = (s.find_next(0,'newline')!=null)
            // replace by Javascript keyword
            stack.list[kw_pos][1] = kws[kw]
            // add original Python keyword to sort class from function
            stack.list[kw_pos].push(kw)
            // replace : by {
            stack.list[block[0]]=['bracket','{']
            var end_pos = stack.list[block[1]][2]

            tail = stack.list.slice(block[1],stack.list.length)
            if(kw in has_parenth){
                if(kw=="for"){
                    loop_id++
                    var block_indent = stack.indent(block[0]+2)
                    var arg_list = stack.atom_at(kw_pos+1,true) // accept implicit tuple
                    var _in = stack.atom_at(arg_list.end+1)
                    var _in_list = stack.list.slice(_in.start,_in.end+1)
                    if(_in_list.length != 1 || 
                        _in_list[0][0]!="operator" || _in_list[0][1]!="in"){
                        $SyntaxError(module,"missing 'in' after 'for'",src_pos)
                    }
                    var iterable = stack.atom_at(_in.end+1,true)
                    // create temporary variable for iterator
                    seq = [['indent',kw_indent],
                        ['code','var $iter'+loop_id],['assign','=']]
                    seq = seq.concat(iterable.list())
                    seq.push(['newline','\n'],['indent',kw_indent],['code','for'])
                    var $loop = '(var $i'+loop_id+'=0;$i'+loop_id+'<'
                    $loop += '$iter'+loop_id+'.__len__();$i'+loop_id+'++){'
                    seq = seq.concat([['code',$loop],['newline','\n'],
                        ['indent',block_indent]])
                    seq = seq.concat(arg_list.list())
                    seq.push(['assign','='],['id','$iter'+loop_id])
                    seq.push(['point','.'],['qualifier','__item__'],
                        ['bracket','('],['id','$i'+loop_id],['bracket',')'])
                    seq = seq.concat(stack.list.slice(block[0]+1,block[1]))
                    stack.list = stack.list.slice(0,kw_pos-1)
                    stack.list = stack.list.concat(seq)
                    $err_num++
                } else if(kw=='if' || kw=='elif' || kw=='while'){ // if and elif : use bool()
                    var seq = [['bracket','(',src_pos],['id','bool'],['bracket','(']]
                    seq = seq.concat(stack.list.slice(kw_pos+1,block[0]))
                    seq.push(['bracket',')',src_pos]) // close bool                    
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
                var i=0,parent = -1
                for(i=$funcs.length-1;i>=0;i--){
                    if(kw_pos>$funcs[i][2] && kw_pos<$funcs[i][3]){parent = i;break}
                }
                $funcs.push([kw,func_name[1],block[0],block[1],parent])
                // function name is a special id (for to_js())
                stack.list[kw_pos+1][0]="function_id"
                // if class, change name foo to $foo
                var fname = stack.list[kw_pos+1][1]
                if(kw=="class"){stack.list[kw_pos+1][1]='$'+fname}
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
                if(kw==='def'){
                    for(var i=0;i<seq.length;i++){
                        if(seq[i][0]=="id"){
                            if(!(seq[i][1] in globals)){seq[i].push('local')}
                        }
                    }
                }
                stack.list = stack.list.slice(0,kw_pos+1)
                stack.list = stack.list.concat(seq)
                var indent = stack.indent(kw_pos)
                var f_indent = ''
                while(indent>0){f_indent+=' ';indent--}
                if(parent==-1){
                    // make function visible at window level
                    var code = '\n'+f_indent+'window.'+fname+'='+fname
                    module_level_functions.push(fname)
                    tail.splice(0,0,['func_end',code])
                }else if($funcs[parent][0]=='class'){
                    var class_name = $funcs[parent][1]
                    // replace "function foo" by "this.foo = function"
                    stack.list.splice(kw_pos,2,["code",'this.'+fname+'='],
                        ['keyword','function'])
                }
                if(kw=='class'){
                    var code = '\n'+f_indent+fname+"=$class_constructor('"
                    code += fname+"',$"+fname+")"
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
                $SyntaxError(module,"Bad left operand type "+lo.type+" for "+op_sign,
                    stack.list[op][2])
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
                $SyntaxError(module,"Bad right operand ",stack.list[op][2])
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
        stack.list.splice(test_pos,0,['id','$test_expr'],['bracket','('])
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

    var js2py = {'alert':'$alert','prompt':'$prompt','confirm':'$confirm',
        'print':'$print','eval':'$eval'}
    for(key in js2py){
        pos = 0
        while(true){
            var func_pos = stack.find_next(pos,'id',key)
            if(func_pos==null){break}
            // check that it's followed by (
            if(!stack.list[func_pos+1].match(['bracket','('])){
                $SyntaxError(module,'missing ( after function '+key,func_pos)
            }
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
        // right expression is the rest of the line
        var line_end = stack.line_end(assign)
        var right = new Stack(stack.list.slice(assign+1,line_end))
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
            var tail = stack.list.slice(line_end+1,stack.list.length)
            stack.list = stack.list.slice(0,left.start).concat(seq).concat(tail)
            pos = left.start+seq.length-1
        } else if(left.type=='str' || left.type=='int' || left.type=='float'){
            pos = left.list()[0][2]
            $SyntaxError(module,"can't assign to literal",pos)
        }else if(left.type=='id' && $tags.indexOf(left.list()[0][1])>-1){
            $SyntaxError(module,"can't assign to reserved word "+left.list()[0][1],
                left.list()[0][2])
        } else if(left.type=='qualified_id' || left.type=='slicing' || left.type=="function_call"){
            pos = assign-1
        } else {
            // simple assignment
            var assign_indent = stack.indent(assign)
            // search lower indent
            var lower_indent = null
            var indent_pos = stack.find_previous(assign,'indent')
            while(indent_pos>0){
                var indent_pos = stack.find_previous(indent_pos-1,'indent')
                if(stack.list[indent_pos][1]<assign_indent){
                    // is assignment inside a class definition ?
                    var first = stack.list[indent_pos+1]
                    if(first.match(['keyword','function']) &&
                        first[first.length-1]==='class'){
                            left.list()[0][1]='this.'+left.list()[0][1]
                        }
                    break
                }
            }
            // for local variables inside functions, insert "var"
            left.list()[0][0]="assign_id"
            if(left.list()[0][3]==="local"){left.list()[0][1]="var "+left.list()[0][1]}
            // multiple right arguments ?
            var r_elts = right.split(',')
            if(r_elts.length>1){
                stack.list.splice(line_end,0,['bracket',']'])
                stack.list.splice(assign+1,0,['bracket','['])
                assign--
            }
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
        if(['id','qualifier','keyword','bracket'].indexOf(previous[0])==-1){pos=br_pos-1;continue}
        src_pos = stack.list[br_pos][2]
        var end = stack.find_next_matching(br_pos)
        
        // create arguments for subscription or slicing
        var args = stack.list.slice(br_pos+1,end)
        if(args.length==0){$SyntaxError(module,'invalid syntax',br_pos)}
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

    var dobj = new Date()
    times['total'] = dobj.getTime()-t0

    if(document.$debug==2){console.log(stack.to_js())}
    return stack
}

function brython(debug){
    document.$debug = debug
    document.$py_src = {}
    document.$brython_path = null
    var elts = document.getElementsByTagName("script")
    
    for(var $i=0;$i<elts.length;$i++){
        var elt = elts[$i]
        if(elt.type=="text/python"){
            if(elt.src!==''){ 
                // format <script type="text/python" src="python_script.py">
                // get source code by an Ajax call
                if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
                    var $xmlhttp=new XMLHttpRequest();
                }else{// code for IE6, IE5
                    var $xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
                }
                $xmlhttp.onreadystatechange = function(){
                        var state = this.readyState
                        if(state===4){
                            src = $xmlhttp.responseText
                            exec(src)
                        }
                    }
                $xmlhttp.open('GET',elt.src,false)
                $xmlhttp.send()
            }else{
                var src = (elt.innerHTML || elt.textContent)
                exec(src)
            }
        }
        else{ // get path of brython.js
            var br_scripts = ['brython.js','py_tokenizer.js']
            for(var j=0;j<br_scripts.length;j++){
                var bs = br_scripts[j]
                if(elt.src.substr(elt.src.length-bs.length)==bs){
                    if(elt.src.length===bs.length ||
                        elt.src.charAt(elt.src.length-bs.length-1)=='/'){
                            document.$brython_path = elt.src.substr(0,elt.src.length-bs.length)
                            break
                    }
                }
            }
        }
    }
}