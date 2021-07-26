const nodemailer = require('nodemailer')

const configuracaoEmailProducao = {
  host: process.env.EMAIL_HOST,
  auth: {
    user: process.env.EMAIL_USUARIO,
    pass: process.env.EMAIL_SENHA
  },
  secure: true
}

const configuracaoEmailTeste = (contaTeste) => ({
  host: 'smtp.ethereal.email',
  auth: contaTeste
})

async function criaConfiguracaoEmail () {
  if (process.env.NODE_ENV === 'production') {
    return configuracaoEmailProducao
  } else {
    const contaTeste = await nodemailer.createTestAccount()
    return configuracaoEmailTeste(contaTeste)
  }
}

class Email {
  async enviaEmail () {
    const configuracaoEmail = await criaConfiguracaoEmail()
    const transportador = nodemailer.createTransport(configuracaoEmail)
    const info = await transportador.sendMail(this)

    if (process.env.NODE_ENV !== 'production') {
      console.log('URL: ' + nodemailer.getTestMessageUrl(info))
    }
  }
}

class EmailVerificacao extends Email {
  constructor (usuario, endereco) {
    super()
    this.from = '"Blog do Código" <noreply@blogdocodigo.com.br>'
    this.to = usuario.email
    this.subject = 'Verificação de e-mail'
    this.text = `Olá! Verifique seu e-mail aqui: ${endereco}`
    this.html = `<h1>Olá!</h1> Verifique seu e-mail aqui: <a href="${endereco}">${endereco}</a>`
  }
}

class EmailRedefinicaoSenha extends Email {
  constructor (usuario, token) {
    super()
    this.from = '"Blog do Código" <noreply@blogdocodigo.com.br>'
    this.to = usuario.email
    this.subject = 'Redefinição de senha'
    this.text = `Olá! Você solicitou redefinição da sua senha. Use o token a seguir: ${token}`
    this.html = `<h1>Olá!</h1> Você solicitou redefinição da sua senha. Use o token a seguir: ${token}`
  }
}

class EmailPostCriado extends Email {
  constructor(usuario, id, titulo) {
    super()
    this.from = '"Blog do Código" <noreply@blogdocodigo.com.br>'
    this.to = usuario.email
    this.subject = 'Post criado com sucesso!'
    this.text = `Olá! O post '${titulo}' foi criado com sucesso! Você pode consulta-lo buscando pelo id ${id}.`
    this.html = `<h1>Olá!</h1> O post '${titulo}' foi criado com sucesso! Você pode consulta-lo buscando pelo id ${id}.`
  }
}

module.exports = { EmailVerificacao, EmailRedefinicaoSenha, EmailPostCriado }
