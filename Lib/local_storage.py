# local storage in browser

class LocalStorage:

    def __init__(self):
        if not __BRYTHON__.has_local_storage:
            raise NameError('local storage is not supported by the browser')
        self.store = __BRYTHON__.local_storage()
        
    def __delitem__(self,key):
        self.store.removeItem(key)

    def __getitem__(self,key):
        return self.store.getItem(key) or None

    def __setitem__(self,key,value):
        self.store.setItem(key,value)

storage = LocalStorage()
