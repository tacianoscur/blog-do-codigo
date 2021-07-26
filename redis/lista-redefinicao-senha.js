const redis = require('redis');
const manipulaLista = require('./manipula-lista');
const listaRedefinicao = redis.createClient({ prefix: 'redefinicao-senha:' });
module.exports = manipulaLista(listaRedefinicao);