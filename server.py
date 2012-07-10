import http.server
server_address = ('', 8000)
handler = http.server.CGIHTTPRequestHandler
handler.cgi_directories = ['/test/cgi-bin']
httpd = http.server.HTTPServer(server_address, handler)
httpd.serve_forever()
