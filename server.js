const express = require('express');
const path = require('path');
const httpProxy = require('http-proxy');
const app = express();
const port = process.env.PORT || 3000;
const apiProxy = httpProxy.createProxyServer();

apiProxy.on('error', (err, req, res) => {
    console.log(err);
    res.status(500).send('Proxy error.');
});

app.all('/api/*', (req, res) => {
    console.log(req.path);
    apiProxy.web(req, res, { target: 'http://localhost:4000' });
});

app.use(express.static(path.join(__dirname, 'build')));
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});