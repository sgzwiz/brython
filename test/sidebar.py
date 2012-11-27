def menu(title,links):
    # links is a list of tuples (name,href)
    res = B(title)
    for name,href in links:
        log('%s %s' %(name,href))
        res += BR()+A(name,href=href)
    return res