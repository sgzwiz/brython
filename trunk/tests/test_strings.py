# strings
log('spam eggs')
log('doesn\'t')
log("doesn't")
log('"Yes," he said.')
log("\"Yes,\" he said.")
log('"Isn\'t," she said.')
hello = "This is a rather long string containing\n\
several lines of text just as you would do in C.\n\
    Note that whitespace at the beginning of the line is\
 significant."
log(hello)
log("""\
Usage: thingy [OPTIONS]
     -h                        Display this usage message
     -H hostname               Hostname to connect to
""")
hello = r"This is a rather long string containing\n\
several lines of text much as you would do in C."
log(hello)

word = 'Help' + 'A'
log(word)
log('<' + word*5 + '>')

log('str' 'ing')
log('str'.strip() + 'ing')

# string methods
x='fooss'
log(x.replace('o','X',20))
log('GhFF'.lower())
log(x.lstrip('of'))
x='aZjhkhZyuy'
log(x.find('Z'))
log(x.rfind('Z'))
log(x.rindex('Z'))
try:
    log(x.rindex('K'))
except ValueError:
    log('erreur')
log(x.split('h'))
log(x.split('h',1))
log(x.startswith('aZ'))
log(x.strip('auy'))
log(x.upper())
