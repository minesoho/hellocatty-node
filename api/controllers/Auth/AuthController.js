/**
 * @module AuthContoller
 * @desc 验证(登录/注册)逻辑控制器
 */
var passport = require('passport'),
  swig = require('swig');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var transporter = nodemailer.createTransport(smtpTransport({
  host: 'smtp.163.com',
  secure: true,
  auth: {
    user: 'ihellocatty@163.com',
    pass: 'kcizecvxoydlslkd'
  }
}));
var rescode = sails.config.rescode;
module.exports = {
  /** @lends AuthContoller */
  /**
   * @desc 登录、注册的统一入口，由前端Backbone的hash路由判断展示表单
   */
  toAuth: function(req, res) {
    var view = swig.renderFile('./views/passport/main.swig');
    res.send(view);
  },
  // 处理注册逻辑
  processRegister: function(req, res) {
    // 由请求参数构造待创建User对象
    if (!req.param('authname')) {
      res.json({
        err: rescode.invalidAuthname,
        msg: "invalid authname"
      });
    }
    if (!req.param('email')) {
      res.json({
        err: rescode.invalidEmail,
        msg: "invalid email address"
      });
    }
    if (!req.param('password')) {
      res.json({
        err: rescode.invalidPwd,
        msg: "invalid password"
      });
    }
    var _date = new Date();
    var _user = {
      authname: req.param('authname'),
      nickname: req.param('authname'),
      email: req.param('email'),
      password: req.param('password'),
      regDate: _date
    };
    User.findOne({
      authname: _user.authname
    }, function(err, user) {
      if (err) {
        return res.json({
          code: rescode.dberror,
          msg: '数据库错误1'
        });
      }
      if (user) {
        return res.json({
          code: rescode.comflictAuthname,
          msg: '用户名已存在'
        });
      }
      User.create(_user).exec(function(err, created) {
        if (err) {
          console.error(err);
          // 如果有误，返回错误
          res.json({
            code: rescode.dberror,
            msg: '数据库错误2'
          });
        } else {
          // 否则，将新创建的用户登录
          req.login(created, function(err) {
            if (err) {
              return res.json({
                code: rescode.dberror,
                msg: '数据库错误3'
              });
            }
            return res.json({
              code: rescode.ok,
              msg: '注册成功'
            });
          });
        }
      });
    });
  },
  // 处理登陆逻辑
  processLogin: function(req, res) {
    // 使用本地验证策略对登录进行验证
    passport.authenticate('local', function(err, user, info) {
      if (err) {
        return res.json({
          code: rescode.error,
          msg: '操作失败，请重试'
        });
      }
      if (!user) {
        return res.json({
          code: rescode.notfound,
          msg: '用户不存在'
        });
      }
      req.logIn(user, function(err) {
        if (err) {
          res.json({
            code: rescode.error,
            msg: '操作失败，请重试'
          });
        }
        if (info.code === '100') {
          return res.redirect('/');
        } else {
          res.json({
            code: rescode.error,
            msg: '操作失败，请重试'
          });
        }
      });

    })(req, res);
  },
  // 处理登出逻辑
  logout: function(req, res) {
    req.logout();
    res.redirect('/');
  },
  // 发送账号激活邮件
  sendValidEmail: function(authname, mailto, token) {
    console.log('sendValidEmail');
    var mailOptions = {
      from: 'ihellocatty@163.com',
      to: mailto,
      subject: '请激活您的账号',
      html: '<div><a href=\'http://www.hellocatty.com/u/verify?user=' +
        authname + '&verify=' + token +
        '\' title=\'激活账号\'>点击链接激活您的账号</a></div>'
    };

    transporter.sendMail(mailOptions, function(err, info) {
      if (err) {
        return console.log(err);
      }
      console.log('send mail success:' + info.response);
    });
  }
};
