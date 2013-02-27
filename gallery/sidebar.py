from html import A,B,BR

def menu(title,links):
    # links is a list of tuples (name,href)
    res = B(title)
    for _name,href in links:
        res += BR()+A(_name,href=href)
    return res
