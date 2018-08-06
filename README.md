推荐网址：

https://github.com/nswbmw/N-blog/blob/backup/book/%E7%AC%AC1%E7%AB%A0%20%E4%B8%80%E4%B8%AA%E7%AE%80%E5%8D%95%E7%9A%84%E5%8D%9A%E5%AE%A2.md

https://www.cnblogs.com/Darren_code/p/node_express.html

https://www.cnblogs.com/chyingp/p/express-multer-file-upload.html（文件上传multer）

 

1、工程结构

 

2、路由控制 ：Express封装了http的很多方法

路由句柄（路由中间件）：

　　next('route') 

响应方法：

　　res.render：渲染视图模板

　　res.redirect：重定向请求
 
3、模板引擎（ejs）

　　app.engine()方法

　　之前先看看express应用的安装命令:“express -e nodejs-product”，其中的 -e 和 -J 我们一开始已经提到，表示ejs和jade模板。

　　如果想把模板后缀改成“.html”时就会用到app.engine方法，来重新设置模板文件的扩展名，比如想用ejs模板引擎来处理“.html”后缀的文件：app.engine('.html', require('ejs').__express);

　　app.engine(ext, callback) 注册模板引擎的 callback 用来处理ext扩展名的文件。

　　PS：__express不用去care，其实就是ejs模块的一个公共属性，表示要渲染的文件扩展名。

 

4、 文件上传multer 

const multer = require('multer');

var storage = multer.diskStorage({
  destination: function (req, file, cb){
      cb(null, './public/images')
  },
  filename: function (req, file, cb){
      cb(null, file.originalname)
  }
});
var upload = multer({ storage: storage })
  app.post('/upload', upload.array('field1', 5), function(req, res) {
    req.flash('success', '文件上传成功!');
    res.redirect('/upload');
  });
 

5、Markdown的使用

　　post页面，写博客有时引用上传的图片

　　Markdown图片使用：

　　　　　　![Alt text](/path/to/img.jpg "Optional title")   ===> 例如： ![](/images/1.jpge)

 6、文章的编辑与修改

　　conn.query时，SQL语句是拼接的，会报错：  Error: ER_BAD_FIELD_ERROR: Unknown column 'xxx' in 'where clause'

　　解决办法：

　　（1）每个string字段需要加""

　　　　

 　　（2）SQL语句格式如下，不需要每个字段都加""

　　connection.query('UPDATE users SET foo = ?, bar = ?, baz = ? WHERE id = ?', ['a', 'b', 'c', userId], function (error, results, fields) {
  　　if (error) throw error;
  　　// ...
　　});
　
 
  7、留言功能实现

　conng更新Post的comments时，会报错：Error: ER_DATA_TOO_LONG: Data too long for column 'comments' at row 1

　解决办法： 

　（1）将comments字段类型varchart改为longtext      https://segmentfault.com/q/1010000009129135


8、ejs 渲染moment.js库（将时间戳日期格式化）

　　(1)项目里安装moment:npm install moment --save

　　(2)app.js加入如下代码：

　　var moment = require('moment')

　　在var app = express();后面加入 app.locals.moment = moment;
 

　　

　　（3）页面渲染调用格式为：<%= moment(new Date(parseInt("要解析的值"))).format('YYYY-MM-DD HH:MM:SS') %>

　　

9、博客详情页面手动刷新，文章阅读量一直加，使用session记录

　　

10、文章标题搜索--模糊查询（POSITION）

 　　SELECT * FROM t_blog_post WHERE POSITION("' + keyWord + '" IN title)

11、使用KindEditor

　　（1）http://www.kindsoft.net/ 下载最新的 KindEditor 压缩包，解压后将文件夹重命名为 kindEditor 并放到 public 文件夹下。

　　（2）修改header.ejs

　　　　

　　(3)i定义图片上传接口

　　　　https://blog.csdn.net/dexing07/article/details/53870580

　　　　https://blog.csdn.net/charlene0824/article/details/51234394

12、项目启动
　　
   （1）网上教程本地安装mysql
  
　　（2）setting.js配置mysql数据库连接
  
　　（3）建表sql为t_blog_post.sql、t_blog_user.sql
  
　　（4）npm install 安装项目依赖
  
　　（5）npm run start 启动项目---localhost:3001,端口号可在package.json配置
