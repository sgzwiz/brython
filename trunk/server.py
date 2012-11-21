import http.server
server_address = ('', 8000)
handler = http.server.CGIHTTPRequestHandler
httpd = http.server.HTTPServer(server_address, handler)
print("server running on port %s" %server_address[1])
httpd.serve_forever()
