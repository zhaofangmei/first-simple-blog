const crypto = require('crypto');
const User = require('../models/user.js');
const Post = require('../models/post.js');
const Comment = require('../models/comment.js');
const multer = require('multer');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
var upload = multer({
  storage: storage
})

module.exports = function (app) {
  app.get('/', function (req, res) {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    Post.getAll(null, function (err, posts) {
      if (err) {
        posts = [];
      }
      res.render('index', {
        title: '主页',
        user: req.session.user,
        posts: posts,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  /**
   *登录
   */
  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
    res.render('login', {
      title: '登录',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
    let userName = req.body.name;
    let md5 = crypto.createHash('md5');
    let passWord = md5.update(req.body.password).digest('hex');

    User.get(userName, (err, users) => {
      if (!users || users.length <= 0) {
        req.flash('error', '用户不存在!');
        return res.redirect('/login');
      }
      if (users[0].pass_word != passWord) {
        req.flash('error', '密码错误!');
        return res.redirect('/login');
      }
      //用户名密码都匹配后，将用户信息存入 session
      req.session.user = users[0];
      req.flash('success', '登陆成功!');
      res.redirect('/'); //登陆成功后跳转到主页
    });

  });

  /**
   *注册
   */
  app.get('/reg', checkNotLogin);
  app.get('/reg', function (req, res) {
    res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  app.post('/reg', checkNotLogin);
  app.post('/reg', function (req, res) {
    let userName = req.body.name;
    let passWord = req.body.password;
    let email = req.body.email;
    let password_re = req.body['password-repeat'];
    //检验用户两次输入的密码是否一致
    if (password_re != passWord) {
      req.flash('error', '两次输入的密码不一致!');
      return res.redirect('/reg'); //返回注册页
    }

    //生成密码的 md5 值
    let md5 = crypto.createHash('md5');
    let password = md5.update(passWord).digest('hex');

    let newUser = new User({
      user_name: userName,
      pass_word: password,
      email: email
    });

    User.get(newUser.user_name, (err, users) => {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      if (users && users.length > 0) {
        req.flash('error', '用户已存在!');
        return res.redirect('/reg'); //返回注册页
      }

      newUser.save((err, success) => {
        if (err) {
          req.flash('error', err);
          return res.redirect('/reg'); //注册失败返回注册页
        }
        if (success == 'success') {
          req.session.user = newUser; //用户信息存入 session
          req.flash('success', '注册成功!');
          res.redirect('/'); //注册成功后返回主页
        }
      });
    });

  });

  /**
   * 发表
   */
  app.get('/post', checkLogin);
  app.get('/post', function (req, res) {
    res.render('post', {
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  app.post('/post', checkLogin);
  app.post('/post', function (req, res) {
    let user = req.session.user;
    let title = req.body.title;

    let post = new Post(user.user_name, title, req.body.post);

    post.save(function (error, success) {
      if (error) {
        req.flash('error', error);
        return res.redirect('/post');
      }
      if (success = 'success') {
        req.flash('success', '发布成功!');
        res.redirect('/'); //发表成功跳转到主页
      }
    });

  });

  /**
   *登出
   */
  app.get('/logout', checkLogin);
  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功!');
    res.redirect('/'); //登出成功后跳转到主页
  });

  /**
   * 该用户的所有博客
   */
  app.get('/user/:name', checkLogin);
  app.get('/user/:name', function (req, res) {
    let userName = req.params.name;
    User.get(userName, (err, users) => {
      if (!users || users.length <= 0) {
        req.flash('error', '用户不存在!');
        return res.redirect('/login');
      }
      Post.getAll(userName, (err, posts) => {
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        res.render('user', {
          title: users[0].user_name,
          posts: posts,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });
  });

  /**
   * 博客详情
   */
  app.get('/user/:name/:time/:title', checkLogin);
  app.get('/user/:name/:time/:title', function (req, res) {
    let query = req.params;
    Post.getOne(query, (err, posts) => {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('article', {
        title: query.title,
        post: posts[0],
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });

    });
  });
  app.post('/user/:name/:time/:title', checkLogin);
  app.post('/user/:name/:time/:title', function (req, res) {
    let comment = {
      user_name: req.body.name,
      create_time: new Date().getTime(),
      website: req.body.website,
      content: req.body.content
    }
    let newComment = new Comment(req.params.name, req.params.time, req.params.title, comment);

    newComment.save((err,success) => {
      if(err) {
        req.flash('error',err);
        return res.redirect('back');
      }
      if(success == 'success') {
        req.flash('success', '留言成功!');
      }
      res.redirect('back');
    });
  });

  /**
   * 博客--编辑
   */
  app.get('/edit/:name/:time/:title', checkLogin);
  app.get('/edit/:name/:time/:title', function (req, res) {
    let currentUser = req.session.user;
    let query = {
      name: currentUser.user_name,
      time: req.params.time,
      title: req.params.title
    };
    Post.edit(query, (err, posts) => {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      if (posts && posts.length > 0) {
        res.render('edit', {
          title: '编辑',
          post: posts[0],
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      } else {
        req.flash('error', '无权限！');
        return res.redirect('back');
      }

    });

  });
  app.post('/edit/:name/:time/:title', checkLogin);
  app.post('/edit/:name/:time/:title', function (req, res) {
    let query = {
      name: req.session.user.user_name,
      time: req.params.time,
      title: req.params.title,
      post: req.body.post
    }

    Post.update(query, function (err, success) {
      let url = encodeURI('/user/' + req.params.name + '/' + req.params.time + '/' + req.params.title);
      if (err) {
        req.flash('error', err);
        return res.redirect(url);
      }
      req.flash('success', '修改成功!');
      res.redirect(url);
    });


  });

  /**
   * 博客--删除
   */
  app.get('/remove/:name/:time/:title', checkLogin);
  app.get('/remove/:name/:time/:title', function (req, res) {
    let query = {
      name: req.session.user.user_name,
      time: req.params.time,
      title: req.params.title
    }
    Post.remove(query, (err, success) => {
      if(err) {
        req.flash('error',err);
        res.redirect('back');
      }
      if(success == 'success') {
        req.flash('success','刪除成功！');
      } else {
        req.flash('error','无权限！');
        res.redirect('back');
      }
    });
  });


  /**
   * 文件上传
   */
  app.get('/upload', checkLogin);
  app.get('/upload', function (req, res) {
    res.render('upload', {
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  app.post('/upload', checkLogin);
  app.post('/upload', upload.array('field1', 5), function (req, res) {
    req.flash('success', '文件上传成功!');
    res.redirect('/upload');
  });

  function checkLogin(req, res, next) {
    if (!req.session.user) {
      req.flash('error', '未登录!');
      return res.redirect('/login');
    }
    next(); //路由中间件
  }

  function checkNotLogin(req, res, next) {
    if (req.session.user) {
      req.flash('error', '已登录!');
      return res.redirect('back'); //返回之前的页面
    }
    next();
  }


}