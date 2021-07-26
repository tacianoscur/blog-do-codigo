const Usuario = require('./usuarios-modelo')
const { NotFound, InvalidArgumentError } = require('../erros')

const tokens = require('./tokens')
const { EmailVerificacao, EmailRedefinicaoSenha } = require('./emails')
const { ConversorUsuario } = require('../conversores')

function geraEndereco (rota, token) {
  const baseURL = process.env.BASE_URL
  return `${baseURL}${rota}${token}`
}

module.exports = {
  async adiciona (req, res, next) {
    const { nome, email, senha, cargo } = req.body

    try {
      const usuario = new Usuario({
        nome,
        email,
        emailVerificado: false,
        cargo
      })
      await usuario.adicionaSenha(senha)
      await usuario.adiciona()

      const token = tokens.verificacaoEmail.cria(usuario.id)
      const endereco = geraEndereco('/usuario/verifica_email/', token)
      const emailVerificacao = new EmailVerificacao(usuario, endereco)
      emailVerificacao.enviaEmail()

      res.status(201).json()
    }
    catch (error) {
      next(error);
    }
  },

  async login (req, res, next) {
    try {
      const accessToken = tokens.access.cria(req.user.id)
      const refreshToken = await tokens.refresh.cria(req.user.id)
      res.set('Authorization', accessToken)
      res.status(200).json({ refreshToken })
    }
    catch (error) {
      next(error);
    }
  },

  async logout (req, res, next) {
    try {
      const token = req.token
      await tokens.access.invalida(token)
      res.status(204).json()
    }
    catch (error) {
      next(error);
    }
  },

  async lista (req, res, next) {
    try {
      const usuarios = await Usuario.lista()
      const conversor = new ConversorUsuario('json', req.acesso.todos.permitido ? req.acesso.todos.atributos : req.acesso.apenasSeu.atributos)

      res.send(conversor.converter(usuarios))
    }
    catch (error) {
      next(error);
    }
  },

  async verificaEmail (req, res, next) {
    try {
      const usuario = req.user
      await usuario.verificaEmail()
      res.status(200).json()
    } 
    catch (error) {
      next(error);
    }
  },

  async deleta (req, res, next) {
    try {
      const usuario = await Usuario.buscaPorId(req.params.id)
      await usuario.deleta()
      res.status(200).json()
    }
    catch (error) {
      next(error);
    }
  },

  async esqueciMinhaSenha (req, res, next) {
    const resPadrao = { mensagem: 'Se enconstrarmos um usuário com este e-mail, vamos enviar uma mensagem com as instruções para redefinir a senha.' };
    try {
      const email = req.body.email;
      const usuario = await Usuario.buscaPorEmail(email);
      const token = await tokens.redefinicaoSenha.cria(usuario.id);

      const emailRedefinicaoSenha = new EmailRedefinicaoSenha(usuario, token);
      await emailRedefinicaoSenha.enviaEmail();

      res.send(resPadrao);
    }
    catch (error) {
      if (error instanceof NotFound) {
        res.send(resPadrao);
        return;
      }
      next(error);
    }
  },

  async trocarSenha (req, res, next) {
    try {
      const { token, senha } = req.body;
      if (typeof token !== 'string' && token === 0) {
        throw new InvalidArgumentError('O token está inválido!');
      }

      const id = await tokens.redefinicaoSenha.verifica(token);
      const usuario = await Usuario.buscaPorId(id);

      await usuario.adicionaSenha(senha);
      await usuario.atualizarSenha(senha, id);
      res.send({ mensagem: 'Sua senha foi atualizada com sucesso!' })
    }
    catch(error) {
      next(error);
    }
  }
}
