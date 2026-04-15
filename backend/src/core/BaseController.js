class BaseController {
  ok(res, data, status = 200) {
    return res.status(status).json({ success: true, data });
  }

  created(res, payload) {
    return res.status(201).json({ success: true, ...payload });
  }

  message(res, message, status = 200, extra = {}) {
    return res.status(status).json({ success: true, message, ...extra });
  }
}

module.exports = BaseController;
