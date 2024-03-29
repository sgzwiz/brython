x = "zer"
assert x.capitalize() == "Zer"
assert str.capitalize(x) == "Zer"

x = "azert$t y t"
assert x.count('t')==3
assert str.count(x,'t')==3

assert x.endswith("y t")==True

assert x.find('t')==4
assert x.find('$')==5
assert x.find('p')==-1

assert x.index('t')==4

items = ['sd','kj']
assert '-'.join(items)=="sd-kj"

assert "ZER".lower()=="zer"

assert "azerty".lstrip('a')=="zerty"
assert "azerty".lstrip('za')=="erty"
assert "azaerty".lstrip('az')=="erty"

assert "$XE$".replace("$XE$", "!")=="!"
assert "$XE".replace("$XE", "!")=='!'
assert "XE$".replace("XE$", "!")=="!"
assert "XE$".replace("$", "!")=="XE!"
assert "$XE".replace("$", "!")=="!XE"
assert "?XE".replace("?", "!")=="!XE"
assert "XE?".replace("?", "!")=="XE!"
assert "XE!".replace("!", "?")=="XE?"

assert "azterty".find('t')==2
assert "azterty".rfind('t')==5
assert "azterty".rfind('p')==-1

assert "azterty".rindex('t')==5

try:
    "azterty".rindex('p')
except ValueError:
    pass

assert "azerty".rstrip('y')=="azert"
assert "azerty".rstrip('yt')=="azer"
assert "azeryty".rstrip('ty')=="azer"

assert "az er ty".split()==["az","er","ty"]
assert "azferfty".split('f')==["az","er","ty"]
assert "az\ner\nty".splitlines()==["az","er","ty"]

assert "azerty".startswith('az')

assert "  azerty ".strip() == "azerty"

assert "bghggbazertyhbg".strip("bhg") == "azerty"

assert "zer".upper() == "ZER"

print("passed all tests...")
