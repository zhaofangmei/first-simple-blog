const crypto = require('crypto');
const User = require('../models/user.js');
const Post = require('../models/post.js');
const Comment = require('../models/comment.js');
const multer = require('multer');
const formidable = require('formidable');

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
    let query = {
      name: null,
      pageSize: 5,
      pageIndex: parseInt(req.query.page) || 1
    }
    Post.getPage(query, function (err, posts, sumResults) {
      if (err) {
        posts = [];
      }
      posts.forEach(post => {
        post.comments = JSON.parse(post.comments);
        post.reprint_info = JSON.parse(post.reprint_info);
      });
      let total = sumResults[0].sum || 0;
      res.render('index', {
        title: '主页',
        user: req.session.user,
        posts: posts,
        pageIndex: query.pageIndex,
        isFirstPage: (query.pageIndex - 1) == 0,
        isLastPage: ((query.pageIndex - 1) * query.pageSize + posts.length) == total,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  /**
   *登录
   */
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
        if(req.session && req.session.user) delete req.session.user;
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

      newUser.save((err, user) => {
        if (err) {
          req.flash('error', err);
          return res.redirect('/reg'); //注册失败返回注册页
        }
        req.session.user = user; //用户信息存入 session
        req.flash('success', '注册成功!');
        res.redirect('/'); //注册成功后返回主页
      });
    });
  });

  /**
   * 发表
   */
  app.get('/post', checkLogin);
  app.get('/post', function (req, res) {
    Post.getTags(function(error, tags) {
      if (error) {
        req.flash('error', error);
        tags = [];
      }
      res.render('post', {
        title: '发表',
        user: req.session.user,
        tags: tags,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.post('/post', checkLogin);
  app.post('/post', function (req, res) {
    let user = req.session.user;
    let title = req.body.title;
    if(!title) {
      req.flash('error', '标题不可为空!');
      return res.redirect('/post');
    }
    let post = new Post(user.user_name, title, user.head, req.body.tag, req.body.post);

    User.get(user.user_name, (err, users) => {
      if (!users || users.length <= 0) {
        req.flash('error', '用户不存在!');
        if(req.session && req.session.user) delete req.session.user;
        return res.redirect('/login');
      }

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

  });

  /**
   *登出
   */
  app.get('/logout', checkLogin);
  app.get('/logout', function (req, res) {
    req.session.user = null;
    delete req.session.detailAsk;
    req.flash('success', '登出成功!');
    res.redirect('/'); //登出成功后跳转到主页
  });

  /**
   * 博客--搜索
   */
  app.get('/search', checkLogin);
  app.get('/search', function (req, res) {
    Post.search(req.query.keyword, function (err, posts) {
      if (err) {
        req.flash('error', err); 
        return res.redirect('/');
      }
      res.render('search', {
        title: "SEARCH:" + req.query.keyword,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
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
        if(req.session && req.session.user) delete req.session.user;
        return res.redirect('/login');
      }
      let query = {
        name: userName,
        pageIndex: parseInt(req.query.page) || 1,
        pageSize: 5
      }
      Post.getPage(query, (err, posts, sumResults) => {
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        posts.forEach((post) => {
          post.reprint_info = JSON.parse( post.reprint_info);
        });
        let total = sumResults[0].sum || 0;
        res.render('user', {
          title: users[0].user_name,
          posts: posts,
          user: req.session.user,
          pageIndex: query.pageIndex,
          isFirstPage: (query.pageIndex - 1) == 0,
          isLastPage: ((query.pageIndex - 1) * query.pageSize + posts.length) == total,
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
    let path = req.path;
    query.aginAsk = false;
    if(!req.session.detailAsk) {
      req.session.detailAsk = [];
    } else {
      req.session.detailAsk.forEach((ask) => {
        if(path == ask) {
          query.aginAsk = true;
          return;
        } 
      });
    }
    Post.getOne(query, (err, posts) => {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      if(posts && posts.length > 0) {
        if(!query.aginAsk) req.session.detailAsk.push(path);
        posts.forEach((post) => {
          post.reprint_info = JSON.parse(post.reprint_info);
        });
        res.render('article', {
          title: query.title,
          post: posts[0],
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      } else {
        req.flash('error', '该文章已不存在！');
        return res.redirect('/');
      }
    });
  });
  
  /**
   *博客留言
   */
  app.post('/user/:name/:time/:title', checkLogin);
  app.post('/user/:name/:time/:title', function (req, res) {
    var md5 = crypto.createHash('md5'),
    email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
    head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"; 
    let comment = {
      user_name: req.body.name,
      create_time: new Date().getTime(),
      website: req.body.website,
      head: head,
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
        let userName = req.session.user.user_name;
        Post.getTagsByName(userName, function(error, tags) {
          if (error) {
            req.flash('error', error);
            tags = [];
          }
          res.render('edit', {
            title: '编辑',
            post: posts[0],
            tags: tags,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
          });
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
        return res.redirect('back');
      }
      if(success == 'success') {
        req.flash('success','刪除成功！');
        return res.redirect('/');
      } else {
        req.flash('error','无权限！');
        return res.redirect('back');
      }
    });
  });
  
  /**
   * 博客--转载
   */
  app.get('/reprint/:name/:time/:title', checkLogin);
  app.get('/reprint/:name/:time/:title', function (req, res) {
    let query = {
      name: req.params.name,
      time: req.params.time,
      title: req.params.title
    }
    Post.edit(query, (err, posts) => {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      if (posts && posts.length > 0) {
        let post = posts[0];
        let currentUser = req.session.user;
        let reprint_from = {name: post.user_name, time: post.create_time, title: post.title};
        let reprint_to = {name: currentUser.user_name, head: currentUser.head};
        Post.reprint(reprint_from, reprint_to, function (err, post) {
          if (err) {
            req.flash('error', err); 
            return res.redirect('back');
          }
          req.flash('success', '转载成功!');
          return res.redirect('/');
        });

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

  /**
   * 标签列表
   */
  app.get('/tags', checkLogin);
  app.get('/tags', function(req, res) {
    Post.getTags((err, tags) => {
      if (err) {
        req.flash('error',err); 
        return res.redirect('/');
      }
      res.render('tags', {
        title: '标签',
        tags: tags,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });

  });

  /**
   * 标签对应的博客
   */
  app.get('/tags/:tag', checkLogin);
  app.get('/tags/:tag', function(req, res) {
    Post.getTag(req.params.tag, (err, posts) => {
      if (err) {
        req.flash('error',err); 
        return res.redirect('/');
      }
      res.render('tag', {
        title: 'TAG:' + req.params.tag,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });

  });

  /**
   * kindEdit 图片上传
   */
  app.post('/uploadImg',function(req,res,next) {
    var form = new formidable.IncomingForm();
    form.keepExtensions = true;     //设置该属性为true可以使得上传的文件保持原来的文件的扩展名。
    form.uploadDir=__dirname+'/../public/upload';   //设置上传文件存放的文件夹，默认为系统的临时文件夹，可以使用fs.rename()来改变上传文件的存放位置和文件名
    //form.parse(request, [callback]) 该方法会转换请求中所包含的表单数据，callback会包含所有字段域和文件信息
    form.parse(req,function(err, fields, files){
      if(err){
        throw err;
      }
      var image = files.imgFile;  //这是整个files流文件对象,是转换成有利于传输的数据格式
      var path = image.path;      //从本地上传的资源目录加文件名:如E:\\web\\blog\\upload\\upload_0a14.jpg
      /*下面这里是通过分割字符串来得到文件名*/
      var arr = path.split('\\');
      var name = arr[arr.length-1];
      var url = "/upload/" + name;
      var info = {"error": 0,"url": url};
      //info是用来返回页面的图片地址
      res.send(info);
    })
  });

  /**
   * 404
   */
  app.use(function (req, res) {
    res.render("404");
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