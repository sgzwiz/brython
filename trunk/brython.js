// brython.js www.brython.info
// version 1.1.20130217-222712
// version compiled from commented, indented source files at http://code.google.com/p/brython/
function abs(obj){
if(isinstance(obj,int)){return int(Math.abs(obj))}
else if(isinstance(obj,float)){return float(Math.abs(obj.value))}
else{$raise('TypeError',"Bad operand type for abs(): '"+str(obj.__class__)+"'")}
}
function $alert(src){alert(str(src))}
function all(iterable){
while(true){
try{
var elt=next(iterable)
if(!bool(elt)){return False}
}catch(err){return True}
}
}
function any(iterable){
while(true){
try{
var elt=next(iterable)
if(bool(elt)){return True}
}catch(err){return False}
}
}
function assert_raises(){
var $ns=$MakeArgs('assert_raises',arguments,['exc','func'],{},'args','kw')
var args=$ns['args']
try{$ns['func'].apply(this,args)}
catch(err){
if(err.name!==$ns['exc']){
$raise('AssertionError',
"exception raised '"+err.name+"', expected '"+$ns['exc']+"'")
}
return
}
$raise('AssertionError',"no exception raised, expected '"+$ns['exc']+"'")
}
function bool(obj){
if(obj===null){return False}
else if(isinstance(obj,dict)){return obj.keys.length>0}
else if(isinstance(obj,tuple)){return obj.items.length>0}
else if(typeof obj==="boolean"){return obj}
else if(typeof obj==="number" || typeof obj==="string"){
if(obj){return true}else{return false}
}else if('__bool__' in obj){return obj.__bool__()}
else if('__len__' in obj){return obj.__len__()>0}
return true
}
bool.__class__=$type
bool.__name__='bool'
bool.__str__=function(){return "<class 'bool'>"}
bool.toString=bool.__str__
function $class(obj,info){
this.obj=obj
this.info=info
this.__class__=Object
this.toString=function(){return "<class '"+info+"'>"}
}
function $confirm(src){return confirm(src)}
function dict(){
if(arguments.length==0){return new $DictClass([],[])}
var iterable=arguments[0]
var obj=new $DictClass([],[])
for(var i=0;i<iterable.__len__();i++){
var elt=iterable.__item__(i)
obj.__setitem__(elt.__item__(0),elt.__item__(1))
}
return obj
}
dict.__class__=$type
dict.__name__='dict'
dict.toString=function(){return "<class 'dict'>"}
function $DictClass($keys,$values){
var x=null
var i=null
this.iter=null
this.__class__=dict
this.$keys=$keys 
this.$values=$values 
}
$DictClass.prototype.toString=function(){
if(this.$keys.length==0){return '{}'}
var res="{",key=null,value=null,i=null 
var qesc=new RegExp('"',"g")
for(var i=0;i<this.$keys.length;i++){
if(typeof this.$keys[i]==="string"){key='"'+$escape_dq(this.$keys[i])+'"'}
else{key=str(this.$keys[i])}
if(typeof this.$values[i]==="string"){value='"'+$escape_dq(this.$values[i])+'"'}
else{value=str(this.$values[i])}
res +=key+':'+value+','
}
return res.substr(0,res.length-1)+'}'
}
$DictClass.prototype.__add__=function(other){
var msg="unsupported operand types for +:'dict' and "
$raise('TypeError',msg+"'"+(str(other.__class__)|| typeof other)+"'")
}
$DictClass.prototype.__class__=dict
$DictClass.prototype.__contains__=function(item){
return this.$keys.__contains__(item)
}
$DictClass.prototype.__delitem__=function(arg){
for(var i=0;i<this.$keys.length;i++){
if(arg.__eq__(this.$keys[i])){
this.$keys.splice(i,1)
this.$values.splice(i,1)
return
}
}
$raise('KeyError',str(arg))
}
$DictClass.prototype.__eq__=function(other){
if(!isinstance(other,dict)){return False}
if(other.$keys.length!==this.$keys.length){return False}
for(var i=0;i<this.$keys.length;i++){
var key=this.$keys[i]
for(j=0;j<other.$keys.length;j++){
try{
if(other.$keys[j].__eq__(key)){
if(!other.$values[j].__eq__(this.$values[i])){
return False
}
}
}catch(err){void(0)}
}
}
return True
}
$DictClass.prototype.__getattr__=function(attr){
return $getattr(this,attr)
}
$DictClass.prototype.__getitem__=function(arg){
for(var i=0;i<this.$keys.length;i++){
if(arg.__eq__(this.$keys[i])){return this.$values[i]}
}
$raise('KeyError',str(arg))
}
$DictClass.prototype.__in__=function(item){return item.__contains__(this)}
$DictClass.prototype.__item__=function(i){return this.$keys[i]}
$DictClass.prototype.__len__=function(){return this.$keys.length}
$DictClass.prototype.__ne__=function(other){return !this.__eq__(other)}
$DictClass.prototype.__next__=function(){
if(this.iter==null){this.iter==0}
if(this.iter<this.$keys.length){
this.iter++
return this.$keys[this.iter-1]
}else{
this.iter=null
$raise('StopIteration')
}
}
$DictClass.prototype.__not_in__=function(item){return !(item.__contains__(this))}
$DictClass.prototype.__setitem__=function(key,value){
for(var i=0;i<this.$keys.length;i++){
try{
if(key.__eq__(this.$keys[i])){
this.$values[i]=value
return
}
}catch(err){
void(0)
}
}
this.$keys.push(key)
this.$values.push(value)
}
$DictClass.prototype.items=function(){
return new $iterator(zip(this.$keys,this.$values),"dict_items")
}
$DictClass.prototype.keys=function(){
return new $iterator(this.$keys,"dict keys")
}
$DictClass.prototype.values=function(){
return new $iterator(this.$values,"dict values")
}
function dir(obj){
var res=[]
for(var attr in obj){res.push(attr)}
res.sort()
return res
}
function enumerate(iterator){
var res=[]
for(var i=0;i<iterator.__len__();i++){
res.push([i,iterator.__item__(i)])
}
return res
}
function $eval(src){
if(src===""){$raise('SyntaxError',"unexpected EOF while parsing")}
try{return eval($py2js(src).to_js())}
catch(err){
if(err.py_error===undefined){$raise('ExecutionError',err.message)}
if(document.$stderr){document.$stderr.write(document.$stderr_buff+'\n')}
else{throw(err)}
}
}
function exec(src){
try{eval($py2js(src).to_js())}
catch(err){
if(err.py_error===undefined){$raise('ExecutionError',err.message)}
throw err
}
}
function filter(){
if(arguments.length!=2){$raise('TypeError',
"filter expected 2 arguments, got "+arguments.length)}
var func=arguments[0],iterable=arguments[1]
var res=[]
for(var i=0;i<iterable.__len__();i++){
if(func(iterable.__item__(i))){
res.push(iterable.__item__(i))
}
}
return res
}
function float(value){
if(typeof value=="number" ||(
typeof value=="string" && !isNaN(value))){
return new $FloatClass(parseFloat(value))
}else if(isinstance(value,float)){return value}
else{$raise('ValueError',"Could not convert to float(): '"+str(value)+"'")}
}
float.__class__=$type
float.__name__='float'
float.toString=function(){return "<class 'float'>"}
function $FloatClass(value){
this.value=value
this.__class__=float
}
$FloatClass.prototype.toString=function(){
var res=this.value+'' 
if(res.indexOf('.')==-1){res+='.0'}
return str(res)
}
$FloatClass.prototype.__class__=float
$FloatClass.prototype.__bool__=function(){return bool(this.value)}
$FloatClass.prototype.__floordiv__=function(other){
if(isinstance(other,int)){
if(other===0){$raise('ZeroDivisionError','division by zero')}
else{return float(Math.floor(this.value/other))}
}else if(isinstance(other,float)){
if(!other.value){$raise('ZeroDivisionError','division by zero')}
else{return float(Math.floor(this.value/other.value))}
}else{$raise('TypeError',
"unsupported operand type(s) for //: 'int' and '"+other.__class__+"'")
}
}
$FloatClass.prototype.__in__=function(item){return item.__contains__(this)}
$FloatClass.prototype.__not_in__=function(item){return !(item.__contains__(this))}
$FloatClass.prototype.__truediv__=function(other){
if(isinstance(other,int)){
if(other===0){$raise('ZeroDivisionError','division by zero')}
else{return float(this.value/other)}
}else if(isinstance(other,float)){
if(!other.value){$raise('ZeroDivisionError','division by zero')}
else{return float(this.value/other.value)}
}else{$raise('TypeError',
"unsupported operand type(s) for //: 'int' and '"+other.__class__+"'")
}
}
var $op_func=function(other){
if(isinstance(other,int)){return float(this.value-other)}
else if(isinstance(other,float)){return float(this.value-other.value)}
else{$raise('TypeError',
"unsupported operand type(s) for -: "+this.value+" (float) and '"+other.__class__+"'")
}
}
$op_func +='' 
var $ops={'+':'add','-':'sub','*':'mul','%':'mod'}
for($op in $ops){
eval('$FloatClass.prototype.__'+$ops[$op]+'__ = '+$op_func.replace(/-/gm,$op))
}
var $comp_func=function(other){
if(isinstance(other,int)){return this.value > other.valueOf()}
else if(isinstance(other,float)){return this.value > other.value}
else{$raise('TypeError',
"unorderable types: "+this.__class__+'() > '+other.__class__+"()")
}
}
$comp_func +='' 
var $comps={'>':'gt','>=':'ge','<':'lt','<=':'le','==':'eq','!=':'ne'}
for($op in $comps){
eval("$FloatClass.prototype.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
}
var $notimplemented=function(other){
$raise('TypeError',
"unsupported operand types for OPERATOR: '"+this.__class__+"' and '"+other.__class__+"'")
}
$notimplemented +='' 
for($op in $operators){
var $opfunc='__'+$operators[$op]+'__'
if(!($opfunc in $FloatClass.prototype)){
eval('$FloatClass.prototype.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
}
}
function getattr(obj,attr,_default){
if(obj.__getattr__!==undefined &&
obj.__getattr__(attr)!==undefined){
return obj.__getattr__(attr)
}
else if(_default !==undefined){return _default}
else{$raise('AttributeError',
"'"+str(obj.__class__)+"' object has no attribute '"+attr+"'")}
}
function hasattr(obj,attr){
try{getattr(obj,attr);return True}
catch(err){return False}
}
function input(src){
return prompt(src)
}
function int(value){
if(isinstance(value,int)){return value}
else if(value===True){return 1}
else if(value===False){return 0}
else if(typeof value=="number" ||
(typeof value=="string" && parseInt(value)!=NaN)){
return parseInt(value)
}else if(isinstance(value,float)){
return parseInt(value.value)
}else{$raise('ValueError',
"Invalid literal for int() with base 10: '"+str(value)+"'"+value.__class__)
}
}
int.__class__=$type
int.__name__='int'
int.toString=function(){return "<class 'int'>"}
Number.prototype.__class__=int
Number.prototype.__floordiv__=function(other){
if(isinstance(other,int)){
if(other==0){$raise('ZeroDivisionError','division by zero')}
else{return Math.floor(this/other)}
}else if(isinstance(other,float)){
if(!other.value){$raise('ZeroDivisionError','division by zero')}
else{return float(Math.floor(this/other.value))}
}else{$UnsupportedOpType("//","int",other.__class__)}
}
Number.prototype.__getattr__=function(attr){$raise('AttributeError',
"'int' object has no attribute '"+attr+"'")}
Number.prototype.__in__=function(item){return item.__contains__(this)}
Number.prototype.__int__=function(){return this}
Number.prototype.__mul__=function(other){
var val=this.valueOf()
if(isinstance(other,int)){return this*other}
else if(isinstance(other,float)){return float(this*other.value)}
else if(typeof other==="string"){
var res=''
for(var i=0;i<val;i++){res+=other}
return res
}else if(isinstance(other,list)){
var res=[]
var $temp=other.slice(0,other.length)
for(var i=0;i<val-1;i++){res=res.concat($temp)}
return res
}else{$UnsupportedOpType("*",int,other)}
}
Number.prototype.__not_in__=function(item){
res=item.__contains__(this)
return !res
}
Number.prototype.__pow__=function(other){
if(typeof other==="number"){return int(Math.pow(this.valueOf(),other.valueOf()))}
else{$UnsupportedOpType("//",int,other.__class__)}
}
Number.prototype.__setattr__=function(attr,value){$raise('AttributeError',
"'int' object has no attribute "+attr+"'")}
Number.prototype.__str__=function(){return this.toString()}
Number.prototype.__truediv__=function(other){
if(isinstance(other,int)){
if(other==0){$raise('ZeroDivisionError','division by zero')}
else{return float(this/other)}
}else if(isinstance(other,float)){
if(!other.value){$raise('ZeroDivisionError','division by zero')}
else{return float(this/other.value)}
}else{$UnsupportedOpType("//","int",other.__class__)}
}
var $op_func=function(other){
if(isinstance(other,int)){
var res=this.valueOf()-other.valueOf()
if(isinstance(res,int)){return res}
else{return float(res)}
}
else if(isinstance(other,float)){return float(this.valueOf()-other.value)}
else{$raise('TypeError',
"unsupported operand type(s) for -: "+this.value+" (float) and '"+str(other.__class__)+"'")
}
}
$op_func +='' 
var $ops={'+':'add','-':'sub','%':'mod'}
for($op in $ops){
eval('Number.prototype.__'+$ops[$op]+'__ = '+$op_func.replace(/-/gm,$op))
}
var $comp_func=function(other){
if(isinstance(other,int)){return this.valueOf()> other.valueOf()}
else if(isinstance(other,float)){return this.valueOf()> other.value}
else{$raise('TypeError',
"unorderable types: "+str(this.__class__)+'() > '+str(other.__class__)+"()")}
}
$comp_func +='' 
var $comps={'>':'gt','>=':'ge','<':'lt','<=':'le','==':'eq','!=':'ne'}
for($op in $comps){
eval("Number.prototype.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
}
var $notimplemented=function(other){
$raise('TypeError',
"unsupported operand types for OPERATOR: '"+str(this.__class__)+"' and '"+str(other.__class__)+"'")
}
$notimplemented +='' 
for($op in $operators){
var $opfunc='__'+$operators[$op]+'__'
if(!($opfunc in Number.prototype)){
eval('Number.prototype.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
}
}
function isinstance(obj,arg){
if(obj===null){return arg===None}
if(obj===undefined){return false}
if(arg.constructor===Array){
for(var i=0;i<arg.length;i++){
if(isinstance(obj,arg[i])){return true}
}
return false
}else{
if(arg===int){
return((typeof obj)=="number"||obj.constructor===Number)&&(obj.valueOf()%1===0)
}
if(arg===float){
return((typeof obj=="number")&&(obj.valueOf()%1!==0))||
(obj.__class__===float)}
if(arg===str){return(typeof obj=="string")}
if(arg===list){return(obj.constructor===Array)}
if(obj.__class__!==undefined){return obj.__class__===arg}
return obj.constructor===arg
}
}
function iter(obj){
if('__item__' in obj){
obj.__counter__=0 
return obj
}
$raise('TypeError',"'"+str(obj.__class__)+"' object is not iterable")
}
function $iterator(obj,info){
this.__getattr__=function(attr){
var res=this[attr]
if(res===undefined){$raise('AttributeError',
"'"+info+"' object has no attribute '"+attr+"'")}
else{return res}
}
this.__len__=function(){return obj.__len__()}
this.__item__=function(i){return obj.__item__(i)}
this.__class__=new $class(this,info)
this.toString=function(){return info+'('+obj.toString()+')'}
}
function len(obj){
try{return obj.__len__()}
catch(err){$raise('TypeError',"object of type "+obj.__class__+" has no len()")}
}
function map(){
var func=arguments[0],res=[],rank=0
while(true){
var args=[],flag=true
for(var i=1;i<arguments.length;i++){
var x=arguments[i].__item__(rank)
if(x===undefined){flag=false;break}
args.push(x)
}
if(!flag){break}
res.push(func.apply(null,args))
rank++
}
return res
}
function $extreme(args,op){
if(op==='__gt__'){var $op_name="max"}
else{var $op_name="min"}
if(args.length==0){$raise('TypeError',$op_name+" expected 1 argument, got 0")}
var last_arg=args[args.length-1]
var last_i=args.length-1
var has_key=false
if(isinstance(last_arg,$Kw)){
if(last_arg.name==='key'){
var func=last_arg.value
has_key=true
last_i--
}else{$raise('TypeError',$op_name+"() got an unexpected keyword argument")}
}else{var func=function(x){return x}}
if((has_key && args.length==2)||(!has_key && args.length==1)){
var arg=args[0]
var $iter=iter(arg)
var res=null
while(true){
try{
var x=next($iter)
if(res===null || bool(func(x)[op](func(res)))){res=x}
}catch(err){
if(err.name=="StopIteration"){return res}
throw err
}
}
}else{
var res=null
for(var i=0;i<=last_i;i++){
var x=args[i]
if(res===null || bool(func(x)[op](func(res)))){res=x}
}
return res
}
}
function max(){
var args=[]
for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
return $extreme(args,'__gt__')
}
function min(){
var args=[]
for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
return $extreme(args,'__lt__')
}
function next(obj){
if('__item__' in obj){
if(obj.__counter__===undefined){obj.__counter__=0}
var res=obj.__item__(obj.__counter__)
if(res!==undefined){obj.__counter__++;return res}
$raise('StopIteration')
}
$raise('TypeError',"'"+str(obj.__class__)+"' object is not iterable")
}
function $not(obj){return !bool(obj)}
function $ObjectClass(){
this.__class__="<class 'object'>"
}
$ObjectClass.prototype.__getattr__=function(attr){
if(attr in this){return this[attr]}
else{$raise('AttributeError',"object has no attribute '"+attr+"'")}
}
$ObjectClass.prototype.__delattr__=function(attr){delete this[attr]}
$ObjectClass.prototype.__setattr__=function(attr,value){this[attr]=value}
function object(){
return new $ObjectClass()
}
object.__class__=$type
object.__name__='object'
object.__str__="<class 'object'>"
function $print(){
var $ns=$MakeArgs('print',arguments,[],{},'args','kw')
var args=$ns['args']
var kw=$ns['kw']
var end='\n'
var res=''
if(kw.__contains__('end')){end=kw.__getitem__('end')}
for(var i=0;i<args.length;i++){
res +=str(args[i])
if(i<args.length-1){res +=' '}
}
res +=end
document.$stdout.write(res)
}
log=$print 
function $prompt(text,fill){return prompt(text,fill || '')}
function range(){
var $ns=$MakeArgs('range',arguments,[],{},'args',null)
var args=$ns['args']
if(args.length>3){$raise('TypeError',
"range expected at most 3 arguments, got "+args.length)
}
var start=0
var stop=0
var step=1
if(args.length==1){stop=args[0]}
else if(args.length>=2){
start=args[0]
stop=args[1]
}
if(args.length>=3){step=args[2]}
if(step==0){$raise('ValueError',"range() arg 3 must not be zero")}
var res=[]
if(step>0){
for(var i=start;i<stop;i+=step){res.push(i)}
}else if(step<0){
for(var i=start;i>stop;i+=step){res.push(i)}
}
return res
}
function repr(obj){return obj.toString()}
function reversed(seq){
if(isinstance(seq,list)){seq.reverse();return seq}
else if(isinstance(seq,str)){
var res=''
for(var i=seq.length-1;i>=0;i--){res+=seq.charAt(i)}
return res
}else{$raise('TypeError',
"argument to reversed() must be a sequence")}
}
function round(arg,n){
if(!isinstance(arg,[int,float])){
$raise('TypeError',"type "+str(arg.__class__)+" doesn't define __round__ method")
}
if(n===undefined){n=0}
if(!isinstance(n,int)){$raise('TypeError',
"'"+n.__class__+"' object cannot be interpreted as an integer")}
var mult=Math.pow(10,n)
return Number(Math.round(arg*mult)).__truediv__(mult)
}
function set(){
var i=0
if(arguments.length==0){return new $SetClass()}
else if(arguments.length==1){
var arg=arguments[0]
if(isinstance(arg,set)){return arg}
var obj=new $SetClass()
try{
for(var i=0;i<arg.__len__();i++){
obj.items.push(arg.__getitem__(i))
}
return obj
}catch(err){
$raise('TypeError',"'"+arg.__class__.__name__+"' object is not iterable")
}
}else{
$raise('TypeError',"set expected at most 1 argument, got "+arguments.length)
}
}
set.__class__=$type
set.__name__='set'
set.toString=function(){return "<class 'set'>"}
function $SetClass(){
var x=null
var i=null
this.iter=null
this.__class__=set
this.items=[]
}
$SetClass.prototype.toString=function(){
var res="{"
for(var i=0;i<this.items.length;i++){
var x=this.items[i]
if(isinstance(x,str)){res +="'"+x+"'"}
else{res +=x.toString()}
if(i<this.items.length-1){res +=','}
}
return res+'}'
}
$SetClass.prototype.__add__=function(other){
return set(this.items.concat(other.items))
}
$SetClass.prototype.__class__=set
$SetClass.prototype.__contains__=function(item){
for(var i=0;i<this.items.length;i++){
try{if(this.items[i].__eq__(item)){return True}
}catch(err){void(0)}
}
return False
}
$SetClass.prototype.__eq__=function(other){
if(isinstance(other,set)){
if(other.items.length==this.items.length){
for(var i=0;i<this.items.length;i++){
if(this.__contains__(other.items[i])===False){
return False
}
}
return True
}
}
return False
}
$SetClass.prototype.__in__=function(item){return item.__contains__(this)}
$SetClass.prototype.__len__=function(){return int(this.items.length)}
$SetClass.prototype.__ne__=function(other){return !(this.__eq__(other))}
$SetClass.prototype.__item__=function(i){return this.items[i]}
$SetClass.prototype.__not_in__=function(item){return !(item.__contains__(this))}
$SetClass.prototype.add=function(item){
var i=0
for(i=0;i<this.items.length;i++){
try{if(item.__eq__(this.items[i])){return}}
catch(err){void(0)}
}
this.items.push(item)
}
function setattr(obj,attr,value){
if(!isinstance(attr,str)){$raise('TypeError',"setattr(): attribute name must be string")}
obj[attr]=value
}
function $SliceClass(start,stop,step){
this.__class__=slice
this.start=start
this.stop=stop
this.step=step
}
function slice(){
var $ns=$MakeArgs('slice',arguments,[],{},'args',null)
var args=$ns['args']
if(args.length>3){$raise('TypeError',
"slice expected at most 3 arguments, got "+args.length)
}
var start=0
var stop=0
var step=1
if(args.length==1){stop=args[0]}
else if(args.length>=2){
start=args[0]
stop=args[1]
}
if(args.length>=3){step=args[2]}
if(step==0){$raise('ValueError',"slice step must not be zero")}
return new $SliceClass(start,stop,step)
}
function sum(iterable,start){
if(start===undefined){start=0}
var res=0
for(var i=start;i<iterable.__len__();i++){
res=res.__add__(iterable.__item__(i))
}
return res
}
function $tuple(arg){return arg}
function tuple(){
var args=new Array(),i=0
for(i=0;i<arguments.length;i++){args.push(arguments[i])}
var obj=list(args)
obj.__class__=tuple
obj.toString=function(){
var res=args.toString()
return '('+res.substr(1,res.length-2)+')'
}
return obj
}
tuple.__class__=$type
tuple.__name__='tuple'
tuple.__str__=function(){return "<class 'tuple'>"}
tuple.toString=tuple.__str__
function zip(){
var $ns=$MakeArgs('zip',arguments,[],{},'args','kw')
var args=$ns['args']
var kw=$ns['kw']
var rank=0,res=[]
while(true){
var line=[],flag=true
for(var i=0;i<args.length;i++){
var x=args[i].__item__(rank)
if(x===undefined){flag=false;break}
line.push(x)
}
if(!flag){return res}
res.push(line)
rank++
}
}
True=true
False=false
Boolean.prototype.__class__=bool
Boolean.prototype.__eq__=function(other){
if(this.valueOf()){return !!other}else{return !other}
}
Boolean.prototype.toString=function(){
if(this.valueOf()){return "True"}else{return "False"}
}
function $NoneClass(){
this.__class__=new $class(this,"NoneType")
this.value=null
this.__bool__=function(){return False}
this.__eq__=function(other){return other===None}
this.__str__=function(){return 'None'}
}
None=new $NoneClass()
function $list(){
var args=new Array()
for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
return new $ListClass(args)
}
function list(){
if(arguments.length===0){return[]}
else if(arguments.length>1){
$raise('TypeError',"list() takes at most 1 argument ("+arguments.length+" given)")
}
var res=[]
res.__init__(arguments[0])
return res
}
list.__class__=$type
list.__name__='list'
list.__str__=function(){return "<class 'list'>"}
list.toString=list.__str__
function $ListClass(items){
var x=null,i=null
this.iter=null
this.__class__=list
this.items=items 
}
Array.prototype.__add__=function(other){
return this.valueOf().concat(other.valueOf())
}
Array.prototype.__class__=list
Array.prototype.__contains__=function(item){
for(var i=0;i<this.length;i++){
try{if(this[i].__eq__(item)){return true}
}catch(err){void(0)}
}
return false
}
Array.prototype.__delitem__=function(arg){
if(isinstance(arg,int)){
var pos=arg
if(arg<0){pos=this.length+pos}
if(pos>=0 && pos<this.length){
this.splice(pos,1)
return
}
else{$raise('IndexError','list index out of range')}
}else if(isinstance(arg,slice)){
var start=arg.start || 0
var stop=arg.stop || this.length
var step=arg.step || 1
if(start<0){start=this.length+start}
if(stop<0){stop=this.length+stop}
var res=[],i=null
if(step>0){
if(stop>start){
for(i=start;i<stop;i+=step){
if(this[i]!==undefined){res.push(i)}
}
}
}else{
if(stop<start){
for(i=start;i>stop;i+=step.value){
if(this[i]!==undefined){res.push(i)}
}
res.reverse()
}
}
for(var i=res.length-1;i>=0;i--){
this.splice(res[i],1)
}
return
}else{
$raise('TypeError','list indices must be integer, not '+str(arg.__class__))
}
}
Array.prototype.__eq__=function(other){
if(isinstance(other,list)){
if(other.length==this.length){
for(var i=0;i<this.length;i++){
if(!this[i].__eq__(other[i])){return False}
}
return True
}
}
return False
}
Array.prototype.__getattr__=function(attr){
var obj=this
switch(attr){
case 'append':
return function(other){
if(isinstance(other,list)){obj.push(list(other))}
else{obj.push(other)}
}
case 'count':
return $list_count(obj)
case 'extend':
return $list_extend(obj)
case 'index':
return $list_index(obj)
case 'pop':
return $list_pop(obj)
case 'remove':
return $list_remove(obj)
case 'reverse':
return function(){$list_reverse(obj)}
case 'sort':
return function(arg){$list_sort(obj,arg)}
default:
return this[attr]
}
}
Array.prototype.__getitem__=function(arg){
if(isinstance(arg,int)){
var items=this.valueOf()
var pos=arg
if(arg<0){pos=items.length+pos}
if(pos>=0 && pos<items.length){return items[pos]}
else{$raise('IndexError','list index out of range')}
}else if(isinstance(arg,slice)){
var step=arg.step===None ? 1 : arg.step
if(step>0){
var start=arg.start===None ? 0 : arg.start
var stop=arg.stop===None ? this.__len__(): arg.stop
}else{
var start=arg.start===None ? this.__len__()-1 : arg.start
var stop=arg.stop===None ? 0 : arg.stop
}
if(start<0){start=int(this.length+start)}
if(stop<0){stop=this.length+stop}
var res=[],i=null,items=this.valueOf()
if(step>0){
if(stop<=start){return res}
else{
for(i=start;i<stop;i+=step){
if(items[i]!==undefined){res.push(items[i])}
}
return res
}
}else{
if(stop>=start){return res}
else{
for(i=start;i>=stop;i+=step){
if(items[i]!==undefined){res.push(items[i])}
}
return res
}
}
}else if(isinstance(arg,bool)){
return this.__getitem__(int(arg))
}else{
$raise('TypeError','list indices must be integer, not '+str(arg.__class__))
}
}
Array.prototype.__init__=function(){
this.splice(0,this.length)
if(arguments.length===0){return}
var arg=arguments[0]
for(var i=0;i<arg.__len__();i++){
this.push(arg.__item__(i))
}
}
Array.prototype.__item__=function(i){return this[i]}
Array.prototype.__in__=function(item){return item.__contains__(this)}
Array.prototype.__len__=function(){return this.length}
Array.prototype.__ne__=function(other){return !this.__eq__(other)}
Array.prototype.__next__=function(){
if(this.iter===null){this.iter=0}
if(this.iter<this.valueOf().length){
this.iter++
return this.valueOf()[this.iter-1]
}else{
this.iter=null
$raise('StopIteration')
}
}
Array.prototype.__not_in__=function(item){return !item.__contains__(this)}
Array.prototype.__setitem__=function(arg,value){
if(isinstance(arg,int)){
var pos=arg
if(arg<0){pos=this.length+pos}
if(pos>=0 && pos<this.length){this[pos]=value}
else{$raise('IndexError','list index out of range')}
}else if(isinstance(arg,slice)){
var start=arg.start===None ? 0 : arg.start
var stop=arg.stop===None ? this.__len__(): arg.stop
var step=arg.step===None ? 1 : arg.step
if(start<0){start=this.length+start}
if(stop<0){stop=this.length+stop}
this.splice(start,stop-start)
if(hasattr(value,'__item__')){
var $temp=list(value)
for(var i=$temp.length-1;i>=0;i--){
this.splice(start,0,$temp[i])
}
}else{
$raise('TypeError',"can only assign an iterable")
}
}else{
$raise('TypeError','list indices must be integer, not '+str(arg.__class__))
}
}
Array.prototype.toString=function(){
var res="[",i=null,items=this.valueOf()
for(i=0;i<items.length;i++){
var x=items[i]
if(isinstance(x,str)){res +="'"+x+"'"}
else{res +=x.toString()}
if(i<items.length-1){res +=','}
}
return res+']'
}
function $list_count(obj){
return function(elt){
var res=0
for(var i=0;i<obj.length;i++){
if(obj[i].__eq__(elt)){res++}
}
return res
}
}
function $list_extend(obj){
return function(other){
if(arguments.length!=1){$raise('TypeError',
"extend() takes exactly one argument ("+arguments.length+" given)")}
try{
for(var i=0;i<other.__len__();i++){
obj.push(other.__item__(i))
}
}catch(err){
$raise('TypeError',"object is not iterable")
}
}
}
function $list_index(obj){
return function(elt){
for(var i=0;i<obj.length;i++){
if(obj[i].__eq__(elt)){return i}
}
$raise('ValueError',str(elt)+" is not in list")
}
}
function $list_remove(obj){
return function(elt){
for(var i=0;i<obj.length;i++){
if(obj[i].__eq__(elt)){
obj.splice(i,1)
return
}
}
$raise('ValueError',str(elt)+" is not in list")
}
}
function $list_pop(obj){
return function(elt){
if(arguments.length==0){return obj.pop()}
else if(arguments.length==1){
var pos=arguments[0]
if(isinstance(pos,int)){
var res=obj[pos]
obj.splice(pos,1)
return res
}else{
$raise('TypeError',pos.__class__+" object cannot be interpreted as an integer")
}
}else{
$raise('TypeError',"pop() takes at most 1 argument ("+arguments.length+' given)')
}
}
}
function $list_reverse(obj){
for(var i=0;i<parseInt(obj.length/2);i++){
var buf=obj[i]
obj[i]=obj[obj.length-i-1]
obj[obj.length-i-1]=buf
}
}
function $partition(arg,array,begin,end,pivot)
{
var piv=array[pivot]
array.swap(pivot, end-1)
var store=begin
for(var ix=begin;ix<end-1;++ix){
if(arg(array[ix]).__le__(arg(piv))){
array.swap(store, ix)
++store
}
}
array.swap(end-1, store)
return store
}
Array.prototype.swap=function(a, b)
{
var tmp=this[a]
this[a]=this[b]
this[b]=tmp
}
function $qsort(arg,array, begin, end)
{
if(end-1>begin){
var pivot=begin+Math.floor(Math.random()*(end-begin))
pivot=$partition(arg,array, begin, end, pivot)
$qsort(arg,array, begin, pivot)
$qsort(arg,array, pivot+1, end)
}
}
function $list_sort(obj,arg){
if(!arg){arg=function(x){return x}}
else if(typeof arg==="string"){arg=function(x){return x.__getitem__(arg)}}
if(obj.length==0){return}
$qsort(arg,obj,0,obj.length)
}
function str(arg){
if(arg===undefined){return '<undefined>'}
else if(arg.__str__!==undefined){return arg.__str__()}
else{return arg.toString()}
}
str.__class__=$type
str.__name__='str'
str.__str__=function(){return "<class 'str'>"}
str.toString=str.__str__
String.prototype.__add__=function(other){
if(!(typeof other==="string")){
try{return other.__radd__(this)}
catch(err){$raise('TypeError',
"Can't convert "+other.__class__+" to str implicitely")}
}else{
return this+other
}
}
String.prototype.__class__=str
String.prototype.__contains__=function(item){
if(!(typeof item==="string")){$raise('TypeError',
"'in <string>' requires string as left operand, not "+item.__class__)}
var nbcar=item.length
for(var i=0;i<this.length;i++){
if(this.substr(i,nbcar)==item){return True}
}
return False
}
String.prototype.__eq__=function(other){return other===this.valueOf()}
String.prototype.__getattr__=function(attr){
obj=this
switch(attr){
case 'capitalize':
return $string_capitalize(obj)
case 'center': 
return $string_center(obj)
case 'count': 
return $string_count(obj)
case 'endswith': 
return $string_endswith(obj)
case 'find': 
return $string_find(obj)
case 'index': 
return $string_index(obj)
case 'join':
return $string_join(obj)
case 'lower':
return $string_lower(obj)
case 'lstrip': 
return $string_lstrip(obj)
case 'replace': 
return $string_replace(obj)
case 'rfind': 
return $string_rfind(obj)
case 'rindex': 
return $string_rindex(obj)
case 'rstrip': 
return $string_rstrip(obj)
case 'split':
case 'splitfields':
return $string_split(obj)
case 'splitlines':
return $string_split(obj,'\n')
case 'startswith': 
return $string_startswith(obj)
case 'strip':
return $string_strip(obj)
case 'upper':
return $string_upper(obj)
default:
return this[attr]
}
}
String.prototype.__getitem__=function(arg){
if(isinstance(arg,int)){
var pos=arg
if(arg<0){pos=this.length+pos}
if(pos>=0 && pos<this.length){return this.charAt(pos)}
else{$raise('IndexError','string index out of range')}
}else if(isinstance(arg,slice)){
var step=arg.step===None ? 1 : arg.step
if(step>0){
var start=arg.start===None ? 0 : arg.start
var stop=arg.stop===None ? this.__len__(): arg.stop
}else{
var start=arg.start===None ? this.__len__()-1 : arg.start
var stop=arg.stop===None ? 0 : arg.stop
}
if(start<0){start=this.length+start}
if(stop<0){stop=this.length+stop}
var res='',i=null
if(step>0){
if(stop<=start){return ''}
else{
for(i=start;i<stop;i+=step){
res +=this.charAt(i)
}
}
}else{
if(stop>=start){return ''}
else{
for(i=start;i>=stop;i+=step){
res +=this.charAt(i)
}
}
}
return res
}else if(isinstance(arg,bool)){
return this.__getitem__(int(arg))
}
}
String.prototype.__in__=function(item){return item.__contains__(this.valueOf())}
String.prototype.__item__=function(i){return this.charAt(i)}
String.prototype.__len__=function(){return this.length}
String.prototype.__mod__=function(args){
var flags=$List2Dict('#','0','-',' ','+')
var ph=[]
function format(s){
var conv_flags='([#\\+\\- 0])*'
var conv_types='[diouxXeEfFgGcrsa%]'
var re=new RegExp('\\%(\\(.+\\))*'+conv_flags+'(\\*|\\d*)(\\.\\*|\\.\\d*)*(h|l|L)*('+conv_types+'){1}')
var res=re.exec(s)
this.is_format=true
if(!res){this.is_format=false;return}
this.src=res[0]
if(res[1]){this.mapping_key=str(res[1].substr(1,res[1].length-2))}
else{this.mapping_key=null}
this.flag=res[2]
this.min_width=res[3]
this.precision=res[4]
this.length_modifier=res[5]
this.type=res[6]
this.toString=function(){
var res='type '+this.type+' key '+this.mapping_key+' min width '+this.min_width
res +=' precision '+this.precision
return res
}
this.format=function(src){
if(this.mapping_key!==null){
if(!isinstance(src,dict)){$raise('TypeError',"format requires a mapping")}
src=src.__getitem__(this.mapping_key)
}
if(this.type=="s"){return str(src)}
else if(this.type=="i" || this.type=="d"){
if(!isinstance(src,[int,float])){$raise('TypeError',
"%"+this.type+" format : a number is required, not "+str(src.__class__))}
return str(int(src))
}else if(this.type=="f" || this.type=="F"){
if(!isinstance(src,[int,float])){$raise('TypeError',
"%"+this.type+" format : a number is required, not "+str(src.__class__))}
return str(float(src))
}
}
}
var elts=[]
var pos=0, start=0, nb_repl=0
var val=this.valueOf()
while(pos<val.length){
if(val.charAt(pos)=='%'){
var f=new format(val.substr(pos))
if(f.is_format && f.type!=="%"){
elts.push(val.substring(start,pos))
elts.push(f)
start=pos+f.src.length
pos=start
nb_repl++
}else{pos++}
}else{pos++}
}
elts.push(val.substr(start))
if(!isinstance(args,tuple)){
if(nb_repl>1){$raise('TypeError','not enough arguments for format string')}
else{elts[1]=elts[1].format(args)}
}else{
if(nb_repl==args.length){
for(var i=0;i<args.length;i++){
var fmt=elts[1+2*i]
elts[1+2*i]=fmt.format(args[i])
}
}else if(nb_repl<args.length){$raise('TypeError',
"not all arguments converted during string formatting")
}else{$raise('TypeError','not enough arguments for format string')}
}
var res=''
for(var i=0;i<elts.length;i++){res+=elts[i]}
res=res.replace(/%%/g,'%')
return res
}
String.prototype.__mul__=function(other){
if(!isinstance(other,int)){$raise('TypeError',
"Can't multiply sequence by non-int of type '"+str(other.__class__)+"'")}
$res=''
for(var i=0;i<other;i++){$res+=this.valueOf()}
return $res
}
String.prototype.__ne__=function(other){return other!==this.valueOf()}
String.prototype.__next__=function(){
if(this.iter==null){this.iter==0}
if(this.iter<this.value.length){
this.iter++
return str(this.value.charAt(this.iter-1))
}else{
this.iter=null
$raise('StopIteration')
}
}
String.prototype.__not_in__=function(item){return !item.__contains__(this.valueOf())}
String.prototype.__setattr__=function(attr,value){setattr(this,attr,value)}
String.prototype.__setitem__=function(attr,value){
$raise('TypeError',"'str' object does not support item assignment")
}
String.prototype.__str__=function(){
return this.toString()
}
var $comp_func=function(other){
if(typeof other !=="string"){$raise('TypeError',
"unorderable types: 'str' > "+other.__class__+"()")}
return this > other
}
$comp_func +='' 
var $comps={'>':'gt','>=':'ge','<':'lt','<=':'le'}
for($op in $comps){
eval("String.prototype.__"+$comps[$op]+'__ = '+$comp_func.replace(/>/gm,$op))
}
var $notimplemented=function(other){
$raise('TypeError',
"unsupported operand types for OPERATOR: '"+str(this.__class__)+"' and '"+str(other.__class__)+"'")
}
$notimplemented +='' 
for($op in $operators){
var $opfunc='__'+$operators[$op]+'__'
if(!($opfunc in String.prototype)){
eval('String.prototype.'+$opfunc+"="+$notimplemented.replace(/OPERATOR/gm,$op))
}
}
function $string_capitalize(obj){
if(obj.length==0){return ''}
return obj.charAt(0).toUpperCase()+obj.substr(1).toLowerCase()
}
function $string_center(obj){
return function(width,fillchar){
if(fillchar===undefined){fillchar=' '}else{fillchar=fillchar}
if(width<=obj.length){return obj}
else{
var pad=parseInt((width-obj.length)/2)
res=''
for(var i=0;i<pad;i++){res+=fillchar}
res +=obj
for(var i=0;i<pad;i++){res+=fillchar}
if(res.length<width){res +=fillchar}
return res
}
}
}
function $string_count(obj){
return function(elt){
if(!(typeof elt==="string")){$raise('TypeError',
"Can't convert '"+str(elt.__class__)+"' object to str implicitly")}
var res=0
for(var i=0;i<obj.length-elt.length+1;i++){
if(obj.substr(i,elt.length)===elt){res++}
}
return res
}
}
function $string_endswith(obj){
return function(){
var $ns=$MakeArgs("str.endswith",arguments,['suffix'],
{'start':null,'end':null},null,null)
var suffixes=$ns['suffix']
if(!isinstance(suffixes,tuple)){suffixes=[suffixes]}
var start=$ns['start']|| 0
var end=$ns['end']|| obj.length-1
var s=obj.substr(start,end+1)
for(var i=0;i<suffixes.length;i++){
suffix=suffixes[i]
if(suffix.length<=s.length &&
s.substr(s.length-suffix.length)==suffix){return True}
}
return False
}
}
function $string_find(obj){
return function(){
var $ns=$MakeArgs("str.find",arguments,['sub'],
{'start':0,'end':obj.length},null,null)
var sub=$ns['sub'],start=$ns['start'],end=$ns['end']
if(!isinstance(sub,str)){$raise('TypeError',
"Can't convert '"+str(sub.__class__)+"' object to str implicitly")}
if(!isinstance(start,int)||!isinstance(end,int)){$raise('TypeError',
"slice indices must be integers or None or have an __index__ method")}
var s=obj.substring(start,end)
var escaped=list('*.[]()')
var esc_sub=''
for(var i=0;i<sub.length;i++){
if(escaped.indexOf(sub.charAt(i))>-1){esc_sub +='\\'}
esc_sub +=sub.charAt(i)
}
var res=s.search(esc_sub)
if(res==-1){return -1}
else{return start+res}
}
}
function $string_index(obj){
return function(){
var args=[]
for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
var res=$string_find(obj).apply(obj,args)
if(res===-1){$raise('ValueError',"substring not found")}
else{return res}
}
}
function $string_join(obj){
return function(iterable){
if(!'__item__' in iterable){$raise('TypeError',
"'"+str(iterable.__class__)+"' object is not iterable")}
var res='',count=0
for(var i=0;i<iterable.length;i++){
var obj2=iterable.__getitem__(i)
if(!isinstance(obj2,str)){$raise('TypeError',
"sequence item "+count+": expected str instance, "+obj2.__class__+"found")}
res +=obj2+obj
count++
}
if(count==0){return ''}
res=res.substr(0,res.length-obj.length)
return res
}
}
function $string_lower(obj){
return function(){return obj.toLowerCase()}
}
function $string_lstrip(obj){
return function(x){
var pattern=null
if(x==undefined){pattern="\\s*"}
else{pattern="["+x+"]*"}
var sp=new RegExp("^"+pattern)
return obj.replace(sp,"")
}
}
function $re_escape(str)
{
var specials="[.*+?|()$^"
for(var i=0;i<specials.length;i++){
var re=new RegExp('\\'+specials.charAt(i),'g')
str=str.replace(re, "\\"+specials.charAt(i))
}
return str
}
function $string_replace(obj){
return function(old,_new,count){
if(count!==undefined){
if(!isinstance(count,[int,float])){$raise('TypeError',
"'"+str(count.__class__)+"' object cannot be interpreted as an integer")}
var re=new RegExp($re_escape(old),'g')
var res=obj.valueOf()
while(count>0){
if(obj.search(re)==-1){return res}
res=res.replace(re,_new)
count--
}
return res
}else{
var re=new RegExp($re_escape(old),"g")
return obj.replace(re,_new)
}
}
}
function $string_rfind(obj){
return function(){
var $ns=$MakeArgs("str.find",arguments,['sub'],
{'start':0,'end':obj.length},null,null)
var sub=$ns['sub'],start=$ns['start'],end=$ns['end']
if(!isinstance(sub,str)){$raise('TypeError',
"Can't convert '"+str(sub.__class__)+"' object to str implicitly")}
if(!isinstance(start,int)||!isinstance(end,int)){$raise('TypeError',
"slice indices must be integers or None or have an __index__ method")}
var s=obj.substring(start,end)
var reversed=''
for(var i=s.length-1;i>=0;i--){reversed +=s.charAt(i)}
var res=reversed.search(sub)
if(res==-1){return -1}
else{return start+s.length-1-res}
}
}
function $string_rindex(obj){
return function(){
var args=[]
for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
var res=$string_rfind(obj).apply(obj,args)
if(res==-1){$raise('ValueError',"substring not found")}
else{return res}
}
}
function $string_rstrip(x){
if(x==undefined){pattern="\\s*"}
else{pattern="["+x.value+"]*"}
sp=new RegExp(pattern+'$')
return str(this.value.replace(sp,""))
}
function $string_split(obj){
return function(){
var $ns=$MakeArgs("str.split",arguments,[],{},'args','kw')
var sep=null,maxsplit=-1
if($ns['args'].length>=1){sep=$ns['args'][0]}
if($ns['args'].length==2){maxsplit=$ns['args'][1]}
if(sep===null){var re=/\s/}
else{
var escaped=list('*.[]()|$^')
var esc_sep=''
for(var i=0;i<sep.length;i++){
if(escaped.indexOf(sep.charAt(i))>-1){esc_sep +='\\'}
esc_sep +=sep.charAt(i)
}
var re=new RegExp(esc_sep)
}
return obj.split(re,maxsplit)
}
}
function $string_startswith(obj){
return function(){
$ns=$MakeArgs("str.startswith",arguments,['prefix'],
{'start':null,'end':null},null,null)
var prefixes=$ns['prefix']
if(!isinstance(prefixes,tuple)){prefixes=[prefixes]}
var start=$ns['start']|| 0
var end=$ns['end']|| obj.length-1
var s=obj.substr(start,end+1)
for(var i=0;i<prefixes.length;i++){
prefix=prefixes[i]
if(prefix.length<=s.length &&
s.substr(0,prefix.length)==prefix){return True}
}
return False
}
}
function $string_strip(obj){
return function(x){
if(x==undefined){x="\\s"}
pattern="["+x+"]"
sp=new RegExp("^"+pattern+"+|"+pattern+"+$","g")
return obj.replace(sp,"")
}
}
function $string_upper(obj){return function(){return obj.toUpperCase()}}
function $importer(){
if(window.XMLHttpRequest){
var $xmlhttp=new XMLHttpRequest()
}else{
var $xmlhttp=new ActiveXObject("Microsoft.XMLHTTP")
}
var fake_qs='?foo='+Math.random().toString(36).substr(2,8)
var timer=setTimeout(function(){
$xmlhttp.abort()
$raise('NotFoundError',"No module named '"+module+"'")}, 5000)
return[$xmlhttp,fake_qs,timer]
}
function $import_js(module,alias){
var imp=$importer()
var $xmlhttp=imp[0],fake_qs=imp[1],timer=imp[2],res=null
$xmlhttp.onreadystatechange=function(){
if($xmlhttp.readyState==4){
window.clearTimeout(timer)
if($xmlhttp.status==200 || $xmlhttp.status==0){res=$xmlhttp.responseText}
else{
res=Error()
res.name='NotFoundError'
res.message="No module named '"+module+"'"
}
}
}
$xmlhttp.open('GET',document.$brython_path+'libs/'+module+'.js'+fake_qs,false)
if('overrideMimeType' in $xmlhttp){$xmlhttp.overrideMimeType("text/plain")}
$xmlhttp.send()
if(res.constructor===Error){throw res}
try{
eval(res)
if(eval('$module')===undefined){
$raise('ImportError',"name '$module' is not defined in module")
}
if(alias===undefined){alias=module}
eval(alias+'=$module')
eval(alias+'.__class__ = $type')
eval(alias+'.__str__ = function(){return "<module \''+module+"'>\"}")
}catch(err){$raise('ImportError',err.message)}
}
function $import_py(module){
var imp=$importer()
var $xmlhttp=imp[0],fake_qs=imp[1],timer=imp[2],res=null
$xmlhttp.onreadystatechange=function(){
if($xmlhttp.readyState==4){
window.clearTimeout(timer)
if($xmlhttp.status==200 || $xmlhttp.status==0){res=$xmlhttp.responseText}
else{
res=Error('ImportError',"No module named '"+module+"'")
}
}
}
$xmlhttp.open('GET',module+'.py'+fake_qs,false)
$xmlhttp.send()
if(res.constructor===Error){
res=null
$xmlhttp.open('GET',module+'/__init__.py'+fake_qs,false)
$xmlhttp.send()
}
if(res.constructor===Error){res.name='ImportError';throw res}
var root=$py2js(res,module)
var body=root.children
root.children=[]
var mod_node=new $Node('expression')
new $NodeJSCtx(mod_node,module+'= (function()')
root.insert(0,mod_node)
mod_node.children=body
var names=[]
for(var i=1;i<mod_node.children.length;i++){
var node=mod_node.children[i]
var ctx=node.context.tree[0]
if(ctx.type==='def'||ctx.type==='class'){
if(names.indexOf(ctx.name)===-1){names.push(ctx.name)}
}else if(ctx.type==='assign'){
var left=ctx.tree[0]
if(left.type==='expr'&&left.tree[0].type==='id'&&left.tree[0].tree.length===0){
var id_name=left.tree[0].value
if(names.indexOf(id_name)===-1){names.push(id_name)}
}
}
}
var ret_code='return {'
for(var i=0;i<names.length;i++){
ret_code +=names[i]+':'+names[i]+','
}
ret_code +='__getattr__:function(attr){return this[attr]},'
ret_code +='__setattr__:function(attr,value){this[attr]=value}'
ret_code +='}'
var ret_node=new $Node('expression')
new $NodeJSCtx(ret_node,ret_code)
mod_node.add(ret_node)
var ex_node=new $Node('expression')
new $NodeJSCtx(ex_node,')()')
root.add(ex_node)
try{
var js=root.to_js()
eval(js)
eval(module+'.__class__ = $type')
eval(module+'.__str__ = function(){return "<module \''+module+"'>\"}")
}catch(err){
$raise(err.name,err.message)
}
}
$import_funcs=[$import_js,$import_py]
function $import(module){
for(var i=0;i<$import_funcs.length;i++){
try{$import_funcs[i](module);return}
catch(err){
if(err.name==="NotFoundError"){
if(i==$import_funcs.length-1){
$raise('ImportError',"no module named '"+module+"'")
}else{
continue
}
}else{throw(err)}
}
}
}
function $import_from(module,names){
}
var $operators={
"//=":"ifloordiv",">>=":"irshift","<<=":"ilshift",
"**=":"ipow","**":"pow","//":"floordiv","<<":"lshift",">>":"rshift",
"+=":"iadd","-=":"isub","*=":"imul","/=":"itruediv",
"%=":"imod","&=":"iand","|=":"ior",
"^=":"ipow","+":"add","-":"sub","*":"mul",
"/":"truediv","%":"mod","&":"and","|":"or",
"^":"pow","<":"lt",">":"gt",
"<=":"le",">=":"ge","==":"eq","!=":"ne",
"or":"or","and":"and", "in":"in", 
"not_in":"not_in","is_not":"is_not" 
}
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
var $augmented_assigns={
"//=":"ifloordiv",">>=":"irshift","<<=":"ilshift",
"**=":"ipow","+=":"iadd","-=":"isub","*=":"imul","/=":"itruediv",
"%=":"imod","^=":"ipow"
}
function $list_comp1(){
var $env=arguments[0]
for(var $arg in $env){
eval("var "+$arg+'=$env["'+$arg+'"]')
}
var $res='res'+Math.random().toString(36).substr(2,8)
var $py=$res+"=[]\n"
var indent=0
for(var i=2;i<arguments.length;i++){
for(var j=0;j<indent;j++){$py +=' '}
$py +=arguments[i]+':\n'
indent +=4
}
for(var j=0;j<indent;j++){$py +=' '}
$py +=$res+'.append('+arguments[1]+')'
var $js=$py2js($py).to_js()
eval($js)
return eval($res)
}
function $ternary(expr1,cond,expr2){
var res='var $res=expr1\n'
res +='if(!cond){$res=expr2}\n'
eval(res)
return $res
}
function $_SyntaxError(context,msg){
console.log('syntax error '+msg+' context '+context)
var ctx_node=context.parent
while(ctx_node.type!=='node'){ctx_node=ctx_node.parent}
var tree_node=ctx_node.node
var module=tree_node.module
$SyntaxError(module,msg,$pos)
var src=document.$py_src[tree_node.module]
var line_pos={1:0}
var lnum=1
for(var i=0;i<src.length;i++){
if(src.charAt(i)=='\n'){lnum+=1;line_pos[lnum]=i}
}
var lines=src.split('\n')
var line_num=tree_node.line_num
var line=lines[line_num-1]
console.log('error line '+line_num+' : '+msg+' '+($pos-line_pos[line_num]))
console.log(line)
var err=new Error()
err.name='SyntaxError'
err.py_error=true
err.message=msg
throw err
}
var $first_op_letter={}
for(op in $operators){$first_op_letter[op.charAt(0)]=0}
function $Node(type){
this.type=type
this.children=[]
this.add=function(child){
this.children.push(child)
child.parent=this
}
this.insert=function(pos,child){
this.children.splice(pos,0,child)
child.parent=this
}
this.toString=function(){return "<object 'Node'>"}
this.show=function(indent){
var res=''
if(this.type==='module'){
for(var i=0;i<this.children.length;i++){
res +=this.children[i].show(indent)
}
}else{
indent=indent || 0
for(var i=0;i<indent;i++){res+=' '}
res +=this.context
if(this.children.length>0){res +='{'}
res +='\n'
for(var i=0;i<this.children.length;i++){
res +='['+i+'] '+this.children[i].show(indent+4)
}
if(this.children.length>0){
for(var i=0;i<indent;i++){res+=' '}
res+='}\n'
}
}
return res
}
this.to_js=function(indent){
var res=''
if(this.type==='module'){
for(var i=0;i<this.children.length;i++){
res +=this.children[i].to_js(indent)
}
}else{
indent=indent || 0
var ctx_js=this.context.to_js(indent)
if(ctx_js){
for(var i=0;i<indent;i++){res+=' '}
res +=ctx_js
if(this.children.length>0){res +='{'}
res +='\n'
for(var i=0;i<this.children.length;i++){
res +=this.children[i].to_js(indent+4)
}
if(this.children.length>0){
for(var i=0;i<indent;i++){res+=' '}
res+='}\n'
}
}
}
return res
}
this.transform=function(rank){
var res=''
if(this.type==='module'){
var i=0
while(i<this.children.length){
var node=this.children[i]
this.children[i].transform(i)
i++
}
}else{
var elt=this.context.tree[0]
if(elt.transform !==undefined){
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
this.type='abstract_expr'
this.with_commas=with_commas
this.name=name
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return '(abstract_expr '+with_commas+') '+this.tree}
this.to_js=function(){
if(this.type==='list'){return '['+$to_js(this.tree)+']'}
else{return $to_js(this.tree)}
}
}
function $AssertCtx(context){
this.type='assert'
this.toString=function(){return '(assert) '+this.tree}
this.parent=context
this.tree=[]
context.tree.push(this)
this.transform=function(node,rank){
var new_ctx=new $ConditionCtx(node.context,'if')
var not_ctx=new $NotCtx(new_ctx)
not_ctx.tree=this.tree
node.context=new_ctx
var new_node=new $Node('expression')
new $NodeJSCtx(new_node,'$raise("AssertionError")')
node.add(new_node)
}
}
function $AssignCtx(context){
this.type='assign'
context.parent.tree.pop()
context.parent.tree.push(this)
this.parent=context.parent
this.tree=[context]
this.toString=function(){return '(assign) '+this.tree[0]+'='+this.tree[1]}
this.transform=function(node,rank){
var left=this.tree[0]
while(left.type==='assign'){
var new_node=new $Node('expression')
var node_ctx=new $NodeCtx(new_node)
node_ctx.tree=[left]
node.parent.insert(rank+1,new_node)
this.tree[0]=left.tree[1]
left=this.tree[0]
}
var left_items=null
if(left.type==='expr' && left.tree.length>1){
var left_items=left.tree
}else if(left.type==='expr' && left.tree[0].type==='list_or_tuple'){
var left_items=left.tree[0].tree
}else if(left.type==='target_list'){
var left_items=left.tree
}
if(left_items===null){return}
var right=this.tree[1]
var right_items=null
if(right.type==='list'||right.type==='tuple'||
(right.type==='expr' && right.tree.length>1)){
var right_items=right.tree
}
if(right_items!==null){
if(right_items.length>left_items.length){
throw Error('ValueError : too many values to unpack (expected '+left_items.length+')')
}else if(right_items.length<left_items.length){
throw Error('ValueError : need more than '+right_items.length+' to unpack')
}
var new_nodes=[]
var new_node=new $Node('expression')
new $NodeJSCtx(new_node,'var $temp'+$loop_num+'=[]')
new_nodes.push(new_node)
for(var i=0;i<right_items.length;i++){
var js='$temp'+$loop_num+'.push('+right_items[i].to_js()+')'
var new_node=new $Node('expression')
new $NodeJSCtx(new_node,js)
new_nodes.push(new_node)
}
for(var i=0;i<left_items.length;i++){
var new_node=new $Node('expression')
var context=new $NodeCtx(new_node)
left_items[i].parent=context
var assign=new $AssignCtx(left_items[i])
assign.tree[1]=new $JSCode('$temp'+$loop_num+'['+i+']')
new_nodes.push(new_node)
}
node.parent.children.splice(rank,1)
for(var i=new_nodes.length-1;i>=0;i--){
node.parent.insert(rank,new_nodes[i])
}
$loop_num++
}else{
var new_nodes=[]
for(var i=0;i<left_items.length;i++){
var new_node=new $Node('expression')
var context=new $NodeCtx(new_node)
left_items[i].parent=context
var assign=new $AssignCtx(left_items[i])
assign.tree[1]=new $JSCode(right.to_js()+'.__item__('+i+')')
new_nodes.push(new_node)
}
node.parent.children.splice(rank,1)
for(var i=new_nodes.length-1;i>=0;i--){
node.parent.insert(rank,new_nodes[i])
}
}
}
this.to_js=function(){
if(this.parent.type==='call'){
return '$Kw('+this.tree[0].to_js()+','+this.tree[1].to_js()+')'
}else{
var left=this.tree[0]
if(left.type==='expr'){left=left.tree[0]}
var right=this.tree[1]
if(left.type==='id'&&left.tree.length>0){
var last=left.tree[left.tree.length-1]
if(last.type==='attribute'){
left.tree.pop()
var res=left.to_js()+'.__setattr__("'
left.tree.push(last)
return res+last.name+'",'+right.to_js()+')'
}else if(last.type==='sub'){
left.tree.pop()
var res=left.to_js()
left.tree.push(last)
last.func='setitem' 
var last_str=last.to_js()
last.func='getitem' 
last_str=last_str.substr(0,last_str.length-1)
res +=last_str+','+right.to_js()+')'
return res
}
}
var scope=$get_scope(this)
if(scope===null){
return left.to_js()+'='+right.to_js()
}else if(scope.ntype==='def'){
if(scope.globals && scope.globals.indexOf(left.value)>-1){
return left.to_js()+'='+right.to_js()
}else{
return 'var '+left.to_js()+'='+right.to_js()
}
}else if(scope.ntype==='class'){
return 'this.'+left.to_js()+'='+right.to_js()
}
}
}
}
function $AttrCtx(context){
this.type='attribute'
this.parent=context
this.tree=[]
this.func='getattr' 
context.tree.push(this)
this.toString=function(){return '(attr) '+this.name}
this.to_js=function(){
var name=this.name
if(name.substr(0,2)==='$$'){name=name.substr(2)}
if(name.substr(0,2)!=='__'){name='__getattr__("'+name+'")'}
return '.'+name
}
}
function $CallArgCtx(context){
this.type='call_arg'
this.toString=function(){return 'call_arg '+this.tree}
this.parent=context
this.tree=[]
context.tree.push(this)
this.expect='id'
this.to_js=function(){return $to_js(this.tree)}
}
function $CallCtx(context){
this.type='call'
this.toString=function(){return 'call ('+this.tree+')'}
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){return '('+$to_js(this.tree)+')'}
}
function $ClassCtx(context){
this.type='class'
this.parent=context
this.tree=[]
context.tree.push(this)
this.expect='id'
this.toString=function(){return 'class '+this.tree}
this.transform=function(node,rank){
var instance_decl=new $Node('expression')
new $NodeJSCtx(instance_decl,'var $instance = this')
node.insert(0,instance_decl)
js=this.name+'=$class_constructor("'+this.name+'",$'+this.name+')'
var cl_cons=new $Node('expression')
new $NodeJSCtx(cl_cons,js)
node.parent.insert(rank+1,cl_cons)
if(this.parent.node.module==='__main__'){
js='window.'+this.name+'='+this.name
var w_decl=new $Node('expression')
new $NodeJSCtx(w_decl,js)
node.parent.insert(rank+2,w_decl)
}
}
this.to_js=function(){
return '$'+this.name+'=function()'
}
}
function $CompIfCtx(context){
this.type='comp_if'
context.parent.intervals.push($pos)
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return '(comp if) '+this.tree}
this.to_js=function(){return 'comp if to js'}
}
function $ComprehensionCtx(context){
this.type='comprehension'
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return '(comprehension) '+this.tree}
this.to_js=function(){
console.log('comprenhension to JS')
var intervals=[]
for(var i=0;i<this.tree.length;i++){
intervals.push(this.tree[i].start)
console.log('intervals '+intervals)
}
return intervals
}
}
function $CompForCtx(context){
this.type='comp_for'
context.parent.intervals.push($pos)
this.parent=context
this.tree=[]
this.expect='in'
context.tree.push(this)
this.toString=function(){return '(comp for) '+this.tree}
this.to_js=function(){return 'comp for to js'}
}
function $CompIterableCtx(context){
this.type='comp_iterable'
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return '(comp iter) '+this.tree}
this.to_js=function(){return 'comp iter to js'}
}
function $ConditionCtx(context,token){
this.type='condition'
this.token=token
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return this.token+' '+this.tree}
this.to_js=function(){
var tok=this.token
if(tok==='elif'){tok='else if'}
if(this.tree.length==1){
var res=tok+'(bool('+$to_js(this.tree)+'))'
}else{
var res=tok+'(bool('+this.tree[0].to_js()+'))'
if(this.tree[1].tree.length>0){
res +='{'+this.tree[1].to_js()+'}'
}
}
return res
}
}
function $DefCtx(context){
this.type='def'
this.name=null
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return 'def '+this.name+'('+this.tree+')'}
this.transform=function(node,rank){
if(this.transformed!==undefined){return}
if(this.in_line!==undefined){
var new_node=new $Node('expression')
var ctx=new $NodeCtx(new_node)
ctx.tree=[this.tree[this.tree.length-1]]
node.add(new_node)
}
var scope=$get_scope(this)
if(scope !==null && scope.ntype==='class'){
var func_args=this.tree[0]
if(func_args.tree.length==0){throw Error('no argument to class func')}
var first_arg=func_args.tree[0]
if(first_arg.type!=='func_arg_id'){throw Error('wrong first argument '+first_arg.type)}
func_args.tree.splice(0,1)
var js='var '+first_arg.name+' = $instance'
var new_node3=new $Node('expression')
new $NodeJSCtx(new_node3,js)
node.children.splice(0,0,new_node3)
}
var required=''
var defaults=''
var other_args=null
var other_kw=null
var env=[]
for(var i=0;i<this.tree[0].tree.length;i++){
var arg=this.tree[0].tree[i]
if(arg.type==='func_arg_id'){
if(arg.tree.length===0){required+='"'+arg.name+'",'}
else{
defaults+='"'+arg.name+'":'+$to_js(arg.tree)+','
if(arg.tree[0].type==='expr' 
&& arg.tree[0].tree[0].type==='id'){
env.push(arg.tree[0].tree[0].value)
}
}
}else if(arg.type==='star_arg'){other_args='"'+arg.name+'"'}
else if(arg.type==='double_star_arg'){other_kw='"'+arg.name+'"'}
}
this.env=env
if(required.length>0){required=required.substr(0,required.length-1)}
if(defaults.length>0){defaults=defaults.substr(0,defaults.length-1)}
var js='var $ns=$MakeArgs("'+this.name+'",arguments,['+required+'],'
js +='{'+defaults+'},'+other_args+','+other_kw+')'
var new_node1=new $Node('expression')
new $NodeJSCtx(new_node1,js)
var js='for($var in $ns){eval("var "+$var+"=$ns[$var]")}'
var new_node2=new $Node('expression')
new $NodeJSCtx(new_node2,js)
node.children.splice(0,0,new_node1,new_node2)
var try_node=new $Node('expression')
new $NodeJSCtx(try_node,'try')
var def_func_node=new $Node('expression')
new $NodeJSCtx(def_func_node,'return function()')
try_node.add(def_func_node)
for(var i=0;i<node.children.length;i++){
def_func_node.add(node.children[i])
}
var ret_node=new $Node('expression')
var catch_node=new $Node('expression')
var js='catch(err'+$loop_num+')'
js +='{$raise(err'+$loop_num+'.name,err'+$loop_num+'.message)}'
new $NodeJSCtx(catch_node,js)
node.children=[]
node.add(try_node)
node.add(catch_node)
var txt=')('
for(var i=0;i<this.env.length;i++){
txt +=this.env[i]
if(i<this.env.length-1){txt +=','}
}
new $NodeJSCtx(ret_node,txt+')')
node.parent.insert(rank+1,ret_node)
if(scope===null && node.module==='__main__'){
js='window.'+this.name+'='+this.name
new_node1=new $Node('expression')
new $NodeJSCtx(new_node1,js)
node.parent.children.splice(rank+2,0,new_node1)
}
this.transformed=true
}
this.to_js=function(indent){
var scope=$get_scope(this)
if(scope===null || scope.ntype!=='class'){
res=this.name+'= (function ('
}else{
res='this.'+this.name+'= (function('
}
for(var i=0;i<this.env.length;i++){
res+=this.env[i]
if(i<this.env.length-1){res+=','}
}
res +=')'
return res
}
}
function $DelCtx(context){
this.type='del'
this.parent=context
context.tree.push(this)
this.tree=[]
this.toString=function(){return 'del '+this.tree}
this.to_js=function(){
var expr=this.tree[0]
if(expr.tree[0].type!=='id'){throw Error('SyntaxError, no id after del')}
var del_id=expr.tree[0]
if(del_id.tree.length===0||del_id.tree[del_id.tree.length-1].type!=='sub'){
throw Error('SyntaxError, no subscription for del')
}
var last_item=del_id.tree.pop()
var item=last_item.tree[0].to_js()
var res=del_id.to_js()
del_id.tree.push(last_item)
return res+'.__delitem__('+item+')'
}
}
function $DictCtx(context){
this.type='dict'
this.parent=context.parent
context.parent.tree.pop()
context.parent.tree.push(this)
context.name='dict_key'
this.tree=[context]
this.expect=','
this.toString=function(){return 'dict '+this.tree}
}
function $DictOrSetCtx(context){
this.type='dict_or_set'
this.real='dict_or_set'
this.expect='id'
this.closed=false
this.toString=function(){
if(this.real==='dict'){return '(dict) {'+this.tree+'}'}
else if(this.real==='set'){return '(set) {'+this.tree+'}'}
else{return '(dict_or_set) {'+this.tree+'}'}
}
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){
if(this.real==='dict'){
var res='dict(['
for(var i=0;i<this.items.length;i+=2){
res+='['+this.items[i].to_js()+','+this.items[i+1].to_js()+']'
if(i<this.items.length-2){res+=','}
}
return res+'])'+$to_js(this.tree)
}else{return 'set(['+$to_js(this.items)+'])'+$to_js(this.tree)}
}
}
function $DoubleStarArgCtx(context){
this.type='double_star_arg'
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return '**'+this.tree}
this.to_js=function(){return '$pdict('+$to_js(this.tree)+')'}
}
function $ExceptCtx(context){
this.type='except'
this.parent=context
context.tree.push(this)
this.tree=[]
this.toString=function(){return '(except) '}
this.to_js=function(){
if(this.tree.length===0){return 'else'}
else{
var target=this.tree[0]
var res='else if(['
for(var i=0;i<target.tree.length;i++){
res+='"'+target.tree[i].value+'"'
if(i<target.tree.length-1){res+=','}
}
res +='].indexOf('+this.error_name+'.name)>-1)'
return res
}
}
}
function $ExprCtx(context,name,with_commas){
this.type='expr'
this.name=name
this.with_commas=with_commas
this.expect=',' 
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return '(expr '+with_commas+') '+this.tree}
this.to_js=function(){
if(this.type==='list'){return '['+$to_js(this.tree)+']'}
else if(this.tree.length===1){return this.tree[0].to_js()}
else{return 'tuple('+$to_js(this.tree)+')'}
}
}
function $ExprNot(context){
this.type='expr_not'
this.toString=function(){return '(expr_not)'}
this.parent=context
this.tree=[]
context.tree.push(this)
}
function $FloatCtx(context,value){
this.type='float'
this.value=value
this.toString=function(){return 'float '+this.value}
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){return 'float('+this.value+')'}
}
function $ForTarget(context){
this.type='for_target'
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return 'for_target'+' '+this.tree}
this.to_js=function(){return $to_js(this.tree)}
}
function $ForExpr(context){
this.type='for'
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return '(for) '+this.tree}
this.transform=function(node,rank){
var new_nodes=[]
var new_node=new $Node('expression')
var target=this.tree[0]
var iterable=this.tree[1]
new $NodeJSCtx(new_node,'var $iter'+$loop_num+'='+iterable.to_js())
new_nodes.push(new_node)
new_node=new $Node('expression')
var js='for(var $i'+$loop_num+'=0;$i'+$loop_num
js +='<$iter'+$loop_num+'.__len__();$i'+$loop_num+'++)'
new $NodeJSCtx(new_node,js)
new_nodes.push(new_node)
var children=node.children
node.parent.children.splice(rank,1)
for(var i=new_nodes.length-1;i>=0;i--){
node.parent.insert(rank,new_nodes[i])
}
var new_node=new $Node('expression')
node.insert(0,new_node)
var context=new $NodeCtx(new_node)
var target_expr=new $ExprCtx(context,'left',true)
target_expr.tree=target.tree
var assign=new $AssignCtx(target_expr)
assign.tree[1]=new $JSCode('$iter'+$loop_num+'.__item__($i'+$loop_num+')')
node.parent.children[rank+1].children=children
$loop_num++
}
this.to_js=function(){
var iterable=this.tree.pop()
return 'for '+$to_js(this.tree)+' in '+iterable.to_js()
}
}
function $FuncArgs(context){
this.type='func_args'
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return 'func args '+this.tree}
this.expect='id'
this.has_default=false
this.has_star_arg=false
this.has_kw_arg=false
this.to_js=function(){return $to_js(this.tree)}
}
function $FuncArgIdCtx(context,name){
this.type='func_arg_id'
this.name=name
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return 'func arg id '+this.name +'='+this.tree}
this.expect='='
this.to_js=function(){return this.name+$to_js(this.tree)}
}
function $GlobalCtx(context){
this.type='global'
this.parent=context
this.tree=[]
context.tree.push(this)
this.expect='id'
this.toString=function(){return 'global '+this.tree}
this.transform=function(node,rank){
var scope=$get_scope(this)
if(scope.globals===undefined){scope.globals=[]}
for(var i=0;i<this.tree.length;i++){
scope.globals.push(this.tree[i].value)
}
}
this.to_js=function(){return ''}
}
function $IdCtx(context,value,minus){
this.type='id'
this.toString=function(){return '(id) '+this.value+':'+(this.tree||'')}
this.value=value
this.minus=minus
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){
var val=this.value
if(['print','alert','eval'].indexOf(this.value)>-1){val='$'+val}
return val+$to_js(this.tree,'')
}
}
function $ImportCtx(context){
this.type='import'
this.toString=function(){return 'import '+this.tree}
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){return '$import("'+$to_js(this.tree)+'")'}
}
function $IntCtx(context,value){
this.type='int'
this.value=value
this.toString=function(){return 'int '+this.value}
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){return 'Number('+this.value+')'}
}
function $JSCode(js){
this.js=js
this.toString=function(){return this.js}
this.to_js=function(){return this.js}
}
function $KwArgCtx(context){
this.type='kwarg'
this.toString=function(){return 'kwarg '+this.tree[0]+'='+this.tree[1]}
this.parent=context.parent
this.tree=[context.tree[0]]
context.parent.tree.pop()
context.parent.tree.push(this)
this.to_js=function(){
var res='$Kw("'+this.tree[0].to_js()+'",'
res +=$to_js(this.tree.slice(1,this.tree.length))+')'
return res
}
}
function $ListOrTupleCtx(context,real){
this.type='list_or_tuple'
this.start=$pos
this.real=real
this.expect='id'
this.closed=false
this.toString=function(){
if(this.real==='list'){return '(list) ['+this.tree+']'}
else if(this.real==='list_comp'){return '(list comp) ['+this.intervals+'-'+this.tree+']'}
else{return '(tuple) ('+this.tree+')'}
}
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){
if(this.real==='list'){return '['+$to_js(this.tree)+']'}
else if(this.real==='list_comp'){
var res_env=[],local_env=[],env=[]
var ctx_node=this
while(ctx_node.parent!==undefined){ctx_node=ctx_node.parent}
var module=ctx_node.node.module
var src=document.$py_src[module]
for(var i=0;i<this.expression.length;i++){
if(this.expression[i].type==='expr' &&
this.expression[i].tree[0].type==='list_or_tuple' &&
this.expression[i].tree[0].real==='list_comp'){continue}
var ids=$get_ids(this.expression[i])
for(var i=0;i<ids.length;i++){
if(res_env.indexOf(ids[i])===-1){res_env.push(ids[i])}
}
}
var comp=this.tree[0]
for(var i=0;i<comp.tree.length;i++){
var elt=comp.tree[i]
if(elt.type==='comp_for'){
var target_list=elt.tree[0]
for(var j=0;j<target_list.tree.length;j++){
var name=target_list.tree[j].value
if(local_env.indexOf(name)===-1){
local_env.push(name)
}
}
var comp_iter=elt.tree[1].tree[0]
for(var j=0;j<comp_iter.tree.length;j++){
if(comp_iter.tree[j].type!=='id'){continue}
var name=comp_iter.tree[j].value
if(env.indexOf(name)===-1 && local_env.indexOf(name)==-1){
env.push(name)
}
}
}else if(elt.type==="comp_if"){
var if_expr=elt.tree[0]
for(var j=0;j<if_expr.tree.length;j++){
var name=if_expr.tree[j].value
if(env.indexOf(name)===-1 && local_env.indexOf(name)==-1){
env.push(name)
}
}
}
}
for(var i=0;i<res_env.length;i++){
if(local_env.indexOf(res_env[i])===-1){
env.push(res_env[i])
}
}
var res='{'
for(var i=0;i<env.length;i++){
res +="'"+env[i]+"':"+env[i]
if(i<env.length-1){res+=','}
}
res +='},'
var qesc=new RegExp('"',"g")
for(var i=1;i<this.intervals.length;i++){
var txt=src.substring(this.intervals[i-1],this.intervals[i]).replace(qesc,'\\"')
txt=txt.replace(/\n/g,' ')
res +='"'+txt+'"'
if(i<this.intervals.length-1){res+=','}
}
return '$list_comp1('+res+')'
}else if(this.real==='tuple'){
if(this.tree.length===1){return this.tree[0].to_js()}
else{return 'tuple('+$to_js(this.tree)+')'}
}
}
}
function $NodeCtx(node){
this.node=node
node.context=this
this.tree=[]
this.type='node'
this.toString=function(){return 'node '+this.tree}
this.to_js=function(){
if(this.tree.length>1){
var new_node=new $Node('expression')
var ctx=new $NodeCtx(new_node)
ctx.tree=[this.tree[1]]
new_node.indent=node.indent+4
this.tree.pop()
node.add(new_node)
}
return $to_js(this.tree)
}
}
function $NodeJSCtx(node,js){
this.node=node
node.context=this
this.type='node_js'
this.tree=[js]
this.toString=function(){return 'js '+js}
this.to_js=function(){return js}
}
function $NotCtx(context){
this.type='not'
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return 'not ('+this.tree+')'}
this.to_js=function(){return '!bool('+$to_js(this.tree)+')'}
}
function $OpCtx(context,op){
this.type='op'
this.op=op
this.toString=function(){return '(op '+this.op+')'+this.tree}
this.parent=context.parent
this.tree=[context]
context.parent.tree.pop()
context.parent.tree.push(this)
this.to_js=function(){
if(this.op==='and'){
var res='$test_expr($test_item('+this.tree[0].to_js()+')&&'
res +='$test_item('+this.tree[1].to_js()+'))'
return res
}else if(this.op==='or'){
var res='$test_expr($test_item('+this.tree[0].to_js()+')||'
res +='$test_item('+this.tree[1].to_js()+'))'
return res
}else{
var res=this.tree[0].to_js()
res +='.__'+$operators[this.op]+'__('+this.tree[1].to_js()+')'
return res
}
}
}
function $ParentClassCtx(context){
this.type='parent_class'
this.expect='id'
this.toString=function(){return '('+this.tree+')'}
this.parent=context
this.tree=[]
context.tree.push(this)
}
function $PassCtx(context){
this.type='pass'
this.toString=function(){return '(pass)'}
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){return 'void(0)'}
}
function $ReturnCtx(context){
this.type='return'
this.toString=function(){return 'return '+this.tree}
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){return 'return '+$to_js(this.tree)}
}
function $SingleKwCtx(context,token){
this.type='single_kw'
this.token=token
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return this.token}
this.to_js=function(){return this.token}
}
function $StarArgCtx(context){
this.type='star_arg'
this.parent=context
this.tree=[]
context.tree.push(this)
this.toString=function(){return '(star arg) '+this.tree}
this.to_js=function(){
return '$ptuple('+$to_js(this.tree)+')'
}
}
function $StringCtx(context,value){
this.type='str'
this.value=value
this.toString=function(){return 'string '+this.value+' '+(this.tree||'')}
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){
return this.value.replace(/\n/g,' \\\n')+$to_js(this.tree,'')
}
}
function $SubCtx(context){
this.type='sub'
this.func='getitem' 
this.toString=function(){return '(sub) '+this.tree}
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){
var res='.__'+this.func+'__('
if(this.tree.length===1){
return res+this.tree[0].to_js()+')'
}else{
res +='slice('
for(var i=0;i<this.tree.length;i++){
if(this.tree[i].type==='abstract_expr'){res+='null'}
else{res+=this.tree[i].to_js()}
if(i<this.tree.length-1){res+=','}
}
return res+'))'
}
}
}
function $TargetListCtx(context){
this.type='target_list'
this.parent=context
this.tree=[]
this.expect='id'
context.tree.push(this)
this.toString=function(){return '(target list) '+this.tree}
}
function $TernaryCtx(context){
this.type='ternary'
this.parent=context.parent
context.parent.tree.pop()
context.parent.tree.push(this)
context.parent=this
this.tree=[context]
this.toString=function(){return '(ternary) '+this.tree}
this.to_js=function(){
var qesc=new RegExp('"',"g")
var args=this.tree[1].to_js().replace(qesc,'\\"')+','
args +=this.tree[0].to_js().replace(qesc,'\\"')+','
args +=this.tree[2].to_js().replace(qesc,'\\"')
return '$ternary('+$to_js(this.tree)+')'
}
}
function $TryCtx(context){
this.type='try'
this.parent=context
context.tree.push(this)
this.toString=function(){return '(try) '}
this.transform=function(node,rank){
if(node.parent.children.length===rank+1){
$_SyntaxError("missing clause after 'try' 1")
}else{
var next_ctx=node.parent.children[rank+1].context.tree[0]
if(['except','finally'].indexOf(next_ctx.type)===-1){
$_SyntaxError("missing clause after 'try' 2")
}
}
new $NodeJSCtx(node,'try')
var catch_node=new $Node('expression')
new $NodeJSCtx(catch_node,'catch($err'+$loop_num+')')
node.parent.insert(rank+1,catch_node)
var new_node=new $Node('expression')
new $NodeJSCtx(new_node,'if(false){void(0)}')
catch_node.insert(0,new_node)
var pos=rank+2
var has_default=false 
while(true){
if(pos===node.parent.children.length){break}
var ctx=node.parent.children[pos].context.tree[0]
if(ctx.type==='except'||
(ctx.type==='single_kw' && ctx.token==='finally')){
node.parent.children[pos].context.tree[0].error_name='$err'+$loop_num
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
var new_node=new $Node('expression')
new $NodeJSCtx(new_node,'else{throw $err'+$loop_num+'}')
catch_node.insert(catch_node.children.length,new_node)
}
$loop_num++
}
this.to_js=function(){return 'try'}
}
function $UnaryCtx(context,op){
this.type='unary'
this.op=op
this.toString=function(){return '(unary) '+this.op+' ['+this.tree+']'}
this.parent=context
this.tree=[]
context.tree.push(this)
this.to_js=function(){return this.op+$to_js(this.tree)}
}
var $loop_num=0
var $iter_num=0 
function $add_line_num(node,rank){
if(node.type==='module'){
var i=0
while(i<node.children.length){
i +=$add_line_num(node.children[i],i)
}
}else{
var elt=node.context.tree[0],offset=1
var flag=true
if(node.line_num===undefined){flag=false}
if(elt.type==='condition' && elt.token==='elif'){flag=false}
else if(elt.type==='except'){flag=false}
else if(elt.type==='single_kw'){flag=false}
if(flag){
js='document.$line_info=['+node.line_num+',"'+node.module+'"]'
var new_node=new $Node('expression')
new $NodeJSCtx(new_node,js)
node.parent.insert(rank,new_node)
offset=2
}
var i=0
while(i<node.children.length){
i +=$add_line_num(node.children[i],i)
}
return offset
}
}
function $augmented_assign(context,op){
var assign=new $AssignCtx(context)
var new_op=new $OpCtx(context,op.substr(0,op.length-1))
assign.tree.push(new_op)
context.parent.tree.pop()
context.parent.tree.push(assign)
return new_op
}
function $get_scope(context){
var ctx_node=context.parent
while(ctx_node.type!=='node'){ctx_node=ctx_node.parent}
var tree_node=ctx_node.node
var scope=null
while(tree_node.parent.type!=='module'){
var ntype=tree_node.parent.context.tree[0].type
if(['def','class'].indexOf(ntype)>-1){
scope=tree_node.parent
scope.ntype=ntype
break
}
tree_node=tree_node.parent
}
return scope
}
function $get_ids(ctx){
var res=[]
if(ctx.type==='id'){res.push(ctx.value)}
if(ctx.tree!==undefined){
for(var i=0;i<ctx.tree.length;i++){
var res1=$get_ids(ctx.tree[i])
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
var res=''
for(var i=0;i<tree.length;i++){
if(tree[i].to_js!==undefined){
res +=tree[i].to_js()
}else{
throw Error('no to_js() for '+tree[i])
}
if(i<tree.length-1){res+=sep}
}
return res
}
var $expr_starters=['id','int','float','str','[','(','{','not']
function $arbo(ctx){
while(ctx.parent!=undefined){ctx=ctx.parent}
return ctx
}
function $transition(context,token){
if(context.type==='abstract_expr'){
if($expr_starters.indexOf(token)>-1){
context.parent.tree.pop()
var commas=context.with_commas
context=context.parent
}
if(token==='id'){return new $IdCtx(new $ExprCtx(context,'id',commas),arguments[2])}
else if(token==='str'){return new $StringCtx(new $ExprCtx(context,'str',commas),arguments[2])}
else if(token==='int'){return new $IntCtx(new $ExprCtx(context,'int',commas),arguments[2])}
else if(token==='float'){return new $FloatCtx(new $ExprCtx(context,'float',commas),arguments[2])}
else if(token==='('){return new $ListOrTupleCtx(new $ExprCtx(context,'tuple',commas),'tuple')}
else if(token==='['){return new $ListOrTupleCtx(new $ExprCtx(context,'list',commas),'list')}
else if(token==='{'){return new $DictOrSetCtx(new $ExprCtx(context,'dict_or_set',commas))}
else if(token==='not'){return new $NotCtx(new $ExprCtx(context,'not',commas))}
else if(token==='op' && '+-'.search(arguments[2])){
return new $UnaryCtx(context,arguments[2])
}else if(token==='='){$_SyntaxError(context,token)}
else{return $transition(context.parent,token,arguments[2])}
}else if(context.type==='assert'){
if($expr_starters.indexOf(token)>-1&&context.init===undefined){
context.init=true
return $transition(new $AbstractExprCtx(context,false),token,arguments[2])
}else if(token==='eol'&&context.init===true){
return $transition(context.parent,token)
}else{$_SyntaxError(context,token)}
}else if(context.type==='assign'){
if(token==='eol'){return $transition(context.parent,'eol')}
else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(context.type==='attribute'){
if(token==='id'){
var name=arguments[2]
if(name.substr(0,2)=='$$'){name=name.substr(2)}
context.name=name
return context.parent
}else{$_SyntaxError(context,token)}
}else if(context.type==='call'){
if(token===','){return context}
else if($expr_starters.indexOf(token)>-1){
var expr=new $CallArgCtx(context)
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
var expr=new $AbstractExprCtx(context,false)
return $transition(expr,token,arguments[2])
}else if(token==='=' && context.expect===','){
return new $ExprCtx(new $KwArgCtx(context),'kw_value',false)
}else if(token==='op' && context.expect==='id'){
var op=arguments[2]
if(op==='*'){return new $StarArgCtx(context)}
else if(op==='**'){return new $DoubleStarArgCtx(context)}
else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(token===')' && context.expect===','){
return $transition(context.parent,token)
}else if(token===','&& context.expect===','){
return new $CallArgCtx(context.parent)
}else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(context.type==='class'){
if(token==='id' && context.expect==='id'){
context.name=arguments[2]
context.expect='(:'
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
context.expect=null
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
var new_node=new $Node('expression')
context.parent.node.add(new_node)
return new $NodeCtx(new_node)
}
else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(context.type==='def'){
if(token==='id'){
if(context.name){
$_SyntaxError(context,'token '+token+' after '+context)
}else{
context.name=arguments[2]
return context
}
}else if(token==='('){return new $FuncArgs(context)}
else if(token===':'){return context.parent}
else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(context.type==='dict_or_set'){
if(context.closed){
if(token==='['){return new $SubCtx(context)}
else if(token==='('){return new $CallArgCtx(new $CallCtx(context))}
else if(token==='.'){return new $AttrCtx(context)}
else if(token==='op'){
return new $AbstractExprCtx(new $OpCtx(context,arguments[2]),false)
}else{return $transition(context.parent,token,arguments[2])}
}else{
if(context.expect===','){
if(token==='}'){
if((context.real==='set')||
(context.real==='dict'&&context.tree.length%2===0)){
context.items=context.tree
context.tree=[]
context.closed=true
return context
}else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(token===','){
if(context.real==='dict_or_set'){context.real='set'}
if(context.real==='dict' && context.tree.length%2){
$_SyntaxError(context,'token '+token+' after '+context)
}
context.expect='id'
return context
}else if(token===':'){
if(context.real==='dict_or_set'){context.real='dict'}
if(context.real==='dict'){
context.expect='id'
return context
}else{$_SyntaxError(context,'token '+token+' after '+context)}
}else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(context.expect==='id'){
if(token==='}'&&context.tree.length===0){
context.items=[]
context.tree=[]
context.closed=true
context.real='dict'
return context
}else if($expr_starters.indexOf(token)>-1){
context.expect=','
var expr=new $AbstractExprCtx(context,false)
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
if(token==='id'){
return $transition(new $TargetListCtx(context),token,arguments[2])
}else if(token===':'){
return context.parent
}else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(context.type==='expr'){
if($expr_starters.indexOf(token)>-1 && context.expect==='expr'){
context.expect=','
return $transition(new $AbstractExprCtx(context,false),token,arguments[2])
}else if(token==='not'&&context.expect===','){
return new $ExprNot(context)
}else if(token==='in'&&context.expect===','){
return new $AbstractExprCtx(new $OpCtx(context,'in'),false)
}else if(token===',' && context.expect===','){
if(context.with_commas){
context.expect='expr'
return context
}else{return $transition(context.parent,token)}
}else if(token==='op'){
var op_parent=context.parent,op=arguments[2]
var op1=context.parent,repl=null
while(true){
if(op1.type==='expr'){op1=op1.parent}
else if(op1.type==='op'&&$op_weight[op1.op]>$op_weight[op]){repl=op1;op1=op1.parent}
else{break}
}
if(repl===null){
context.parent.tree.pop()
var expr=new $ExprCtx(op_parent,'operand',context.with_commas)
expr.expect=','
context.parent=expr
var new_op=new $OpCtx(context,op)
return new $AbstractExprCtx(new_op,false)
}
repl.parent.tree.pop()
var expr=new $ExprCtx(repl.parent,'operand',false)
expr.tree=[op1]
repl.parent=expr
var new_op=new $OpCtx(repl,op)
return new $AbstractExprCtx(new_op,false)
}else if(token==='augm_assign' && context.expect===','){
return $augmented_assign(context,arguments[2])
}else if(token==='=' && context.expect===','){
if(context.parent.type==="call_arg"){
return new $AbstractExprCtx(new $KwArgCtx(context),true)
}else{
while(context.parent!==undefined){context=context.parent}
context=context.tree[0]
return new $AbstractExprCtx(new $AssignCtx(context),true)
}
}else if(token==='if' && context.parent.type!=='comp_iterable'){
return new $AbstractExprCtx(new $TernaryCtx(context),false)
}else{return $transition(context.parent,token)}
}else if(context.type==='expr_not'){
if(token==='in'){
context.parent.tree.pop()
return new $AbstractExprCtx(new $OpCtx(context.parent,'not_in'),false)
}else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(context.type==='for'){
if(token==='in'){return new $AbstractExprCtx(context,true)}
else if(token===':'){return context.parent}
else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(context.type==='func_arg_id'){
if(token==='=' && context.expect==='='){
context.parent.has_default=true
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
context.expect=','
return new $FuncArgIdCtx(context,arguments[2])
}else if(token===','){
if(context.has_kw_arg){throw Error('SyntaxError')}
else if(context.expect===','){
context.expect='id'
return context
}else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(token===')'){
if(context.expect===','){return context.parent}
else if(context.tree.length==0){return context.parent}
else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(token==='op'){
var op=arguments[2]
context.expect=','
if(op=='*'){return new $StarArgCtx(context)}
else if(op=='**'){return new $DoubleStarArgCtx(context)}
else{$_SyntaxError(context,'token '+op+' after '+context)}
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
if(token==='['){return new $AbstractExprCtx(new $SubCtx(context),false)}
else if(token==='('){return new $CallCtx(context)}
else if(token==='.'){return new $AttrCtx(context)}
else if(token==='='){
if(context.parent.type==='expr' &&
context.parent.parent !==undefined &&
context.parent.parent.type==='call_arg'){
return new $AbstractExprCtx(new $KwArgCtx(context.parent),false)
}else{return $transition(context.parent,token,arguments[2])}
}else if(token==='op'){return $transition(context.parent,token,arguments[2])}
else{return $transition(context.parent,token,arguments[2])}
}else if(context.type==='import'){
if(token==='id'){return new $IdCtx(context,arguments[2])}
else{return $transition(context.parent,token)}
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
context.closed=true
return context
}else if((context.real==='list'||context.real==='list_comp')
&& token===']'){
context.closed=true
if(context.real==='list_comp'){context.intervals.push($pos)}
return context
}else if(token===','){
context.expect='id'
return context
}else if(token==='for'){
context.real='list_comp'
context.intervals=[context.start+1]
context.expression=context.tree
context.tree=[]
var comp=new $ComprehensionCtx(context)
return new $TargetListCtx(new $CompForCtx(comp))
}else{return $transition(context.parent,token,arguments[2])}
}else if(context.expect==='id'){
if(context.real==='tuple' && token===')'){
context.closed=true
return context
}else if(context.real==='list'&& token===']'){
context.closed=true
return context
}else if(token !==')'&&token!==']'&&token!==','){
context.expect=','
var expr=new $AbstractExprCtx(context,false)
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
var expr=new $AbstractExprCtx(context,true)
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
else if(token==='import'){return new $ImportCtx(context)}
else if(token==='global'){return new $GlobalCtx(context)}
else if(token==='pass'){return new $PassCtx(context)}
else if(token==='return'){
var ret=new $ReturnCtx(context)
return new $AbstractExprCtx(ret,true)
}else if(token==='del'){return new $AbstractExprCtx(new $DelCtx(context),false)}
else if(token===':'){
var tree_node=context.node
var new_node=new $Node('expression')
tree_node.add(new_node)
return new $NodeCtx(new_node)
}else if(token==='eol'){
if(context.tree.length===0){
context.node.parent.children.pop()
return context.node.parent.context
}
return context
}else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(context.type==='not'){
if(token==='in'){
context.parent.parent.tree.pop()
return new $ExprCtx(new $OpCtx(context.parent,'not_in'),'op',false)
}else if($expr_starters.indexOf(token)>-1){
var expr=new $AbstractExprCtx(context,false)
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
context.expect=','
return context
}else if(token===',' && context.expect==','){
context.expect='id'
return context
}else if(token===')'){return context.parent}
else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(context.type==='pass'){
if(token==='eol'){return context.parent}
else{$_SyntaxError(context,'token '+token+' after '+context)}
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
else if(token==='.'){return new $AttrCtx(context)}
else if(token=='str'){context.value +='+'+arguments[2];return context}
else{return $transition(context.parent,token,arguments[2])}
}else if(context.type==='sub'){
if($expr_starters.indexOf(token)>-1){
var expr=new $AbstractExprCtx(context,false)
return $transition(expr,token,arguments[2])
}else if(token===']'){return context.parent}
else if(token===':'){
return new $AbstractExprCtx(context,false)
}else{$_SyntaxError(context,'token '+token+' after '+context)}
}else if(context.type==='target_list'){
if(token==='id' && context.expect==='id'){
context.expect=','
new $IdCtx(context,arguments[2])
return context
}else if((token==='('||token==='[')&&context.expect==='id'){
context.expect=','
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
var value=arguments[2]
if(context.op==='-'){value=-value}
return $transition(context.parent,token,value)
}else if(token==='id'){
context.parent.tree.pop()
if(context.op==='-'){
var int_expr=new $IntCtx(context.parent,-1)
return $transition(new $OpCtx(int_expr,'*'),token,arguments[2])
}else{
return $transition(context.parent,token,arguments[2])
}
}else if(token==="op" && '+-'.search(arguments[2])>-1){
var op=arguments[2]
if(context.op===op){context.op='+'}else{context.op='-'}
return context
}else{return $transition(context.parent,token,arguments[2])}
}
}
function $py2js(src,module){
src=src.replace(/\r\n/gm,'\n')
while(src.length>0 &&(src.charAt(0)=="\n" || src.charAt(0)=="\r")){
src=src.substr(1)
}
if(src.charAt(src.length-1)!="\n"){src+='\n'}
if(module===undefined){module='__main__'}
document.$py_src[module]=src 
var root=$tokenize(src,module)
root.transform()
if(document.$debug>0){$add_line_num(root,null,module)}
return root
}
function $tokenize(src,module){
var delimiters=[["#","\n","comment"],['"""','"""',"triple_string"],
["'","'","string"],['"','"',"string"],
["r'","'","raw_string"],['r"','"',"raw_string"]]
var br_open={"(":0,"[":0,"{":0}
var br_close={")":"(","]":"[","}":"{"}
var br_stack=""
var br_pos=new Array()
var kwdict=["class","is","return",
"for","lambda","try","finally","raise","def","from",
"nonlocal","while","del","global","with",
"as","elif","else","if","yield","assert","import",
"except","raise","in","not","pass",
]
var unsupported=["is","from","nonlocal","with","yield"]
var $indented=['class','def','for','condition','single_kw','try','except']
var forbidden=['case','catch','debugger','default','delete',
'do','function','instanceof','new','switch','this','throw',
'typeof','var','void','with','enum','export','extends','super']
var punctuation={',':0,':':0}
var int_pattern=new RegExp("^\\d+")
var float_pattern=new RegExp("^\\d+\\.\\d*(e-?\\d+)?")
var id_pattern=new RegExp("[\\$_a-zA-Z]\\w*")
var qesc=new RegExp('"',"g")
var context=null
var root=new $Node('module')
root.indent=-1
var new_node=new $Node('expression')
current=root
var name=""
var _type=null
var pos=0
indent=null
var lnum=1
while(pos<src.length){
var flag=false
var car=src.charAt(pos)
if(indent===null){
var indent=0
while(pos<src.length){
if(src.charAt(pos)==" "){indent++;pos++}
else if(src.charAt(pos)=="\t"){
indent++;pos++
while(indent%8>0){indent++}
}else{break}
}
if(src.charAt(pos)=='\n'){pos++;lnum++;indent=null;continue}
else if(src.charAt(pos)==='#'){
var offset=src.substr(pos).search(/\n/)
if(offset===-1){break}
pos+=offset+1;lnum++;indent=null;continue
}
new_node.indent=indent
new_node.line_num=lnum
new_node.module=module
if(indent>current.indent){
if(context!==null){
if($indented.indexOf(context.tree[0].type)==-1){
$IndentationError(module,'unexpected indent',pos)
}
}
current.add(new_node)
}else{
while(indent!==current.indent){
current=current.parent
if(current===undefined || indent>current.indent){
$IndentationError(module,'unexpected indent',pos)
}
}
current.parent.add(new_node)
}
current=new_node
context=new $NodeCtx(new_node)
continue
}
if(car=="#"){
var end=src.substr(pos+1).search('\n')
if(end==-1){end=src.length-1}
pos +=end+1;continue
}
if(car=='"' || car=="'"){
var raw=false
var end=null
if(name.length>0 && name.toLowerCase()=="r"){
raw=true;name=""
}
if(src.substr(pos,3)==car+car+car){_type="triple_string";end=pos+3}
else{_type="string";end=pos+1}
var escaped=false
var zone=car
var found=false
while(end<src.length){
if(escaped){zone+=src.charAt(end);escaped=false;end+=1}
else if(src.charAt(end)=="\\"){
if(raw){
zone +='\\\\'
end++
}else{
if(src.charAt(end+1)=='\n'){
end +=2
lnum++
}else{
zone+=src.charAt(end);escaped=true;end+=1
}
}
}else if(src.charAt(end)==car){
if(_type=="triple_string" && src.substr(end,3)!=car+car+car){
end++
}else{
found=true
$pos=pos-zone.length-1
var string=zone.substr(1).replace(qesc,'\\"')
context=$transition(context,'str',zone+car)
pos=end+1
if(_type=="triple_string"){pos=end+3}
break
}
}else{
zone +=src.charAt(end)
if(src.charAt(end)=='\n'){lnum++}
end++
}
}
if(!found){
document.line_num=pos2line[pos]
$SyntaxError(module,"String end not found",pos)
}
continue
}
if(name==""){
if(car.search(/[a-zA-Z_]/)!=-1){
name=car 
pos++;continue
}
}else{
if(car.search(/\w/)!=-1){
name+=car
pos++;continue
}else{
if(kwdict.indexOf(name)>-1){
if(unsupported.indexOf(name)>-1){
document.line_num=pos2line[pos]
$SyntaxError(module,"Unsupported Python keyword '"+name+"'",pos)
}
$pos=pos-name.length
context=$transition(context,name)
}else if(name in $operators){
$pos=pos-name.length
context=$transition(context,'op',name)
}else{
if(forbidden.indexOf(name)>-1){name='$$'+name}
$pos=pos-name.length
context=$transition(context,'id',name)
}
name=""
continue
}
}
if(car=="."){
$pos=pos
context=$transition(context,'.')
pos++;continue
}
if(car.search(/\d/)>-1){
var res=float_pattern.exec(src.substr(pos))
if(res){
if(res[0].search('e')>-1){
$pos=pos
context=$transition(context,'float',res[0])
}else{
$pos=pos
context=$transition(context,'float',eval(res[0]))
}
}else{
res=int_pattern.exec(src.substr(pos))
$pos=pos
context=$transition(context,'int',eval(res[0]))
}
pos +=res[0].length
continue
}
if(car=="\n"){
lnum++
if(br_stack.length>0){
pos++;continue
}else{
if(current.context.tree.length>0){
$pos=pos
context=$transition(context,'eol')
indent=null
new_node=new $Node()
}else{console.log('empty LINE '+lnum)
new_node.line_num=lnum}
pos++;continue
}
}
if(car in br_open){
br_stack +=car
br_pos[br_stack.length-1]=pos
$pos=pos
context=$transition(context,car)
pos++;continue
}
if(car in br_close){
if(br_stack==""){
$SyntaxError(module,"Unexpected closing bracket",pos)
}else if(br_close[car]!=$last(br_stack)){
document.line_num=pos2line[pos]
$SyntaxError(module,"Unbalanced bracket",pos)
}else{
br_stack=br_stack.substr(0,br_stack.length-1)
$pos=pos
context=$transition(context,car)
pos++;continue
}
}
if(car=="="){
if(src.charAt(pos+1)!="="){
$pos=pos
context=$transition(context,'=')
pos++;continue
}else{
$pos=pos
context=$transition(context,'op','==')
pos+=2;continue
}
}
if(car in punctuation){
$pos=pos
context=$transition(context,car)
pos++;continue
}
if(car in $first_op_letter){
var op_match=""
for(op_sign in $operators){
if(op_sign==src.substr(pos,op_sign.length)
&& op_sign.length>op_match.length){
op_match=op_sign
}
}
$pos=pos
if(op_match.length>0){
if(op_match in $augmented_assigns){
context=$transition(context,'augm_assign',op_match)
}else{
context=$transition(context,'op',op_match)
}
pos +=op_match.length
continue
}
}
if(car=='\\' && src.charAt(pos+1)=='\n'){
lnum++;pos+=2;continue
}
if(car!=' '&&car!=='\t'){$SyntaxError(module,'unknown token ['+car+']',pos)}
pos +=1
}
if(br_stack.length!=0){
pos=br_pos.pop()
document.line_num=pos2line[pos]
throw Error("Unbalanced bracket "+br_stack.charAt(br_stack.length-1),pos)
}
return root
}
function brython(debug){
document.$py_src={}
document.$debug=debug
var elts=document.getElementsByTagName("script")
for(var $i=0;$i<elts.length;$i++){
var elt=elts[$i]
if(elt.type=="text/python"){
if(elt.src!==''){
if(window.XMLHttpRequest){
var $xmlhttp=new XMLHttpRequest()
}else{
var $xmlhttp=new ActiveXObject("Microsoft.XMLHTTP")
}
$xmlhttp.onreadystatechange=function(){
var state=this.readyState
if(state===4){
src=$xmlhttp.responseText
}
}
$xmlhttp.open('GET',elt.src,false)
$xmlhttp.send()
}else{
var src=(elt.innerHTML || elt.textContent)
}
var root=$py2js(src,'__main__')
var js=root.to_js()
if(debug===2){console.log(js)}
eval(js)
}else{
var br_scripts=['brython.js','py_list.js']
for(var j=0;j<br_scripts.length;j++){
var bs=br_scripts[j]
if(elt.src.substr(elt.src.length-bs.length)==bs){
if(elt.src.length===bs.length ||
elt.src.charAt(elt.src.length-bs.length-1)=='/'){
document.$brython_path=elt.src.substr(0,elt.src.length-bs.length)
break
}
}
}
}
}
}function $MakeArgs($fname,$args,$required,$defaults,$other_args,$other_kw){
var i=null,$PyVars={},$def_names=[],$ns={}
for(var k in $defaults){$def_names.push(k);$ns[k]=$defaults[k]}
if($other_args !=null){$ns[$other_args]=[]}
if($other_kw !=null){$dict_items=[]}
var upargs=[]
for(var i=0;i<$args.length;i++){
if($args[i]===null){upargs.push(null)}
else if(isinstance($args[i],$ptuple)){
for(var j=0;j<$args[i].arg.length;j++){
upargs.push($args[i].arg[j])
}
}else if(isinstance($args[i],$pdict)){
for(var j=0;j<$args[i].arg.$keys.length;j++){
upargs.push($Kw($args[i].arg.$keys[j],$args[i].arg.$values[j]))
}
}else{
upargs.push($args[i])
}
}
for(var $i=0;$i<upargs.length;$i++){
$arg=upargs[$i]
$PyVar=$JS2Py($arg)
if(isinstance($arg,$Kw)){
$PyVar=$arg.value
if($arg.name in $PyVars){
throw new TypeError($fname+"() got multiple values for argument '"+$arg.name+"'")
}else if($required.indexOf($arg.name)>-1){
var ix=$required.indexOf($arg.name)
eval('var '+$required[ix]+"=$PyVar")
$ns[$required[ix]]=$PyVar
}else if($arg.name in $defaults){
$ns[$arg.name]=$PyVar
}else if($other_kw!=null){
$dict_items.push([$arg.name,$PyVar])
}else{
throw new TypeError($fname+"() got an unexpected keyword argument '"+$arg.name+"'")
}
if($arg.name in $defaults){delete $defaults[$arg.name]}
}else{
if($i<$required.length){
eval('var '+$required[$i]+"=$PyVar")
$ns[$required[$i]]=$PyVar
}else if($i<$required.length+$def_names.length){
$ns[$def_names[$i-$required.length]]=$PyVar
}else if($other_args!=null){
eval('$ns["'+$other_args+'"].push($PyVar)')
}else{
msg=$fname+"() takes "+$required.length+' positional arguments '
msg +='but more were given'
throw TypeError(msg)
}
}
}
if($other_kw!=null){$ns[$other_kw]=dict($dict_items)}
return $ns
}
function $list_comp($loops,$expr,$cond,$env){
for(var i=0;i<$env.length;i+=2){
eval('var '+$env[i]+'=$env['+(i+1)+']')
}
var py='res = []\n'
for(var i=0;i<$loops.length;i++){
for(j=0;j<4*i;j++){py +=' '}
py +='for '+$loops[i][0]+' in '+$loops[i][1]+':\n'
}
if($cond){
for(var j=0;j<4*i;j++){py +=' '}
py +='if '+$cond+':\n'
i++
}
for(var j=0;j<4*i;j++){py +=' '}
py +='tvar = '+$expr+'\n'
for(var j=0;j<4*i;j++){py +=' '}
py +='res.append(tvar)'
var js=$py2js(py).to_js()
eval(js)
return res
}
function $JS2Py(src){
if(src===null){return None}
if(typeof src==='number'){
if(src%1===0){return src}
else{return float(src)}
}
if(src.__class__!==undefined){return src}
if(typeof src=="object"){
if(src.constructor===Array){return src}
else if($isNode(src)){return $DOMNode(src)}
else if($isEvent(src)){return $DOMEvent(src)}
}
return JSObject(src)
}
function $module(){}
$module.__class__=$type
$module.__str__=function(){return "<class 'module'>"}
function $getattr(obj,attr){
if(obj[attr]!==undefined){
var res=obj[attr]
if(typeof res==="function"){
res=$bind(res, obj)
}
return $JS2Py(res)
}
}
function $bind(func, thisValue){
return function(){return func.apply(thisValue, arguments)}
}
function $raise(name,msg){
if(msg===undefined){msg=''}
if(document.$debug && msg.split('\n').length==1){
var module=document.$line_info[1]
var line_num=document.$line_info[0]
var lines=document.$py_src[module].split('\n')
msg +="\nmodule '"+module+"' line "+line_num
msg +='\n'+lines[line_num-1]
}
err=new Error()
err.name=name
err.message=msg
err.py_error=true
document.$stderr_buff=err.name+': '+err.message+'\n'
if(name!=='ExecutionError'){throw err}
}
function $src_error(name,module,msg,pos){
var pos2line={}
var lnum=1
var src=document.$py_src[module]
var line_pos={1:0}
for(i=0;i<src.length;i++){
pos2line[i]=lnum
if(src.charAt(i)=='\n'){lnum+=1;line_pos[lnum]=i}
}
var line_num=pos2line[pos]
var lines=src.split('\n')
msg=msg+"\nmodule '"+module+"' line "+line_num
msg +='\n'+lines[line_num-1]+'\n'
var lpos=pos-line_pos[line_num]
for(var i=0;i<lpos-1;i++){msg+=' '}
msg +='^'
err=new Error()
err.name=name
err.message=msg
err.py_error=true
if(document.$stderr!==null){document.$stderr_buff=err.message}
throw err
}
function $SyntaxError(module,msg,pos){
$src_error('SyntaxError',module,msg,pos)
}
function $IndentationError(module,msg,pos){
$src_error('IndentationError',module,msg,pos)
}
function $class_constructor(class_name,class_func){
var f=function(){
var obj=new class_func()
obj.__class__=f
obj.__getattr__=function(attr){
if(obj[attr]!==undefined){return obj[attr]}
else{$raise("AttributeError",obj+" has no attribute '"+attr+"'")}
}
obj.__setattr__=function(attr,value){obj[attr]=value}
obj.__str__=function(){return "<object '"+class_name+"'>"}
obj.toString=obj.__str__
if(obj.__init__ !==undefined){obj.__init__.apply(obj,arguments)}
return obj
}
f.__str__=function(){return "<class '"+class_name+"'>"}
f.__getattr__=function(attr){console.log('attr '+attr);return class_func[attr]}
return f
}
var $dq_regexp=new RegExp('"',"g")
function $escape_dq(arg){return arg.replace($dq_regexp,'\\"')}
document.$stderr={'write':function(data){void(0)}}
document.$stderr_buff='' 
document.$stdout={
write: function(data){console.log(data)}
}
function $type(){}
$type.__class__=$type
$type.toString=function(){return "<class 'type'>"}
function $UnsupportedOpType(op,class1,class2){
$raise('TypeError',
"unsupported operand type(s) for "+op+": '"+class1+"' and '"+class2+"'")
}
function $KwClass(name,value){
this.__class__=$Kw
this.name=name
this.value=value
}
$KwClass.prototype.toString=function(){
return '<kw '+this.name+' : '+this.value.toString()+'>'
}
function $Kw(name,value){
return new $KwClass(name,value)
}
function $ptuple_class(arg){
this.__class__=$ptuple
this.arg=arg
}
function $ptuple(arg){return new $ptuple_class(arg)}
function $pdict_class(arg){
this.__class__=$pdict
this.arg=arg
}
function $pdict(arg){return new $pdict_class(arg)}
function $test_item(expr){
document.$test_result=expr
return bool(expr)
}
function $test_expr(){
return document.$test_result
}
Function.prototype.__eq__=function(other){
if(typeof other !=='function'){return False}
return other+''===this+''
}
Function.prototype.__class__=Function
Function.prototype.get_name=function(){
var src=this.toString()
pattern=new RegExp("function (.*?)\\(")
var res=pattern.exec(src)
value='<function '+res[1]+'>'
}
Array.prototype.match=function(other){
var $i=0
while($i<this.length && $i<other.length){
if(this[$i]!==other[$i]){return false}
$i++
}
return true
}
if(!Array.indexOf){
Array.prototype.indexOf=function(obj){
for(var i=0;i<this.length;i++){
if(this[i]==obj){
return i 
}
}
return -1 
}
}
try{console}
catch(err){
console={'log':function(data){void(0)}}
}
function $List2Dict(){
var res={}
var i=0
if(arguments.length==1 && arguments[0].constructor==Array){
for(i=0;i<arguments[0].length;i++){
res[arguments[0][i]]=0
}
}else{
for(i=0;i<arguments.length;i++){
res[arguments[i]]=0
}
}
return res
}
function $last(item){
if(typeof item=="string"){return item.charAt(item.length-1)}
else if(typeof item=="object"){return item[item.length-1]}
}
function $XmlHttpClass(obj){
this.__class__='XMLHttpRequest'
this.__getattr__=function(attr){
if('get_'+attr in this){return this['get_'+attr]()}
else{return obj[attr]}
}
this.get_text=function(){return obj.responseText}
this.get_xml=function(){return $DomObject(obj.responseXML)}
this.get_headers=function(){return list(obj.getAllResponseHeaders().split('\n'))}
this.get_get_header=function(){
var reqobj=obj
return function(header){return reqobj.getResponseHeader(header)}
}
}
function Ajax(){}
Ajax.__class__=$type
Ajax.__str__=function(){return "<class 'Ajax'>"}
function $AjaxClass(){
if(window.XMLHttpRequest){
var $xmlhttp=new XMLHttpRequest()
}else{
var $xmlhttp=new ActiveXObject("Microsoft.XMLHTTP")
}
$xmlhttp.$ajax=this
$xmlhttp.$requestTimer=null
$xmlhttp.onreadystatechange=function(){
var state=this.readyState
var req=this.$ajax
var timer=this.$requestTimer
var obj=new $XmlHttpClass($xmlhttp)
if(state===0 && 'on_uninitialized' in req){req.on_uninitialized(obj)}
else if(state===1 && 'on_loading' in req){req.on_loading(obj)}
else if(state===2 && 'on_loaded' in req){req.on_loaded(obj)}
else if(state===3 && 'on_interactive' in req){req.on_interactive(obj)}
else if(state===4 && 'on_complete' in req){
if(timer !==null){window.clearTimeout(timer)}
req.on_complete(obj)
}
}
this.__class__=Ajax
this.__getattr__=function(attr){return $getattr(this,attr)}
this.__setattr__=function(attr,value){setattr(this,attr,value)}
this.__str__=function(){return "<object 'Ajax'>"}
this.open=function(method,url,async){
$xmlhttp.open(method,url,async)
}
this.set_header=function(key,value){
$xmlhttp.setRequestHeader(key,value)
}
this.send=function(params){
if(!params || params.$keys.length==0){$xmlhttp.send();return}
if(!isinstance(params,dict)){$raise('TypeError',
"send() argument must be dictonary, not '"+str(params.__class__)+"'")}
var res=''
for(i=0;i<params.$keys.length;i++){
res +=str(params.$keys[i])+'='+str(params.$values[i])+'&'
}
res=res.substr(0,res.length-1)
$xmlhttp.send(res)
}
this.set_timeout=function(seconds,func){
$xmlhttp.$requestTimer=setTimeout(
function(){$xmlhttp.abort();func()}, 
seconds*1000)
}
}
function ajax(){
return new $AjaxClass()
}
function $getMouseOffset(target, ev){
ev=ev || window.event
var docPos=$getPosition(target)
var mousePos=$mouseCoords(ev)
return{x:mousePos.x - docPos.x, y:mousePos.y - docPos.y}
}
function $getPosition(e){
var left=0
var top=0
var width=e.offsetWidth
var height=e.offsetHeight
while(e.offsetParent){
left +=e.offsetLeft
top +=e.offsetTop
e=e.offsetParent
}
left +=e.offsetLeft
top +=e.offsetTop
return{left:left, top:top, width:width, height:height}
}
function $mouseCoords(ev){
var posx=0
var posy=0
if(!ev)var ev=window.event
if(ev.pageX || ev.pageY){
posx=ev.pageX
posy=ev.pageY
}else if(ev.clientX || ev.clientY){
posx=ev.clientX + document.body.scrollLeft
+ document.documentElement.scrollLeft
posy=ev.clientY + document.body.scrollTop
+ document.documentElement.scrollTop
}
var res=object()
res.x=int(posx)
res.y=int(posy)
res.__getattr__=function(attr){return this[attr]}
res.__class__="MouseCoords"
return res
}
var $DOMNodeAttrs=['nodeName','nodeValue','nodeType','parentNode',
'childNodes','firstChild','lastChild','previousSibling','nextSibling',
'attributes','ownerDocument']
function $isNode(obj){
for(var i=0;i<$DOMNodeAttrs.length;i++){
if(obj[$DOMNodeAttrs[i]]===undefined){return false}
}
return true
}
var $DOMEventAttrs_W3C=['NONE','CAPTURING_PHASE','AT_TARGET','BUBBLING_PHASE',
'type','target','currentTarget','eventPhase','bubbles','cancelable','timeStamp',
'stopPropagation','preventDefault','initEvent']
var $DOMEventAttrs_IE=['altKey','altLeft','button','cancelBubble',
'clientX','clientY','contentOverflow','ctrlKey','ctrlLeft','data',
'dataFld','dataTransfer','fromElement','keyCode','nextPage',
'offsetX','offsetY','origin','propertyName','reason','recordset',
'repeat','screenX','screenY','shiftKey','shiftLeft',
'source','srcElement','srcFilter','srcUrn','toElement','type',
'url','wheelDelta','x','y']
function $isEvent(obj){
flag=true
for(var i=0;i<$DOMEventAttrs_W3C.length;i++){
if(obj[$DOMEventAttrs_W3C[i]]===undefined){flag=false;break}
}
if(flag){return true}
for(var i=0;i<$DOMEventAttrs_IE.length;i++){
if(obj[$DOMEventAttrs_IE[i]]===undefined){return false}
}
return true
}
function DOMObject(){}
DOMObject.__class__=$type
DOMObject.toString=function(){return "<class 'DOMObject'>"}
$DOMtoString=function(){
var res="<DOMObject object type '" 
return res+$NodeTypes[this.nodeType]+"' name '"+this.nodeName+"'>"
}
$NodeTypes={1:"ELEMENT",
2:"ATTRIBUTE",
3:"TEXT",
4:"CDATA_SECTION",
5:"ENTITY_REFERENCE",
6:"ENTITY",
7:"PROCESSING_INSTRUCTION",
8:"COMMENT",
9:"DOCUMENT",
10:"DOCUMENT_TYPE",
11:"DOCUMENT_FRAGMENT",
12:"NOTATION"
}
function DOMEvent(){}
DOMEvent.__class__=$type
DOMEvent.toString=function(){return "<class 'DOMEvent'>"}
function $DOMEvent(ev){
ev.__class__=DOMEvent
ev.__getattr__=function(attr){
if(attr=="x"){return $mouseCoords(ev).x}
if(attr=="y"){return $mouseCoords(ev).y}
if(attr=="data"){return new $Clipboard(ev.dataTransfer)}
return $getattr(ev,attr)
}
if(ev.preventDefault===undefined){ev.preventDefault=function(){ev.returnValue=false}}
if(ev.stopPropagation===undefined){ev.stopPropagation=function(){ev.cancelBubble=true}}
ev.__str__=function(){return '<DOMEvent object>'}
ev.toString=ev.__str__
return ev
}
function $Clipboard(data){
this.data=data
this.__class__="Clipboard"
}
$Clipboard.prototype.__getitem__=function(name){
return this.data.getData(name)
}
$Clipboard.prototype.__setitem__=function(name,value){
this.data.setData(name,value)
}
$Clipboard.prototype.__setattr__=function(attr,value){
eval("this.data."+attr+"=value")
}
function $OptionsClass(parent){
this.parent=parent
this.__getattr__=function(attr){
if('get_'+attr in this){return eval('this.get_'+attr)}
if(attr in this.parent.elt.options){
var obj=eval('this.parent.options.'+attr)
if((typeof obj)=='function'){
$raise('AttributeError',"'options' object has no attribute '"+attr+'"')
}
return $JS2Py(obj)
}
}
this.__class__='options'
this.__getitem__=function(key){
return $DOMNode(parent.options[key])
}
this.__delitem__=function(arg){
parent.options.remove(arg)
}
this.__len__=function(){return parent.options.length}
this.__setattr__=function(attr,value){
parent.options[attr]=value
}
this.__setitem__=function(attr,value){
parent.options[attr]=$JS2Py(value)
}
this.get_append=function(element){
parent.options.add(element)
}
this.get_insert=function(index,element){
if(index===undefined){parent.options.add(element)}
else{parent.options.add(element,index)}
}
this.get_item=function(index){
return parent.options.item(index)
}
this.get_namedItem=function(name){
return parent.options.namedItem(name)
}
this.get_remove=function(arg){parent.options.remove(arg)}
}
function $Location(){
var obj=new object()
for(var x in window.location){obj[x]=window.location[x]}
obj.__class__=new $class(this,'Location')
obj.toString=function(){return window.location.toString()}
return obj
}
function JSObject(obj){
return new $JSObject(obj)
}
JSObject.__class__=$type
JSObject.__str__=function(){return "<class 'JSObject'>"}
JSObject.toString=JSObject.__str__
function $JSObject(js){
this.js=js
this.__class__=JSObject
this.__str__=function(){return "<object 'JSObject'>"}
this.toString=this.__str__
}
$JSObject.prototype.__getattr__=function(attr){
var obj=this
if(obj.js[attr]!==undefined){
var obj=this.js,obj_attr=this.js[attr]
if(typeof this.js[attr]=='function'){
return function(){
var args=[]
for(var i=0;i<arguments.length;i++){args.push(arguments[i])}
var res=obj_attr.apply(obj,args)
if(typeof res=='object'){return new $JSObject(res)}
else if(res===undefined){return None}
else{return $JS2Py(res)}
}
}else if(obj===window && attr==='location'){
return $Location()
}else{
return $JS2Py(this.js[attr])
}
}else{
$raise("AttributeError","no attribute "+attr)
}
}
$JSObject.prototype.__setattr__=function(attr,value){
if(isinstance(value,JSObject)){
this.js[attr]=value.js
}else{
this.js[attr]=value
}
}
function $Location(){
var obj=new object()
for(var x in window.location){obj[x]=window.location[x]}
obj.__class__=new $class(this,'Location')
obj.toString=function(){return window.location.toString()}
return obj
}
win=new $JSObject(window)
$events=$List2Dict('onabort','onactivate','onafterprint','onafterupdate',
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
'onselectstart','onstart','onstop','onsubmit','onunload',
'ontouchstart','ontouchmove','ontouchend'
)
function DOMNode(){}
function $DOMNode(elt){
if(!('$brython_id' in elt)){
elt.$brython_id=Math.random().toString(36).substr(2, 8)
for(var attr in DOMNode.prototype){elt[attr]=DOMNode.prototype[attr]}
elt.__str__=$DOMtoString
elt.toString=elt.__str__
}
return elt
}
DOMNode.prototype.__add__=function(other){
var res=$TagSum()
res.children=[this]
if(isinstance(other,$TagSum)){
for(var $i=0;$i<other.children.length;$i++){res.children.push(other.children[$i])}
}else if(isinstance(other,[str,int,float,list,dict,set,tuple])){
res.children.push(document.createTextNode(str(other)))
}else{res.children.push(other)}
return res
}
DOMNode.prototype.__class__=DOMObject
DOMNode.prototype.__delitem__=function(key){
if(this.nodeType===9){
var res=document.getElementById(key)
if(res){res.parentNode.removeChild(res)}
else{$raise("KeyError",key)}
}else{
this.removeChild(this.childNodes[key])
}
}
DOMNode.prototype.__eq__=function(other){
if('isEqualNode' in this){return this.isEqualNode(other)}
else if('$brython_id' in this){return this.$brython_id===other.$brython_id}
else{$raise('NotImplementedError','__eq__ is not implemented')}
}
DOMNode.prototype.__getattr__=function(attr){
if('get_'+attr in this){return this['get_'+attr]()}
return $getattr(this,attr)
}
DOMNode.prototype.__getitem__=function(key){
if(this.nodeType===9){
if(typeof key==="string"){
var res=document.getElementById(key)
if(res){return $DOMNode(res)}
else{$raise("KeyError",key)}
}else{
try{
var elts=document.getElementsByTagName(key.name),res=[]
for(var $i=0;$i<elts.length;$i++){res.push($DOMNode(elts[$i]))}
return res
}catch(err){
$raise("KeyError",str(key))
}
}
}else{
return $DOMNode(this.childNodes[key])
}
}
DOMNode.prototype.__in__=function(other){return other.__contains__(this)}
DOMNode.prototype.__item__=function(key){
return $DOMNode(this.childNodes[key])
}
DOMNode.prototype.__le__=function(other){
var obj=this
if(this.nodeType===9){obj=this.body}
if(isinstance(other,$TagSum)){
var $i=0
for($i=0;$i<other.children.length;$i++){
obj.appendChild(other.children[$i])
}
}else if(typeof other==="string" || typeof other==="number"){
var $txt=document.createTextNode(other.toString())
obj.appendChild($txt)
}else{
obj.appendChild(other)
}
}
DOMNode.prototype.__len__=function(){return this.childNodes.length}
DOMNode.prototype.__mul__=function(other){
if(isinstance(other,int)&& other.valueOf()>0){
var res=$TagSum()
for(var i=0;i<other.valueOf();i++){
var clone=this.get_clone()()
res.children.push(clone)
}
return res
}else{
$raise('ValueError',"can't multiply "+this.__class__+"by "+other)
}
}
DOMNode.prototype.__ne__=function(other){return !this.__eq__(other)}
DOMNode.prototype.__radd__=function(other){
var res=$TagSum()
var txt=document.createTextNode(other)
res.children=[txt,this]
return res 
}
DOMNode.prototype.__setattr__=function(attr,value){
if(attr.substr(0,2)=='on'){
if(window.addEventListener){
var callback=function(ev){return value($DOMEvent(ev))}
this.addEventListener(attr.substr(2),callback)
}else if(window.attachEvent){
var callback=function(ev){return value($DOMEvent(window.event))}
this.attachEvent(attr,callback)
}
}else if('set_'+attr in this){return this['set_'+attr](value)}
else if(attr in this){this[attr]=value}
else{setattr(this,attr,value)}
}
DOMNode.prototype.__setitem__=function(key,value){
this.childNodes[key]=value
}
DOMNode.prototype.get_get=function(){
if(this.getElementsByName!==undefined){
return function(){
var $ns=$MakeArgs('get',arguments,[],{},null,'kw')
if('name'.__in__($ns['kw'])){
var res=[]
var node_list=document.getElementsByName($ns['kw'].__getitem__('name'))
if(node_list.length===0){return[]}
for(var i=0;i<node_list.length;i++){
res.push($DOMNode(node_list[i]))
}
}
if('id'.__in__($ns['kw'])){
var id_res=document.getElementById($ns['kw'].__getitem__('id'))
alert(id_res)
if(!id_res){alert('empty');return[]}
else{
var elt=$DOMNode(id_res)
if(res===undefined){res=[elt]}
else{
flag=false
for(var i=0;i<res.length;i++){
if(elt.__eq__(res[i])){flag=true;break}
}
if(!flag){return[]}
}
}
}
if('selector'.__in__($ns['kw'])){
var node_list=document.querySelectorAll($ns['kw'].__getitem__('selector'))
var sel_res=[]
if(node_list.length===0){return[]}
for(var i=0;i<node_list.length;i++){
sel_res.push($DOMNode(node_list[i]))
}
if(res===undefined){return sel_res}
var to_delete=[]
for(var i=0;i<res.length;i++){
var elt=res[i]
flag=false
for(var j=0;j<sel_res.length;j++){
if(elt.__eq__(sel_res[j])){flag=true;break}
}
if(!flag){to_delete.push(i)}
}
for(var i=to_delete.length-1;i>=0;i--){
res.splice(to_delete[i],1)
}
return res
}
return res
}
}
}
DOMNode.prototype.get_clone=function(){
res=$DOMNode(this.cloneNode(true))
for(var evt in $events){
if(this[evt]){res[evt]=this[evt]}
}
var func=function(){return res}
return func
}
DOMNode.prototype.get_remove=function(){
var obj=this
return function(child){obj.removeChild(child)}
}
DOMNode.prototype.get_getContext=function(){
if(!('getContext' in this)){$raise('AttributeError',
"object has no attribute 'getContext'")}
var obj=this
return function(ctx){return new $JSObject(obj.getContext(ctx))}
}
DOMNode.prototype.get_parent=function(){
if(this.parentElement){return $DOMNode(this.parentElement)}
else{return None}
}
DOMNode.prototype.get_options=function(){
return new $OptionsClass(this)
}
DOMNode.prototype.get_left=function(){
return int($getPosition(this)["left"])
}
DOMNode.prototype.get_top=function(){
return int($getPosition(this)["top"])
}
DOMNode.prototype.get_children=function(){
var res=[]
for(var i=0;i<this.childNodes.length;i++){
res.push($DOMNode(this.childNodes[i]))
}
return res
}
DOMNode.prototype.get_reset=function(){
var $obj=this
return function(){$obj.reset()}
}
DOMNode.prototype.get_style=function(){
return new $JSObject(this.style)
}
DOMNode.prototype.set_style=function(style){
for(var i=0;i<style.$keys.length;i++){
this.style[style.$keys[i]]=style.$values[i]
}
}
DOMNode.prototype.get_submit=function(){
var $obj=this
return function(){$obj.submit()}
}
DOMNode.prototype.get_text=function(){
return this.innerText || this.textContent
}
DOMNode.prototype.get_html=function(){return this.innerHTML}
DOMNode.prototype.get_value=function(value){return this.value}
DOMNode.prototype.set_html=function(value){this.innerHTML=str(value)}
DOMNode.prototype.set_text=function(value){
this.innerText=str(value)
this.textContent=str(value)
}
DOMNode.prototype.set_value=function(value){this.value=value.toString()}
doc=$DOMNode(document)
function $Tag(tagName,args){
var $i=null
var elt=null
var elt=$DOMNode(document.createElement(tagName))
elt.parent=this
if(args!=undefined && args.length>0){
$start=0
$first=args[0]
if(!isinstance($first,$Kw)){
$start=1
if(isinstance($first,[str,int,float])){
txt=document.createTextNode($first.toString())
elt.appendChild(txt)
}else if(isinstance($first,$TagSum)){
for($i=0;$i<$first.children.length;$i++){
elt.appendChild($first.children[$i])
}
}else{
try{elt.appendChild($first)}
catch(err){$raise('ValueError','wrong element '+$first)}
}
}
for($i=$start;$i<args.length;$i++){
$arg=args[$i]
if(isinstance($arg,$Kw)){
if($arg.name.toLowerCase().substr(0,2)==="on"){
eval('elt.'+$arg.name.toLowerCase()+'=function(){'+$arg.value+'}')
}else if($arg.name.toLowerCase()=="style"){
elt.set_style($arg.value)
}else{
if($arg.value!==false){
try{
elt.setAttribute($arg.name.toLowerCase(),$arg.value)
}catch(err){
$raise('ValueError',"can't set attribute "+$arg.name)
}
}
}
}
}
}
return elt
}
function $TagSumClass(){
this.__class__=$TagSum
this.children=[]
}
$TagSumClass.prototype.appendChild=function(child){
this.children.push(child)
}
$TagSumClass.prototype.__add__=function(other){
if(isinstance(other,$TagSum)){
this.children=this.children.concat(other.children)
}else if(isinstance(other,str)){
this.children=this.children.concat(document.createTextNode(other))
}else{this.children.push(other)}
return this
}
$TagSumClass.prototype.__radd__=function(other){
var res=$TagSum()
res.children=this.children.concat(document.createTextNode(other))
return res
}
$TagSumClass.prototype.clone=function(){
var res=$TagSum(), $i=0
for($i=0;$i<this.children.length;$i++){
res.children.push(this.children[$i].cloneNode(true))
}
return res
}
function $TagSum(){
return new $TagSumClass()
}
function A(){return $Tag('A',arguments)}
var $src=A+'' 
$tags=['A', 'ABBR', 'ACRONYM', 'ADDRESS', 'APPLET',
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
$tags=$tags.concat(['ARTICLE','ASIDE','FIGURE','FOOTER','HEADER','NAV',
'SECTION','AUDIO','VIDEO','CANVAS','COMMAND','DATALIST',
'DETAILS','OUTPUT','PROGRESS','HGROUP','MARK','METER','TIME',
'RP','RT','RUBY'])
for($i=0;$i<$tags.length;$i++){
$code=$src.replace(/A/gm,$tags[$i])
eval($code)
eval($tags[$i]+'.name="'+$tags[$i]+'"')
}
SVG={
__getattr__:function(attr){return this[attr]}
}
$svgNS="http://www.w3.org/2000/svg"
$xlinkNS="http://www.w3.org/1999/xlink"
function $SVGTag(tag_name,args){
var $i=null
var $obj=this
elt=$DOMNode(document.createElementNS($svgNS,tag_name))
if(args!=undefined && args.length>0){
$start=0
$first=args[0]
if(!isinstance($first,$Kw)){
$start=1
if(isinstance($first,[str,int,float])){
txt=document.createTextNode(str($first))
elt.appendChild(txt)
}else if(isinstance($first,$AbstractTag)){
for($i=0;$i<$first.children.length;$i++){
elt.appendChild($first.children[$i])
}
}else{
try{elt.appendChild($first)}
catch(err){$raise('ValueError','wrong element '+$first)}
}
}
for($i=$start;$i<args.length;$i++){
$arg=args[$i]
if(isinstance($arg,$Kw)){
if($arg.name.toLowerCase()in $events){
eval('elt.'+$arg.name.toLowerCase()+'=function(){'+$arg.value+'}')
}else if($arg.name.toLowerCase()=="style"){
elt.set_style($arg.value)
}else if($arg.name.toLowerCase().indexOf("href")!==-1){
elt.setAttributeNS("http://www.w3.org/1999/xlink","href",$arg.value)
}else{
if($arg.value!==false){
elt.setAttributeNS(null,$arg.name.replace('_','-'),$arg.value)
}
}
}
}
}
return elt
}
var $svg_tags=['a',
'altGlyph',
'altGlyphDef',
'altGlyphItem',
'animate',
'animateColor',
'animateMotion',
'animateTransform',
'circle',
'clipPath',
'color_profile', 
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
$svg=function(){return $SVGTag('X',arguments)}
$svg +='' 
for(var i=0;i<$svg_tags.length;i++){
var tag=$svg_tags[i]
eval('SVG.'+tag+'='+$svg.replace('X',tag))
}
function $LocalStorageClass(){
this.__class__='localStorage'
this.supported=typeof(Storage)!=="undefined"
this.__delitem__=function(key){
if(this.supported){localStorage.removeItem(key)}
else{$raise('NameError',"local storage is not supported by this browser")}
}
this.__getitem__=function(key){
if(this.supported){
res=localStorage[key]
if(res===undefined){return None}
else{return res}
}
else{$raise('NameError',"local storage is not supported by this browser")}
}
this.__setitem__=function(key,value){
if(this.supported){localStorage[key]=value}
else{$raise('NameError',"local storage is not supported by this browser")}
}
}
local_storage=new $LocalStorageClass()
