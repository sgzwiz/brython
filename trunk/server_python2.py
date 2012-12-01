import CGIHTTPServer,BaseHTTPServer
server_address = ('', 8000)
handler = CGIHTTPServer.CGIHTTPRequestHandler
httpd = BaseHTTPServer.HTTPServer(server_address, handler)
print("server running on port %s" %server_address[1])
httpd.serve_forever()
