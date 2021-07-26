const passport = require('passport')
const Usuario = require('./usuarios-modelo')
const tokens = require('./tokens')

module.exports = {
  local (req, res, next) {
    passport.authenticate(
      'local',
      { session: false },
      (error, usuario, info) => {
        if (error) {
          return next(error);
        }

        req.user = usuario
        req.isAuth = true
        return next()
      }
    )(req, res, next)
  },

  bearer (req, res, next) {
    passport.authenticate(
      'bearer',
      { session: false },
      (error, usuario, info) => {
        if (error) {
          return next(error);
        }

        req.token = info.token
        req.user = usuario
        req.isAuth = true
        return next()
      }
    )(req, res, next)
  },

  async refresh (req, res, next) {
    try {
      const { refreshToken } = req.body
      const id = await tokens.refresh.verifica(refreshToken)
      await tokens.refresh.invalida(refreshToken)
      req.user = await Usuario.buscaPorId(id)
      return next()
    } catch (error) {
      next(error);
    }
  },

  async verificacaoEmail (req, res, next) {
    try {
      const { token } = req.params
      const id = await tokens.verificacaoEmail.verifica(token)
      const usuario = await Usuario.buscaPorId(id)
      req.user = usuario
      next()
    } catch (error) {
      next(error);
    }
  }
}
