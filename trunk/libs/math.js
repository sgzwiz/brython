$module = {
    __getattr__ : function(attr){
        var res = this[attr]
        if(res===undefined){$raise('AttributeError','module has no attribute '+attr)}
        return res
    },
    acos: function(x) {return float(Math.acos(x))},
    acosh: function(x) { return Math.log(x + Math.sqrt(x*x-1))},
    asin: function(x) {return float(Math.asin(x))},
    asinh: function(x) { return Math.log(x + Math.sqrt(x*x+1))},
    atan: function(x) {return float(Math.atan(x))},
    atan2: function(y,x) {return float(Math.atan2(y,x))},
    atanh: function(x) { if (x==0) return 0;
       return 0.5 * Math.log((1/x+1)/(1/x-1))
    },
    ceil: function(x) {
       if (!isNaN(parseFloat(x)) && isFinite(x)) return int(Math.ceil(x));
       if (x.__ceil__ !== undefined) {return x.__ceil__()}
       
       $raise('ValueError', 'object is not a number and does not contain __ceil__')
    },
    copysign: function(x,y) { 
                  var sign=y ? y < 0 ? -1 : 1 : 1
                  return Math.abs(x) * sign 
    },
    cos : function(x){return float(Math.cos(x))},
    degrees: function(x){return x * 180/Math.PI},
    e: Math.E,
    erf: function(x) {
        // inspired from 
        // http://stackoverflow.com/questions/457408/is-there-an-easily-available-implementation-of-erf-for-python

    var t = 1.0 / (1.0 + 0.5 * Math.abs(x))
        var ans = 1 - t * Math.exp( -x*x - 1.26551223 +
                     t * ( 1.00002368 +
                     t * ( 0.37409196 + 
                     t * ( 0.09678418 + 
                     t * (-0.18628806 + 
                     t * ( 0.27886807 + 
                     t * (-1.13520398 + 
                     t * ( 1.48851587 + 
                     t * (-0.82215223 + 
                     t * 0.17087277)))))))))
        if (x >= 0.0) return ans

        return -ans
    },

    erfc: function(x) {
        // inspired from 
        // http://stackoverflow.com/questions/457408/is-there-an-easily-available-implementation-of-erf-for-python

    var t = 1.0 / (1.0 + 0.5 * Math.abs(x))
        var ans = 1 - t * Math.exp( -x*x - 1.26551223 +
                     t * ( 1.00002368 +
                     t * ( 0.37409196 + 
                     t * ( 0.09678418 + 
                     t * (-0.18628806 + 
                     t * ( 0.27886807 + 
                     t * (-1.13520398 + 
                     t * ( 1.48851587 + 
                     t * (-0.82215223 + 
                     t * 0.17087277)))))))))
        if (x >= 0.0) return 1-ans
        return 1+ans
    },
    exp: function(x){return float(Math.exp(x))},
    expm1: function(x){return float(Math.exp(x)-1)},
    fabs: function(x){ return x>0?float(x):float(-x)},
    factorial: function(x) {
         //using code from http://stackoverflow.com/questions/3959211/fast-factorial-function-in-javascript
         var r=1
         for (var i=2; i<=x; i++){r*=i}
         return r
    },
    floor:function(x){return Math.floor(x)},
    fmod:function(x,y){return float(x%y)},
    frexp:function(value){
        //copied from http://blog.coolmuse.com/2012/06/21/getting-the-exponent-and-mantissa-from-a-javascript-number/
        /*
         * Getting the exponent and mantissa from a JavaScript number
         * By Monroe Thomas http://blog.coolmuse.com
         *
         * MIT Licensed.
         *
         */

        //if ( typeof value !== "number" )
        //   throw new TypeError( "value must be a Number" );

        var result = {
            isNegative : false,
            exponent : 0,
            mantissa : 0
        }

        if ( value === 0 ) return result

        // not finite?
        if ( !isFinite( value ) ) {
           result.exponent = 2047
           if ( isNaN( value ) ) {
              result.isNegative = false
              result.mantissa = 2251799813685248 // QNan
           } else {
              result.isNegative = value === -Infinity
              result.mantissa = 0
           }
           return result
        }

        // negative?
        if (value < 0) {
           result.isNegative = true 
           value = -value
        }

        // calculate biased exponent
        var e = 0;
        if ( value >= Math.pow( 2, -1022 ) ) { // not denormalized
           // calculate integer part of binary logarithm
           // http://en.wikipedia.org/wiki/Binary_logarithm
           var r = value
           while (r<1) {e-=1; r*=2;}
           while (r>=2) {e+=1; r/=2;}
           e += 1023; // add bias
        }
        result.exponent = e;

        // calculate mantissa
        if ( e != 0 ) {
           var f = value/Math.pow(2,e-1023);
           result.mantissa = Math.floor( (f - 1) * Math.pow( 2, 52 ) );
        } else { // denormalized
           result.mantissa = Math.floor( value / Math.pow( 2, -1074 ) );
        }

        return new Array(result.mantissa, result.exponent);
    },
    //fsum:function(x){},
    gamma: function(x){
         //using code from http://stackoverflow.com/questions/3959211/fast-factorial-function-in-javascript
         // Lanczos Approximation of the Gamma Function
         // As described in Numerical Recipes in C (2nd ed. Cambridge University Press, 1992)

         var z = x + 1;
         var d1 = Math.sqrt(2 * Math.PI) / z;

         var d2 = 1.000000000190015;
         d2 +=  76.18009172947146 / (z+1);
         d2 += -86.50532032941677 / (z+2);
         d2 +=  24.01409824083091 / (z+3); 
         d2 += -1.231739572450155 / (z+4); 
         d2 +=  1.208650973866179E-3 / (z+5);
         d2 += -5.395239384953E-6 / (z+6);

         return d1 * d2 * Math.pow(z+5.5,z+0.5) * Math.exp(-(z+5.5));
    },
    hypot: function(x,y){return Math.sqrt(x*x + y*y)},
    isfinite:function(x) {return isFinite(x)},
    isinf:function(x) {return x == Number.POSITIVE_INFINITY || x == Number.NEGATIVE_INFINITY},
    isnan:function(x) {return isNan(x)},
    ldexp:function(x,i) {return x * Math.pow(2,i)},
    lgamma:function(x) {
         // see gamma function for sources

         var z = x + 1;
         var d1 = Math.sqrt(2 * Math.PI) / z;

         var d2 = 1.000000000190015;
         d2 +=  76.18009172947146 / (z+1);
         d2 += -86.50532032941677 / (z+2);
         d2 +=  24.01409824083091 / (z+3); 
         d2 += -1.231739572450155 / (z+4); 
         d2 +=  1.208650973866179E-3 / (z+5);
         d2 += -5.395239384953E-6 / (z+6);

         return Math.log(Math.abs(d1 * d2 * Math.pow(z+5.5,z+0.5) * Math.exp(-(z+5.5))));
    },
    log: function(x, base) {
         if (base === undefined) return Math.log(x);
         return Math.log(x)/Math.log(base);
    },
    logp1: function(x) {return Math.log(x) + 1},
    log2: function(x) { return Math.log(x)/Math.LN2},
    log10: function(x) { return Math.log(x)/Math.LN10},
    modf:function(x) {
       var i=float(Math.floor(x));
       return new Array(i, float(x-i));
    },
    pi : float(Math.PI),
    pow: function(x,y) {return Math.pow(x,y)},
    radians: function(x){return x * Math.PI/180},
    sin : function(x){return float(Math.sin(x))},
    sqrt : function(x){return float(Math.sqrt(x))},
    trunc: function(x) {
       if (!isNaN(parseFloat(x)) && isFinite(x)) return int(Math.floor(x));
       if (x.__trunc__ !== undefined) {return x.__trunc__()}
       
       $raise('ValueError', 'object is not a number and does not contain __trunc__')
    }
}

$module.__class__ = $module // defined in $py_utils
$module.__str__ = function(){return "<module 'math'>"}
