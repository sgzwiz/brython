var $operators = {
    "//=":"ifloordiv",">>=":"irshift","<<=":"ilshift",
    "**=":"ipow","**":"pow","//":"floordiv","<<":"lshift",">>":"rshift",
    "+=":"iadd","-=":"isub","*=":"imul","/=":"itruediv",
    "%=":"imod","&=":"iand","|=":"ior",
    "^=":"ipow","+":"add","-":"sub","*":"mul",
    "/":"truediv","%":"mod","&":"and","|":"or",
    "^":"pow","<":"lt",">":"gt",
    "<=":"le",">=":"ge","==":"eq","!=":"ne",
    "or":"or","and":"and", "in":"in", //"not":"not",
    "not_in":"not_in","is_not":"is_not" // fake
    }
// operators weight for precedence
var $op_weight={
    'or':1,'and':2,
    'in':3,'not_in':3,
    '<':4, '<=':4, '>':4, '>=':4, '!=':4, '==':4,
    '+':5,
    '-':6,
    '/':7,'//':7,'%':7,
    '*':8,
    '**':9
    }
var $augmented_assigns = {
    "//=":"ifloordiv",">>=":"irshift","<<=":"ilshift",
    "**=":"ipow","+=":"iadd","-=":"isub","*=":"imul","/=":"itruediv",
    "%=":"imod","^=":"ipow"
}

function $_SyntaxError(context,msg){
    var ctx_node = context
    while(ctx_node.type!=='node'){ctx_node=ctx_node.parent}
    var tree_node = ctx_node.node
    var module = tree_node.module
    var line_num = tree_node.line_num
    document.$line_info = [line_num,module]
    $SyntaxError(module,msg,$pos)
}

var $first_op_letter = {}
for(op in $operators){$first_op_letter[op.charAt(0)]=0}

function $Node(type){
    this.type = type
    this.children=[]
    this.add = function(child){
        this.children.push(child)
        child.parent = this
    }
    this.insert = function(pos,child){
        this.children.splice(pos,0,child)
        child.parent = this
    }
    this.toString = function(){return "<object 'Node'>"} 
    this.show = function(indent){
        var res = ''
        if(this.type==='module'){
            for(var i=0;i<this.children.length;i++){
                res += this.children[i].show(indent)
            }
        }else{
            indent = indent || 0
            for(var i=0;i<indent;i++){res+=' '}
            res += this.context
            if(this.children.length>0){res += '{'}
            res +='\n'
            for(var i=0;i<this.children.length;i++){
                res += '['+i+'] '+this.children[i].show(indent+4)
            }
            if(this.children.length>0){
                for(var i=0;i<indent;i++){res+=' '}
                res+='}\n'
            }
        }
        return res
   }
    this.to_js = function(indent){
        var res = ''
        if(this.type==='module'){
            for(var i=0;i<this.children.length;i++){
                res += this.children[i].to_js(indent)
            }
        }else{
            indent = indent || 0
            var ctx_js = this.context.to_js(indent)
            if(ctx_js){ // empty for "global x"
                for(var i=0;i<indent;i++){res+=' '}
                res += ctx_js
                if(this.children.length>0){res += '{'}
                res +='\n'
                for(var i=0;i<this.children.length;i++){
                    res += this.children[i].to_js(indent+4)
                }
                if(this.children.length>0){
                    for(var i=0;i<indent;i++){res+=' '}
                    res+='}\n'
                }
            }
        }
        return res
   }
    this.transform = function(rank){
        var res = ''
        if(this.type==='module'){
            var i=0
            while(i<this.children.length){
                var node = this.children[i]
                this.children[i].transform(i)
                i++
            }
        }else{
            var elt=this.context.tree[0]
            if(elt.transform !== undefined){
                elt.transform(this,rank)
            }
            var i=0
            while(i<this.children.length){
                this.children[i].transform(i)
                i++
            }
        }
   }
}

function $last(src){return src[src.length-1]}

var $loop_id=0

function $AbstractExprCtx(context,with_commas){
    this.type = 'abstract_expr'
    // allow expression with comma-separted values, or a single value ?
    this.with_commas = with_commas
    this.name = name
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return '(abstract_expr '+with_commas+') '+this.tree}
    this.to_js = function(){
        if(this.type==='list'){return '['+$to_js(this.tree)+']'}
        else{return $to_js(this.tree)}
    }
}

function $AssertCtx(context){
    this.type = 'assert'
    this.toString = function(){return '(assert) '+this.tree}
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.transform = function(node,rank){
        // transform "assert cond" into "if not cond: throw AssertionError"
        var new_ctx = new $ConditionCtx(node.context,'if')
        var not_ctx = new $NotCtx(new_ctx)
        not_ctx.tree = this.tree
        node.context = new_ctx
        var new_node = new $Node('expression')
        new $NodeJSCtx(new_node,'$raise("AssertionError")')
        node.add(new_node)
    }
}

function $AssignCtx(context){
    // context is the left operand of assignment
    this.type = 'assign'
    // replace parent by this in parent tree
    context.parent.tree.pop()
    context.parent.tree.push(this)
    this.parent = context.parent
    this.tree = [context]
    this.toString = function(){return '(assign) '+this.tree[0]+'='+this.tree[1]}
    this.transform = function(node,rank){
        // rank is the rank of this line in node
        var left = this.tree[0]
        while(left.type==='assign'){ // chained assignment : x=y=z
            var new_node = new $Node('expression')
            var node_ctx = new $NodeCtx(new_node)
            node_ctx.tree = [left]
            node.parent.insert(rank+1,new_node)
            this.tree[0] = left.tree[1]
            left = this.tree[0]
        }
        var left_items = null
        if(left.type==='expr' && left.tree.length>1){
            var left_items = left.tree
        }else if(left.type==='expr' && left.tree[0].type==='list_or_tuple'){
            var left_items = left.tree[0].tree
        }else if(left.type==='target_list'){
            var left_items = left.tree
        }
        if(left_items===null){return} // no transformation
        var right = this.tree[1]
        var right_items = null
        if(right.type==='list'||right.type==='tuple'||
            (right.type==='expr' && right.tree.length>1)){
                var right_items = right.tree
        }
        if(right_items!==null){ // form x,y=a,b
            if(right_items.length>left_items.length){
                throw Error('ValueError : too many values to unpack (expected '+left_items.length+')')
            }else if(right_items.length<left_items.length){
                throw Error('ValueError : need more than '+right_items.length+' to unpack')
            }
            var new_nodes = []
            var new_node = new $Node('expression')
            new $NodeJSCtx(new_node,'var $temp'+$loop_num+'=[]')
            new_nodes.push(new_node)

            for(var i=0;i<right_items.length;i++){
                var js = '$temp'+$loop_num+'.push('+right_items[i].to_js()+')'
                var new_node = new $Node('expression')
                new $NodeJSCtx(new_node,js)
                new_nodes.push(new_node)
            }
            for(var i=0;i<left_items.length;i++){
                var new_node = new $Node('expression')
                var context = new $NodeCtx(new_node) // create ordinary node
                left_items[i].parent = context
                var assign = new $AssignCtx(left_items[i]) // assignment to left operand
                assign.tree[1] = new $JSCode('$temp'+$loop_num+'['+i+']')
                new_nodes.push(new_node)
            }
            node.parent.children.splice(rank,1) // remove original line
            for(var i=new_nodes.length-1;i>=0;i--){
                node.parent.insert(rank,new_nodes[i])
            }
            $loop_num++
        }else{ // form x,y=a
            var new_nodes = []
            for(var i=0;i<left_items.length;i++){
                var new_node = new $Node('expression')
                var context = new $NodeCtx(new_node) // create ordinary node
                left_items[i].parent = context
                var assign = new $AssignCtx(left_items[i]) // assignment to left operand
                assign.tree[1] = new $JSCode(right.to_js()+'.__item__('+i+')')
                new_nodes.push(new_node)
            }
            node.parent.children.splice(rank,1) // remove original line
            for(var i=new_nodes.length-1;i>=0;i--){
                node.parent.insert(rank,new_nodes[i])
            }
        }
    }
    this.to_js = function(){
        if(this.parent.type==='call'){ // like in foo(x=0)
            return '$Kw('+this.tree[0].to_js()+','+this.tree[1].to_js()+')'
        }else{ // assignment
            var left = this.tree[0]
            if(left.type==='expr'){
                left=left.tree[0]
            }
            var right = this.tree[1]
            if(left.type==='attribute'){ // assign to attribute or item ?
                left.func = 'setattr'
                //left.tree.push(last)
                var res = left.to_js()
                left.func = 'getattr'
                res = res.substr(0,res.length-1) // remove trailing )
                res += ','+right.to_js()+')'
                return res
            }else if(left.type==='sub'){
                left.func = 'setitem' // just for to_js()
                var res = left.to_js()
                res = res.substr(0,res.length-1) // remove trailing )
                left.func = 'getitem' // restore default function
                res += ','+right.to_js()+')'
                //last_str = last_str.substr(0,last_str.length-1) // remove trailing )
                //res += last_str+','+right.to_js()+')'
                return res
            }
            var scope = $get_scope(this)
            if(scope===null){
                return left.to_js()+'='+right.to_js()
            }else if(scope.ntype==='def'){
                // assignment in a function : depends if variable is local
                // or global
                if(scope.globals && scope.globals.indexOf(left.value)>-1){
                    return left.to_js()+'='+right.to_js()
                }else{ // local to scope : prepend 'var'
                    return 'var '+left.to_js()+'='+right.to_js()
                }
            }else if(scope.ntype==='class'){
                // assignment in a class : creates a class attribute
                return 'this.'+left.to_js()+'='+right.to_js()
            }
        }
    }
}

function $AttrCtx(context){
    this.type = 'attribute'
    this.value = context.tree[0]
    this.parent = context
    context.tree.pop()
    context.tree.push(this)
    this.tree = []
    this.func = 'getattr' // becomes setattr for an assignment 
    this.toString = function(){return '(attr) '+this.value+'.'+this.name}
    this.to_js = function(){
        var name = this.name
        if(name.substr(0,2)==='$$'){name=name.substr(2)}
        if(name.substr(0,2)!=='__'){name='__'+this.func+'__("'+name+'")'}
        return this.value.to_js()+'.'+name
    }
}

function $CallArgCtx(context){
    this.type = 'call_arg'
    this.toString = function(){return 'call_arg '+this.tree}
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.expect='id'
    this.to_js = function(){return $to_js(this.tree)}
}

function $CallCtx(context){
    this.type = 'call'

    this.func = context.tree[0]
    this.parent = context
    context.tree.pop()
    context.tree.push(this)
    this.tree = []

    this.toString = function(){return '(call) '+this.func+'('+this.tree+')'}

    this.to_js = function(){return this.func.to_js()+'('+$to_js(this.tree)+')'}
}

function $ClassCtx(context){
    this.type = 'class'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.expect = 'id'
    this.toString = function(){return 'class '+this.tree}
    this.transform = function(node,rank){
        // insert "$instance = this"
        var instance_decl = new $Node('expression')
        new $NodeJSCtx(instance_decl,'var $instance = this')
        node.insert(0,instance_decl)

        // class constructor
        js = this.name+'=$class_constructor("'+this.name+'",$'+this.name+')'
        var cl_cons = new $Node('expression')
        new $NodeJSCtx(cl_cons,js)
        node.parent.insert(rank+1,cl_cons)
        // add declaration of class at window level
        if(this.parent.node.module==='__main__'){
            js = 'window.'+this.name+'='+this.name
            var w_decl = new $Node('expression')
            new $NodeJSCtx(w_decl,js)
            node.parent.insert(rank+2,w_decl)
        }
    }
    this.to_js = function(){
        return '$'+this.name+'=function()'
    }
}

function $CompIfCtx(context){
    this.type = 'comp_if'
    context.parent.intervals.push($pos)
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return '(comp if) '+this.tree}
    this.to_js = function(){return 'comp if to js'}
}

function $ComprehensionCtx(context){
    this.type = 'comprehension'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return '(comprehension) '+this.tree}
    this.to_js = function(){
        var intervals = []
        for(var i=0;i<this.tree.length;i++){
            intervals.push(this.tree[i].start)
        }
        return intervals
    }
}

function $CompForCtx(context){
    this.type = 'comp_for'
    context.parent.intervals.push($pos)
    this.parent = context
    this.tree = []
    this.expect = 'in'
    context.tree.push(this)
    this.toString = function(){return '(comp for) '+this.tree}
    this.to_js = function(){return 'comp for to js'}
}

function $CompIterableCtx(context){
    this.type = 'comp_iterable'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return '(comp iter) '+this.tree}
    this.to_js = function(){return 'comp iter to js'}
}

function $ConditionCtx(context,token){
    this.type = 'condition'
    this.token = token
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return this.token+' '+this.tree}
    this.to_js = function(){
        var tok = this.token
        if(tok==='elif'){tok='else if'}
        if(this.tree.length==1){
            var res = tok+'(bool('+$to_js(this.tree)+'))'
        }else{ // syntax "if cond : do_something" in the same line
            var res = tok+'(bool('+this.tree[0].to_js()+'))'
            if(this.tree[1].tree.length>0){
                res += '{'+this.tree[1].to_js()+'}'
            }
        }
        return res
    }
}

function $DefCtx(context){
    this.type = 'def'
    this.name = null
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'def '+this.name+'('+this.tree+')'}
    this.transform = function(node,rank){
        // already transformed ?
        if(this.transformed!==undefined){return}
        // if function body is in the same line, add a child
        if(this.in_line!==undefined){
            var new_node = new $Node('expression')
            var ctx = new $NodeCtx(new_node)
            ctx.tree = [this.tree[this.tree.length-1]]
            node.add(new_node)
        }
        // if function inside a class, the first argument represents
        // the instance
        var scope = $get_scope(this)
        if(scope !== null && scope.ntype==='class'){
            // first argument of function is the instance
            var func_args = this.tree[0]
            if(func_args.tree.length==0){throw Error('no argument to class func')}
            var first_arg = func_args.tree[0]
            if(first_arg.type!=='func_arg_id'){throw Error('wrong first argument '+first_arg.type)}
            func_args.tree.splice(0,1) // remove self from function definition
            var js = 'var '+first_arg.name+' = $instance'
            var new_node3 = new $Node('expression')
            new $NodeJSCtx(new_node3,js)
            node.children.splice(0,0,new_node3)            
        }
        var required = ''
        var defaults = ''
        var other_args = null
        var other_kw = null
        var env = []
        for(var i=0;i<this.tree[0].tree.length;i++){
            var arg = this.tree[0].tree[i]
            if(arg.type==='func_arg_id'){
                if(arg.tree.length===0){required+='"'+arg.name+'",'}
                else{
                    defaults+='"'+arg.name+'":'+$to_js(arg.tree)+','
                    if(arg.tree[0].type==='expr' 
                        && arg.tree[0].tree[0].type==='id'){
                        env.push(arg.tree[0].tree[0].value)
                    }                        
                }
            }else if(arg.type==='func_star_arg'&&arg.op==='*'){other_args='"'+arg.name+'"'}
            else if(arg.type==='func_star_arg'&&arg.op==='**'){other_kw='"'+arg.name+'"'}
        }
        this.env = env
        if(required.length>0){required=required.substr(0,required.length-1)}
        if(defaults.length>0){defaults=defaults.substr(0,defaults.length-1)}
        // add 2 lines of code to node children
        var js = 'var $ns=$MakeArgs("'+this.name+'",arguments,['+required+'],'
        js += '{'+defaults+'},'+other_args+','+other_kw+')'
        var new_node1 = new $Node('expression')
        new $NodeJSCtx(new_node1,js)
        var js = 'for($var in $ns){eval("var "+$var+"=$ns[$var]")}'
        var new_node2 = new $Node('expression')
        new $NodeJSCtx(new_node2,js)
        node.children.splice(0,0,new_node1,new_node2)

        // wrap function body in a try/catch
        var try_node = new $Node('expression')
        new $NodeJSCtx(try_node,'try')

        var def_func_node = new $Node('expression')
        new $NodeJSCtx(def_func_node,'return function()')
        try_node.add(def_func_node)
        for(var i=0;i<node.children.length;i++){
            def_func_node.add(node.children[i])
        }
        var ret_node = new $Node('expression')
        var catch_node = new $Node('expression')
        var js = 'catch(err'+$loop_num+')'
        js += '{$raise(err'+$loop_num+'.name,err'+$loop_num+'.message)}'
        new $NodeJSCtx(catch_node,js)
        node.children = []
        node.add(try_node)
        node.add(catch_node)

        var txt = ')('
        for(var i=0;i<this.env.length;i++){
            txt += this.env[i]
            if(i<this.env.length-1){txt += ','}
        }
        new $NodeJSCtx(ret_node,txt+')')
        node.parent.insert(rank+1,ret_node)

        // add declaration of function at window level
        if(scope===null && node.module==='__main__'){
            js = 'window.'+this.name+'='+this.name
            new_node1 = new $Node('expression')
            new $NodeJSCtx(new_node1,js)
            node.parent.children.splice(rank+2,0,new_node1)
        }
        this.transformed = true
    }
    this.to_js = function(indent){
        var scope = $get_scope(this)
        if(scope===null || scope.ntype!=='class'){
            res = this.name+'= (function ('
        }else{
            res = 'this.'+this.name+'= (function('
        }
        for(var i=0;i<this.env.length;i++){
            res+=this.env[i]
            if(i<this.env.length-1){res+=','}
        }
        res += ')'
        return res
    }
}

function $DelCtx(context){
    this.type = 'del'
    this.parent = context
    context.tree.push(this)
    this.tree = []
    this.toString = function(){return 'del '+this.tree}
    this.to_js = function(){
        var expr = this.tree[0]
        if(expr.type!=='expr'){throw Error('SyntaxError, no expr after del')}
        var del_id = expr.tree[0]
        if(del_id.type!=='sub'){
            throw Error('SyntaxError, no subscription for del')
        }
        del_id.func = 'delitem'
        var res = del_id.to_js()
        del_id.func = 'getitem'
        return res
    }
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

function $DictOrSetCtx(context){
    // the real type (dist or set) is set inside $transition
    // as attribute 'real'
    this.type = 'dict_or_set'
    this.real = 'dict_or_set'
    this.expect = 'id'
    this.closed = false
    this.toString = function(){
        if(this.real==='dict'){return '(dict) {'+this.tree+'}'}
        else if(this.real==='set'){return '(set) {'+this.tree+'}'}
        else{return '(dict_or_set) {'+this.tree+'}'}
    }
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.to_js = function(){
        if(this.real==='dict'){
            var res = 'dict(['
            for(var i=0;i<this.items.length;i+=2){
                res+='['+this.items[i].to_js()+','+this.items[i+1].to_js()+']'
                if(i<this.items.length-2){res+=','}
            }
            return res+'])'+$to_js(this.tree)
        }else{return 'set(['+$to_js(this.items)+'])'+$to_js(this.tree)}
    }
}

function $DoubleStarArgCtx(context){
    this.type = 'double_star_arg'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return '**'+this.tree}
    this.to_js = function(){return '$pdict('+$to_js(this.tree)+')'}
}

function $ExceptCtx(context){
    this.type = 'except'
    this.parent = context
    context.tree.push(this)
    this.tree = []
    this.expect = 'id'
    this.toString = function(){return '(except) '}
    this.to_js = function(){
        // in method "transform" of $TryCtx instances, related
        // $ExceptCtx instances receive an attribute error_name
        if(this.tree.length===0){return 'else'}
        else{
            var res ='else if(['
            for(var i=0;i<this.tree.length;i++){
                res+='"'+this.tree[i].name+'"'
                if(i<this.tree.length-1){res+=','}
            }
            res +='].indexOf('+this.error_name+'.__name__)>-1)'
            return res
        }
    }
}

function $ExprCtx(context,name,with_commas){
    this.type = 'expr'
    this.name = name
    // allow expression with comma-separted values, or a single value ?
    this.with_commas = with_commas
    this.expect = ',' // can be 'expr' or ','
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return '(expr '+with_commas+') '+this.tree}
    this.to_js = function(){
        if(this.type==='list'){return '['+$to_js(this.tree)+']'}
        else if(this.tree.length===1){return this.tree[0].to_js()}
        else{return 'tuple('+$to_js(this.tree)+')'}
    }
}

function $ExprNot(context){ // used for 'x not', only accepts 'in' as next token
    this.type = 'expr_not'
    this.toString = function(){return '(expr_not)'}
    this.parent = context
    this.tree = []
    context.tree.push(this)
}

function $FloatCtx(context,value){
    this.type = 'float'
    this.value = value
    this.toString = function(){return 'float '+this.value}
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.to_js = function(){return 'float('+this.value+')'}
}

function $ForTarget(context){
    this.type = 'for_target'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'for_target'+' '+this.tree}
    this.to_js = function(){return $to_js(this.tree)}
}

function $ForExpr(context){
    this.type = 'for'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return '(for) '+this.tree}
    this.transform = function(node,rank){
        var new_nodes = []
        var new_node = new $Node('expression')
        var target = this.tree[0]
        var iterable = this.tree[1]
        new $NodeJSCtx(new_node,'var $iter'+$loop_num+'='+iterable.to_js())
        new_nodes.push(new_node)

        new_node = new $Node('expression')
        var js = 'for(var $i'+$loop_num+'=0;$i'+$loop_num
        js += '<$iter'+$loop_num+'.__len__();$i'+$loop_num+'++)'
        new $NodeJSCtx(new_node,js)
        new_nodes.push(new_node)

        // save original node children
        var children = node.children
        // replace original line by these 2 lines
        node.parent.children.splice(rank,1)
        for(var i=new_nodes.length-1;i>=0;i--){
            node.parent.insert(rank,new_nodes[i])
        }

        var new_node = new $Node('expression')
        node.insert(0,new_node)
        var context = new $NodeCtx(new_node) // create ordinary node
        var target_expr = new $ExprCtx(context,'left',true)
        target_expr.tree = target.tree
        var assign = new $AssignCtx(target_expr) // assignment to left operand
        assign.tree[1] = new $JSCode('$iter'+$loop_num+'.__item__($i'+$loop_num+')')
        // set new loop children
        node.parent.children[rank+1].children = children
        $loop_num++
    }
    this.to_js = function(){
        var iterable = this.tree.pop()
        return 'for '+$to_js(this.tree)+' in '+iterable.to_js()
    }
}

function $FromCtx(context){
    this.type = 'from'
    this.parent = context
    this.names = []
    context.tree.push(this)
    this.expect = 'module'
    this.toString = function(){return '(from) '+this.module+' (import) '+this.names}
    this.to_js = function(){return '$import_from("'+this.module+'",'+this.names+')'}
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
    this.to_js = function(){return $to_js(this.tree)}
}

function $FuncArgIdCtx(context,name){
    // id in function arguments
    // may be followed by = for default value
    this.type = 'func_arg_id'
    this.name = name
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'func arg id '+this.name +'='+this.tree}
    this.expect = '='
    this.to_js = function(){return this.name+$to_js(this.tree)}
}

function $FuncStarArgCtx(context,op){
    this.type = 'func_star_arg'
    this.op = op
    this.parent = context
    context.tree.push(this)
    this.toString = function(){return '(func star arg '+this.op+') '+this.name}
}

function $GlobalCtx(context){
    this.type = 'global'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.expect = 'id'
    this.toString = function(){return 'global '+this.tree}
    this.transform = function(node,rank){
        var scope = $get_scope(this)
        if(scope.globals===undefined){scope.globals=[]}
        for(var i=0;i<this.tree.length;i++){
            scope.globals.push(this.tree[i].value)
        }
    }
    this.to_js = function(){return ''}
}

function $IdCtx(context,value,minus){
    // minus is set if there is a unary minus before the id
    this.type = 'id'
    this.toString = function(){return '(id) '+this.value+':'+(this.tree||'')}
    this.value = value
    this.minus = minus
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.to_js = function(){
        var val = this.value
        if(['print','alert','eval'].indexOf(this.value)>-1){val = '$'+val}
        return val+$to_js(this.tree,'')
    }
}

function $ImportCtx(context){
    this.type = 'import'
    this.toString = function(){return 'import '+this.tree}
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.expect = 'id'
    this.to_js = function(){
        return '$import_list(['+$to_js(this.tree)+'])'
    }
}

function $ImportedModuleCtx(context,name){
    this.toString = function(){return ' (imported module) '+this.name}
    this.parent = context
    this.name = name
    this.alias = name
    context.tree.push(this)
    this.to_js = function(){
        return '["'+this.name+'","'+this.alias+'"]'
    }
}

function $IntCtx(context,value){
    this.type = 'int'
    this.value = value
    this.toString = function(){return 'int '+this.value}
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.to_js = function(){return 'Number('+this.value+')'}
}

function $JSCode(js){
    this.js = js
    this.toString = function(){return this.js}
    this.to_js = function(){return this.js}
}

function $KwArgCtx(context){
    this.type = 'kwarg'
    this.toString = function(){return 'kwarg '+this.tree[0]+'='+this.tree[1]}
    this.parent = context.parent
    this.tree = [context.tree[0]]
    // operation replaces left operand
    context.parent.tree.pop()
    context.parent.tree.push(this)
    this.to_js = function(){
        var res = '$Kw("'+this.tree[0].to_js()+'",'
        res += $to_js(this.tree.slice(1,this.tree.length))+')'
        return res
    }
}

function $ListOrTupleCtx(context,real){
    // the real type (list or tuple) is set inside $transition
    // as attribute 'real'
    this.type = 'list_or_tuple'
    this.start = $pos
    this.real = real
    this.expect = 'id'
    this.closed = false
    this.toString = function(){
        if(this.real==='list'){return '(list) ['+this.tree+']'}
        else if(this.real==='list_comp'){return '(list comp) ['+this.intervals+'-'+this.tree+']'}
        else{return '(tuple) ('+this.tree+')'}
    }
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.to_js = function(){
        if(this.real==='list'){return '['+$to_js(this.tree)+']'}
        else if(this.real==='list_comp'){
            var res_env=[],local_env=[],env=[]
            var ctx_node = this
            while(ctx_node.parent!==undefined){ctx_node=ctx_node.parent}
            var module = ctx_node.node.module
            var src = document.$py_src[module]
            // get ids in the expression defining the elements of the list comp
            for(var i=0;i<this.expression.length;i++){
                var ids = $get_ids(this.expression[i])
                for(var i=0;i<ids.length;i++){
                    if(res_env.indexOf(ids[i])===-1){res_env.push(ids[i])}
                }
            }
            var comp = this.tree[0]
            for(var i=0;i<comp.tree.length;i++){
                var elt = comp.tree[i]
                if(elt.type==='comp_for'){
                    var target_list = elt.tree[0]
                    for(var j=0;j<target_list.tree.length;j++){
                        var name = target_list.tree[j].value
                        if(local_env.indexOf(name)===-1){
                            local_env.push(name)
                        }
                    }
                    var comp_iter = elt.tree[1].tree[0]
                    var ids = $get_ids(comp_iter)
                    for(var i=0;i<ids.length;i++){
                        if(env.indexOf(ids[i])===-1){env.push(ids[i])}
                    }
                }else if(elt.type==="comp_if"){
                    var if_expr = elt.tree[0]
                    var ids = $get_ids(if_expr)
                    for(var i=0;i<ids.length;i++){
                        if(env.indexOf(ids[i])===-1){env.push(ids[i])}
                    }
                }
            }
            for(var i=0;i<res_env.length;i++){
                if(local_env.indexOf(res_env[i])===-1){
                    env.push(res_env[i])
                }
            }

            var res = '{'
            for(var i=0;i<env.length;i++){
                res += "'"+env[i]+"':"+env[i]
                if(i<env.length-1){res+=','}
            }
            res += '},'
            var qesc = new RegExp('"',"g") // to escape double quotes in arguments
            for(var i=1;i<this.intervals.length;i++){
                var txt = src.substring(this.intervals[i-1],this.intervals[i]).replace(qesc,'\\"')
                txt = txt.replace(/\n/g,' ')
                res += '"'+txt+'"'
                if(i<this.intervals.length-1){res+=','}
            }
            return '$list_comp('+res+')'
        }else if(this.real==='tuple'){
            if(this.tree.length===1){return this.tree[0].to_js()}
            else{return 'tuple('+$to_js(this.tree)+')'}
        }
    }
}

function $NodeCtx(node){
    this.node = node
    node.context = this
    this.tree = []
    this.type = 'node'
    this.toString = function(){return 'node '+this.tree}
    this.to_js = function(){
        if(this.tree.length>1){
            var new_node = new $Node('expression')
            var ctx = new $NodeCtx(new_node)
            ctx.tree = [this.tree[1]]
            new_node.indent = node.indent+4
            this.tree.pop()
            node.add(new_node)
        }
        return $to_js(this.tree)
    }
}

function $NodeJSCtx(node,js){ // used for raw JS code
    this.node = node
    node.context = this
    this.type = 'node_js'
    this.tree = [js]
    this.toString = function(){return 'js '+js}
    this.to_js = function(){return js}
}

function $NotCtx(context){
    this.type = 'not'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return 'not ('+this.tree+')'}
    this.to_js = function(){return '!bool('+$to_js(this.tree)+')'}
}

function $OpCtx(context,op){ // context is the left operand
    this.type = 'op'
    this.op = op
    this.toString = function(){return '(op '+this.op+')'+this.tree}
    this.parent = context.parent
    this.tree = [context]
    // operation replaces left operand
    context.parent.tree.pop()
    context.parent.tree.push(this)
    this.to_js = function(){
        if(this.op==='and'){
            var res ='$test_expr($test_item('+this.tree[0].to_js()+')&&'
            res += '$test_item('+this.tree[1].to_js()+'))'
            return res
        }else if(this.op==='or'){
            var res ='$test_expr($test_item('+this.tree[0].to_js()+')||'
            res += '$test_item('+this.tree[1].to_js()+'))'
            return res
        }else{
            var res = this.tree[0].to_js()
            res += '.__'+$operators[this.op]+'__('+this.tree[1].to_js()+')'
            return res
        }
    }
}

function $ParentClassCtx(context){ // subscription or slicing
    this.type = 'parent_class'
    this.expect = 'id'
    this.toString = function(){return '('+this.tree+')'}
    this.parent = context
    this.tree = []
    context.tree.push(this)
}

function $PassCtx(context){
    this.type = 'pass'
    this.toString = function(){return '(pass)'}
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.to_js = function(){return 'void(0)'}
}

function $RaiseCtx(context){
    this.type = 'raise'
    this.toString = function(){return ' (raise) '+this.tree}
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.to_js = function(){
        if(this.tree.length===0){return 'throw Exception("")'}
        var exc = this.tree[0]
        if(exc.type==='id'){return 'throw '+exc.value+'("")'}
        else{return 'throw '+$to_js(this.tree)}
    }
}

function $ReturnCtx(context){ // subscription or slicing
    this.type = 'return'
    this.toString = function(){return 'return '+this.tree}
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.to_js = function(){return 'return '+$to_js(this.tree)}
}

function $SingleKwCtx(context,token){ // used for finally,else
    this.type = 'single_kw'
    this.token = token
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return this.token}
    this.to_js = function(){return this.token}
}

function $StarArgCtx(context){
    this.type = 'star_arg'
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.toString = function(){return '(star arg) '+this.tree}
    this.to_js = function(){
        return '$ptuple('+$to_js(this.tree)+')'
    }
}

function $StringCtx(context,value){
    this.type = 'str'
    this.value = value
    this.toString = function(){return 'string '+this.value+' '+(this.tree||'')}
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.to_js = function(){
        return this.value.replace(/\n/g,' \\\n')+$to_js(this.tree,'')
    }

}

function $SubCtx(context){ // subscription or slicing
    this.type = 'sub'
    this.func = 'getitem' // set to 'setitem' if assignment
    this.toString = function(){return '(sub) '+this.tree}
    this.value = context.tree[0]
    context.tree.pop()
    context.tree.push(this)
    this.parent = context
    this.tree = []
    this.to_js = function(){
        var res = this.value.to_js()+'.__'+this.func+'__('
        if(this.tree.length===1){
            return res+this.tree[0].to_js()+')'
        }else{
            res += 'slice('
            for(var i=0;i<this.tree.length;i++){
                if(this.tree[i].type==='abstract_expr'){res+='null'}
                else{res+=this.tree[i].to_js()}
                if(i<this.tree.length-1){res+=','}
            }
            return res+'))'
        }
    }
}

function $TargetCtx(context,name){ // exception
    this.toString = function(){return ' (target) '+this.name}
    this.parent = context
    this.name = name
    this.alias = null
    context.tree.push(this)
    this.to_js = function(){
        return '["'+this.name+'","'+this.alias+'"]'
    }
}

function $TargetListCtx(context){
    this.type = 'target_list'
    this.parent = context
    this.tree = []
    this.expect = 'id'
    context.tree.push(this)
    this.toString = function(){return '(target list) '+this.tree}
}

function $TernaryCtx(context){
    this.type = 'ternary'
    this.parent = context.parent
    context.parent.tree.pop()
    context.parent.tree.push(this)
    context.parent = this
    this.tree = [context]
    this.toString = function(){return '(ternary) '+this.tree}
    this.to_js = function(){
        var qesc = new RegExp('"',"g") // to escape double quotes in arguments
        var args = this.tree[1].to_js().replace(qesc,'\\"')+','
        args += this.tree[0].to_js().replace(qesc,'\\"')+','
        args += this.tree[2].to_js().replace(qesc,'\\"')
        return '$ternary('+$to_js(this.tree)+')'
    }
}

function $TryCtx(context){
    this.type = 'try'
    this.parent = context
    context.tree.push(this)
    this.toString = function(){return '(try) '}
    this.transform = function(node,rank){
        if(node.parent.children.length===rank+1){
            $_SyntaxError(context,"missing clause after 'try' 1")
        }else{
            var next_ctx = node.parent.children[rank+1].context.tree[0]
            if(['except','finally'].indexOf(next_ctx.type)===-1){
                $_SyntaxError(context,"missing clause after 'try' 2")
            }
        }
        // transform node into Javascript 'try' (necessary if
        // "try" inside a "for" loop
        new $NodeJSCtx(node,'try')
        // insert new 'catch' clause
        var catch_node = new $Node('expression')
        new $NodeJSCtx(catch_node,'catch($err'+$loop_num+')')
        node.parent.insert(rank+1,catch_node)
        
        // fake line to start the 'else if' clauses
        var new_node = new $Node('expression')
        new $NodeJSCtx(new_node,'if(false){void(0)}')
        catch_node.insert(0,new_node)
        
        // move the except and finally clauses below catch_node
        var pos = rank+2
        var has_default = false // is there an "except:" ?
        while(true){
            if(pos===node.parent.children.length){break}
            var ctx = node.parent.children[pos].context.tree[0]
            if(ctx.type==='except'||
                (ctx.type==='single_kw' && ctx.token==='finally')){
                ctx.error_name = '$err'+$loop_num
                if(ctx.tree.length>0 && ctx.tree[0].alias!==null){
                    // syntax "except ErrorName as Alias"
                    var new_node = new $Node('expression')
                    var js = 'var '+ctx.tree[0].alias+'='+ctx.tree[0].name
                    js += '($err'+$loop_num+'.message)'
                    new $NodeJSCtx(new_node,js)
                    node.parent.children[pos].insert(0,new_node)
                }
                catch_node.insert(catch_node.children.length,
                    node.parent.children[pos])
                if(ctx.type==='except' && ctx.tree.length===0){
                    if(has_default){$_SyntaxError('more than one except: line')}
                    has_default=true
                }
                node.parent.children.splice(pos,1)
            }else{break}
        }
        if(!has_default){ 
            // if no default except: clause, add a line to throw the
            // exception if it was not caught
            var new_node = new $Node('expression')
            new $NodeJSCtx(new_node,'else{throw $err'+$loop_num+'}')
            catch_node.insert(catch_node.children.length,new_node)
        }
        $loop_num++
    }
    this.to_js = function(){return 'try'}
}

function $UnaryCtx(context,op){
    this.type = 'unary'
    this.op = op
    this.toString = function(){return '(unary) '+this.op+' ['+this.tree+']'}
    this.parent = context
    this.tree = []
    context.tree.push(this)
    this.to_js = function(){return this.op+$to_js(this.tree)}
}

// used in loops
var $loop_num = 0
var $iter_num = 0 

function $add_line_num(node,rank){
    if(node.type==='module'){
        var i=0
        while(i<node.children.length){
            i += $add_line_num(node.children[i],i)
        }
    }else{
        var elt=node.context.tree[0],offset=1
        var flag = true
        // ignore lines added in transform()
        if(node.line_num===undefined){flag=false}
        // don't add line num before try,finally,else,elif
        if(elt.type==='condition' && elt.token==='elif'){flag=false}
        else if(elt.type==='except'){flag=false}
        else if(elt.type==='single_kw'){flag=false}
        if(flag){
            js = 'document.$line_info=['+node.line_num+',"'+node.module+'"]'
            var new_node = new $Node('expression')
            new $NodeJSCtx(new_node,js)
            node.parent.insert(rank,new_node)
            offset = 2
        }
        var i=0
        while(i<node.children.length){
            i += $add_line_num(node.children[i],i)
        }
        return offset
    }
}

function $augmented_assign(context,op){
    // in "foo += bar" context = foo, op = +
    var assign = new $AssignCtx(context)
    var new_op = new $OpCtx(context,op.substr(0,op.length-1))
    assign.tree.push(new_op)
    context.parent.tree.pop()
    context.parent.tree.push(assign)
    return new_op
}

function $get_scope(context){
    // return the $Node indicating the scope of context
    // null for the script or a def $Node
    var ctx_node = context.parent
    while(ctx_node.type!=='node'){ctx_node=ctx_node.parent}
    var tree_node = ctx_node.node
    var scope = null
    while(tree_node.parent.type!=='module'){
        var ntype = tree_node.parent.context.tree[0].type
        if(['def','class'].indexOf(ntype)>-1){
            scope = tree_node.parent
            scope.ntype = ntype
            break
        }
        tree_node = tree_node.parent
    }
    return scope
}

function $get_ids(ctx){
    var res = []
    if(ctx.type==='expr' &&
        ctx.tree[0].type==='list_or_tuple' &&
        ctx.tree[0].real==='list_comp'){return []}
    if(ctx.type==='id'){res.push(ctx.value)}
    else if(ctx.type==='attribute'||ctx.type==='sub'){
        var res1 = $get_ids(ctx.value)
        for(var i=0;i<res1.length;i++){
            if(res.indexOf(res1[i])===-1){res.push(res1[i])}
        }
    }else if(ctx.type==='call'){
        var res1 = $get_ids(ctx.func)
        for(var i=0;i<res1.length;i++){
            if(res.indexOf(res1[i])===-1){res.push(res1[i])}
        }
    }
    if(ctx.tree!==undefined){
        for(var i=0;i<ctx.tree.length;i++){
            var res1 = $get_ids(ctx.tree[i])
            for(var j=0;j<res1.length;j++){
                if(res.indexOf(res1[j])===-1){
                    res.push(res1[j])
                }
            }
        }
    }
    return res
}

function $to_js(tree,sep){
    if(sep===undefined){sep=','}
    var res = ''
    for(var i=0;i<tree.length;i++){
        if(tree[i].to_js!==undefined){
            res += tree[i].to_js()
        }else{
            throw Error('no to_js() for '+tree[i])
        }
        if(i<tree.length-1){res+=sep}
    }
    return res
}

// expression starters
var $expr_starters = ['id','int','float','str','[','(','{','not']

function $arbo(ctx){
    while(ctx.parent!=undefined){ctx=ctx.parent}
    return ctx
}
function $transition(context,token){
    //console.log('arbo '+$arbo(context))
    //console.log('transition '+context+' token '+token)

    if(context.type==='abstract_expr'){
    
        if($expr_starters.indexOf(token)>-1){
            context.parent.tree.pop() // remove abstract expression
            var commas = context.with_commas
            context = context.parent
        }
        if(token==='id'){return new $IdCtx(new $ExprCtx(context,'id',commas),arguments[2])}
        else if(token==='str'){return new $StringCtx(new $ExprCtx(context,'str',commas),arguments[2])}
        else if(token==='int'){return new $IntCtx(new $ExprCtx(context,'int',commas),arguments[2])}
        else if(token==='float'){return new $FloatCtx(new $ExprCtx(context,'float',commas),arguments[2])}
        else if(token==='('){return new $ListOrTupleCtx(new $ExprCtx(context,'tuple',commas),'tuple')}
        else if(token==='['){return new $ListOrTupleCtx(new $ExprCtx(context,'list',commas),'list')}
        else if(token==='{'){return new $DictOrSetCtx(new $ExprCtx(context,'dict_or_set',commas))}
        else if(token==='not'){return new $NotCtx(new $ExprCtx(context,'not',commas))}
        else if(token==='op' && '+-'.search(arguments[2])){ // unary + or -
            return new $UnaryCtx(context,arguments[2])
        }else if(token==='='){$_SyntaxError(context,token)}
        else{return $transition(context.parent,token,arguments[2])}

    }else if(context.type==='assert'){
    
        if($expr_starters.indexOf(token)>-1&&context.init===undefined){
            context.init = true
            return $transition(new $AbstractExprCtx(context,false),token,arguments[2])
        }else if(token==='eol'&&context.init===true){
            return $transition(context.parent,token)
        }else{$_SyntaxError(context,token)}
        
    }else if(context.type==='assign'){
    
        if(token==='eol'){return $transition(context.parent,'eol')}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='attribute'){ 

        if(token==='id'){
            var name = arguments[2]
            if(name.substr(0,2)=='$$'){name=name.substr(2)}
            context.name=name
            return context.parent
        }else{$_SyntaxError(context,token)}

    }else if(context.type==='call'){ 
    
        if(token===','){return context}
        else if($expr_starters.indexOf(token)>-1){
            var expr = new $CallArgCtx(context)
            return $transition(expr,token,arguments[2])
        }else if(token===')'){return context.parent}
        else if(token==='op'){
            var op=arguments[2]
            if(op==='-'){return new $UnaryCtx(context,'-')}
            else if(op==='+'){return context}
            else if(op==='*'){return new $StarArgCtx(context)}
            else if(op==='**'){return new $DoubleStarArgCtx(context)}
            else{throw Error('SyntaxError')}
        }else{return $transition(context.parent,token,arguments[2])}

    }else if(context.type==='call_arg'){ 

        if($expr_starters.indexOf(token)>-1 && context.expect==='id'){
            context.expect=','
            var expr = new $AbstractExprCtx(context,false)
            return $transition(expr,token,arguments[2])
        }else if(token==='=' && context.expect===','){
            return new $ExprCtx(new $KwArgCtx(context),'kw_value',false)
        }else if(token==='op' && context.expect==='id'){
            var op = arguments[2]
            if(op==='*'){context.expect=',';return new $StarArgCtx(context)}
            else if(op==='**'){context.expect=',';return new $DoubleStarArgCtx(context)}
            else{$_SyntaxError(context,'token '+token+' after '+context)}
        }else if(token===')' && context.expect===','){
            return $transition(context.parent,token)
        }else if(token===','&& context.expect===','){
            return new $CallArgCtx(context.parent)
        }else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='class'){
    
        if(token==='id' && context.expect==='id'){
            context.name = arguments[2]
            context.expect = '(:'
            return context
        }
        else if(token==='(' && context.expect==='(:'){
            return new $ParentClassCtx(context)
        }else if(token===':' && context.expect==='(:'){return context.parent}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='comp_if'){

        return $transition(context.parent,token,arguments[2])

    }else if(context.type==='comp_for'){

        if(token==='in' && context.expect==='in'){
            context.expect = null
            return new $AbstractExprCtx(new $CompIterableCtx(context),true)
        }else if(context.expect===null){
            return $transition(context.parent,token,arguments[2])
        }else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='comp_iterable'){

        return $transition(context.parent,token,arguments[2])

    }else if(context.type==='comprehension'){
        if(token==='if'){return new $AbstractExprCtx(new $CompIfCtx(context),false)}
        else if(token==='for'){return new $TargetListCtx(new $CompForCtx(context))}
        else{return $transition(context.parent,token,arguments[2])}

    }else if(context.type==='condition'){

        if(token===':'){
            var new_node = new $Node('expression')
            context.parent.node.add(new_node)
            return new $NodeCtx(new_node)
        }
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='def'){
    
        if(token==='id'){
            if(context.name){
                $_SyntaxError(context,'token '+token+' after '+context)
            }else{
                context.name = arguments[2]
                return context
            }
        }else if(token==='('){return new $FuncArgs(context)}
        else if(token===':'){return context.parent}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='dict_or_set'){ 

        if(context.closed){
            if(token==='['){return new $SubCtx(context)}
            else if(token==='('){return new $CallArgCtx(new $CallCtx(context))}
            //else if(token==='.'){return new $AttrCtx(context)}
            else if(token==='op'){
                return new $AbstractExprCtx(new $OpCtx(context,arguments[2]),false)
            }else{return $transition(context.parent,token,arguments[2])}
        }else{
            if(context.expect===','){
                if(token==='}'){
                    if((context.real==='set')||
                        (context.real==='dict'&&context.tree.length%2===0)){
                        context.items = context.tree
                        context.tree = []
                        context.closed = true
                        return context
                    }else{$_SyntaxError(context,'token '+token+' after '+context)}
                }else if(token===','){
                    if(context.real==='dict_or_set'){context.real='set'}
                    if(context.real==='dict' && context.tree.length%2){
                        $_SyntaxError(context,'token '+token+' after '+context)
                    }
                    context.expect = 'id'
                    return context
                }else if(token===':'){
                    if(context.real==='dict_or_set'){context.real='dict'}
                    if(context.real==='dict'){
                        context.expect='id'
                        return context
                    }else{$_SyntaxError(context,'token '+token+' after '+context)}
                }else{$_SyntaxError(context,'token '+token+' after '+context)}   
            }else if(context.expect==='id'){
                if(token==='}'&&context.tree.length===0){ // empty dict
                    context.items = []
                    context.tree = []
                    context.closed = true
                    context.real = 'dict'
                    return context
                }else if($expr_starters.indexOf(token)>-1){
                    context.expect = ','
                    var expr = new $AbstractExprCtx(context,false)
                    return $transition(expr,token,arguments[2])
                }else{$_SyntaxError(context,'token '+token+' after '+context)}
            }else{return $transition(context.parent,token,arguments[2])}
        }

    }else if(context.type==='double_star_arg'){
    
        if($expr_starters.indexOf(token)>-1){
            return $transition(new $AbstractExprCtx(context,false),token,arguments[2])
        }else if(token===','){return context.parent}
        else if(token===')'){return $transition(context.parent,token)}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='except'){ 

        if(token==='id' && context.expect==='id'){
            new $TargetCtx(context,arguments[2])
            context.expect='as'
            return context
        }else if(token==='as' && context.expect==='as'
            && context.has_alias===undefined  // only one alias allowed
            && context.tree.length===1){ // if aliased, must be the only exception
            context.expect = 'alias'
            context.has_alias = true
            return context
        }else if(token==='id' && context.expect==='alias'){
            if(context.parenth!==undefined){context.expect = ','}
            else{context.expect=':'}
            context.tree[context.tree.length-1].alias = arguments[2]
            return context
        }else if(token===':' && ['id','as',':'].indexOf(context.expect)>-1){
            return context.parent
        }else if(token==='(' && context.expect==='id' && context.tree.length===0){
            context.parenth = true
            return context
        }else if(token===')' && [',','as'].indexOf(context.expect)>-1){
            context.expect = ':'
            return context
        }else if(token===',' && context.parenth!==undefined &&
            context.has_alias === undefined &&
            ['as',','].indexOf(context.expect)>-1){
                context.expect='id'
                return context
        }else{$_SyntaxError(context,'token '+token+' after '+context.expect)}
    
    }else if(context.type==='expr'){

        if($expr_starters.indexOf(token)>-1 && context.expect==='expr'){
            context.expect = ','
            return $transition(new $AbstractExprCtx(context,false),token,arguments[2])
        }else if(token==='not'&&context.expect===','){
            return new $ExprNot(context)
        }else if(token==='in'&&context.expect===','){
            return new $AbstractExprCtx(new $OpCtx(context,'in'),false)
        }else if(token===',' && context.expect===','){
            if(context.with_commas){
                context.expect = 'expr'
                return context
            }else{return $transition(context.parent,token)}
        }else if(token==='.'){return new $AttrCtx(context)}
        else if(token==='['){return new $AbstractExprCtx(new $SubCtx(context),false)}
        else if(token==='('){return new $CallCtx(context)}
        else if(token==='op'){
            // handle operator precedence
            var op_parent=context.parent,op=arguments[2]
            var op1 = context.parent,repl=null
            while(true){
                if(op1.type==='expr'){op1=op1.parent}
                else if(op1.type==='op'&&$op_weight[op1.op]>$op_weight[op]){repl=op1;op1=op1.parent}
                else{break}
            }
            if(repl===null){
                context.parent.tree.pop()
                var expr = new $ExprCtx(op_parent,'operand',context.with_commas)
                expr.expect = ','
                context.parent = expr
                var new_op = new $OpCtx(context,op)
                return new $AbstractExprCtx(new_op,false)
            }
            repl.parent.tree.pop()
            var expr = new $ExprCtx(repl.parent,'operand',false)
            expr.tree = [op1]
            repl.parent = expr
            var new_op = new $OpCtx(repl,op) // replace old operation
            //var res = new $AbstractExprCtx(new_op,false)
            return new $AbstractExprCtx(new_op,false)

        }else if(token==='augm_assign' && context.expect===','){
            return $augmented_assign(context,arguments[2])
        }else if(token==='=' && context.expect===','){
            if(context.parent.type==="call_arg"){
                return new $AbstractExprCtx(new $KwArgCtx(context),true)
            }else{
                while(context.parent!==undefined){context=context.parent}
                context = context.tree[0]
                return new $AbstractExprCtx(new $AssignCtx(context),true)
            }
        }else if(token==='if' && context.parent.type!=='comp_iterable'){ 
            // ternary operator : expr1 if cond else expr2
            return new $AbstractExprCtx(new $TernaryCtx(context),false)
        }else{return $transition(context.parent,token)}

    }else if(context.type==='expr_not'){
    
        if(token==='in'){ // expr not in : operator
            context.parent.tree.pop()
            return new $AbstractExprCtx(new $OpCtx(context.parent,'not_in'),false)
        }else{$_SyntaxError(context,'token '+token+' after '+context)}
        
    }else if(context.type==='for'){
    
        if(token==='in'){return new $AbstractExprCtx(context,true)}
        else if(token===':'){return context.parent}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='from'){
    
        if(token==='id' && context.expect==='module'){
            context.module = arguments[2]
            context.expect = 'import'
            return context
        }else if(token==='import' && context.expect==='import'){
            context.expect = 'id'
            return context
        }else if(token==='id' && context.expect==='id'){
            context.names.push(arguments[2])
            context.expect = ','
            return context
        }else if(token==='op' && arguments[2]==='*' 
            && context.expect==='id'
            && context.names.length ===0){
            context.names.push(arguments[2])
            context.expect = 'eol'
            return context
        }else if(token===',' && context.expect===','){
            context.expect = 'id'
            return context
        }else if(token==='eol' && 
            (context.expect ===',' || context.expect==='eol')){
            return $transition(context.parent,token)
        }else{$_SyntaxError(context,'token '+token+' after '+context)}
            

    }else if(context.type==='func_arg_id'){
        if(token==='=' && context.expect==='='){
            context.parent.has_default = true
            return new $AbstractExprCtx(context,false)
        }else if(token===',' || token===')'){
            if(context.parent.has_default && context.tree.length==0){
                throw Error('SyntaxError: non-default argument follows default argument')
            }else{
                return $transition(context.parent,token)
            }
        }else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='func_args'){
    
        if(token==='id' && context.expect==='id'){
            context.expect = ','
            return new $FuncArgIdCtx(context,arguments[2])
        }else if(token===','){
            if(context.has_kw_arg){throw Error('SyntaxError')}
            else if(context.expect===','){
                context.expect = 'id'
                return context
            }else{$_SyntaxError(context,'token '+token+' after '+context)}            
        }else if(token===')'){
            if(context.expect===','){return context.parent}
            else if(context.tree.length==0){return context.parent} // no argument
            else{$_SyntaxError(context,'token '+token+' after '+context)}
        }else if(token==='op'){
            var op = arguments[2]
            context.expect = ','
            if(op=='*'){return new $FuncStarArgCtx(context,'*')}
            else if(op=='**'){return new $FuncStarArgCtx(context,'**')}
            else{$_SyntaxError(context,'token '+op+' after '+context)}
        }else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='func_star_arg'){
    
        if(token==='id' && context.name===undefined){
            context.name = arguments[2]
            return context.parent
        }else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='global'){

        if(token==='id' && context.expect==='id'){
            new $IdCtx(context,arguments[2])
            context.expect=','
            return context
        }else if(token===',' && context.expect===','){
            context.expect='id'
            return context
        }else if(token==='eol' && context.expect===','){
            return $transition(context.parent,token)
        }else{$_SyntaxError(context,'token '+token+' after '+context)}
        

    }else if(context.type==='id'){
    
        //if(token==='['){return new $AbstractExprCtx(new $SubCtx(context),false)}
        //else if(token==='.'){return new $AttrCtx(context)}
        if(token==='='){
            if(context.parent.type==='expr' &&
                context.parent.parent !== undefined &&
                context.parent.parent.type ==='call_arg'){
                    return new $AbstractExprCtx(new $KwArgCtx(context.parent),false)
            }else{return $transition(context.parent,token,arguments[2])}             
        }else if(token==='op'){return $transition(context.parent,token,arguments[2])}
        else{return $transition(context.parent,token,arguments[2])}

    }else if(context.type==='import'){
    
        if(token==='id' && context.expect==='id'){
            new $ImportedModuleCtx(context,arguments[2])
            context.expect=','
            return context
        }else if(token===',' && context.expect===','){
            context.expect = 'id'
            return context
        }else if(token==='as' && context.expect===','){
            context.expect = 'alias'
            return context
        }else if(token==='id' && context.expect==='alias'){
            context.expect = ','
            context.tree[context.tree.length-1].alias = arguments[2]
            return context
        }else if(token==='eol' && context.expect===','){
            return $transition(context.parent,token)
        }else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='int'||context.type==='float'){
    
        if($expr_starters.indexOf(token)>-1){
            $_SyntaxError(context,'token '+token+' after '+context)
        }else{return $transition(context.parent,token,arguments[2])}

    }else if(context.type==='kwarg'){
    
        if(token===')'){return $transition(context.parent,token)}
        else if(token===','){return new $CallArgCtx(context.parent)}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='list_or_tuple'){ 

        if(context.closed){
            if(token==='['){return new $SubCtx(context)}
            else if(token==='('){return new $CallArgCtx(new $CallCtx(context))}
            else if(token==='.'){return new $AttrCtx(context)}
            else if(token==='op'){
                return new $AbstractExprCtx(new $OpCtx(context,arguments[2]),false)
            }else{return $transition(context.parent,token,arguments[2])}
        }else{
            if(context.expect===','){
                if(context.real==='tuple' && token===')'){
                    context.closed = true
                    return context
                }else if((context.real==='list'||context.real==='list_comp')
                    && token===']'){
                    context.closed = true
                    if(context.real==='list_comp'){context.intervals.push($pos)}
                    return context
                }else if(token===','){
                    context.expect = 'id'
                    return context
                }else if(token==='for'){
                    // comprehension
                    context.real = 'list_comp'
                    context.intervals = [context.start+1]
                    context.expression = context.tree
                    context.tree = [] // reset tree
                    var comp = new $ComprehensionCtx(context)
                    return new $TargetListCtx(new $CompForCtx(comp))
                }else{return $transition(context.parent,token,arguments[2])}   
            }else if(context.expect==='id'){
                if(context.real==='tuple' && token===')'){ // empty tuple
                    context.closed = true
                    return context
                }else if(context.real==='list'&& token===']'){
                    context.closed = true
                    return context
                }else if(token !==')'&&token!==']'&&token!==','){
                    context.expect = ','
                    var expr = new $AbstractExprCtx(context,false)
                    return $transition(expr,token,arguments[2])
                }
            }else{return $transition(context.parent,token,arguments[2])}
        }

    }else if(context.type==='list_comp'){ 

        if(token===']'){return context.parent}
        else if(token==='in'){return new $ExprCtx(context,'iterable',true)}
        else if(token==='if'){return new $ExprCtx(context,'condition',true)}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='node'){
    
        if($expr_starters.indexOf(token)>-1){
            var expr = new $AbstractExprCtx(context,true)
            return $transition(expr,token,arguments[2])
        }else if(token==='class'){return new $ClassCtx(context)}
        else if(token==='def'){return new $DefCtx(context)}
        else if(token==='for'){return new $TargetListCtx(new $ForExpr(context))}
        else if(['if','elif','while'].indexOf(token)>-1){
            return new $AbstractExprCtx(new $ConditionCtx(context,token),false)
        }else if(['else','finally'].indexOf(token)>-1){
            return new $SingleKwCtx(context,token)
        }else if(token==='try'){return new $TryCtx(context)}
        else if(token==='except'){return new $ExceptCtx(context)}
        else if(token==='assert'){return new $AssertCtx(context)}
        else if(token==='from'){return new $FromCtx(context)}
        else if(token==='import'){return new $ImportCtx(context)}
        else if(token==='global'){return new $GlobalCtx(context)}
        else if(token==='pass'){return new $PassCtx(context)}
        else if(token==='raise'){return new $RaiseCtx(context)}
        else if(token==='return'){
            var ret = new $ReturnCtx(context)
            return new $AbstractExprCtx(ret,true)
        }else if(token==='del'){return new $AbstractExprCtx(new $DelCtx(context),false)}
        else if(token===':'){ // end of if,def,for etc.
            var tree_node = context.node
            var new_node = new $Node('expression')
            tree_node.add(new_node)
            return new $NodeCtx(new_node)
        }else if(token==='eol'){
            if(context.tree.length===0){ // might be the case after a :
                context.node.parent.children.pop()
                return context.node.parent.context
            }
            return context
        }else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='not'){
        if(token==='in'){ // operator not_in
            // not is always in an expression : remove it
            context.parent.parent.tree.pop() // remove 'not'
            return new $ExprCtx(new $OpCtx(context.parent,'not_in'),'op',false)
        }else if($expr_starters.indexOf(token)>-1){
            var expr = new $AbstractExprCtx(context,false)
            return $transition(expr,token,arguments[2])
        }else{return $transition(context.parent,token)}

    }else if(context.type==='op'){ 
    
        if($expr_starters.indexOf(token)>-1){
            return $transition(new $AbstractExprCtx(context,false),token,arguments[2])
        }else if(token==='op' && '+-'.search(arguments[2])>-1){
            return new $UnaryCtx(context,arguments[2])
        }else{return $transition(context.parent,token)}

    }else if(context.type==='parent_class'){

        if(token==='id' && context.expect==='id'){
            new $IdCtx(context,arguments[2])
            context.expect = ','
            return context
        }else if(token===',' && context.expect==','){
            context.expect='id'
            return context
        }else if(token===')'){return context.parent}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='pass'){ 

        if(token==='eol'){return context.parent}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='raise'){ 

        if(token==='id' && context.tree.length===0){
            return new $IdCtx(new $ExprCtx(context,'exc',false),arguments[2])
        }else if(token==='eol'){
            return $transition(context.parent,token)
        }else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='return'){

        return $transition(context.parent,token)

    }else if(context.type==='single_kw'){

        if(token===':'){return context.parent}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='star_arg'){
    
        if($expr_starters.indexOf(token)>-1){
            return $transition(new $AbstractExprCtx(context,false),token,arguments[2])
        }else if(token===','){return context.parent}
        else if(token===')'){return $transition(context.parent,token)}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='str'){

        if(token==='['){return new $AbstractExprCtx(new $SubCtx(context),false)}
        else if(token==='('){return new $CallCtx(context)}
        //else if(token==='.'){return new $AttrCtx(context)}
        else if(token=='str'){context.value += '+'+arguments[2];return context}
        else{return $transition(context.parent,token,arguments[2])}

    }else if(context.type==='sub'){ 
    
        // subscription x[a] or slicing x[a:b:c]
        if($expr_starters.indexOf(token)>-1){
            var expr = new $AbstractExprCtx(context,false)
            return $transition(expr,token,arguments[2])
        }else if(token===']'){return context.parent}
        else if(token===':'){
            return new $AbstractExprCtx(context,false)
        }else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='target_list'){
    
        if(token==='id' && context.expect==='id'){
            context.expect = ','
            new $IdCtx(context,arguments[2])
            return context
        }else if((token==='('||token==='[')&&context.expect==='id'){
            context.expect = ','
            return new $TargetListCtx(context)
        }else if((token===')'||token===']')&&context.expect===','){
            return context.parent
        }else if(token===',' && context.expect==','){
            context.expect='id'
            return context
        }else if(context.expect===','){return $transition(context.parent,token,arguments[2])}
        else{$_SyntaxError(context,'token '+token+' after '+context)}

    }else if(context.type==='ternary'){
    
        if(token==='else'){return new $AbstractExprCtx(context,false)}
        else{return $transition(context.parent,token,arguments[2])}

    }else if(context.type==='try'){ 

        if(token===':'){return context.parent}
        else{$_SyntaxError(context,'token '+token+' after '+context)}
    
    }else if(context.type==='unary'){

        if(['int','float'].indexOf(token)>-1){
            context.parent.tree.pop()
            var value = arguments[2]
            if(context.op==='-'){value=-value}
            return $transition(context.parent,token,value)
        }else if(token==='id'){
            // replace by -1*x, or remove
            context.parent.tree.pop()
            if(context.op==='-'){
                var int_expr = new $IntCtx(context.parent,-1)
                return $transition(new $OpCtx(int_expr,'*'),token,arguments[2])
            }else{
                return $transition(context.parent,token,arguments[2])
            }
        }else if(token==="op" && '+-'.search(arguments[2])>-1){
            var op = arguments[2]
            if(context.op===op){context.op='+'}else{context.op='-'}
            return context
        }else{return $transition(context.parent,token,arguments[2])}

    }
}

function $py2js(src,module){
    src = src.replace(/\r\n/gm,'\n')
    while (src.length>0 && (src.charAt(0)=="\n" || src.charAt(0)=="\r")){
        src = src.substr(1)
    }
    if(src.charAt(src.length-1)!="\n"){src+='\n'}
    if(module===undefined){module='__main__'}

    document.$py_src[module]=src 
    var root = $tokenize(src,module)
    root.transform()
    if(document.$debug>0){$add_line_num(root,null,module)}
    return root
}

function $tokenize(src,module){
    var delimiters = [["#","\n","comment"],['"""','"""',"triple_string"],
        ["'","'","string"],['"','"',"string"],
        ["r'","'","raw_string"],['r"','"',"raw_string"]]
    var br_open = {"(":0,"[":0,"{":0}
    var br_close = {")":"(","]":"[","}":"{"}
    var br_stack = ""
    var br_pos = new Array()
    var kwdict = ["class","is","return",
        "for","lambda","try","finally","raise","def","from",
        "nonlocal","while","del","global","with",
        "as","elif","else","if","yield","assert","import",
        "except","raise","in","not","pass",
        //"False","None","True","break","continue",
        // "and',"or"
        ]
    var unsupported = ["is","nonlocal","with","yield"]
    var $indented = ['class','def','for','condition','single_kw','try','except']
    // from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Reserved_Words
    var forbidden = ['case','catch','debugger','default','delete',
        'do','function','instanceof','new','switch','this','throw',
        'typeof','var','void','with','enum','export','extends','super']

    var punctuation = {',':0,':':0} //,';':0}
    var int_pattern = new RegExp("^\\d+")
    var float_pattern = new RegExp("^\\d+\\.\\d*(e-?\\d+)?")
    var id_pattern = new RegExp("[\\$_a-zA-Z]\\w*")
    var qesc = new RegExp('"',"g") // to escape double quotes in arguments

    var context = null
    var root = new $Node('module')
    root.indent = -1
    var new_node = new $Node('expression')
    current = root
    var name = ""
    var _type = null
    var pos = 0
    indent = null

    var lnum = 1
    while(pos<src.length){
        //document.line_num = pos2line[pos]
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
            else if(src.charAt(pos)==='#'){ // comment
                var offset = src.substr(pos).search(/\n/)
                if(offset===-1){break}
                pos+=offset+1;lnum++;indent=null;continue
            }
            new_node.indent = indent
            new_node.line_num = lnum
            new_node.module = module
            // attach new node to node with indentation immediately smaller
            if(indent>current.indent){
                // control that parent ended with ':'
                if(context!==null){
                    if($indented.indexOf(context.tree[0].type)==-1){
                        $IndentationError(module,'unexpected indent',pos)
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
                        $pos = pos-zone.length-1
                        var string = zone.substr(1).replace(qesc,'\\"')
                        context = $transition(context,'str',zone+car)
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
                    $pos = pos-name.length
                    context = $transition(context,name)
                } else if(name in $operators) { // and, or
                    $pos = pos-name.length
                    context = $transition(context,'op',name)
                } else {
                    if(forbidden.indexOf(name)>-1){name='$$'+name}
                    $pos = pos-name.length
                    context = $transition(context,'id',name)
                }
                name=""
                continue
            }
        }
        // point
        if(car=="."){
            $pos = pos
            context = $transition(context,'.')
            pos++;continue
        }
        // number
        if(car.search(/\d/)>-1){
            // digit
            var res = float_pattern.exec(src.substr(pos))
            if(res){
                if(res[0].search('e')>-1){
                    $pos = pos
                    context = $transition(context,'float',res[0])
                }else{
                    $pos = pos
                    context = $transition(context,'float',eval(res[0]))
                }
            }else{
                res = int_pattern.exec(src.substr(pos))
                $pos = pos
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
                if(current.context.tree.length>0){
                    $pos = pos
                    context = $transition(context,'eol')
                    indent=null
                    new_node = new $Node()
                }else{
                    new_node.line_num = lnum
                }
                pos++;continue
            }
        }
        if(car in br_open){
            br_stack += car
            br_pos[br_stack.length-1] = pos
            $pos = pos
            context = $transition(context,car)
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
                $pos = pos
                context = $transition(context,car)
                pos++;continue
            }
        }
        if(car=="="){
            if(src.charAt(pos+1)!="="){
                $pos = pos
                context = $transition(context,'=')
                pos++;continue
            } else {
                $pos = pos
                context = $transition(context,'op','==')
                pos+=2;continue
            }
        }
        if(car in punctuation){
            $pos = pos
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
            $pos = pos
            if(op_match.length>0){
                if(op_match in $augmented_assigns){
                    context = $transition(context,'augm_assign',op_match)
                }else{
                    context = $transition(context,'op',op_match)
                }
                pos += op_match.length
                continue
            }
        }
        if(car=='\\' && src.charAt(pos+1)=='\n'){
            lnum++;pos+=2;continue
        }
        if(car!=' '&&car!=='\t'){$SyntaxError(module,'unknown token ['+car+']',pos)}
        pos += 1
    }

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
                        }
                    }
                $xmlhttp.open('GET',elt.src,false)
                $xmlhttp.send()
            }else{
                var src = (elt.innerHTML || elt.textContent)
            }
            var root = $py2js(src,'__main__')
            var js = root.to_js()
            if(debug===2){console.log(js)}
            eval(js)
        }else{ // get path of brython.js
            var br_scripts = ['brython.js','py_list.js']
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