require('dotenv').config()

const app = require('./app')
const port = 3000
require('./database')
require('./redis/blocklist-access-token')
require('./redis/allowlist-refresh-token')

const { InvalidArgumentError, NotFound, NotAuthorized } = require('./src/erros')
const { ConversorErro } = require('./src/conversores')
const jwt = require('jsonwebtoken')

app.use((req, res, next) => {
    const accept = req.get('Accept');

    if (accept.indexOf('application/json') === -1 && accept !== '*/*') {
        res.status(406);
        res.end();
        return;
    }
    res.set({'Content-Type': 'application/json'});

    next();
})

const routes = require('./rotas')
routes(app)

app.use((error, req, res, next) => {
    let status = 500;

    const corpo = {
        mensagem: error.message
    };

    if (error instanceof InvalidArgumentError) {
        status = 400;
    }

    if (error instanceof jwt.JsonWebTokenError) {
        status = 401;
    }

    if (error instanceof jwt.TokenExpiredError) {
        status = 401;
        corpo.expiredAt = error.expiredAt;
    }

    if (error instanceof NotFound) {
        status = 404;
    }

    if (error instanceof NotAuthorized) {
        status = 401;
    }

    const conversor = new ConversorErro('json');
    res.send(conversor.converter(corpo));
});

app.listen(port, () => console.log('A API está funcionando!'))
