function Atom(stack){
    this.parent = stack
    this.type = null
    this.stack = function(){
        return new Stack(this.parent.list.slice(this.start,this.end+1))
    }
    this.list = function(){
        return this.parent.list.slice(this.start,this.end+1)
    }
    this.to_js = function(){return this.stack().to_js()}
}

function Stack(stack_list){
    this.list = stack_list
    
    this.find_next = function(){
        // arguments are position to search from, researched type and
        // optional researched values
        // return position of next matching stack item or null
        var pos = arguments[0]
        var _type = arguments[1]
        var values = null
        if(arguments.length>2){
            values = {}
            for(i=2;i<arguments.length;i++){values[arguments[i]]=0}
        }
        for(i=pos;i<this.list.length;i++){
            if(this.list[i][0]==_type){
                if(values==null){
                    return i
                } else if(this.list[i][1] in values){
                    return i
                }
            }
        }
        return null
    }

    this.find_next_at_same_level = function(){
        // same as find_next but skips enclosures to find the token
        // at the same level as the one where search starts
        var pos = arguments[0]
        var _type = arguments[1]
        var values = null
        if(arguments.length>2){
            values = {}
            for(i=2;i<arguments.length;i++){values[arguments[i]]=0}
        }
        while(true){
            if(this.list[pos][0]=="bracket" 
                && this.list[pos][1] in $OpeningBrackets){
                // opening bracket
                pos = this.find_next_matching(pos)
            } else if(this.list[pos][0]==_type){
                if(values==null){return pos}
                else if(this.list[pos][1] in values){return pos}
            }
            pos++
            if (pos>this.list.length-1){return null}
        }
    }
    
    this.find_previous = function(){
        // same as find_next but search backwards from pos
        var pos = arguments[0]
        var _type = arguments[1]
        var values = null
        if(arguments.length>2){
            values = {}
            for(i=2;i<arguments.length;i++){values[arguments[i]]=0}
        }
        for(i=pos;i>=0;i--){
            if(this.list[i][0]==_type){
                if(values==null){
                    return i
                } else if(this.list[i][1] in values){
                    return i
                }
            }
        }
        return null
    }

    this.find_next_matching = function(pos){
        // find position of stack item closing the bracket 
        // at specified position in the tokens stack
        
        var brackets = {"(":")","[":"]","{":"}"}
        var _item = this.list[pos]
        if(_item[0]=="bracket"){
            opening = _item[1]
            count = 0
            for(i=pos;i<this.list.length;i++){
                if(this.list[i][0]=="bracket"){
                    var value = this.list[i][1]
                    if(value==opening){count += 1}
                    else if(value==brackets[opening]){
                        count -= 1
                        if(count==0){return i}
                    }
                }
            }
        }
        return null
    }

    this.find_previous_matching = function(pos){
        // find position of stack item closing the bracket 
        // at specified position in the tokens stack
        
        var brackets = {")":"(","]":"[","}":"{"}
        var item = this.list[pos]
        var i=0
        if(item[0]=="bracket"){
            closing = item[1]
            count = 0
            for(i=pos;i>=0;i--){
                if(this.list[i][0]=="bracket"){
                    var value = this.list[i][1]
                    if(value==closing){count += 1;}
                    else if(value==brackets[closing]){
                        count -= 1
                        if(count==0){return i}
                    }
                }
            }
        }
        return null
    }
    
    
    this.get_atoms = function(){
        var pos = 0
        var nb = 0
        var atoms = []
        while(pos<this.list.length){
            atom = this.atom_at(pos,true)
            atoms.push(atom)
            pos += atom.end-atom.start
        }
        return atoms
    }

    this.atom_at = function(pos,implicit_tuple){
        // return the atom starting at specified position
        // an atom is an identifier
        // with optional qualifiers :  x.foo
        // and calls : x(...)
        // if implicit_tuple is set, consume all atoms joined by ,
        atom = new Atom(this)
        atom.start = pos
        if(this.list[pos][0] in $List2Dict('id','assign_id','literal')){
            atom.type = this.list[pos][0]
            end = pos
            while(end<this.list.length-1){
                var item = this.list[end+1]
                if(item[0] in $List2Dict("id","assign_id","literal")){
                    end += 1
                } else if(item[0] in $List2Dict("point","qualifier")){
                    atom.type = "qualified_id"
                    end += 1
                } else if(item[0]=="bracket" && item[1]=='('){
                    atom.type = "function_call"
                    end = this.find_next_matching(end+1)
                } else if(item[0]=="bracket" && item[1]=='['){
                    atom.type = "slicing"
                    end = this.find_next_matching(end+1)
                } else if(implicit_tuple && item[0]=="delimiter" && item[1]==','){
                    // implicit tuple
                    if(atom.type=="id" || atom.type=="literal"){
                        atom.type = "tuple"
                    }
                    end += 1
                } else if(atom.type=="tuple" && item[0]=="id"){
                    end += 1
                } else {
                    break
                }
            }
            atom.end = end
            return atom
        } else if(this.list[pos][0]=="bracket" && 
            (this.list[pos][1]=="(" || this.list[pos][1]=='[')){
            atom.type = "tuple"
            atom.end = this.find_next_matching(pos)
            return atom
        } else {
            atom.type = this.list[pos][0]
            atom.end = pos
            return atom
        }
    }

    this.atom_before = function(pos,implicit_tuple){
        // return the atom before specified position
        atom = new Atom(this)
        if(pos==0){return null}
        atom.end = pos-1
        atom.start = pos-1
        // find position before atom
        var atom_parts=$List2Dict("id","assign_id","literal","point","qualifier")
        var closing = $List2Dict(')',']')
        while(true){
            if(atom.start==-1){break}
            var item = this.list[atom.start]
            if(item[0] in atom_parts){atom.start--;continue}
            else if(item[0]=="bracket" && item[1] in closing){
                atom.start = this.find_previous_matching(atom.start)-1
                continue
            }
            else if(implicit_tuple && item[0]=="delimiter"
                    && item[1]==","){atom.start--;continue}
            break
        }
        atom.start++
        return this.atom_at(atom.start,implicit_tuple)
    }
    
    this.indent = function(pos){
        // return indentation of the line of the item at specified position
        var nl = this.find_previous(pos,"newline")
        if(nl==null){nl=0}
        if(nl<this.list.length-1 && this.list[nl+1][0]=="indent"){
            return this.list[nl+1][1]
        } else{return 0}
    }
    
    this.split = function(delimiter){
        // split stack with specified delimiter
        var items = new Array()
        var count = 0
        var pos = 0
        var start = 0
        while(pos<this.list.length){
            pos = this.find_next_at_same_level(pos,'delimiter',delimiter)
            if(pos==null){pos=this.list.length;break}
            var s = new Stack(this.list.slice(start,pos))
            s.start = start
            s.end = pos-1
            items.push(s)
            start = pos+1
            pos++
        }
        var s = new Stack(this.list.slice(start,pos))
        s.start = start
        s.end = pos-1
        if(s.end<start){s.end=start}
        items.push(s)
        return items
    }

    this.find_block = function(pos){
        var kw = $List2Dict('def','if','else','elif','class','for')
        var item = this.list[pos]
        if(item[0]=="keyword" && item[1] in kw) {
            var closing_pos = null
            for(i=pos+1;i<this.list.length;i++){
                if(this.list[i][0]=="delimiter" && this.list[i][1]==":"){
                    closing_pos = i
                    break
                }
            }
            if(closing_pos!=null){
                // find block end : the newline before the first indentation equal
                // to the indentation of the line beginning with the keyword
                var kw_indent = 0
                var line_start = this.find_previous(pos,"newline")
                if(line_start==null){kw_indent=0}
                else if(this.list[line_start+1][0]=="indent"){
                    kw_indent = this.list[line_start+1][1]
                }
                var stop = closing_pos
                while(true){
                    nl = this.find_next(stop,"newline")
                    if(nl==null){stop = this.list.length-1;break}
                    if(nl<this.list.length-1){
                        if(this.list[nl+1][0]=="indent"){
                            if(this.list[nl+1][1]<=kw_indent){
                                stop = nl
                                break
                            }
                        } else { // no indent
                            stop = nl
                            break
                        }
                    } else {
                        stop = this.list.length-1
                        break
                    }
                    stop = nl+1
                }
                return [closing_pos,stop,kw_indent]
            }
        }
        return null
    }

    this.to_js = function(){
        // build Javascript code
        var i=0,j=0,x=null
        var js = "",scope_stack=[]
        for(i=0;i<this.list.length;i++){
            x = this.list[i]
            t2 = $List2Dict("id","assign_id","literal","keyword","code")
            if(x[0]=="indent") {
                for(j=0;j<x[1];j++){js += " "}
            } else if(x[0] in t2) {
                if(x[0]=='literal'){
                    if(typeof x[1]=='string'){
                        js += '$JS2Py('+x[1].replace(/\n/gm,'\\\n')+')'
                    } else {
                        js += '$JS2Py('+x[1]+')'
                    }
                } else if(x[0]=="id"){
                    // resolve id name with scope
                    if(x[3]==undefined){js += x[1]}
                    else{js += '$resolve("'+x[1]+'","'+x[3]+'")'}
                } else if(x[0]=="assign_id"){
                    // assignment inside a scope
                    if(x[3]==undefined){js += x[1]}
                    else{js += '$ns["'+x[3]+'"]["'+x[1]+'"]'}
                } else {
                    js += x[1]
                }
                if(i<this.list.length-1 && this.list[i+1][0] != "bracket"){
                    js += " "
                }
            } else {
                if(x[0]=="newline"){js += '\r\n'}
                else{js += x[1]}
            }
        }
        return js
    }

    this.dump = function(){
        ch = ''
        $ForEach(this.list).Do(function(item){
            ch += item[0]+' '+item[1]+'\n'
        })
        alert(ch)
    }
}
