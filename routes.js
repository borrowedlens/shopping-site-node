// const fs = require('fs');

// const requestHandler = (req, res) => {
//     const url = req.url;
//     const method = req.method;
//     if (url === '/') {
//         res.write(
//             '<html><header><title>nodejs</title></header><body><form action="/message" method="POST"><input type="text" name="message" /><button type="submit">Send message</button></form></body></html>'
//         );
//         return res.end();
//     }
//     if (url === '/message' && method === 'POST') {
//         const body = [];
//         req.on('data', chunk => {
//             body.push(chunk);
//             console.log('body', chunk);
//         });
//         return req.on('end', () => {
//             const parsedBody = Buffer.concat(body).toString();
//             console.log('parsedBody', parsedBody);
//             const message = parsedBody.split('=')[1];
//             fs.writeFile('message.txt', message, err => {
//                 res.statusCode = 302;
//                 res.setHeader('Location', '/');
//                 res.end();
//             });
//         });
//     }
//     res.setHeader('Content-Type', 'text/html');
//     res.write(
//         '<html><header><title>My Node.js App</title></header><body><h1>Hello from the Node.js App</h1></body></html>'
//     );
//     res.end();
// };

// // module.exports = requestHandler;
// // module.exports = {
// //     handler: requestHandler,
// //     someText: 'Some text to be handled'
// // };
// exports.handler = requestHandler;
// exports.someText = 'Some random text to be handled';
