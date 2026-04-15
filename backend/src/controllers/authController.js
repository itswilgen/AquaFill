const BaseController = require('../core/BaseController');

class AuthController extends BaseController {
  constructor({ authService }) {
    super();
    this.authService = authService;
  }

  login = async (req, res) => {
    const result = await this.authService.login(req.body || {});
    return res.json({ success: true, ...result });
  };

  register = async (req, res) => {
    const { id } = await this.authService.register(req.body || {});
    return this.created(res, { message: 'User created', id });
  };

  googleLogin = async (req, res) => {
    const result = await this.authService.googleLogin(req.body || {});
    return res.json({ success: true, ...result });
  };
}

module.exports = AuthController;
