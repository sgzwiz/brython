import http.server
server_address = ('', 8000)
handler = http.server.CGIHTTPRequestHandler
httpd = http.server.HTTPServer(server_address, handler)
print("server running on port 8000")
httpd.serve_forever()
